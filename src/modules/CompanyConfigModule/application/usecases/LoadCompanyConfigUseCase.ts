import type { CompanyConfigEntity } from '../../domain/entities/CompanyConfigEntity'
import { CompanyConfig } from '../../domain/entities/CompanyConfigEntity'
import type { CompanyConfigRepository } from '../../domain/repositories/CompanyConfigRepository'

export class LoadCompanyConfigUseCase {
  constructor(private repository: CompanyConfigRepository) {}

  async execute(companyId: string, forceRefresh = false): Promise<CompanyConfigEntity> {
    try {
      // Si no se fuerza el refresh, intentar cargar desde cache
      if (!forceRefresh) {
        const cachedConfig = await this.repository.getCachedConfig(companyId)
        if (cachedConfig) {
          // Verificar versión con el servidor
          const serverVersion = await this.repository.getConfigVersion(companyId)
          if (cachedConfig.version === serverVersion) {
            console.log('Loading company config from cache')

            return cachedConfig
          }
        }
      }

      // Cargar desde el servidor
      console.log('Loading company config from server')

      const config = await this.repository.getConfig(companyId)

      if (config) {
        // Guardar en cache
        await this.repository.saveCachedConfig(config)

        return config
      }

      // Si no hay configuración, retornar configuración por defecto
      return CompanyConfig.getDefaultConfig()
    }
    catch (error) {
      console.error('Error loading company config:', error)

      // Intentar cargar desde cache como fallback
      const cachedConfig = await this.repository.getCachedConfig(companyId)
      if (cachedConfig)
        return cachedConfig

      // Retornar configuración por defecto
      return CompanyConfig.getDefaultConfig()
    }
  }
}
