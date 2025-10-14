/**
 * Shared types for Client Module
 */

import type { BusinessType, CFDIUse, ClientStatus, PaymentTerms, TaxRegime } from '../../domain/entities/ClientEntity'

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  per_page: number
  current_page: number
  last_page: number
  from: number
  to: number
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  data: T
  message?: string
}

/**
 * Client Filter
 */
export interface ClientFilter {
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
 * Client Statistics
 */
export interface ClientStatistics {
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
 * Export format
 */
export type ExportFormat = 'csv' | 'excel' | 'pdf'
