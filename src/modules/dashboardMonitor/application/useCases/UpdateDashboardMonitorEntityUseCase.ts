import type { DashboardMonitorEntity } from '../../domain/entities/DashboardMonitorEntity'
import type { DashboardMonitorEntityRepository } from '../repositories/DashboardMonitorEntityRepository'
import type { UpdateDashboardMonitorEntityDTO } from '../dtos'

export class UpdateDashboardMonitorEntityUseCase {
  constructor(private repository: DashboardMonitorEntityRepository) {}

  async execute(id: string, data: UpdateDashboardMonitorEntityDTO): Promise<DashboardMonitorEntity> {
    
    return await this.repository.update(id, data)
    
  }
}