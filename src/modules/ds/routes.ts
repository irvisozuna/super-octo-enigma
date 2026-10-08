import type { RouteRecordRaw } from 'vue-router'

// Guía viva del Aquasoft Design System 1.0. Solo administradores (la vista lo comprueba); no aparece en el menú.
const dsRoutes: RouteRecordRaw[] = [
  {
    path: '/_ds',
    name: 'dsGuia',
    component: () => import('./views/Guia.vue'),
    meta: {
      action: 'read',
      subject: 'Profile',
    },
  },
]

export default dsRoutes
