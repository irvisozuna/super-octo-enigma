import type { RouteRecordRaw } from 'vue-router'

// Se registran por el glob `@/modules/**/routes.ts` (src/plugins/1.router). Cada endpoint vuelve a revisar el permiso.
const carteraRoutes: RouteRecordRaw[] = [
  {
    path: '/cartera/notificar',
    name: 'carteraNotificar',
    component: () => import('./views/Notificar.vue'),
    meta: { action: 'operate', subject: 'cartera-operar' },
  },
  {
    path: '/cartera/lotes',
    name: 'carteraLotes',
    component: () => import('./views/Lotes.vue'),
    meta: { action: 'read', subject: 'cartera' },
  },
  {
    path: '/cartera/lotes/:id([0-9a-f-]{36})',
    name: 'carteraLote',
    component: () => import('./views/Lote.vue'),
    meta: { action: 'read', subject: 'cartera' },
  },
  {
    path: '/cartera/notificaciones',
    name: 'carteraNotificaciones',
    component: () => import('./views/Notificaciones.vue'),
    meta: { action: 'read', subject: 'cartera' },
  },
  {
    path: '/cartera/configuracion',
    name: 'carteraConfiguracion',
    component: () => import('./views/Configuracion.vue'),
    meta: { action: 'read', subject: 'cartera' },
  },
]

export default carteraRoutes
