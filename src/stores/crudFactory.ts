import { useNotification } from '@/helpers/notificationHelper';
import { rawApi } from '@/services/api';
import { db } from '@/services/indexedDbService';
import { echo } from '@/services/websocketService';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

// Importa las funciones de la cola offline
import {
  enqueueOfflineOperation,
  flushOfflineQueue,
} from '@/services/offlineQueueService';

/**
 * Interfaz de configuración para crear un CRUD Store con Pinia.
 */
interface CrudStoreConfig<T> {
  /**
   * Nombre único del store (se usa como nombre de la tabla en IndexedDB y para websockets).
   */
  id: string;

  /**
   * Endpoint base para todas las operaciones de la API.
   * Ejemplo: '/users' o '/products'.
   */
  baseEndpoint: string;

  /**
   * Función opcional para transformar la respuesta de la API al obtener varios registros.
   */
  transformFetchListResponse?: (rawData: any) => { data: T[]; total: number };

  /**
   * Función opcional para transformar la respuesta de la API al obtener un registro único.
   */
  transformFetchItemResponse?: (rawData: any) => T;

  /**
   * Sufijo (ruta) para la creación de registros.
   * Ejem: '/add' => /users/add
   */
  createSuffix?: string;

  /**
   * Sufijo (ruta) para la actualización de registros.
   * Ejem: '/update' => /users/update/:id
   */
  updateSuffix?: string;

  /**
   * Sufijo (ruta) para el borrado de registros.
   * Ejem: '/delete' => /users/delete/:id
   */
  deleteSuffix?: string;

  /**
   * Sufijo (ruta) para visualizar un registro único.
   * Ejem: '/view' => /users/view/:id
   */
  viewSuffix?: string;
}
export const stores: Record<string, () => ReturnType<typeof createCrudStore<any>>> = {};
/**
 * Factoría para crear un store CRUD basado en Pinia + IndexedDB + notificaciones + websockets.
 */
