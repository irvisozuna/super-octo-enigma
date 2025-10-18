/**
 * Notification Service Interface
 *
 * Contract for notification services used across the module
 */

export interface INotificationService {

  /**
   * Show success notification
   */
  success(title: string, message: string): void

  /**
   * Show error notification
   */
  error(title: string, message: string): void

  /**
   * Show warning notification
   */
  warning(title: string, message: string): void

  /**
   * Show info notification
   */
  info(title: string, message: string): void

  /**
   * Show loading notification
   */
  loading(title: string, message: string): void

  /**
   * Hide notification
   */
  hide(id?: string): void

  /**
   * Clear all notifications
   */
  clear(): void
}
