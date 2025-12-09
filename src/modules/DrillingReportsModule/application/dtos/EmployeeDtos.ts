export interface EmployeeDto {
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

export interface EmployeeCreateDto {
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

export interface EmployeeUpdateDto {
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

export interface EmployeeListDto {
  data: EmployeeDto[]
  total: number
  page: number
  per_page: number
  last_page: number
}
