import type { RouteRecordRaw } from 'vue-router'

// Se registran por el glob `@/modules/**/routes.ts` (src/plugins/1.router). Cada endpoint vuelve a revisar el permiso.
const ordenesRoutes: RouteRecordRaw[] = [
  {
    path: '/ordenes',
    name: 'ordenesLista',
    component: () => import('./views/Ordenes.vue'),
    meta: { action: 'read', subject: 'ordenes' },
  },
  {
    path: '/ordenes/agentes',
    name: 'ordenesAgentes',
    component: () => import('./views/Agentes.vue'),
    meta: { action: 'read', subject: 'agentes' },
  },
  {
    path: '/ordenes/puente',
    name: 'ordenesPuente',
    component: () => import('./views/Puente.vue'),
    meta: { action: 'manage', subject: 'ordenes-admin' },
  },
]

export default ordenesRoutes
