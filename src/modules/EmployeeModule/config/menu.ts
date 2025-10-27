/**
 * Employee Module Menu Configuration
 */

import type { VerticalNavItems } from '@layouts/types'
import { createValidatedMenu } from '@/utils/menuValidator'

const employeeMenu: VerticalNavItems = [
  {
    title: 'Empleados',
    icon: { icon: 'tabler-users' },
    action: 'read',
    subject: 'Employee',
    children: [
      {
        title: 'Lista de Empleados',
        icon: { icon: 'tabler-list' },
        to: 'employees-list',
        action: 'read',
        subject: 'Employee',
      },
      {
        title: 'Nuevo Empleado',
        icon: { icon: 'tabler-user-plus' },
        to: 'employees-create',
        action: 'create',
        subject: 'Employee',
      },
    ],
  },
]

// Validar menú en desarrollo
export default createValidatedMenu(employeeMenu, 'EmployeeModule')
