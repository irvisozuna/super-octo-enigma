/**
 * Servicio de IndexedDB específico para DocumentsModule
 * Extiende el servicio base con configuración específica
 */

import { BaseIndexedDBService } from '@/@core/cache/services/BaseIndexedDBService'
import type { IndexedDBStoreConfig } from '@/@core/cache/types/cache.types'

export class DocumentsIndexedDBService extends BaseIndexedDBService {
  constructor() {
    const stores: Record<string, IndexedDBStoreConfig> = {
      documents: {
        name: 'documents',
        keyPath: 'id',
        indexes: [
          { name: 'document_type', keyPath: 'document_type' },
          { name: 'status', keyPath: 'status' },
          { name: 'category', keyPath: 'category' },
          { name: 'cached_at', keyPath: 'cached_at' },
          { name: 'sync_status', keyPath: 'sync_status' },
        ],
      },
      categories: {
        name: 'categories',
        keyPath: 'id',
        indexes: [
          { name: 'name', keyPath: 'name' },
          { name: 'cached_at', keyPath: 'cached_at' },
        ],
      },
      statistics: {
        name: 'statistics',
        keyPath: 'id',
        indexes: [
          { name: 'type', keyPath: 'type' },
          { name: 'cached_at', keyPath: 'cached_at' },
        ],
      },
    }

    super('DocumentsModuleCache', 1, stores)
  }
}
