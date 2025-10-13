/**
 * Employee Module Main Entry Point
 *
 * Exports all public APIs from the module
 */

// Domain Layer
export * from './domain/entities/EmployeeEntity'
export * from './domain/repositories/EmployeeRepository'
export * from './domain/value-objects/Email'
export * from './domain/value-objects/PhoneNumber'
export * from './domain/value-objects/FullName'

// Application Layer
export * from './application/dtos/EmployeeDtos'
export * from './application/mappers/EmployeeMapper'
export * from './application/services/EmployeeApplicationService'

// Infrastructure Layer
export * from './infrastructure/api/services/EmployeeApiService'
export * from './infrastructure/persistence/repositories/EmployeeRepositoryImpl'

// Presentation Layer
export * from './presentation/stores/employeeStore'
export * from './presentation/composables/useEmployee'

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
export { default as esLocale } from './locales/es.json'
export { default as enLocale } from './locales/en.json'

// Installer
export { EmployeeModuleInstaller, installEmployeeModule } from './installer'
export { default as EmployeeModulePlugin } from './installer'

// Default export
export { employeeContainer } from './config/container'
