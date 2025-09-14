/**
 * Concession Store - Presentation Layer
 *
 * Pinia store for concession state management
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { ConcessionEntity } from '../../domain/entities/ConcessionEntity'
import type { ConcessionCreateDto, ConcessionFilterDto, ConcessionRenewalDto, ConcessionUpdateDto } from '../../application/dtos/ConcessionDtos'
import { ConcessionApiService } from '../../infrastructure/api/services/ConcessionApiService'

// Simplified implementation - using API service directly for now
const concessionApiService = new ConcessionApiService()

export const useConcessionStore = defineStore('transport-concession', () => {
  // State
  const items = ref<ConcessionEntity[]>([])
  const currentItem = ref<ConcessionEntity | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Pagination
  const page = ref(1)
  const itemsPerPage = ref(20)
  const total = ref(0)
  const totalPages = ref(0)

  // Filters
  const filters = ref<ConcessionFilterDto>({})

  // Selection
  const selectedItems = ref<ConcessionEntity[]>([])

  // Stats
  const stats = ref({
    total_concessions: 0,
    active_concessions: 0,
    expired_concessions: 0,
    suspended_concessions: 0,
    concessions_by_type: {},
    total_fee_amount: 0,
    paid_fees: 0,
    unpaid_fees: 0,
    expiring_soon: 0,
  })

  // Valid values
  const validValues = ref({
    authorized_services: {},
    restrictions: {},
    statuses: {},
    modalities: {},
  })

  // Computed
  const currentPage = computed(() => page.value)
  const perPage = computed(() => itemsPerPage.value)
  const hasItems = computed(() => items.value.length > 0)

  // Actions
  const fetchList = async () => {
    loading.value = true
    error.value = null

    try {
      const filterParams: ConcessionFilterDto = {
        ...filters.value,
        page: page.value,
        per_page: itemsPerPage.value,
      }

      const response = await concessionApiService.getList(filterParams)

      items.value = response.data.map(dto => ({
        id: dto.id,
        concessionNumber: dto.number,
        concessionType: dto.modality_label,
        routeDescription: dto.route_or_site,
        serviceArea: dto.municipality,
        status: dto.status,
        statusLabel: dto.status_label,
        issueDate: dto.valid_from,
        expiryDate: dto.valid_to,
        holderId: dto.concession_holder_id,
        holderName: dto.holder?.full_name,
        municipality: dto.municipality,
        modalityLabel: dto.modality_label,
        validFrom: dto.valid_from,
        validTo: dto.valid_to,
        isActive: dto.is_active,
        isExpired: dto.is_expired,
        daysUntilExpiration: dto.days_until_expiration,
        createdAt: dto.created_at,
        updatedAt: dto.updated_at,
      }))

      total.value = response.meta?.total || 0
      totalPages.value = Math.ceil(total.value / itemsPerPage.value)
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch concessions'
      items.value = []
    }
    finally {
      loading.value = false
    }
  }

  const fetchById = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      const response = await concessionApiService.getById(id)
      const dto = response.data

      currentItem.value = {
        id: dto.id,
        companyId: dto.company_id,
        concessionHolderId: dto.concession_holder_id,
        concessionNumber: dto.number,
        status: dto.status,
        statusLabel: dto.status_label,
        modality: dto.modality,
        modalityLabel: dto.modality_label,
        municipality: dto.municipality,
        validFrom: dto.valid_from,
        validTo: dto.valid_to,
        routeOrSite: dto.route_or_site,
        authorizedServices: dto.authorized_services || [],
        restrictions: dto.restrictions || [],
        metadata: dto.metadata || {},
        isActive: dto.is_active,
        isExpired: dto.is_expired,
        daysUntilExpiration: dto.days_until_expiration,
        expirationStatus: dto.expiration_status,
        holder: dto.holder ? {
          id: dto.holder.id,
          fullName: dto.holder.full_name,
          holderType: dto.holder.holder_type,
          holderTypeLabel: dto.holder.holder_type_label,
          email: dto.holder.email,
          phone: dto.holder.phone,
        } : null,
        createdAt: dto.created_at,
        updatedAt: dto.updated_at,
      }
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch concession'
      currentItem.value = null
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const createItem = async (data: ConcessionCreateDto) => {
    loading.value = true
    error.value = null

    try {
      console.log('Store: creating concession with data:', data)
      const response = await concessionApiService.create(data)
      console.log('Store: API response:', response)

      // Refresh the list after creation
      await fetchList()

      return response.data
    }
    catch (err: any) {
      console.error('Store: Create concession error:', err)
      const errorMessage = err?.response?.data?.message
        || err?.message
        || 'Failed to create concession'
      error.value = errorMessage
      throw new Error(errorMessage)
    }
    finally {
      loading.value = false
    }
  }

  const updateItem = async (id: string, data: ConcessionUpdateDto) => {
    loading.value = true
    error.value = null

    try {
      const response = await concessionApiService.update(id, data)

      await fetchList()

      // Update current item if it's the one being updated
      if (currentItem.value?.id === id)
        await fetchById(id)

      return response.data
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update concession'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const deleteItem = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      await concessionApiService.delete(id)

      // Remove from local state immediately for better UX
      items.value = items.value.filter(item => item.id !== id)
      total.value = Math.max(0, total.value - 1)

      // Clear current item if it's the one being deleted
      if (currentItem.value?.id === id)
        currentItem.value = null
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete concession'

      // Refresh list on error to ensure consistency
      await fetchList()
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const renewConcession = async (renewalData: ConcessionRenewalDto) => {
    loading.value = true
    error.value = null

    try {
      const response = await concessionApiService.renewConcession(renewalData)

      await fetchList()

      // Update current item if it's the one being renewed
      if (currentItem.value?.id === renewalData.concession_id)
        await fetchById(renewalData.concession_id)

      return response.data
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to renew concession'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const setPage = (newPage: number) => {
    page.value = newPage
  }

  const setFilters = (newFilters: ConcessionFilterDto) => {
    filters.value = { ...newFilters }
    page.value = 1
  }

  const clearError = () => {
    error.value = null
  }

  const clearFilters = () => {
    filters.value = {}
    page.value = 1
  }

  const fetchStats = async () => {
    try {
      const response = await concessionApiService.getConcessionStats()

      stats.value = response.data
    }
    catch (err) {
      console.error('Failed to fetch concession stats:', err)
    }
  }

  const exportItems = async (format: string = 'xlsx') => {
    try {
      loading.value = true

      const filterParams: ConcessionFilterDto = {
        ...filters.value,
        page: undefined,
        per_page: undefined,
      }

      const response = await concessionApiService.exportConcessions(filterParams)

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.download = `concessions.${format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to export concessions'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const fetchValidValues = async () => {
    try {
      const response = await concessionApiService.getValidValues()

      validValues.value = response.data
    }
    catch (err) {
      console.error('Failed to fetch valid values:', err)
    }
  }

  return {
    // State
    items,
    currentItem,
    loading,
    error,
    stats,
    validValues,

    // Pagination
    page,
    itemsPerPage,
    total,
    totalPages,
    currentPage,
    perPage,

    // Filters
    filters,

    // Selection
    selectedItems,

    // Computed
    hasItems,

    // Actions
    fetchList,
    fetchById,
    createItem,
    updateItem,
    deleteItem,
    renewConcession,
    setPage,
    setFilters,
    clearError,
    clearFilters,
    fetchStats,
    exportItems,
    fetchValidValues,
  }
})
