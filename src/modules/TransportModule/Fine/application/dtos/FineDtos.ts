/**
 * Fine DTOs - Application Layer
 *
 * Data Transfer Objects for fine-related operations
 */

export interface FineListDto {
  id: string
  fine_number: string
  violation_type: string
  violation_description: string
  amount: number
  penalty_points?: number
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'CONTESTED'
  issue_date: string
  due_date: string
  payment_date?: string
  issuing_officer: string
  issuing_authority: string
  vehicle_plate?: string
  driver_license?: string
  driver_name?: string
  location: string
  evidence_photos?: string[]
  created_at: string
  updated_at: string
}

export interface FineCreateDto {
  violation_type: string
  violation_description: string
  amount: number
  penalty_points?: number
  issue_date: string
  due_date: string
  issuing_officer: string
  issuing_authority: string
  vehicle_plate?: string
  driver_license?: string
  location: string
  evidence_photos?: File[]
  notes?: string
}

export interface FineUpdateDto {
  violation_type?: string
  violation_description?: string
  amount?: number
  penalty_points?: number
  status?: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'CONTESTED'
  due_date?: string
  payment_date?: string
  issuing_officer?: string
  issuing_authority?: string
  location?: string
  evidence_photos?: File[]
  notes?: string
}

export interface FineDetailDto extends FineListDto {
  notes?: string
  payment_method?: string
  payment_reference?: string
  contest_reason?: string
  contest_date?: string
  contest_status?: 'PENDING' | 'APPROVED' | 'REJECTED'
  resolution_notes?: string
  resolved_by?: string
  resolved_at?: string
  metadata?: Record<string, any>
}

export interface FineFilterDto {
  search?: string
  violation_type?: string
  status?: string
  vehicle_plate?: string
  driver_license?: string
  issuing_authority?: string
  amount_from?: number
  amount_to?: number
  issue_date_from?: string
  issue_date_to?: string
  due_date_from?: string
  due_date_to?: string
  page?: number
  per_page?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface FineStatsDto {
  total_fines: number
  pending_fines: number
  paid_fines: number
  overdue_fines: number
  total_amount: number
  paid_amount: number
  pending_amount: number
  overdue_amount: number
  fines_by_violation_type: Record<string, number>
  fines_by_status: Record<string, number>
  average_fine_amount: number
}

export interface FinePaymentDto {
  fine_id: string
  payment_amount: number
  payment_method: string
  payment_reference?: string
  payment_date: string
  notes?: string
}

export interface FineContestDto {
  fine_id: string
  contest_reason: string
  supporting_documents?: File[]
  notes?: string
}

export interface FineApiResponseDto<T> {
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

export interface FineBulkOperationDto {
  ids: string[]
  operation: 'delete' | 'mark_paid' | 'cancel' | 'send_reminder'
  payment_details?: {
    payment_method: string
    payment_reference?: string
    payment_date: string
  }
  reason?: string
}
