/**
 * Shared Types for Drilling Reports Module
 */

// Common types
export type ID = string
export type Timestamp = string
export type Status = 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled'

// API Response types
export interface ApiResponse<T = any> {
  data: T
  message?: string
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T = any> {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
  links: {
    first: string
    last: string
    prev: string | null
    next: string | null
  }
}

// Filter types
export interface BaseFilters {
  page?: number
  per_page?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  search?: string
}

// Date range filter
export interface DateRange {
  from?: string
  to?: string
}

// User types
export interface User {
  id: ID
  name: string
  email: string
  role: string
  permissions: string[]
}

// Notification types
export interface Notification {
  id: ID
  type: string
  title: string
  message: string
  read: boolean
  created_at: Timestamp
}

// Error types
export interface AppError {
  code: string
  message: string
  details?: any
}

// Form validation types
export interface ValidationError {
  field: string
  message: string
}

// File upload types
export interface FileUpload {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  error?: string
}

// Export types
export type ExportFormat = 'pdf' | 'excel' | 'csv'
export type ExportStatus = 'pending' | 'processing' | 'completed' | 'error'

// Statistics types
export interface Statistics {
  total: number
  by_status: Record<string, number>
  by_shift: Record<string, number>
  total_hours: number
  total_meters: number
}

// Chart data types
export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string[]
    borderColor?: string[]
  }[]
}

// Table column types
export interface TableColumn {
  key: string
  title: string
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
}

// Modal types
export interface ModalConfig {
  title: string
  message?: string
  confirmText?: string
  cancelText?: string
  type?: 'info' | 'warning' | 'error' | 'success'
}

// Toast types
export interface ToastConfig {
  title: string
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  position?: 'top' | 'bottom'
}

// Loading states
export interface LoadingState {
  loading: boolean
  error: string | null
  success: boolean
}

// Pagination state
export interface PaginationState {
  page: number
  perPage: number
  total: number
  totalPages: number
}

// Search state
export interface SearchState {
  query: string
  results: any[]
  loading: boolean
  error: string | null
}

// Form state
export interface FormState {
  data: Record<string, any>
  errors: Record<string, string>
  touched: Record<string, boolean>
  dirty: boolean
  valid: boolean
  submitting: boolean
}

// Store state
export interface StoreState {
  items: any[]
  currentItem: any | null
  loading: boolean
  error: string | null
  pagination: PaginationState
  filters: Record<string, any>
}
