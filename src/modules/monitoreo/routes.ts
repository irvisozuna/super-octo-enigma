import type { RouteRecordRaw } from 'vue-router'

// Se registran por el glob `@/modules/**/routes.ts` (src/plugins/1.router). El alcance por gerencia lo aplica el servidor.
const monitoreoRoutes: RouteRecordRaw[] = [
  {
    path: '/monitoreo',
    name: 'monitoreoInicio',
    component: () => import('./views/MonitorDia.vue'),
    meta: {
      action: 'read',
      subject: 'monitoreo',
    },
  },
  {
    path: '/monitoreo/admin/alcances',
    name: 'monitoreoAdminAlcances',
    component: () => import('./views/admin/AlcancesUsuarios.vue'),
    meta: {
      action: 'manage',
      subject: 'monitoreo-admin',
    },
  },
]

export default monitoreoRoutes
