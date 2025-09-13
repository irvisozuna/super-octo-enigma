/**
 * Document Store - Presentation Layer
 *
 * Pinia store for document state management
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { DocumentEntity } from '../../domain/entities/DocumentEntity'
import type { DocumentCreateDto, DocumentFilterDto, DocumentUpdateDto } from '../../application/dtos/DocumentDtos'
import { DocumentApplicationService } from '../../application/services/DocumentApplicationService'
import { DocumentRepositoryImpl } from '../../infrastructure/persistence/repositories/DocumentRepositoryImpl'
import { DocumentApiService } from '../../infrastructure/api/services/DocumentApiService'

// Dependency injection
const documentApiService = new DocumentApiService()
const documentRepository = new DocumentRepositoryImpl(documentApiService)
const documentApplicationService = new DocumentApplicationService(documentRepository)

export const useDocumentStore = defineStore('transport-document', () => {
  // State
  const items = ref<DocumentEntity[]>([])
  const currentItem = ref<DocumentEntity | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Pagination
  const page = ref(1)
  const itemsPerPage = ref(20)
  const total = ref(0)
  const totalPages = ref(0)

  // Filters
  const filters = ref<DocumentFilterDto>({})

  // Selection
  const selectedItems = ref<DocumentEntity[]>([])

  // Stats
  const stats = ref({
    total_documents: 0,
    active_documents: 0,
    expired_documents: 0,
    pending_documents: 0,
    documents_by_type: {},
    documents_by_holder_type: {},
    expiring_soon: 0,
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
      const filterParams: DocumentFilterDto = {
        ...filters.value,
        page: page.value,
        per_page: itemsPerPage.value,
      }

      const response = await documentApplicationService.getDocuments(filterParams)

      items.value = response.data.map(dto => ({
        id: dto.id,
        documentType: dto.document_type,
        documentNumber: dto.document_number,
        issuedBy: dto.issued_by,
        issueDate: dto.issue_date,
        expiryDate: dto.expiry_date,
        status: dto.status,
        holderName: dto.holder_name,
        holderType: dto.holder_type,
        holderId: dto.holder_id,
        fileUrl: dto.file_url,
        fileName: dto.file_name,
        fileSize: dto.file_size,
        createdAt: dto.created_at,
        updatedAt: dto.updated_at,
      }))

      total.value = response.meta?.total || 0
      totalPages.value = Math.ceil(total.value / itemsPerPage.value)
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch documents'
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
      const response = await documentApplicationService.getDocumentById(id)
      const dto = response.data

      currentItem.value = {
        id: dto.id,
        documentType: dto.document_type,
        documentNumber: dto.document_number,
        issuedBy: dto.issued_by,
        issueDate: dto.issue_date,
        expiryDate: dto.expiry_date,
        status: dto.status,
        holderName: dto.holder_name,
        holderType: dto.holder_type,
        holderId: dto.holder_id,
        fileUrl: dto.file_url,
        fileName: dto.file_name,
        fileSize: dto.file_size,
        notes: dto.notes,
        verificationStatus: dto.verification_status,
        verificationDate: dto.verification_date,
        verifiedBy: dto.verified_by,
        rejectionReason: dto.rejection_reason,
        metadata: dto.metadata,
        createdAt: dto.created_at,
        updatedAt: dto.updated_at,
      }
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch document'
      currentItem.value = null
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const createItem = async (data: DocumentCreateDto) => {
    loading.value = true
    error.value = null

    try {
      const response = await documentApplicationService.createDocument(data)

      await fetchList()

      return response.data
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create document'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const updateItem = async (id: string, data: DocumentUpdateDto) => {
    loading.value = true
    error.value = null

    try {
      const response = await documentApplicationService.updateDocument(id, data)

      await fetchList()

      // Update current item if it's the one being updated
      if (currentItem.value?.id === id)
        await fetchById(id)

      return response.data
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update document'
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
      await documentApplicationService.deleteDocument(id)

      // Remove from local state immediately for better UX
      items.value = items.value.filter(item => item.id !== id)
      total.value = Math.max(0, total.value - 1)

      // Clear current item if it's the one being deleted
      if (currentItem.value?.id === id)
        currentItem.value = null
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete document'

      // Refresh list on error to ensure consistency
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

  const setFilters = (newFilters: DocumentFilterDto) => {
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
      stats.value = await documentApplicationService.getDocumentStats()
    }
    catch (err) {
      console.error('Failed to fetch document stats:', err)
    }
  }

  const validateDocument = async (documentNumber: string, documentType: string) => {
    try {
      return await documentApplicationService.validateDocument(documentNumber, documentType)
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to validate document'
      throw err
    }
  }

  const exportItems = async (format: string = 'xlsx') => {
    try {
      loading.value = true

      const filterParams: DocumentFilterDto = {
        ...filters.value,
        page: undefined, // Export all items, not just current page
        per_page: undefined,
      }

      const response = await documentApiService.exportDocuments(filterParams, format)

      // Create download link
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.download = `documents.${format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to export documents'
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
    validateDocument,
    exportItems,
  }
})
