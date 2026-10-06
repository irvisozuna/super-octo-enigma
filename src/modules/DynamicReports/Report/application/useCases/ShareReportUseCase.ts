/**
 * Share Report Use Case
 * Following Clean Architecture and DDD principles
 */

import type {
  Result,
  ShareReportRequestDTO,
  ShareReportResponseDTO,
} from '../DTOs/ReportDTOs'

import type { ReportRepositoryInterface } from '../../domain/contracts/repositories/ReportRepositoryInterface'
import type { ShareServiceInterface } from '../../domain/contracts/services/ShareServiceInterface'
import type { NotificationServiceInterface } from '../../domain/contracts/services/NotificationServiceInterface.ts'

// Use Case Interface
export interface ShareReportUseCaseInterface {
  execute(request: ShareReportRequestDTO): Promise<Result<ShareReportResponseDTO>>
}

// Domain Error Classes
export class SharePermissionDeniedError extends Error {
  constructor(reportId: string) {
    super(`Share permission denied for report ${reportId}`)
    this.name = 'SharePermissionDeniedError'
  }
}

export class ShareLimitExceededError extends Error {
  constructor(limit: number) {
    super(`Share limit exceeded. Maximum ${limit} active shares allowed`)
    this.name = 'ShareLimitExceededError'
  }
}

export class InvalidShareExpirationError extends Error {
  constructor(message: string) {
    super(`Invalid share expiration: ${message}`)
    this.name = 'InvalidShareExpirationError'
  }
}

export class ShareGenerationError extends Error {
  constructor(message: string, public readonly details?: any) {
    super(`Share generation failed: ${message}`)
    this.name = 'ShareGenerationError'
  }
}

// Use Case Implementation
export class ShareReportUseCase implements ShareReportUseCaseInterface {
  private readonly MAX_ACTIVE_SHARES = 10
  private readonly MAX_EXPIRATION_HOURS = 8760 // 1 year
  private readonly DEFAULT_EXPIRATION_HOURS = 168 // 1 week

  constructor(
    private readonly reportRepository: ReportRepositoryInterface,
    private readonly shareService: ShareServiceInterface,
    private readonly notificationService: NotificationServiceInterface,
  ) {}