export function createCrudStore<T>(config: CrudStoreConfig<T>) {
  const {
    id,
    baseEndpoint,
    transformFetchListResponse = (rawData) => ({
      data: rawData.data || [],
      total: rawData.total || 0,
    }),
    transformFetchItemResponse = (rawData) => rawData.data ?? rawData,
    createSuffix = '/add',
    updateSuffix = '/update',
    deleteSuffix = '/delete',
    viewSuffix = '/view',
  } = config;

  const storeFactory = defineStore(id, () => {
    // ==========
    // State
    // ==========
    const items = ref<T[]>([]);
    const total = ref<number>(0);
    const selectedItems = ref<T[]>([]);
    const loading = ref(false);
    const error = ref<any>(null);

    // Paginación y filtros
    const page = ref(1);
    const itemsPerPage = ref(10);
    const filters = ref<Record<string, any>>({});

    // ==========
    // Getters
    // ==========
    const list = computed(() => items.value);
    const isLoading = computed(() => loading.value);

    // ==========
    // Métodos auxiliares
    // ==========
    async function handleApiError(err: any, defaultKey: string) {
      const { showError } = useNotification();

      if (err instanceof Error && (err as any).status === 422 && (err as any).errors) {
        const validationErrors = Object.values((err as any).errors).flat().join('\n');
        console.error('Errores de validación:', validationErrors);
        showError(validationErrors, 'crud.validationError');
      } else if (err.message === 'Failed to fetch' || !navigator.onLine) {
        // Offline o error de red
        showError('Error de red. Trabajando en modo offline.', 'crud.networkError', {
          message: 'Error de red. Trabajando en modo offline.',
        });
      } else {
        // Muestra el error por defecto
        showError(defaultKey, '', { message: err.message || 'Ocurrió un error inesperado.' });
      }

      error.value = err;
      throw err;
    }

    /**
     * Mezcla (merge) la data recibida de la API con la DB local:
     * - Borra solo los registros que no vienen en la data nueva.
     * - Inserta/actualiza los que sí vienen, usando chunking para grandes volúmenes.
     */
    async function mergeDataWithIndexedDB(data: T[]) {
      const dbTable = db.table<T>(id);
    
      // 1. Obtenemos todos los registros locales
      const existingItems = await dbTable.toArray();
      const existingMap = new Map(existingItems.map((item: any) => [item.id, item])); // Mapeamos por ID
    
      // 2. Iteramos los datos de la API y decidimos si actualizar o no
      const toUpdate: T[] = [];
      const toInsert: T[] = [];
    
      for (const incomingItem of data) {
        const existingItem = existingMap.get(incomingItem.id);
    
        if (existingItem) {
          // Comparamos `updated_at` para decidir si actualizar
          if (new Date(incomingItem.updated_at) > new Date(existingItem.updated_at)) {
            toUpdate.push(incomingItem);
          }
        } else {
          // Si no existe localmente, lo agregamos a insertar
          toInsert.push(incomingItem);
        }
      }
    
      // 3. Realizamos las operaciones en IndexedDB
      if (toUpdate.length > 0) {
        await dbTable.bulkPut(toUpdate); // Actualiza los registros existentes
      }
    
      if (toInsert.length > 0) {
        await dbTable.bulkAdd(toInsert); // Inserta los nuevos registros
      }
    
      // Nota: NO eliminamos los registros locales aquí. Simplemente los actualizamos o insertamos.
    }

    // ==========
    // Actions
    // ==========
    /**
     * Obtiene la lista de items (paginada o total), la mezcla con la DB local
     * y actualiza el state de la store.
     */
    async function fetchList() {
      loading.value = true;
      error.value = null;
    
      try {
        const params = {
          page: page.value,
          itemsPerPage: itemsPerPage.value,
          ...filters.value,
        };
    
        // Si estás online, consulta al backend
        if (navigator.onLine) {
          const responseData = await rawApi(baseEndpoint, { method: 'GET', params });
          const { data, total: totalItems } = transformFetchListResponse(responseData);
    
          // Sincroniza los datos con IndexedDB sin eliminar registros no relacionados con los filtros
          await mergeDataWithIndexedDB(data);
    
          // Actualiza el estado en memoria con los datos filtrados
          items.value = data;
          total.value = totalItems;
        } else {
          // Si estás offline, filtra directamente en IndexedDB
          const dbTable = db.table<T>(id);
          let localData = await dbTable.toArray();
    
          // Aplica los filtros localmente si hay filtros activos
          if (Object.keys(filters.value).length > 0) {
            localData = localData.filter((item) =>
              Object.entries(filters.value).every(([key, value]) =>
                String(item[key] || '').includes(String(value))
              )
            );
          }
    
          items.value = localData;
          total.value = localData.length;
    
          // Indicar que estamos en modo offline
          const { showError } = useNotification();
          showError('crud.offlineMode', '', {
            message: 'Trabajando en modo offline. Los datos podrían no estar actualizados.',
          });
        }
      } catch (err) {
        console.error('Error al obtener datos:', err);
        items.value = [];
        total.value = 0;
      } finally {
        loading.value = false;
      }
    }

    /**
     * Obtiene un ítem individual por su ID.
     */
    async function fetchItem(itemId: string | number, endpointSuffix: string = viewSuffix) {
      loading.value = true;
      error.value = null;
      try {
        const responseData = await rawApi(`${baseEndpoint}${endpointSuffix}/${itemId}`, {
          method: 'GET',
        });
        return transformFetchItemResponse(responseData);
      } catch (err) {
        await handleApiError(err, 'crud.fetchItemFailed');
      } finally {
        loading.value = false;
      }
    }

    /**
     * Crea un nuevo ítem en el backend y lo sincroniza con IndexedDB.
     * Si estás offline, encola la operación en offlineQueue.
     */
    async function createItem(payload: Partial<T>, endpointSuffix: string = createSuffix) {
      loading.value = true;
      error.value = null;
      const { showSuccess, showError } = useNotification();

      try {
        if (!navigator.onLine) {
          // 1. Generar un ID temporal
          //generar un uuid que sera con el que se guardara en la db 
          
          const localId = crypto.randomUUID();

          // 2. Guardar en IndexedDB (optimista)
          const dbTable = db.table<T>(id);
          (payload as Record<string, any>)['id'] = localId;
          const offlineItem = { ...payload, id: localId } as T;
          await dbTable.add(offlineItem);

          // 3. Actualizar en memoria
          items.value = [offlineItem, ...items.value];
          total.value += 1;

          // 4. Encolar la operación offline
          await enqueueOfflineOperation({
            storeId: id,
            type: 'create',
            endpoint: `${baseEndpoint}${endpointSuffix}`,
            payload,
          });

          showError('crud.offlineMode', '', {
            message: 'Estás offline. La creación se guardó localmente y se encoló para sincronizar luego.',
          });
          return offlineItem;
        }

        // Conexión online => POST al backend
        const createdItem = await rawApi(`${baseEndpoint}${endpointSuffix}`, {
          method: 'POST',
          body: payload,
        });

        // Guardar en IndexedDB
        const dbTable = db.table<T>(id);
        await dbTable.add(createdItem);

        // Actualizar estado en memoria
        items.value = [createdItem, ...items.value];
        total.value += 1;

        showSuccess('crud.itemCreated');
        return createdItem;
      } catch (err) {
        await handleApiError(err, 'crud.itemCreateFailed');
      } finally {
        loading.value = false;
      }
    }

    /**
     * Actualiza un ítem en el backend y en IndexedDB.
     * Si offline, encola la operación y actualiza localmente (optimista).
     */
    async function updateItem(itemId: string | number, payload: Partial<T>, endpointSuffix: string = updateSuffix) {
      loading.value = true;
      error.value = null;
      const { showSuccess, showError } = useNotification();

      try {
        if (!navigator.onLine) {
          // 1. Búsqueda en DB local y actualización optimista
          const dbTable = db.table<T>(id);
          const existingItem = await dbTable.get(itemId);
          if (existingItem) {
            const offlineItem = { ...existingItem, ...payload };
            await dbTable.put(offlineItem);
            items.value = items.value.map((it) => (it['id'] === itemId ? offlineItem : it));
          }

          // 2. Encolar operación
          await enqueueOfflineOperation({
            storeId: id,
            type: 'update',
            itemId,
            endpoint: `${baseEndpoint}${endpointSuffix}/${itemId}`,
            payload,
          });

          showError('crud.offlineMode', '', {
            message: 'Estás offline. La actualización se guardó localmente y se encoló para sincronizar luego.',
          });
          return;
        }

        // Conexión online => PUT
        const updatedItem = await rawApi(`${baseEndpoint}${endpointSuffix}/${itemId}`, {
          method: 'PUT',
          body: payload,
        });

        // Guardar en IndexedDB
        const dbTable = db.table<T>(id);
        await dbTable.put(updatedItem);

        // Actualizar estado en memoria
        items.value = items.value.map((item) => (item['id'] === itemId ? updatedItem : item));

        showSuccess('crud.itemUpdated');
        return updatedItem;
      } catch (err) {
        console.error('Error al actualizar el ítem:', err);
        await handleApiError(err, 'crud.itemUpdateFailed');
      } finally {
        loading.value = false;
      }
    }

    /**
     * Borra un ítem en el backend y en IndexedDB.
     * Si offline, borrado optimista + encolar operación.
     */
    async function deleteItem(itemId: string | number, endpointSuffix: string = deleteSuffix) {
      loading.value = true;
      error.value = null;
      const { showSuccess, showError } = useNotification();

      try {
        if (!navigator.onLine) {
          // 1. Borrado local optimista
          const dbTable = db.table<T>(id);
          await dbTable.delete(itemId);
          items.value = items.value.filter((item) => item['id'] !== itemId);
          total.value -= 1;
          clearSelection();

          // 2. Encolar operación
          await enqueueOfflineOperation({
            storeId: id,
            type: 'delete',
            itemId,
            endpoint: `${baseEndpoint}${endpointSuffix}/${itemId}`,
          });

          showError('crud.offlineMode', '', {
            message: 'Estás offline. El borrado se registró localmente y se encoló para sincronizar luego.',
          });
          return;
        }

        // Conexión online => DELETE
        await rawApi(`${baseEndpoint}${endpointSuffix}/${itemId}`, {
          method: 'DELETE',
        });

        const dbTable = db.table<T>(id);
        await dbTable.delete(itemId);

        items.value = items.value.filter((item) => item['id'] !== itemId);
        total.value -= 1;
        clearSelection();
        showSuccess('crud.itemDeleted');
      } catch (err) {
        await handleApiError(err, 'crud.itemDeleteFailed');
      } finally {
        loading.value = false;
      }
    }

    /**
     * Acción en lote. Por ejemplo, para borrar o actualizar en lote.
     * Si offline, podrías encolar toda la operación.
     */
    async function batchAction(
      ids: (string | number)[],
      action: 'delete' | 'update',
      payload?: Partial<T>,
    ) {
      loading.value = true;
      error.value = null;
      const { showSuccess, showError } = useNotification();

      try {
        if (!navigator.onLine) {
          // Ejemplo de manejo offline para batch
          const dbTable = db.table<T>(id);

          if (action === 'delete') {
            // Borrado local optimista
            await dbTable.bulkDelete(ids as any[]);
            items.value = items.value.filter((item) => !ids.includes(item['id']));
            total.value -= ids.length;
          }
          clearSelection();

          // Encolar la operación
          await enqueueOfflineOperation({
            storeId: id,
            type: action === 'delete' ? 'batch-delete' : 'batch-update',
            ids,
            payload,
            endpoint: `${baseEndpoint}${action === 'delete' ? deleteSuffix : updateSuffix}`,
          });

          showError('crud.offlineMode', '', {
            message: 'Estás offline. La operación en lote se encoló para sincronizar luego.',
          });
          return;
        }

        // Conexión online => Endpoint batch
        const endpointSuffix = action === 'delete' ? deleteSuffix : updateSuffix;
        await rawApi(`${baseEndpoint}${endpointSuffix}`, {
          method: 'POST',
          body: { ids, payload },
        });

        if (action === 'delete') {
          items.value = items.value.filter((item) => !ids.includes(item['id']));
          total.value -= ids.length;
        }

        showSuccess('crud.batchActionSuccess', '', { action });
        clearSelection();
      } catch (err) {
        await handleApiError(err, 'crud.batchActionFailed');
      } finally {
        loading.value = false;
      }
    }

    /**
     * Manejadores de selección de ítems en tablas, grids, etc.
     */
    function toggleSelection(item: T) {
      const index = selectedItems.value.findIndex((selected) => selected === item);
      if (index === -1) {
        selectedItems.value.push(item);
      } else {
        selectedItems.value.splice(index, 1);
      }
    }

    function clearSelection() {
      selectedItems.value = [];
    }

    /**
     * Escucha eventos de WebSocket para sincronizar cambios en tiempo real.
     */
    function listenToWebSocketEvents() {
      if (!echo) {
        console.warn('WebSocket no está disponible. No se pueden escuchar eventos.');
        return;
      }

      echo
        .channel(id)
        .listen('.item-created', async (newItem: T) => {
          // Evitar duplicados
          const dbTable = db.table<T>(id);
          const existing = await dbTable.get((newItem as any).id);
          if (!existing) {
            await dbTable.add(newItem);
            items.value = [newItem, ...items.value];
            total.value += 1;
          }
        })
        .listen('.item-updated', async (updatedItem: T) => {
          const dbTable = db.table<T>(id);
          await dbTable.put(updatedItem);
          items.value = items.value.map((item) =>
            item['id'] === (updatedItem as any).id ? updatedItem : item
          );
        })
        .listen('.item-deleted', async (deletedItemId: string | number) => {
          const dbTable = db.table<T>(id);
          await dbTable.delete(deletedItemId);
          items.value = items.value.filter((item) => item['id'] !== deletedItemId);
          total.value -= 1;
        });
    }

    /**
     * Opción para reintentar la cola cuando se recupere la conexión
     * o cuando el usuario lo solicite.
     */
    async function handleOnlineSync() {
      // Intenta vaciar la cola de este store
      await flushOfflineQueue(id);

      // Opcional: Llamar a fetchList() para refrescar datos desde el servidor
      await fetchList();
    }

    // ==========
    // Return
    // ==========
    return {
      // state
      items,
      total,
      loading,
      error,
      page,
      itemsPerPage,
      filters,
      selectedItems,

      // getters
      list,
      isLoading,

      // actions
      fetchList,
      fetchItem,
      createItem,
      updateItem,
      deleteItem,
      batchAction,
      toggleSelection,
      clearSelection,
      listenToWebSocketEvents,
      handleOnlineSync,
    };
  });
  // Registra el store dinámicamente en el objeto `stores`
  stores[id] = storeFactory;

  return storeFactory;
}
