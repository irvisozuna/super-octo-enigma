/**
 * Export Service Interface
 * Domain layer - Clean Architecture
 *
 * Defines the contract for report export functionality
 */

import type {
  ExportReportRequestDTO,
  ExportReportResponseDTO,
  FieldConfigDTO,
  FilterValueDTO,
  Result,
  SortingRuleDTO,
} from '../../../application/dtos/ReportDtos'

/**
 * Interface for managing report export functionality
 */
export interface ExportServiceInterface {

  /**
   * Export report to specified format
   *
   * @param request - Export request containing all necessary data
   * @returns Promise resolving to export response with download URL
   *
   * @example
   * ```typescript
   * const exportRequest = {
   *   reportId: 'report-123',
   *   format: 'excel',
   *   filters: [],
   *   sorting: [],
   *   visibleColumns: ['name', 'email', 'created_at'],
   *   fileName: 'user_report.xlsx'
   * }
   *
   * const result = await exportService.exportReport(exportRequest)
   * if (result.isSuccess()) {
   *   const { downloadUrl, fileName, fileSize } = result.getValue()
   *   window.open(downloadUrl)
   * }
   * ```
   */
  exportReport(request: ExportReportRequestDTO): Promise<Result<ExportReportResponseDTO>>

  /**
   * Get list of supported export formats
   *
   * @returns Promise resolving to array of supported format identifiers
   *
   * @example
   * ```typescript
   * const result = await exportService.getSupportedFormats()
   * if (result.isSuccess()) {
   *   const formats = result.getValue() // ['pdf', 'excel', 'csv', 'json']
   * }
   * ```
   */
  getSupportedFormats(): Promise<Result<string[]>>

  /**
   * Get detailed information about available export formats
   *
   * @returns Promise resolving to array of format configurations
   */
  getFormatConfigurations(): Promise<Result<ExportFormatConfiguration[]>>

  /**
   * Check export status for asynchronous exports
   *
   * @param exportId - ID of the export job
   * @returns Promise resolving to export status
   *
   * @example
   * ```typescript
   * const result = await exportService.getExportStatus('export-job-123')
   * if (result.isSuccess()) {
   *   const status = result.getValue()
   *   console.log(`Status: ${status.status}, Progress: ${status.progress}%`)
   * }
   * ```
   */
  getExportStatus(exportId: string): Promise<Result<ExportStatus>>

  /**
   * Cancel a running export operation
   *
   * @param exportId - ID of the export job to cancel
   * @returns Promise resolving to void if successful
   *
   * @example
   * ```typescript
   * const result = await exportService.cancelExport('export-job-123')
   * if (result.isSuccess()) {
   *   console.log('Export cancelled successfully')
   * }
   * ```
   */
  cancelExport(exportId: string): Promise<Result<void>>

  /**
   * Schedule export for future execution
   *
   * @param request - Scheduled export request
   * @returns Promise resolving to scheduled export response
   *
   * @example
   * ```typescript
   * const scheduledExport = {
   *   ...exportRequest,
   *   scheduledFor: new Date('2024-12-31T23:59:59Z'),
   *   recurring: {
   *     frequency: 'monthly',
   *     interval: 1,
   *     endDate: new Date('2025-12-31')
   *   }
   * }
   * ```
   */
  scheduleExport(request: ScheduledExportRequest): Promise<Result<ScheduledExportResponse>>

  /**
   * Get list of scheduled exports for a user or report
   *
   * @param options - Query options for filtering scheduled exports
   * @returns Promise resolving to array of scheduled exports
   */
  getScheduledExports(options: ScheduledExportQuery): Promise<Result<ScheduledExport[]>>

  /**
   * Update or modify a scheduled export
   *
   * @param scheduleId - ID of the scheduled export
   * @param updates - Updates to apply
   * @returns Promise resolving to updated scheduled export
   */
  updateScheduledExport(scheduleId: string, updates: Partial<ScheduledExportRequest>): Promise<Result<ScheduledExport>>

  /**
   * Delete a scheduled export
   *
   * @param scheduleId - ID of the scheduled export to delete
   * @returns Promise resolving to void if successful
   */
  deleteScheduledExport(scheduleId: string): Promise<Result<void>>

  /**
   * Clean up expired export files
   *
   * @param olderThanDays - Remove files older than specified days
   * @returns Promise resolving to number of files cleaned up
   *
   * @example
   * ```typescript
   * const result = await exportService.cleanupExpiredExports(7)
   * if (result.isSuccess()) {
   *   console.log(`Cleaned up ${result.getValue()} expired files`)
   * }
   * ```
   */
  cleanupExpiredExports(olderThanDays?: number): Promise<Result<number>>

