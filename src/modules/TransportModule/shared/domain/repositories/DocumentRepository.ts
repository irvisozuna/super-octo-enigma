/**
 * Document Repository Interface
 *
 * Defines the contract for document data access operations
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
} from '../entities/DocumentEntity'
import type { PaginatedResponse } from '../types'

export interface DocumentRepository {

  /**
   * Get available entity types and their document types
   */
  getEntityTypes(): Promise<EntityTypesResponse>

  /**
   * Get documents with pagination and filtering
   */
  findAll(criteria?: DocumentSearchCriteria, page?: number, limit?: number): Promise<PaginatedResponse<DocumentEntity>>

  /**
   * Get documents by entity
   */
  findByEntity(documentableId: string, entityType: EntityType): Promise<DocumentEntity[]>

  /**
   * Get a specific document by ID
   */
  findById(id: string): Promise<DocumentEntity | null>

  /**
   * Create a new document
   */
  create(data: CreateDocumentRequest): Promise<DocumentEntity>

  /**
   * Update an existing document
   */
  update(id: string, data: UpdateDocumentRequest): Promise<DocumentEntity>

  /**
   * Delete a document
   */
  delete(id: string): Promise<void>

  /**
   * Download document file
   */
  download(id: string): Promise<Blob>

  /**
   * Get document preview URL
   */
  getPreviewUrl(id: string): string

  /**
   * Bulk delete documents
   */
  bulkDelete(ids: string[]): Promise<void>

  /**
   * Update document status
   */
  updateStatus(id: string, status: string): Promise<DocumentEntity>

  /**
   * Get documents by type for an entity
   */
  findByEntityAndType(documentableId: string, entityType: EntityType, documentType: string): Promise<DocumentEntity[]>

  // Verification methods
  /**
   * Verify a document
   */
  verifyDocument(id: string, data: VerifyDocumentRequest): Promise<DocumentEntity>

  /**
   * Reject a document
   */
  rejectDocument(id: string, data: RejectDocumentRequest): Promise<DocumentEntity>

  /**
   * Mark document as pending validation
   */
  markPendingDocument(id: string, data: MarkPendingDocumentRequest): Promise<DocumentEntity>

  /**
   * Get documents pending verification
   */
  getPendingDocuments(): Promise<DocumentEntity[]>

  /**
   * Get verification history for a document
   */
  getVerificationHistory(id: string): Promise<{
    document_id: string
    document_title: string
    current_status: string
    is_verified: boolean
    verified_at?: string
    verified_by?: string
    validation_history: VerificationHistoryEntry[]
  }>
}
