/**
 * Share Service Interface
 * Domain layer - Clean Architecture
 *
 * Defines the contract for report sharing functionality
 */

import type {
  FilterValueDTO,
  Result,
  ShareReportRequestDTO,
  ShareReportResponseDTO,
  SortingRuleDTO,
} from '../../../application/dtos/ReportDtos'

/**
 * Interface for managing report sharing functionality
 */
export interface ShareServiceInterface {

  /**
   * Create a shareable link for a report
   *
   * @param request - Share request containing report ID, filters, sorting, and options
   * @returns Promise resolving to share response with URL and token
   *
   * @example
   * ```typescript
   * const shareRequest = {
   *   reportId: 'report-123',
   *   filters: [],
   *   sorting: [],
   *   expiresIn: 168 // 1 week in hours
   * }
   *
   * const result = await shareService.createShareLink(shareRequest)
   * if (result.isSuccess()) {
   *   const { shareUrl, token, expiresAt } = result.getValue()
   *   console.log('Share URL:', shareUrl)
   * }
   * ```
   */
  createShareLink(request: ShareReportRequestDTO): Promise<Result<ShareReportResponseDTO>>

  /**
   * Validate a share token and return share details
   *
   * @param token - Share token to validate
   * @returns Promise resolving to share validation result
   *
   * @example
   * ```typescript
   * const result = await shareService.validateShareToken('abc123token')
   * if (result.isSuccess()) {
   *   const shareData = result.getValue()
   *   console.log('Report ID:', shareData.reportId)
   *   console.log('Expires at:', shareData.expiresAt)
   * }
   * ```
   */
  validateShareToken(token: string): Promise<Result<ShareValidationResult>>

  /**
   * Revoke an existing share link
   *
   * @param token - Share token to revoke
   * @returns Promise resolving to void if successful
   *
   * @example
   * ```typescript
   * const result = await shareService.revokeShareLink('abc123token')
   * if (result.isSuccess()) {
   *   console.log('Share link revoked successfully')
   * }
   * ```
   */
  revokeShareLink(token: string): Promise<Result<void>>

  /**
   * Get all active share links for a specific report
   *
   * @param reportId - ID of the report to get shares for
   * @returns Promise resolving to array of active shares
   *
   * @example
   * ```typescript
   * const result = await shareService.getActiveShares('report-123')
   * if (result.isSuccess()) {
   *   const shares = result.getValue()
   *   shares.forEach(share => {
   *     console.log(`Token: ${share.token}, Expires: ${share.expiresAt}`)
   *   })
   * }
   * ```
   */
  getActiveShares(reportId: string): Promise<Result<ActiveShare[]>>

  /**
   * Track access to a shared report
   *
   * @param token - Share token being accessed
   * @param metadata - Optional metadata about the access
   * @returns Promise resolving to void if successful
   *
   * @example
   * ```typescript
   * const result = await shareService.trackAccess('abc123token', {
   *   userAgent: navigator.userAgent,
   *   ipAddress: '192.168.1.1',
   *   timestamp: new Date()
   * })
   * ```
   */
  trackAccess(token: string, metadata?: ShareAccessMetadata): Promise<Result<void>>

  /**
   * Update share link permissions
   *
   * @param token - Share token to update
   * @param permissions - New permissions to set
   * @returns Promise resolving to updated share data
   *
   * @example
   * ```typescript
   * const result = await shareService.updatePermissions('abc123token', {
   *   allowExport: false,
   *   allowFiltering: true,
   *   maxAccess: 100
   * })
   * ```
   */
  updatePermissions(token: string, permissions: SharePermissions): Promise<Result<ShareReportResponseDTO>>

  /**
   * Extend expiration time of a share link
   *
   * @param token - Share token to extend
   * @param additionalHours - Hours to add to current expiration
   * @returns Promise resolving to updated share data
   *
   * @example
   * ```typescript
   * const result = await shareService.extendExpiration('abc123token', 72) // Add 3 days
   * if (result.isSuccess()) {
   *   const { expiresAt } = result.getValue()
   *   console.log('New expiration:', expiresAt)
   * }
   * ```
   */
  extendExpiration(token: string, additionalHours: number): Promise<Result<ShareReportResponseDTO>>

