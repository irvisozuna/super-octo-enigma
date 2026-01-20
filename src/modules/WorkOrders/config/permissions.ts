/**
 * WorkOrders Module Permissions (ACL)
 */

export interface WorkOrdersPermissions {
  viewWorkOrders: string
  viewWorkOrderDetail: string
  viewWorkers: string
  createWorkOrder: string
  updateWorkOrder: string
  deleteWorkOrder: string
  exportWorkOrders: string
  manageHistory: string
  managePhotos: string
}

export const WORK_ORDERS_PERMISSIONS: WorkOrdersPermissions = {
  viewWorkOrders: 'workorders:view:list',
  viewWorkOrderDetail: 'workorders:view:detail',
  viewWorkers: 'workorders:view:workers',
  createWorkOrder: 'workorders:create:workorder',
  updateWorkOrder: 'workorders:update:workorder',
  deleteWorkOrder: 'workorders:delete:workorder',
  exportWorkOrders: 'workorders:export:data',
  manageHistory: 'workorders:manage:history',
  managePhotos: 'workorders:manage:photos',
}

export const WORK_ORDERS_PERMISSION_GROUPS = {
  admin: Object.values(WORK_ORDERS_PERMISSIONS),
  viewer: [
    WORK_ORDERS_PERMISSIONS.viewWorkOrders,
    WORK_ORDERS_PERMISSIONS.viewWorkOrderDetail,
    WORK_ORDERS_PERMISSIONS.viewWorkers,
  ],
}

