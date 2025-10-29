/**
 * Generador de configuración de cache
 * Facilita la creación de configuraciones específicas para cada módulo
 */

import type { type CacheModuleConfig, CachePriority } from '../types/cache.types'

export interface ModuleCacheConfig {
  moduleName: string
  dbName: string
  dbVersion: number
  stores: {
    [storeName: string]: {
      key: string
      priority: CachePriority
      ttl: number
      maxSize: number
      encrypted: boolean
    }
  }
  sync: {
    enabled: boolean
    interval: number
    retryAttempts: number
    conflictResolution: 'server' | 'client' | 'manual'
  }
}

/**
 * Generar configuración de cache para un módulo
 */
export function generateCacheConfig(config: ModuleCacheConfig): CacheModuleConfig {
  return {
    enabled: config.enabled ?? true,
    dbName: config.dbName,
    dbVersion: config.dbVersion,
    stores: Object.fromEntries(
      Object.entries(config.stores).map(([storeName, storeConfig]) => [
        storeName,
        {
          key: storeConfig.key,
          priority: storeConfig.priority,
          ttl: storeConfig.ttl,
          maxSize: storeConfig.maxSize,
          encrypted: storeConfig.encrypted,
        },
      ]),
    ),
    sync: config.sync,
  }
}

/**
 * Configuraciones predefinidas para diferentes tipos de módulos
 */
export const CACHE_PRESETS = {
  // Para módulos con datos sensibles (documentos, usuarios, etc.)
  SENSITIVE: {
    sync: {
      enabled: true,
      interval: 600000, // 10 minutos
      retryAttempts: 5,
      conflictResolution: 'manual' as const,
    },
    defaultEncryption: true,
  },

  // Para módulos con datos frecuentemente actualizados (inventario, etc.)
  FREQUENT_UPDATES: {
    sync: {
      enabled: true,
      interval: 300000, // 5 minutos
      retryAttempts: 3,
      conflictResolution: 'server' as const,
    },
    defaultEncryption: false,
  },

  // Para módulos con datos estáticos (catálogos, configuraciones, etc.)
  STATIC: {
    sync: {
      enabled: true,
      interval: 1800000, // 30 minutos
      retryAttempts: 2,
      conflictResolution: 'client' as const,
    },
    defaultEncryption: false,
  },
}

/**
 * Crear configuración de store para un tipo específico de datos
 */
export function createStoreConfig(
  key: string,
  priority: CachePriority,
  ttl: number,
  maxSize: number,
  encrypted: boolean = false,
) {
  return {
    key,
    priority,
    ttl,
    maxSize,
    encrypted,
  }
}

/**
 * Generar configuración completa para un módulo usando presets
 */
export function generateModuleCacheConfig(
  moduleName: string,
  preset: keyof typeof CACHE_PRESETS,
  customStores: Record<string, any>,
): ModuleCacheConfig {
  const presetConfig = CACHE_PRESETS[preset]

  return {
    moduleName,
    dbName: `${moduleName}Cache`,
    dbVersion: 1,
    stores: customStores,
    sync: presetConfig.sync,
  }
}
