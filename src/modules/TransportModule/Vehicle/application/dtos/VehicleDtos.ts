/**
 * Vehicle DTOs - Data Transfer Objects
 *
 * Define the structure of data exchanged between layers
 */

import type { EntityStatus, VehicleType } from '../../../shared/types'

// List and pagination DTOs
export interface VehicleListResponseDto {
  data: VehicleDto[]
  pagination: {
    current_page: number
    total: number
    per_page: number
    last_page: number
  }
  meta?: {
    filters?: any
    sort?: any
  }
}

export interface VehicleDto {
  id: string
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
  company_id: string

  // Computed fields
  age?: number
  days_until_inspection?: number
  is_inspection_due?: boolean

  // Relationships
  concession?: any
  drivers?: any[]
  fines?: any[]
  documents?: any[]

  // Timestamps
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

export interface CreateVehicleDto {
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

export interface UpdateVehicleDto extends Partial<CreateVehicleDto> {
  id: string
}

export interface VehicleFilterDto {
  search?: string
  plate_number?: string
  brand?: string
  model?: string
  vehicle_type?: VehicleType
  status?: EntityStatus
  year_from?: number
  year_to?: number
  concession_id?: string
  capacity_from?: number
  capacity_to?: number
  inspection_due?: boolean
  created_from?: string
  created_to?: string
  page?: number
  per_page?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  include?: string
}

export interface VehicleStatsDto {
  total: number
  by_status: Record<EntityStatus, number>
  by_type: Record<VehicleType, number>
  by_brand: Record<string, number>
  average_age: number
  inspection_due_count: number
  recent_count: number
}

export interface VehicleExportDto {
  format: 'csv' | 'excel' | 'pdf'
  filters?: VehicleFilterDto
  fields?: string[]
  include_relationships?: boolean
}

// Validation DTOs
export interface VehicleValidationDto {
  plate_number: string
  vin?: string
  exclude_id?: string
}

export interface VehicleValidationResponseDto {
  is_valid: boolean
  errors: {
    plate_number?: string[]
    vin?: string[]
    general?: string[]
  }
  warnings?: string[]
}

// Inspection DTOs
export interface VehicleInspectionDto {
  vehicle_id: string
  inspection_date: string
  next_inspection_date: string
  inspector_name?: string
  notes?: string
  passed: boolean
  certificate_number?: string
}

export interface VehicleMaintenanceDto {
  vehicle_id: string
  maintenance_type: string
  date: string
  description: string
  cost?: number
  mechanic?: string
  next_maintenance_date?: string
}

// Assignment DTOs
export interface VehicleDriverAssignmentDto {
  vehicle_id: string
  driver_id: string
  assignment_date: string
  notes?: string
}

export interface VehicleConcessionAssignmentDto {
  vehicle_id: string
  concession_id: string
  assignment_date: string
  notes?: string
}
