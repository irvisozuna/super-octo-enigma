import type { RouteRecordRaw } from 'vue-router'

const readingsRoutes: RouteRecordRaw[] = [
  {
    path: '/readings',
    name: 'ReadingsList',
    component: () => import('../presentation/views/ReadingsList.vue'),
    meta: {
      title: 'Readings',
      requiresAuth: true,
    },
  },
  {
    path: '/readings/advance',
    name: 'ReadingsAdvance',
    component: () => import('../presentation/views/ReadingsAdvance.vue'),
    meta: {
      title: 'Avance de Lecturista',
      requiresAuth: true,
    },
  },
  {
    path: '/readings/:id',
    name: 'ReadingsDetail',
    component: () => import('../presentation/views/ReadingDetail.vue'),
    meta: {
      title: 'Detalle de Lectura',
      requiresAuth: true,
    },
  },
  {
    path: '/readings/map',
    name: 'ReadingsMap',
    component: () => import('../presentation/views/ReadingsMap.vue'),
    meta: {
      title: 'Mapa de Lecturas',
      requiresAuth: true,
    },
  },
]

export default readingsRoutes
