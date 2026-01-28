import type { RouteRecordRaw } from 'vue-router'
import { READINGS_PERMISSIONS } from './permissions'

const readingsRoutes: RouteRecordRaw[] = [
  {
    path: '/readings',
    name: 'ReadingsList',
    component: () => import('../presentation/views/ReadingsList.vue'),
    meta: {
      title: 'Readings',
      action: 'manage',
      subject: READINGS_PERMISSIONS.viewReadings,
      requiresAuth: true,
    },
  },
  {
    path: '/readings/advance',
    name: 'ReadingsAdvance',
    component: () => import('../presentation/views/ReadingsAdvance.vue'),
    meta: {
      title: 'Avance de Lecturista',
      action: 'manage',
      subject: READINGS_PERMISSIONS.viewReadingAdvance,
      requiresAuth: true,
    },
  },
  {
    path: '/readings/:id',
    name: 'ReadingsDetail',
    component: () => import('../presentation/views/ReadingDetail.vue'),
    meta: {
      title: 'Detalle de Lectura',
      action: 'manage',
      subject: READINGS_PERMISSIONS.viewReadingDetail,
      requiresAuth: true,
    },
  },
  {
    path: '/readings/map',
    name: 'ReadingsMap',
    component: () => import('../presentation/views/ReadingsMap.vue'),
    meta: {
      title: 'Mapa de Lecturas',
      action: 'manage',
      subject: READINGS_PERMISSIONS.viewReadingMap,
      requiresAuth: true,
    },
  },
]

export default readingsRoutes
