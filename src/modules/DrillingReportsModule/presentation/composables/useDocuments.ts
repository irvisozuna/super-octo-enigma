/**
 * Documents Composable
 * Provides reactive state and methods for documents management
 */

import { computed } from 'vue'
import { useDocumentsStore } from '../stores/documentsStore'

export const useDocuments = () => {
  const store = useDocumentsStore()

  // State
  const documents = computed(() => store.documentsList)
  const currentDocument = computed(() => store.currentDocumentData)
  const loading = computed(() => store.isLoading)
  const error = computed(() => store.hasError)
  const pagination = computed(() => store.pagination)

  // Actions
  const fetchDocuments = async (params: any = {}) => {
    await store.fetchDocuments(params)
  }

  const fetchDocumentsByEntity = async (entityType: string, entityId: string, params: any = {}) => {
    await store.fetchDocumentsByEntity(entityType, entityId, params)
  }

  const fetchDocument = async (id: string) => {
    return await store.fetchDocument(id)
  }

  const uploadDocument = async (file: File, entityType: string, entityId: string, metadata: any = {}) => {
    return await store.uploadDocument(file, entityType, entityId, metadata)
  }

  const downloadDocument = async (id: string) => {
    return await store.downloadDocument(id)
  }

  const deleteDocument = async (id: string) => {
    await store.deleteDocument(id)
  }

  const clearError = () => {
    store.clearError()
  }

  const reset = () => {
    store.reset()
  }

  return {
    // State
    documents,
    currentDocument,
    loading,
    error,
    pagination,

    // Actions
    fetchDocuments,
    fetchDocumentsByEntity,
    fetchDocument,
    uploadDocument,
    downloadDocument,
    deleteDocument,
    clearError,
    reset,
  }
}
