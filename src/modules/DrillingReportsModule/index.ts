/**
 * Drilling Reports Module Main Entry Point
 *
 * Exports all public APIs from the module
 */

// Domain Layer
export * from './domain/entities/DrillingReportEntity'
export * from './domain/repositories/DrillingReportRepository'
export * from './domain/value-objects/ReportStatus'

// Application Layer
export * from './application/dtos/DrillingReportDtos'
export * from './application/mappers/DrillingReportMapper'
export * from './application/services/DrillingReportApplicationService'

// Infrastructure Layer
export * from './infrastructure/api/services/DrillingReportApiService'
export * from './infrastructure/persistence/repositories/DrillingReportRepositoryImpl'

// Presentation Layer
export * from './presentation/stores/drillingReportStore'
export * from './presentation/composables/useDrillingReport'

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
export { DrillingReportsModuleInstaller, installDrillingReportsModule } from './installer'
export { default as DrillingReportsModulePlugin } from './installer'

// Default export
export { drillingReportContainer } from './config/container'
