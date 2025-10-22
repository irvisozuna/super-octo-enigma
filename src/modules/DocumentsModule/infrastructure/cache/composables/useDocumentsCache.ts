/**
 * Composable específico para cache de documentos
 * Extiende el composable base con funcionalidad específica
 */

import { useBaseCache } from '@/@core/cache/composables/useBaseCache'
import { DocumentsCacheService } from '../services/DocumentsCacheService'

// Instancia singleton del servicio de cache
let cacheServiceInstance: DocumentsCacheService | null = null

export function useDocumentsCache() {
  // Crear instancia singleton
  if (!cacheServiceInstance) {
    cacheServiceInstance = new DocumentsCacheService()
  }

  // Usar el composable base
  const baseCache = useBaseCache(cacheServiceInstance, 'DocumentsModule')

  // ========== FUNCIONALIDAD ESPECÍFICA DE DOCUMENTOS ==========

  /**
   * Cachear lista de documentos
   */
  async function cacheDocumentsList(documents: any[]): Promise<void> {
    try {
      await cacheServiceInstance!.cacheDocumentsList(documents)
      await baseCache.updateCacheState()
    } catch (error) {
      console.error('Error cacheando lista de documentos:', error)
      throw error
    }
  }

  /**
   * Cachear documento individual
   */
  async function cacheDocument(document: any): Promise<void> {
    try {
      await cacheServiceInstance!.cacheDocument(document)
      await baseCache.updateCacheState()
    } catch (error) {
      console.error('Error cacheando documento:', error)
      throw error
    }
  }

  /**
   * Obtener lista de documentos del cache
   */
  async function getCachedDocumentsList(): Promise<any[] | null> {
    try {
      return await cacheServiceInstance!.get('documents_list')
    } catch (error) {
      console.error('Error obteniendo lista de documentos del cache:', error)
      return null
    }
  }

  /**
   * Obtener documento individual del cache
   */
  async function getCachedDocument(documentId: string): Promise<any | null> {
    try {
      return await cacheServiceInstance!.get(`document_${documentId}`)
    } catch (error) {
      console.error('Error obteniendo documento del cache:', error)
      return null
    }
  }

  /**
   * Cachear categorías de documentos
   */
  async function cacheDocumentCategories(categories: any[]): Promise<void> {
    try {
      await cacheServiceInstance!.cacheDocumentCategories(categories)
      await baseCache.updateCacheState()
    } catch (error) {
      console.error('Error cacheando categorías de documentos:', error)
      throw error
    }
  }

  /**
   * Obtener categorías del cache
   */
  async function getCachedDocumentCategories(): Promise<any[] | null> {
    try {
      return await cacheServiceInstance!.get('categories_list')
    } catch (error) {
      console.error('Error obteniendo categorías del cache:', error)
      return null
    }
  }

  /**
   * Cachear estadísticas de documentos
   */
  async function cacheDocumentStats(stats: any): Promise<void> {
    try {
      await cacheServiceInstance!.cacheDocumentStats(stats)
      await baseCache.updateCacheState()
    } catch (error) {
      console.error('Error cacheando estadísticas de documentos:', error)
      throw error
    }
  }

  /**
   * Obtener estadísticas del cache
   */
  async function getCachedDocumentStats(): Promise<any | null> {
    try {
      return await cacheServiceInstance!.get('document_statistics')
    } catch (error) {
      console.error('Error obteniendo estadísticas del cache:', error)
      return null
    }
  }

  /**
   * Inicializar cache de documentos
   */
  async function initializeDocumentsCache(): Promise<void> {
    try {
      await cacheServiceInstance!.init()
      console.log('✅ Cache de documentos inicializado')
    } catch (error) {
      console.error('❌ Error inicializando cache de documentos:', error)
      throw error
    }
  }

  // ========== RETURN ==========

  return {
    // Funcionalidad base del cache
    ...baseCache,
    
    // Funcionalidad específica de documentos
    cacheDocumentsList,
    cacheDocument,
    getCachedDocumentsList,
    getCachedDocument,
    cacheDocumentCategories,
    getCachedDocumentCategories,
    cacheDocumentStats,
    getCachedDocumentStats,
    initializeDocumentsCache
  }
}
