/**
 * Document Store - Presentation Layer
 *
 * Manages document state using Pinia
 * Coordinates with Application Service for business logic
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { DocumentApplicationService } from '../../application/services/DocumentApplicationService'
import { DocumentRepositoryImpl } from '../../infrastructure/persistence/repositories/DocumentRepositoryImpl'
import type {
  CreateDocumentRequest,
  CreateShareLinkRequest,
  DocumentEntity,
  DocumentFilter,
  DocumentSearchCriteria,
  UpdateDocumentRequest,
  UpdateShareLinkRequest,
} from '../../domain/entities/DocumentEntity'

export const useDocumentStore = defineStore('document', () => {
  // State
  const items = ref<DocumentEntity[]>([])
  const currentItem = ref<DocumentEntity | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const pagination = ref({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  })

  // Filters
  const filters = ref<DocumentFilter>({
    title: '',
    document_type: undefined,
    category: undefined,
    resource_type: '',
    resource_subtype: '',
    status: undefined,
    tags: [],
    uploaded_by: '',
    date_from: '',
    date_to: '',
    page: 1,
    per_page: 20,
    sort_by: 'created_at',
    sort_order: 'desc',
    search: '',
  })

  // Application Service
  const repository = new DocumentRepositoryImpl()
  const applicationService = new DocumentApplicationService(repository)

  // Getters
  const hasItems = computed(() => items.value.length > 0)
  const totalPages = computed(() => pagination.value.last_page)
  const currentPage = computed(() => pagination.value.current_page)
  const totalItems = computed(() => pagination.value.total)
  const isLoading = computed(() => loading.value)
  const hasError = computed(() => error.value !== null)
  const errorMessage = computed(() => error.value)

  // Document Type Options
  const documentTypeOptions = computed(() => [
    { value: 'contract', title: 'Contrato' },
    { value: 'invoice', title: 'Factura' },
    { value: 'report', title: 'Reporte' },
    { value: 'image', title: 'Imagen' },
    { value: 'certificate', title: 'Certificado' },
    { value: 'permit', title: 'Permiso' },
    { value: 'blueprint', title: 'Plano' },
    { value: 'spreadsheet', title: 'Hoja de Cálculo' },
    { value: 'presentation', title: 'Presentación' },
    { value: 'legal', title: 'Legal' },
    { value: 'financial', title: 'Financiero' },
    { value: 'technical', title: 'Técnico' },
    { value: 'other', title: 'Otro' },
  ])

  // Category Options
  const categoryOptions = computed(() => [
    { value: 'legal', title: 'Legal' },
    { value: 'financial', title: 'Financiero' },
    { value: 'technical', title: 'Técnico' },
    { value: 'administrative', title: 'Administrativo' },
    { value: 'operational', title: 'Operacional' },
    { value: 'compliance', title: 'Cumplimiento' },
    { value: 'hr', title: 'Recursos Humanos' },
    { value: 'marketing', title: 'Marketing' },
    { value: 'confidential', title: 'Confidencial' },
    { value: 'general', title: 'General' },
  ])

  // Status Options
  const statusOptions = computed(() => [
    { value: 'draft', title: 'Borrador' },
    { value: 'active', title: 'Activo' },
    { value: 'archived', title: 'Archivado' },
    { value: 'deleted', title: 'Eliminado' },
  ])

  // Access Level Options
  const accessLevelOptions = computed(() => [
    { value: 'public', title: 'Público' },
    { value: 'internal', title: 'Interno' },
    { value: 'confidential', title: 'Confidencial' },
    { value: 'restricted', title: 'Restringido' },
  ])

  // Actions
  const setLoading = (value: boolean) => {
    loading.value = value
  }

  const setError = (message: string | null) => {
    error.value = message
  }

  const clearError = () => {
    error.value = null
  }

  const setItems = (newItems: DocumentEntity[]) => {
    items.value = newItems
  }

  const setCurrentItem = (item: DocumentEntity | null) => {
    currentItem.value = item
  }

  const setPagination = (paginationData: any) => {
    pagination.value = {
      current_page: paginationData.current_page,
      last_page: paginationData.last_page,
      per_page: paginationData.per_page,
      total: paginationData.total,
    }
  }

  const setFilters = (newFilters: Partial<DocumentFilter>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  const resetFilters = () => {
    filters.value = {
      title: '',
      document_type: undefined,
      category: undefined,
      resource_type: '',
      resource_subtype: '',
      status: undefined,
      tags: [],
      uploaded_by: '',
      date_from: '',
      date_to: '',
      page: 1,
      per_page: 20,
      sort_by: 'created_at',
      sort_order: 'desc',
      search: '',
    }
  }

  // Document CRUD Operations
  const fetchDocuments = async (filter?: DocumentFilter) => {
    try {
      setLoading(true)
      clearError()

      const response = await applicationService.getDocuments(filter || filters.value)

      setItems(response.data)
      setPagination(response.pagination)
    }
    catch (err) {
      setError('Error al cargar documentos')
      console.error('Error fetching documents:', err)
    }
    finally {
      setLoading(false)
    }
  }

  const fetchDocumentById = async (id: string) => {
    try {
      setLoading(true)
      clearError()

      const document = await applicationService.getDocumentById(id)

      setCurrentItem(document)

      return document
    }
    catch (err) {
      setError('Error al cargar el documento')
      console.error('Error fetching document:', err)
      throw err
    }
    finally {
      setLoading(false)
    }
  }

  const fetchDocumentsByResource = async (resourceType: string, resourceId: string, subtype?: string) => {
    try {
      setLoading(true)
      clearError()

      const documents = await applicationService.getDocumentsByResource(resourceType, resourceId, subtype)

      setItems(documents)

      return documents
    }
    catch (err) {
      setError('Error al cargar documentos del recurso')
      console.error('Error fetching documents by resource:', err)
      throw err
    }
    finally {
      setLoading(false)
    }
  }

  const createDocument = async (data: CreateDocumentRequest) => {
    try {
      setLoading(true)
      clearError()

      const document = await applicationService.createDocument(data)

      // Add to items list
      items.value.unshift(document)

      return document
    }
    catch (err) {
      setError('Error al crear el documento')
      console.error('Error creating document:', err)
      throw err
    }
    finally {
      setLoading(false)
    }
  }

  const updateDocument = async (id: string, data: Partial<UpdateDocumentRequest>) => {
    try {
      setLoading(true)
      clearError()

      const document = await applicationService.updateDocument(id, data)

      // Update in items list
      const index = items.value.findIndex(item => item.id === id)
      if (index !== -1)
        items.value[index] = document

      // Update current item if it's the same
      if (currentItem.value?.id === id)
        setCurrentItem(document)

      return document
    }
    catch (err) {
      setError('Error al actualizar el documento')
      console.error('Error updating document:', err)
      throw err
    }
    finally {
      setLoading(false)
    }
  }

  const deleteDocument = async (id: string) => {
    try {
      setLoading(true)
      clearError()

      await applicationService.deleteDocument(id)

      // Remove from items list
      items.value = items.value.filter(item => item.id !== id)

      // Clear current item if it's the same
      if (currentItem.value?.id === id)
        setCurrentItem(null)
    }
    catch (err) {
      setError('Error al eliminar el documento')
      console.error('Error deleting document:', err)
      throw err
    }
    finally {
      setLoading(false)
    }
  }

  const searchDocuments = async (criteria: DocumentSearchCriteria) => {
    try {
      setLoading(true)
      clearError()

      const response = await applicationService.searchDocuments(criteria)

      setItems(response.data)
      setPagination(response.pagination)
    }
    catch (err) {
      setError('Error al buscar documentos')
      console.error('Error searching documents:', err)
    }
    finally {
      setLoading(false)
    }
  }

  // Document Versions
  const fetchDocumentVersions = async (documentId: string) => {
    try {
      setLoading(true)
      clearError()

      return await applicationService.getDocumentVersions(documentId)
    }
    catch (err) {
      setError('Error al cargar versiones del documento')
      console.error('Error fetching document versions:', err)
      throw err
    }
    finally {
      setLoading(false)
    }
  }

  const createDocumentVersion = async (documentId: string, file: File, changeDescription?: string) => {
    try {
      setLoading(true)
      clearError()

      return await applicationService.createDocumentVersion(documentId, file, changeDescription)
    }
    catch (err) {
      setError('Error al crear nueva versión')
      console.error('Error creating document version:', err)
      throw err
    }
    finally {
      setLoading(false)
    }
  }

  const restoreToVersion = async (documentId: string, versionId: string) => {
    try {
      setLoading(true)
      clearError()

      const document = await applicationService.restoreToVersion(documentId, versionId)

      // Update current item
      setCurrentItem(document)

      return document
    }
    catch (err) {
      setError('Error al restaurar versión')
      console.error('Error restoring to version:', err)
      throw err
    }
    finally {
      setLoading(false)
    }
  }

  const deleteDocumentVersion = async (documentId: string, versionId: string) => {
    try {
      setLoading(true)
      clearError()

      await applicationService.deleteDocumentVersion(documentId, versionId)
    }
    catch (err) {
      setError('Error al eliminar versión')
      console.error('Error deleting document version:', err)
      throw err
    }
    finally {
      setLoading(false)
    }
  }

  // Share Links
  const fetchDocumentShareLinks = async (documentId: string) => {
    try {
      setLoading(true)
      clearError()

      return await applicationService.getDocumentShareLinks(documentId)
    }
    catch (err) {
      setError('Error al cargar enlaces de compartir')
      console.error('Error fetching share links:', err)
      throw err
    }
    finally {
      setLoading(false)
    }
  }

  const createShareLink = async (documentId: string, shareData: CreateShareLinkRequest) => {
    try {
      setLoading(true)
      clearError()

      return await applicationService.createShareLink(documentId, shareData)
    }
    catch (err) {
      setError('Error al crear enlace de compartir')
      console.error('Error creating share link:', err)
      throw err
    }
    finally {
      setLoading(false)
    }
  }

  const updateShareLink = async (documentId: string, shareLinkId: string, shareData: UpdateShareLinkRequest) => {
    try {
      setLoading(true)
      clearError()

      return await applicationService.updateShareLink(documentId, shareLinkId, shareData)
    }
    catch (err) {
      setError('Error al actualizar enlace de compartir')
      console.error('Error updating share link:', err)
      throw err
    }
    finally {
      setLoading(false)
    }
  }

  const revokeShareLink = async (documentId: string, shareLinkId: string) => {
    try {
      setLoading(true)
      clearError()

      await applicationService.revokeShareLink(documentId, shareLinkId)
    }
    catch (err) {
      setError('Error al revocar enlace de compartir')
      console.error('Error revoking share link:', err)
      throw err
    }
    finally {
      setLoading(false)
    }
  }

  // Document Access
  const downloadDocument = async (documentId: string): Promise<Blob> => {
    try {
      setLoading(true)
      clearError()

      return await applicationService.downloadDocument(documentId)
    }
    catch (err) {
      setError('Error al descargar documento')
      console.error('Error downloading document:', err)
      throw err
    }
    finally {
      setLoading(false)
    }
  }

  const downloadDocumentViaShareLink = async (token: string, password?: string): Promise<Blob> => {
    try {
      setLoading(true)
      clearError()

      return await applicationService.downloadDocumentViaShareLink(token, password)
    }
    catch (err) {
      setError('Error al descargar documento')
      console.error('Error downloading document via share link:', err)
      throw err
    }
    finally {
      setLoading(false)
    }
  }

  const getDocumentPreview = async (documentId: string): Promise<Blob> => {
    try {
      setLoading(true)
      clearError()

      return await applicationService.getDocumentPreview(documentId)
    }
    catch (err) {
      setError('Error al obtener vista previa')
      console.error('Error getting document preview:', err)
      throw err
    }
    finally {
      setLoading(false)
    }
  }

  // Metadata Templates
  const fetchMetadataTemplates = async () => {
    try {
      setLoading(true)
      clearError()

      return await applicationService.getMetadataTemplates()
    }
    catch (err) {
      setError('Error al cargar plantillas de metadatos')
      console.error('Error fetching metadata templates:', err)
      throw err
    }
    finally {
      setLoading(false)
    }
  }

  const fetchMetadataTemplate = async (resourceType: string, subtype?: string) => {
    try {
      setLoading(true)
      clearError()

      return await applicationService.getMetadataTemplate(resourceType, subtype)
    }
    catch (err) {
      setError('Error al cargar plantilla de metadatos')
      console.error('Error fetching metadata template:', err)
      throw err
    }
    finally {
      setLoading(false)
    }
  }

  // Bulk Operations
  const bulkUploadDocuments = async (documents: CreateDocumentRequest[]) => {
    try {
      setLoading(true)
      clearError()

      const uploadedDocuments = await applicationService.bulkUploadDocuments(documents)

      // Add to items list
      items.value.unshift(...uploadedDocuments)

      return uploadedDocuments
    }
    catch (err) {
      setError('Error al subir documentos en lote')
      console.error('Error bulk uploading documents:', err)
      throw err
    }
    finally {
      setLoading(false)
    }
  }

  const bulkDeleteDocuments = async (documentIds: string[]) => {
    try {
      setLoading(true)
      clearError()

      await applicationService.bulkDeleteDocuments(documentIds)

      // Remove from items list
      items.value = items.value.filter(item => !documentIds.includes(item.id))
    }
    catch (err) {
      setError('Error al eliminar documentos en lote')
      console.error('Error bulk deleting documents:', err)
      throw err
    }
    finally {
      setLoading(false)
    }
  }

  const bulkUpdateDocuments = async (updates: Array<{ id: string; data: Partial<UpdateDocumentRequest> }>) => {
    try {
      setLoading(true)
      clearError()

      const updatedDocuments = await applicationService.bulkUpdateDocuments(updates)

      // Update in items list
      updatedDocuments.forEach(updatedDoc => {
        const index = items.value.findIndex(item => item.id === updatedDoc.id)
        if (index !== -1)
          items.value[index] = updatedDoc
      })

      return updatedDocuments
    }
    catch (err) {
      setError('Error al actualizar documentos en lote')
      console.error('Error bulk updating documents:', err)
      throw err
    }
    finally {
      setLoading(false)
    }
  }

  // Statistics
  const fetchStatistics = async () => {
    try {
      setLoading(true)
      clearError()

      return await applicationService.getStatistics()
    }
    catch (err) {
      setError('Error al cargar estadísticas')
      console.error('Error fetching statistics:', err)
      throw err
    }
    finally {
      setLoading(false)
    }
  }

  // Export
  const exportDocuments = async (filter?: DocumentFilter, format = 'excel'): Promise<Blob> => {
    try {
      setLoading(true)
      clearError()

      return await applicationService.exportDocuments(filter, format)
    }
    catch (err) {
      setError('Error al exportar documentos')
      console.error('Error exporting documents:', err)
      throw err
    }
    finally {
      setLoading(false)
    }
  }

  // Access Logs
  const fetchDocumentAccessLogs = async (documentId: string) => {
    try {
      setLoading(true)
      clearError()

      return await applicationService.getDocumentAccessLogs(documentId)
    }
    catch (err) {
      setError('Error al cargar registros de acceso')
      console.error('Error fetching access logs:', err)
      throw err
    }
    finally {
      setLoading(false)
    }
  }

  // Utility Methods
  const validateDocumentData = (data: Partial<CreateDocumentRequest>): string[] => {
    return applicationService.validateDocumentData(data)
  }

  const getDocumentDisplayName = (document: DocumentEntity): string => {
    return applicationService.getDocumentDisplayName(document)
  }

  const hasExpiredShareLinks = (document: DocumentEntity): boolean => {
    return applicationService.hasExpiredShareLinks(document)
  }

  const hasMetadata = (document: DocumentEntity): boolean => {
    return applicationService.hasMetadata(document)
  }

  const getDocumentIcon = (document: DocumentEntity): string => {
    return applicationService.getDocumentIcon(document)
  }

  const calculateDocumentAge = (document: DocumentEntity): number => {
    return applicationService.calculateDocumentAge(document)
  }

  const isDocumentRecent = (document: DocumentEntity): boolean => {
    return applicationService.isDocumentRecent(document)
  }

  const formatMetadataForDisplay = (metadata: Record<string, any>): Array<{ key: string; value: any; formatted: string }> => {
    return applicationService.formatMetadataForDisplay(metadata)
  }

  const checkExpiredMetadataFields = (metadata: Record<string, any>): Array<{ field: string; expiryDate: string }> => {
    return applicationService.checkExpiredMetadataFields(metadata)
  }

  const checkExpiringMetadataFields = (metadata: Record<string, any>, daysAhead = 30): Array<{ field: string; expiryDate: string; daysUntil: number }> => {
    return applicationService.checkExpiringMetadataFields(metadata, daysAhead)
  }

  return {
    // State
    items,
    currentItem,
    loading,
    error,
    pagination,
    filters,

    // Getters
    hasItems,
    totalPages,
    currentPage,
    totalItems,
    isLoading,
    hasError,
    errorMessage,
    documentTypeOptions,
    categoryOptions,
    statusOptions,
    accessLevelOptions,

    // Actions
    setLoading,
    setError,
    clearError,
    setItems,
    setCurrentItem,
    setPagination,
    setFilters,
    resetFilters,

    // Document CRUD
    fetchDocuments,
    fetchDocumentById,
    fetchDocumentsByResource,
    createDocument,
    updateDocument,
    deleteDocument,
    searchDocuments,

    // Document Versions
    fetchDocumentVersions,
    createDocumentVersion,
    restoreToVersion,
    deleteDocumentVersion,

    // Share Links
    fetchDocumentShareLinks,
    createShareLink,
    updateShareLink,
    revokeShareLink,

    // Document Access
    downloadDocument,
    downloadDocumentViaShareLink,
    getDocumentPreview,

    // Metadata Templates
    fetchMetadataTemplates,
    fetchMetadataTemplate,

    // Bulk Operations
    bulkUploadDocuments,
    bulkDeleteDocuments,
    bulkUpdateDocuments,

    // Statistics
    fetchStatistics,

    // Export
    exportDocuments,

    // Access Logs
    fetchDocumentAccessLogs,

    // Utility Methods
    validateDocumentData,
    getDocumentDisplayName,
    hasExpiredShareLinks,
    hasMetadata,
    getDocumentIcon,
    calculateDocumentAge,
    isDocumentRecent,
    formatMetadataForDisplay,
    checkExpiredMetadataFields,
    checkExpiringMetadataFields,
  }
})
