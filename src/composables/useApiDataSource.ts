// useApiDataSource.ts
import { useApi } from '@/composables/useApi';
import { computed, ComputedRef, onMounted, ref, watch } from 'vue';

// Interfaces base para diferentes tipos de respuestas
interface KeyValueOption {
  id: number | string;
  name: string;
  [key: string]: any;
}

interface ApiDataSourceProps<T = any> {
  apiPath: string;
  queryParams?: Record<string, any>;
  loadOnMount?: boolean;
  firstRecord?: boolean;
  formatResponse?: (data: any) => T[];
}

export function useApiDataSource<T = any>(
  props: ApiDataSourceProps<T>,
  emit: (event: 'loaded', response: T[]) => void
) {
  const {
    apiPath,
    queryParams = {},
    loadOnMount = true,
    firstRecord = false,
    formatResponse = (data: any) => data
  } = props;

  const rawResponse = ref<any[]>([]);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  // Response computado con formato
  const response = computed(() => {
    if (!rawResponse.value) return [];
    
    const formattedData = formatResponse(rawResponse.value);
    return firstRecord && Array.isArray(formattedData) && formattedData.length > 0
      ? [formattedData[0]]
      : formattedData;
  });

  // URL de la API
  const apiUrl: ComputedRef<string> = computed(() => {
    if (!apiPath) return '';
    const queryString = new URLSearchParams(queryParams).toString();
    return queryString ? `${apiPath}?${queryString}` : apiPath;
  });

  const load = async (): Promise<void> => {
    if (!apiUrl.value) return;
    
    loading.value = true;
    error.value = null;

    try {
      const { data } = await useApi(apiUrl.value).json();
      rawResponse.value = Array.isArray(data.value) ? data.value : [data.value];
      emit('loaded', response.value);
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Unknown error');
      console.error('[useApiDataSource] Error:', error.value);
      rawResponse.value = [];
    } finally {
      loading.value = false;
    }
  };

  // Watch para URL
  watch(
    () => apiUrl.value,
    (newUrl, oldUrl) => {
      if (newUrl && newUrl !== oldUrl) {
        load();
      }
    },
    { immediate: false }
  );

  onMounted(() => {
    if (loadOnMount) load();
  });

  return {
    response,
    rawResponse,
    loading,
    error,
    load,
    // Computed helpers para selects
    isLoading: computed(() => loading.value),
    hasError: computed(() => error.value !== null),
    isEmpty: computed(() => response.value.length === 0)
  };
}
