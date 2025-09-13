/**
 * TransportModule - Transport Management Module
 *
 * This module handles comprehensive transport management including:
 * - Vehicle management and fleet tracking
 * - Driver registration and license management
 * - Concession and permit administration
 * - Concession holder management (individuals/companies/cooperatives)
 * - Traffic fine processing and payment tracking
 * - Document management with file upload and verification
 *
 * Architecture: Domain-Driven Design (DDD) + Clean Architecture
 * UI Framework: Vue 3 + Vuetify + Atomic Design
 */

import type { App } from 'vue'
import { createPinia } from 'pinia'
import { installTransportModule } from './installer'

// Configuration and Installation
export { TransportModuleConfig } from './config/config'
export { default as TransportModuleRoutes } from './config/routes'
export { default as TransportModuleMenu } from './config/menu'
export { TransportModuleContainer } from './config/container'
export { installTransportModule, uninstallTransportModule, TransportModuleInstaller } from './installer'
export { default as TransportModuleDbConfig } from './indexedDbConfig'

// Vehicle Management
export type { VehicleEntity, CreateVehicleRequest, UpdateVehicleRequest } from './Vehicle/domain/entities/VehicleEntity'
export { VehicleDomain } from './Vehicle/domain/entities/VehicleEntity'
export { useVehicleStore } from './Vehicle/presentation/stores/vehicleStore'
export { VehicleService } from './Vehicle/application/useCases/VehicleService'

// Driver Management
export type { DriverEntity, CreateDriverRequest, UpdateDriverRequest } from './Driver/domain/entities/DriverEntity'
export { DriverDomain } from './Driver/domain/entities/DriverEntity'
export { DriverService } from './Driver/application/useCases/DriverService'

// Concession Management
export type { ConcessionEntity, CreateConcessionRequest, UpdateConcessionRequest } from './Concession/domain/entities/ConcessionEntity'
export { ConcessionDomain } from './Concession/domain/entities/ConcessionEntity'

// Concession Holder Management
export type { ConcessionHolderEntity, CreateConcessionHolderRequest, UpdateConcessionHolderRequest } from './ConcessionHolder/domain/entities/ConcessionHolderEntity'
export { ConcessionHolderDomain } from './ConcessionHolder/domain/entities/ConcessionHolderEntity'

// Fine Management
export type { FineEntity, CreateFineRequest, UpdateFineRequest } from './Fine/domain/entities/FineEntity'
export { FineDomain } from './Fine/domain/entities/FineEntity'

// Document Management
export type { DocumentEntity, CreateDocumentRequest, UpdateDocumentRequest } from './Document/domain/entities/DocumentEntity'
export { DocumentDomain } from './Document/domain/entities/DocumentEntity'

// Shared types and utilities
export * from './shared/types'
export * from './shared/constants'
export * from './shared/utils'

// Plugin installation function
export function TransportModule(app: App) {
  // Install Pinia if not already installed
  if (!app.config.globalProperties.$pinia)
    app.use(createPinia())

  // Install the module automatically
  try {
    installTransportModule()
  }
  catch (error) {
    console.warn('Could not auto-install TransportModule:', error)
  }

  // Register global components if needed
  // app.component('VehicleTableOrganism', VehicleTableOrganism)

  return app
}

// Default export for plugin usage
export default TransportModule
