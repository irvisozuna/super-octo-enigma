/**
 * Document API Service
 *
 * Service for handling all API calls related to document management
 * Base URL: /document-management
 */

import type {
  CreateDocumentRequest,
  CreateShareLinkDto,
  DocumentAccessLog,
  DocumentEntity,
  DocumentFilterDto,
  DocumentMetadataTemplate,
  DocumentStatistics,
  DocumentVersion,
  ShareLink,
  UpdateDocumentRequest,
} from '../../../domain/entities/DocumentEntity'
import { rawApi } from '@/services/api'

export class DocumentApiService {
  private static readonly baseUrl = '/document-management'

  /**
   * Get all documents with filtering and pagination
   */
  static async getDocuments(filter: DocumentFilterDto = {}) {
    return await rawApi(this.baseUrl, {
      method: 'GET',
      params: filter,
    })
  }

  /**
   * Get document by ID
   */
  static async getDocumentById(id: string): Promise<{ data: DocumentEntity }> {
    return await rawApi(`${this.baseUrl}/${id}`, {
      method: 'GET',
    })
  }

  /**
   * Get documents by resource (polymorphic)
   */
  static async getDocumentsByResource(
    resourceType: string,
    resourceId: string,
    subtype?: string,
  ) {
    const params: Record<string, string> = {
      resource_type: resourceType,
      resource_id: resourceId,
    }

    if (subtype)
      params.resource_subtype = subtype

    return await rawApi(this.baseUrl, {
      method: 'GET',
      params,
    })
  }

