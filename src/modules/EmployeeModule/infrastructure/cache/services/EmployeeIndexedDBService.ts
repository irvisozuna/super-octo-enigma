/**
 * Servicio de IndexedDB específico para EmployeeModule
 * Extiende el servicio base con configuración específica
 */

import { BaseIndexedDBService } from '@/@core/cache/services/BaseIndexedDBService'
import type { IndexedDBStoreConfig } from '@/@core/cache/types/cache.types'

export class EmployeeIndexedDBService extends BaseIndexedDBService {
  constructor() {
    const stores: Record<string, IndexedDBStoreConfig> = {
      employees: {
        name: 'employees',
        keyPath: 'id',
        indexes: [
          { name: 'employee_code', keyPath: 'employee_code', unique: true },
          { name: 'status', keyPath: 'status' },
          { name: 'department', keyPath: 'department' },
          { name: 'cached_at', keyPath: 'cached_at' },
          { name: 'sync_status', keyPath: 'sync_status' },
        ],
      },
      departments: {
        name: 'departments',
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

    super('EmployeeModuleCache', 1, stores)
  }
}
