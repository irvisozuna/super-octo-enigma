import type { CompanyConfigEntity } from '../entities/CompanyConfigEntity'

export interface CompanyConfigRepository {
  getConfig(companyId: string): Promise<CompanyConfigEntity | null>
  saveConfig(config: CompanyConfigEntity): Promise<CompanyConfigEntity>
  getCachedConfig(companyId: string): Promise<CompanyConfigEntity | null>
  saveCachedConfig(config: CompanyConfigEntity): Promise<void>
  clearCache(companyId: string): Promise<void>
  getConfigVersion(companyId: string): Promise<number>
}
