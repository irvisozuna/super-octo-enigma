/**
 * ConcessionHolder Store - Presentation Layer
 *
 * Pinia store for concessionholder state management
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { ConcessionHolderEntity } from '../../domain/entities/ConcessionHolderEntity'
import type { ConcessionHolderCreateDto, ConcessionHolderFilterDto, ConcessionHolderUpdateDto } from '../../application/dtos/ConcessionHolderDtos'
import { ConcessionHolderApiService } from '../../infrastructure/api/services/ConcessionHolderApiService'

// Using API service directly
const concessionHolderApiService = new ConcessionHolderApiService()

export const useConcessionHolderStore = defineStore('transport-concessionholder', () => {
  // State
  const items = ref<ConcessionHolderEntity[]>([])
  const currentItem = ref<ConcessionHolderEntity | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Pagination
  const page = ref(1)
  const itemsPerPage = ref(20)
  const total = ref(0)
  const totalPages = ref(0)

  // Filters
  const filters = ref<ConcessionHolderFilterDto>({})

  // Selection
  const selectedItems = ref<ConcessionHolderEntity[]>([])

  // Stats
  const stats = ref({
    total_holders: 0,
    active_holders: 0,
    inactive_holders: 0,
    suspended_holders: 0,
    holders_by_type: {},
    holders_by_city: {},
    average_concessions_per_holder: 0,
    new_registrations_this_month: 0,
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
      const filterParams: ConcessionHolderFilterDto = {
        ...filters.value,
        page: page.value,
        per_page: itemsPerPage.value,
      }

      const response = await concessionHolderApiService.getList(filterParams)

      items.value = response.data.map(dto => ({
        id: dto.id,
        holderType: dto.holder_type,
        fullName: dto.full_name,
        phone: dto.phone,
        email: dto.email,

        // address: dto.address,
        // city: dto.city,
        status: dto.verification_status,
        registrationDate: dto.created_at,
        lastActivityDate: dto.updated_at,
        activeConcessions: dto.active_concessions_count,
        totalConcessions: dto.current_concessions_count,
        createdAt: dto.created_at,
        updatedAt: dto.updated_at,
        verificationStatusLabel: dto.verification_status_label,
        holderTypeLabel: dto.holder_type_label,
      }))

      total.value = response.meta?.total || 0
      totalPages.value = Math.ceil(total.value / itemsPerPage.value)
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch concessionholders'
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
      const response = await concessionHolderApiService.getById(id)
      const dto = response.data

      currentItem.value = {
        id: dto.id,
        local_id: dto.local_id,
        holderNumber: dto.holder_number,
        holderType: dto.holder_type,
        firstName: dto.first_name,
        lastName: dto.last_name,
        fullName: dto.full_name,
        companyName: dto.company_name,
        cooperativeName: dto.cooperative_name,
        businessRegistration: dto.business_registration,
        identificationNumber: dto.identification_number,
        identificationType: dto.identification_type,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
        city: dto.city,
        postalCode: dto.postal_code,
        status: dto.status,
        birthDate: dto.birth_date,
        registrationDate: dto.registration_date,
        lastActivityDate: dto.last_activity_date,
        activeConcessions: dto.active_concessions_count || dto.active_concessions,
        totalConcessions: dto.total_concessions_count || dto.total_concessions,
        currentConcessions: dto.current_concessions_count || dto.current_concessions,
        maxAllowed: dto.max_allowed_concessions || dto.max_allowed || 3,
        emergencyContact: dto.emergency_contact,
        emergencyPhone: dto.emergency_phone,
        notes: dto.notes,
        curp: dto.curp,
        rfc: dto.rfc,
        legalRepresentative: dto.legal_representative,
        verificationStatus: dto.verification_status,
        hasValidDocuments: dto.has_valid_documents,
        isVerified: dto.is_verified,
        verifiedAt: dto.verified_at,
        createdAt: dto.created_at,
        updatedAt: dto.updated_at,
      }
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch concessionholder'
      currentItem.value = null
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const createItem = async (data: ConcessionHolderCreateDto) => {
    loading.value = true
    error.value = null

    try {
      const response = await concessionHolderApiService.create(data)

      await fetchList()

      return response.data
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create concessionholder'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const updateItem = async (id: string, data: ConcessionHolderUpdateDto) => {
    loading.value = true
    error.value = null

    try {
      const response = await concessionHolderApiService.update(id, data)

      await fetchList()
      if (currentItem.value?.id === id)
        await fetchById(id)

      return response.data
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update concessionholder'
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
      await concessionHolderApiService.delete(id)
      items.value = items.value.filter(item => item.id !== id)
      total.value = Math.max(0, total.value - 1)
      if (currentItem.value?.id === id)
        currentItem.value = null
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete concessionholder'
      await fetchList()
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const setPage = (newPage: number) => {
    page.value = newPage
  }

  const setFilters = (newFilters: ConcessionHolderFilterDto) => {
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
      const response = await concessionHolderApiService.getHolderStats()

      stats.value = response.data
    }
    catch (err) {
      console.error('Failed to fetch concession holder stats:', err)
    }
  }

  const exportItems = async (format: string = 'xlsx') => {
    try {
      loading.value = true

      const response = await concessionHolderApiService.exportConcessionHolders(filters.value)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.download = `concession-holders.${format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to export concessionholders'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  return {
    // State
    items,
    currentItem,
    loading,
    error,
    stats,

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
    setPage,
    setFilters,
    clearError,
    clearFilters,
    fetchStats,
    exportItems,
  }
})
