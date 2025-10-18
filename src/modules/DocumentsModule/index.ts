/**
 * Documents Module Main Entry Point
 *
 * Exports all public APIs from the module
 */

// Domain Layer
export * from './domain/entities/DocumentEntity'
export * from './domain/repositories/DocumentRepository'
export * from './domain/value-objects/DocumentMetadata'

// Application Layer
export * from './application/dtos/DocumentDtos'
export * from './application/mappers/DocumentMapper'
export * from './application/services/DocumentApplicationService'

// Infrastructure Layer
export * from './infrastructure/api/services/DocumentApiService'
export * from './infrastructure/persistence/repositories/DocumentRepositoryImpl'

// Presentation Layer
export * from './presentation/stores/documentStore'

// Shared
export * from './shared/types'
export * from './shared/contracts/INotificationService'

// Configuration
export * from './config/container'
export * from './config/routes'
export * from './config/menu'
export * from './config/permissions'

// Installer
export * from './installer'

// Views
export { default as DocumentList } from './presentation/views/DocumentList.vue'
export { default as DocumentCreate } from './presentation/views/DocumentCreate.vue'
export { default as DocumentDetail } from './presentation/views/DocumentDetail.vue'
export { default as DocumentEdit } from './presentation/views/DocumentEdit.vue'
export { default as DocumentVersions } from './presentation/views/DocumentVersions.vue'
export { default as DocumentShare } from './presentation/views/DocumentShare.vue'
export { default as DocumentAccessLogs } from './presentation/views/DocumentAccessLogs.vue'
export { default as DocumentStatistics } from './presentation/views/DocumentStatistics.vue'
export { default as DocumentSearch } from './presentation/views/DocumentSearch.vue'
export { default as DocumentTemplates } from './presentation/views/DocumentTemplates.vue'
export { default as DocumentBulkActions } from './presentation/views/DocumentBulkActions.vue'
export { default as DocumentBulkUpload } from './presentation/views/DocumentBulkUpload.vue'
export { default as DocumentBulkDownload } from './presentation/views/DocumentBulkDownload.vue'
export { default as DocumentBulkArchive } from './presentation/views/DocumentBulkArchive.vue'
export { default as DocumentBulkDelete } from './presentation/views/DocumentBulkDelete.vue'
export { default as DocumentBulkUpdate } from './presentation/views/DocumentBulkUpdate.vue'
export { default as DocumentBulkRestore } from './presentation/views/DocumentBulkRestore.vue'
export { default as DocumentBulkExport } from './presentation/views/DocumentBulkExport.vue'
export { default as DocumentBulkImport } from './presentation/views/DocumentBulkImport.vue'
export { default as DocumentBulkMove } from './presentation/views/DocumentBulkMove.vue'
export { default as DocumentBulkCopy } from './presentation/views/DocumentBulkCopy.vue'
export { default as DocumentBulkRename } from './presentation/views/DocumentBulkRename.vue'
export { default as DocumentBulkTag } from './presentation/views/DocumentBulkTag.vue'
export { default as DocumentPublicShare } from './presentation/views/DocumentPublicShare.vue'
export { default as DocumentPublicDownload } from './presentation/views/DocumentPublicDownload.vue'
