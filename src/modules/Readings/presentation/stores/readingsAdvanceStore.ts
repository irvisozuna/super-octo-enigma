import { defineStore } from 'pinia'
import { useDataTable } from '@/composables/useDataTable'
import { ReadingApiService } from '../../infrastructure/api/services/ReadingApiService'

export const useReadingsAdvanceStore = defineStore('readings-advance', () => {
  const {
    items,
    pagination,
    loading,
    error,
    updateState,
    setPage,
    setItemsPerPage,
    resetPagination,
    buildParams,
  } = useDataTable<any>(10)

  const apiService = new ReadingApiService()

  const fetchAdvance = async (externalPeriodId: string, params: Record<string, any> = {}) => {
    loading.value = true
    error.value = null

    try {
      const requestParams = { ...params }

      if (requestParams.page && requestParams.per_page && !requestParams.limit) {
        requestParams.limit = requestParams.per_page
        requestParams.offset = (Number(requestParams.page) - 1) * Number(requestParams.per_page)
      }

      const response = await apiService.getDownloadedRoutes(externalPeriodId, requestParams)
      const pagination = response?.pagination || response?.data?.pagination

      if (pagination) {
        const limit = Number(pagination.limit || pagination.per_page || 10)
        const offset = Number(pagination.offset || 0)
        const total = Number(pagination.total || 0)
        const currentPage = Math.floor(offset / Math.max(limit, 1)) + 1
        const lastPage = Math.max(1, Math.ceil(total / Math.max(limit, 1)))

        updateState({
          data: response?.data?.data || response.data || [],
          meta: {
            current_page: currentPage,
            last_page: lastPage,
            per_page: limit,
            total,
          },
        })
      }
      else {
        updateState(response)
      }
    }
    catch (err: any) {
      error.value = err?.message || 'Error fetching advance data'
    }
    finally {
      loading.value = false
    }
  }

  return {
    items,
    pagination,
    loading,
    error,
    fetchAdvance,
    setPage,
    setItemsPerPage,
    resetPagination,
    buildParams,
  }
})
