/**
 * Contract Module Main Entry Point
 */

// Domain Layer
export * from './domain/entities/ContractEntity'
export * from './domain/repositories/ContractRepository'

// Application Layer
export * from './application/dtos/ContractDtos'
export * from './application/mappers/ContractMapper'
export * from './application/services/ContractApplicationService'

// Infrastructure Layer
export * from './infrastructure/api/services/ContractApiService'
export * from './infrastructure/persistence/repositories/ContractRepositoryImpl'

// Presentation Layer
export * from './presentation/stores/contractsStore'

// Configuration
export * from './config/routes'
export * from './config/menu'
export * from './config/container'
export * from './config/config'
export * from './config/permissions'

// Installer
export { ContractModuleInstaller, installContractModule } from './installer'
export { default as ContractModulePlugin } from './installer'

// Default export
export { contractContainer } from './config/container'
