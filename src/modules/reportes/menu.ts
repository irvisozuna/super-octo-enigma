import type { VerticalNavItems } from '@layouts/types'

// Entrada estática del módulo; los reportes, tableros y documentos permitidos llegan de GET /reporting/menu
const reportesMenu: VerticalNavItems = [
  {
    title: 'Reportes',
    icon: { icon: 'tabler-report-analytics' },
    to: 'reportesIndice',
    action: 'read',
    subject: 'reportes',
  },
]

export default reportesMenu
