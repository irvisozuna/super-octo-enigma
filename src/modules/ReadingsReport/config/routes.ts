import type { RouteRecordRaw } from 'vue-router'

const readingsReportList = () => import('../presentation/views/index.vue')
const readingsReportAdvance = () => import('../presentation/views/ReadingsReportsAdvance.vue')
const readingsReportRoutesList = () => import('../presentation/views/RoutesDownloaded.vue')

const readingsReportRoutes: RouteRecordRaw[] = [
  {
    path: '/readings-reports',
    name: 'ReadingsReportsList',
    component: readingsReportList,
  },
  {
    path: '/readings-reports/advance',
    name: 'ReadingsReportsAdvance',
    component: readingsReportAdvance,
  },
  {
    path: '/readings-reports/routes-downloaded',
    name: 'ReadingsReportsRoutesDownloaded',
    component: readingsReportRoutesList,
    meta: { requiresAuth: true },
  },
]

export default readingsReportRoutes
