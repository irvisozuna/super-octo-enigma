/**
 * Document Application Service
 *
 * Orchestrates business operations and coordinates between layers
 * Implements use cases and handles cross-cutting concerns
 */

import type { DocumentRepository } from '../../domain/repositories/DocumentRepository'
import type {
  CreateDocumentRequest,
  CreateShareLinkRequest,
  DocumentEntity,
  DocumentFilter,
  DocumentSearchCriteria,
  DocumentStatistics,
  MetadataTemplate,
  UpdateDocumentRequest,
  UpdateShareLinkRequest,
} from '../../domain/entities/DocumentEntity'
import { DocumentDomain } from '../../domain/entities/DocumentEntity'
import { DocumentMetadata } from '../../domain/value-objects/DocumentMetadata'
import { DocumentMapper } from '../mappers/DocumentMapper'
import type { INotificationService } from '../../shared/contracts/INotificationService'
import type { PaginatedResponse } from '../../shared/types'

export class DocumentApplicationService {
  constructor(
    private documentRepository: DocumentRepository,
    private notificationService?: INotificationService,
  ) {}

  /**
   * Get documents with filtering and pagination
   */
  async getDocuments(filter?: DocumentFilter): Promise<PaginatedResponse<DocumentEntity>> {
    try {
      return await this.documentRepository.findAll(filter)
    }
    catch (error) {
      this.handleError('Error al obtener la lista de documentos', error)
      throw error
    }
  }

  /**
   * Get document by ID
   */
  async getDocumentById(id: string): Promise<DocumentEntity> {
    try {
      const response = await this.documentRepository.findById(id)

      return response.data
    }
    catch (error) {
      this.handleError('Error al obtener el documento', error)
      throw error
    }
  }

  /**
   * Get documents by resource
   */
  async getDocumentsByResource(resourceType: string, resourceId: string, subtype?: string): Promise<DocumentEntity[]> {
    try {
      const response = await this.documentRepository.findByResource(resourceType, resourceId, subtype)

      return response.data
    }
    catch (error) {
      this.handleError('Error al obtener documentos del recurso', error)
      throw error
    }
  }

  /**
   * Create new document with validation
   */
  async createDocument(data: CreateDocumentRequest): Promise<DocumentEntity> {
    try {
      // Domain validation
      const validationErrors = DocumentDomain.validate(data)
      if (validationErrors.length > 0)
        throw new Error(validationErrors.join(', '))

      // Validate metadata if provided
      if (data.metadata) {
        const metadataValidation = DocumentMetadata.validateForDocumentType(
          data.metadata,
          data.document_type,
          data.resource_type,
          data.resource_subtype,
        )

        if (metadataValidation.length > 0)
          throw new Error(`Errores en metadatos: ${metadataValidation.join(', ')}`)
      }

      // Check title availability for resource
      const isTitleAvailable = await this.documentRepository.isTitleAvailable(
        data.title,
        data.resource_type,
        data.resource_id,
      )

      if (!isTitleAvailable)
        throw new Error('Ya existe un documento con este título para este recurso')

      const response = await this.documentRepository.create(data)

      this.showSuccess('Documento creado correctamente')

      return response.data
    }
    catch (error) {
      this.handleError('Error al crear el documento', error)
      throw error
    }
  }