  /**
   * Get share statistics for a report
   *
   * @param reportId - ID of the report to get statistics for
   * @returns Promise resolving to share statistics
   */
  getShareStatistics(reportId: string): Promise<Result<ShareStatistics>>

  /**
   * Bulk revoke all share links for a report
   *
   * @param reportId - ID of the report to revoke all shares for
   * @returns Promise resolving to number of revoked shares
   */
  revokeAllShares(reportId: string): Promise<Result<number>>

  /**
   * Generate a password-protected share link
   *
   * @param request - Share request with password
   * @returns Promise resolving to protected share response
   */
  createProtectedShare(request: ProtectedShareRequest): Promise<Result<ShareReportResponseDTO>>

  /**
   * Validate password for a protected share
   *
   * @param token - Share token
   * @param password - Password to validate
   * @returns Promise resolving to validation result
   */
  validateSharePassword(token: string, password: string): Promise<Result<boolean>>
}

// ================================
// Supporting Types and Interfaces
// ================================

/**
 * Result of share token validation
 */
export interface ShareValidationResult {

  /** Whether the token is valid and not expired */
  isValid: boolean

  /** ID of the shared report */
  reportId: string

  /** When the share expires */
  expiresAt: Date

  /** Applied filters from when share was created */
  filters?: FilterValueDTO[]

  /** Applied sorting from when share was created */
  sorting?: SortingRuleDTO[]

  /** Share permissions */
  permissions: SharePermissions

  /** Share restrictions */
  restrictions: ShareRestrictions

  /** Share metadata */
  metadata: ShareMetadata
}

/**
 * Active share information
 */
export interface ActiveShare {

  /** Share token */
  token: string

  /** When the share was created */
  createdAt: Date

  /** When the share expires */
  expiresAt: Date

  /** Number of times the share has been accessed */
  accessCount: number

  /** Last access timestamp */
  lastAccessedAt?: Date

  /** Share permissions */
  permissions: SharePermissions

  /** Whether the share is password protected */
  isPasswordProtected: boolean
}

/**
 * Share access tracking metadata
 */
export interface ShareAccessMetadata {

  /** User agent string */
  userAgent?: string

  /** IP address of the accessor */
  ipAddress?: string

  /** Timestamp of access */
  timestamp?: Date

  /** Referrer URL */
  referrer?: string

  /** Screen resolution */
  screenResolution?: string

  /** Browser language */
  language?: string

  /** Geographic location (if available) */
  location?: {
    country?: string
    city?: string
    timezone?: string
  }
}

/**
 * Share permissions configuration
 */
export interface SharePermissions {

  /** Allow viewing the report */
  allowView: boolean

  /** Allow exporting the report */
  allowExport: boolean

  /** Allow applying filters */
  allowFiltering: boolean

  /** Allow changing sorting */
  allowSorting: boolean

  /** Allow changing view mode */
  allowViewMode: boolean

  /** Maximum number of accesses allowed (-1 for unlimited) */
  maxAccess: number

  /** Allowed export formats */
  allowedExportFormats: string[]

  /** Whether to show watermark */
  showWatermark: boolean
}

/**
 * Share restrictions configuration
 */
export interface ShareRestrictions {

  /** Maximum number of rows to display */
  maxRows: number

  /** IP address whitelist */
  ipWhitelist: string[]

  /** Domain whitelist for embedding */
  domainWhitelist: string[]

  /** Time-based access restrictions */
  timeRestrictions?: {

    /** Start time (HH:MM format) */
    startTime: string

    /** End time (HH:MM format) */
    endTime: string

    /** Allowed days of week (0-6, Sunday=0) */
    allowedDays: number[]

    /** Timezone for time restrictions */
    timezone: string
  }

