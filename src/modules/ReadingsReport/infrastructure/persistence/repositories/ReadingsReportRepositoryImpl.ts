import type { Period } from '../../../domain/value-objects/Period'
import type { ReadingsReportAdvanceResult, ReadingsReportListResult, ReadingsReportQuery, ReadingsReportRepository } from '../../../domain/repositories/ReadingsReportRepository'
import type { ReadingsReportEntity } from '../../../domain/entities/ReadingsReportEntity'
import { exportReadingsReport, fetchActivePeriod, fetchReadingsReportAdvance, fetchReadingsReportList, fetchRoutesProgress } from '../../api/ReadingsReportApi'

export class ReadingsReportRepositoryImpl implements ReadingsReportRepository {
  async findAll(params: ReadingsReportQuery): Promise<ReadingsReportListResult> {
    const response = await fetchReadingsReportList({
      page: params.page,
      per_page: params.perPage,
      sort_by: params.sortBy,
      sort_desc: params.sortDesc ? 1 : 0,
      ...params,
    })

    return {
      data: response.data as ReadingsReportEntity[],
      meta: {
        total: response.meta.total,
        per_page: response.meta.per_page,
        current_page: response.meta.current_page,
        last_page: response.meta.last_page,
      },
    }
  }

  async findAdvance(params: ReadingsReportQuery): Promise<ReadingsReportAdvanceResult> {
    return fetchReadingsReportAdvance({
      page: params.page,
      per_page: params.perPage,
      sort_by: params.sortBy,
      sort_desc: params.sortDesc ? 1 : 0,
      ...params,
    })
  }

  async findRoutesProgress(params: ReadingsReportQuery): Promise<ReadingsReportListResult> {
    const response = await fetchRoutesProgress({
      page: params.page,
      per_page: params.perPage,
      sort_by: params.sortBy,
      sort_desc: params.sortDesc ? 1 : 0,
      ...params,
    })

    return {
      data: response.data as any,
      meta: {
        total: response.meta?.total ?? response.data.length,
        per_page: response.meta?.per_page,
        current_page: response.meta?.current_page,
        last_page: response.meta?.last_page,
      },
    }
  }

  async findActivePeriod(): Promise<Period | null> {
    return fetchActivePeriod()
  }

  async export(format: 'excel' | 'pdf', params: ReadingsReportQuery): Promise<Blob> {
    return exportReadingsReport(format, {
      page: params.page,
      per_page: params.perPage,
      sort_by: params.sortBy,
      sort_desc: params.sortDesc ? 1 : 0,
      ...params,
    })
  }
}
