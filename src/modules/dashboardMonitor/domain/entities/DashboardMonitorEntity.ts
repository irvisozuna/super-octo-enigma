export interface DashboardMonitorEntity {
  id: string
  name: string
  description?: string
  status: 'active' | 'inactive'
  created_at: Date
  updated_at: Date
}

export class DashboardMonitorEntityEntity implements DashboardMonitorEntity {
  id: string
  name: string
  description?: string
  status: 'active' | 'inactive'
  created_at: Date
  updated_at: Date

  constructor(data: Partial<DashboardMonitorEntity>) {
    Object.assign(this, data)
  }

  static create(data: Omit<DashboardMonitorEntity, 'id' | 'created_at' | 'updated_at'>): DashboardMonitorEntityEntity {
    return new DashboardMonitorEntityEntity({
      ...data,
      id: crypto.randomUUID(),
      created_at: new Date(),
      updated_at: new Date()
    })
  }
}