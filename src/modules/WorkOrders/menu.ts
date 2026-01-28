/**
 * WorkOrders Module Menu Configuration
 */

import type { VerticalNavItems } from '@layouts/types'
import { createValidatedMenu } from '@/utils/menuValidator'
import { WORK_ORDERS_PERMISSIONS } from './config/permissions'

const workOrdersMenu: VerticalNavItems = [
  {
    title: 'Ordenes de trabajo',
    icon: { icon: 'tabler-clipboard-list' },
    action: 'manage',
    subject: WORK_ORDERS_PERMISSIONS.viewWorkOrders,
    children: [
      {
        title: 'Lista de ordenes',
        icon: { icon: 'tabler-list-details' },
        to: 'WorkOrdersList',
        action: 'manage',
        subject: WORK_ORDERS_PERMISSIONS.viewWorkOrders,
      },
      {
        title: 'Operadores',
        icon: { icon: 'tabler-users' },
        to: 'WorkOrderWorkersList',
        action: 'manage',
        subject: WORK_ORDERS_PERMISSIONS.viewWorkers,
      },
    ],
  },
]

export default createValidatedMenu(workOrdersMenu, 'WorkOrders')
