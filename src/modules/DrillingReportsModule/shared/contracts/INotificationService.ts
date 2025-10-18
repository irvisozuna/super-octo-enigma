/**
 * Notification Service Interface
 */

export interface INotificationService {

  /**
   * Show success notification
   */
  success(message: string, title?: string): void

  /**
   * Show error notification
   */
  error(message: string, title?: string): void

  /**
   * Show warning notification
   */
  warning(message: string, title?: string): void

  /**
   * Show info notification
   */
  info(message: string, title?: string): void

  /**
   * Show custom notification
   */
  show(config: NotificationConfig): void

  /**
   * Clear all notifications
   */
  clear(): void
}

export interface NotificationConfig {
  title: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  position?: 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  actions?: NotificationAction[]
}

export interface NotificationAction {
  label: string
  action: () => void
  color?: string
}
