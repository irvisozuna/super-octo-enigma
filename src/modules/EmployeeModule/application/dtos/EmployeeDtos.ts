/**
 * Employee Data Transfer Objects (DTOs)
 *
 * Define the structure of data exchanged with the API
 */

// Employee DTOs
export interface EmployeeCreateDto {
  employee_code: string
  first_name: string
  last_name: string
  date_of_birth?: string
  gender?: 'male' | 'female' | 'other'
  tax_id?: string
  photo_url?: string
  primary_phone?: string
  secondary_phone?: string
  email?: string
  address_line_1?: string
  address_line_2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  hire_date: string
  position: 'operator' | 'helper' | 'manager' | 'supervisor' | 'admin'
  department?: string
  employment_type: 'full_time' | 'part_time' | 'contractor' | 'temporary'
  salary_amount?: number
  salary_currency?: string
  status?: 'active' | 'inactive' | 'suspended' | 'terminated' | 'vacation'
}

export interface EmployeeUpdateDto extends Partial<EmployeeCreateDto> {
}

export interface EmployeeListDto {
  id: string
  employee_code: string
  first_name: string
  last_name: string
  full_name: string
  email?: string
  primary_phone?: string
  position: string
  department?: string
  employment_type: string
  status: string
  hire_date: string
  termination_date?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface EmployeeDetailDto extends EmployeeListDto {
  date_of_birth?: string
  gender?: string
  tax_id?: string
  photo_url?: string
  secondary_phone?: string
  address_line_1?: string
  address_line_2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  salary_amount?: number
  salary_currency?: string
  age?: number
  skills?: EmployeeSkillDto[]
  certifications?: EmployeeCertificationDto[]
  employment_history?: EmploymentHistoryDto[]
}

export interface EmployeeFilterDto {
  first_name?: string
  last_name?: string
  position?: string
  status?: string
  department?: string
  employment_type?: string
  page?: number
  per_page?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  search?: string
}

// Employee Skill DTOs
export interface EmployeeSkillDto {
  id: string
  employee_id: string
  skill_name: string
  proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  years_of_experience?: number
  acquired_date?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface EmployeeSkillCreateDto {
  skill_name: string
  proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  years_of_experience?: number
  acquired_date?: string
  notes?: string
}

export interface EmployeeSkillUpdateDto extends Partial<EmployeeSkillCreateDto> {
}

// Employee Certification DTOs
export interface EmployeeCertificationDto {
  id: string
  employee_id: string
  certification_name: string
  certification_number?: string
  issuing_organization: string
  issue_date: string
  expiration_date?: string
  status: string
  document_url?: string
  created_at: string
  updated_at: string
}

export interface EmployeeCertificationCreateDto {
  certification_name: string
  certification_number?: string
  issuing_organization: string
  issue_date: string
  expiration_date?: string
  status: string
  document_url?: string
}

// Employment History DTOs
export interface EmploymentHistoryDto {
  id: string
  employee_id: string
  change_type: string
  change_description?: string
  previous_position?: string
  new_position?: string
  previous_status?: string
  new_status?: string
  change_date: string
  reason?: string
  notes?: string
  changed_by?: string
  changed_by_user?: {
    id: string
    name: string
    email: string
  }
  created_at: string
  updated_at: string
}

// Pagination DTOs
export interface PaginationLinksDto {
  first: string | null
  last: string | null
  prev: string | null
  next: string | null
}

export interface PaginationMetaDto {
  current_page: number
  from: number
  last_page: number
  per_page: number
  to: number
  total: number
}

export interface PaginatedResponseDto<T> {
  data: T[]
  links?: PaginationLinksDto
  meta?: PaginationMetaDto
}

// Statistics DTOs
export interface EmployeeStatisticsDto {
  total: number
  active_count: number
  inactive_count: number
  by_status: Record<string, number>
  by_position: Record<string, number>
  by_employment_type: Record<string, number>
  recent_hires_count: number
}
