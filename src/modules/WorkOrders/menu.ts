/**
 * WorkOrders Module Menu Configuration
 */

import type { VerticalNavItems } from '@layouts/types'
import { createValidatedMenu } from '@/utils/menuValidator'

const workOrdersMenu: VerticalNavItems = [
  {
    title: 'Ordenes de trabajo',
    icon: { icon: 'tabler-clipboard-list' },
    action: 'read',
    subject: 'WorkOrder',
    children: [
      {
        title: 'Lista de ordenes',
        icon: { icon: 'tabler-list-details' },
        to: 'WorkOrdersList',
        action: 'read',
        subject: 'WorkOrder',
      },
      {
        title: 'Operadores',
        icon: { icon: 'tabler-users' },
        to: 'WorkOrderWorkersList',
        action: 'read',
        subject: 'WorkOrder',
      },
    ],
  },
]

export default createValidatedMenu(workOrdersMenu, 'WorkOrders')