  /**
   * Upload document with multipart/form-data
   */
  static async uploadDocument(formData: FormData): Promise<{ data: DocumentEntity }> {
    // For file uploads, we need to use fetch directly since rawApi doesn't handle FormData well
    const accessToken = useCookie('accessToken').value
    const companyId = useCookie('companyId').value

    const headers: HeadersInit = {}
    if (accessToken)
      headers['Authorization'] = `Bearer ${accessToken}`

    if (companyId)
      headers['X-Company-Id'] = companyId

    const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || ''
    const url = `${baseUrl}${this.baseUrl}`

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`)
    }

    return response.json()
  }

  /**
   * Create document metadata (without file upload)
   */
  static async createDocument(data: CreateDocumentRequest): Promise<{ data: DocumentEntity }> {
    return await rawApi(this.baseUrl, {
      method: 'POST',
      body: data,
    })
  }

  /**
   * Update document metadata
   */
  static async updateDocument(id: string, data: UpdateDocumentRequest): Promise<{ data: DocumentEntity }> {
    return await rawApi(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      body: data,
    })
  }

  /**
   * Delete document
   */
  static async deleteDocument(id: string): Promise<void> {
    return await rawApi(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    })
  }

  /**
   * Download document file
   */
  static async downloadDocument(id: string): Promise<Blob> {
    // For blob downloads, use fetch directly
    const accessToken = useCookie('accessToken').value
    const companyId = useCookie('companyId').value

    const headers: HeadersInit = {}
    if (accessToken)
      headers['Authorization'] = `Bearer ${accessToken}`

    if (companyId)
      headers['X-Company-Id'] = companyId

    const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || ''
    const url = `${baseUrl}${this.baseUrl}/${id}/download`

    const response = await fetch(url, { headers })

    if (!response.ok)
      throw new Error(`HTTP error! status: ${response.status}`)

    return response.blob()
  }

  /**
   * Search documents
   */
  static async searchDocuments(query: string) {
    return await rawApi(`${this.baseUrl}/search`, {
      method: 'GET',
      params: { q: query },
    })
  }

  /**
   * Get document versions
   */
  static async getDocumentVersions(id: string): Promise<{ data: DocumentVersion[] }> {
    return await rawApi(`${this.baseUrl}/${id}/versions`, {
      method: 'GET',
    })
  }

  /**
   * Restore to specific version
   */
  static async restoreToVersion(id: string, versionId: string): Promise<{ data: DocumentEntity }> {
    return await rawApi(`${this.baseUrl}/${id}/versions/${versionId}/restore`, {
      method: 'POST',
    })
  }

  /**
   * Delete document version
   */
  static async deleteDocumentVersion(id: string, versionId: string): Promise<void> {
    return await rawApi(`${this.baseUrl}/${id}/versions/${versionId}`, {
      method: 'DELETE',
    })
  }

  /**
   * Get document share links
   */
  static async getDocumentShareLinks(id: string): Promise<{ data: ShareLink[] }> {
    return await rawApi(`${this.baseUrl}/${id}/share-links`, {
      method: 'GET',
    })
  }

  /**
   * Create share link
   */
  static async createShareLink(id: string, shareData: CreateShareLinkDto): Promise<{ data: ShareLink }> {
    return await rawApi(`${this.baseUrl}/${id}/share-links`, {
      method: 'POST',
      body: shareData,
    })
  }

  /**
   * Update share link
   */
  static async updateShareLink(id: string, shareLinkId: string, shareData: Partial<CreateShareLinkDto>): Promise<{ data: ShareLink }> {
    return await rawApi(`${this.baseUrl}/${id}/share-links/${shareLinkId}`, {
      method: 'PUT',
      body: shareData,
    })
  }

  /**
   * Revoke share link
   */
  static async revokeShareLink(id: string, shareLinkId: string): Promise<void> {
    return await rawApi(`${this.baseUrl}/${id}/share-links/${shareLinkId}`, {
      method: 'DELETE',
    })
  }

  /**
   * Get shared document by token (public, no auth)
   */
  static async getSharedDocument(token: string): Promise<{ data: DocumentEntity }> {
    return await rawApi(`/shared/documents/${token}`, {
      method: 'GET',
    })
  }

  /**
   * Check shared document access (public, no auth)
   */
  static async checkSharedDocumentAccess(token: string): Promise<{ data: { requires_password: boolean; expires_at: string | null } }> {
    return await rawApi(`/shared/documents/${token}/check`, {
      method: 'GET',
    })
  }

  /**
   * Download shared document (public, may require password)
   */
  static async downloadSharedDocument(token: string, password?: string): Promise<Blob> {
    const accessToken = useCookie('accessToken').value
    const companyId = useCookie('companyId').value

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (accessToken)
      headers['Authorization'] = `Bearer ${accessToken}`

    if (companyId)
      headers['X-Company-Id'] = companyId

    const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || ''
    const url = `${baseUrl}/shared/documents/${token}/download`

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: password ? JSON.stringify({ password }) : undefined,
    })

    if (!response.ok)
      throw new Error(`HTTP error! status: ${response.status}`)

    return response.blob()
  }

  /**
   * Get document access logs
   */
  static async getDocumentAccessLogs(id: string): Promise<{ data: DocumentAccessLog[] }> {
    return await rawApi(`${this.baseUrl}/${id}/access-logs`, {
      method: 'GET',
    })
  }

  /**
   * Get document statistics
   */
  static async getDocumentStatistics(): Promise<{ data: DocumentStatistics }> {
    return await rawApi(`${this.baseUrl}/statistics`, {
      method: 'GET',
    })
  }

  /**
   * Get metadata templates
   */
  static async getMetadataTemplates(): Promise<{ data: DocumentMetadataTemplate[] }> {
    return await rawApi(`${this.baseUrl}/metadata-templates`, {
      method: 'GET',
    })
  }

  /**
   * Get metadata template by resource type and subtype
   */
  static async getMetadataTemplate(resourceType: string, subtype?: string): Promise<{ data: DocumentMetadataTemplate }> {
    const path = subtype
      ? `${this.baseUrl}/metadata-templates/${resourceType}/${subtype}`
      : `${this.baseUrl}/metadata-templates/${resourceType}`

    return await rawApi(path, {
      method: 'GET',
    })
  }

  /**
   * Create metadata template
   */
  static async createMetadataTemplate(template: Omit<DocumentMetadataTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: DocumentMetadataTemplate }> {
    return await rawApi(`${this.baseUrl}/metadata-templates`, {
      method: 'POST',
      body: template,
    })
  }

  /**
   * Update metadata template
   */
  static async updateMetadataTemplate(id: string, template: Partial<DocumentMetadataTemplate>): Promise<{ data: DocumentMetadataTemplate }> {
    return await rawApi(`${this.baseUrl}/metadata-templates/${id}`, {
      method: 'PUT',
      body: template,
    })
  }

  /**
   * Delete metadata template
   */
  static async deleteMetadataTemplate(id: string): Promise<void> {
    return await rawApi(`${this.baseUrl}/metadata-templates/${id}`, {
      method: 'DELETE',
    })
  }

  /**
   * Bulk delete documents
   */
  static async bulkDeleteDocuments(ids: string[]): Promise<void> {
    return await rawApi(`${this.baseUrl}/bulk/delete`, {
      method: 'POST',
      body: { ids },
    })
  }

  /**
   * Bulk archive documents
   */
  static async bulkArchiveDocuments(ids: string[]): Promise<void> {
    return await rawApi(`${this.baseUrl}/bulk/archive`, {
      method: 'POST',
      body: { ids },
    })
  }

  /**
   * Bulk restore documents
   */
  static async bulkRestoreDocuments(ids: string[]): Promise<void> {
    return await rawApi(`${this.baseUrl}/bulk/restore`, {
      method: 'POST',
      body: { ids },
    })
  }

  /**
   * Bulk update category
   */
  static async bulkUpdateCategory(ids: string[], category: string): Promise<void> {
    return await rawApi(`${this.baseUrl}/bulk/update-category`, {
      method: 'POST',
      body: { ids, category },
    })
  }

  /**
   * Bulk update tags
   */
  static async bulkUpdateTags(ids: string[], tags: string[]): Promise<void> {
    return await rawApi(`${this.baseUrl}/bulk/update-tags`, {
      method: 'POST',
      body: { ids, tags },
    })
  }

  /**
   * Bulk update access level
   */
  static async bulkUpdateAccessLevel(ids: string[], access_level: string): Promise<void> {
    return await rawApi(`${this.baseUrl}/bulk/update-access-level`, {
      method: 'POST',
      body: { ids, access_level },
    })
  }

  /**
   * Bulk download documents
   */
  static async bulkDownloadDocuments(ids: string[]): Promise<Blob> {
    const accessToken = useCookie('accessToken').value
    const companyId = useCookie('companyId').value

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (accessToken)
      headers['Authorization'] = `Bearer ${accessToken}`

    if (companyId)
      headers['X-Company-Id'] = companyId

    const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || ''
    const url = `${baseUrl}${this.baseUrl}/bulk/download`

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ids }),
    })

    if (!response.ok)
      throw new Error(`HTTP error! status: ${response.status}`)

    return response.blob()
  }

  /**
   * Get archived documents
   */
  static async getArchivedDocuments() {
    return await rawApi(`${this.baseUrl}/archived`, {
      method: 'GET',
    })
  }
}