  /** Geographic restrictions */
  geoRestrictions?: {

    /** Allowed countries (ISO codes) */
    allowedCountries: string[]

    /** Blocked countries (ISO codes) */
    blockedCountries: string[]
  }
}

/**
 * Share metadata
 */
export interface ShareMetadata {

  /** User who created the share */
  createdBy: string

  /** Share creation timestamp */
  createdAt: Date

  /** Share purpose/description */
  purpose?: string

  /** Tags for organization */
  tags: string[]

  /** Department or team */
  department?: string

  /** Project or campaign name */
  project?: string
}

/**
 * Share statistics
 */
export interface ShareStatistics {

  /** Total number of active shares */
  totalActiveShares: number

  /** Total number of accesses across all shares */
  totalAccesses: number

  /** Most accessed share */
  mostAccessedShare?: {
    token: string
    accessCount: number
  }

  /** Recent access activity (last 30 days) */
  recentActivity: {
    date: string
    accessCount: number
  }[]

  /** Geographic distribution of accesses */
  geographicDistribution: {
    country: string
    accessCount: number
  }[]

  /** Browser/device statistics */
  deviceStatistics: {
    browser: string
    deviceType: string
    accessCount: number
  }[]
}

/**
 * Protected share request
 */
export interface ProtectedShareRequest extends ShareReportRequestDTO {

  /** Password for the protected share */
  password: string

  /** Password hint (optional) */
  passwordHint?: string

  /** Whether to require password on every access */
  requirePasswordEveryAccess?: boolean
}

/**
 * Share link configuration options
 */
export interface ShareLinkOptions {

  /** Custom alias for the share link */
  customAlias?: string

  /** Whether to generate a short URL */
  generateShortUrl?: boolean

  /** Whether to include analytics tracking */
  enableAnalytics?: boolean

  /** Custom expiration date (overrides expiresIn) */
  customExpirationDate?: Date

  /** Whether to send email notification when share is accessed */
  notifyOnAccess?: boolean

  /** Custom message to display when share is accessed */
  welcomeMessage?: string
}

// ================================
// Error Types
// ================================

/**
 * Share-specific error types
 */
export class ShareTokenNotFoundError extends Error {
  constructor(token: string) {
    super(`Share token not found: ${token}`)
    this.name = 'ShareTokenNotFoundError'
  }
}

export class ShareTokenExpiredError extends Error {
  constructor(token: string, expiresAt: Date) {
    super(`Share token expired on ${expiresAt.toISOString()}: ${token}`)
    this.name = 'ShareTokenExpiredError'
  }
}

export class ShareAccessDeniedError extends Error {
  constructor(reason: string) {
    super(`Share access denied: ${reason}`)
    this.name = 'ShareAccessDeniedError'
  }
}

export class ShareLimitReachedError extends Error {
  constructor(limit: number) {
    super(`Share access limit reached: ${limit}`)
    this.name = 'ShareLimitReachedError'
  }
}

export class InvalidSharePasswordError extends Error {
  constructor() {
    super('Invalid share password')
    this.name = 'InvalidSharePasswordError'
  }
}

// ================================
// Utility Types
// ================================

/**
 * Share token validation status
 */
export type ShareTokenStatus =
  | 'valid'
  | 'expired'
  | 'revoked'
  | 'not_found'
  | 'access_denied'
  | 'limit_reached'

/**
 * Share access result
 */
export interface ShareAccessResult {
  status: ShareTokenStatus
  message: string
  shareData?: ShareValidationResult
  remainingAccess?: number
}

/**
 * Default implementation helper
 */
export const DEFAULT_SHARE_PERMISSIONS: SharePermissions = {
  allowView: true,
  allowExport: false,
  allowFiltering: true,
  allowSorting: true,
  allowViewMode: true,
  maxAccess: -1, // Unlimited
  allowedExportFormats: ['pdf', 'csv'],
  showWatermark: false,
}

export const DEFAULT_SHARE_RESTRICTIONS: ShareRestrictions = {
  maxRows: 10000,
  ipWhitelist: [],
  domainWhitelist: [],
}
