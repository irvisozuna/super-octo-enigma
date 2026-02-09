import type { RouteRecordRaw } from 'vue-router'
import { WORK_ORDERS_PERMISSIONS } from './permissions'

const workOrdersRoutes: RouteRecordRaw[] = [
  {
    path: '/workorders',
    name: 'WorkOrdersList',
    component: () => import('../presentation/views/WorkOrdersList.vue'),
    meta: {
      title: 'WorkOrders',
      action: 'manage',
      subject: WORK_ORDERS_PERMISSIONS.viewWorkOrders,
      requiresAuth: true,
    },
  },
  {
    path: '/workorders/workers',
    name: 'WorkOrderWorkersList',
    component: () => import('../presentation/views/WorkOrderWorkersList.vue'),
    meta: {
      title: 'Operadores',
      action: 'manage',
      subject: WORK_ORDERS_PERMISSIONS.viewWorkers,
      requiresAuth: true,
    },
  },
  {
    path: '/workorders/workers/:id',
    name: 'WorkOrderWorkerOrders',
    component: () => import('../presentation/views/WorkOrderWorkerOrders.vue'),
    meta: {
      title: 'Ordenes asignadas',
      action: 'manage',
      subject: WORK_ORDERS_PERMISSIONS.viewWorkers,
      requiresAuth: true,
    },
  },
  {
    path: '/workorders/:id',
    name: 'WorkOrderDetail',
    component: () => import('../presentation/views/WorkOrderDetail.vue'),
    meta: {
      title: 'Detalle de orden',
      action: 'manage',
      subject: WORK_ORDERS_PERMISSIONS.viewWorkOrderDetail,
      requiresAuth: true,
    },
  },
]

export default workOrdersRoutes
