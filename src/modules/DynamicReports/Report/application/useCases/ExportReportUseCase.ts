/**
 * Export Report Use Case
 * Following Clean Architecture and DDD principles
 */

import type {
  ExportReportRequestDTO,
  ExportReportResponseDTO,
  Result,
} from '../dtos/ReportDtos'

import type { ReportRepositoryInterface } from '../../domain/contracts/repositories/ReportRepositoryInterface'
import type { ExportServiceInterface } from '../../domain/contracts/services/ExportServiceInterface'
import type { NotificationServiceInterface } from '../../domain/contracts/services/NotificationServiceInterface'

// Use Case Interface
export interface ExportReportUseCaseInterface {
  execute(request: ExportReportRequestDTO): Promise<Result<ExportReportResponseDTO>>
}

// Domain Error Classes
export class ExportFormatNotSupportedError extends Error {
  constructor(format: string) {
    super(`Export format '${format}' is not supported`)
    this.name = 'ExportFormatNotSupportedError'
  }
}

export class ExportPermissionDeniedError extends Error {
  constructor(reportId: string) {
    super(`Export permission denied for report ${reportId}`)
    this.name = 'ExportPermissionDeniedError'
  }
}

export class ExportSizeLimitExceededError extends Error {
  constructor(size: number, limit: number) {
    super(`Export size ${size} exceeds limit ${limit}`)
    this.name = 'ExportSizeLimitExceededError'
  }
}

export class ExportGenerationError extends Error {
  constructor(message: string, public readonly details?: any) {
    super(`Export generation failed: ${message}`)
    this.name = 'ExportGenerationError'
  }
}

// Use Case Implementation
export class ExportReportUseCase implements ExportReportUseCaseInterface {
  private readonly MAX_EXPORT_SIZE = 50 * 1024 * 1024 // 50MB
  private readonly SUPPORTED_FORMATS = ['pdf', 'excel', 'csv', 'json']

  constructor(
    private readonly reportRepository: ReportRepositoryInterface,
    private readonly exportService: ExportServiceInterface,
    private readonly notificationService: NotificationServiceInterface,
  ) {}

  async execute(request: ExportReportRequestDTO): Promise<Result<ExportReportResponseDTO>> {
    try {
      // 1. Validate request
      const validationResult = this.validateRequest(request)
      if (validationResult.isFailure())
        return validationResult

      // 2. Get report configuration
      const reportResult = await this.reportRepository.findById(request.reportId)
      if (reportResult.isFailure())
        return Result.failure(new Error(`Report not found: ${request.reportId}`))

      const reportConfig = reportResult.getValue()

      // 3. Check export permissions
      const permissionCheck = await this.checkExportPermissions(reportConfig, request.format)
      if (permissionCheck.isFailure())
        return permissionCheck

      // 4. Validate export format
      const formatValidation = await this.validateExportFormat(request.format)
      if (formatValidation.isFailure())
        return formatValidation

      // 5. Estimate export size and validate limits
      const sizeValidation = await this.validateExportSize(request)
      if (sizeValidation.isFailure())
        return sizeValidation

      // 6. Generate export
      const exportResult = await this.generateExport(request, reportConfig)
      if (exportResult.isFailure()) {
        // Send failure notification
        await this.sendFailureNotification(request, exportResult.getError())

        return exportResult
      }

      const exportResponse = exportResult.getValue()

      // 7. Send success notification
      await this.sendSuccessNotification(request, exportResponse, reportConfig.name)

      // 8. Log export activity
      await this.logExportActivity(request, exportResponse)

      return Result.success(exportResponse)
    }
    catch (error) {
      console.error('ExportReportUseCase execution failed:', error)

      // Send failure notification
      await this.sendFailureNotification(request, error as Error)

      return Result.failure(new ExportGenerationError(
        error instanceof Error ? error.message : 'Unknown error occurred',
      ))
    }
  }

  private validateRequest(request: ExportReportRequestDTO): Result<void> {
    if (!request.reportId || request.reportId.trim() === '')
      return Result.failure(new Error('Report ID is required'))

    if (!request.format || request.format.trim() === '')
      return Result.failure(new Error('Export format is required'))

    if (!request.visibleColumns || request.visibleColumns.length === 0)
      return Result.failure(new Error('At least one column must be visible for export'))

    if (request.fileName && !/^[\w.-]+$/.test(request.fileName))
      return Result.failure(new Error('Invalid file name format'))

    return Result.success(undefined)
  }

  private async checkExportPermissions(reportConfig: any, format: string): Promise<Result<void>> {
    try {
      // Check if export is enabled for this report
      if (!reportConfig.exportOptions?.formats)
        return Result.failure(new ExportPermissionDeniedError(reportConfig.id))

      // Check if specific format is allowed
      const allowedFormat = reportConfig.exportOptions.formats.find((f: any) =>
        f.id === format && f.enabled,
      )

      if (!allowedFormat)
        return Result.failure(new ExportPermissionDeniedError(reportConfig.id))

      // Additional permission checks could be added here
      // e.g., user roles, subscription limits, etc.

      return Result.success(undefined)
    }
    catch (error) {
      return Result.failure(new ExportPermissionDeniedError(reportConfig.id))
    }
  }

