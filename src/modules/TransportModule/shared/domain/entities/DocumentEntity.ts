/**
 * Document Domain Entity
 *
 * Core business entity for document management across all transport entities
 */

import type { BaseEntity } from '../types'

export type EntityType = 'holder' | 'concession' | 'driver' | 'vehicle' | 'fine' | 'payment' | 'insurance'

export type DocumentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'ACTIVE' | 'PENDING_VALIDATION' | 'REVOKED'

export interface DocumentEntity extends BaseEntity {

  // Backend Response Fields
  company_id?: string
  documentable_id: string
  entity_type?: EntityType // Will be inferred from context
  documentable_type?: string // Auto-mapped by backend

  // Document Information
  document_type: string
  folio?: string // Backend generates this
  title: string
  description?: string
  file_name?: string
  file_path?: string
  file_extension?: string
  file_size?: number
  mime_type?: string
  hash_integrity?: string

  // Document Details
  issue_date?: string
  expiration_date?: string
  issuing_authority?: string
  reference_number?: string
  status: DocumentStatus
  is_verified?: boolean
  verified_by?: string
  notes?: string
  validation_history?: any

  // Metadata
  metadata?: Record<string, any>

  // Backend Labels (computed fields)
  status_label?: string
  document_type_label?: string
  file_size_formatted?: string
  is_expired?: boolean
  days_until_expiration?: number
  download_url?: string
  documentable?: any

  // Timestamps (use actual API response names)
  uploaded_at?: string // Will map from created_at
  verified_at?: string
}

export interface EntityTypeInfo {
  label: string
  description: string
  document_types: string[]
}

export interface EntityTypesResponse {
  [key: string]: EntityTypeInfo
}

export interface CreateDocumentRequest {
  documentable_id: string
  entity_type: EntityType
  document_type: string
  title: string
  description?: string
  file: File
  metadata?: Record<string, any>
  issue_date?: string
  expiration_date?: string
  issuing_authority?: string
  reference_number?: string
  status?: DocumentStatus
  notes?: string
}

export interface UpdateDocumentRequest extends Partial<Omit<CreateDocumentRequest, 'file'>> {
  id: string
  file?: File
}

export interface DocumentSearchCriteria {
  documentable_id?: string
  entity_type?: EntityType
  document_type?: string
  status?: DocumentStatus
  search?: string
  from_date?: string
  to_date?: string
}

export interface VerifyDocumentRequest {
  notes?: string
  verification_notes?: string
}

export interface RejectDocumentRequest {
  rejection_reason: string
  notes?: string
}

export interface MarkPendingDocumentRequest {
  pending_reason: string
  notes?: string
}

export interface VerificationHistoryEntry {
  action: 'verified' | 'rejected' | 'pending'
  verified_by?: string
  verified_at?: string
  notes?: string
  rejection_reason?: string
  pending_reason?: string
  status_before?: DocumentStatus
  status_after?: DocumentStatus
}

/**
 * Document business rules and validations
 */
export class DocumentDomain {
  /**
   * Validate document data before creation/update
   */
  static validate(data: Partial<CreateDocumentRequest>): string[] {
    const errors: string[] = []

    // Required fields validation
    if (!data.documentable_id)
      errors.push('El ID de la entidad es requerido')

    if (!data.entity_type)
      errors.push('El tipo de entidad es requerido')

    if (!data.document_type?.trim())
      errors.push('El tipo de documento es requerido')

    if (!data.title?.trim())
      errors.push('El título del documento es requerido')

    if (!data.file && !data.id)
      errors.push('El archivo es requerido')

    // File size validation (10MB max)
    if (data.file && data.file.size > 10 * 1024 * 1024)
      errors.push('El archivo no puede ser mayor a 10MB')

    // Title length validation
    if (data.title && data.title.length < 3)
      errors.push('El título debe tener al menos 3 caracteres')

    if (data.title && data.title.length > 255)
      errors.push('El título no puede exceder 255 caracteres')

    // Date validations
    if (data.issue_date && data.expiration_date) {
      const issueDate = new Date(data.issue_date)
      const expirationDate = new Date(data.expiration_date)

      if (expirationDate <= issueDate)
        errors.push('La fecha de vencimiento debe ser posterior a la fecha de emisión')
    }

    return errors
  }

  /**
   * Check if document is expired
   */
  static isExpired(document: DocumentEntity): boolean {
    if (!document.expiration_date)
      return false

    const now = new Date()
    const expirationDate = new Date(document.expiration_date)

    return expirationDate < now
  }

  /**
   * Check if document is expiring soon (within 30 days)
   */
  static isExpiringSoon(document: DocumentEntity, daysThreshold = 30): boolean {
    if (!document.expiration_date)
      return false

    const now = new Date()
    const expirationDate = new Date(document.expiration_date)
    const thresholdDate = new Date(now.getTime() + (daysThreshold * 24 * 60 * 60 * 1000))

    return expirationDate <= thresholdDate && expirationDate > now
  }

  /**
   * Get document status color for UI
   */
  static getStatusColor(status: DocumentStatus): string {
    const colors = {
      PENDING: 'warning',
      APPROVED: 'success',
      REJECTED: 'error',
      EXPIRED: 'error',
      ACTIVE: 'success',
      PENDING_VALIDATION: 'info',
      REVOKED: 'error',
    }

    return colors[status] || 'default'
  }

  /**
   * Get document status label
   */
  static getStatusLabel(status: DocumentStatus): string {
    const labels = {
      PENDING: 'Pendiente',
      APPROVED: 'Aprobado',
      REJECTED: 'Rechazado',
      EXPIRED: 'Expirado',
      ACTIVE: 'Activo',
      PENDING_VALIDATION: 'Pendiente Validación',
      REVOKED: 'Revocado',
    }

    return labels[status] || status
  }

  /**
   * Check if document can be deleted
   */
  static canDelete(document: DocumentEntity): { canDelete: boolean; reason?: string } {
    // Cannot delete approved documents that are required
    if (document.status === 'APPROVED' && document.document_type === 'LICENCIA') {
      return {
        canDelete: false,
        reason: 'No se pueden eliminar documentos aprobados requeridos',
      }
    }

    return { canDelete: true }
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes?: number): string {
    if (!bytes)
      return '-'

    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))

    return `${Math.round(bytes / 1024 ** i * 100) / 100} ${sizes[i]}`
  }

  /**
   * Get file type icon
   */
  static getFileTypeIcon(mimeType?: string): string {
    if (!mimeType)
      return 'tabler-file'

    if (mimeType.includes('pdf'))
      return 'tabler-file-type-pdf'
    if (mimeType.includes('image'))
      return 'tabler-photo'
    if (mimeType.includes('word'))
      return 'tabler-file-word'
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet'))
      return 'tabler-file-spreadsheet'
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation'))
      return 'tabler-presentation'

    return 'tabler-file'
  }

  /**
   * Validate entity type
   */
  static isValidEntityType(entityType: string): entityType is EntityType {
    const validTypes: EntityType[] = ['holder', 'concession', 'driver', 'vehicle', 'fine', 'payment', 'insurance']

    return validTypes.includes(entityType as EntityType)
  }
}
