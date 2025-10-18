/**
 * Documents Module Container - Dependency Injection Configuration
 *
 * Centralizes module dependencies and provides access to routes, menu, and services
 */

import { DocumentRepositoryImpl } from '../infrastructure/persistence/repositories/DocumentRepositoryImpl'
import { DocumentApplicationService } from '../application/services/DocumentApplicationService'
import type { INotificationService } from '../shared/contracts/INotificationService'
import documentRoutes from './routes'
import documentMenu from './menu'
import documentPermissions from './permissions'

export class DocumentsModuleContainer {
  private static instance: DocumentsModuleContainer
  private _repository: DocumentRepositoryImpl
  private _applicationService: DocumentApplicationService
  private _notificationService?: INotificationService

  private constructor() {
    this._repository = new DocumentRepositoryImpl()
    this._applicationService = new DocumentApplicationService(
      this._repository,
      this._notificationService,
    )
  }

  /**
   * Get singleton instance
   */
  static getInstance(): DocumentsModuleContainer {
    if (!DocumentsModuleContainer.instance)
      DocumentsModuleContainer.instance = new DocumentsModuleContainer()

    return DocumentsModuleContainer.instance
  }

  /**
   * Set notification service (dependency injection)
   */
  setNotificationService(service: INotificationService): void {
    this._notificationService = service
    this._applicationService = new DocumentApplicationService(
      this._repository,
      this._notificationService,
    )
  }

  /**
   * Get Document Repository
   */
  get repository(): DocumentRepositoryImpl {
    return this._repository
  }

  /**
   * Get Document Application Service
   */
  get applicationService(): DocumentApplicationService {
    return this._applicationService
  }

  /**
   * Get module routes
   */
  get routes() {
    return documentRoutes
  }

  /**
   * Get module menu
   */
  get menu() {
    return documentMenu
  }

  /**
   * Get module permissions
   */
  get permissions() {
    return documentPermissions
  }

  /**
   * Install module (register routes, etc.)
   */
  install(app: any) {
    console.log('📦 Installing DocumentsModule...')

    // Register routes if needed
    // Register stores if needed
    // Register components if needed

    console.log('✅ DocumentsModule installed successfully!')
  }

  /**
   * Uninstall module
   */
  uninstall() {
    console.log('🗑️ Uninstalling DocumentsModule...')

    // Cleanup when module is uninstalled
  }
}

// Export singleton instance
export const documentsContainer = DocumentsModuleContainer.getInstance()