  /**
   * Update document with validation
   */
  async updateDocument(id: string, data: Partial<UpdateDocumentRequest>): Promise<DocumentEntity> {
    try {
      // Get current document for comparison
      const currentDocument = await this.getDocumentById(id)

      // Check if there are actual changes
      if (!DocumentDomain.hasChanges(currentDocument, data)) {
        this.showInfo('No hay cambios para guardar')

        return currentDocument
      }

      // Domain validation for updated fields
      const validationErrors = DocumentDomain.validate(data)
      if (validationErrors.length > 0)
        throw new Error(validationErrors.join(', '))

      // Validate metadata if provided
      if (data.metadata) {
        const metadataValidation = DocumentMetadata.validateForDocumentType(
          data.metadata,
          data.document_type || currentDocument.document_type,
          currentDocument.resource_type,
          data.resource_subtype || currentDocument.resource_subtype,
        )

        if (metadataValidation.length > 0)
          throw new Error(`Errores en metadatos: ${metadataValidation.join(', ')}`)
      }

      // Check title availability if changed
      if (data.title && data.title !== currentDocument.title) {
        const isAvailable = await this.documentRepository.isTitleAvailable(
          data.title,
          currentDocument.resource_type,
          currentDocument.resource_id,
          id,
        )

        if (!isAvailable)
          throw new Error('Ya existe un documento con este título para este recurso')
      }

      const response = await this.documentRepository.update(id, data)

      this.showSuccess('Documento actualizado correctamente')

      return response.data
    }
    catch (error) {
      this.handleError('Error al actualizar el documento', error)
      throw error
    }
  }

  /**
   * Delete document with business rules validation
   */
  async deleteDocument(id: string): Promise<void> {
    try {
      // Get document to check business rules
      const document = await this.getDocumentById(id)

      // Check if can be deleted
      const { canDelete, reason } = DocumentDomain.canDelete(document)
      if (!canDelete)
        throw new Error(reason)

      await this.documentRepository.delete(id)

      this.showSuccess('Documento eliminado correctamente')
    }
    catch (error) {
      this.handleError('Error al eliminar el documento', error)
      throw error
    }
  }

  /**
   * Search documents with criteria
   */
  async searchDocuments(criteria: DocumentSearchCriteria): Promise<PaginatedResponse<DocumentEntity>> {
    try {
      return await this.documentRepository.search(criteria)
    }
    catch (error) {
      this.handleError('Error al buscar documentos', error)
      throw error
    }
  }

  /**
   * Get document statistics
   */
  async getStatistics(): Promise<DocumentStatistics> {
    try {
      const response = await this.documentRepository.getStatistics()

      return response.data
    }
    catch (error) {
      this.handleError('Error al obtener estadísticas', error)
      throw error
    }
  }

  /**
   * Export documents data
   */
  async exportDocuments(filter?: DocumentFilter, format = 'excel'): Promise<Blob> {
    try {
      const blob = await this.documentRepository.export(filter, format as 'csv' | 'excel' | 'pdf')

      this.showSuccess('Exportación completada')

      return blob
    }
    catch (error) {
      this.handleError('Error al exportar datos', error)
      throw error
    }
  }

  // Document Versions Management
  /**
   * Get document versions
   */
  async getDocumentVersions(documentId: string) {
    try {
      const response = await this.documentRepository.getVersions(documentId)

      return response.data
    }
    catch (error) {
      this.handleError('Error al obtener versiones del documento', error)
      throw error
    }
  }

  /**
   * Create new document version
   */
  async createDocumentVersion(documentId: string, file: File, changeDescription?: string) {
    try {
      const response = await this.documentRepository.createVersion(documentId, file, changeDescription)

      this.showSuccess('Nueva versión creada correctamente')

      return response.data
    }
    catch (error) {
      this.handleError('Error al crear nueva versión', error)
      throw error
    }
  }

  /**
   * Restore to specific version
   */
  async restoreToVersion(documentId: string, versionId: string) {
    try {
      const response = await this.documentRepository.restoreVersion(documentId, versionId)

      this.showSuccess('Documento restaurado a la versión seleccionada')

      return response.data
    }
    catch (error) {
      this.handleError('Error al restaurar versión', error)
      throw error
    }
  }

  /**
   * Delete document version
   */
  async deleteDocumentVersion(documentId: string, versionId: string) {
    try {
      await this.documentRepository.deleteVersion(documentId, versionId)
      this.showSuccess('Versión eliminada correctamente')
    }
    catch (error) {
      this.handleError('Error al eliminar versión', error)
      throw error
    }
  }

