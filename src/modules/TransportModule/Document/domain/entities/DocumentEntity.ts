/**
 * Document Domain Entity
 *
 * Core business entity representing a document in the transport system
 */

import type { BaseEntity, DocumentType, EntityStatus } from '../../../shared/types'

export interface DocumentEntity extends BaseEntity {

  // Basic Information
  name: string
  type: DocumentType
  description?: string

  // File Information
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  mime_type: string

  // Relationships
  entity_type: string // 'vehicle', 'driver', 'concession', 'fine', etc.
  entity_id: string

  // Metadata
  upload_date: string
  expiration_date?: string
  issue_date?: string
  document_number?: string
  issuing_authority?: string

  // File Details
  checksum?: string
  download_count: number
  last_download_date?: string

  // Status and Control
  status: EntityStatus
  is_verified: boolean
  is_expired: boolean
  is_required: boolean
  is_sensitive: boolean

  // Version Control
  version: number
  parent_document_id?: string
  replacement_document_id?: string

  // Access Control
  access_level: 'PUBLIC' | 'PRIVATE' | 'RESTRICTED'
  allowed_roles?: string[]

  // Additional Information
  notes?: string
  tags?: string[]

  // Relationship IDs
  company_id: string
  uploaded_by: string

  // Computed Fields (from API)
  days_until_expiration?: number
  file_size_formatted?: string
  is_image?: boolean
  is_pdf?: boolean
  thumbnail_url?: string

  // Relationships (when included)
  uploader?: any
  related_entity?: any
  versions?: any[]
  downloads?: any[]
}

export interface CreateDocumentRequest {
  name: string
  type: DocumentType
  description?: string
  entity_type: string
  entity_id: string
  file: File | string // File object or file path
  expiration_date?: string
  issue_date?: string
  document_number?: string
  issuing_authority?: string
  is_required: boolean
  is_sensitive: boolean
  access_level: 'PUBLIC' | 'PRIVATE' | 'RESTRICTED'
  allowed_roles?: string[]
  notes?: string
  tags?: string[]
  status: EntityStatus
}

export interface UpdateDocumentRequest extends Partial<Omit<CreateDocumentRequest, 'file'>> {
  id: string
  file?: File | string
}

export interface DocumentSearchCriteria {
  name?: string
  type?: DocumentType
  entity_type?: string
  entity_id?: string
  status?: EntityStatus
  is_expired?: boolean
  is_required?: boolean
  is_sensitive?: boolean
  access_level?: 'PUBLIC' | 'PRIVATE' | 'RESTRICTED'
  upload_date_from?: string
  upload_date_to?: string
  expiration_date_from?: string
  expiration_date_to?: string
  file_type?: string
  tags?: string[]
  uploaded_by?: string
}

/**
 * Document business rules and validations
 */
export class DocumentDomain {
  // Maximum file size in bytes (50MB)
  static readonly MAX_FILE_SIZE = 50 * 1024 * 1024

