/**
 * Composable refactorizado para cache de clientes
 * Usa el sistema base reutilizable
 */

import { useBaseCache } from '@/@core/cache/composables/useBaseCache'
import { ClientCacheServiceV2 } from '../services/ClientCacheServiceV2'
import { ref, computed } from 'vue'
import type { ClientEntity } from '../../../domain/entities/ClientEntity'

// Instancia singleton del servicio de cache
let cacheServiceInstance: ClientCacheServiceV2 | null = null

export function useClientCacheV2() {
  // Crear instancia singleton
  if (!cacheServiceInstance) {
    cacheServiceInstance = new ClientCacheServiceV2()
  }

  // Usar el composable base
  const baseCache = useBaseCache(cacheServiceInstance, 'ClientModule')

  // ========== FUNCIONALIDAD ESPECÍFICA DE CLIENTES ==========

  /**
   * Cachear lista de clientes
   */
  async function cacheClientsList(clients: ClientEntity[]): Promise<void> {
    try {
      await cacheServiceInstance!.cacheClientsList(clients)
      await baseCache.updateCacheState()
    } catch (error) {
      console.error('Error cacheando lista de clientes:', error)
      throw error
    }
  }

  /**
   * Cachear cliente individual
   */
  async function cacheClient(client: ClientEntity): Promise<void> {
    try {
      await cacheServiceInstance!.cacheClient(client)
      await baseCache.updateCacheState()
    } catch (error) {
      console.error('Error cacheando cliente:', error)
      throw error
    }
  }

  /**
   * Obtener lista de clientes del cache
   */
  async function getCachedClientsList(): Promise<ClientEntity[] | null> {
    try {
      return await cacheServiceInstance!.get('clients_list')
    } catch (error) {
      console.error('Error obteniendo lista de clientes del cache:', error)
      return null
    }
  }

  /**
   * Obtener cliente individual del cache
   */
  async function getCachedClient(clientId: string): Promise<ClientEntity | null> {
    try {
      return await cacheServiceInstance!.get(`client_${clientId}`)
    } catch (error) {
      console.error('Error obteniendo cliente del cache:', error)
      return null
    }
  }

  /**
   * Cachear contactos de clientes
   */
  async function cacheClientContacts(contacts: any[]): Promise<void> {
    try {
      await cacheServiceInstance!.cacheClientContacts(contacts)
      await baseCache.updateCacheState()
    } catch (error) {
      console.error('Error cacheando contactos de clientes:', error)
      throw error
    }
  }

  /**
   * Obtener contactos del cache
   */
  async function getCachedClientContacts(): Promise<any[] | null> {
    try {
      return await cacheServiceInstance!.get('contacts_list')
    } catch (error) {
      console.error('Error obteniendo contactos del cache:', error)
      return null
    }
  }

  /**
   * Cachear estadísticas de clientes
   */
  async function cacheClientStats(stats: any): Promise<void> {
    try {
      await cacheServiceInstance!.cacheClientStats(stats)
      await baseCache.updateCacheState()
    } catch (error) {
      console.error('Error cacheando estadísticas de clientes:', error)
      throw error
    }
  }

  /**
   * Obtener estadísticas del cache
   */
  async function getCachedClientStats(): Promise<any | null> {
    try {
      return await cacheServiceInstance!.get('client_statistics')
    } catch (error) {
      console.error('Error obteniendo estadísticas del cache:', error)
      return null
    }
  }

  /**
   * Inicializar cache de clientes
   */
  async function initializeClientCache(): Promise<void> {
    try {
      await cacheServiceInstance!.init()
      console.log('✅ Cache de clientes inicializado')
    } catch (error) {
      console.error('❌ Error inicializando cache de clientes:', error)
      throw error
    }
  }

  // ========== MÉTODOS DE COMPATIBILIDAD ==========

  /**
   * Método de compatibilidad con la API anterior
   */
  async function cacheClients(clients: ClientEntity[]): Promise<void> {
    await cacheClientsList(clients)
  }

  /**
   * Método de compatibilidad con la API anterior
   */
  async function getCachedClients(): Promise<ClientEntity[] | null> {
    return await getCachedClientsList()
  }

  // ========== FUNCIONALIDAD ADICIONAL ESPECÍFICA ==========

  /**
   * Buscar clientes en cache por criterios
   */
  async function searchCachedClients(criteria: {
    status?: string
    business_type?: string
    industry?: string
  }): Promise<ClientEntity[]> {
    try {
      const clients = await getCachedClientsList()
      if (!clients) return []

      return clients.filter(client => {
        if (criteria.status && client.status !== criteria.status) return false
        if (criteria.business_type && client.business_type !== criteria.business_type) return false
        if (criteria.industry && client.industry !== criteria.industry) return false
        return true
      })
    } catch (error) {
      console.error('Error buscando clientes en cache:', error)
      return []
    }
  }

  /**
   * Obtener estadísticas de cache específicas
   */
  const cacheStats = computed(() => {
    const state = baseCache.cacheState.value
    return {
      totalClients: state.cacheSize,
      efficiency: state.efficiency,
      lastSync: state.lastSync,
      hasPendingChanges: baseCache.hasPendingChanges.value,
      hasConflicts: baseCache.hasConflicts.value,
      isOnline: baseCache.isCacheAvailable.value
    }
  })

  // ========== RETURN ==========

  return {
    // Funcionalidad base del cache
    ...baseCache,
    
    // Funcionalidad específica de clientes
    cacheClientsList,
    cacheClient,
    getCachedClientsList,
    getCachedClient,
    cacheClientContacts,
    getCachedClientContacts,
    cacheClientStats,
    getCachedClientStats,
    initializeClientCache,
    
    // Métodos de compatibilidad
    cacheClients,
    getCachedClients,
    
    // Funcionalidad adicional
    searchCachedClients,
    cacheStats
  }
}
