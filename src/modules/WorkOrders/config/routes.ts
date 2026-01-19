import type { RouteRecordRaw } from 'vue-router'

const workOrdersRoutes: RouteRecordRaw[] = [
  {
    path: '/workorders',
    name: 'WorkOrdersList',
    component: () => import('../presentation/views/WorkOrdersList.vue'),
    meta: {
      title: 'WorkOrders',
      action: 'read',
      subject: 'WorkOrder',
      requiresAuth: true,
    },
  },
  {
    path: '/workorders/workers',
    name: 'WorkOrderWorkersList',
    component: () => import('../presentation/views/WorkOrderWorkersList.vue'),
    meta: {
      title: 'Operadores',
      action: 'read',
      subject: 'WorkOrder',
      requiresAuth: true,
    },
  },
  {
    path: '/workorders/workers/:id',
    name: 'WorkOrderWorkerOrders',
    component: () => import('../presentation/views/WorkOrderWorkerOrders.vue'),
    meta: {
      title: 'Ordenes asignadas',
      action: 'read',
      subject: 'WorkOrder',
      requiresAuth: true,
    },
  },
  {
    path: '/workorders/:id',
    name: 'WorkOrderDetail',
    component: () => import('../presentation/views/WorkOrderDetail.vue'),
    meta: {
      title: 'Detalle de orden',
      action: 'read',
      subject: 'WorkOrder',
      requiresAuth: true,
    },
  },
]

export default workOrdersRoutes
