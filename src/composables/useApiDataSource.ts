import { useApi } from '@/composables/useApi';
import { computed, ComputedRef, onMounted, ref, watch } from 'vue';

interface ApiDataSourceProps {
  apiPath: string;
  queryParams?: Record<string, any>;
  loadOnMount?: boolean;
  firstRecord?: boolean;
}

type ApiResponse = Array<Record<string, any>> | Record<string, any>;

export function useApiDataSource(
  props: ApiDataSourceProps,
  emit: (event: 'loaded', response: ApiResponse) => void
) {
  const { apiPath, queryParams = {}, loadOnMount = true, firstRecord = false } = props;

  const response = ref<ApiResponse>(firstRecord ? {} : []); // Tipado dinámico dependiendo de firstRecord
  const loading = ref<boolean>(false);

  // Computed para construir la URL completa
  const apiUrl: ComputedRef<string> = computed(() => {
    if (!apiPath) return '';
    const queryString = new URLSearchParams(queryParams).toString();
    return queryString ? `${apiPath}?${queryString}` : apiPath;
  });

  // Función para cargar los datos desde la API
  const load = async (): Promise<void> => {
    if (!apiUrl.value) return;
    loading.value = true;
    try {
      const { data } = await useApi(apiUrl.value).json();
      response.value = firstRecord && Array.isArray(data) && data.length ? data[0] : data;
      emit('loaded', response.value); // Emitir los datos cargados
    } catch (error) {
      console.error('[useApiDataSource] Error:', error);
      response.value = firstRecord ? {} : [];
    } finally {
      loading.value = false;
    }
  };

  // Cargar automáticamente si `loadOnMount` es true
  onMounted(() => {
    if (loadOnMount) load();
  });

  // Reactividad en la URL
  watch(apiUrl, () => {
    if (apiUrl.value) load();
  });

  return { response, loading, load };
}
