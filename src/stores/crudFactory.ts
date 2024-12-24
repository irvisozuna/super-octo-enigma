// src/stores/crudFactory.ts
import { rawApi } from '@/services/api';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

interface CrudStoreConfig<T> {
  id: string;
  baseEndpoint: string;
  transformFetchListResponse?: (rawData: any) => { data: T[]; total: number };
  transformFetchItemResponse?: (rawData: any) => T;
}

export function createCrudStore<T>(config: CrudStoreConfig<T>) {
  const {
    id,
    baseEndpoint,
    transformFetchListResponse = (rawData) => ({
      data: rawData.data || [],
      total: rawData.total || 0,
    }),
    transformFetchItemResponse = (rawData) => rawData.data ?? rawData,
  } = config;

  return defineStore(id, () => {
    // STATE
    const items = ref<T[]>([]);
    const total = ref<number>(0);
    const loading = ref(false);
    const error = ref<any>(null);

    const page = ref(1);
    const itemsPerPage = ref(10);
    const filters = ref<Record<string, any>>({});

    // GETTERS
    const list = computed(() => items.value);
    const isLoading = computed(() => loading.value);

    // ACTIONS
    async function fetchList() {
      loading.value = true;
      error.value = null;
      try {
        const params = {
          ...filters.value,
          page: page.value,
          itemsPerPage: itemsPerPage.value,
        };
        const responseData = await rawApi(baseEndpoint, { method: 'GET', params });
        const { data, total: totalItems } = transformFetchListResponse(responseData);
        items.value = data;
        total.value = totalItems;
      } catch (err) {
        error.value = err;
      } finally {
        loading.value = false;
      }
    }

    async function fetchItem(id: string | number) {
      loading.value = true;
      error.value = null;
      try {
        const responseData = await rawApi(`${baseEndpoint}/${id}`, { method: 'GET' });
        return transformFetchItemResponse(responseData);
      } catch (err) {
        error.value = err;
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function createItem(payload: Partial<T>) {
      loading.value = true;
      error.value = null;
      try {
        await rawApi(baseEndpoint, { method: 'POST', body: payload });
        await fetchList(); // Refresca la lista tras crear
      } catch (err) {
        error.value = err;
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function updateItem(id: string | number, payload: Partial<T>) {
      loading.value = true;
      error.value = null;
      try {
        await rawApi(`${baseEndpoint}/${id}`, { method: 'PUT', body: payload });
        await fetchList(); // Refresca la lista tras actualizar
      } catch (err) {
        error.value = err;
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function deleteItem(id: string | number) {
      loading.value = true;
      error.value = null;
      try {
        await rawApi(`${baseEndpoint}/${id}`, { method: 'DELETE' });
        await fetchList(); // Refresca la lista tras eliminar
      } catch (err) {
        error.value = err;
        throw err;
      } finally {
        loading.value = false;
      }
    }

    // Devuelve todas las propiedades y acciones del store
    return {
      // State
      items,
      total,
      loading,
      error,
      page,
      itemsPerPage,
      filters,
      // Getters
      list,
      isLoading,
      // Actions
      fetchList,
      fetchItem,
      createItem,
      updateItem,
      deleteItem,
    };
  });
}
