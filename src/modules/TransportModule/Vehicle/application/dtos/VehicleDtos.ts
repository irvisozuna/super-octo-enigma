// Vehicle DTOs
export interface VehicleCreateDto {
  plate_number: string
  vin: string
  brand: string
  model: string
  year: number
  color: string
  vehicle_type: 'BUS' | 'TAXI' | 'MICROBUS' | 'TRUCK'
  capacity: number
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'RETIRED'
  registration_date: string
  concession_id?: string
  drivers?: DriverCreateDto[]
}

export interface VehicleUpdateDto {
  plate_number?: string
  vin?: string
  brand?: string
  model?: string
  year?: number
  color?: string
  vehicle_type?: 'BUS' | 'TAXI' | 'MICROBUS' | 'TRUCK'
  capacity?: number
  status?: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'RETIRED'
  registration_date?: string
  concession_id?: string
}

export interface VehicleListDto {
  id: string
  plate_number: string
  vin: string
  brand: string
  model: string
  year: number
  color: string
  vehicle_type: string
  vehicle_type_label: string
  capacity: number
  status: string
  status_label: string
  registration_date: string
  concession_id?: string
  concession_number?: string
  created_at: string
  updated_at: string
  drivers?: DriverListDto[]
}

export interface VehicleDetailDto extends VehicleListDto {
  last_inspection_date?: string
  next_inspection_date?: string
  insurance_expiry?: string
  drivers: DriverListDto[]
}

export interface VehicleFilterDto {
  search?: string
  status?: string
  vehicle_type?: string
  concession_id?: string
  page?: number
  per_page?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

// Driver DTOs
export interface DriverCreateDto {
  first_name: string
  last_name: string
  birth_date: string
  license_number: string
  license_type: 'A' | 'B' | 'C' | 'D'
  license_issue_date: string
  license_expiration_date: string
  license_issuing_state: string
  vehicle_id?: string
  concession_id?: string
}

export interface DriverUpdateDto {
  first_name?: string
  last_name?: string
  birth_date?: string
  license_number?: string
  license_type?: 'A' | 'B' | 'C' | 'D'
  license_issue_date?: string
  license_expiration_date?: string
  license_issuing_state?: string
  vehicle_id?: string
  concession_id?: string
}

export interface DriverListDto {
  id: string
  first_name: string
  last_name: string
  full_name: string
  birth_date: string
  license_number: string
  license_type: string
  license_type_label: string
  license_issue_date: string
  license_expiration_date: string
  license_issuing_state: string
  status: string
  status_label: string
  vehicle_id?: string
  vehicle_plate?: string
  concession_id?: string
  concession_number?: string
  created_at: string
  updated_at: string
}

export interface DriverDetailDto extends DriverListDto {
  phone?: string
  email?: string
  address?: string
  emergency_contact?: string
  emergency_phone?: string
}

export interface DriverFilterDto {
  search?: string
  status?: string
  license_type?: string
  vehicle_id?: string
  concession_id?: string
  page?: number
  per_page?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
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
  links: Array<{
    url: string | null
    label: string
    active: boolean
  }>
  path: string
  per_page: number
  to: number
  total: number
}

export interface PaginatedResponseDto<T> {
  data: T[]
  links: PaginationLinksDto
  meta: PaginationMetaDto
}
