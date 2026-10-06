import type { RouteRecordRaw } from 'vue-router'
import { useMenuReportesStore } from './stores/menuReportesStore'

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
  {
    path: '/reportes/exportaciones',
    name: 'reportesExportaciones',
    component: () => import('./views/ExportacionesCola.vue'),
    meta: {
      action: 'read',
      subject: 'reportes',
    },
  },
  {
    path: '/reportes/admin/permisos',
    name: 'reportesAdminPermisos',
    component: () => import('./views/admin/PermisosRoles.vue'),
    meta: {
      action: 'manage',
      subject: 'reportes-admin',
    },
  },
  {
    path: '/reportes/tableros/:clave([a-z0-9_]+)',
    name: 'reportesTablero',
    component: () => import('./views/TableroVista.vue'),
    props: true,
    meta: {
      action: 'read',
      subject: 'tableros',
    },
    beforeEnter: to => {
      const menu = useMenuReportesStore()
      const clave = String(to.params.clave)

      if (menu.cargado && !menu.tieneClave(clave, 'tablero'))
        return { name: 'reportesIndice', query: { sinAcceso: clave } }

      return true
    },
  },
  {
    path: '/reportes/:clave([a-z0-9_]+)',
    name: 'reportesVisor',
    component: () => import('./views/ReporteVisor.vue'),
    props: true,
    meta: {
      action: 'read',
      subject: 'reportes',
    },

    // Si el menú ya cargó y la clave no está, el usuario no tiene acceso: al índice con aviso
    // (nunca a not-authorized, que cierra la sesión). Si el menú aún no carga, el API responde 403.
    beforeEnter: to => {
      const menu = useMenuReportesStore()
      const clave = String(to.params.clave)

      if (menu.cargado && !menu.tieneClave(clave))
        return { name: 'reportesIndice', query: { sinAcceso: clave } }

      return true
    },
  },
]

export default reportesRoutes
