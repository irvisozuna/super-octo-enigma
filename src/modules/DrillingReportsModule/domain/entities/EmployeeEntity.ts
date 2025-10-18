export interface Employee {
  id: string
  employee_number: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  position: string
  department: string
  hire_date: string
  status: 'active' | 'inactive' | 'terminated'
  skills: string[]
  certifications: {
    name: string
    issued_by: string
    issued_date: string
    expiry_date?: string
  }[]
  created_at: string
  updated_at: string
}

export interface EmployeeCreateRequest {
  employee_number: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  position: string
  department: string
  hire_date: string
  skills: string[]
  certifications?: {
    name: string
    issued_by: string
    issued_date: string
    expiry_date?: string
  }[]
}

export interface EmployeeUpdateRequest {
  employee_number?: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  position?: string
  department?: string
  hire_date?: string
  status?: 'active' | 'inactive' | 'terminated'
  skills?: string[]
  certifications?: {
    name: string
    issued_by: string
    issued_date: string
    expiry_date?: string
  }[]
}

export interface EmployeeListResponse {
  data: Employee[]
  total: number
  page: number
  per_page: number
  last_page: number
}
