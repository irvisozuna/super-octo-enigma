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
    path: '/monitoreo/quiosco',
    name: 'monitoreoQuiosco',
    component: () => import('./views/Quiosco.vue'),
    meta: {
      layout: 'blank',
      action: 'read',
      subject: 'monitoreo',
    },
  },
  {
    path: '/monitoreo/alertas',
    name: 'monitoreoAlertas',
    component: () => import('./views/Alertas.vue'),
    meta: {
      action: 'read',
      subject: 'monitoreo',
    },
  },
  {
    path: '/monitoreo/admin/destinatarios',
    name: 'monitoreoAdminDestinatarios',
    component: () => import('./views/admin/Destinatarios.vue'),
    meta: {
      action: 'manage',
      subject: 'monitoreo-admin',
    },
  },
  {
    path: '/monitoreo/admin/configuracion',
    name: 'monitoreoAdminConfiguracion',
    component: () => import('./views/admin/Configuracion.vue'),
    meta: {
      action: 'manage',
      subject: 'monitoreo-admin',
    },
  },
  {
    path: '/monitoreo/coordenadas',
    name: 'monitoreoCoordenadas',
    component: () => import('./views/Coordenadas.vue'),
    meta: {
      action: 'read',
      subject: 'monitoreo',
    },
  },
  {
    path: '/monitoreo/admin/calendario',
    name: 'monitoreoAdminCalendario',
    component: () => import('./views/admin/Calendario.vue'),
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
