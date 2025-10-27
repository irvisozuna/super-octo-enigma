/**
 * UserManagement Module Routes
 */

import type { RouteRecordRaw } from 'vue-router'

const userManagementRoutes: RouteRecordRaw[] = [
  {
    path: '/roles',
    name: 'roles-list',
    component: () => import('../Role/presentation/views/RoleList.vue'),
    meta: {
      layout: 'default',
      title: 'Roles',
      requiresAuth: true,
      action: 'read',
      subject: 'Role',
    },
  },
  {
    path: '/roles/create',
    name: 'roles-create',
    component: () => import('../Role/presentation/views/RoleCreate.vue'),
    meta: {
      layout: 'default',
      title: 'Crear Rol',
      requiresAuth: true,
      action: 'create',
      subject: 'Role',
    },
  },
  {
    path: '/roles/:id',
    name: 'roles-detail',
    component: () => import('../Role/presentation/views/RoleDetail.vue'),
    meta: {
      layout: 'default',
      title: 'Detalle del Rol',
      requiresAuth: true,
      action: 'read',
      subject: 'Role',
    },
  },
  {
    path: '/roles/:id/edit',
    name: 'roles-edit',
    component: () => import('../Role/presentation/views/RoleEdit.vue'),
    meta: {
      layout: 'default',
      title: 'Editar Rol',
      requiresAuth: true,
      action: 'update',
      subject: 'Role',
    },
  },
  {
    path: '/permissions',
    name: 'permissions-list',
    component: () => import('../shared/presentation/views/PermissionList.vue'),
    meta: {
      layout: 'default',
      title: 'Permisos',
      requiresAuth: true,
      action: 'read',
      subject: 'Permission',
    },
  },
  {
    path: '/role-permissions',
    name: 'role-permissions',
    component: () => import('../shared/presentation/views/RolePermissions.vue'),
    meta: {
      layout: 'default',
      title: 'Asignar Permisos a Roles',
      requiresAuth: true,
      action: 'assign',
      subject: 'RolePermissions',
    },
  },
]

export default userManagementRoutes
