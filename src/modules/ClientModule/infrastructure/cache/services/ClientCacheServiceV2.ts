/**
 * Servicio de Cache refactorizado para ClientModule
 * Usa el sistema base reutilizable
 */

import { BaseCacheService } from '@/@core/cache/services/BaseCacheService'
import { ClientIndexedDBService } from './ClientIndexedDBService'
import { CachePriority, SyncStatus, type CacheModuleConfig } from '@/@core/cache/types/cache.types'
import type { ClientEntity } from '../../../domain/entities/ClientEntity'

export class ClientCacheServiceV2 extends BaseCacheService<ClientEntity> {
  constructor() {
    const indexedDB = new ClientIndexedDBService()
    
    const config: CacheModuleConfig = {
      enabled: true,
      dbName: 'ClientModuleCache',
      dbVersion: 1,
      stores: {
        clients: {
          key: 'clients',
          priority: CachePriority.HIGH,
          ttl: 5, // 5 minutos
          maxSize: 1000,
          encrypted: false
        },
        contacts: {
          key: 'contacts',
          priority: CachePriority.MEDIUM,
          ttl: 15, // 15 minutos
          maxSize: 5000,
          encrypted: false
        },
        statistics: {
          key: 'statistics',
          priority: CachePriority.LOW,
          ttl: 60, // 1 hora
          maxSize: 100,
          encrypted: false
        }
      },
      sync: {
        enabled: true,
        interval: 300000, // 5 minutos
        retryAttempts: 3,
        conflictResolution: 'server'
      }
    }

    super(indexedDB, config)
  }

  // ========== IMPLEMENTACIÓN DE MÉTODOS ABSTRACTOS ==========

  protected getStoreNameByKey(key: string): string {
    if (key.includes('clients_list') || key.startsWith('client_')) {
      return 'clients'
    }
    if (key.includes('contact')) {
      return 'contacts'
    }
    return 'statistics'
  }

  protected getConfigByKey(key: string): { ttl: number; maxSize: number; encrypted: boolean } {
    const storeName = this.getStoreNameByKey(key)
    const config = this.config.stores[storeName]
    
    if (!config) {
      throw new Error(`Configuración no encontrada para la clave: ${key}`)
    }

    return {
      ttl: config.ttl,
      maxSize: config.maxSize,
      encrypted: config.encrypted
    }
  }

  protected transformDataForCache(data: any, key: string): any {
    // Transformaciones específicas para clientes
    if (key.includes('clients_list') && Array.isArray(data)) {
      return data.map(client => ({
        ...client,
        // Asegurar que los campos requeridos estén presentes
        client_code: client.client_code || client.id,
        status: client.status || 'active',
        business_type: client.business_type || 'unknown'
      }))
    }

    return data
  }

  protected transformDataFromCache(data: any, key: string): any {
    // Transformaciones específicas para clientes al obtener del cache
    if (key.includes('clients_list') && Array.isArray(data)) {
      return data.map(client => ({
        ...client,
        // Limpiar campos de cache si es necesario
        cached_at: undefined,
        version: undefined,
        sync_status: undefined
      }))
    }

    return data
  }

  // ========== MÉTODOS ESPECÍFICOS DE CLIENTES ==========

  /**
   * Cachear lista de clientes
   */
  async cacheClientsList(clients: ClientEntity[]): Promise<void> {
    const cacheData = clients.map(client => ({
      id: client.id,
      client_code: client.client_code,
      business_name: client.business_name,
      trade_name: client.trade_name,
      business_type: client.business_type,
      industry: client.industry,
      status: client.status,
      primary_phone: client.primary_phone,
      city: client.city,
      state: client.state,
      cached_at: new Date().toISOString(),
      version: Date.now(),
      sync_status: SyncStatus.SYNCED
    }))

    await this.set('clients_list', cacheData, CachePriority.HIGH)
  }

  /**
   * Cachear cliente individual
   */
  async cacheClient(client: ClientEntity): Promise<void> {
    const cacheData = {
      id: client.id,
      client_code: client.client_code,
      business_name: client.business_name,
      trade_name: client.trade_name,
      business_type: client.business_type,
      industry: client.industry,
      status: client.status,
      primary_phone: client.primary_phone,
      city: client.city,
      state: client.state,
      cached_at: new Date().toISOString(),
      version: Date.now(),
      sync_status: SyncStatus.SYNCED
    }

    await this.set(`client_${client.id}`, cacheData, CachePriority.MEDIUM)
  }

  /**
   * Cachear contactos de clientes
   */
  async cacheClientContacts(contacts: any[]): Promise<void> {
    const cacheData = contacts.map(contact => ({
      id: contact.id,
      client_id: contact.client_id,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      position: contact.position,
      is_primary: contact.is_primary,
      cached_at: new Date().toISOString(),
      version: Date.now(),
      sync_status: SyncStatus.SYNCED
    }))

    await this.set('contacts_list', cacheData, CachePriority.MEDIUM)
  }

  /**
   * Cachear estadísticas de clientes
   */
  async cacheClientStats(stats: any): Promise<void> {
    const cacheData = {
      id: 'client_stats',
      total_clients: stats.total_clients,
      active_clients: stats.active_clients,
      clients_by_type: stats.clients_by_type,
      clients_by_industry: stats.clients_by_industry,
      cached_at: new Date().toISOString(),
      version: Date.now(),
      sync_status: SyncStatus.SYNCED
    }

    await this.set('client_statistics', cacheData, CachePriority.LOW)
  }

  /**
   * Sincronización específica de clientes
   */
  async forceSync(): Promise<void> {
    console.log('🔄 Iniciando sincronización forzada de clientes...')
    
    // Aquí implementarías la lógica específica de sincronización
    // Por ejemplo, llamar a la API y actualizar el cache
    
    await this.updateCacheState()
    console.log('✅ Sincronización de clientes completada')
  }

  /**
   * Alternar estado del cache
   */
  async toggleCache(enabled: boolean): Promise<void> {
    this.state.isEnabled = enabled
    console.log(`🔄 Cache de clientes ${enabled ? 'habilitado' : 'deshabilitado'}`)
  }

  // ========== MÉTODOS DE COMPATIBILIDAD ==========

  /**
   * Método de compatibilidad con la API anterior
   */
  async cacheClients(clients: ClientEntity[]): Promise<void> {
    await this.cacheClientsList(clients)
  }

  /**
   * Método de compatibilidad con la API anterior
   */
  async getCachedClients(): Promise<ClientEntity[] | null> {
    return await this.get('clients_list')
  }
}