  /**
   * Get export statistics and analytics
   *
   * @param options - Query options for export statistics
   * @returns Promise resolving to export statistics
   */
  getExportStatistics(options: ExportStatisticsQuery): Promise<Result<ExportStatistics>>

  /**
   * Validate export request before processing
   *
   * @param request - Export request to validate
   * @returns Promise resolving to validation result
   */
  validateExportRequest(request: ExportReportRequestDTO): Promise<Result<ExportValidationResult>>

  /**
   * Estimate export file size and processing time
   *
   * @param request - Export request to estimate
   * @returns Promise resolving to export estimation
   */
  estimateExport(request: ExportReportRequestDTO): Promise<Result<ExportEstimation>>

  /**
   * Generate export with custom template
   *
   * @param request - Export request with template information
   * @returns Promise resolving to templated export response
   */
  exportWithTemplate(request: TemplatedExportRequest): Promise<Result<ExportReportResponseDTO>>

  /**
   * Export data in streaming mode for large datasets
   *
   * @param request - Streaming export request
   * @returns Promise resolving to streaming export response
   */
  streamExport(request: StreamingExportRequest): Promise<Result<StreamingExportResponse>>

  /**
   * Compress multiple exports into a single archive
   *
   * @param request - Batch export request
   * @returns Promise resolving to compressed export response
   */
  batchExport(request: BatchExportRequest): Promise<Result<ExportReportResponseDTO>>
}

// ================================
// Supporting Types and Interfaces
// ================================

/**
 * Export format configuration
 */
export interface ExportFormatConfiguration {

  /** Format identifier */
  id: string

  /** Display name */
  name: string

  /** File extension */
  extension: string

  /** MIME type */
  mimeType: string

  /** Icon identifier */
  icon: string

  /** Color for UI display */
  color: string

  /** Whether format is enabled */
  enabled: boolean

  /** Maximum file size supported (in bytes) */
  maxFileSize?: number

  /** Maximum number of rows supported */
  maxRows?: number

  /** Whether format supports multiple sheets/tabs */
  supportsMultipleSheets: boolean

  /** Whether format supports rich formatting */
  supportsFormatting: boolean

  /** Whether format supports images/charts */
  supportsImages: boolean

  /** Whether format supports hyperlinks */
  supportsHyperlinks: boolean

  /** Available options for this format */
  options: ExportFormatOptions

  /** Template options if supported */
  templateOptions?: ExportTemplateOptions
}

/**
 * Export format specific options
 */
export interface ExportFormatOptions {

  /** Excel specific options */
  excel?: {
    includeFormulas: boolean
    includeCharts: boolean
    passwordProtect: boolean
    sheetNames: string[]
    freezePanes: boolean
    autoFilter: boolean
    includeComments: boolean
  }

  /** PDF specific options */
  pdf?: {
    pageSize: 'A4' | 'A3' | 'Letter' | 'Legal'
    orientation: 'portrait' | 'landscape'
    includeHeader: boolean
    includeFooter: boolean
    watermark: string
    compression: 'none' | 'low' | 'medium' | 'high'
    passwordProtect: boolean
  }

  /** CSV specific options */
  csv?: {
    delimiter: ',' | ';' | '|' | '\t'
    quoteChar: '"' | '\''
    escapeChar: '\\'
    includeHeaders: boolean
    encoding: 'utf-8' | 'latin1' | 'ascii'
    lineEnding: '\n' | '\r\n' | '\r'
  }

  /** JSON specific options */
  json?: {
    pretty: boolean
    includeMetadata: boolean
    dateFormat: 'iso' | 'timestamp' | 'custom'
    customDateFormat?: string
    nullValues: 'null' | 'empty' | 'skip'
  }
}

/**
 * Export template options
 */
export interface ExportTemplateOptions {

  /** Available templates */
  templates: ExportTemplate[]

  /** Whether custom templates are supported */
  supportsCustomTemplates: boolean

  /** Template variables that can be used */
  availableVariables: string[]
}

/**
 * Export template definition
 */
export interface ExportTemplate {

  /** Template ID */
  id: string

  /** Template name */
  name: string

  /** Template description */
  description: string

  /** Template content/path */
  content: string

  /** Template variables */
  variables: TemplateVariable[]

  /** Preview image URL */
  previewUrl?: string

  /** Whether template is built-in or custom */
  isBuiltIn: boolean
}

/**
 * Template variable definition
 */
export interface TemplateVariable {

  /** Variable name */
  name: string

  /** Variable type */
  type: 'string' | 'number' | 'date' | 'boolean' | 'image'

  /** Variable description */
  description: string

  /** Default value */
  defaultValue?: any

  /** Whether variable is required */
  required: boolean

