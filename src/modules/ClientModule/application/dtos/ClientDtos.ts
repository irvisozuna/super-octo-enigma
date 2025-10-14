/**
 * Client DTOs (Data Transfer Objects)
 *
 * Used for transferring data between layers
 */

import type { BusinessType, CFDIUse, ClientStatus, PaymentMethod, PaymentTerms, TaxRegime } from '../../domain/entities/ClientEntity'

/**
 * Client List DTO (simplified for lists)
 */
export interface ClientListDto {
  id: string
  client_code: string
  business_type: BusinessType
  status: ClientStatus
  business_name: string
  trade_name?: string
  industry: string
  primary_email: string
  primary_phone: string
  city: string
  state: string
  tax_id: string
  credit_limit?: number
  payment_terms?: PaymentTerms
  created_at?: string
  updated_at?: string
}

/**
 * Client Detail DTO (complete information)
 */
export interface ClientDetailDto {
  id: string
  client_code: string
  business_type: BusinessType
  status: ClientStatus
  business_name: string
  trade_name?: string
  industry: string
  website?: string
  logo_url?: string
  primary_email: string
  secondary_email?: string
  primary_phone: string
  secondary_phone?: string
  address_line_1: string
  address_line_2?: string
  city: string
  state: string
  postal_code: string
  country?: string
  billing_address_line_1?: string
  billing_address_line_2?: string
  billing_city?: string
  billing_state?: string
  billing_postal_code?: string
  billing_country?: string
  tax_id: string
  tax_regime?: TaxRegime
  cfdi_use?: CFDIUse
  payment_terms?: PaymentTerms
  payment_methods?: PaymentMethod[]
  credit_limit?: number
  credit_limit_currency?: string
  notes?: string
  tags?: string[]
  created_at?: string
  updated_at?: string
}

/**
 * Client Create DTO
 */
export interface ClientCreateDto {
  business_type: BusinessType
  business_name: string
  trade_name?: string
  industry: string
  website?: string
  logo_url?: string
  primary_email: string
  secondary_email?: string
  primary_phone: string
  secondary_phone?: string
  address_line_1: string
  address_line_2?: string
  city: string
  state: string
  postal_code: string
  country?: string
  billing_address_line_1?: string
  billing_address_line_2?: string
  billing_city?: string
  billing_state?: string
  billing_postal_code?: string
  billing_country?: string
  tax_id: string
  tax_regime?: TaxRegime
  cfdi_use?: CFDIUse
  payment_terms?: PaymentTerms
  payment_methods?: PaymentMethod[]
  credit_limit?: number
  credit_limit_currency?: string
  notes?: string
  tags?: string[]
}

/**
 * Client Update DTO
 */
export interface ClientUpdateDto extends Partial<ClientCreateDto> {
  status?: ClientStatus
}

/**
 * Client Filter DTO
 */
export interface ClientFilterDto {
  search?: string
  business_type?: BusinessType
  status?: ClientStatus
  city?: string
  state?: string
  payment_terms?: PaymentTerms
  has_credit_limit?: boolean
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  page?: number
  per_page?: number
}

/**
 * Client Statistics DTO
 */
export interface ClientStatisticsDto {
  total_clients: number
  active_clients: number
  inactive_clients: number
  suspended_clients: number
  blacklisted_clients: number
  total_companies: number
  total_individuals: number
  total_credit_limit: number
  average_credit_days: number
}

/**
 * Paginated Response DTO
 */
export interface PaginatedResponseDto<T> {
  data: T[]
  total: number
  per_page: number
  current_page: number
  last_page: number
  from: number
  to: number
}

/**
 * Client Contact DTO
 */
export interface ClientContactDto {
  id: string
  client_id: string
  name: string
  position?: string
  email?: string
  phone?: string
  mobile?: string
  is_primary: boolean
  notes?: string
  created_at?: string
  updated_at?: string
}

/**
 * Client Contact Create DTO
 */
export interface ClientContactCreateDto {
  name: string
  position?: string
  email?: string
  phone?: string
  mobile?: string
  is_primary?: boolean
  notes?: string
}

/**
 * Client Contact Update DTO
 */
export interface ClientContactUpdateDto extends Partial<ClientContactCreateDto> {}

/**
 * Client Status History DTO
 */
export interface ClientStatusHistoryDto {
  id: string
  client_id: string
  old_status: ClientStatus
  new_status: ClientStatus
  reason?: string
  notes?: string
  changed_by_user_id?: string
  changed_by_user?: {
    id: string
    name: string
    email: string
  }
  effective_date: string
  created_at: string
}
