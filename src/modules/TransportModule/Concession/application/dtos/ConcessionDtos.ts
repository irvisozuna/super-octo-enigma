/**
 * Concession DTOs - Application Layer
 *
 * Data Transfer Objects for concession-related operations
 */

export interface ConcessionListDto {
  id: string
  concession_number: string
  concession_type: 'TAXI' | 'BUS' | 'MICROBUS' | 'TRUCK'
  route_description?: string
  service_area: string
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'EXPIRED'
  issue_date: string
  expiry_date: string
  renewal_date?: string
  holder_id: string
  holder_name: string
  fee_amount: number
  fee_paid: boolean
  last_payment_date?: string
  created_at: string
  updated_at: string
}

export interface ConcessionCreateDto {
  number: string
  modality: string
  municipality: string
  valid_from: string
  valid_to: string
  concession_type?: 'TAXI' | 'BUS' | 'MICROBUS' | 'TRUCK'
  route_description?: string
  service_area?: string
  issue_date?: string
  expiry_date?: string
  holder_id?: string
  fee_amount?: number
  terms_conditions?: string
  notes?: string
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
