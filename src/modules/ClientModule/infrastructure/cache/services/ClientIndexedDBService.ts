/**
 * Servicio de IndexedDB específico para ClientModule
 * Refactorizado para usar el sistema base reutilizable
 */

import { BaseIndexedDBService } from '@/@core/cache/services/BaseIndexedDBService'
import type { IndexedDBStoreConfig } from '@/@core/cache/types/cache.types'

export class ClientIndexedDBService extends BaseIndexedDBService {
  constructor() {
    const stores: Record<string, IndexedDBStoreConfig> = {
      clients: {
        name: 'clients',
        keyPath: 'id',
        indexes: [
          { name: 'client_code', keyPath: 'client_code', unique: true },
          { name: 'status', keyPath: 'status' },
          { name: 'business_type', keyPath: 'business_type' },
          { name: 'cached_at', keyPath: 'cached_at' },
          { name: 'sync_status', keyPath: 'sync_status' }
        ]
      },
      contacts: {
        name: 'contacts',
        keyPath: 'id',
        indexes: [
          { name: 'client_id', keyPath: 'client_id' },
          { name: 'is_primary', keyPath: 'is_primary' },
          { name: 'cached_at', keyPath: 'cached_at' }
        ]
      },
      statistics: {
        name: 'statistics',
        keyPath: 'id',
        indexes: [
          { name: 'type', keyPath: 'type' },
          { name: 'cached_at', keyPath: 'cached_at' }
        ]
      }
    }

    super('ClientModuleCache', 1, stores)
  }
}
