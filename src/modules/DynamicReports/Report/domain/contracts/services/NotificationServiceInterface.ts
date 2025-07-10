/**
 * Notification Service Interface
 * Domain layer - Clean Architecture
 *
 * Defines the contract for all notification functionality in the system
 */

import type { Result } from '../../../application/dtos/ReportDtos'

/**
 * Interface for managing all types of notifications
 */
export interface NotificationServiceInterface {

  // ================================
  // Export Notifications
  // ================================

  /**
   * Send notification when report export completes successfully
   *
   * @param params - Export completion notification parameters
   * @returns Promise resolving to void if successful
   *
   * @example
   * ```typescript
   * await notificationService.notifyExportComplete({
   *   userId: 'user-123',
   *   reportName: 'Sales Report Q4',
   *   format: 'excel',
   *   downloadUrl: 'https://example.com/download/report.xlsx',
   *   fileSize: 2048576
   * })
   * ```
   */
  notifyExportComplete(params: ExportCompleteNotification): Promise<Result<void>>

  /**
   * Send notification when report export fails
   *
   * @param params - Export failure notification parameters
   * @returns Promise resolving to void if successful
   *
   * @example
   * ```typescript
   * await notificationService.notifyExportFailed({
   *   userId: 'user-123',
   *   reportName: 'Sales Report Q4',
   *   format: 'pdf',
   *   error: 'Insufficient memory to generate large report'
   * })
   * ```
   */
  notifyExportFailed(params: ExportFailedNotification): Promise<Result<void>>

  // ================================
  // Share Notifications
  // ================================

  /**
   * Send notification when report is shared
   *
   * @param params - Report shared notification parameters
   * @returns Promise resolving to void if successful
   *
   * @example
   * ```typescript
   * await notificationService.notifyReportShared({
   *   userId: 'user-123',
   *   reportName: 'Monthly KPIs',
   *   shareUrl: 'https://example.com/reports/shared?token=abc123',
   *   expiresAt: new Date('2024-12-31')
   * })
   * ```
   */
  notifyReportShared(params: ReportSharedNotification): Promise<Result<void>>

  /**
   * Send notification when someone accesses a shared report
   *
   * @param params - Share access notification parameters
   * @returns Promise resolving to void if successful
   *
   * @example
   * ```typescript
   * await notificationService.notifyShareAccessed({
   *   ownerId: 'user-123',
   *   reportName: 'Monthly KPIs',
   *   accessedBy: 'external-user',
   *   accessTime: new Date(),
   *   ipAddress: '192.168.1.1'
   * })
   * ```
   */
  notifyShareAccessed(params: ShareAccessedNotification): Promise<Result<void>>

  /**
   * Send notification when share link is about to expire
   *
   * @param params - Share expiring notification parameters
   * @returns Promise resolving to void if successful
   */
  notifyShareExpiring(params: ShareExpiringNotification): Promise<Result<void>>

  // ================================
  // Report Execution Notifications
  // ================================

  /**
   * Send notification when report execution encounters an error
   *
   * @param params - Execution error notification parameters
   * @returns Promise resolving to void if successful
   *
   * @example
   * ```typescript
   * await notificationService.notifyExecutionError({
   *   userId: 'user-123',
   *   reportName: 'Complex Analytics Report',
   *   error: 'Database connection timeout after 30 seconds',
   *   timestamp: new Date()
   * })
   * ```
   */
  notifyExecutionError(params: ExecutionErrorNotification): Promise<Result<void>>

  /**
   * Send notification when scheduled report execution completes
   *
   * @param params - Scheduled execution notification parameters
   * @returns Promise resolving to void if successful
   */
  notifyScheduledExecution(params: ScheduledExecutionNotification): Promise<Result<void>>

  /**
   * Send notification when report data is updated/refreshed
   *
   * @param params - Data refresh notification parameters
   * @returns Promise resolving to void if successful
   */
  notifyDataRefresh(params: DataRefreshNotification): Promise<Result<void>>

  // ================================
  // System Notifications
  // ================================

  /**
   * Send notification for system maintenance or updates
   *
   * @param params - System notification parameters
   * @returns Promise resolving to void if successful
   */
  notifySystemUpdate(params: SystemNotification): Promise<Result<void>>

