export interface ContractsFilters {
  page?: number
  per_page?: number
  search?: string
  status?: string
  sector?: string
  systems?: string
  debt_months?: number
}

export interface ContractsSortOptions {
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export type ContractsQueryParams = ContractsFilters & ContractsSortOptions
