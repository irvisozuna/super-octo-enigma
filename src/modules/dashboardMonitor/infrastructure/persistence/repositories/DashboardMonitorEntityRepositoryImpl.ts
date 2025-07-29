import type { DashboardMonitorEntity } from '../../domain/entities/DashboardMonitorEntity'
import type { DashboardMonitorEntityRepository } from '../../application/repositories/DashboardMonitorEntityRepository'
import type { CreateDashboardMonitorEntityDTO, UpdateDashboardMonitorEntityDTO } from '../../application/dtos'
import { DashboardMonitorEntityApiService } from '../api/services/DashboardMonitorEntityApiService'
import { DashboardMonitorEntityMapper } from '../../application/mappers/DashboardMonitorEntityMapper'

export class DashboardMonitorEntityRepositoryImpl implements DashboardMonitorEntityRepository {
  constructor(private apiService: DashboardMonitorEntityApiService) {}

  async findAll(): Promise<DashboardMonitorEntity[]> {
    const apiData = await this.apiService.getAll()
    return DashboardMonitorEntityMapper.fromApiList(apiData)
  }

  async findById(id: string): Promise<DashboardMonitorEntity | null> {
    try {
      const apiData = await this.apiService.getById(id)
      return DashboardMonitorEntityMapper.fromApi(apiData)
    } catch {
      return null
    }
  }

  async create(data: CreateDashboardMonitorEntityDTO): Promise<DashboardMonitorEntity> {
    const apiData = await this.apiService.create(data)
    return DashboardMonitorEntityMapper.fromApi(apiData)
  }

  async update(id: string, data: UpdateDashboardMonitorEntityDTO): Promise<DashboardMonitorEntity> {
    const apiData = await this.apiService.update(id, data)
    return DashboardMonitorEntityMapper.fromApi(apiData)
  }

  async delete(id: string): Promise<void> {
    await this.apiService.delete(id)
  }

  async search(query: string): Promise<DashboardMonitorEntity[]> {
    const apiData = await this.apiService.search(query)
    return DashboardMonitorEntityMapper.fromApiList(apiData)
  }
}