/**
 * Readings Module Container - Dependency Injection Configuration
 */

import { ReadingRepositoryImpl } from '../infrastructure/persistence/repositories/ReadingRepositoryImpl'
import { ReadingApplicationService } from '../application/services/ReadingApplicationService'
import readingsRoutes from './routes'
import readingsMenu from './menu'

export class ReadingsModuleContainer {
  private static instance: ReadingsModuleContainer
  private _repository: ReadingRepositoryImpl
  private _applicationService: ReadingApplicationService

  private constructor() {
    this._repository = new ReadingRepositoryImpl()
    this._applicationService = new ReadingApplicationService(this._repository)
  }

  static getInstance(): ReadingsModuleContainer {
    if (!ReadingsModuleContainer.instance)
      ReadingsModuleContainer.instance = new ReadingsModuleContainer()

    return ReadingsModuleContainer.instance
  }

  get repository(): ReadingRepositoryImpl {
    return this._repository
  }

  get applicationService(): ReadingApplicationService {
    return this._applicationService
  }

  get routes() {
    return readingsRoutes
  }

  get menu() {
    return readingsMenu
  }
}

export const readingsContainer = ReadingsModuleContainer.getInstance()
