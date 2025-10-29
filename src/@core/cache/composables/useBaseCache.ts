/**
 * Composable base para cache reutilizable
 * Proporciona funcionalidad común de cache para todos los módulos
 */

import { computed, onMounted, onUnmounted, ref } from 'vue'
import { CachePriority, type CacheState, SyncStatus } from '../types/cache.types'

export interface BaseCacheComposable {

  // Estado
  loading: Ref<boolean>
  error: Ref<string | null>
  cacheState: Ref<CacheState>

  // Computed
  isCacheAvailable: ComputedRef<boolean>
  hasPendingChanges: ComputedRef<boolean>
  hasConflicts: ComputedRef<boolean>
  statusIndicators: ComputedRef<any>
  formattedStats: ComputedRef<any>

  // Métodos
  forceSync: () => Promise<void>
  clearCache: () => Promise<void>
  toggleCache: (enabled: boolean) => Promise<void>
  getCacheStats: () => Promise<any>
  cleanupExpired: () => Promise<number>
  updateCacheState: () => Promise<void>
}

export function useBaseCache(
  cacheService: any, // El servicio de cache específico del módulo
  moduleName: string,
): BaseCacheComposable {
  // ========== ESTADO ==========

  const loading = ref(false)
  const error = ref<string | null>(null)

  const cacheState = ref<CacheState>({
    isEnabled: true,
    lastSync: null,
    pendingChanges: 0,
    conflicts: 0,
    cacheSize: 0,
    efficiency: 0,
  })

  // ========== COMPUTED ==========

  const isCacheAvailable = computed(() => cacheState.value.isEnabled)

  const hasPendingChanges = computed(() => cacheState.value.pendingChanges > 0)

  const hasConflicts = computed(() => cacheState.value.conflicts > 0)

  const statusIndicators = computed(() => ({
    isOnline: isCacheAvailable.value,
    hasPendingChanges: hasPendingChanges.value,
    hasConflicts: hasConflicts.value,
    lastSync: cacheState.value.lastSync,
    cacheSize: cacheState.value.cacheSize,
    efficiency: cacheState.value.efficiency,
  }))

  const formattedStats = computed(() => ({
    status: isCacheAvailable.value ? 'online' : 'offline',
    lastSync: cacheState.value.lastSync
      ? new Date(cacheState.value.lastSync).toLocaleString()
      : 'Nunca',
    cacheSize: `${cacheState.value.cacheSize} elementos`,
    efficiency: `${Math.round(cacheState.value.efficiency)}%`,
    pendingChanges: cacheState.value.pendingChanges,
    conflicts: cacheState.value.conflicts,
  }))

  // ========== MÉTODOS ==========

  /**
   * Sincronizar forzadamente
   */
  async function forceSync(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      // Cada módulo debe implementar su propia lógica de sincronización
      if (cacheService.forceSync)
        await cacheService.forceSync()

      await updateCacheState()
      console.log(`🔄 Sincronización forzada completada para ${moduleName}`)
    }
    catch (err: any) {
      error.value = err.message || 'Error en sincronización'
      console.error(`❌ Error en sincronización de ${moduleName}:`, err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Limpiar cache
   */
  async function clearCache(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      await cacheService.clear()
      await updateCacheState()
      console.log(`🧹 Cache limpiado para ${moduleName}`)
    }
    catch (err: any) {
      error.value = err.message || 'Error limpiando cache'
      console.error(`❌ Error limpiando cache de ${moduleName}:`, err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Alternar estado del cache
   */
  async function toggleCache(enabled: boolean): Promise<void> {
    loading.value = true
    error.value = null

    try {
      if (cacheService.toggleCache)
        await cacheService.toggleCache(enabled)

      cacheState.value.isEnabled = enabled
      console.log(`🔄 Cache ${enabled ? 'habilitado' : 'deshabilitado'} para ${moduleName}`)
    }
    catch (err: any) {
      error.value = err.message || 'Error alternando cache'
      console.error(`❌ Error alternando cache de ${moduleName}:`, err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Obtener estadísticas del cache
   */
  async function getCacheStats(): Promise<any> {
    try {
      const stats = await cacheService.getStats()

      return {
        ...stats,
        module: moduleName,
        timestamp: new Date().toISOString(),
      }
    }
    catch (err: any) {
      console.error(`❌ Error obteniendo estadísticas de ${moduleName}:`, err)
      throw err
    }
  }

  /**
   * Limpiar datos expirados
   */
  async function cleanupExpired(): Promise<number> {
    loading.value = true
    error.value = null

    try {
      const deletedCount = await cacheService.cleanupExpired()

      await updateCacheState()
      console.log(`🧹 Limpiados ${deletedCount} elementos expirados de ${moduleName}`)

      return deletedCount
    }
    catch (err: any) {
      error.value = err.message || 'Error limpiando datos expirados'
      console.error(`❌ Error limpiando datos expirados de ${moduleName}:`, err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Actualizar estado del cache
   */
  async function updateCacheState(): Promise<void> {
    try {
      const state = cacheService.getState()

      cacheState.value = { ...state }
    }
    catch (err: any) {
      console.error(`❌ Error actualizando estado de ${moduleName}:`, err)
    }
  }

  // ========== LIFECYCLE ==========

  onMounted(async () => {
    try {
      await updateCacheState()
    }
    catch (err) {
      console.error(`❌ Error inicializando cache de ${moduleName}:`, err)
    }
  })

  // ========== RETURN ==========

  return {
    // Estado
    loading,
    error,
    cacheState,

    // Computed
    isCacheAvailable,
    hasPendingChanges,
    hasConflicts,
    statusIndicators,
    formattedStats,

    // Métodos
    forceSync,
    clearCache,
    toggleCache,
    getCacheStats,
    cleanupExpired,
    updateCacheState,
  }
}
