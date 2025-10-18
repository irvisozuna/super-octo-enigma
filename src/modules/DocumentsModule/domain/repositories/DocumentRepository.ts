/**
 * Document Repository Interface
 *
 * Domain contract for document data access operations
 * This is a pure interface with no implementation dependencies
 */

import type {
  CreateDocumentRequest,
  DocumentEntity,
  DocumentFilter,
  DocumentSearchCriteria,
  DocumentShareLinkEntity,
  DocumentVersionEntity,
  UpdateDocumentRequest,
} from '../entities/DocumentEntity'
import type {
  ApiResponse,
  PaginatedResponse,
} from '../../shared/types'

export interface DocumentRepository {

  /**
   * Get paginated list of documents
   */
  findAll(filter?: DocumentFilter): Promise<PaginatedResponse<DocumentEntity>>

  /**
   * Find document by ID
   */
  findById(id: string): Promise<ApiResponse<DocumentEntity>>

  /**
   * Find documents by resource
   */
  findByResource(resourceType: string, resourceId: string, subtype?: string): Promise<ApiResponse<DocumentEntity[]>>

  /**
   * Create new document
   */
  create(data: CreateDocumentRequest): Promise<ApiResponse<DocumentEntity>>

  /**
   * Update existing document
   */
  update(id: string, data: Partial<UpdateDocumentRequest>): Promise<ApiResponse<DocumentEntity>>

  /**
   * Delete document (soft delete)
   */
  delete(id: string): Promise<void>

  /**
   * Search documents with criteria
   */
  search(criteria: DocumentSearchCriteria): Promise<PaginatedResponse<DocumentEntity>>

  /**
   * Get document statistics
   */
  getStatistics(): Promise<ApiResponse<DocumentStatistics>>

  /**
   * Check if document title is available for resource
   */
  isTitleAvailable(title: string, resourceType: string, resourceId: string, excludeId?: string): Promise<boolean>

  /**
   * Get documents by type
   */
  findByType(documentType: string): Promise<ApiResponse<DocumentEntity[]>>

  /**
   * Get documents by category
   */
  findByCategory(category: string): Promise<PaginatedResponse<DocumentEntity>>

  /**
   * Get documents by status
   */
  findByStatus(status: string): Promise<PaginatedResponse<DocumentEntity>>

  /**
   * Export documents data
   */
  export(filter?: DocumentFilter, format?: 'csv' | 'excel' | 'pdf'): Promise<Blob>

  // Document Versions Management
  /**
   * Get document versions
   */
  getVersions(documentId: string): Promise<ApiResponse<DocumentVersionEntity[]>>

  /**
   * Create new version
   */
  createVersion(documentId: string, file: File, changeDescription?: string): Promise<ApiResponse<DocumentVersionEntity>>

  /**
   * Restore to specific version
   */
  restoreVersion(documentId: string, versionId: string): Promise<ApiResponse<DocumentEntity>>

  /**
   * Delete document version
   */
  deleteVersion(documentId: string, versionId: string): Promise<void>

  // Share Links Management
  /**
   * Create share link
   */
  createShareLink(documentId: string, shareData: CreateShareLinkRequest): Promise<ApiResponse<DocumentShareLinkEntity>>

  /**
   * Get document share links
   */
  getShareLinks(documentId: string): Promise<ApiResponse<DocumentShareLinkEntity[]>>

  /**
   * Update share link
   */
  updateShareLink(documentId: string, shareLinkId: string, shareData: UpdateShareLinkRequest): Promise<ApiResponse<DocumentShareLinkEntity>>

  /**
   * Revoke share link
   */
  revokeShareLink(documentId: string, shareLinkId: string): Promise<void>

  /**
   * Get share link by token (public access)
   */
  getShareLinkByToken(token: string): Promise<ApiResponse<DocumentShareLinkEntity>>

  /**
   * Validate share link access
   */
  validateShareLinkAccess(token: string, password?: string, email?: string): Promise<ApiResponse<{ valid: boolean; reason?: string }>>

  /**
   * Record share link access
   */
  recordShareLinkAccess(token: string, action: string, metadata?: Record<string, any>): Promise<void>

  // Document Access
  /**
   * Download document
   */
  download(documentId: string): Promise<Blob>

  /**
   * Download document via share link
   */
  downloadViaShareLink(token: string, password?: string): Promise<Blob>

  /**
   * Get document preview
   */
  getPreview(documentId: string): Promise<Blob>

  // Metadata Templates
  /**
   * Get metadata templates
   */
  getMetadataTemplates(): Promise<ApiResponse<Record<string, MetadataTemplate>>>

  /**
   * Get specific metadata template
   */
  getMetadataTemplate(resourceType: string, subtype?: string): Promise<ApiResponse<MetadataTemplate>>

  // Bulk Operations
  /**
   * Bulk upload documents
   */
  bulkUpload(documents: CreateDocumentRequest[]): Promise<ApiResponse<DocumentEntity[]>>

  /**
   * Bulk delete documents
   */
  bulkDelete(documentIds: string[]): Promise<void>

  /**
   * Bulk update documents
   */
  bulkUpdate(updates: Array<{ id: string; data: Partial<UpdateDocumentRequest> }>): Promise<ApiResponse<DocumentEntity[]>>

  // Access Logs
  /**
   * Get document access logs
   */
  getAccessLogs(documentId: string): Promise<ApiResponse<DocumentAccessLogEntity[]>>

  /**
   * Record document access
   */
  recordAccess(documentId: string, action: string, metadata?: Record<string, any>): Promise<void>
}

// Additional interfaces for repository operations
export interface CreateShareLinkRequest {
  password?: string
  expires_at?: string
  max_downloads?: number
  permissions: string[]
  allowed_emails?: string[]
  notes?: string
}

export interface UpdateShareLinkRequest {
  password?: string
  expires_at?: string
  max_downloads?: number
  permissions?: string[]
  allowed_emails?: string[]
  notes?: string
}

export interface DocumentStatistics {
  total_documents: number
  documents_by_type: Record<string, number>
  documents_by_category: Record<string, number>
  documents_by_status: Record<string, number>
  total_size: number
  average_size: number
  recent_uploads: number
  active_share_links: number
  expired_share_links: number
}

export interface MetadataTemplate {
  name: string
  description: string
  fields: MetadataField[]
}

export interface MetadataField {
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'radio' | 'textarea' | 'url'
  required: boolean
  placeholder?: string
  options?: Array<{ value: string; label: string }>
  min?: number
  max?: number
  step?: number
  default?: any
  readonly?: boolean
  showIf?: Array<string | string | any>
}

export interface DocumentAccessLogEntity {
  id: string
  document_id: string
  user_id?: string
  action: string
  ip_address?: string
  user_agent?: string
  share_token?: string
  metadata?: Record<string, any>
  created_at: string
}
