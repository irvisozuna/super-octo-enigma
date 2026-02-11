/**
 * WorkOrders Module Container - Dependency Injection Configuration
 */

import { WorkOrderApiService } from '../infrastructure/api/services/WorkOrderApiService'
import workOrdersRoutes from './routes'
import workOrdersMenu from './menu'

export class WorkOrdersModuleContainer {
  private static instance: WorkOrdersModuleContainer
  private _apiService: WorkOrderApiService

  private constructor() {
    this._apiService = new WorkOrderApiService()
  }

  static getInstance(): WorkOrdersModuleContainer {
    if (!WorkOrdersModuleContainer.instance)
      WorkOrdersModuleContainer.instance = new WorkOrdersModuleContainer()

    return WorkOrdersModuleContainer.instance
  }

  get apiService(): WorkOrderApiService {
    return this._apiService
  }

  get routes() {
    return workOrdersRoutes
  }

  get menu() {
    return workOrdersMenu
  }
}

export const workOrdersContainer = WorkOrdersModuleContainer.getInstance()
