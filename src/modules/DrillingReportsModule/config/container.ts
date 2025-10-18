/**
 * Drilling Reports Dependency Injection Container
 */

import { DrillingReportApplicationService } from '../application/services/DrillingReportApplicationService'
import { DrillingReportRepositoryImpl } from '../infrastructure/persistence/repositories/DrillingReportRepositoryImpl'
import { DrillingReportApiService } from '../infrastructure/api/services/DrillingReportApiService'

// Related entities services
import { ProjectApplicationService } from '../application/services/ProjectApplicationService'
import { WellApplicationService } from '../application/services/WellApplicationService'
import { ToolApplicationService } from '../application/services/ToolApplicationService'
import { EmployeeApplicationService } from '../application/services/EmployeeApplicationService'
import { EquipmentApplicationService } from '../application/services/EquipmentApplicationService'
import { DocumentApplicationService } from '../application/services/DocumentApplicationService'

// Related entities repositories
import { ProjectRepositoryImpl } from '../infrastructure/persistence/repositories/ProjectRepositoryImpl'
import { WellRepositoryImpl } from '../infrastructure/persistence/repositories/WellRepositoryImpl'
import { ToolRepositoryImpl } from '../infrastructure/persistence/repositories/ToolRepositoryImpl'
import { EmployeeRepositoryImpl } from '../infrastructure/persistence/repositories/EmployeeRepositoryImpl'
import { EquipmentRepositoryImpl } from '../infrastructure/persistence/repositories/EquipmentRepositoryImpl'
import { DocumentRepositoryImpl } from '../infrastructure/persistence/repositories/DocumentRepositoryImpl'

// Related entities API services
import { ProjectApiService } from '../infrastructure/api/services/ProjectApiService'
import { WellApiService } from '../infrastructure/api/services/WellApiService'
import { ToolApiService } from '../infrastructure/api/services/ToolApiService'
import { EmployeeApiService } from '../infrastructure/api/services/EmployeeApiService'
import { EquipmentApiService } from '../infrastructure/api/services/EquipmentApiService'
import { DocumentApiService } from '../infrastructure/api/services/DocumentApiService'

export class DrillingReportContainer {
  private static instance: DrillingReportContainer
  private services: Map<string, any> = new Map()

  private constructor() {}

  static getInstance(): DrillingReportContainer {
    if (!DrillingReportContainer.instance)
      DrillingReportContainer.instance = new DrillingReportContainer()

    return DrillingReportContainer.instance
  }

  /**
   * Initialize services with API client
   */
  initialize(apiClient: any) {
    // Main drilling report services
    const apiService = new DrillingReportApiService(apiClient)

    this.services.set('apiService', apiService)

    const repository = new DrillingReportRepositoryImpl(apiService)

    this.services.set('repository', repository)

    const applicationService = new DrillingReportApplicationService(repository)

    this.services.set('applicationService', applicationService)

    // Related entities API services
    const projectApiService = new ProjectApiService()
    const wellApiService = new WellApiService()
    const toolApiService = new ToolApiService()
    const employeeApiService = new EmployeeApiService()
    const equipmentApiService = new EquipmentApiService()
    const documentApiService = new DocumentApiService()

    this.services.set('projectApiService', projectApiService)
    this.services.set('wellApiService', wellApiService)
    this.services.set('toolApiService', toolApiService)
    this.services.set('employeeApiService', employeeApiService)
    this.services.set('equipmentApiService', equipmentApiService)
    this.services.set('documentApiService', documentApiService)

    // Related entities repositories
    const projectRepository = new ProjectRepositoryImpl(projectApiService)
    const wellRepository = new WellRepositoryImpl(wellApiService)
    const toolRepository = new ToolRepositoryImpl(toolApiService)
    const employeeRepository = new EmployeeRepositoryImpl(employeeApiService)
    const equipmentRepository = new EquipmentRepositoryImpl(equipmentApiService)
    const documentRepository = new DocumentRepositoryImpl(documentApiService)

    this.services.set('projectRepository', projectRepository)
    this.services.set('wellRepository', wellRepository)
    this.services.set('toolRepository', toolRepository)
    this.services.set('employeeRepository', employeeRepository)
    this.services.set('equipmentRepository', equipmentRepository)
    this.services.set('documentRepository', documentRepository)

    // Related entities application services
    const projectApplicationService = new ProjectApplicationService(projectRepository)
    const wellApplicationService = new WellApplicationService(wellRepository)
    const toolApplicationService = new ToolApplicationService(toolRepository)
    const employeeApplicationService = new EmployeeApplicationService(employeeRepository)
    const equipmentApplicationService = new EquipmentApplicationService(equipmentRepository)
    const documentApplicationService = new DocumentApplicationService(documentRepository)

    this.services.set('projectApplicationService', projectApplicationService)
    this.services.set('wellApplicationService', wellApplicationService)
    this.services.set('toolApplicationService', toolApplicationService)
    this.services.set('employeeApplicationService', employeeApplicationService)
    this.services.set('equipmentApplicationService', equipmentApplicationService)
    this.services.set('documentApplicationService', documentApplicationService)
  }

  /**
   * Get API Service
   */
  getApiService(): DrillingReportApiService {
    return this.services.get('apiService')
  }

  /**
   * Get Repository
   */
  getRepository(): DrillingReportRepositoryImpl {
    return this.services.get('repository')
  }

  /**
   * Get Application Service
   */
  getApplicationService(): DrillingReportApplicationService {
    return this.services.get('applicationService')
  }

  /**
   * Get related entities services
   */
  getProjectApplicationService(): ProjectApplicationService {
    return this.services.get('projectApplicationService')
  }

  getWellApplicationService(): WellApplicationService {
    return this.services.get('wellApplicationService')
  }

  getToolApplicationService(): ToolApplicationService {
    return this.services.get('toolApplicationService')
  }

  getEmployeeApplicationService(): EmployeeApplicationService {
    return this.services.get('employeeApplicationService')
  }

  getEquipmentApplicationService(): EquipmentApplicationService {
    return this.services.get('equipmentApplicationService')
  }

  getDocumentApplicationService(): DocumentApplicationService {
    return this.services.get('documentApplicationService')
  }

  /**
   * Check if services are initialized
   */
  isInitialized(): boolean {
    return this.services.has('applicationService')
           && this.services.has('projectApplicationService')
           && this.services.has('wellApplicationService')
           && this.services.has('toolApplicationService')
           && this.services.has('employeeApplicationService')
           && this.services.has('equipmentApplicationService')
           && this.services.has('documentApplicationService')
  }
}

// Export singleton instance
export const drillingReportContainer = DrillingReportContainer.getInstance()
