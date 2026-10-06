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
    ],
  },
]

export default reportesMenu
