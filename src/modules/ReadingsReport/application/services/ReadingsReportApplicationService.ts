import type { ReadingsReportAdvanceResult } from '../../domain/value-objects/ReadingsReportAdvance'
import type { ReadingsReportEntity } from '../../domain/entities/ReadingsReportEntity'
import type { Period } from '../../domain/value-objects/Period'
import type { ReadingsReportFilters } from '../../domain/value-objects/ReadingsReportFilters'
import type { ReadingsReportListResult, ReadingsReportRepository } from '../../domain/repositories/ReadingsReportRepository'

export interface ReadingsReportListRequest {
  page?: number
  perPage?: number
  sortBy?: string
  sortDesc?: boolean
  filters?: ReadingsReportFilters
}

export interface ReadingsReportListResponse {
  data: ReadingsReportEntity[]
  meta: {
    total: number
    per_page?: number
    current_page?: number
    last_page?: number
  }
}

export class ReadingsReportApplicationService {
  constructor(private repository: ReadingsReportRepository) {}

  async getList(params: ReadingsReportListRequest): Promise<ReadingsReportListResponse> {
    const { page = 1, perPage = 15, sortBy = 'id', sortDesc = true, filters = {} } = params

    return this.repository.findAll({
      page,
      perPage,
      sortBy,
      sortDesc,
      ...filters,
    })
  }

  async getAdvance(params: ReadingsReportListRequest): Promise<ReadingsReportAdvanceResult> {
    const { page = 1, perPage = 15, sortBy = 'id', sortDesc = true, filters = {} } = params

    return this.repository.findAdvance({
      page,
      perPage,
      sortBy,
      sortDesc,
      ...filters,
    })
  }

  async getRoutesProgress(params: ReadingsReportListRequest): Promise<ReadingsReportListResult> {
    const { page = 1, perPage = 15, sortBy = 'id', sortDesc = true, filters = {} } = params

    return this.repository.findRoutesProgress({
      page,
      perPage,
      sortBy,
      sortDesc,
      ...filters,
    })
  }

  async exportList(type: 'excel' | 'pdf', params: ReadingsReportListRequest): Promise<Blob> {
    const { page = 1, perPage = 15, sortBy = 'id', sortDesc = true, filters = {} } = params

    return this.repository.export(type, {
      page,
      perPage,
      sortBy,
      sortDesc,
      ...filters,
    })
  }

  async getActivePeriod(): Promise<Period | null> {
    return this.repository.findActivePeriod()
  }
}