  /**
   * Send notification when report quota is approaching limit
   *
   * @param params - Quota warning notification parameters
   * @returns Promise resolving to void if successful
   */
  notifyQuotaWarning(params: QuotaWarningNotification): Promise<Result<void>>

  /**
   * Send notification when security event occurs
   *
   * @param params - Security notification parameters
   * @returns Promise resolving to void if successful
   */
  notifySecurityEvent(params: SecurityNotification): Promise<Result<void>>

  // ================================
  // Collaboration Notifications
  // ================================

  /**
   * Send notification when user is mentioned in report comments
   *
   * @param params - Mention notification parameters
   * @returns Promise resolving to void if successful
   */
  notifyMention(params: MentionNotification): Promise<Result<void>>

  /**
   * Send notification when report is commented on
   *
   * @param params - Comment notification parameters
   * @returns Promise resolving to void if successful
   */
  notifyComment(params: CommentNotification): Promise<Result<void>>

  /**
   * Send notification when report access is granted/revoked
   *
   * @param params - Access change notification parameters
   * @returns Promise resolving to void if successful
   */
  notifyAccessChange(params: AccessChangeNotification): Promise<Result<void>>

  // ================================
  // Bulk and Management Operations
  // ================================

  /**
   * Send multiple notifications in batch
   *
   * @param notifications - Array of notifications to send
   * @returns Promise resolving to batch result
   */
  sendBulkNotifications(notifications: BulkNotificationRequest[]): Promise<Result<BulkNotificationResult>>

  /**
   * Get notification preferences for a user
   *
   * @param userId - ID of the user
   * @returns Promise resolving to user's notification preferences
   */
  getUserPreferences(userId: string): Promise<Result<NotificationPreferences>>

  /**
   * Update notification preferences for a user
   *
   * @param userId - ID of the user
   * @param preferences - New notification preferences
   * @returns Promise resolving to void if successful
   */
  updateUserPreferences(userId: string, preferences: NotificationPreferences): Promise<Result<void>>

  /**
   * Mark notifications as read
   *
   * @param userId - ID of the user
   * @param notificationIds - Array of notification IDs to mark as read
   * @returns Promise resolving to void if successful
   */
  markAsRead(userId: string, notificationIds: string[]): Promise<Result<void>>

  /**
   * Get notification history for a user
   *
   * @param userId - ID of the user
   * @param options - Query options for filtering and pagination
   * @returns Promise resolving to notification history
   */
  getNotificationHistory(userId: string, options?: NotificationQueryOptions): Promise<Result<NotificationHistoryResult>>

  /**
   * Delete old notifications based on retention policy
   *
   * @param retentionDays - Number of days to keep notifications
   * @returns Promise resolving to number of deleted notifications
   */
  cleanupOldNotifications(retentionDays: number): Promise<Result<number>>
}

// ================================
// Notification Parameter Types
// ================================

/**
 * Export completion notification parameters
 */
export interface ExportCompleteNotification {

  /** User ID who requested the export */
  userId: string

  /** Name of the exported report */
  reportName: string

  /** Export format (excel, pdf, csv, etc.) */
  format: string

  /** URL to download the exported file */
  downloadUrl: string

  /** File size in bytes */
  fileSize: number

  /** Expiration time for the download link */
  linkExpiresAt?: Date

  /** Additional metadata */
  metadata?: {
    exportDuration?: number
    recordCount?: number
    appliedFilters?: string[]
  }
}

/**
 * Export failure notification parameters
 */
export interface ExportFailedNotification {

  /** User ID who requested the export */
  userId: string

  /** Name of the report that failed to export */
  reportName: string

  /** Export format that was attempted */
  format: string

  /** Error message describing the failure */
  error: string

  /** Error code for categorization */
  errorCode?: string

  /** Suggested actions to resolve the issue */
  suggestedActions?: string[]
}

/**
 * Report shared notification parameters
 */
export interface ReportSharedNotification {

  /** User ID who shared the report */
  userId: string

  /** Name of the shared report */
  reportName: string

  /** Public share URL */
  shareUrl: string

  /** When the share link expires */
  expiresAt: Date

  /** Recipients if shared via email */
  recipients?: string[]

  /** Custom message included with the share */
  message?: string

  /** Share permissions summary */
  permissions?: {
    canExport: boolean
    canFilter: boolean
    hasPasswordProtection: boolean
  }
}