  async execute(request: ShareReportRequestDTO): Promise<Result<ShareReportResponseDTO>> {
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

      // 3. Check share permissions
      const permissionCheck = await this.checkSharePermissions(reportConfig)
      if (permissionCheck.isFailure())
        return permissionCheck

      // 4. Validate share limits
      const limitCheck = await this.validateShareLimits(request.reportId)
      if (limitCheck.isFailure())
        return limitCheck

      // 5. Validate expiration time
      const expirationValidation = this.validateExpiration(request.expiresIn)
      if (expirationValidation.isFailure())
        return expirationValidation

      // 6. Generate share link
      const shareResult = await this.generateShareLink(request, reportConfig)
      if (shareResult.isFailure())
        return shareResult

      const shareResponse = shareResult.getValue()

      // 7. Send notification
      await this.sendShareNotification(request, shareResponse, reportConfig.name)

      // 8. Log share activity
      await this.logShareActivity(request, shareResponse)

      return Result.success(shareResponse)
    }
    catch (error) {
      console.error('ShareReportUseCase execution failed:', error)

      return Result.failure(new ShareGenerationError(
        error instanceof Error ? error.message : 'Unknown error occurred',
      ))
    }
  }

  private validateRequest(request: ShareReportRequestDTO): Result<void> {
    if (!request.reportId || request.reportId.trim() === '')
      return Result.failure(new Error('Report ID is required'))

    if (request.password && request.password.length < 6)
      return Result.failure(new Error('Password must be at least 6 characters long'))

    if (request.expiresIn !== undefined && request.expiresIn <= 0)
      return Result.failure(new Error('Expiration time must be positive'))

    return Result.success(undefined)
  }

  private async checkSharePermissions(reportConfig: any): Promise<Result<void>> {
    try {
      // Check if the report allows sharing
      if (reportConfig.basicInfo?.isPublic === false) {
        // Only allow sharing if explicitly enabled for private reports
        if (!reportConfig.shareSettings?.enabled)
          return Result.failure(new SharePermissionDeniedError(reportConfig.id))
      }

      // Additional permission checks could be added here
      // e.g., user roles, organization policies, etc.

      return Result.success(undefined)
    }
    catch (error) {
      return Result.failure(new SharePermissionDeniedError(reportConfig.id))
    }
  }

  private async validateShareLimits(reportId: string): Promise<Result<void>> {
    try {
      const activeSharesResult = await this.shareService.getActiveShares(reportId)

      if (activeSharesResult.isFailure())
        return Result.failure(activeSharesResult.getError())

      const activeShares = activeSharesResult.getValue()

      if (activeShares.length >= this.MAX_ACTIVE_SHARES)
        return Result.failure(new ShareLimitExceededError(this.MAX_ACTIVE_SHARES))

      return Result.success(undefined)
    }
    catch (error) {
      return Result.failure(new Error('Failed to validate share limits'))
    }
  }

  private validateExpiration(expiresIn?: number): Result<void> {
    const hours = expiresIn || this.DEFAULT_EXPIRATION_HOURS

    if (hours > this.MAX_EXPIRATION_HOURS) {
      return Result.failure(new InvalidShareExpirationError(
        `Maximum expiration time is ${this.MAX_EXPIRATION_HOURS} hours`,
      ))
    }

    if (hours < 1) {
      return Result.failure(new InvalidShareExpirationError(
        'Minimum expiration time is 1 hour',
      ))
    }

    return Result.success(undefined)
  }

  private async generateShareLink(
    request: ShareReportRequestDTO,
    reportConfig: any,
  ): Promise<Result<ShareReportResponseDTO>> {
    try {
      // Enhance request with additional metadata
      const enhancedRequest = {
        ...request,
        expiresIn: request.expiresIn || this.DEFAULT_EXPIRATION_HOURS,
        metadata: {
          reportName: reportConfig.name,
          sharedBy: 'current-user', // This should come from auth context
          sharedAt: new Date(),
          permissions: this.determineSharePermissions(reportConfig),
          restrictions: this.determineShareRestrictions(reportConfig),
        },
      }

      const shareResult = await this.shareService.createShareLink(enhancedRequest)

      if (shareResult.isFailure()) {
        return Result.failure(new ShareGenerationError(
          shareResult.getError().message,
        ))
      }

      const shareData = shareResult.getValue()

      // Generate user-friendly share URL
      const response: ShareReportResponseDTO = {
        shareUrl: this.buildShareUrl(shareData.token, request.filters, request.sorting),
        token: shareData.token,
        expiresAt: shareData.expiresAt,
      }

      return Result.success(response)
    }
    catch (error) {
      return Result.failure(new ShareGenerationError(
        error instanceof Error ? error.message : 'Share link generation failed',
      ))
    }
  }

  private buildShareUrl(
    token: string,
    filters: any[] = [],
    sorting: any[] = [],
  ): string {
    const baseUrl = this.getBaseUrl()
    const params = new URLSearchParams()

    params.set('token', token)

    if (filters.length > 0)
      params.set('filters', this.encodeFilters(filters))

    if (sorting.length > 0)
      params.set('sorting', this.encodeSorting(sorting))

    return `${baseUrl}/reports/shared?${params.toString()}`
  }

  private getBaseUrl(): string {
    // In a real application, this would come from configuration
    return typeof window !== 'undefined'
      ? window.location.origin
      : 'https://app.example.com'
  }

  private encodeFilters(filters: any[]): string {
    try {
      return btoa(JSON.stringify(filters))
    }
    catch {
      return ''
    }
  }

  private encodeSorting(sorting: any[]): string {
    try {
      return btoa(JSON.stringify(sorting))
    }
    catch {
      return ''
    }
  }

  private determineSharePermissions(reportConfig: any): string[] {
    const permissions = ['view']

    if (reportConfig.shareSettings?.allowExport)
      permissions.push('export')

    if (reportConfig.shareSettings?.allowFiltering)
      permissions.push('filter')

    return permissions
  }

  private determineShareRestrictions(reportConfig: any): Record<string, any> {
    return {
      maxRows: reportConfig.shareSettings?.maxRows || 10000,
      allowedFormats: reportConfig.shareSettings?.allowedExportFormats || ['pdf', 'csv'],
      watermark: reportConfig.shareSettings?.addWatermark || false,
      ipRestrictions: reportConfig.shareSettings?.ipWhitelist || [],
      domainRestrictions: reportConfig.shareSettings?.domainWhitelist || [],
    }
  }

  private async sendShareNotification(
    request: ShareReportRequestDTO,
    response: ShareReportResponseDTO,
    reportName: string,
  ): Promise<void> {
    try {
      await this.notificationService.notifyReportShared({
        userId: 'current-user', // This should come from auth context
        reportName,
        shareUrl: response.shareUrl,
        expiresAt: response.expiresAt,
      })
    }
    catch (error) {
      console.warn('Failed to send share notification:', error)
    }
  }

  private async logShareActivity(
    request: ShareReportRequestDTO,
    response: ShareReportResponseDTO,
  ): Promise<void> {
    try {
      // Log share activity for audit purposes
      console.log('Share link created:', {
        reportId: request.reportId,
        token: response.token,
        expiresAt: response.expiresAt,
        hasPassword: !!request.password,
        hasFilters: request.filters.length > 0,
        hasSorting: request.sorting.length > 0,
        timestamp: new Date(),
      })

      // Here you could send to an audit logging service
    }
    catch (error) {
      console.warn('Failed to log share activity:', error)
    }
  }

  // Additional methods for managing shares

  async revokeShare(token: string): Promise<Result<void>> {
    try {
      return await this.shareService.revokeShareLink(token)
    }
    catch (error) {
      return Result.failure(new Error(
        error instanceof Error ? error.message : 'Failed to revoke share',
      ))
    }
  }

  async getActiveShares(reportId: string): Promise<Result<any[]>> {
    try {
      return await this.shareService.getActiveShares(reportId)
    }
    catch (error) {
      return Result.failure(new Error(
        error instanceof Error ? error.message : 'Failed to get active shares',
      ))
    }
  }

  async validateShareAccess(token: string): Promise<Result<any>> {
    try {
      const validationResult = await this.shareService.validateShareToken(token)

      if (validationResult.isFailure())
        return validationResult

      const shareData = validationResult.getValue()

      // Track access
      await this.shareService.trackAccess(token, {
        timestamp: new Date(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      })

      return Result.success(shareData)
    }
    catch (error) {
      return Result.failure(new Error(
        error instanceof Error ? error.message : 'Failed to validate share access',
      ))
    }
  }
}

// Factory function for dependency injection
export const createShareReportUseCase = (
  reportRepository: ReportRepositoryInterface,
  shareService: ShareServiceInterface,
  notificationService: NotificationServiceInterface,
): ShareReportUseCase => {
  return new ShareReportUseCase(
    reportRepository,
    shareService,
    notificationService,
  )
}
