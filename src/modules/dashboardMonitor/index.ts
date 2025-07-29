// DashboardMonitor Module
// Generated from spec: DashboardMonitor

import type { App } from 'vue'
import { createPinia } from 'pinia'
import { dashboardmonitorMenu } from './menu'
import { dashboardmonitorRoutes } from './router/routes'

// Components
// export { DashboardMonitorEntityList, DashboardMonitorEntityForm, DashboardMonitorEntityDetail } from './presentation/components'

// Stores
// export { useDashboardMonitorEntityStore } from './presentation/stores/dashboardmonitorentityStore'

// Composables
import { useDashboardMonitorValidation } from './presentation/composables/useDashboardMonitorValidation'
import { useDashboardMonitorPermissions } from './presentation/composables/useDashboardMonitorPermissions'
import { useDashboardMonitorAPI } from './presentation/composables/useDashboardMonitorAPI'

// API Services
export { DashboardMonitorEntityApiService } from './infrastructure/api/services/DashboardMonitorEntityApiService'

// Entities
export type { DashboardMonitorEntity } from './domain/entities/DashboardMonitorEntity'

// DTOs
export type { CreateDashboardMonitorEntityDTO, UpdateDashboardMonitorEntityDTO } from './application/dtos'

// Repositories
export type { DashboardMonitorEntityRepository } from './application/repositories/DashboardMonitorEntityRepository'

// Types
export * from './types'

// Module configuration
export const dashboardmonitorModule = {
  name: 'dashboardmonitor',
  version: '1.0.0',
  description: 'Módulo DashboardMonitor - Personaliza esta descripción',
  author: 'Development Team',
  
  // Module data
  entities: ["DashboardMonitorEntity"],
  features: {
    crud: true,
    websocket: false,
    export: true,
    cache: true
  },
  
  // Install function
  install(app: App) {
    // Register stores
    const pinia = createPinia()
    app.use(pinia)
    
    // Register components
    // Components will be registered here when implemented
    
    // Register routes
    if (app.config.globalProperties.$router) {
      dashboardmonitorRoutes.forEach(route => {
        app.config.globalProperties.$router.addRoute(route)
      })
    }
    
    // Register menu
    if (app.config.globalProperties.$menu) {
      app.config.globalProperties.$menu.addMenu(dashboardmonitorMenu)
    }
  }
}

// Export entities and services
export {
  // API Services
  DashboardMonitorEntityApiService
}

// Export stores (when implemented)
export {
  // Stores will be exported here
}

// Export composables
export {
  useDashboardMonitorValidation,
  useDashboardMonitorPermissions,
  useDashboardMonitorAPI
}

// Export routes and menu
export {
  dashboardmonitorRoutes,
  dashboardmonitorMenu
}

// Default export
export default dashboardmonitorModule