/**
 * Employee Module Menu Configuration
 */

export interface MenuItem {
  title: string
  icon: string
  to?: string
  action?: string
  children?: MenuItem[]
  badge?: string
  badgeClass?: string
}

const employeeMenu: MenuItem[] = [
  {
    title: 'Empleados',
    icon: 'tabler-users',
    children: [
      {
        title: 'Lista de Empleados',
        icon: 'tabler-list',
        to: '/employees',
      },
      {
        title: 'Nuevo Empleado',
        icon: 'tabler-user-plus',
        to: '/employees/create',
      },
      {
        title: 'Operadores',
        icon: 'tabler-steering-wheel',
        to: '/employees?position=operator',
      },
      {
        title: 'Ayudantes',
        icon: 'tabler-user-check',
        to: '/employees?position=helper',
      },
    ],
  },
]

export default employeeMenu
