import { defineStore } from 'pinia'
import { useDataTable } from '@/composables/useDataTable'
import type { ReadingEntity } from '../../domain/entities/ReadingEntity'
import { ReadingApplicationService } from '../../application/services/ReadingApplicationService'
import { ReadingRepositoryImpl } from '../../infrastructure/persistence/repositories/ReadingRepositoryImpl'

export const useReadingsStore = defineStore('readings', () => {
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
  } = useDataTable<ReadingEntity>(15)

  const repository = new ReadingRepositoryImpl()
  const applicationService = new ReadingApplicationService(repository)

  const fetchReadings = async (params: Record<string, any> = {}) => {
    loading.value = true
    error.value = null

    try {
      const requestParams = { ...params }
      if (requestParams.itemsPerPage && !requestParams.per_page)
        requestParams.per_page = requestParams.itemsPerPage

      if (requestParams.page && requestParams.per_page && !requestParams.limit) {
        requestParams.limit = requestParams.per_page
        requestParams.offset = (Number(requestParams.page) - 1) * Number(requestParams.per_page)
      }

      const response = await applicationService.getReadings(requestParams)
      const pagination = response?.pagination || response?.data?.pagination

      if (pagination) {
        const limit = Number(pagination.limit || pagination.per_page || 15)
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
      error.value = err?.message || 'Error fetching readings'
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
    fetchReadings,
    setPage,
    setItemsPerPage,
    resetPagination,
    buildParams,
    applicationService,
  }
})