  /** Validation rules */
  validation?: {
    pattern?: string
    minLength?: number
    maxLength?: number
    minValue?: number
    maxValue?: number
  }
}

/**
 * Export status information
 */
export interface ExportStatus {

  /** Export job ID */
  exportId: string

  /** Current status */
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

  /** Progress percentage (0-100) */
  progress: number

  /** Status message */
  message: string

  /** When export was started */
  startedAt: Date

  /** When export was completed/failed */
  completedAt?: Date

  /** Download URL if completed */
  downloadUrl?: string

  /** File size if completed */
  fileSize?: number

  /** Error details if failed */
  error?: {
    code: string
    message: string
    details?: any
  }

  /** Estimated completion time */
  estimatedCompletionAt?: Date

  /** Processing statistics */
  stats?: {
    recordsProcessed: number
    totalRecords: number
    processingRate: number // records per second
  }
}

/**
 * Scheduled export request
 */
export interface ScheduledExportRequest extends ExportReportRequestDTO {

  /** When to execute the export */
  scheduledFor: Date

  /** Recurring schedule configuration */
  recurring?: RecurringSchedule

  /** Email recipients for the export */
  emailRecipients?: string[]

  /** Custom email subject */
  emailSubject?: string

  /** Custom email message */
  emailMessage?: string

  /** Whether to include export as attachment */
  includeAsAttachment: boolean

  /** Maximum number of executions (-1 for unlimited) */
  maxExecutions?: number

  /** Timezone for scheduling */
  timezone: string
}

/**
 * Recurring schedule configuration
 */
export interface RecurringSchedule {

  /** Frequency of execution */
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'

  /** Interval between executions */
  interval: number

  /** End date for recurring schedule */
  endDate?: Date

  /** Days of week (for weekly frequency) */
  daysOfWeek?: number[]

  /** Day of month (for monthly frequency) */
  dayOfMonth?: number

  /** Time of day for execution */
  timeOfDay: string // HH:MM format
}

/**
 * Scheduled export response
 */
export interface ScheduledExportResponse {

  /** Scheduled export ID */
  scheduleId: string

  /** Next execution time */
  nextExecution: Date

  /** Schedule status */
  status: 'active' | 'paused' | 'expired' | 'completed'

  /** Creation timestamp */
  createdAt: Date

  /** Created by user ID */
  createdBy: string
}

/**
 * Scheduled export record
 */
export interface ScheduledExport extends ScheduledExportResponse {

  /** Export request details */
  exportRequest: ExportReportRequestDTO

  /** Recurring schedule if applicable */
  recurring?: RecurringSchedule

  /** Execution history */
  executions: ScheduledExportExecution[]

  /** Last execution result */
  lastExecution?: ScheduledExportExecution
}

/**
 * Scheduled export execution record
 */
export interface ScheduledExportExecution {

  /** Execution ID */
  executionId: string

  /** Execution timestamp */
  executedAt: Date

  /** Execution status */
  status: 'success' | 'failure' | 'skipped'

  /** Result file URL if successful */
  resultUrl?: string

  /** File size if successful */
  fileSize?: number

  /** Error message if failed */
  error?: string

  /** Execution duration in milliseconds */
  duration: number

  /** Number of records exported */
  recordCount?: number
}

/**
 * Scheduled export query options
 */
export interface ScheduledExportQuery {

  /** Filter by user ID */
  userId?: string

  /** Filter by report ID */
  reportId?: string

  /** Filter by status */
  status?: 'active' | 'paused' | 'expired' | 'completed'

  /** Filter by frequency */
  frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'

  /** Date range filter */
  dateRange?: {
    from: Date
    to: Date
  }

  /** Pagination */
  pagination?: {
    page: number
    limit: number
  }

  /** Sorting */
  sort?: {
    field: 'createdAt' | 'nextExecution' | 'lastExecution'
    direction: 'asc' | 'desc'
  }
}

/**
 * Export statistics query options
 */
export interface ExportStatisticsQuery {

  /** Date range for statistics */
  dateRange: {
    from: Date
    to: Date
  }

  /** Group statistics by */
  groupBy?: 'day' | 'week' | 'month' | 'format' | 'user' | 'report'

  /** Filter by user ID */
  userId?: string

  /** Filter by report ID */
  reportId?: string

  /** Filter by export format */
  format?: string
}

/**
 * Export statistics result
 */
export interface ExportStatistics {

  /** Total number of exports */
  totalExports: number

  /** Total file size exported (bytes) */
  totalFileSize: number

  /** Average export duration (milliseconds) */
  averageDuration: number

  /** Success rate (0-1) */
  successRate: number

  /** Most popular export format */
  popularFormat: string

  /** Export trends over time */
  trends: {
    date: string
    count: number
    totalSize: number
    averageDuration: number
  }[]

