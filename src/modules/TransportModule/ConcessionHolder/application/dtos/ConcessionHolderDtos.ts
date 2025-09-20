/**
 * ConcessionHolder DTOs - Application Layer
 *
 * Data Transfer Objects for concession holder-related operations
 */

export interface ConcessionHolderListDto {
  id: string
  company_id: string
  full_name: string
  holder_type: 'NATURAL' | 'LEGAL' 
  created_at: string
  updated_at: string
  local_id: number
  curp?: string
  rfc?: string
  phone?: string
  email?: string
  legal_representative?: string
  metadata: any[]
  max_concessions_allowed: number
  current_concessions_count: number
  verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED'
  verified_by?: string
  holder_type_label: string
  verification_status_label: string
  is_verified: boolean
  can_add_more_concessions: boolean
  has_valid_documents: boolean
  concessions?: any
  active_concessions?: any
  concessions_count?: number
  active_concessions_count?: number
}

export interface ConcessionHolderCreateDto {
  full_name: string
  holder_type: 'NATURAL' | 'LEGAL' | 'INDIVIDUAL' | 'COMPANY' | 'NATURAL'
  curp?: string
  rfc?: string
  phone?: string
  email?: string
  legal_representative?: string
  metadata?: any[]
}

export interface ConcessionHolderUpdateDto {
  holder_type?: 'NATURAL' | 'LEGAL' | 'INDIVIDUAL' | 'COMPANY' | 'NATURAL'
  full_name?: string
  curp?: string
  rfc?: string
  phone?: string
  email?: string
  legal_representative?: string
  metadata?: any[]
  verification_status?: 'PENDING' | 'VERIFIED' | 'REJECTED'
  verified_by?: string
}

export interface ConcessionHolderDetailDto extends ConcessionHolderListDto {

  // Campos adicionales para vista detallada si es necesario
  concessions?: Array<{
    id: string
    concession_number: string
    concession_type: string
    status: string
    issue_date: string
    expiry_date: string
  }>
  documents?: Array<{
    id: string
    document_type: string
    document_number: string
    status: string
    expiry_date: string
  }>
}

export interface ConcessionHolderFilterDto {
  search?: string
  holder_type?: string
  verification_status?: string
  is_verified?: boolean
  has_valid_documents?: boolean
  can_add_more_concessions?: boolean
  created_at_from?: string
  created_at_to?: string
  page?: number
  per_page?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface ConcessionHolderStatsDto {
  total_holders: number
  verified_holders: number
  pending_verification: number
  rejected_holders: number
  holders_by_type: Record<string, number>
  holders_with_valid_documents: number
  holders_can_add_concessions: number
  new_registrations_this_month: number
}

// DTOs para paginación de Laravel
export interface PaginationLinksDto {
  first: string
  last: string
  prev: string | null
  next: string | null
}

export interface PaginationMetaDto {
  current_page: number
  from: number
  last_page: number
  links: Array<{
    url: string | null
    label: string
    active: boolean
  }>
  path: string
  per_page: number
  to: number
  total: number
}

export interface PaginatedResponseDto<T> {
  data: T[]
  links: PaginationLinksDto
  meta: PaginationMetaDto
}

export interface ConcessionHolderApiResponseDto<T> {
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
