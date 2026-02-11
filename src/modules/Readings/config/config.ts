/**
 * Readings Module Configuration
 */

export interface ReadingsModuleConfig {
  name: string
  version: string
  description: string
  enabled: boolean
  dependencies: string[]
  features: {
    list: boolean
    advance: boolean
    map: boolean
    detail: boolean
    exportData: boolean
  }
  settings: {
    defaultPageSize: number
    defaultSortBy: string
    defaultSortDesc: boolean
  }
}

export const READINGS_MODULE_CONFIG: ReadingsModuleConfig = {
  name: 'Readings',
  version: '1.0.0',
  description: 'Readings module',
  enabled: true,
  dependencies: [],
  features: {
    list: true,
    advance: true,
    map: true,
    detail: true,
    exportData: true,
  },
  settings: {
    defaultPageSize: 15,
    defaultSortBy: 'reading_date',
    defaultSortDesc: true,
  },
}

export function getReadingsModuleConfig(): ReadingsModuleConfig {
  return READINGS_MODULE_CONFIG
}

export function updateReadingsModuleConfig(config: Partial<ReadingsModuleConfig>): void {
  Object.assign(READINGS_MODULE_CONFIG, config)
}

export function isReadingsFeatureEnabled(
  feature: keyof ReadingsModuleConfig['features'],
): boolean {
  return READINGS_MODULE_CONFIG.enabled && READINGS_MODULE_CONFIG.features[feature]
}
