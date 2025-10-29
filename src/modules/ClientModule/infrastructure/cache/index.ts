/**
 * Índice del sistema de cache refactorizado para ClientModule
 * Exporta tanto el sistema nuevo como el híbrido para migración gradual
 */

// ========== SISTEMA NUEVO (V2) ==========

// Servicios
export { ClientIndexedDBService } from './services/ClientIndexedDBService'
export { ClientCacheServiceV2 } from './services/ClientCacheServiceV2'

// Composables
export { useClientCacheV2 } from './composables/useClientCacheV2'

// Componentes
export { default as ClientCacheStatusIndicator } from './components/ClientCacheStatusIndicator.vue'

// ========== SISTEMA HÍBRIDO (COMPATIBILIDAD) ==========

// Composable híbrido para compatibilidad con API anterior
export { useClientCacheHybrid } from './composables/useClientCacheHybrid'

// ========== TIPOS ==========

// Usar tipos de entidades del dominio
export type { ClientEntity } from '../../domain/entities/ClientEntity'

// ========== UTILIDADES ==========

/**
 * Función helper para inicializar el sistema de cache
 */
export async function initializeClientCacheSystem(): Promise<void> {
  const { useClientCacheV2 } = await import('./composables/useClientCacheV2')
  const cache = useClientCacheV2()

  await cache.initializeClientCache()
}

/**
 * Función helper para obtener información del sistema de cache
 */
export async function getCacheSystemInfo(): Promise<{
  currentSystem: 'v2'
  stats: any
}> {
  const { useClientCacheV2 } = await import('./composables/useClientCacheV2')
  const cache = useClientCacheV2()
  const stats = await cache.getCacheStats()

  return {
    currentSystem: 'v2',
    stats,
  }
}