/**
 * Share accessed notification parameters
 */
export interface ShareAccessedNotification {

  /** Owner of the shared report */
  ownerId: string

  /** Name of the accessed report */
  reportName: string

  /** Identifier of who accessed (could be email, name, or 'anonymous') */
  accessedBy: string

  /** When the access occurred */
  accessTime: Date

  /** IP address of the accessor */
  ipAddress?: string

  /** Geographic location if available */
  location?: string

  /** User agent information */
  userAgent?: string

  /** Number of total accesses to this share */
  totalAccesses?: number
}

/**
 * Share expiring notification parameters
 */
export interface ShareExpiringNotification {

  /** Owner of the shared report */
  ownerId: string

  /** Name of the report */
  reportName: string

  /** Share token */
  shareToken: string

  /** When the share will expire */
  expiresAt: Date

  /** How many hours until expiration */
  hoursUntilExpiration: number

  /** Number of accesses so far */
  accessCount: number
}

/**
 * Execution error notification parameters
 */
export interface ExecutionErrorNotification {

  /** User ID who owns or requested the report */
  userId: string

  /** Name of the report that failed */
  reportName: string

  /** Error message */
  error: string

  /** When the error occurred */
  timestamp: Date

  /** Error severity level */
  severity?: 'low' | 'medium' | 'high' | 'critical'

  /** Error category */
  category?: 'database' | 'memory' | 'timeout' | 'permission' | 'validation' | 'unknown'

  /** Steps to reproduce the error */
  reproductionSteps?: string[]
}

/**
 * Scheduled execution notification parameters
 */
export interface ScheduledExecutionNotification {

  /** User ID who owns the scheduled report */
  userId: string

  /** Name of the executed report */
  reportName: string

  /** Execution status */
  status: 'success' | 'failure' | 'partial'

  /** Execution timestamp */
  executedAt: Date

  /** Next scheduled execution time */
  nextExecution?: Date

  /** Execution statistics */
  stats?: {
    duration: number
    recordCount: number
    dataFreshness: Date
  }

  /** Generated file URL if applicable */
  resultUrl?: string
}

/**
 * Data refresh notification parameters
 */
export interface DataRefreshNotification {

  /** User ID to notify */
  userId: string

  /** Name of the report with refreshed data */
  reportName: string

  /** When the data was refreshed */
  refreshedAt: Date

  /** Data source that was refreshed */
  dataSource: string

  /** Number of records updated */
  recordsUpdated?: number

  /** Whether the refresh was successful */
  success: boolean

  /** Any warnings or issues during refresh */
  warnings?: string[]
}

/**
 * System notification parameters
 */
export interface SystemNotification {

  /** Type of system notification */
  type: 'maintenance' | 'update' | 'outage' | 'feature' | 'deprecation'

  /** Notification title */
  title: string

  /** Detailed message */
  message: string

  /** When the event starts (for maintenance/outages) */
  startsAt?: Date

  /** When the event ends */
  endsAt?: Date

  /** Severity level */
  severity: 'info' | 'warning' | 'critical'

  /** Affected services */
  affectedServices?: string[]

  /** Link to more information */
  moreInfoUrl?: string
}

/**
 * Quota warning notification parameters
 */
export interface QuotaWarningNotification {

  /** User ID approaching quota limit */
  userId: string

  /** Type of quota */
  quotaType: 'storage' | 'reports' | 'exports' | 'shares' | 'api_calls'

  /** Current usage */
  currentUsage: number

  /** Maximum allowed */
  maxAllowed: number

  /** Percentage used */
  percentageUsed: number

  /** When the quota period resets */
  resetDate?: Date

  /** Suggested actions */
  suggestedActions: string[]
}

/**
 * Security notification parameters
 */
export interface SecurityNotification {

  /** User ID affected by security event */
  userId: string

  /** Type of security event */
  eventType: 'login_failure' | 'suspicious_access' | 'data_breach' | 'permission_change' | 'password_change'

  /** Event description */
  description: string

  /** When the event occurred */
  timestamp: Date

  /** Source IP address */
  ipAddress?: string

  /** Geographic location */
  location?: string

  /** Severity level */
  severity: 'low' | 'medium' | 'high' | 'critical'

