import type { CompanyConfigEntity } from '../../domain/entities/CompanyConfigEntity'
import type { CompanyConfigRepository } from '../../domain/repositories/CompanyConfigRepository'
import { CompanyConfigCacheService } from '../cache/CompanyConfigCacheService'
import { rawApi } from '@/services/api'

export class CompanyConfigApiService implements CompanyConfigRepository {
  private cacheService: CompanyConfigCacheService

  constructor() {
    this.cacheService = new CompanyConfigCacheService()
  }

  async getConfig(companyId: string): Promise<CompanyConfigEntity | null> {
    try {
      const response = await rawApi('/companies/configuration', {
        method: 'GET',
      })

      return response?.data || response
    }
    catch (error) {
      console.error('Error fetching company config:', error)

      return null
    }
  }

  async saveConfig(config: CompanyConfigEntity): Promise<CompanyConfigEntity> {
    try {
      const response = await rawApi('/companies/configuration', {
        method: 'POST',
        body: config,
      })

      const savedConfig = response?.data || response

      // Actualizar cache después de guardar
      await this.saveCachedConfig(savedConfig)

      return savedConfig
    }
    catch (error) {
      console.error('Error saving company config:', error)
      throw error
    }
  }

  async getCachedConfig(companyId: string): Promise<CompanyConfigEntity | null> {
    return this.cacheService.getCachedConfig(companyId)
  }

  async saveCachedConfig(config: CompanyConfigEntity): Promise<void> {
    return this.cacheService.saveCachedConfig(config)
  }

  async clearCache(companyId: string): Promise<void> {
    return this.cacheService.clearCache(companyId)
  }

  async getConfigVersion(companyId: string): Promise<number> {
    try {
      const response = await rawApi('/companies/configuration/version', {
        method: 'GET',
      })

      return response?.version || 0
    }
    catch {
      return 0
    }
  }

  /**
   * Upload logo image and get URL
   */
  async uploadLogo(companyId: string, file: File, type: 'login' | 'menu' | 'favicon'): Promise<string> {
    try {
      const formData = new FormData()

      formData.append('file', file)
      formData.append('type', type)

      // rawApi maneja FormData automáticamente
      const response = await rawApi('/companies/configuration/logo', {
        method: 'POST',
        body: formData,
      })

      // La respuesta viene con { url, type, message }
      const url = response?.url || response?.data?.url

      // Si la URL no tiene protocolo, agregarle https://
      if (url && !url.startsWith('http://') && !url.startsWith('https://'))
        return `https://${url}`

      return url
    }
    catch (error) {
      console.error('Error uploading logo:', error)
      throw error
    }
  }
}
