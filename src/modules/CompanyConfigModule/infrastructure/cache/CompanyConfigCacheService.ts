import Dexie, { type Table } from 'dexie'
import type { CompanyConfigEntity } from '../../domain/entities/CompanyConfigEntity'

interface CachedConfig extends CompanyConfigEntity {
  cacheKey: string
  cachedAt: number
}

class CompanyConfigDB extends Dexie {
  configs!: Table<CachedConfig>

  constructor() {
    super('CompanyConfigDB')
    this.version(1).stores({
      configs: 'cacheKey, companyId, version, cachedAt',
    })
  }
}

export class CompanyConfigCacheService {
  private db: CompanyConfigDB
  private CACHE_TTL = 24 * 60 * 60 * 1000 // 24 horas en ms

  constructor() {
    this.db = new CompanyConfigDB()
  }

  async getCachedConfig(companyId: string): Promise<CompanyConfigEntity | null> {
    try {
      const cacheKey = `config_${companyId}`
      const cached = await this.db.configs.get(cacheKey)

      if (!cached)
        return null

      // Verificar si el cache ha expirado
      const now = Date.now()
      if (now - cached.cachedAt > this.CACHE_TTL) {
        await this.clearCache(companyId)

        return null
      }

      // Eliminar campos de cache antes de retornar
      const { cacheKey: _, cachedAt: __, ...config } = cached

      return config
    }
    catch (error) {
      console.error('Error getting cached config:', error)

      return null
    }
  }

  async saveCachedConfig(config: CompanyConfigEntity): Promise<void> {
    try {
      const cacheKey = `config_${config.companyId}`

      const cachedConfig: CachedConfig = {
        ...config,
        cacheKey,
        cachedAt: Date.now(),
      }

      await this.db.configs.put(cachedConfig)
    }
    catch (error) {
      console.error('Error saving cached config:', error)
    }
  }

  async clearCache(companyId: string): Promise<void> {
    try {
      const cacheKey = `config_${companyId}`

      await this.db.configs.delete(cacheKey)
    }
    catch (error) {
      console.error('Error clearing cache:', error)
    }
  }

  async clearAllCache(): Promise<void> {
    try {
      await this.db.configs.clear()
    }
    catch (error) {
      console.error('Error clearing all cache:', error)
    }
  }

  async isCacheValid(companyId: string, serverVersion: number): Promise<boolean> {
    try {
      const cached = await this.getCachedConfig(companyId)
      if (!cached)
        return false

      return cached.version === serverVersion
    }
    catch {
      return false
    }
  }
}
