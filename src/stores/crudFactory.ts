import { rawApi } from '@/services/api';
import { useGlobalSnackbarStore } from '@/stores/globalSnackbarStore';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

interface CrudStoreConfig<T> {
  id: string;
  baseEndpoint: string;
  transformFetchListResponse?: (rawData: any) => { data: T[]; total: number };
  transformFetchItemResponse?: (rawData: any) => T;
  createSuffix?: string;
  updateSuffix?: string;
  deleteSuffix?: string;
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
    createSuffix = '/add',
    updateSuffix = '/update',
    deleteSuffix = '/delete',
  } = config;

  return defineStore(id, () => {
    const snackbarStore = useGlobalSnackbarStore();

    async function showSuccess(message: string) {
      snackbarStore.showSnackbar(message, 'success', { position: 'bottom end' });
    }

    async function showError(message: string) {
      snackbarStore.showSnackbar(message, 'error', { position: 'bottom end' });
    }

    const items = ref<T[]>([]);
    const total = ref<number>(0);
    const loading = ref(false);
    const error = ref<any>(null);

    const page = ref(1);
    const itemsPerPage = ref(10);
    const filters = ref<Record<string, any>>({});

    // GETTERS
    const list = computed(() => {
      return items.value;
    });
    const isLoading = computed(() => loading.value);

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
        showError('Failed to fetch items');
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
        showError('Failed to fetch item');
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function createItem(payload: Partial<T>, endpointSuffix: string = createSuffix) {
      loading.value = true;
      error.value = null;
      try {
        await rawApi(`${baseEndpoint}${endpointSuffix}`, { method: 'POST', body: payload });
        await fetchList();
        showSuccess('Item created successfully');
      } catch (err) {
        error.value = err;
        showError('Failed to create item');
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function updateItem(id: string | number, payload: Partial<T>, endpointSuffix: string = updateSuffix) {
      loading.value = true;
      error.value = null;
      try {
        await rawApi(`${baseEndpoint}/${id}${endpointSuffix}`, { method: 'PUT', body: payload });
        await fetchList();
        showSuccess('Item updated successfully');
      } catch (err) {
        error.value = err;
        showError('Failed to update item');
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function deleteItem(id: string | number, endpointSuffix: string = deleteSuffix) {
      loading.value = true;
      error.value = null;
      try {
      await rawApi(`${baseEndpoint}/${id}`, { method: 'DELETE' });
      await fetchList();
      showSuccess('Item deleted successfully');
      } catch (err) {
      error.value = err;
      console.log(err);
      const errorMessage = err.errors ? err.errors.join(', ') : 'Failed to delete item';
      showError(errorMessage);
      throw err;
      } finally {
      loading.value = false;
      }
    }

    return {
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
