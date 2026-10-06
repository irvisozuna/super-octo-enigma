import type { VerticalNavItems } from '@layouts/types'

// Grupo estático; los reportes permitidos por rol se agregan como hijos desde GET /reporting/menu (useMenuReportes)
const reportesMenu: VerticalNavItems = [
  {
    title: 'Reportes',
    icon: { icon: 'tabler-report-analytics' },
    action: 'read',
    subject: 'reportes',
    children: [
      {
        title: 'Todos los reportes',
        to: 'reportesIndice',
        action: 'read',
        subject: 'reportes',
      },
      {
        title: 'Mis exportaciones',
        to: 'reportesExportaciones',
        action: 'read',
        subject: 'reportes',
      },
      {
        title: 'Permisos por rol',
        to: 'reportesAdminPermisos',
        action: 'manage',
        subject: 'reportes-admin',
      },
    ],
  },
]

export default reportesMenu
