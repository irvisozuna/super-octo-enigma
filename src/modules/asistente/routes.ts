import type { RouteRecordRaw } from 'vue-router'

// Se registran por el glob `@/modules/**/routes.ts` (src/plugins/1.router). Lo que el asistente consulta lo deciden
// los permisos de Reportes, Tableros y Monitoreo del usuario, en el servidor.
const asistenteRoutes: RouteRecordRaw[] = [
  {
    path: '/asistente',
    name: 'asistente',
    component: () => import('./views/AsistentePagina.vue'),
    meta: {
      action: 'use',
      subject: 'asistente',
    },
  },
  {
    // Informe o presentación que armó el asistente (XEL1-712); el servidor solo lo da a quien lo pidió
    path: '/asistente/documentos/:id',
    name: 'asistente-documento',
    component: () => import('./views/DocumentoPagina.vue'),
    meta: {
      action: 'use',
      subject: 'asistente',
    },
  },
]

export default asistenteRoutes
