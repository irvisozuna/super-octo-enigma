/**
 * Shared Types for Employee Module
 *
 * Common interfaces, types and enums used across the module
 */

// Base Entity Interface
export interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

// API Response Types
export interface ApiResponse<T> {
  data: T
  meta?: {
    resource?: string
    version?: string
  }
}

export interface PaginatedResponse<T> {
  data: T[]
  links?: {
    first?: string
    last?: string
    prev?: string | null
    next?: string | null
  }
  meta?: {
    current_page: number
    from: number
    last_page: number
    per_page: number
    to: number
    total: number
  }
}

// Employee Enums
export enum EmployeeStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  TERMINATED = 'terminated',
  VACATION = 'vacation',
}

export enum EmployeePosition {
  OPERATOR = 'operator',
  HELPER = 'helper',
  MANAGER = 'manager',
  SUPERVISOR = 'supervisor',
  ADMIN = 'admin',
}

export enum EmploymentType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACTOR = 'contractor',
  TEMPORARY = 'temporary',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum SkillProficiency {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
}

export enum EmploymentHistoryChangeType {
  HIRED = 'hired',
  PROMOTION = 'promotion',
  TRANSFER = 'transfer',
  STATUS_CHANGE = 'status_change',
  SUSPENSION = 'suspension',
  REACTIVATION = 'reactivation',
  TERMINATION = 'termination',
}

// Filter Types
export interface EmployeeFilter {
  first_name?: string
  last_name?: string
  position?: EmployeePosition
  status?: EmployeeStatus
  department?: string
  employment_type?: EmploymentType
  page?: number
  per_page?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  search?: string
}

// Statistics Types
export interface EmployeeStatistics {
  total: number
  by_status: Record<EmployeeStatus, number>
  by_position: Record<EmployeePosition, number>
  by_employment_type: Record<EmploymentType, number>
  recent_hires_count: number
  active_count: number
  inactive_count: number
}

// Notification Types
export interface NotificationOptions {
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  persistent?: boolean
}

// Error Types
export interface ValidationError {
  field: string
  message: string
  rule?: string
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
  code?: string
  status?: number
}
