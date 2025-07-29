import type { DashboardMonitorEntity } from '../../domain/entities/DashboardMonitorEntity'
import type { DashboardMonitorEntityRepository } from '../repositories/DashboardMonitorEntityRepository'


export class DeleteDashboardMonitorEntityUseCase {
  constructor(private repository: DashboardMonitorEntityRepository) {}

  async execute(id: string): Promise<void> {
    
    await this.repository.delete(id)
    
  }
}