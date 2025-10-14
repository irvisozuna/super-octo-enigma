/**
 * Client Module Container - Dependency Injection Configuration
 *
 * Centralizes module dependencies and provides access to routes, menu, and services
 */

import { ClientRepositoryImpl } from '../infrastructure/persistence/repositories/ClientRepositoryImpl'
import { ClientApplicationService } from '../application/services/ClientApplicationService'
import type { INotificationService } from '../shared/contracts/INotificationService'
import clientRoutes from './routes'
import clientMenu from './menu'

export class ClientModuleContainer {
  private static instance: ClientModuleContainer
  private _repository: ClientRepositoryImpl
  private _applicationService: ClientApplicationService
  private _notificationService?: INotificationService

  private constructor() {
    this._repository = new ClientRepositoryImpl()
    this._applicationService = new ClientApplicationService(
      this._repository,
      this._notificationService,
    )
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ClientModuleContainer {
    if (!ClientModuleContainer.instance)
      ClientModuleContainer.instance = new ClientModuleContainer()

    return ClientModuleContainer.instance
  }

  /**
   * Set notification service (dependency injection)
   */
  setNotificationService(service: INotificationService): void {
    this._notificationService = service
    this._applicationService = new ClientApplicationService(
      this._repository,
      this._notificationService,
    )
  }

  /**
   * Get Client Repository
   */
  get repository(): ClientRepositoryImpl {
    return this._repository
  }

  /**
   * Get Client Application Service
   */
  get applicationService(): ClientApplicationService {
    return this._applicationService
  }

  /**
   * Get module routes
   */
  get routes() {
    return clientRoutes
  }

  /**
   * Get module menu
   */
  get menu() {
    return clientMenu
  }

  /**
   * Install module (register routes, etc.)
   */
  install(app: any) {
    console.log('📦 Installing ClientModule...')

    // Register routes if needed
    // Register stores if needed
    // Register components if needed

    console.log('✅ ClientModule installed successfully!')
  }

  /**
   * Uninstall module
   */
  uninstall() {
    console.log('🗑️ Uninstalling ClientModule...')

    // Cleanup when module is uninstalled
  }
}

// Export singleton instance
export const clientContainer = ClientModuleContainer.getInstance()
