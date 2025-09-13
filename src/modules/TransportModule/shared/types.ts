/**
 * Shared Types for Transport Module
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
  meta: {
    resource: string
    version: string
    enum_options?: Record<string, Record<string, string>>
    fields?: {
      required: string[]
      optional: string[]
      computed: string[]
    }
    validation?: Record<string, string>
    business_rules?: Record<string, any>
  }
  links?: {
    first?: string
    last?: string
    prev?: string | null
    next?: string | null
  }
  pagination?: {
    current_page: number
    total: number
    per_page: number
    last_page: number
  }
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    current_page: number
    total: number
    per_page: number
    last_page: number
  }
}

// Common Enums
export enum EntityStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED',
  CANCELLED = 'CANCELLED',
}

export enum VehicleType {
  MICROBUS = 'MICROBUS',
  TAXI = 'TAXI',
  BUS = 'BUS',
  TRUCK = 'TRUCK',
  MOTORCYCLE = 'MOTORCYCLE',
  OTHER = 'OTHER',
}

export enum ConcessionType {
  INDIVIDUAL = 'INDIVIDUAL',
  COMPANY = 'COMPANY',
  COOPERATIVE = 'COOPERATIVE',
}

export enum LicenseType {
  A = 'A', // Motorcycles
  B = 'B', // Cars
  C = 'C', // Trucks
  D = 'D', // Public transport
  E = 'E', // Special vehicles
}

export enum PaymentMethod {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHECK = 'CHECK',
  DIGITAL_WALLET = 'DIGITAL_WALLET',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum DocumentType {
  LICENSE = 'LICENSE',
  REGISTRATION = 'REGISTRATION',
  INSURANCE = 'INSURANCE',
  INSPECTION = 'INSPECTION',
  PERMIT = 'PERMIT',
  CONTRACT = 'CONTRACT',
  INVOICE = 'INVOICE',
  RECEIPT = 'RECEIPT',
  PHOTO = 'PHOTO',
  CERTIFICATE = 'CERTIFICATE',
  REPORT = 'REPORT',
  OTHER = 'OTHER',
}

export enum FineStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
  CONTESTED = 'CONTESTED',
}

export enum ViolationType {
  SPEEDING = 'SPEEDING',
  PARKING = 'PARKING',
  TRAFFIC_LIGHT = 'TRAFFIC_LIGHT',
  STOP_SIGN = 'STOP_SIGN',
  DRIVING_LICENSE = 'DRIVING_LICENSE',
  VEHICLE_REGISTRATION = 'VEHICLE_REGISTRATION',
  INSURANCE = 'INSURANCE',
  OTHER = 'OTHER',
}

// Filter and Search Types
export interface BaseFilter {
  status?: EntityStatus
  date_from?: string
  date_to?: string
  created_from?: string
  created_to?: string
  search?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  page?: number
  per_page?: number
  include?: string
}

export interface VehicleFilter extends BaseFilter {
  vehicle_type?: VehicleType
  brand?: string
  model?: string
  year_from?: number
  year_to?: number
  concession_id?: string
}

export interface DriverFilter extends BaseFilter {
  license_type?: LicenseType
  license_status?: EntityStatus
  vehicle_id?: string
}

export interface FineFilter extends BaseFilter {
  fine_status?: FineStatus
  violation_type?: ViolationType
  vehicle_id?: string
  driver_id?: string
  amount_from?: number
  amount_to?: number
  due_date_from?: string
  due_date_to?: string
}

export interface DocumentFilter extends BaseFilter {
  document_type?: DocumentType
  entity_type?: string
  entity_id?: string
  is_expired?: boolean
  is_required?: boolean
  is_sensitive?: boolean
  access_level?: 'PUBLIC' | 'PRIVATE' | 'RESTRICTED'
  file_type?: string
  tags?: string[]
  uploaded_by?: string
}

// Form Data Types
export interface CreateVehicleData {
  plate_number: string
  vin?: string
  brand: string
  model: string
  year: number
  color?: string
  vehicle_type: VehicleType
  capacity: number
  concession_id?: string
  registration_date?: string
  last_inspection_date?: string
  next_inspection_date?: string
  status: EntityStatus
}

export interface CreateDriverData {
  full_name: string
  document_type: string
  document_number: string
  license_number: string
  license_type: LicenseType
  license_expiration_date: string
  phone?: string
  email?: string
  address?: string
  emergency_contact?: string
  emergency_phone?: string
  status: EntityStatus
}

export interface CreateFineData {
  vehicle_id: string
  driver_id?: string
  fine_number: string
  violation_type: ViolationType
  description: string
  amount: number
  due_date: string
  location?: string
  officer_name?: string
  notes?: string
  status: FineStatus
}

// Statistics Types
export interface EntityStatistics {
  total: number
  by_status: Record<string, number>
  recent_count: number
  trends: {
    daily: Array<{ date: string; count: number }>
    monthly: Array<{ month: string; count: number }>
  }
}

export interface VehicleStatistics extends EntityStatistics {
  by_type: Record<VehicleType, number>
  by_brand: Record<string, number>
  average_age: number
  inspection_due_count: number
}

export interface FineStatistics extends EntityStatistics {
  by_violation_type: Record<ViolationType, number>
  total_amount: number
  paid_amount: number
  pending_amount: number
  overdue_count: number
}

export interface DocumentStatistics extends EntityStatistics {
  by_type: Record<DocumentType, number>
  by_entity_type: Record<string, number>
  total_size: number
  expired_count: number
  expiring_soon_count: number
  unverified_count: number
  by_access_level: Record<string, number>
}

// Error Types
export interface ValidationError {
  field: string
  message: string
  rule: string
}

export interface ApiError {
  message: string
  errors?: ValidationError[]
  code?: string
  status?: number
}

// Component Props Types
export interface TableColumn {
  key: string
  label: string
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  formatter?: (value: any) => string
}

export interface ActionButton {
  icon: string
  label: string
  color?: string
  variant?: string
  action: (item: any) => void
  show?: (item: any) => boolean
}

// Loading States
export interface LoadingState {
  list: boolean
  create: boolean
  update: boolean
  delete: boolean
  statistics: boolean
}

// Notification Types
export interface NotificationOptions {
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  persistent?: boolean
}
