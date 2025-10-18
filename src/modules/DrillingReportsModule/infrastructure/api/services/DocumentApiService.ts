import axios from 'axios'
import type { Document, DocumentCreateRequest, DocumentListResponse, DocumentUpdateRequest, DocumentUploadResponse } from '../../../domain/entities/DocumentEntity'

export class DocumentApiService {
  private baseUrl = '/api/documents'

  async getDocuments(params?: any): Promise<DocumentListResponse> {
    const response = await axios.get(this.baseUrl, { params })

    return response.data
  }

  async getDocumentById(id: string): Promise<Document> {
    const response = await axios.get(`${this.baseUrl}/${id}`)

    return response.data
  }

  async createDocument(document: DocumentCreateRequest): Promise<Document> {
    const response = await axios.post(this.baseUrl, document)

    return response.data
  }

  async updateDocument(id: string, document: DocumentUpdateRequest): Promise<Document> {
    const response = await axios.put(`${this.baseUrl}/${id}`, document)

    return response.data
  }

  async deleteDocument(id: string): Promise<void> {
    await axios.delete(`${this.baseUrl}/${id}`)
  }

  async uploadDocument(file: File, metadata: Omit<DocumentCreateRequest, 'file'>): Promise<DocumentUploadResponse> {
    const formData = new FormData()

    formData.append('file', file)
    formData.append('name', metadata.name)
    if (metadata.description)
      formData.append('description', metadata.description)

    formData.append('document_type', metadata.document_type)
    formData.append('related_entity_type', metadata.related_entity_type)
    formData.append('related_entity_id', metadata.related_entity_id)

    const response = await axios.post(`${this.baseUrl}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return response.data
  }

  async downloadDocument(id: string): Promise<Blob> {
    const response = await axios.get(`${this.baseUrl}/${id}/download`, {
      responseType: 'blob',
    })

    return response.data
  }

  async getDocumentsByEntity(entityType: string, entityId: string, params?: any): Promise<DocumentListResponse> {
    const response = await axios.get(`${this.baseUrl}/entity/${entityType}/${entityId}`, { params })

    return response.data
  }
}
