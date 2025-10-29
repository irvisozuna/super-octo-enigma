import type { CompanyConfigEntity } from '../../domain/entities/CompanyConfigEntity'
import type { CompanyConfigRepository } from '../../domain/repositories/CompanyConfigRepository'

export class SaveCompanyConfigUseCase {
  constructor(private repository: CompanyConfigRepository) {}

  async execute(config: CompanyConfigEntity): Promise<CompanyConfigEntity> {
    try {
      // Incrementar versión
      const currentVersion = config.version || 0

      config.version = currentVersion + 1
      config.updatedAt = new Date().toISOString()

      // Guardar en servidor
      // El cache se actualiza automáticamente en el repositorio
      return await this.repository.saveConfig(config)
    }
    catch (error) {
      console.error('Error saving company config:', error)
      throw error
    }
  }

  async clearCache(companyId: string): Promise<void> {
    await this.repository.clearCache(companyId)
  }
}
