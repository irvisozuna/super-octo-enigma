/**
 * Documents Store for Drilling Reports Module
 * Manages documents data and operations
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { DrillingReportApiService } from '../../infrastructure/api/services/DrillingReportApiService'

export interface Document {
  id: string
  name: string
  type: string
  entity_type: string
  entity_id: string
  file_path: string
  file_size: number
  mime_type: string
  uploaded_by: string
  uploaded_at: string
  created_at: string
  updated_at: string
}

export interface DocumentsPagination {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export const useDocumentsStore = defineStore('drillingDocuments', () => {
  // State
  const documents = ref<Document[]>([])
  const currentDocument = ref<Document | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const pagination = ref<DocumentsPagination>({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  })

  // Getters
  const documentsList = computed(() => documents.value)
  const isLoading = computed(() => loading.value)
  const hasError = computed(() => !!error.value)
  const currentDocumentData = computed(() => currentDocument.value)

  // Actions
  const fetchDocuments = async (params: any = {}) => {
    loading.value = true
    error.value = null
    try {
      const response = await DrillingReportApiService.getDocuments(params)

      documents.value = response.data || response
      if (response.current_page) {
        pagination.value = {
          current_page: response.current_page,
          last_page: response.last_page,
          per_page: response.per_page,
          total: response.total,
        }
      }
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error fetching documents'
      console.error('Error fetching documents:', err)
    }
    finally {
      loading.value = false
    }
  }

  const fetchDocumentsByEntity = async (entityType: string, entityId: string, params: any = {}) => {
    loading.value = true
    error.value = null
    try {
      const response = await DrillingReportApiService.getDocumentsByEntity(entityType, entityId, params)

      documents.value = response.data || response
      if (response.current_page) {
        pagination.value = {
          current_page: response.current_page,
          last_page: response.last_page,
          per_page: response.per_page,
          total: response.total,
        }
      }
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error fetching documents by entity'
      console.error('Error fetching documents by entity:', err)
    }
    finally {
      loading.value = false
    }
  }

  const fetchDocument = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      const document = await DrillingReportApiService.getDocument(id)

      currentDocument.value = document

      return document
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error fetching document'
      console.error('Error fetching document:', err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const uploadDocument = async (file: File, entityType: string, entityId: string, metadata: any = {}) => {
    loading.value = true
    error.value = null
    try {
      const formData = new FormData()

      formData.append('file', file)
      formData.append('entity_type', entityType)
      formData.append('entity_id', entityId)
      Object.keys(metadata).forEach(key => {
        formData.append(key, metadata[key])
      })

      const newDocument = await DrillingReportApiService.uploadDocument(formData)

      documents.value.unshift(newDocument)

      return newDocument
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error uploading document'
      console.error('Error uploading document:', err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const downloadDocument = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      return await DrillingReportApiService.downloadDocument(id)
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error downloading document'
      console.error('Error downloading document:', err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const deleteDocument = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      await DrillingReportApiService.deleteDocument(id)
      documents.value = documents.value.filter(d => d.id !== id)
      if (currentDocument.value?.id === id)
        currentDocument.value = null
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error deleting document'
      console.error('Error deleting document:', err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  const reset = () => {
    documents.value = []
    currentDocument.value = null
    loading.value = false
    error.value = null
    pagination.value = {
      current_page: 1,
      last_page: 1,
      per_page: 10,
      total: 0,
    }
  }

  return {
    // State
    documents,
    currentDocument,
    loading,
    error,
    pagination,

    // Getters
    documentsList,
    isLoading,
    hasError,
    currentDocumentData,

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
})
