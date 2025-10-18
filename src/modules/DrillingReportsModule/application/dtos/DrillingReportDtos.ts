/**
 * Drilling Report DTOs
 *
 * Data Transfer Objects for the application layer
 */

import type {
  ActivityEntity,
  ConsumptionEntity,
  DrillingReportEntity,
  EquipmentEntity,
  PersonnelEntity,
  ProjectEntity,
  ReportTotalsEntity,
  SignatureEntity,
  ToolAssignmentEntity,
  WellEntity,
} from '../../domain/entities/DrillingReportEntity'

// Base DTOs
export interface DrillingReportDto {
  id: string
  report_number: string
  report_date: string
  shift: 'day' | 'night' | 'mixed'
  status: 'draft' | 'completed' | 'approved' | 'rejected'
  project_id: string
  well_id: string
  equipment_id?: string
  operator_day_id?: string
  helper1_day_id?: string
  helper2_day_id?: string
  operator_night_id?: string
  helper1_night_id?: string
  helper2_night_id?: string
  horometer_start_day?: number
  horometer_start_night?: number
  horometer_end_day?: number
  horometer_end_night?: number
  rpm_pull_down?: number
  rpm_rotation?: number
  observations?: string
  created_at: string
  updated_at: string
  created_by_id?: string
}

// List DTOs (simplified for listing)
export interface DrillingReportListItemDto {
  id: string
  report_number: string
  report_date: string
  shift: 'day' | 'night' | 'mixed'
  status: 'draft' | 'completed' | 'approved' | 'rejected'
  project: {
    id: string
    name: string
    code: string
  }
  well: {
    id: string
    name: string
    well_number: string
  }
  equipment?: {
    id: string
    name: string
    serial_number: string
  }
  personnel: {
    operator_day?: { id: string; name: string }
    helper1_day?: { id: string; name: string }
    helper2_day?: { id: string; name: string }
    operator_night?: { id: string; name: string }
    helper1_night?: { id: string; name: string }
    helper2_night?: { id: string; name: string }
  }
  totals: {
    hours_worked: number
    meters_drilled: number
  }
  created_at: string
  updated_at: string
}

// Detail DTOs (full information)
export interface DrillingReportDetailDto extends DrillingReportDto {
  project: ProjectEntity
  well: WellEntity
  equipment?: EquipmentEntity
  personnel: PersonnelEntity
  activities: ActivityEntity[]
  consumptions: ConsumptionEntity[]
  tool_assignments: ToolAssignmentEntity[]
  signatures: SignatureEntity[]
  totals: ReportTotalsEntity
}

// Create/Update DTOs
export interface CreateDrillingReportDto {
  project_id: string
  well_id: string
  report_date: string
  shift: 'day' | 'night' | 'mixed'
  equipment_id?: string
  operator_day_id?: string
  helper1_day_id?: string
  helper2_day_id?: string
  operator_night_id?: string
  helper1_night_id?: string
  helper2_night_id?: string
  horometer_start_day?: number
  horometer_start_night?: number
  rpm_pull_down?: number
  rpm_rotation?: number
  observations?: string
}

export interface UpdateDrillingReportDto extends Partial<CreateDrillingReportDto> {}

// Activity DTOs
export interface ActivityDto {
  id: string
  activity_type: 'drilling' | 'maintenance' | 'installation' | 'testing' | 'waiting' | 'mobilization' | 'demobilization' | 'otros'
  shift: 'day' | 'night' | 'mixed'
  hours: number
  start_time?: string
  end_time?: string
  description?: string
}

export interface CreateActivityDto {
  activity_type: 'drilling' | 'maintenance' | 'installation' | 'testing' | 'waiting' | 'mobilization' | 'demobilization' | 'otros'
  shift: 'day' | 'night' | 'mixed'
  hours: number
  start_time?: string
  end_time?: string
  description?: string
}

export interface UpdateActivityDto extends Partial<CreateActivityDto> {}

// Consumption DTOs
export interface ConsumptionDto {
  id: string
  consumable_type: string
  shift: 'day' | 'night' | 'mixed'
  quantity: number
  unit: 'kg' | 'bags' | 'liters' | 'gallons' | 'units'
}

export interface CreateConsumptionDto {
  consumable_type: string
  shift: 'day' | 'night' | 'mixed'
  quantity: number
  unit: 'kg' | 'bags' | 'liters' | 'gallons' | 'units'
}

export interface UpdateConsumptionDto extends Partial<CreateConsumptionDto> {}

// Tool Assignment DTOs
export interface ToolAssignmentDto {
  id: string
  tool_id: string
  shift: 'day' | 'night' | 'mixed'
  tool_category: string
  start_depth_meters: number
  end_depth_meters: number
  meters_drilled: number
  wear_pattern?: 'uniform' | 'centered' | 'eccentric' | 'one_sided'
  matrix?: 'good_condition' | 'moderate_wear' | 'severe_wear' | 'needs_replacement'
  assigned_at: string
  tool?: {
    id: string
    serial_number: string
    name: string
    manufacturer: string
    status: string
    total_usage_meters: number
    capacity_meters?: number
    remaining_meters?: number
  }
}

export interface CreateToolAssignmentDto {
  tool_id: string
  shift: 'day' | 'night' | 'mixed'
  tool_category: string
  start_depth_meters: number
  end_depth_meters: number
  wear_pattern?: 'uniform' | 'centered' | 'eccentric' | 'one_sided'
  matrix?: 'good_condition' | 'moderate_wear' | 'severe_wear' | 'needs_replacement'
}

export interface UpdateToolAssignmentDto extends Partial<CreateToolAssignmentDto> {}

// Signature DTOs
export interface SignatureDto {
  id: string
  signature_type: 'operator' | 'supervisor' | 'client'
  signatory_name: string
  signatory_user_id?: string
  signature_method: 'digital' | 'physical' | 'electronic'
  signature_data?: string
  signed_at: string
}

export interface CreateSignatureDto {
  signature_type: 'operator' | 'supervisor' | 'client'
  signature_method: 'digital' | 'physical' | 'electronic'
  signature_data?: string
}

// Action DTOs
export interface CompleteReportDto {
  horometer_end_day?: number
  horometer_end_night?: number
}

export interface ApproveReportDto {

  // Empty for now, might include approval notes in the future
}

export interface RejectReportDto {
  reason: string
}

// Filter DTOs
export interface DrillingReportFiltersDto {
  page?: number
  per_page?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  project_id?: string
  well_id?: string
  status?: string
  date_from?: string
  date_to?: string
  shift?: string
  search?: string
}

// Response DTOs
export interface DrillingReportListResponseDto {
  data: DrillingReportListItemDto[]
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

export interface DrillingReportStatisticsDto {
  total_reports: number
  reports_by_status: Record<string, number>
  reports_by_shift: Record<string, number>
  total_hours: number
  total_meters: number
}

// Error DTOs
export interface DrillingReportErrorDto {
  message: string
  errors?: Record<string, string[]>
  code?: string
}

// Success DTOs
export interface DrillingReportSuccessDto {
  message: string
  data?: any
}
