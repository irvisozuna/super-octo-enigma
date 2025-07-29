export interface UpdateDashboardMonitorEntityDTO {
  name: string
  status: 'active' | 'inactive'
  description?: string
}