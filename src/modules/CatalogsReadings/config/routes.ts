import type { RouteRecordRaw } from 'vue-router'
import { CATALOGS_READINGS_PERMISSIONS } from './permissions'

const catalogsReadingsRoutes: RouteRecordRaw[] = [
  {
    path: '/catalogs-readings',
    name: 'CatalogsReadings',
    component: () => import('../presentation/views/CatalogsReadingsList.vue'),
    meta: {
      title: 'Catalogos',
      action: 'manage',
      subject: CATALOGS_READINGS_PERMISSIONS.viewCatalogs,
      requiresAuth: true,
    },
  },
]

export default catalogsReadingsRoutes
