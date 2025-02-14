/**
 * offlineQueueService.ts
 * Manejador de la cola de operaciones offline.
 */
import { getStoreById } from '@/helpers/storeHelper';
import { db } from './indexedDbService';

/**
 * Estructura de una operación offline.
 */
export interface OfflineOperation {
  id?: number;                // clave autoincremental en la tabla offlineQueue
  storeId: string;            // Para saber a qué store (CRUD) pertenece la operación
  type: 'create' | 'update' | 'delete' | 'batch-delete' | 'batch-update' | string; 
  itemId?: string | number;   // ID del item afectado (si aplica)
  ids?: (string | number)[];  // Para batch
  payload?: any;              // Datos a enviar al servidor
  endpoint: string;           // Endpoint al que se llamará
  createdAt: number;          // timestamp para saber cuándo se encoló
}

/**
 * Encola la operación offline en IndexedDB.
 */
export async function enqueueOfflineOperation(operation: Omit<OfflineOperation, 'createdAt'>) {
  const toSave = {
    ...operation,
    createdAt: Date.now(),
  };
  // Insertamos en la tabla 'offlineQueue'
  await db.offlineQueue.add(toSave);
}

/**
 * Vacía la cola de un store en particular, reintentando cada operación.
 */
export async function flushOfflineQueue(storeId?: string): Promise<void> {
  let operations;
  // Obtenemos todas las operaciones encoladas para este store
  if (storeId) {
    // Si se proporciona storeId, filtramos las operaciones por este ID
    operations = await db.offlineQueue
      .where('storeId')
      .equals(storeId)
      .sortBy('createdAt');
  } else {
    // Si no se proporciona storeId, obtenemos todas las operaciones
    operations = await db.offlineQueue
      .orderBy('createdAt')
      .toArray();
  }

  for (const op of operations) {
    try {
      // Carga dinámica de tu api (o import normal si prefieres)
      const { rawApi } = await import('./api');

      // Determina el método y la data en base a "type"
      let method = 'POST';
      let url = op.endpoint;
      let body = op.payload;

      if (op.type === 'update') {
        method = 'PUT';
      } else if (op.type === 'delete') {
        method = 'DELETE';
        body = undefined; // Normalmente no envías cuerpo en un DELETE
      } else if (op.type === 'batch-delete') {
        // En batch-delete, asumes un POST con { ids } etc.
        method = 'POST';
      }

      // Llamada a la API
      const response = await rawApi(url, {
        method,
        body,
      });

      
      // Si la operación era una creación y tiene un ID temporal, reemplázalo
      if (op.type === 'create' && op.payload?.id) {
        const dbTable = db.table(op.storeId);
        // 1. Elimina el registro temporal
        await dbTable.delete(op.payload.id);

        // 2. Inserta el nuevo registro con el ID real del servidor
        await dbTable.add(response);

        // 3. Actualiza el store para reflejar los cambios en tiempo real
        const store = getStoreById(op.storeId); // Reemplaza con tu método para obtener el store
        const index = store.items.findIndex((item) => item.id === op.payload.id);

        if (index !== -1) {
          // Reemplaza el registro temporal con el actualizado
          store.items[index] = response;
        } else {
          // Si no estaba en el store (caso raro), simplemente lo agregas
          store.items.push(response);
        }
      }
      // Si llegó aquí, se completó con éxito => eliminamos la operación de la cola
      console.log('Operación offline completada:', op);
      await db.offlineQueue.delete(op.id!);
    } catch (err) {
      console.error('Error reintentando operación offline:', err);
      // Aquí decides la estrategia:
      // 1. Dejar la operación en la cola para reintentar después (break).
      // 2. Eliminarla de la cola si el error es irrecuperable.
      // 3. Notificar al usuario.
      break;
    }
  }
}
