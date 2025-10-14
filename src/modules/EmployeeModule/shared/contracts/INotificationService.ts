/**
 * Notification Service Contract
 *
 * Defines the interface for notification services without coupling to specific implementations
 */

import type { NotificationOptions } from '../types'

export interface INotificationService {

  /**
   * Show a notification to the user
   */
  notify(options: NotificationOptions): void

  /**
   * Show a success notification
   */
  success(title: string, message: string): void

  /**
   * Show an error notification
   */
  error(title: string, message: string): void

  /**
   * Show a warning notification
   */
  warning(title: string, message: string): void

  /**
   * Show an info notification
   */
  info(title: string, message: string): void
}
