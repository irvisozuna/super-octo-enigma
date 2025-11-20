export default [
  {
    path: '/dashboards',
    name: 'dashboards',
    component: () => import('@/modules/DynamicReports/Dashboard/presentation/views/DashboardList.vue'),
    meta: {
      requiresAuth: true,
      resource: 'Dashboard',
      action: 'read',
    },
  },
  {
    path: '/dashboards/builder/:id',
    name: 'dashboards-builder',
    component: () => import('@/modules/DynamicReports/Dashboard/presentation/views/DashboardBuilder.vue'),
    meta: {
      requiresAuth: true,
      resource: 'Dashboard',
      action: 'update',
    },
  },
  {
    path: '/dashboards/:id',
    name: 'dashboards-view',
    component: () => import('@/modules/DynamicReports/Dashboard/presentation/views/DashboardViewer.vue'),
    meta: {
      requiresAuth: true,
      resource: 'Dashboard',
      action: 'read',
    },
  },
]
