/**
 * Document DTOs (Data Transfer Objects)
 *
 * DTOs for API communication and data transformation
 */

import type {
  DocumentAccessLevel,
  DocumentCategory,
  DocumentStatus,
  DocumentType,
} from '../../domain/entities/DocumentEntity'

// Base DTOs
export interface DocumentDto {
  id: string
  title: string
  description?: string
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  file_extension: string
  resource_type: string
  resource_id: string
  resource_subtype?: string
  document_type: DocumentType
  category: DocumentCategory
  tags: string[]
  metadata: Record<string, any>
  is_public: boolean
  is_encrypted: boolean
  access_level: DocumentAccessLevel
  version: number
  parent_document_id?: string
  is_latest_version: boolean
  status: DocumentStatus
  uploaded_by: string
  uploaded_by_user?: {
    id: string
    name: string
    email: string
  }
  file_size_formatted: string
  is_image: boolean
  is_pdf: boolean
  is_office_document: boolean
  created_at: string
  updated_at: string
}

export interface CreateDocumentDto {
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

export interface UpdateDocumentDto {
  id: string
  title?: string
  description?: string
  document_type?: DocumentType
  category?: DocumentCategory
  tags?: string[]
  metadata?: Record<string, any>
  is_public?: boolean
  access_level?: DocumentAccessLevel
  change_description?: string
}

export interface DocumentListDto {
  id: string
  title: string
  file_name: string
  file_size: number
  file_size_formatted: string
  mime_type: string
  document_type: DocumentType
  category: DocumentCategory
  status: DocumentStatus
  resource_type: string
  resource_id: string
  resource_subtype?: string
  tags: string[]
  is_public: boolean
  access_level: DocumentAccessLevel
  version: number
  is_latest_version: boolean
  uploaded_by: string
  uploaded_by_user?: {
    id: string
    name: string
    email: string
  }
  created_at: string
  updated_at: string
}

export interface DocumentSearchDto {
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
  page?: number
  per_page?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  search?: string
}

// Share Link DTOs
export interface ShareLinkDto {
  id: string
  document_id: string
  share_token: string
  share_url: string
  has_password: boolean
  expires_at?: string
  max_downloads?: number
  download_count: number
  downloads_remaining?: number
  permissions: string[]
  allowed_emails?: string[]
  is_active: boolean
  is_expired: boolean
  created_by: string
  created_at: string
  notes?: string
}

export interface CreateShareLinkDto {
  password?: string
  expires_at?: string
  max_downloads?: number
  permissions: string[]
  allowed_emails?: string[]
  notes?: string
}

export interface UpdateShareLinkDto {
  password?: string
  expires_at?: string
  max_downloads?: number
  permissions?: string[]
  allowed_emails?: string[]
  notes?: string
}

// Version DTOs
export interface DocumentVersionDto {
  id: string
  document_id: string
  version_number: number
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  change_description?: string
  created_by: string
  is_current: boolean
  created_at: string
}

export interface CreateVersionDto {
  file: File
  change_description?: string
}

// Statistics DTOs
export interface DocumentStatisticsDto {
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

// Metadata Template DTOs
export interface MetadataTemplateDto {
  name: string
  description: string
  fields: MetadataFieldDto[]
}

export interface MetadataFieldDto {
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

// Access Log DTOs
export interface AccessLogDto {
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

// Bulk Operations DTOs
export interface BulkUploadDto {
  documents: CreateDocumentDto[]
}

export interface BulkUpdateDto {
  updates: Array<{
    id: string
    data: Partial<UpdateDocumentDto>
  }>
}

export interface BulkDeleteDto {
  document_ids: string[]
}

// Response DTOs
export interface DocumentListResponseDto {
  data: DocumentListDto[]
  pagination: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export interface DocumentDetailResponseDto {
  data: DocumentDto
  versions?: DocumentVersionDto[]
  share_links?: ShareLinkDto[]
  access_logs?: AccessLogDto[]
}

export interface ShareLinkResponseDto {
  data: ShareLinkDto
}

export interface ShareLinkListResponseDto {
  data: ShareLinkDto[]
}

export interface VersionListResponseDto {
  data: DocumentVersionDto[]
}

export interface StatisticsResponseDto {
  data: DocumentStatisticsDto
}

export interface MetadataTemplateResponseDto {
  data: Record<string, MetadataTemplateDto>
}

export interface MetadataTemplateDetailResponseDto {
  data: MetadataTemplateDto
}

// Public Share Access DTOs (no authentication required)
export interface PublicShareCheckDto {
  requires_password: boolean
  requires_email: boolean
  permissions: string[]
}

export interface PublicShareInfoDto {
  document: {
    id: string
    title: string
    file_name: string
    file_size: number
    file_size_formatted: string
    mime_type: string
    created_at: string
  }
  share_link: {
    expires_at?: string
    max_downloads?: number
    download_count: number
    downloads_remaining?: number
    permissions: string[]
  }
}

// File Upload DTOs
export interface FileUploadProgressDto {
  loaded: number
  total: number
  percentage: number
}

export interface FileValidationDto {
  valid: boolean
  errors: string[]
  warnings: string[]
}

// Search and Filter DTOs
export interface DocumentSearchRequestDto {
  query?: string
  filters?: DocumentSearchDto
  page?: number
  per_page?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface DocumentSearchResponseDto {
  data: DocumentListDto[]
  pagination: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
  facets?: {
    document_types: Record<string, number>
    categories: Record<string, number>
    statuses: Record<string, number>
    resource_types: Record<string, number>
  }
}

// Export DTOs
export interface ExportRequestDto {
  format: 'csv' | 'excel' | 'pdf'
  filters?: DocumentSearchDto
  fields?: string[]
}

export interface ExportResponseDto {
  download_url: string
  expires_at: string
}

// Notification DTOs
export interface DocumentNotificationDto {
  type: 'upload' | 'update' | 'delete' | 'share' | 'expire' | 'access'
  document_id: string
  document_title: string
  user_id: string
  message: string
  metadata?: Record<string, any>
}

// Audit DTOs
export interface DocumentAuditDto {
  id: string
  document_id: string
  action: string
  user_id?: string
  ip_address?: string
  user_agent?: string
  metadata?: Record<string, any>
  created_at: string
}

// Security DTOs
export interface SecurityAuditDto {
  id: string
  event_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  ip_address: string
  user_id?: string
  document_id?: string
  description: string
  metadata?: Record<string, any>
  created_at: string
}

export interface FailedAccessAttemptDto {
  id: string
  ip_address: string
  user_id?: string
  document_id?: string
  share_token?: string
  attempt_type: string
  reason: string
  metadata?: Record<string, any>
  attempted_at: string
}
