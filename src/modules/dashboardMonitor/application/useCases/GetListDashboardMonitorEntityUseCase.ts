import type { DashboardMonitorEntity } from '../../domain/entities/DashboardMonitorEntity'
import type { DashboardMonitorEntityRepository } from '../repositories/DashboardMonitorEntityRepository'


export class GetListDashboardMonitorEntityUseCase {
  constructor(private repository: DashboardMonitorEntityRepository) {}

  async execute(): Promise<DashboardMonitorEntity[]> {
    
    return await this.repository.findAll()
    
  }
}