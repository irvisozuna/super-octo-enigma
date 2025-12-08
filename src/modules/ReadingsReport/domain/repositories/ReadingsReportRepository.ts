import type { ReadingsReportAdvanceResult } from '../value-objects/ReadingsReportAdvance'
import type { ReadingsReportEntity } from '../entities/ReadingsReportEntity'
import type { ReadingsReportFilters } from '../value-objects/ReadingsReportFilters'

export interface ReadingsReportQuery extends ReadingsReportFilters {
  page?: number
  perPage?: number
  sortBy?: string
  sortDesc?: boolean
}

export interface ReadingsReportListResult {
  data: ReadingsReportEntity[]
  meta: {
    total: number
    per_page?: number
    current_page?: number
    last_page?: number
  }
}

export interface ReadingsReportRepository {
  findAll(params: ReadingsReportQuery): Promise<ReadingsReportListResult>
  findRoutesProgress(params: ReadingsReportQuery): Promise<ReadingsReportListResult>
  findAdvance(params: ReadingsReportQuery): Promise<ReadingsReportAdvanceResult>
  export(format: 'excel' | 'pdf', params: ReadingsReportQuery): Promise<Blob>
}
