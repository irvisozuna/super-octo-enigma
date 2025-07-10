/**
 * Get Report Data Use Case
 * Following Clean Architecture and DDD principles
 */

import type {
  GetReportDataRequestDTO,
  ReportDataResponseDTO,
  Result,
} from '../dtos/ReportDtos'

import type { ReportRepositoryInterface } from '../../domain/contracts/repositories/ReportRepositoryInterface'
import type { ReportDataServiceInterface } from '../../domain/contracts/services/ReportDataServiceInterface'
import type { CacheServiceInterface } from '../../domain/contracts/services/CacheServiceInterface'

// Use Case Interface
export interface GetReportDataUseCaseInterface {
  execute(request: GetReportDataRequestDTO): Promise<Result<ReportDataResponseDTO>>
}

// Domain Error Classes
export class ReportNotFoundError extends Error {
  constructor(reportId: string) {
    super(`Report with ID ${reportId} not found`)
    this.name = 'ReportNotFoundError'
  }
}

export class ReportExecutionError extends Error {
  constructor(message: string, public readonly details?: any) {
    super(`Report execution failed: ${message}`)
    this.name = 'ReportExecutionError'
  }
}

export class InvalidFiltersError extends Error {
  constructor(message: string) {
    super(`Invalid filters: ${message}`)
    this.name = 'InvalidFiltersError'
  }
}

// Use Case Implementation
export class GetReportDataUseCase implements GetReportDataUseCaseInterface {
  constructor(
    private readonly reportRepository: ReportRepositoryInterface,
    private readonly reportDataService: ReportDataServiceInterface,
    private readonly cacheService: CacheServiceInterface,
  ) {}

