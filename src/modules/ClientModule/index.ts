/**
 * Client Module Main Entry Point
 *
 * Exports all public APIs from the module
 */

// Domain Layer
export * from './domain/entities/ClientEntity'
export * from './domain/repositories/ClientRepository'

// Application Layer
export * from './application/dtos/ClientDtos'
export * from './application/mappers/ClientMapper'
export * from './application/services/ClientApplicationService'

// Infrastructure Layer
export * from './infrastructure/api/services/ClientApiService'
export * from './infrastructure/persistence/repositories/ClientRepositoryImpl'

// Presentation Layer
export * from './presentation/stores/clientStore'
export * from './presentation/composables/useClient'

// Shared
export * from './shared/types'
export * from './shared/contracts/INotificationService'

// Configuration
export * from './config/routes'
export * from './config/menu'
export * from './config/container'
export * from './config/config'
export * from './config/permissions'

// Locales
export { default as esLocale } from './presentation/locales/es.json'
export { default as enLocale } from './presentation/locales/en.json'

// Installer
export { ClientModuleInstaller, installClientModule } from './installer'
export { default as ClientModulePlugin } from './installer'

// Default export
export { clientContainer } from './config/container'
