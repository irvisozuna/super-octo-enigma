export const DashboardMonitorEntityEndpoints = {
  base: '/dashboardmonitorentity',
  list: '/dashboardmonitorentity',
  create: '/dashboardmonitorentity',
  get: (id: string) => `/dashboardmonitorentity/${id}`,
  update: (id: string) => `/dashboardmonitorentity/${id}`,
  delete: (id: string) => `/dashboardmonitorentity/${id}`,
  search: '/dashboardmonitorentity/search',
  export: '/dashboardmonitorentity/export',
  import: '/dashboardmonitorentity/import'
} as const