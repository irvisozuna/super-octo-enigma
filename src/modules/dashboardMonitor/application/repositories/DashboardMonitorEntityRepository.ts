import type { DashboardMonitorEntity } from '../../domain/entities/DashboardMonitorEntity'
import type { CreateDashboardMonitorEntityDTO, UpdateDashboardMonitorEntityDTO } from '../dtos'

export interface DashboardMonitorEntityRepository {
  findAll(): Promise<DashboardMonitorEntity[]>
  findById(id: string): Promise<DashboardMonitorEntity | null>
  create(data: CreateDashboardMonitorEntityDTO): Promise<DashboardMonitorEntity>
  update(id: string, data: UpdateDashboardMonitorEntityDTO): Promise<DashboardMonitorEntity>
  delete(id: string): Promise<void>
  search(query: string): Promise<DashboardMonitorEntity[]>
}