  private async validateExportFormat(format: string): Promise<Result<void>> {
    try {
      const supportedFormats = await this.exportService.getSupportedFormats()

      if (supportedFormats.isFailure())
        return Result.failure(supportedFormats.getError())

      const formats = supportedFormats.getValue()

      if (!formats.includes(format))
        return Result.failure(new ExportFormatNotSupportedError(format))

      return Result.success(undefined)
    }
    catch (error) {
      return Result.failure(new ExportFormatNotSupportedError(format))
    }
  }

  private async validateExportSize(request: ExportReportRequestDTO): Promise<Result<void>> {
    try {
      // Estimate export size based on data volume and format
      const estimatedSize = this.estimateExportSize(request)

      if (estimatedSize > this.MAX_EXPORT_SIZE) {
        return Result.failure(new ExportSizeLimitExceededError(
          estimatedSize,
          this.MAX_EXPORT_SIZE,
        ))
      }

      return Result.success(undefined)
    }
    catch (error) {
      return Result.failure(new Error('Failed to validate export size'))
    }
  }

  private estimateExportSize(request: ExportReportRequestDTO): number {
    // Basic size estimation algorithm
    const baseRowSize = request.visibleColumns.length * 50 // 50 bytes per column average
    const estimatedRows = 10000 // This should come from actual data count
    const formatMultiplier = this.getFormatSizeMultiplier(request.format)

    return baseRowSize * estimatedRows * formatMultiplier
  }

  private getFormatSizeMultiplier(format: string): number {
    switch (format) {
      case 'pdf':
        return 3.0 // PDF files are typically larger
      case 'excel':
        return 2.0 // Excel files have overhead
      case 'csv':
        return 1.0 // CSV is most compact
      case 'json':
        return 1.5 // JSON has structure overhead
      default:
        return 2.0
    }
  }

  private async generateExport(
    request: ExportReportRequestDTO,
    reportConfig: any,
  ): Promise<Result<ExportReportResponseDTO>> {
    try {
      // Add metadata to export request
      const enhancedRequest = {
        ...request,
        fileName: request.fileName || this.generateFileName(reportConfig.name, request.format),
        metadata: {
          reportName: reportConfig.name,
          reportId: request.reportId,
          generatedAt: new Date(),
          generatedBy: 'system', // This should come from auth context
          filters: request.filters,
          sorting: request.sorting,
        },
      }

      return await this.exportService.exportReport(enhancedRequest)
    }
    catch (error) {
      return Result.failure(new ExportGenerationError(
        error instanceof Error ? error.message : 'Export generation failed',
      ))
    }
  }

  private generateFileName(reportName: string, format: string): string {
    const timestamp = new Date().toISOString().split('T')[0]
    const sanitizedName = reportName.replace(/[^a-z0-9]/gi, '_')
    const extension = this.getFileExtension(format)

    return `${sanitizedName}_${timestamp}.${extension}`
  }

  private getFileExtension(format: string): string {
    switch (format) {
      case 'excel':
        return 'xlsx'
      case 'pdf':
        return 'pdf'
      case 'csv':
        return 'csv'
      case 'json':
        return 'json'
      default:
        return 'txt'
    }
  }

  private async sendSuccessNotification(
    request: ExportReportRequestDTO,
    response: ExportReportResponseDTO,
    reportName: string,
  ): Promise<void> {
    try {
      await this.notificationService.notifyExportComplete({
        userId: 'current-user', // This should come from auth context
        reportName,
        format: request.format,
        downloadUrl: response.downloadUrl,
        fileSize: response.fileSize,
      })
    }
    catch (error) {
      console.warn('Failed to send export success notification:', error)
    }
  }

  private async sendFailureNotification(
    request: ExportReportRequestDTO,
    error: Error,
  ): Promise<void> {
    try {
      await this.notificationService.notifyExportFailed({
        userId: 'current-user', // This should come from auth context
        reportName: `Report ${request.reportId}`,
        format: request.format,
        error: error.message,
      })
    }
    catch (notificationError) {
      console.warn('Failed to send export failure notification:', notificationError)
    }
  }

  private async logExportActivity(
    request: ExportReportRequestDTO,
    response: ExportReportResponseDTO,
  ): Promise<void> {
    try {
      // Log export activity for audit purposes
      console.log('Export completed:', {
        reportId: request.reportId,
        format: request.format,
        fileSize: response.fileSize,
        fileName: response.fileName,
        timestamp: new Date(),
      })

      // Here you could send to an audit logging service
    }
    catch (error) {
      console.warn('Failed to log export activity:', error)
    }
  }
}

// Factory function for dependency injection
export const createExportReportUseCase = (
  reportRepository: ReportRepositoryInterface,
  exportService: ExportServiceInterface,
  notificationService: NotificationServiceInterface,
): ExportReportUseCase => {
  return new ExportReportUseCase(
    reportRepository,
    exportService,
    notificationService,
  )
}
