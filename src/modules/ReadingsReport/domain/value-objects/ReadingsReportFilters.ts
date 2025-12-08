// src/modules/ReadingsReport/domain/value-objects/ReadingsReportFilters.ts
export interface ReadingsReportFilters {
  search?: string
  contract_id?: number | null
  customer_id?: number | null
  period_id?: number | null
  sector_id?: number | null
  route_id?: number | null
  status?: string | null
  from?: string | null
  to?: string | null
}

export const ReadingsReportFiltersDefaults: ReadingsReportFilters = {
  search: '',
  contract_id: null,
  customer_id: null,
  period_id: null,
  sector_id: null,
  route_id: null,
  status: null,
  from: null,
  to: null,
}
