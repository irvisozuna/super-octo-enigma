/**
 * Fine Store - Presentation Layer
 *
 * Pinia store for fine state management
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { FineEntity } from '../../domain/entities/FineEntity'
import type { FineContestDto, FineCreateDto, FineFilterDto, FinePaymentDto, FineUpdateDto } from '../../application/dtos/FineDtos'
import { FineApplicationService } from '../../application/services/FineApplicationService'
import { FineRepositoryImpl } from '../../infrastructure/persistence/repositories/FineRepositoryImpl'
import { FineApiService } from '../../infrastructure/api/services/FineApiService'

// Dependency injection
const fineApiService = new FineApiService()
const fineRepository = new FineRepositoryImpl(fineApiService)
const fineApplicationService = new FineApplicationService(fineRepository)

export const useFineStore = defineStore('transport-fine', () => {
  // State
  const items = ref<FineEntity[]>([])
  const currentItem = ref<FineEntity | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Pagination
  const page = ref(1)
  const itemsPerPage = ref(20)
  const total = ref(0)
  const totalPages = ref(0)

  // Filters
  const filters = ref<FineFilterDto>({})

  // Selection
  const selectedItems = ref<FineEntity[]>([])

  // Stats
  const stats = ref({
    total_fines: 0,
    pending_fines: 0,
    paid_fines: 0,
    overdue_fines: 0,
    total_amount: 0,
    paid_amount: 0,
    pending_amount: 0,
    overdue_amount: 0,
    fines_by_violation_type: {},
    fines_by_status: {},
    average_fine_amount: 0,
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
      const filterParams: FineFilterDto = {
        ...filters.value,
        page: page.value,
        per_page: itemsPerPage.value,
      }

      const response = await fineApplicationService.getFines(filterParams)

      items.value = response.data.map((item: any) => ({
        id: item.id,
        fineNumber: item.fine_number,
        violationType: item.violation_type?.name || item.violation_type || 'N/A',
        violationDescription: item.violation_type?.description || 'N/A',
        amount: parseFloat(item.total_amount) || 0,
        penaltyPoints: item.penalty_points || 0,
        status: item.status,
        issueDate: item.issued_at,
        dueDate: item.due_date,
        paymentDate: item.payment_date,
        issuingOfficer: item.issuing_officer || 'N/A',
        issuingAuthority: item.issuing_authority || 'N/A',
        vehiclePlate: item.vehicle_plate || 'N/A',
        driverLicense: item.driver_license || 'N/A',
        driverName: item.driver_name || 'N/A',
        location: item.location || 'N/A',
        evidencePhotos: item.evidence_photos || [],
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        // Campos adicionales del API
        subjectType: item.subject_type,
        paymentStatus: item.payment_status,
        statusLabel: item.status_label,
        formattedAmount: item.formatted_amount,
        formattedDate: item.formatted_date,
        daysUntilDue: item.days_until_due,
        isOverdue: item.is_overdue,
        isPaid: item.is_paid,
        concession: item.concession,
        concessionHolder: item.concession_holder,
        createdByUser: item.created_by_user,
        // Mantener la estructura original para compatibilidad
        violation_type: item.violation_type,
        total_amount: item.total_amount,
        issued_at: item.issued_at,
        created_by: item.created_by,
      }))

      total.value = response.meta?.total || 0
      totalPages.value = Math.ceil(total.value / itemsPerPage.value)
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch fines'
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
      const response = await fineApplicationService.getFineById(id)
      const dto = response.data

      currentItem.value = {
        id: dto.id,
        fineNumber: dto.fine_number,
        violationType: dto.violation_type,
        violationDescription: dto.violation_description,
        amount: dto.amount,
        penaltyPoints: dto.penalty_points,
        status: dto.status,
        issueDate: dto.issue_date,
        dueDate: dto.due_date,
        paymentDate: dto.payment_date,
        issuingOfficer: dto.issuing_officer,
        issuingAuthority: dto.issuing_authority,
        vehiclePlate: dto.vehicle_plate,
        driverLicense: dto.driver_license,
        driverName: dto.driver_name,
        location: dto.location,
        evidencePhotos: dto.evidence_photos,
        notes: dto.notes,
        paymentMethod: dto.payment_method,
        paymentReference: dto.payment_reference,
        contestReason: dto.contest_reason,
        contestDate: dto.contest_date,
        contestStatus: dto.contest_status,
        resolutionNotes: dto.resolution_notes,
        resolvedBy: dto.resolved_by,
        resolvedAt: dto.resolved_at,
        metadata: dto.metadata,
        createdAt: dto.created_at,
        updatedAt: dto.updated_at,
      }
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch fine'
      currentItem.value = null
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const createItem = async (data: FineCreateDto) => {
    loading.value = true
    error.value = null

    try {
      const response = await fineApplicationService.createFine(data)

      await fetchList()

      return response.data
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create fine'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const updateItem = async (id: string, data: FineUpdateDto) => {
    loading.value = true
    error.value = null

    try {
      const response = await fineApplicationService.updateFine(id, data)

      await fetchList()

      // Update current item if it's the one being updated
      if (currentItem.value?.id === id)
        await fetchById(id)

      return response.data
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update fine'
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
      await fineApplicationService.deleteFine(id)

      // Remove from local state immediately for better UX
      items.value = items.value.filter(item => item.id !== id)
      total.value = Math.max(0, total.value - 1)

      // Clear current item if it's the one being deleted
      if (currentItem.value?.id === id)
        currentItem.value = null
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete fine'

      // Refresh list on error to ensure consistency
      await fetchList()
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const payFine = async (paymentData: FinePaymentDto) => {
    loading.value = true
    error.value = null

    try {
      const response = await fineApplicationService.payFine(paymentData)

      await fetchList()

      // Update current item if it's the one being paid
      if (currentItem.value?.id === paymentData.fine_id)
        await fetchById(paymentData.fine_id)

      return response.data
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to process payment'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const contestFine = async (contestData: FineContestDto) => {
    loading.value = true
    error.value = null

    try {
      const response = await fineApplicationService.contestFine(contestData)

      await fetchList()

      // Update current item if it's the one being contested
      if (currentItem.value?.id === contestData.fine_id)
        await fetchById(contestData.fine_id)

      return response.data
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to contest fine'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const setPage = (newPage: number) => {
    page.value = newPage
  }

  const setFilters = (newFilters: FineFilterDto) => {
    filters.value = { ...newFilters }
    page.value = 1 // Reset to first page when filters change
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
      stats.value = await fineApplicationService.getFineStats()
    }
    catch (err) {
      console.error('Failed to fetch fine stats:', err)
    }
  }

  const getOverdueFines = async (daysOverdue?: number) => {
    try {
      return await fineApplicationService.getOverdueFines(daysOverdue)
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch overdue fines'
      throw err
    }
  }

  const exportItems = async (format: string = 'xlsx') => {
    try {
      loading.value = true

      const filterParams: FineFilterDto = {
        ...filters.value,
        page: undefined, // Export all items, not just current page
        per_page: undefined,
      }

      const response = await fineApiService.exportFines(filterParams, format)

      // Create download link
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.download = `fines.${format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to export fines'
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
    payFine,
    contestFine,
    setPage,
    setFilters,
    clearError,
    clearFilters,
    fetchStats,
    getOverdueFines,
    exportItems,
  }
})
