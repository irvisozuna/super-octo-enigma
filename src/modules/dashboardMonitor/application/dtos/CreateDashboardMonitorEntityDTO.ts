export interface CreateDashboardMonitorEntityDTO {
  name: string
  status: 'active' | 'inactive'
  description?: string
}