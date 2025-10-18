/**
 * Document Domain Entity
 *
 * Core business entity representing a document with domain logic
 * Following DDD principles and Clean Architecture
 */

import type { BaseEntity } from '../../shared/types'

export interface DocumentEntity extends BaseEntity {

  // Basic Information
  title: string
  description?: string
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  file_extension: string

  // Resource Association (Polymorphic)
  resource_type: string
  resource_id: string
  resource_subtype?: string

  // Document Classification
  document_type: DocumentType
  category: DocumentCategory
  tags: string[]

  // Metadata (Flexible JSON)
  metadata: Record<string, any>

  // Access Control
  is_public: boolean
  is_encrypted: boolean
  access_level: DocumentAccessLevel

  // Version Control
  version: number
  parent_document_id?: string
  is_latest_version: boolean

  // Status
  status: DocumentStatus

  // Audit
  uploaded_by: string
  uploaded_by_user?: {
    id: string
    name: string
    email: string
  }

  // Computed Fields
  file_size_formatted: string
  is_image: boolean
  is_pdf: boolean
  is_office_document: boolean

  // Relations (loaded separately)
  versions?: DocumentVersionEntity[]
  share_links?: DocumentShareLinkEntity[]
  access_logs?: DocumentAccessLogEntity[]
}

export interface DocumentVersionEntity extends BaseEntity {
  document_id: string
  version_number: number
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  change_description?: string
  created_by: string
  is_current: boolean
}

export interface DocumentShareLinkEntity extends BaseEntity {
  document_id: string
  share_token: string
  share_url: string
  password?: string
  expires_at?: string
  max_downloads?: number
  download_count: number
  permissions: ShareLinkPermission[]
  allowed_emails?: string[]
  is_active: boolean
  created_by: string
  notes?: string
}

export interface DocumentAccessLogEntity extends BaseEntity {
  document_id: string
  user_id?: string
  action: AccessAction
  ip_address?: string
  user_agent?: string
  share_token?: string
  metadata?: Record<string, any>
}

// Enums and Types
export type DocumentType =
  | 'contract'
  | 'invoice'
  | 'report'
  | 'image'
  | 'certificate'
  | 'permit'
  | 'blueprint'
  | 'spreadsheet'
  | 'presentation'
  | 'legal'
  | 'financial'
  | 'technical'
  | 'other'

export type DocumentCategory =
  | 'legal'
  | 'financial'
  | 'technical'
  | 'administrative'
  | 'operational'
  | 'compliance'
  | 'hr'
  | 'marketing'
  | 'confidential'
  | 'general'

export type DocumentStatus =
  | 'draft'
  | 'active'
  | 'archived'
  | 'deleted'

export type DocumentAccessLevel =
  | 'public'
  | 'internal'
  | 'confidential'
  | 'restricted'

export type ShareLinkPermission =
  | 'view'
  | 'download'
  | 'print'

export type AccessAction =
  | 'view'
  | 'download'
  | 'upload'
  | 'update'
  | 'delete'
  | 'share'
  | 'revoke'

// Request interfaces for creating/updating documents
export interface CreateDocumentRequest {
  title: string
  description?: string
  resource_type: string
  resource_id: string
  resource_subtype?: string
  document_type: DocumentType
  category: DocumentCategory
  tags?: string[]
  metadata?: Record<string, any>
  is_public?: boolean
  access_level?: DocumentAccessLevel
  file: File
}

export interface UpdateDocumentRequest extends Partial<CreateDocumentRequest> {
  id: string
  change_description?: string
}

export interface DocumentSearchCriteria {
  title?: string
  document_type?: DocumentType
  category?: DocumentCategory
  resource_type?: string
  resource_id?: string
  resource_subtype?: string
  status?: DocumentStatus
  tags?: string[]
  uploaded_by?: string
  date_from?: string
  date_to?: string
}

export interface DocumentFilter {
  title?: string
  document_type?: DocumentType
  category?: DocumentCategory
  resource_type?: string
  resource_subtype?: string
  status?: DocumentStatus
  tags?: string[]
  uploaded_by?: string
  date_from?: string
  date_to?: string
  page?: number
  per_page?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  search?: string
}

