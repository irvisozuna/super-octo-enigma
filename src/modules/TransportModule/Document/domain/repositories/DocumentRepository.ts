/**
 * Document Repository Interface - Domain Layer
 *
 * Defines the contract for document data access operations
 */

import type { DocumentEntity, DocumentSearchCriteria } from '../entities/DocumentEntity'
import type { ApiResponse, DocumentFilter, EntityStatistics, PaginatedResponse } from '../../../shared/types'

export interface DocumentRepository {

  // Basic CRUD operations
  findAll(filter?: DocumentFilter): Promise<PaginatedResponse<DocumentEntity>>
  findById(id: string, include?: string): Promise<ApiResponse<DocumentEntity>>
  create(data: any): Promise<ApiResponse<DocumentEntity>>
  update(id: string, data: any): Promise<ApiResponse<DocumentEntity>>
  delete(id: string): Promise<void>

  // Search and filter operations
  search(criteria: DocumentSearchCriteria): Promise<PaginatedResponse<DocumentEntity>>

  // Business-specific operations
  findByDocumentNumber(documentNumber: string): Promise<ApiResponse<DocumentEntity>>
  findByOwnerType(ownerType: string): Promise<PaginatedResponse<DocumentEntity>>
  findByOwnerId(ownerId: string): Promise<PaginatedResponse<DocumentEntity>>
  findExpiringDocuments(days?: number): Promise<PaginatedResponse<DocumentEntity>>
  findByDocumentType(documentType: string): Promise<PaginatedResponse<DocumentEntity>>

  // File operations
  uploadDocument(data: any): Promise<ApiResponse<DocumentEntity>>
  downloadDocument(id: string): Promise<Blob>
  verifyDocument(id: string): Promise<ApiResponse<any>>

  // Statistics and reporting
  getStatistics(): Promise<ApiResponse<EntityStatistics>>

  // Export operations
  export(filter?: DocumentFilter, format?: 'csv' | 'excel' | 'pdf'): Promise<Blob>
}
