/**
 * HTTP Document Repository Implementation
 *
 * Implements document operations using HTTP API calls
 */

import type {
  CreateDocumentRequest,
  DocumentEntity,
  DocumentSearchCriteria,
  EntityType,
  EntityTypesResponse,
  MarkPendingDocumentRequest,
  RejectDocumentRequest,
  UpdateDocumentRequest,
  VerificationHistoryEntry,
  VerifyDocumentRequest,
} from '../../domain/entities/DocumentEntity'
import type { DocumentRepository } from '../../domain/repositories/DocumentRepository'
import type { PaginatedResponse } from '../../domain/types'
import { rawApi } from '@/services/api'

export class HttpDocumentRepository implements DocumentRepository {
  private readonly baseUrl = '/transport/documents'

  async getEntityTypes(): Promise<EntityTypesResponse> {
    const response = await rawApi(`${this.baseUrl}/entity-types`)
    return response.data
  }

  async findAll(
    criteria?: DocumentSearchCriteria,
    page = 1,
    limit = 15,
  ): Promise<PaginatedResponse<DocumentEntity>> {
    const params: Record<string, string> = {
      page: page.toString(),
      limit: limit.toString(),
    }

    if (criteria) {
      if (criteria.documentable_id)
        params.documentable_id = criteria.documentable_id
      if (criteria.entity_type)
        params.entity_type = criteria.entity_type
      if (criteria.document_type)
        params.document_type = criteria.document_type
      if (criteria.status)
        params.status = criteria.status
      if (criteria.search)
        params.search = criteria.search
      if (criteria.from_date)
        params.from_date = criteria.from_date
      if (criteria.to_date)
        params.to_date = criteria.to_date
    }

    return await rawApi(this.baseUrl, {
      method: 'GET',
      params,
    })
  }

  async findByEntity(documentableId: string, entityType: EntityType): Promise<DocumentEntity[]> {
    console.log('🔍 Fetching documents for entity:', { documentableId, entityType })

    const params = {
      documentable_id: documentableId,
      entity_type: entityType,
    }

    console.log('📤 Sending params to API:', params)

    const response = await rawApi(this.baseUrl, {
      method: 'GET',
      params,
    })

    console.log('📥 API response:', response)

    // API returns { data: [...], links: {...}, meta: {...} } format
    // Map the response to add missing entity_type and uploaded_at
    const documents = response.data || []

    console.log('📋 Filtered documents count:', documents.length)
    console.log('📋 Documents:', documents.map(doc => ({ id: doc.id, title: doc.title, documentable_id: doc.documentable_id, entity_type: doc.entity_type })))

    return documents.map((doc: any) => ({
      ...doc,
      entity_type: entityType, // Add the entity type from context
      uploaded_at: doc.created_at, // Map created_at to uploaded_at
    }))
  }

  async findById(id: string): Promise<DocumentEntity | null> {
    try {
      return await rawApi(`${this.baseUrl}/${id}`)
    }
    catch (error: any) {
      if (error.status === 404)
        return null

      throw error
    }
  }

  async create(data: CreateDocumentRequest): Promise<DocumentEntity> {
    const formData = new FormData()

    // Add required fields
    formData.append('documentable_id', data.documentable_id)
    formData.append('entity_type', data.entity_type)
    formData.append('document_type', data.document_type)
    formData.append('title', data.title)
    formData.append('file', data.file)

    // Add optional fields
    if (data.description)
      formData.append('description', data.description)
    if (data.issue_date)
      formData.append('issue_date', data.issue_date)
    if (data.expiration_date)
      formData.append('expiration_date', data.expiration_date)
    if (data.issuing_authority)
      formData.append('issuing_authority', data.issuing_authority)
    if (data.reference_number)
      formData.append('reference_number', data.reference_number)
    if (data.status)
      formData.append('status', data.status)
    if (data.notes)
      formData.append('notes', data.notes)
    if (data.metadata)
      formData.append('metadata', JSON.stringify(data.metadata))

    const response = await rawApi(this.baseUrl, {
      method: 'POST',
      body: formData,
    })

    // Map the created document response
    return {
      ...response,
      entity_type: data.entity_type,
      uploaded_at: response.created_at,
    }
  }

