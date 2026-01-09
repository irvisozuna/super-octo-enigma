/**
 * Contract Module Container - Configuration Layer
 */

import { ContractApiService } from '../infrastructure/api/services/ContractApiService'
import { ContractRepositoryImpl } from '../infrastructure/persistence/repositories/ContractRepositoryImpl'
import { ContractApplicationService } from '../application/services/ContractApplicationService'

// Service Instances
const contractApiService = new ContractApiService()

// Repository instance with API service
const contractRepository = new ContractRepositoryImpl(contractApiService)

// Application Service with Repository
const contractApplicationService = new ContractApplicationService(contractRepository)

export const contractContainer = {
  contractApiService,
  contractRepository,
  contractApplicationService,
}

export default contractContainer
