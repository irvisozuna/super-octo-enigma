/**
 * Servicio de Cache específico para DocumentsModule
 * Extiende el servicio base con lógica específica de documentos
 */

import { DocumentsIndexedDBService } from './DocumentsIndexedDBService'
import { BaseCacheService } from '@/@core/cache/services/BaseCacheService'
import { type CacheModuleConfig, CachePriority } from '@/@core/cache/types/cache.types'

export class DocumentsCacheService extends BaseCacheService {
  constructor() {
    const indexedDB = new DocumentsIndexedDBService()

    const config: CacheModuleConfig = {
      enabled: true,
      dbName: 'DocumentsModuleCache',
      dbVersion: 1,
      stores: {
        documents: {
          key: 'documents',
          priority: CachePriority.HIGH,
          ttl: 15, // 15 minutos
          maxSize: 5000,
          encrypted: true, // Los documentos pueden contener información sensible
        },
        categories: {
          key: 'categories',
          priority: CachePriority.MEDIUM,
          ttl: 60, // 1 hora
          maxSize: 200,
          encrypted: false,
        },
        statistics: {
          key: 'statistics',
          priority: CachePriority.LOW,
          ttl: 120, // 2 horas
          maxSize: 100,
          encrypted: false,
        },
      },
      sync: {
        enabled: true,
        interval: 600000, // 10 minutos
        retryAttempts: 5,
        conflictResolution: 'manual', // Los documentos requieren resolución manual de conflictos
      },
    }

    super(indexedDB, config)
  }

  // ========== IMPLEMENTACIÓN DE MÉTODOS ABSTRACTOS ==========

  protected getStoreNameByKey(key: string): string {
    if (key.includes('documents_list') || key.startsWith('document_'))
      return 'documents'

    if (key.includes('category'))
      return 'categories'

    return 'statistics'
  }

  protected getConfigByKey(key: string): { ttl: number; maxSize: number; encrypted: boolean } {
    const storeName = this.getStoreNameByKey(key)
    const config = this.config.stores[storeName]

    if (!config)
      throw new Error(`Configuración no encontrada para la clave: ${key}`)

    return {
      ttl: config.ttl,
      maxSize: config.maxSize,
      encrypted: config.encrypted,
    }
  }

  protected transformDataForCache(data: any, key: string): any {
    // Transformaciones específicas para documentos
    if (key.includes('documents_list') && Array.isArray(data)) {
      return data.map(document => ({
        ...document,

        // Asegurar que los campos requeridos estén presentes
        document_type: document.document_type || 'unknown',
        status: document.status || 'draft',
        category: document.category || 'uncategorized',
      }))
    }

    return data
  }

  protected transformDataFromCache(data: any, key: string): any {
    // Transformaciones específicas para documentos al obtener del cache
    if (key.includes('documents_list') && Array.isArray(data)) {
      return data.map(document => ({
        ...document,

        // Limpiar campos de cache si es necesario
        cached_at: undefined,
        version: undefined,
        sync_status: undefined,
      }))
    }

    return data
  }

  // ========== MÉTODOS ESPECÍFICOS DE DOCUMENTOS ==========

  /**
   * Cachear lista de documentos
   */
  async cacheDocumentsList(documents: any[]): Promise<void> {
    const cacheData = documents.map(document => ({
      id: document.id,
      title: document.title,
      document_type: document.document_type,
      status: document.status,
      category: document.category,
      file_size: document.file_size,
      created_at: document.created_at,
      updated_at: document.updated_at,
      author_id: document.author_id,
      cached_at: new Date().toISOString(),
      version: Date.now(),
      sync_status: 'synced' as const,
    }))

    await this.set('documents_list', cacheData, CachePriority.HIGH)
  }

  /**
   * Cachear documento individual
   */
  async cacheDocument(document: any): Promise<void> {
    const cacheData = {
      id: document.id,
      title: document.title,
      document_type: document.document_type,
      status: document.status,
      category: document.category,
      file_size: document.file_size,
      created_at: document.created_at,
      updated_at: document.updated_at,
      author_id: document.author_id,
      cached_at: new Date().toISOString(),
      version: Date.now(),
      sync_status: 'synced' as const,
    }

    await this.set(`document_${document.id}`, cacheData, CachePriority.MEDIUM)
  }

  /**
   * Cachear categorías de documentos
   */
  async cacheDocumentCategories(categories: any[]): Promise<void> {
    const cacheData = categories.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      color: category.color,
      cached_at: new Date().toISOString(),
      version: Date.now(),
      sync_status: 'synced' as const,
    }))

    await this.set('categories_list', cacheData, CachePriority.MEDIUM)
  }

  /**
   * Cachear estadísticas de documentos
   */
  async cacheDocumentStats(stats: any): Promise<void> {
    const cacheData = {
      id: 'document_stats',
      total_documents: stats.total_documents,
      documents_by_type: stats.documents_by_type,
      documents_by_status: stats.documents_by_status,
      total_size: stats.total_size,
      cached_at: new Date().toISOString(),
      version: Date.now(),
      sync_status: 'synced' as const,
    }

    await this.set('document_statistics', cacheData, CachePriority.LOW)
  }

  /**
   * Sincronización específica de documentos
   */
  async forceSync(): Promise<void> {
    console.log('🔄 Iniciando sincronización forzada de documentos...')

    // Aquí implementarías la lógica específica de sincronización
    // Por ejemplo, llamar a la API y actualizar el cache

    await this.updateCacheState()
    console.log('✅ Sincronización de documentos completada')
  }

  /**
   * Alternar estado del cache
   */
  async toggleCache(enabled: boolean): Promise<void> {
    this.state.isEnabled = enabled
    console.log(`🔄 Cache de documentos ${enabled ? 'habilitado' : 'deshabilitado'}`)
  }
}
