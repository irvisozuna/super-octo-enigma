import type { DashboardMonitorEntity } from '../../domain/entities/DashboardMonitorEntity'
import type { DashboardMonitorEntityRepository } from '../repositories/DashboardMonitorEntityRepository'


export class GetByIdDashboardMonitorEntityUseCase {
  constructor(private repository: DashboardMonitorEntityRepository) {}

  async execute(id: string): Promise<DashboardMonitorEntity> {
    
    const dashboardmonitorentity = await this.repository.findById(id)
    if (!dashboardmonitorentity) {
      throw new Error('DashboardMonitorEntity not found')
    }
    return dashboardmonitorentity
    
  }
}