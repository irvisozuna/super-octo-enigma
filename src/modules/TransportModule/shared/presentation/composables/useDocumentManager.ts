/**
 * Document Manager Composable
 *
 * Reusable composable for document management across all transport entities
 */

import { computed, reactive, toRefs, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type {
  CreateDocumentRequest,
  DocumentEntity,
  EntityType,
  EntityTypesResponse,
  MarkPendingDocumentRequest,
  RejectDocumentRequest,
  UpdateDocumentRequest,
  VerifyDocumentRequest,
} from '../../domain/entities/DocumentEntity'
import { DocumentDomain } from '../../domain/entities/DocumentEntity'
import { HttpDocumentRepository } from '../../infrastructure/repositories/HttpDocumentRepository'

interface DocumentManagerOptions {
  entityId: string
  entityType: EntityType
  autoLoad?: boolean
}

interface DocumentManagerState {
  documents: DocumentEntity[]
  entityTypes: EntityTypesResponse | null
  selectedDocuments: string[]
  loading: boolean
  uploading: boolean
  error: string | null
  uploadProgress: number
}

export function useDocumentManager(options: DocumentManagerOptions) {
  const { t } = useI18n()
  const repository = new HttpDocumentRepository()

  // State
  const state = reactive<DocumentManagerState>({
    documents: [],
    entityTypes: null,
    selectedDocuments: [],
    loading: false,
    uploading: false,
    error: null,
    uploadProgress: 0,
  })

  // Computed
  const documentsByType = computed(() => {
    const grouped: Record<string, DocumentEntity[]> = {}

    state.documents.forEach(doc => {
      if (!grouped[doc.document_type])
        grouped[doc.document_type] = []

      grouped[doc.document_type].push(doc)
    })

    return grouped
  })

  const availableDocumentTypes = computed(() => {
    if (!state.entityTypes || !state.entityTypes[options.entityType])
      return []

    return state.entityTypes[options.entityType].document_types || []
  })

  const hasSelectedDocuments = computed(() => state.selectedDocuments.length > 0)

  const expiredDocuments = computed(() =>
    state.documents.filter(doc => DocumentDomain.isExpired(doc)),
  )

  const expiringDocuments = computed(() =>
    state.documents.filter(doc => DocumentDomain.isExpiringSoon(doc)),
  )

  // Methods
  async function loadEntityTypes() {
    try {
      state.loading = true
      console.log('Loading entity types...')

      try {
        state.entityTypes = await repository.getEntityTypes()
        console.log('Entity types loaded from API:', state.entityTypes)
      }
      catch (apiError) {
        // Fallback to mock data if API fails
        console.warn('API failed, using mock entity types:', apiError)
        state.entityTypes = {
          holder: {
            label: 'Concesionario',
            description: 'Documentos de concesionarios',
            document_types: [
              'LICENCIA',
              'IDENTIFICACION',
              'CERTIFICADO',
              'CONTRATO',
              'OTROS',
            ],
          },
          concession: {
            label: 'Concesión',
            description: 'Documentos de concesiones',
            document_types: [
              'PERMISO',
              'CERTIFICADO',
              'CONTRATO',
              'REGISTRO',
              'OTROS',
            ],
          },
          driver: {
            label: 'Conductor',
            description: 'Documentos de conductores',
            document_types: [
              'IDENTIFICACION',
              'LICENCIA',
              'CERTIFICADO',
              'VERIFICACION',
              'OTROS',
            ],
          },
          vehicle: {
            label: 'Vehículo',
            description: 'Documentos de vehículos',
            document_types: [
              'POLIZA',
              'CERTIFICADO',
              'REGISTRO',
              'FACTURA',
              'OTROS',
            ],
          },
          fine: {
            label: 'Multa',
            description: 'Documentos de multas',
            document_types: [
              'REGISTRO',
              'CERTIFICADO',
              'OTROS',
            ],
          },
          payment: {
            label: 'Pago',
            description: 'Documentos de pagos',
            document_types: [
              'FACTURA',
              'COMPROBANTE',
              'REGISTRO',
              'OTROS',
            ],
          },
          insurance: {
            label: 'Seguro',
            description: 'Documentos de seguros',
            document_types: [
              'POLIZA',
              'CERTIFICADO',
              'REGISTRO',
              'OTROS',
            ],
          },
        }
        console.log('Using mock entity types:', state.entityTypes)
      }
    }
    catch (error: any) {
      state.error = error.message || 'Error al cargar tipos de entidad'
      console.error('Error loading entity types:', error)
    }
    finally {
      state.loading = false
    }
  }

  async function loadDocuments() {
    try {
      state.loading = true
      state.error = null
      console.log('Loading documents for:', { entityId: options.entityId, entityType: options.entityType })
      state.documents = await repository.findByEntity(options.entityId, options.entityType)
      console.log('Documents loaded:', state.documents)
      console.log('Documents count:', state.documents.length)
    }
    catch (error: any) {
      state.error = error.message || 'Error al cargar documentos'
      console.error('Error loading documents:', error)
    }
    finally {
      state.loading = false
    }
  }

  async function uploadDocument(data: CreateDocumentRequest): Promise<DocumentEntity | null> {
    try {
      state.uploading = true
      state.error = null
      state.uploadProgress = 0

      // Validate data
      const errors = DocumentDomain.validate(data)
      if (errors.length > 0)
        throw new Error(errors.join(', '))

      // Simulate upload progress (since we can't track real progress with FormData)
      const progressInterval = setInterval(() => {
        if (state.uploadProgress < 90)
          state.uploadProgress += 10
      }, 100)

      const document = await repository.create(data)

      clearInterval(progressInterval)
      state.uploadProgress = 100

      console.log('Document uploaded successfully:', document)

      // Reload documents from server instead of just adding to local state
      // This ensures we get the complete server response with all computed fields
      await loadDocuments()

      return document
    }
    catch (error: any) {
      state.error = error.message || 'Error al subir documento'
      console.error('Error uploading document:', error)

      return null
    }
    finally {
      state.uploading = false
      setTimeout(() => {
        state.uploadProgress = 0
      }, 1000)
    }
  }

  async function updateDocument(id: string, data: UpdateDocumentRequest): Promise<DocumentEntity | null> {
    try {
      state.loading = true
      state.error = null

      const updatedDocument = await repository.update(id, data)

      // Update local state
      const index = state.documents.findIndex(doc => doc.id === id)
      if (index !== -1)
        state.documents[index] = updatedDocument

      return updatedDocument
    }
    catch (error: any) {
      state.error = error.message || 'Error al actualizar documento'
      console.error('Error updating document:', error)

      return null
    }
    finally {
      state.loading = false
    }
  }

  async function deleteDocument(id: string): Promise<boolean> {
    try {
      state.loading = true
      state.error = null

      // Check if document can be deleted
      const document = state.documents.find(doc => doc.id === id)
      if (document) {
        const { canDelete, reason } = DocumentDomain.canDelete(document)
        if (!canDelete)
          throw new Error(reason)
      }

      await repository.delete(id)

      // Remove from local state
      state.documents = state.documents.filter(doc => doc.id !== id)
      state.selectedDocuments = state.selectedDocuments.filter(selectedId => selectedId !== id)

      return true
    }
    catch (error: any) {
      state.error = error.message || 'Error al eliminar documento'
      console.error('Error deleting document:', error)

      return false
    }
    finally {
      state.loading = false
    }
  }

  async function bulkDeleteDocuments(): Promise<boolean> {
    if (state.selectedDocuments.length === 0)
      return false

    try {
      state.loading = true
      state.error = null

      await repository.bulkDelete(state.selectedDocuments)

      // Remove from local state
      state.documents = state.documents.filter(doc => !state.selectedDocuments.includes(doc.id))
      state.selectedDocuments = []

      return true
    }
    catch (error: any) {
      state.error = error.message || 'Error al eliminar documentos'
      console.error('Error bulk deleting documents:', error)

      return false
    }
    finally {
      state.loading = false
    }
  }

  async function downloadDocument(doc: DocumentEntity): Promise<void> {
    try {
      // Use the download_url from the document entity if available
      if (doc.download_url) {
        const link = document.createElement('a')

        link.href = doc.download_url
        link.download = doc.file_name || `documento-${doc.id}`
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
      else {
        // Fallback to repository download method
        const blob = await repository.download(doc.id)
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')

        link.href = url
        link.download = doc.file_name || `documento-${doc.id}`
        document.body.appendChild(link)
        link.click()

        // Cleanup
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }
    }
    catch (error: any) {
      state.error = error.message || 'Error al descargar documento'
      console.error('Error downloading document:', error)
    }
  }

  function getPreviewUrl(doc: DocumentEntity): string {
    // Use the download_url from the document entity for preview as well
    return doc.download_url || repository.getPreviewUrl(doc.id)
  }

  function selectDocument(id: string) {
    if (!state.selectedDocuments.includes(id))
      state.selectedDocuments.push(id)
  }

  function unselectDocument(id: string) {
    state.selectedDocuments = state.selectedDocuments.filter(selectedId => selectedId !== id)
  }

  function toggleDocumentSelection(id: string) {
    if (state.selectedDocuments.includes(id))
      unselectDocument(id)
    else
      selectDocument(id)
  }

  function selectAllDocuments() {
    state.selectedDocuments = state.documents.map(doc => doc.id)
  }

  function unselectAllDocuments() {
    state.selectedDocuments = []
  }

  function getDocumentsByType(documentType: string): DocumentEntity[] {
    return state.documents.filter(doc => doc.document_type === documentType)
  }

  function hasDocumentOfType(documentType: string): boolean {
    return state.documents.some(doc => doc.document_type === documentType)
  }

  function clearError() {
    state.error = null
  }

  // Verification methods
  async function verifyDocument(id: string, data: VerifyDocumentRequest): Promise<boolean> {
    try {
      state.loading = true
      state.error = null

      const verifiedDocument = await repository.verifyDocument(id, data)

      // Update document in local state
      const index = state.documents.findIndex(doc => doc.id === id)
      if (index !== -1)
        state.documents[index] = { ...state.documents[index], ...verifiedDocument }

      return true
    }
    catch (error: any) {
      state.error = error.message || 'Error al verificar documento'
      console.error('Error verifying document:', error)
      return false
    }
    finally {
      state.loading = false
    }
  }

  async function rejectDocument(id: string, data: RejectDocumentRequest): Promise<boolean> {
    try {
      state.loading = true
      state.error = null

      const rejectedDocument = await repository.rejectDocument(id, data)

      // Update document in local state
      const index = state.documents.findIndex(doc => doc.id === id)
      if (index !== -1)
        state.documents[index] = { ...state.documents[index], ...rejectedDocument }

      return true
    }
    catch (error: any) {
      state.error = error.message || 'Error al rechazar documento'
      console.error('Error rejecting document:', error)
      return false
    }
    finally {
      state.loading = false
    }
  }

  async function markPendingDocument(id: string, data: MarkPendingDocumentRequest): Promise<boolean> {
    try {
      state.loading = true
      state.error = null

      const pendingDocument = await repository.markPendingDocument(id, data)

      // Update document in local state
      const index = state.documents.findIndex(doc => doc.id === id)
      if (index !== -1)
        state.documents[index] = { ...state.documents[index], ...pendingDocument }

      return true
    }
    catch (error: any) {
      state.error = error.message || 'Error al marcar documento como pendiente'
      console.error('Error marking document as pending:', error)
      return false
    }
    finally {
      state.loading = false
    }
  }

  async function getVerificationHistory(id: string) {
    try {
      state.loading = true
      state.error = null

      return await repository.getVerificationHistory(id)
    }
    catch (error: any) {
      state.error = error.message || 'Error al obtener historial de verificación'
      console.error('Error getting verification history:', error)
      return null
    }
    finally {
      state.loading = false
    }
  }

  // Initialize
  async function initialize() {
    await Promise.all([
      loadEntityTypes(),
      options.autoLoad !== false ? loadDocuments() : Promise.resolve(),
    ])
  }

  // Watchers
  watch(() => options.entityId, () => {
    if (options.autoLoad !== false)
      loadDocuments()
  })

  return {
    // Reactive State - using toRefs to maintain reactivity
    ...toRefs(state),

    // Computed
    documentsByType,
    availableDocumentTypes,
    hasSelectedDocuments,
    expiredDocuments,
    expiringDocuments,

    // Methods
    initialize,
    loadEntityTypes,
    loadDocuments,
    uploadDocument,
    updateDocument,
    deleteDocument,
    bulkDeleteDocuments,
    downloadDocument,
    getPreviewUrl,
    selectDocument,
    unselectDocument,
    toggleDocumentSelection,
    selectAllDocuments,
    unselectAllDocuments,
    getDocumentsByType,
    hasDocumentOfType,
    clearError,

    // Verification methods
    verifyDocument,
    rejectDocument,
    markPendingDocument,
    getVerificationHistory,

    // Utilities
    DocumentDomain,
  }
}

export type DocumentManager = ReturnType<typeof useDocumentManager>
