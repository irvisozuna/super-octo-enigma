/**
 * Shared Transport Module Exports
 *
 * Main entry point for shared functionality across the transport module
 */

// Domain Entities
export { DocumentDomain } from './domain/entities/DocumentEntity'
export type {
  DocumentEntity,
  EntityType,
  DocumentStatus,
  EntityTypeInfo,
  EntityTypesResponse,
  CreateDocumentRequest,
  UpdateDocumentRequest,
  DocumentSearchCriteria,
} from './domain/entities/DocumentEntity'

// Domain Types
export type {
  BaseEntity,
  PaginatedResponse,
  ApiResponse,
  ApiErrorResponse,
  EntityStatus,
  ConcessionType,
} from './domain/types'

// Repository Contracts
export type { DocumentRepository } from './domain/repositories/DocumentRepository'

// Infrastructure
export { HttpDocumentRepository } from './infrastructure/repositories/HttpDocumentRepository'

// Presentation Layer
export { useDocumentManager } from './presentation/composables/useDocumentManager'
export type { DocumentManager } from './presentation/composables/useDocumentManager'

// Components
export { default as DocumentUploadDialog } from './presentation/components/molecules/DocumentUploadDialog.vue'
export { default as DocumentManagerTab } from './presentation/components/organisms/DocumentManagerTab.vue'
