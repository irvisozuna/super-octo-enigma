/**
 * Notification Service Interface
 *
 * Contract for showing notifications to the user
 */

export interface INotificationService {

  /**
   * Show success message
   */
  success(message: string): void

  /**
   * Show error message
   */
  error(message: string): void

  /**
   * Show warning message
   */
  warning(message: string): void

  /**
   * Show info message
   */
  info(message: string): void
}
