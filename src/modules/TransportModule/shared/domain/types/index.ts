/**
 * Shared Domain Types
 *
 * Common types used across the transport module
 */

export interface BaseEntity {
  id: string
  created_at?: string
  updated_at?: string
  deleted_at?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from?: number
    to?: number
  }
  links?: {
    first?: string
    last?: string
    prev?: string
    next?: string
  }
}

export interface ApiResponse<T> {
  data: T
  message?: string
  errors?: string[]
}

export interface ApiErrorResponse {
  message: string
  errors?: Record<string, string[]>
  code?: string
}

export type EntityStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED' | 'VERIFIED' | 'REJECTED'

export type ConcessionType = 'INDIVIDUAL' | 'COMPANY' | 'COOPERATIVE'