  async execute(request: GetReportDataRequestDTO): Promise<Result<ReportDataResponseDTO>> {
    try {
      // 1. Validate request
      const validationResult = this.validateRequest(request)
      if (validationResult.isFailure())
        return validationResult

      // 2. Get report configuration
      const reportResult = await this.reportRepository.findById(request.reportId)
      if (reportResult.isFailure())
        return Result.failure(new ReportNotFoundError(request.reportId))

      const reportConfig = reportResult.getValue()

      // 3. Check cache if enabled
      const cacheKey = this.generateCacheKey(request)
      if (reportConfig.basicInfo?.performance?.cacheEnabled) {
        const cachedData = await this.cacheService.get(cacheKey)
        if (cachedData)
          return Result.success(cachedData as ReportDataResponseDTO)
      }

      // 4. Validate filters against report configuration
      const filterValidation = this.validateFilters(request.filters, reportConfig.filters)
      if (filterValidation.isFailure())
        return filterValidation

      // 5. Execute report query
      const executionStart = Date.now()

      const dataResult = await this.reportDataService.executeReport({
        config: reportConfig,
        pagination: request.pagination,
        filters: request.filters,
        sorting: request.sorting,
        quickSearch: request.quickSearch,
      })

      if (dataResult.isFailure()) {
        return Result.failure(new ReportExecutionError(
          dataResult.getError().message,
          dataResult.getError(),
        ))
      }

      const executionTime = Date.now() - executionStart

      // 6. Prepare response
      const response: ReportDataResponseDTO = {
        config: reportConfig,
        records: dataResult.getValue().records,
        totalRecords: dataResult.getValue().totalCount,
        executionTime,
        generatedAt: new Date(),
      }

      // 7. Cache result if caching is enabled
      if (reportConfig.basicInfo?.performance?.cacheEnabled) {
        const ttl = reportConfig.basicInfo.performance.cacheTTL || 300 // 5 minutes default

        await this.cacheService.set(cacheKey, response, ttl)
      }

      // 8. Update report statistics
      await this.updateReportStatistics(request.reportId, executionTime)

      return Result.success(response)
    }
    catch (error) {
      console.error('GetReportDataUseCase execution failed:', error)

      return Result.failure(new ReportExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
      ))
    }
  }

  private validateRequest(request: GetReportDataRequestDTO): Result<void> {
    if (!request.reportId || request.reportId.trim() === '')
      return Result.failure(new Error('Report ID is required'))

    if (!request.pagination)
      return Result.failure(new Error('Pagination parameters are required'))

    if (request.pagination.currentPage < 1)
      return Result.failure(new Error('Current page must be greater than 0'))

    if (request.pagination.itemsPerPage < 1 || request.pagination.itemsPerPage > 1000)
      return Result.failure(new Error('Items per page must be between 1 and 1000'))

    return Result.success(undefined)
  }

  private validateFilters(
    filters: any[],
    configuredFilters: any[],
  ): Result<void> {
    try {
      // Get all allowed filter fields from configuration
      const allowedFields = this.extractFilterFields(configuredFilters)

      // Validate each applied filter
      for (const filter of filters) {
        if (!allowedFields.includes(filter.field)) {
          return Result.failure(new InvalidFiltersError(
            `Filter field '${filter.field}' is not configured for this report`,
          ))
        }

        // Validate filter value based on operator
        if (!this.isValidFilterValue(filter)) {
          return Result.failure(new InvalidFiltersError(
            `Invalid filter value for field '${filter.field}' with operator '${filter.operator}'`,
          ))
        }
      }

      return Result.success(undefined)
    }
    catch (error) {
      return Result.failure(new InvalidFiltersError(
        error instanceof Error ? error.message : 'Filter validation failed',
      ))
    }
  }

  private extractFilterFields(filters: any[]): string[] {
    const fields: string[] = []

    const extractFromFilters = (filterList: any[]): void => {
      for (const filter of filterList) {
        if (filter.type === 'filter' && filter.field)
          fields.push(filter.field)
        else if (filter.type === 'group' && filter.children)
          extractFromFilters(filter.children)
      }
    }

    extractFromFilters(filters)

    return fields
  }

  private isValidFilterValue(filter: any): boolean {
    switch (filter.operator) {
      case 'is_null':
      case 'is_not_null':
        return true // No value needed

      case 'between':
        return Array.isArray(filter.value) && filter.value.length === 2

      case 'in':
      case 'not_in':
        return Array.isArray(filter.value) && filter.value.length > 0

      default:
        return filter.value !== undefined && filter.value !== null && filter.value !== ''
    }
  }

  private generateCacheKey(request: GetReportDataRequestDTO): string {
    const parts = [
      'report',
      request.reportId,
      `page_${request.pagination.currentPage}`,
      `size_${request.pagination.itemsPerPage}`,
      request.filters.length > 0 ? `filters_${this.hashObject(request.filters)}` : 'no_filters',
      request.sorting.length > 0 ? `sort_${this.hashObject(request.sorting)}` : 'no_sort',
      request.quickSearch ? `search_${this.hashString(request.quickSearch)}` : 'no_search',
    ]

    return parts.join(':')
  }

  private hashObject(obj: any): string {
    return btoa(JSON.stringify(obj)).replace(/[+/=]/g, '').substring(0, 16)
  }

  private hashString(str: string): string {
    return btoa(str).replace(/[+/=]/g, '').substring(0, 16)
  }

  private async updateReportStatistics(reportId: string, executionTime: number): Promise<void> {
    try {
      await this.reportRepository.updateStatistics(reportId, {
        lastExecuted: new Date(),
        executionTime,
        executionCount: 1, // This would be incremented
      })
    }
    catch (error) {
      // Log error but don't fail the main operation
      console.warn('Failed to update report statistics:', error)
    }
  }
}

// Factory function for dependency injection
export const createGetReportDataUseCase = (
  reportRepository: ReportRepositoryInterface,
  reportDataService: ReportDataServiceInterface,
  cacheService: CacheServiceInterface,
): GetReportDataUseCase => {
  return new GetReportDataUseCase(
    reportRepository,
    reportDataService,
    cacheService,
  )
}