  async update(id: string, data: UpdateDocumentRequest): Promise<DocumentEntity> {
    const formData = new FormData()

    // Add fields that can be updated
    if (data.document_type)
      formData.append('document_type', data.document_type)
    if (data.title)
      formData.append('title', data.title)
    if (data.description !== undefined)
      formData.append('description', data.description)
    if (data.issue_date !== undefined)
      formData.append('issue_date', data.issue_date || '')
    if (data.expiration_date !== undefined)
      formData.append('expiration_date', data.expiration_date || '')
    if (data.issuing_authority !== undefined)
      formData.append('issuing_authority', data.issuing_authority || '')
    if (data.reference_number !== undefined)
      formData.append('reference_number', data.reference_number || '')
    if (data.status)
      formData.append('status', data.status)
    if (data.notes !== undefined)
      formData.append('notes', data.notes || '')
    if (data.metadata)
      formData.append('metadata', JSON.stringify(data.metadata))
    if (data.file)
      formData.append('file', data.file)

    // Use POST with _method override for file uploads
    formData.append('_method', 'PUT')

    return await rawApi(`${this.baseUrl}/${id}`, {
      method: 'POST',
      body: formData,
    })
  }

  async delete(id: string): Promise<void> {
    await rawApi(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    })
  }

  async download(id: string): Promise<Blob> {
    return await rawApi(`${this.baseUrl}/${id}/download`, {
      method: 'GET',
      responseType: 'blob',
    })
  }

  getPreviewUrl(id: string): string {
    return `${this.baseUrl}/${id}/preview`
  }

  async bulkDelete(ids: string[]): Promise<void> {
    await rawApi(`${this.baseUrl}/bulk-delete`, {
      method: 'POST',
      body: { ids },
    })
  }

  async updateStatus(id: string, status: string): Promise<DocumentEntity> {
    return await rawApi(`${this.baseUrl}/${id}/status`, {
      method: 'PATCH',
      body: { status },
    })
  }

  async findByEntityAndType(
    documentableId: string,
    entityType: EntityType,
    documentType: string,
  ): Promise<DocumentEntity[]> {
    const params = {
      documentable_id: documentableId,
      entity_type: entityType,
      document_type: documentType,
    }

    const response = await rawApi(this.baseUrl, {
      method: 'GET',
      params,
    })

    return response.data
  }

  // Verification methods
  async verifyDocument(id: string, data: VerifyDocumentRequest): Promise<DocumentEntity> {
    return await rawApi(`${this.baseUrl}/${id}/verify`, {
      method: 'POST',
      body: data,
    })
  }

  async rejectDocument(id: string, data: RejectDocumentRequest): Promise<DocumentEntity> {
    return await rawApi(`${this.baseUrl}/${id}/reject`, {
      method: 'POST',
      body: data,
    })
  }

  async markPendingDocument(id: string, data: MarkPendingDocumentRequest): Promise<DocumentEntity> {
    return await rawApi(`${this.baseUrl}/${id}/pending`, {
      method: 'POST',
      body: data,
    })
  }

  async getPendingDocuments(): Promise<DocumentEntity[]> {
    const response = await rawApi(`${this.baseUrl}/pending-verification`, {
      method: 'GET',
    })

    return response.data || []
  }

  async getVerificationHistory(id: string): Promise<{
    document_id: string
    document_title: string
    current_status: string
    is_verified: boolean
    verified_at?: string
    verified_by?: string
    validation_history: VerificationHistoryEntry[]
  }> {
    return await rawApi(`${this.baseUrl}/${id}/verification-history`, {
      method: 'GET',
    })
  }
}
