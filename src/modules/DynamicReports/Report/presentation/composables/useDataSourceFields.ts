import { ref, watch } from 'vue'
import { DataSourceApiService } from '@/modules/DynamicReports/DataSource/infrastructure/api/services/DataSourceApiService'

export function useDataSourceFields(dataSourceId) {
  const fields = ref([])
  const relations = ref([])
  const loading = ref(false)
  const error = ref(null)

  const apiService = new DataSourceApiService()

  const fetchFields = async (id = dataSourceId.value) => {
    if (!id)
      return
    loading.value = true
    error.value = null
    try {
      const response = await apiService.getFields(id)

      fields.value = response.data.fields || []
      relations.value = response.data.relations || []
    }
    catch (e) {
      error.value = e.message || 'Error fetching fields'
      fields.value = []
      relations.value = []
    }
    finally {
      loading.value = false
    }
  }

  watch(dataSourceId, fetchFields, { immediate: true })

  return {
    fields,
    relations,
    loading,
    error,
    fetchFields,
  }
}