  /** Format distribution */
  formatDistribution: {
    format: string
    count: number
    percentage: number
  }[]

  /** User activity */
  userActivity: {
    userId: string
    exportCount: number
    totalSize: number
  }[]

  /** Most exported reports */
  topReports: {
    reportId: string
    reportName: string
    exportCount: number
  }[]

  /** Error statistics */
  errorStats: {
    totalErrors: number
    errorTypes: {
      type: string
      count: number
      percentage: number
    }[]
  }
}

/**
 * Export validation result
 */
export interface ExportValidationResult {

  /** Whether export request is valid */
  isValid: boolean

  /** Validation errors */
  errors: {
    field: string
    message: string
    code: string
  }[]

  /** Validation warnings */
  warnings: {
    field: string
    message: string
    code: string
  }[]

  /** Estimated file size */
  estimatedFileSize?: number

  /** Estimated processing time */
  estimatedDuration?: number

  /** Resource requirements */
  resourceRequirements?: {
    memoryMB: number
    diskSpaceMB: number
    cpuCores: number
  }
}

/**
 * Export estimation result
 */
export interface ExportEstimation {

  /** Estimated file size in bytes */
  estimatedFileSize: number

  /** Estimated processing time in milliseconds */
  estimatedDuration: number

  /** Estimated memory usage in MB */
  estimatedMemoryUsage: number

  /** Estimated cost (if applicable) */
  estimatedCost?: number

  /** Resource availability */
  resourceAvailability: {
    available: boolean
    waitTime?: number
    queuePosition?: number
  }

  /** Recommendations */
  recommendations: string[]
}

/**
 * Templated export request
 */
export interface TemplatedExportRequest extends ExportReportRequestDTO {

  /** Template ID to use */
  templateId: string

  /** Template variables */
  templateVariables: Record<string, any>

  /** Custom template content (for dynamic templates) */
  customTemplate?: string
}

/**
 * Streaming export request
 */
export interface StreamingExportRequest extends ExportReportRequestDTO {

  /** Chunk size for streaming */
  chunkSize: number

  /** Callback URL for streaming progress */
  progressCallback?: string

  /** Compression for streaming */
  compression?: 'gzip' | 'deflate' | 'none'
}

/**
 * Streaming export response
 */
export interface StreamingExportResponse {

  /** Stream ID */
  streamId: string

  /** Stream URL */
  streamUrl: string

  /** Stream token for authentication */
  streamToken: string

  /** Stream expires at */
  expiresAt: Date

  /** Expected chunk count */
  expectedChunks: number
}

/**
 * Batch export request
 */
export interface BatchExportRequest {

  /** Multiple export requests */
  exports: ExportReportRequestDTO[]

  /** Archive format */
  archiveFormat: 'zip' | 'tar' | '7z'

  /** Archive name */
  archiveName: string

  /** Archive password */
  archivePassword?: string

  /** Whether to include manifest file */
  includeManifest: boolean
}

// ================================
// Error Types
// ================================

/**
 * Export-specific error types
 */
export class ExportFormatNotSupportedError extends Error {
  constructor(format: string) {
    super(`Export format not supported: ${format}`)
    this.name = 'ExportFormatNotSupportedError'
  }
}

export class ExportSizeLimitExceededError extends Error {
  constructor(size: number, limit: number) {
    super(`Export size ${size} bytes exceeds limit of ${limit} bytes`)
    this.name = 'ExportSizeLimitExceededError'
  }
}

export class ExportJobNotFoundError extends Error {
  constructor(exportId: string) {
    super(`Export job not found: ${exportId}`)
    this.name = 'ExportJobNotFoundError'
  }
}

export class ExportTemplateNotFoundError extends Error {
  constructor(templateId: string) {
    super(`Export template not found: ${templateId}`)
    this.name = 'ExportTemplateNotFoundError'
  }
}

export class ExportQuotaExceededError extends Error {
  constructor(quotaType: string) {
    super(`Export quota exceeded: ${quotaType}`)
    this.name = 'ExportQuotaExceededError'
  }
}

// ================================
// Utility Types
// ================================

/**
 * Export priority levels
 */
export type ExportPriority = 'low' | 'normal' | 'high' | 'urgent'

/**
 * Export compression types
 */
export type ExportCompression = 'none' | 'fast' | 'balanced' | 'best'

/**
 * Default export configurations
 */
export const DEFAULT_EXPORT_OPTIONS = {
  maxFileSize: 100 * 1024 * 1024, // 100MB
  maxRows: 1000000, // 1M rows
  defaultTimeout: 300000, // 5 minutes
  chunkSize: 10000, // rows per chunk
  retentionDays: 7,
  maxConcurrentExports: 5,
} as const
