// src/modules/ReadingsReport/config/container.ts
import { ReadingsReportApplicationService } from '../application/services/ReadingsReportApplicationService'
import { ReadingsReportRepositoryImpl } from '../infrastructure/persistence/repositories/ReadingsReportRepositoryImpl'
import routes from './routes'
import menu from './menu'

export class ReadingsReportContainer {
  private static instance: ReadingsReportContainer
  private _repository: ReadingsReportRepositoryImpl
  private _applicationService: ReadingsReportApplicationService

  private constructor() {
    this._repository = new ReadingsReportRepositoryImpl()
    this._applicationService = new ReadingsReportApplicationService(this._repository)
  }

  static getInstance(): ReadingsReportContainer {
    if (!ReadingsReportContainer.instance)
      ReadingsReportContainer.instance = new ReadingsReportContainer()

    return ReadingsReportContainer.instance
  }

  get repository() {
    return this._repository
  }

  get applicationService() {
    return this._applicationService
  }

  get routes() {
    return routes
  }

  get menu() {
    return menu
  }
}

export const readingsReportContainer = ReadingsReportContainer.getInstance()
