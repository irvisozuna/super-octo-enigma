/**
 * Document DTOs - Application Layer
 *
 * Data Transfer Objects for document-related operations
 */

export interface DocumentListDto {
  id: string
  document_type: string
  document_number: string
  issued_by: string
  issue_date: string
  expiry_date: string
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'PENDING'
  holder_name: string
  holder_type: 'DRIVER' | 'VEHICLE' | 'CONCESSION_HOLDER'
  holder_id: string
  file_url?: string
  file_name?: string
  file_size?: number
  created_at: string
  updated_at: string
}

export interface DocumentCreateDto {
  document_type: string
  document_number: string
  issued_by: string
  issue_date: string
  expiry_date: string
  holder_type: 'DRIVER' | 'VEHICLE' | 'CONCESSION_HOLDER'
  holder_id: string
  file?: File
  notes?: string
}

export interface DocumentUpdateDto {
  document_type?: string
  document_number?: string
  issued_by?: string
  issue_date?: string
  expiry_date?: string
  status?: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'PENDING'
  file?: File
  notes?: string
}

export interface DocumentDetailDto extends DocumentListDto {
  notes?: string
  verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED'
  verification_date?: string
  verified_by?: string
  rejection_reason?: string
  metadata?: Record<string, any>
}

export interface DocumentFilterDto {
  search?: string
  document_type?: string
  status?: string
  holder_type?: string
  holder_id?: string
  issued_by?: string
  issue_date_from?: string
  issue_date_to?: string
  expiry_date_from?: string
  expiry_date_to?: string
  verification_status?: string
  page?: number
  per_page?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface DocumentStatsDto {
  total_documents: number
  active_documents: number
  expired_documents: number
  pending_documents: number
  documents_by_type: Record<string, number>
  documents_by_holder_type: Record<string, number>
  expiring_soon: number
}

export interface DocumentValidationDto {
  document_number: string
  document_type: string
  issued_by: string
  is_valid: boolean
  verification_date: string
  expiry_date: string
  status: string
}

export interface DocumentApiResponseDto<T> {
  success: boolean
  data: T
  message?: string
  errors?: Record<string, string[]>
  meta?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export interface DocumentBulkOperationDto {
  ids: string[]
  operation: 'delete' | 'activate' | 'deactivate' | 'verify' | 'reject'
  reason?: string
}
