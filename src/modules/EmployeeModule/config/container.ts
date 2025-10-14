/**
 * Employee Module Container - Dependency Injection Configuration
 *
 * Centralizes module dependencies and provides access to routes, menu, and services
 */

import { EmployeeRepositoryImpl } from '../infrastructure/persistence/repositories/EmployeeRepositoryImpl'
import { EmployeeApplicationService } from '../application/services/EmployeeApplicationService'
import type { INotificationService } from '../shared/contracts/INotificationService'
import employeeRoutes from './routes'
import employeeMenu from './menu'

export class EmployeeModuleContainer {
  private static instance: EmployeeModuleContainer
  private _repository: EmployeeRepositoryImpl
  private _applicationService: EmployeeApplicationService
  private _notificationService?: INotificationService

  private constructor() {
    this._repository = new EmployeeRepositoryImpl()
    this._applicationService = new EmployeeApplicationService(
      this._repository,
      this._notificationService,
    )
  }

  /**
   * Get singleton instance
   */
  static getInstance(): EmployeeModuleContainer {
    if (!EmployeeModuleContainer.instance)
      EmployeeModuleContainer.instance = new EmployeeModuleContainer()

    return EmployeeModuleContainer.instance
  }

  /**
   * Set notification service (dependency injection)
   */
  setNotificationService(service: INotificationService): void {
    this._notificationService = service
    this._applicationService = new EmployeeApplicationService(
      this._repository,
      this._notificationService,
    )
  }

  /**
   * Get Employee Repository
   */
  get repository(): EmployeeRepositoryImpl {
    return this._repository
  }

  /**
   * Get Employee Application Service
   */
  get applicationService(): EmployeeApplicationService {
    return this._applicationService
  }

  /**
   * Get module routes
   */
  get routes() {
    return employeeRoutes
  }

  /**
   * Get module menu
   */
  get menu() {
    return employeeMenu
  }

  /**
   * Install module (register routes, etc.)
   */
  install(app: any) {
    console.log('📦 Installing EmployeeModule...')

    // Register routes if needed
    // Register stores if needed
    // Register components if needed

    console.log('✅ EmployeeModule installed successfully!')
  }

  /**
   * Uninstall module
   */
  uninstall() {
    console.log('🗑️ Uninstalling EmployeeModule...')

    // Cleanup when module is uninstalled
  }
}

// Export singleton instance
export const employeeContainer = EmployeeModuleContainer.getInstance()