  /** Recommended actions */
  recommendedActions: string[]

  /** Whether immediate action is required */
  requiresImmediateAction: boolean
}

/**
 * Mention notification parameters
 */
export interface MentionNotification {

  /** User ID who was mentioned */
  userId: string

  /** User ID who made the mention */
  mentionedBy: string

  /** Report where the mention occurred */
  reportName: string

  /** Comment text containing the mention */
  commentText: string

  /** URL to view the comment */
  commentUrl: string

  /** When the mention was made */
  timestamp: Date
}

/**
 * Comment notification parameters
 */
export interface CommentNotification {

  /** User ID to notify (report owner or other stakeholder) */
  userId: string

  /** User ID who made the comment */
  commentedBy: string

  /** Report that was commented on */
  reportName: string

  /** Comment text */
  commentText: string

  /** URL to view the comment */
  commentUrl: string

  /** When the comment was made */
  timestamp: Date

  /** Whether this is a reply to another comment */
  isReply: boolean
}

/**
 * Access change notification parameters
 */
export interface AccessChangeNotification {

  /** User ID whose access changed */
  userId: string

  /** User ID who made the change */
  changedBy: string

  /** Report affected */
  reportName: string

  /** Type of access change */
  changeType: 'granted' | 'revoked' | 'modified'

  /** New permission level */
  newPermission?: 'view' | 'edit' | 'admin'

  /** Previous permission level */
  previousPermission?: 'view' | 'edit' | 'admin'

  /** When the change was made */
  timestamp: Date

  /** Reason for the change */
  reason?: string
}

// ================================
// Bulk and Management Types
// ================================

/**
 * Bulk notification request
 */
export interface BulkNotificationRequest {

  /** Type of notification */
  type: string

  /** Notification parameters */
  params: any

  /** Priority level */
  priority?: 'low' | 'normal' | 'high'

  /** Scheduled delivery time */
  scheduledFor?: Date
}

/**
 * Bulk notification result
 */
export interface BulkNotificationResult {

  /** Total notifications processed */
  totalProcessed: number

  /** Number of successful deliveries */
  successful: number

  /** Number of failed deliveries */
  failed: number

  /** Details of any failures */
  failures: {
    notificationId: string
    error: string
  }[]
}

/**
 * Notification preferences
 */
export interface NotificationPreferences {

  /** Email notification settings */
  email: {
    enabled: boolean
    address: string
    frequency: 'immediate' | 'hourly' | 'daily' | 'weekly'
    types: string[]
  }

  /** Push notification settings */
  push: {
    enabled: boolean
    deviceTokens: string[]
    types: string[]
  }

  /** In-app notification settings */
  inApp: {
    enabled: boolean
    types: string[]
  }

  /** SMS notification settings */
  sms?: {
    enabled: boolean
    phoneNumber: string
    types: string[]
  }

  /** Webhook settings */
  webhook?: {
    enabled: boolean
    url: string
    types: string[]
  }

  /** Do not disturb settings */
  doNotDisturb?: {
    enabled: boolean
    startTime: string // HH:MM format
    endTime: string // HH:MM format
    timezone: string
  }
}

/**
 * Notification query options
 */
export interface NotificationQueryOptions {

  /** Filter by notification types */
  types?: string[]

  /** Filter by read status */
  read?: boolean

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
    field: 'timestamp' | 'type' | 'read'
    direction: 'asc' | 'desc'
  }
}

/**
 * Notification history result
 */
export interface NotificationHistoryResult {

  /** Array of notifications */
  notifications: NotificationRecord[]

  /** Total count for pagination */
  totalCount: number

  /** Current page */
  currentPage: number

  /** Total pages */
  totalPages: number
}

/**
 * Individual notification record
 */
export interface NotificationRecord {

  /** Unique notification ID */
  id: string

  /** Notification type */
  type: string

  /** Notification title */
  title: string

  /** Notification message */
  message: string

  /** When notification was created */
  timestamp: Date

  /** Whether notification has been read */
  read: boolean

  /** When notification was read */
  readAt?: Date

  /** Delivery status */
  deliveryStatus: 'pending' | 'delivered' | 'failed'

  /** Associated metadata */
  metadata?: Record<string, any>

  /** Action URL if applicable */
  actionUrl?: string
}
