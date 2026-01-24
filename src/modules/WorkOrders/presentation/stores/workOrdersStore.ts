import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useDataTable } from '@/composables/useDataTable'
import { WorkOrderApiService } from '../../infrastructure/api/services/WorkOrderApiService'

export const useWorkOrdersStore = defineStore('workorders', () => {
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
  } = useDataTable<any>(15)

  const currentItem = ref<any | null>(null)
  const detailLoading = ref(false)

  const apiService = new WorkOrderApiService()

  const fetchList = async (params: Record<string, any> = {}) => {
    loading.value = true
    error.value = null

    try {
      const requestParams = { ...params }
      if (requestParams.itemsPerPage && !requestParams.per_page)
        requestParams.per_page = requestParams.itemsPerPage

      const requestedPerPage = requestParams.per_page ?? requestParams.limit ?? requestParams.itemsPerPage

      if (requestParams.page && requestParams.per_page && !requestParams.limit) {
        requestParams.limit = requestParams.per_page
        requestParams.offset = (Number(requestParams.page) - 1) * Number(requestParams.per_page)
      }

      const response = await apiService.getList(requestParams)
      const paginationData = response?.pagination || response?.data?.pagination

      if (paginationData) {
        const limit = Number(paginationData.limit || paginationData.per_page || 15)
        const offset = Number(paginationData.offset || 0)
        const total = Number(paginationData.total || 0)
        const currentPage = Math.floor(offset / Math.max(limit, 1)) + 1
        const lastPage = Math.max(1, Math.ceil(total / Math.max(limit, 1)))

        updateState({
          data: response?.data?.data || response.data || response || [],
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

      const perPageNum = Number(requestedPerPage)
      if (Number.isFinite(perPageNum) && perPageNum > 0) {
        if (items.value.length > perPageNum)
          items.value = items.value.slice(0, perPageNum)

        pagination.value.per_page = perPageNum
        if (pagination.value.total) {
          pagination.value.last_page = Math.max(1, Math.ceil(pagination.value.total / Math.max(perPageNum, 1)))
        }
      }
    }
    catch (err: any) {
      error.value = err?.message || 'Error al cargar ordenes'
    }
    finally {
      loading.value = false
    }
  }

  const fetchById = async (id: string) => {
    detailLoading.value = true
    error.value = null

    try {
      const response = await apiService.getById(id)
      currentItem.value = response?.data || response
    }
    catch (err: any) {
      error.value = err?.message || 'Error al cargar la orden'
      currentItem.value = null
    }
    finally {
      detailLoading.value = false
    }
  }

  const clearCurrent = () => {
    currentItem.value = null
  }

  return {
    items,
    pagination,
    loading,
    error,
    currentItem,
    detailLoading,
    fetchList,
    fetchById,
    clearCurrent,
    setPage,
    setItemsPerPage,
    resetPagination,
    buildParams,
    apiService,
  }
})