/**
 * Document Domain Logic
 *
 * Business rules and validations for documents
 */
export class DocumentDomain {
  /**
   * Validate document data before creation/update
   */
  static validate(data: Partial<CreateDocumentRequest>): string[] {
    const errors: string[] = []

    // Required fields validation
    if (!data.title?.trim())
      errors.push('El título del documento es requerido')

    if (!data.resource_type?.trim())
      errors.push('El tipo de recurso es requerido')

    if (!data.resource_id?.trim())
      errors.push('El ID del recurso es requerido')

    if (!data.document_type)
      errors.push('El tipo de documento es requerido')

    if (!data.category)
      errors.push('La categoría del documento es requerida')

    if (!data.file)
      errors.push('El archivo es requerido')

    // Business rules validation
    if (data.title && data.title.length > 255)
      errors.push('El título no puede exceder 255 caracteres')

    if (data.description && data.description.length > 1000)
      errors.push('La descripción no puede exceder 1000 caracteres')

    // File validation
    if (data.file) {
      const maxSize = 100 * 1024 * 1024 // 100MB
      if (data.file.size > maxSize)
        errors.push('El archivo no puede exceder 100MB')

      if (data.file.size === 0)
        errors.push('El archivo no puede estar vacío')

      // Validate file extension
      const allowedExtensions = DocumentDomain.getAllowedExtensions(data.document_type)
      const fileExtension = data.file.name.split('.').pop()?.toLowerCase()

      if (fileExtension && !allowedExtensions.includes(fileExtension))
        errors.push(`Tipo de archivo no permitido para ${data.document_type}. Extensiones permitidas: ${allowedExtensions.join(', ')}`)
    }

    // Resource type validation
    if (data.resource_type && !DocumentDomain.isValidResourceType(data.resource_type))
      errors.push('Tipo de recurso no válido')

    // Metadata validation
    if (data.metadata && typeof data.metadata !== 'object')
      errors.push('Los metadatos deben ser un objeto válido')

    return errors
  }

  /**
   * Get allowed file extensions for document type
   */
  static getAllowedExtensions(documentType: DocumentType): string[] {
    const extensions = {
      contract: ['pdf', 'docx', 'doc'],
      invoice: ['pdf', 'xml'],
      report: ['pdf', 'xlsx', 'xls', 'docx'],
      image: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'],
      certificate: ['pdf'],
      permit: ['pdf'],
      blueprint: ['pdf', 'dwg', 'dxf'],
      spreadsheet: ['xlsx', 'xls', 'csv'],
      presentation: ['pptx', 'ppt', 'pdf'],
      legal: ['pdf', 'docx'],
      financial: ['pdf', 'xlsx', 'xls'],
      technical: ['pdf', 'docx', 'xlsx', 'dwg'],
      other: ['*'],
    }

    return extensions[documentType] || ['*']
  }

  /**
   * Validate resource type
   */
  static isValidResourceType(resourceType: string): boolean {
    const validTypes = [
      'employee',
      'project',
      'client',
      'drilling_report',
      'company',
      'invoice',
      'contract',
      'certification',
      'medical',
      'identification',
    ]

    return validTypes.includes(resourceType)
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
   * Check if file is an image
   */
  static isImageFile(mimeType: string): boolean {
    return mimeType.startsWith('image/')
  }

  /**
   * Check if file is a PDF
   */
  static isPdfFile(mimeType: string): boolean {
    return mimeType === 'application/pdf'
  }

  /**
   * Check if file is an office document
   */
  static isOfficeDocument(mimeType: string): boolean {
    const officeMimeTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/msword',
      'application/vnd.ms-excel',
      'application/vnd.ms-powerpoint',
    ]

    return officeMimeTypes.includes(mimeType)
  }

