/**
 * WorkOrders Module Configuration
 */

export interface WorkOrdersModuleConfig {
  name: string
  version: string
  description: string
  enabled: boolean
  dependencies: string[]
  features: {
    list: boolean
    detail: boolean
    workers: boolean
    history: boolean
    photos: boolean
    exportData: boolean
  }
  settings: {
    defaultPageSize: number
    defaultSortBy: string
    defaultSortDesc: boolean
  }
}

export const WORK_ORDERS_MODULE_CONFIG: WorkOrdersModuleConfig = {
  name: 'WorkOrders',
  version: '1.0.0',
  description: 'Work orders module',
  enabled: true,
  dependencies: [],
  features: {
    list: true,
    detail: true,
    workers: true,
    history: true,
    photos: true,
    exportData: true,
  },
  settings: {
    defaultPageSize: 15,
    defaultSortBy: 'scheduled_at',
    defaultSortDesc: true,
  },
}

export function getWorkOrdersModuleConfig(): WorkOrdersModuleConfig {
  return WORK_ORDERS_MODULE_CONFIG
}

export function updateWorkOrdersModuleConfig(config: Partial<WorkOrdersModuleConfig>): void {
  Object.assign(WORK_ORDERS_MODULE_CONFIG, config)
}

export function isWorkOrdersFeatureEnabled(
  feature: keyof WorkOrdersModuleConfig['features'],
): boolean {
  return WORK_ORDERS_MODULE_CONFIG.enabled && WORK_ORDERS_MODULE_CONFIG.features[feature]
}
