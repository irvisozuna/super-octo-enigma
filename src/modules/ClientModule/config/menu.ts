/**
 * Client Module Menu Configuration
 */

import type { VerticalNavItems } from '@layouts/types'
import { createValidatedMenu } from '@/utils/menuValidator'

const clientMenu: VerticalNavItems = [
  {
    title: 'Clientes',
    icon: { icon: 'tabler-users' },
    action: 'read',
    subject: 'clients',
    children: [
      {
        title: 'Lista de Clientes',
        icon: { icon: 'tabler-list' },
        to: 'clients-list',
        action: 'read',
        subject: 'clients',
      },
      {
        title: 'Nuevo Cliente',
        icon: { icon: 'tabler-user-plus' },
        to: 'clients-create',
        action: 'create',
        subject: 'clients',
      },

      // TODO: Agregar vista de estadísticas
      // {
      //   title: 'Estadísticas',
      //   icon: { icon: 'tabler-chart-bar' },
      //   to: 'clients-statistics',
      //   action: 'read',
      //   subject: 'clients',
      // },
    ],
  },
]

// Validar menú en desarrollo
export default createValidatedMenu(clientMenu, 'ClientModule')
