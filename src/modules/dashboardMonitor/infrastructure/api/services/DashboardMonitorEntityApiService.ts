import { ApiService } from '@/shared/infrastructure/http/ApiService'
import type { DashboardMonitorEntity } from '../../domain/entities/DashboardMonitorEntity'
import type { CreateDashboardMonitorEntityDTO, UpdateDashboardMonitorEntityDTO } from '../dtos'
import { DashboardMonitorEntityEndpoints } from './DashboardMonitorEntityEndpoints'

export class DashboardMonitorEntityApiService extends ApiService {
  async getAll(): Promise<DashboardMonitorEntity[]> {
    return this.get(DashboardMonitorEntityEndpoints.list)
  }

  async getById(id: string): Promise<DashboardMonitorEntity> {
    return this.get(DashboardMonitorEntityEndpoints.get(id))
  }

  async create(data: CreateDashboardMonitorEntityDTO): Promise<DashboardMonitorEntity> {
    return this.post(DashboardMonitorEntityEndpoints.create, data)
  }

  async update(id: string, data: UpdateDashboardMonitorEntityDTO): Promise<DashboardMonitorEntity> {
    return this.put(DashboardMonitorEntityEndpoints.update(id), data)
  }

  async delete(id: string): Promise<void> {
    return this.delete(DashboardMonitorEntityEndpoints.delete(id))
  }

  async search(query: string): Promise<DashboardMonitorEntity[]> {
    return this.get(`${DashboardMonitorEntityEndpoints.search}?q=${encodeURIComponent(query)}`)
  }

  async export(format: 'excel' | 'pdf' = 'excel'): Promise<Blob> {
    return this.getBlob(`${DashboardMonitorEntityEndpoints.export}?format=${format}`)
  }
}