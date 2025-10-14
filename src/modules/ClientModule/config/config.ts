/**
 * Client Module Configuration
 *
 * Module metadata and configuration settings
 */

export interface ClientModuleConfig {
  name: string
  version: string
  description: string
  enabled: boolean
  dependencies: string[]
  features: {
    contacts: boolean
    creditLimit: boolean
    statusHistory: boolean
    exportData: boolean
    statistics: boolean
  }
  settings: {
    defaultCreditDays: number
    defaultCreditLimit: number
    defaultPaymentTerms: string
    requireRFC: boolean
    validateRFC: boolean
  }
}

/**
 * Default module configuration
 */
export const CLIENT_MODULE_CONFIG: ClientModuleConfig = {
  name: 'ClientModule',
  version: '1.0.0',
  description: 'Client management module with DDD and Clean Architecture',
  enabled: true,
  dependencies: [],

  features: {
    contacts: true,
    creditLimit: true,
    statusHistory: true,
    exportData: true,
    statistics: true,
  },

  settings: {
    defaultCreditDays: 30,
    defaultCreditLimit: 0,
    defaultPaymentTerms: 'net_30',
    requireRFC: false,
    validateRFC: true,
  },
}

/**
 * Get module configuration
 */
export function getClientModuleConfig(): ClientModuleConfig {
  return CLIENT_MODULE_CONFIG
}

/**
 * Update module configuration
 */
export function updateClientModuleConfig(config: Partial<ClientModuleConfig>): void {
  Object.assign(CLIENT_MODULE_CONFIG, config)
}

/**
 * Check if feature is enabled
 */
export function isFeatureEnabled(feature: keyof ClientModuleConfig['features']): boolean {
  return CLIENT_MODULE_CONFIG.enabled && CLIENT_MODULE_CONFIG.features[feature]
}

/**
 * Get module setting
 */
export function getSetting<K extends keyof ClientModuleConfig['settings']>(
  setting: K,
): ClientModuleConfig['settings'][K] {
  return CLIENT_MODULE_CONFIG.settings[setting]
}
