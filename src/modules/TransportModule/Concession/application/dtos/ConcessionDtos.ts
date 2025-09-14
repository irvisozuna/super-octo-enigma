/**
 * Concession DTOs - Application Layer
 *
 * Data Transfer Objects for concession-related operations
 */

export interface AuthorizedService {
  code: string
  description: string
  category: string
}

export interface RestrictionItem {
  code: string
  description: string
  value: string
  label: string
}

export interface ServiceOption {
  label: string
  description: string
  category: string
}

export interface RestrictionOption {
  label: string
  description: string
  options: Record<string, string>
}

export interface ConcessionListDto {
  id: string
  number: string
  modality: 'URBAN' | 'SUBURBAN' | 'RURAL' | 'TOURIST' | 'SCHOLAR' | 'WORKER' | 'TAXI' | 'INTERCITY' | 'CHARTER' | 'SHUTTLE'
  municipality: string
  status: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED' | 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'
  valid_from: string
  valid_to: string
  route_or_site?: string
  authorized_services?: AuthorizedService[]
  restrictions?: RestrictionItem[]
  holder_id: string
  holder_name?: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface ConcessionCreateDto {

  // Required fields
  holder_id: string
  number: string
  modality: 'URBAN' | 'SUBURBAN' | 'RURAL' | 'TOURIST' | 'SCHOLAR' | 'WORKER' | 'TAXI' | 'INTERCITY' | 'CHARTER' | 'SHUTTLE'
  municipality: string
  valid_from: string
  valid_to: string

  // Optional fields
  status?: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED' | 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'
  route_or_site?: string
  authorized_services?: AuthorizedService[]
  restrictions?: RestrictionItem[]
  metadata?: Record<string, any>
}

export interface ConcessionUpdateDto {
  concession_type?: 'TAXI' | 'BUS' | 'MICROBUS' | 'TRUCK'
  route_description?: string
  service_area?: string
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'EXPIRED'
  expiry_date?: string
  renewal_date?: string
  fee_amount?: number
  fee_paid?: boolean
  last_payment_date?: string
  terms_conditions?: string
  notes?: string
}

export interface ConcessionDetailDto extends ConcessionListDto {
  terms_conditions?: string
  notes?: string
  renewal_history: Array<{
    date: string
    fee_amount: number
    renewed_by: string
    notes?: string
  }>
  payment_history: Array<{
    payment_date: string
    amount: number
    payment_method: string
    reference?: string
  }>
}

export interface ConcessionFilterDto {
  search?: string
  concession_type?: string
  status?: string
  service_area?: string
  holder_id?: string
  fee_paid?: boolean
  issue_date_from?: string
  issue_date_to?: string
  expiry_date_from?: string
  expiry_date_to?: string
  page?: number
  per_page?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface ConcessionStatsDto {
  total_concessions: number
  active_concessions: number
  expired_concessions: number
  suspended_concessions: number
  concessions_by_type: Record<string, number>
  total_fee_amount: number
  paid_fees: number
  unpaid_fees: number
  expiring_soon: number
}

export interface ConcessionRenewalDto {
  concession_id: string
  new_expiry_date: string
  fee_amount: number
  payment_method?: string
  payment_reference?: string
  notes?: string
}

export interface ConcessionApiResponseDto<T> {
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

export interface ConcessionValidValuesDto {
  authorized_services: Record<string, ServiceOption>
  restrictions: Record<string, RestrictionOption>
  statuses: Record<string, string>
  modalities: Record<string, string>
}

export interface ConcessionValidValuesResponseDto {
  data: ConcessionValidValuesDto
  meta: {
    resource: string
    version: string
    description: string
    source: string
  }
}
