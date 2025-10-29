/**
 * Servicio base de cache reutilizable
 * Implementa lógica común de cache para todos los módulos
 */

import { type BaseCacheData, type CacheModuleConfig, CachePriority, SyncStatus } from '../types/cache.types'
import type { BaseIndexedDBService } from './BaseIndexedDBService'

export abstract class BaseCacheService<TEntity = any> {
  protected indexedDB: BaseIndexedDBService
  protected config: CacheModuleConfig
  protected state: {
    isEnabled: boolean
    lastSync: string | null
    pendingChanges: number
    conflicts: number
    cacheSize: number
    efficiency: number
  }

  constructor(
    indexedDB: BaseIndexedDBService,
    config: CacheModuleConfig,
  ) {
    this.indexedDB = indexedDB
    this.config = config
    this.state = {
      isEnabled: true,
      lastSync: null,
      pendingChanges: 0,
      conflicts: 0,
      cacheSize: 0,
      efficiency: 0,
    }
  }

  // ========== MÉTODOS ABSTRACTOS (deben ser implementados por cada módulo) ==========

  /**
   * Obtener nombre del store por key
   * Cada módulo debe implementar su propia lógica de mapeo
   */
  protected abstract getStoreNameByKey(key: string): string

  /**
   * Obtener configuración por key
   * Cada módulo debe implementar su propia lógica de configuración
   */
  protected abstract getConfigByKey(key: string): { ttl: number; maxSize: number; encrypted: boolean }

  /**
   * Transformar datos antes de guardar
   * Cada módulo puede implementar transformaciones específicas
   */
  protected transformDataForCache(data: any, key: string): any {
    return data
  }

  /**
   * Transformar datos después de obtener
   * Cada módulo puede implementar transformaciones específicas
   */
  protected transformDataFromCache(data: any, key: string): any {
    return data
  }

  // ========== MÉTODOS COMUNES ==========

  /**
   * Inicializar el servicio de cache
   */
  async init(): Promise<void> {
    await this.indexedDB.init()
    await this.updateCacheState()
    console.log('✅ Servicio de cache inicializado correctamente')
  }

  /**
   * Obtener configuración del módulo
   */
  getConfig(): CacheModuleConfig {
    return this.config
  }

  /**
   * Obtener estado del cache
   */
  getState() {
    return { ...this.state }
  }

  /**
   * Guardar datos en cache
   */
  async set<T>(key: string, data: T, priority: CachePriority = CachePriority.MEDIUM): Promise<void> {
    if (!this.config.enabled || !this.state.isEnabled)
      return

    try {
      const storeName = this.getStoreNameByKey(key)
      const transformedData = this.transformDataForCache(data, key)

      let cacheData: any

      if (this.isListKey(key)) {
        // Para listas, crear un objeto con id específico
        cacheData = {
          id: key,
          data: transformedData,
          cached_at: new Date().toISOString(),
          version: Date.now(),
          sync_status: SyncStatus.SYNCED,
        }
      }
      else {
        // Para objetos individuales, mantener la estructura original
        cacheData = {
          ...transformedData,
          cached_at: new Date().toISOString(),
          version: Date.now(),
          sync_status: SyncStatus.SYNCED,
        }
      }

      await this.indexedDB.set(storeName, cacheData)
      await this.updateCacheState()

      console.log(`💾 Datos cacheados: ${key}`)
    }
    catch (error) {
      console.error('❌ Error guardando en cache:', error)
      throw error
    }
  }

  /**
   * Obtener datos del cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.config.enabled || !this.state.isEnabled)
      return null

    try {
      const storeName = this.getStoreNameByKey(key)
      const data = await this.indexedDB.get<any>(storeName, key)

      if (!data)
        return null

      // Verificar si el cache es válido (TTL)
      if (!this.isCacheValid(data.cached_at, this.getConfigByKey(key).ttl)) {
        await this.delete(key)

        return null
      }

      console.log(`📖 Datos obtenidos del cache: ${key}`)

      // Si es una lista, devolver solo los datos
      if (this.isListKey(key) && data.data)
        return this.transformDataFromCache(data.data, key) as T

      return this.transformDataFromCache(data, key) as T
    }
    catch (error) {
      console.error('❌ Error obteniendo del cache:', error)

      return null
    }
  }

  /**
   * Eliminar datos del cache
   */
  async delete(key: string): Promise<void> {
    try {
      const storeName = this.getStoreNameByKey(key)

      await this.indexedDB.delete(storeName, key)
      await this.updateCacheState()
      console.log(`🗑️ Datos eliminados del cache: ${key}`)
    }
    catch (error) {
      console.error('❌ Error eliminando del cache:', error)
      throw error
    }
  }

  /**
   * Limpiar todo el cache
   */
  async clear(): Promise<void> {
    try {
      for (const storeName of Object.keys(this.config.stores))
        await this.indexedDB.clear(storeName)

      await this.updateCacheState()
      console.log('🧹 Cache limpiado completamente')
    }
    catch (error) {
      console.error('❌ Error limpiando cache:', error)
      throw error
    }
  }

  /**
   * Obtener estadísticas del cache
   */
  async getStats(): Promise<Record<string, number>> {
    return await this.indexedDB.getStats()
  }

  /**
   * Limpiar datos expirados
   */
  async cleanupExpired(): Promise<number> {
    let totalDeleted = 0

    for (const [storeName, config] of Object.entries(this.config.stores)) {
      try {
        const deleted = await this.indexedDB.cleanupExpired(storeName, config.ttl)

        totalDeleted += deleted
      }
      catch (error) {
        console.error(`Error limpiando ${storeName}:`, error)
      }
    }

    await this.updateCacheState()
    console.log(`🧹 Limpiados ${totalDeleted} elementos expirados`)

    return totalDeleted
  }

  // ========== MÉTODOS PRIVADOS ==========

  /**
   * Verificar si una clave es de lista
   */
  private isListKey(key: string): boolean {
    return key.includes('_list') || key.includes('_items') || key.includes('_collection')
  }

  /**
   * Verificar si el cache es válido
   */
  private isCacheValid(cachedAt: string, ttlMinutes: number): boolean {
    const now = new Date()
    const cached = new Date(cachedAt)
    const diffMinutes = (now.getTime() - cached.getTime()) / (1000 * 60)

    return diffMinutes <= ttlMinutes
  }

  /**
   * Actualizar estado del cache
   */
  async updateCacheState(): Promise<void> {
    try {
      const stats = await this.getStats()
      const totalItems = Object.values(stats).reduce((sum, count) => sum + count, 0)

      this.state.cacheSize = totalItems
      this.state.efficiency = totalItems > 0 ? (totalItems / this.getMaxCacheSize()) * 100 : 0
    }
    catch (error) {
      console.error('Error actualizando estado del cache:', error)
    }
  }

  /**
   * Obtener tamaño máximo del cache
   */
  private getMaxCacheSize(): number {
    return Object.values(this.config.stores).reduce((sum, config) => sum + config.maxSize, 0)
  }
}
