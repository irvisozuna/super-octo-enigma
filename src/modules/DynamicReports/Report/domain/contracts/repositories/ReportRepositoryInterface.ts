/**
 * Report Repository Interface
 * Domain layer - Clean Architecture
 */

import type {
  ExportReportRequestDTO,
  ExportReportResponseDTO,
  FilterValueDTO,
  PaginationDTO,
  ReportConfigDTO,

  ReportListItemDTO,
  ReportSearchRequestDTO,
  ReportSearchResponseDTO
  ,
  Result,
  ShareReportRequestDTO,
  ShareReportResponseDTO,
  SortingRuleDTO,
} from '../../../application/dtos/ReportDtos'

/**
 * Report Data Service Interface
 * Domain layer - Clean Architecture
 */

/**
 * Export Service Interface
 * Domain layer - Clean Architecture
 */

/**
 * Share Service Interface
 * Domain layer - Clean Architecture
 */

export interface ReportRepositoryInterface {

  /**
   * Find report configuration by ID
   */
  findById(id: string): Promise<Result<ReportConfigDTO>>

  /**
   * Search reports with filters and pagination
   */
  search(request: ReportSearchRequestDTO): Promise<Result<ReportSearchResponseDTO>>

  /**
   * Save report configuration
   */
  save(config: ReportConfigDTO): Promise<Result<ReportConfigDTO>>

  /**
   * Update existing report
   */
  update(id: string, config: Partial<ReportConfigDTO>): Promise<Result<ReportConfigDTO>>

  /**
   * Delete report
   */
  delete(id: string): Promise<Result<void>>

  /**
   * Check if user can access report
   */
  canAccess(reportId: string, userId: string): Promise<Result<boolean>>

  /**
   * Update report execution statistics
   */
  updateStatistics(reportId: string, stats: {
    lastExecuted: Date
    executionTime: number
    executionCount: number
  }): Promise<Result<void>>

  /**
   * Get user's recent reports
   */
  getRecentReports(userId: string, limit?: number): Promise<Result<ReportListItemDTO[]>>

  /**
   * Get public reports
   */
  getPublicReports(limit?: number): Promise<Result<ReportListItemDTO[]>>

  /**
   * Clone existing report
   */
  clone(sourceId: string, newName: string, userId: string): Promise<Result<ReportConfigDTO>>
}

export interface ReportDataServiceInterface {

  /**
   * Execute report query and return data
   */
  executeReport(params: {
    config: ReportConfigDTO
    pagination: PaginationDTO
    filters: FilterValueDTO[]
    sorting: SortingRuleDTO[]
    quickSearch?: string
  }): Promise<Result<{
    records: any[]
    totalCount: number
  }>>

  /**
   * Validate report configuration
   */
  validateReportConfig(config: ReportConfigDTO): Promise<Result<{
    isValid: boolean
    errors: string[]
    warnings: string[]
  }>>

  /**
   * Get sample data for report preview
   */
  getSampleData(config: ReportConfigDTO, limit?: number): Promise<Result<any[]>>

  /**
   * Test database connection and query performance
   */
  testConnection(dataSourceId: string): Promise<Result<{
    isConnected: boolean
    responseTime: number
    version?: string
  }>>

  /**
   * Get available fields from data source
   */
  getAvailableFields(dataSourceId: string, tableName?: string): Promise<Result<Array<{
    name: string
    type: string
    nullable: boolean
    description?: string
  }>>>

  /**
   * Get field statistics
   */
  getFieldStatistics(
    dataSourceId: string,
    fieldName: string,
    filters?: FilterValueDTO[]
  ): Promise<Result<{
    uniqueValues: number
    minValue?: any
    maxValue?: any
    avgValue?: number
    nullCount: number
    sampleValues: any[]
  }>>
}

/**
 * Cache Service Interface
 * Domain layer - Clean Architecture
 */

export interface CacheServiceInterface {

  /**
   * Get cached value
   */
  get<T>(key: string): Promise<T | null>

  /**
   * Set cached value with TTL
   */
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>

  /**
   * Delete cached value
   */
  delete(key: string): Promise<void>

  /**
   * Clear cache by pattern
   */
  clearByPattern(pattern: string): Promise<void>

  /**
   * Check if key exists
   */
  exists(key: string): Promise<boolean>

  /**
   * Get remaining TTL for key
   */
  getTTL(key: string): Promise<number>

  /**
   * Increment counter
   */
  increment(key: string, increment?: number): Promise<number>

  /**
   * Get multiple values
   */
  getMultiple<T>(keys: string[]): Promise<Record<string, T | null>>

  /**
   * Set multiple values
   */
  setMultiple<T>(values: Record<string, T>, ttlSeconds?: number): Promise<void>
}

export interface ExportServiceInterface {

  /**
   * Export report to specified format
   */
  exportReport(request: ExportReportRequestDTO): Promise<Result<ExportReportResponseDTO>>

  /**
   * Get supported export formats
   */
  getSupportedFormats(): Promise<Result<string[]>>

  /**
   * Check export status
   */
  getExportStatus(exportId: string): Promise<Result<{
    status: 'pending' | 'processing' | 'completed' | 'failed'
    progress?: number
    downloadUrl?: string
    error?: string
  }>>

  /**
   * Cancel export operation
   */
  cancelExport(exportId: string): Promise<Result<void>>

  /**
   * Clean up expired export files
   */
  cleanupExpiredExports(): Promise<Result<number>>
}

export interface ShareServiceInterface {

  /**
   * Create shareable link for report
   */
  createShareLink(request: ShareReportRequestDTO): Promise<Result<ShareReportResponseDTO>>

  /**
   * Validate share token
   */
  validateShareToken(token: string): Promise<Result<{
    isValid: boolean
    reportId: string
    expiresAt: Date
    filters?: FilterValueDTO[]
    sorting?: SortingRuleDTO[]
  }>>

  /**
   * Revoke share link
   */
  revokeShareLink(token: string): Promise<Result<void>>

  /**
   * Get active share links for report
   */
  getActiveShares(reportId: string): Promise<Result<Array<{
    token: string
    createdAt: Date
    expiresAt: Date
    accessCount: number
  }>>>

  /**
   * Track share link access
   */
  trackAccess(token: string, metadata?: {
    userAgent?: string
    ipAddress?: string
    timestamp?: Date
  }): Promise<Result<void>>
}

/**
 * Notification Service Interface
 * Domain layer - Clean Architecture
 */

export interface NotificationServiceInterface {

  /**
   * Send export completion notification
   */
  notifyExportComplete(params: {
    userId: string
    reportName: string
    format: string
    downloadUrl: string
    fileSize: number
  }): Promise<Result<void>>

  /**
   * Send export failure notification
   */
  notifyExportFailed(params: {
    userId: string
    reportName: string
    format: string
    error: string
  }): Promise<Result<void>>

  /**
   * Send share notification
   */
  notifyReportShared(params: {
    userId: string
    reportName: string
    shareUrl: string
    expiresAt: Date
  }): Promise<Result<void>>

  /**
   * Send report execution error notification
   */
  notifyExecutionError(params: {
    userId: string
    reportName: string
    error: string
    timestamp: Date
  }): Promise<Result<void>>
}
