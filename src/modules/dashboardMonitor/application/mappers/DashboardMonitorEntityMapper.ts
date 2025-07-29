import type { DashboardMonitorEntity } from '../../domain/entities/DashboardMonitorEntity'

export interface DashboardMonitorEntityApiResponse {
  id: string
  name: string
  description?: string
  status: 'active' | 'inactive'
  created_at: Date
  updated_at: Date
}

export class DashboardMonitorEntityMapper {
  static fromApi(apiData: DashboardMonitorEntityApiResponse): DashboardMonitorEntity {
    return {
      id: apiData.id,
      name: apiData.name,
      description: apiData.description,
      status: apiData.status,
      created_at: apiData.created_at,
      updated_at: apiData.updated_at
    }
  }

  static toApi(entity: DashboardMonitorEntity): DashboardMonitorEntityApiResponse {
    return {
      id: apiData.id,
      name: apiData.name,
      description: apiData.description,
      status: apiData.status,
      created_at: apiData.created_at,
      updated_at: apiData.updated_at
    }
  }

  static fromApiList(apiDataList: DashboardMonitorEntityApiResponse[]): DashboardMonitorEntity[] {
    return apiDataList.map(this.fromApi)
  }
}