  // Share Links Management
  /**
   * Create share link
   */
  async createShareLink(documentId: string, shareData: CreateShareLinkRequest) {
    try {
      // Get document to check if can be shared
      const document = await this.getDocumentById(documentId)
      const { canShare, reason } = DocumentDomain.canShare(document)
      if (!canShare)
        throw new Error(reason)

      const response = await this.documentRepository.createShareLink(documentId, shareData)

      this.showSuccess('Enlace de compartir creado correctamente')

      return response.data
    }
    catch (error) {
      this.handleError('Error al crear enlace de compartir', error)
      throw error
    }
  }

  /**
   * Get document share links
   */
  async getDocumentShareLinks(documentId: string) {
    try {
      const response = await this.documentRepository.getShareLinks(documentId)

      return response.data
    }
    catch (error) {
      this.handleError('Error al obtener enlaces de compartir', error)
      throw error
    }
  }

  /**
   * Update share link
   */
  async updateShareLink(documentId: string, shareLinkId: string, shareData: UpdateShareLinkRequest) {
    try {
      const response = await this.documentRepository.updateShareLink(documentId, shareLinkId, shareData)

      this.showSuccess('Enlace de compartir actualizado correctamente')

      return response.data
    }
    catch (error) {
      this.handleError('Error al actualizar enlace de compartir', error)
      throw error
    }
  }

  /**
   * Revoke share link
   */
  async revokeShareLink(documentId: string, shareLinkId: string) {
    try {
      await this.documentRepository.revokeShareLink(documentId, shareLinkId)
      this.showSuccess('Enlace de compartir revocado correctamente')
    }
    catch (error) {
      this.handleError('Error al revocar enlace de compartir', error)
      throw error
    }
  }

  /**
   * Get share link by token (public access)
   */
  async getShareLinkByToken(token: string) {
    try {
      const response = await this.documentRepository.getShareLinkByToken(token)

      return response.data
    }
    catch (error) {
      this.handleError('Error al obtener enlace de compartir', error)
      throw error
    }
  }

  /**
   * Validate share link access
   */
  async validateShareLinkAccess(token: string, password?: string, email?: string) {
    try {
      const response = await this.documentRepository.validateShareLinkAccess(token, password, email)

      return response.data
    }
    catch (error) {
      this.handleError('Error al validar acceso al enlace', error)
      throw error
    }
  }

  // Document Access
  /**
   * Download document
   */
  async downloadDocument(documentId: string): Promise<Blob> {
    try {
      const blob = await this.documentRepository.download(documentId)

      // Record access
      await this.documentRepository.recordAccess(documentId, 'download')

      return blob
    }
    catch (error) {
      this.handleError('Error al descargar documento', error)
      throw error
    }
  }

  /**
   * Download document via share link
   */
  async downloadDocumentViaShareLink(token: string, password?: string): Promise<Blob> {
    try {
      const blob = await this.documentRepository.downloadViaShareLink(token, password)

      // Record share link access
      await this.documentRepository.recordShareLinkAccess(token, 'download')

      return blob
    }
    catch (error) {
      this.handleError('Error al descargar documento', error)
      throw error
    }
  }

  /**
   * Get document preview
   */
  async getDocumentPreview(documentId: string): Promise<Blob> {
    try {
      const blob = await this.documentRepository.getPreview(documentId)

      // Record access
      await this.documentRepository.recordAccess(documentId, 'view')

      return blob
    }
    catch (error) {
      this.handleError('Error al obtener vista previa', error)
      throw error
    }
  }

  // Metadata Templates
  /**
   * Get metadata templates
   */
  async getMetadataTemplates() {
    try {
      const response = await this.documentRepository.getMetadataTemplates()

      return response.data
    }
    catch (error) {
      this.handleError('Error al obtener plantillas de metadatos', error)
      throw error
    }
  }

  /**
   * Get specific metadata template
   */
  async getMetadataTemplate(resourceType: string, subtype?: string) {
    try {
      const response = await this.documentRepository.getMetadataTemplate(resourceType, subtype)

      return response.data
    }
    catch (error) {
      this.handleError('Error al obtener plantilla de metadatos', error)
      throw error
    }
  }

