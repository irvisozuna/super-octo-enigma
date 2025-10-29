/**
 * Composable híbrido para Cache de Clientes
 *
 * Proporciona API compatible con el sistema anterior
 * pero usa internamente el nuevo sistema V2
 */

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ClientEntity } from '../../domain/entities/ClientEntity'
import { useClientCacheV2 } from './useClientCacheV2'

export function useClientCacheHybrid() {
  const { t } = useI18n()

  // Usar solo el nuevo sistema V2
  const newCache = useClientCacheV2()

  // ========== ESTADO DEL CACHE ==========

  /**
   * Estado completo del sistema de cache
   */
  const cacheState = computed(() => newCache.cacheState.value)

  const syncState = computed(() => ({
    isOnline: newCache.isCacheAvailable.value,
    lastSync: newCache.cacheState.value.lastSync,
    pendingChanges: newCache.cacheState.value.pendingChanges,
    conflicts: newCache.cacheState.value.conflicts,
  }))

  const loading = computed(() => newCache.loading.value)
  const error = computed(() => newCache.error.value)

  /**
   * Indicadores de estado para UI
   */
  const statusIndicators = computed(() => newCache.statusIndicators.value)

  /**
   * Estadísticas de rendimiento
   */
  const performanceStats = computed(() => ({
    hitRate: newCache.cacheState.value.efficiency,
    cacheSize: newCache.cacheState.value.cacheSize,
    lastCleanup: new Date().toISOString(),
  }))

  // ========== MÉTODOS DE CACHE ==========

  /**
   * Obtener listado de clientes del cache
   */
  async function getCachedClients(): Promise<ClientEntity[]> {
    const clients = await newCache.getCachedClientsList()

    return clients || []
  }

  /**
   * Cachear listado de clientes
   */
  async function cacheClients(clients: ClientEntity[]): Promise<void> {
    await newCache.cacheClientsList(clients)
  }

  /**
   * Obtener cliente individual del cache
   */
  async function getCachedClient(clientId: string): Promise<ClientEntity | null> {
    return await newCache.getCachedClient(clientId)
  }

  /**
   * Cachear cliente individual
   */
  async function cacheClient(client: ClientEntity): Promise<void> {
    await newCache.cacheClient(client)
  }

  /**
   * Limpiar cache
   */
  async function clearCache(): Promise<void> {
    await newCache.clearCache()
  }

  /**
   * Sincronizar con servidor
   */
  async function forceSync(): Promise<void> {
    await newCache.forceSync()
  }

  /**
   * Alternar estado del cache
   */
  async function toggleCache(enabled: boolean): Promise<void> {
    await newCache.toggleCache(enabled)
  }

  /**
   * Obtener estadísticas del cache
   */
  async function getCacheStats(): Promise<any> {
    return await newCache.getCacheStats()
  }

  // ========== MÉTODOS DE COMPATIBILIDAD ==========

  /**
   * Inicializar cache
   */
  async function initializeCache(): Promise<void> {
    await newCache.initializeClientCache()
  }

  /**
   * Obtener indicadores de estado formateados
   */
  const formattedStats = computed(() => newCache.formattedStats.value)

  // ========== RETURN ==========

  return {
    // Estado
    cacheState,
    syncState,
    loading,
    error,
    statusIndicators,
    performanceStats,
    formattedStats,

    // Métodos de cache
    getCachedClients,
    cacheClients,
    getCachedClient,
    cacheClient,
    clearCache,
    forceSync,
    toggleCache,
    getCacheStats,
    initializeCache,

    // Acceso directo al sistema V2
    newSystem: newCache,
  }
}
