/**
 * Contract DTOs - Application Layer
 */

export interface ContractDto {
  id: string
  local_id?: string | number
  company_id: string
  contract_id: string
  external_user_id: string
  contract_type: string
  route: string
  rate: string
  status: string
  period: string
  contract_number: string
  user_name: string
  address: string
  rfc: string
  business_activity: string
  charge_type: string
  fixed_m3: number
  meter_number: string
  socket_diameter: string
  average_consumption: number
  sequence: number
  cadastral_number: string
  clave_loc: string
  firefighters: boolean
  litigation: boolean
  pensionary: boolean
  due_date_pensioner: string
  handicapped: boolean
  due_date_handicapped: string
  months_debt: number
  debt: number
  is_active: boolean
  downloaded_at: string
  meta: any
  metadata: any
  system: { id?: string; external_id?: string; code?: string; name?: string } | string | null
  sector: { id?: string; external_id?: string; code?: string; name?: string } | string | null
  debt_concepts: any[]
  charge_concepts: any[]
}

export interface PaginatedContractsResponseDto {
  data: ContractDto[]
  meta?: {
    current_page?: number
    last_page?: number
    per_page?: number
    total?: number
    from?: number
    to?: number
  }
  pagination?: {
    limit?: number
    offset?: number
    count?: number
    total?: number
  }
}

export interface UpdateContractRequestDto {
  // Add fields that can be updated
  user_name?: string
  address?: string
  rfc?: string
}