  /**
   * Get document type display name
   */
  static getDocumentTypeLabel(type: DocumentType): string {
    const labels = {
      contract: 'Contrato',
      invoice: 'Factura',
      report: 'Reporte',
      image: 'Imagen',
      certificate: 'Certificado',
      permit: 'Permiso',
      blueprint: 'Plano',
      spreadsheet: 'Hoja de Cálculo',
      presentation: 'Presentación',
      legal: 'Legal',
      financial: 'Financiero',
      technical: 'Técnico',
      other: 'Otro',
    }

    return labels[type] || type
  }

  /**
   * Get category display name
   */
  static getCategoryLabel(category: DocumentCategory): string {
    const labels = {
      legal: 'Legal',
      financial: 'Financiero',
      technical: 'Técnico',
      administrative: 'Administrativo',
      operational: 'Operacional',
      compliance: 'Cumplimiento',
      hr: 'Recursos Humanos',
      marketing: 'Marketing',
      confidential: 'Confidencial',
      general: 'General',
    }

    return labels[category] || category
  }

  /**
   * Get status display name
   */
  static getStatusLabel(status: DocumentStatus): string {
    const labels = {
      draft: 'Borrador',
      active: 'Activo',
      archived: 'Archivado',
      deleted: 'Eliminado',
    }

    return labels[status] || status
  }

  /**
   * Get status color
   */
  static getStatusColor(status: DocumentStatus): string {
    const colors = {
      draft: '#6B7280',
      active: '#16A34A',
      archived: '#F59E0B',
      deleted: '#DC2626',
    }

    return colors[status] || colors.draft
  }

  /**
   * Check if document can be deleted
   */
  static canDelete(document: DocumentEntity): { canDelete: boolean; reason?: string } {
    // Cannot delete if has active share links
    if (document.share_links && document.share_links.some(link => link.is_active)) {
      return {
        canDelete: false,
        reason: 'No se puede eliminar un documento con enlaces de compartir activos',
      }
    }

    // Cannot delete if is the only version
    if (document.version === 1 && !document.parent_document_id) {
      return {
        canDelete: false,
        reason: 'No se puede eliminar la versión principal del documento',
      }
    }

    return { canDelete: true }
  }

  /**
   * Check if document can be shared
   */
  static canShare(document: DocumentEntity): { canShare: boolean; reason?: string } {
    if (document.status !== 'active') {
      return {
        canShare: false,
        reason: 'Solo se pueden compartir documentos activos',
      }
    }

    if (document.access_level === 'restricted') {
      return {
        canShare: false,
        reason: 'Los documentos restringidos no pueden ser compartidos',
      }
    }

    return { canShare: true }
  }

  /**
   * Generate document display name
   */
  static getDisplayName(document: DocumentEntity): string {
    return `${document.title} (${DocumentDomain.formatFileSize(document.file_size)})`
  }

  /**
   * Check if document has expired share links
   */
  static hasExpiredShareLinks(document: DocumentEntity): boolean {
    if (!document.share_links)
      return false

    return document.share_links.some(link => {
      if (!link.expires_at)
        return false

      return new Date(link.expires_at) < new Date()
    })
  }

  /**
   * Check if document has metadata
   */
  static hasMetadata(document: DocumentEntity): boolean {
    return document.metadata && Object.keys(document.metadata).length > 0
  }

  /**
   * Get document icon based on type
   */
  static getDocumentIcon(document: DocumentEntity): string {
    if (DocumentDomain.isImageFile(document.mime_type))
      return 'tabler-photo'

    if (DocumentDomain.isPdfFile(document.mime_type))
      return 'tabler-file-type-pdf'

    if (DocumentDomain.isOfficeDocument(document.mime_type))
      return 'tabler-file-text'

    return 'tabler-file'
  }

  /**
   * Calculate document age in days
   */
  static calculateAge(document: DocumentEntity): number {
    const createdDate = new Date(document.created_at)
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - createdDate.getTime())

    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Check if document is recent (less than 7 days)
   */
  static isRecent(document: DocumentEntity): boolean {
    return DocumentDomain.calculateAge(document) <= 7
  }
}
