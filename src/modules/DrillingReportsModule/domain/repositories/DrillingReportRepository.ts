/**
 * Drilling Report Repository Interface
 *
 * Repository interface following DDD principles
 */

import type { DrillingReportEntity } from '../entities/DrillingReportEntity'

export interface DrillingReportFilters {
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

export interface DrillingReportListResponse {
  data: DrillingReportEntity[]
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

export interface AddActivityDto {
  activity_type: 'drilling' | 'maintenance' | 'installation' | 'testing' | 'waiting' | 'mobilization' | 'demobilization' | 'otros'
  shift: 'day' | 'night' | 'mixed'
  hours: number
  start_time?: string
  end_time?: string
  description?: string
}

export interface RecordConsumptionDto {
  consumable_type: string
  shift: 'day' | 'night' | 'mixed'
  quantity: number
  unit: 'kg' | 'bags' | 'liters' | 'gallons' | 'units'
}

export interface AssignToolDto {
  tool_id: string
  shift: 'day' | 'night' | 'mixed'
  tool_category: string
  start_depth_meters: number
  end_depth_meters: number
  wear_pattern?: 'uniform' | 'centered' | 'eccentric' | 'one_sided'
  matrix?: 'good_condition' | 'moderate_wear' | 'severe_wear' | 'needs_replacement'
}

export interface CompleteReportDto {
  horometer_end_day?: number
  horometer_end_night?: number
}

export interface RejectReportDto {
  reason: string
}

export interface SignReportDto {
  signature_type: 'operator' | 'supervisor' | 'client'
  signature_method: 'digital' | 'physical' | 'electronic'
  signature_data?: string
}

/**
 * Repository interface for Drilling Reports
 */
export interface DrillingReportRepository {

  /**
   * Get paginated list of drilling reports
   */
  getList(filters: DrillingReportFilters): Promise<DrillingReportListResponse>

  /**
   * Get a drilling report by ID
   */
  getById(id: string): Promise<DrillingReportEntity>

  /**
   * Create a new drilling report
   */
  create(data: CreateDrillingReportDto): Promise<DrillingReportEntity>

  /**
   * Update an existing drilling report
   */
  update(id: string, data: UpdateDrillingReportDto): Promise<DrillingReportEntity>

  /**
   * Delete a drilling report
   */
  delete(id: string): Promise<void>

  /**
   * Add activity to a report
   */
  addActivity(reportId: string, data: AddActivityDto): Promise<void>

  /**
   * Record consumption in a report
   */
  recordConsumption(reportId: string, data: RecordConsumptionDto): Promise<void>

  /**
   * Assign tool to a report
   */
  assignTool(reportId: string, data: AssignToolDto): Promise<void>

  /**
   * Complete a report
   */
  complete(reportId: string, data: CompleteReportDto): Promise<DrillingReportEntity>

  /**
   * Approve a report
   */
  approve(reportId: string): Promise<DrillingReportEntity>

  /**
   * Reject a report
   */
  reject(reportId: string, data: RejectReportDto): Promise<DrillingReportEntity>

  /**
   * Sign a report
   */
  sign(reportId: string, data: SignReportDto): Promise<void>

  /**
   * Get report statistics
   */
  getStatistics(filters?: Partial<DrillingReportFilters>): Promise<{
    total_reports: number
    reports_by_status: Record<string, number>
    reports_by_shift: Record<string, number>
    total_hours: number
    total_meters: number
  }>

  /**
   * Export reports to different formats
   */
  export(filters: DrillingReportFilters, format: 'pdf' | 'excel' | 'csv'): Promise<Blob>
}
