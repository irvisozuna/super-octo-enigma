import type { Contract } from './Contract'

// Metadata de paginación
export interface ContractsPaginationMeta {
  current_page: number
  per_page: number
  total: number
  from: number
  to: number
}

// Respuesta de listado de contratos
export interface ContractsResponse {
  data: Contract[]
  meta: ContractsPaginationMeta
}

// Respuesta de detalle de contrato
export interface ContractDetailResponse {
  data: Contract
}

// Filtros para listado de contratos
export interface ContractsFilters {
  page?: number
  per_page?: number
  search?: string
  account?: string
  contratid?: string
  status?: string
  sector?: string
  systems?: string
  type_contract?: string
  debt_months_min?: number
  debt_months_max?: number
}

// Respuesta de catálogos
export interface CatalogResponse {
  data: string[]
}