  // Bulk Operations
  /**
   * Bulk upload documents
   */
  async bulkUploadDocuments(documents: CreateDocumentRequest[]) {
    try {
      const response = await this.documentRepository.bulkUpload(documents)

      this.showSuccess(`${documents.length} documentos subidos correctamente`)

      return response.data
    }
    catch (error) {
      this.handleError('Error al subir documentos en lote', error)
      throw error
    }
  }

  /**
   * Bulk delete documents
   */
  async bulkDeleteDocuments(documentIds: string[]) {
    try {
      await this.documentRepository.bulkDelete(documentIds)
      this.showSuccess(`${documentIds.length} documentos eliminados correctamente`)
    }
    catch (error) {
      this.handleError('Error al eliminar documentos en lote', error)
      throw error
    }
  }

  /**
   * Bulk update documents
   */
  async bulkUpdateDocuments(updates: Array<{ id: string; data: Partial<UpdateDocumentRequest> }>) {
    try {
      const response = await this.documentRepository.bulkUpdate(updates)

      this.showSuccess(`${updates.length} documentos actualizados correctamente`)

      return response.data
    }
    catch (error) {
      this.handleError('Error al actualizar documentos en lote', error)
      throw error
    }
  }

  // Access Logs
  /**
   * Get document access logs
   */
  async getDocumentAccessLogs(documentId: string) {
    try {
      const response = await this.documentRepository.getAccessLogs(documentId)

      return response.data
    }
    catch (error) {
      this.handleError('Error al obtener registros de acceso', error)
      throw error
    }
  }

  // Utility Methods
  /**
   * Validate document data without saving
   */
  validateDocumentData(data: Partial<CreateDocumentRequest>): string[] {
    return DocumentDomain.validate(data)
  }

  /**
   * Get document display name
   */
  getDocumentDisplayName(document: DocumentEntity): string {
    return DocumentDomain.getDisplayName(document)
  }

  /**
   * Check if document has expired share links
   */
  hasExpiredShareLinks(document: DocumentEntity): boolean {
    return DocumentDomain.hasExpiredShareLinks(document)
  }

  /**
   * Check if document has metadata
   */
  hasMetadata(document: DocumentEntity): boolean {
    return DocumentDomain.hasMetadata(document)
  }

  /**
   * Get document icon
   */
  getDocumentIcon(document: DocumentEntity): string {
    return DocumentDomain.getDocumentIcon(document)
  }

  /**
   * Calculate document age
   */
  calculateDocumentAge(document: DocumentEntity): number {
    return DocumentDomain.calculateAge(document)
  }

  /**
   * Check if document is recent
   */
  isDocumentRecent(document: DocumentEntity): boolean {
    return DocumentDomain.isRecent(document)
  }

  /**
   * Format metadata for display
   */
  formatMetadataForDisplay(metadata: Record<string, any>): Array<{ key: string; value: any; formatted: string }> {
    return DocumentMetadata.formatForDisplay(metadata)
  }

  /**
   * Check for expired metadata fields
   */
  checkExpiredMetadataFields(metadata: Record<string, any>): Array<{ field: string; expiryDate: string }> {
    return DocumentMetadata.hasExpiredFields(metadata)
  }

  /**
   * Check for expiring metadata fields
   */
  checkExpiringMetadataFields(metadata: Record<string, any>, daysAhead = 30): Array<{ field: string; expiryDate: string; daysUntil: number }> {
    return DocumentMetadata.hasExpiringFields(metadata, daysAhead)
  }

  // Private helper methods
  private showSuccess(message: string): void {
    this.notificationService?.success('Éxito', message)
  }

  private showInfo(message: string): void {
    this.notificationService?.info('Información', message)
  }

  private handleError(title: string, error: any): void {
    console.error(title, error)

    let message = 'Ha ocurrido un error inesperado'

    if (error?.response?.data?.message)
      message = error.response.data.message
    else if (error?.message)
      message = error.message

    this.notificationService?.error(title, message)
  }
}