  // Allowed file types
  static readonly ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
  ]

  /**
   * Validate document data before creation/update
   */
  static validate(data: Partial<CreateDocumentRequest>): string[] {
    const errors: string[] = []

    // Required fields validation
    if (!data.name?.trim())
      errors.push('El nombre del documento es requerido')

    if (!data.type)
      errors.push('El tipo de documento es requerido')

    if (!data.entity_type?.trim())
      errors.push('El tipo de entidad es requerido')

    if (!data.entity_id?.trim())
      errors.push('El ID de la entidad es requerido')

    if (!data.access_level)
      errors.push('El nivel de acceso es requerido')

    // File validation (if file is provided)
    if (data.file instanceof File) {
      const fileErrors = this.validateFile(data.file)

      errors.push(...fileErrors)
    }

    // Business rules validation
    if (data.name && data.name.length < 3)
      errors.push('El nombre debe tener al menos 3 caracteres')

    if (data.name && data.name.length > 255)
      errors.push('El nombre no puede exceder 255 caracteres')

    if (data.description && data.description.length > 1000)
      errors.push('La descripción no puede exceder 1000 caracteres')

    if (data.document_number && data.document_number.length > 50)
      errors.push('El número de documento no puede exceder 50 caracteres')

    // Date validations
    if (data.issue_date && data.expiration_date) {
      const issueDate = new Date(data.issue_date)
      const expirationDate = new Date(data.expiration_date)

      if (expirationDate <= issueDate)
        errors.push('La fecha de expiración debe ser posterior a la fecha de emisión')
    }

    if (data.expiration_date) {
      const expirationDate = new Date(data.expiration_date)
      const today = new Date()

      if (expirationDate <= today)
        errors.push('La fecha de expiración debe ser futura')
    }

    // Access control validation
    if (data.access_level === 'RESTRICTED' && (!data.allowed_roles || data.allowed_roles.length === 0))
      errors.push('Los roles permitidos son requeridos para documentos restringidos')

    // Tags validation
    if (data.tags && data.tags.length > 10)
      errors.push('No se pueden asignar más de 10 etiquetas')

    return errors
  }

  /**
   * Validate file before upload
   */
  static validateFile(file: File): string[] {
    const errors: string[] = []

    // File size validation
    if (file.size > this.MAX_FILE_SIZE)
      errors.push(`El archivo no puede exceder ${this.formatFileSize(this.MAX_FILE_SIZE)}`)

    if (file.size === 0)
      errors.push('El archivo está vacío')

    // File type validation
    if (!this.ALLOWED_MIME_TYPES.includes(file.type))
      errors.push('Tipo de archivo no permitido')

    // File name validation
    if (!file.name || file.name.trim().length === 0)
      errors.push('El nombre del archivo es requerido')

    if (file.name.length > 255)
      errors.push('El nombre del archivo no puede exceder 255 caracteres')

    // Check for potentially dangerous file extensions
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.com', '.scr', '.vbs', '.js']
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))

    if (dangerousExtensions.includes(fileExtension))
      errors.push('Extensión de archivo no permitida por seguridad')

    return errors
  }

  /**
   * Calculate days until expiration
   */
  static daysUntilExpiration(expirationDate?: string): number {
    if (!expirationDate)
      return 0

    const expDate = new Date(expirationDate)
    const now = new Date()
    const diffTime = expDate.getTime() - now.getTime()

    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Check if document is expired
   */
  static isExpired(expirationDate?: string): boolean {
    if (!expirationDate)
      return false

    const expDate = new Date(expirationDate)
    const now = new Date()

    return expDate <= now
  }

  /**
   * Check if document is expiring soon (within days)
   */
  static isExpiringSoon(expirationDate?: string, days = 30): boolean {
    const daysUntil = this.daysUntilExpiration(expirationDate)

    return daysUntil <= days && daysUntil >= 0
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0)
      return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
  }

  /**
   * Get document type label
   */
  static getTypeLabel(type: DocumentType): string {
    const labels = {
      LICENSE: 'Licencia',
      REGISTRATION: 'Registro',
      INSURANCE: 'Seguro',
      INSPECTION: 'Inspección',
      PERMIT: 'Permiso',
      CONTRACT: 'Contrato',
      INVOICE: 'Factura',
      RECEIPT: 'Recibo',
      PHOTO: 'Fotografía',
      CERTIFICATE: 'Certificado',
      REPORT: 'Reporte',
      OTHER: 'Otro',
    }

    return labels[type] || type
  }

  /**
   * Check if file is an image
   */
  static isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/')
  }

  /**
   * Check if file is a PDF
   */
  static isPdf(mimeType: string): boolean {
    return mimeType === 'application/pdf'
  }

  /**
   * Get file icon based on mime type
   */
  static getFileIcon(mimeType: string): string {
    if (this.isImage(mimeType))
      return 'mdi-file-image'
    if (this.isPdf(mimeType))
      return 'mdi-file-pdf-box'
    if (mimeType.includes('word'))
      return 'mdi-file-word'
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet'))
      return 'mdi-file-excel'
    if (mimeType.includes('text'))
      return 'mdi-file-document'

    return 'mdi-file'
  }

  /**
   * Get status color
   */
  static getStatusColor(document: DocumentEntity): string {
    if (document.is_expired)
      return '#DC2626' // Red
    if (document.is_expiring_soon)
      return '#EAB308' // Yellow
    if (document.status === 'ACTIVE')
      return '#16A34A' // Green
    if (!document.is_verified)
      return '#F97316' // Orange

    return '#6B7280' // Gray
  }

  /**
   * Check if document can be deleted (business rules)
   */
  static canDelete(document: DocumentEntity): { canDelete: boolean; reason?: string } {
    // Cannot delete required documents
    if (document.is_required) {
      return {
        canDelete: false,
        reason: 'No se puede eliminar un documento requerido',
      }
    }

    // Cannot delete if referenced by other entities
    if (document.replacement_document_id) {
      return {
        canDelete: false,
        reason: 'No se puede eliminar un documento que ha sido reemplazado',
      }
    }

    return { canDelete: true }
  }

  /**
   * Check if document can be downloaded
   */
  static canDownload(document: DocumentEntity, userRoles: string[] = []): boolean {
    if (document.status !== 'ACTIVE')
      return false

    switch (document.access_level) {
      case 'PUBLIC':
        return true
      case 'PRIVATE':
        return false
      case 'RESTRICTED':
        return document.allowed_roles?.some(role => userRoles.includes(role)) || false
      default:
        return false
    }
  }

  /**
   * Check if document can be replaced
   */
  static canReplace(document: DocumentEntity): boolean {
    return document.status === 'ACTIVE' && !document.replacement_document_id
  }

  /**
   * Generate document version number
   */
  static generateVersionNumber(currentVersion: number): number {
    return currentVersion + 1
  }

  /**
   * Check if document data has changed
   */
  static hasChanges(original: DocumentEntity, updated: Partial<DocumentEntity>): boolean {
    const fieldsToCompare = [
      'name',
      'type',
      'description',
      'expiration_date',
      'issue_date',
      'document_number',
      'issuing_authority',
      'access_level',
      'allowed_roles',
      'notes',
      'tags',
      'status',
      'is_required',
      'is_sensitive',
    ]

    return fieldsToCompare.some(field => {
      const originalValue = original[field as keyof DocumentEntity]
      const updatedValue = updated[field as keyof DocumentEntity]

      // Handle array comparison
      if (Array.isArray(originalValue) && Array.isArray(updatedValue))
        return JSON.stringify(originalValue.sort()) !== JSON.stringify(updatedValue.sort())

      return originalValue !== updatedValue
    })
  }

  /**
   * Format document display name
   */
  static getDisplayName(document: DocumentEntity): string {
    if (document.document_number)
      return `${document.name} (${document.document_number})`

    return document.name
  }

  /**
   * Get document summary for lists
   */
  static getSummary(document: DocumentEntity): string {
    const parts = [
      this.getTypeLabel(document.type),
      document.file_size_formatted || this.formatFileSize(document.file_size),
    ]

    if (document.expiration_date) {
      const daysUntil = this.daysUntilExpiration(document.expiration_date)
      if (daysUntil < 0)
        parts.push('Expirado')
      else if (daysUntil <= 30)
        parts.push(`Expira en ${daysUntil} días`)
    }

    return parts.join(' • ')
  }

  /**
   * Validate entity type
   */
  static isValidEntityType(entityType: string): boolean {
    const validTypes = ['vehicle', 'driver', 'concession', 'concession_holder', 'fine']

    return validTypes.includes(entityType)
  }

  /**
   * Get security level badge
   */
  static getSecurityBadge(document: DocumentEntity): { text: string; color: string } {
    if (document.is_sensitive)
      return { text: 'Confidencial', color: '#DC2626' }

    switch (document.access_level) {
      case 'PUBLIC':
        return { text: 'Público', color: '#16A34A' }
      case 'PRIVATE':
        return { text: 'Privado', color: '#EAB308' }
      case 'RESTRICTED':
        return { text: 'Restringido', color: '#F97316' }
      default:
        return { text: 'Desconocido', color: '#6B7280' }
    }
  }

  /**
   * Check if document needs verification
   */
  static needsVerification(document: DocumentEntity): boolean {
    return !document.is_verified && document.is_required
  }

  /**
   * Get file extension from filename
   */
  static getFileExtension(filename: string): string {
    return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase()
  }

  /**
   * Check if file extension matches mime type
   */
  static validateFileExtension(filename: string, mimeType: string): boolean {
    const extension = this.getFileExtension(filename)

    const extensionMimeMap: Record<string, string[]> = {
      pdf: ['application/pdf'],
      jpg: ['image/jpeg'],
      jpeg: ['image/jpeg'],
      png: ['image/png'],
      gif: ['image/gif'],
      webp: ['image/webp'],
      doc: ['application/msword'],
      docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      xls: ['application/vnd.ms-excel'],
      xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      txt: ['text/plain'],
      csv: ['text/csv'],
    }

    const allowedMimeTypes = extensionMimeMap[extension]

    return allowedMimeTypes ? allowedMimeTypes.includes(mimeType) : false
  }
}
