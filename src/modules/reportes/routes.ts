import type { RouteRecordRaw } from 'vue-router'

// Se registran por el glob `@/modules/**/routes.ts` (src/plugins/1.router). Convive con /reports del módulo viejo.
const reportesRoutes: RouteRecordRaw[] = [
  {
    path: '/reportes',
    name: 'reportesIndice',
    component: () => import('./views/ReportesIndice.vue'),
    meta: {
      action: 'read',
      subject: 'reportes',
    },
  },
]

export default reportesRoutes
