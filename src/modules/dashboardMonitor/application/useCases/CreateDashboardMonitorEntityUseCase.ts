import type { DashboardMonitorEntity } from '../../domain/entities/DashboardMonitorEntity'
import type { DashboardMonitorEntityRepository } from '../repositories/DashboardMonitorEntityRepository'
import type { CreateDashboardMonitorEntityDTO } from '../dtos'

export class CreateDashboardMonitorEntityUseCase {
  constructor(private repository: DashboardMonitorEntityRepository) {}

  async execute(data: CreateDashboardMonitorEntityDTO): Promise<DashboardMonitorEntity> {
    
    return await this.repository.create(data)
    
  }
}