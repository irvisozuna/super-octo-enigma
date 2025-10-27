/**
 * UserManagement Module Menu Configuration
 */

import type { VerticalNavItems } from '@layouts/types'
import { createValidatedMenu } from '@/utils/menuValidator'

// TODO: Implementar menú cuando las vistas estén disponibles
const userManagementMenu: VerticalNavItems = [
  // {
  //   title: 'Gestión de Usuarios',
  //   icon: { icon: 'tabler-shield' },
  //   action: 'read',
  //   subject: 'Role',
  //   children: [
  //     {
  //       title: 'Roles',
  //       icon: { icon: 'tabler-shield-check' },
  //       to: 'roles-list',
  //       action: 'read',
  //       subject: 'Role',
  //     },
  //     {
  //       title: 'Nuevo Rol',
  //       icon: { icon: 'tabler-shield-plus' },
  //       to: 'roles-create',
  //       action: 'create',
  //       subject: 'Role',
  //     },
  //     {
  //       title: 'Permisos',
  //       icon: { icon: 'tabler-key' },
  //       to: 'permissions-list',
  //       action: 'read',
  //       subject: 'Permission',
  //     },
  //     {
  //       title: 'Asignar Permisos',
  //       icon: { icon: 'tabler-key-plus' },
  //       to: 'role-permissions',
  //       action: 'assign',
  //       subject: 'RolePermissions',
  //     },
  //   ],
  // },
]

// Validar menú en desarrollo
export default createValidatedMenu(userManagementMenu, 'UserManagementModule')
