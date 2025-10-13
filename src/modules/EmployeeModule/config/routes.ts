/**
 * Employee Module Routes
 */

import type { RouteRecordRaw } from 'vue-router'

const employeeRoutes: RouteRecordRaw[] = [
  {
    path: '/employees',
    name: 'employees-list',
    component: () => import('../presentation/views/EmployeeList.vue'),
    meta: {
      title: 'Empleados',
      requiresAuth: true,
    },
  },
  {
    path: '/employees/create',
    name: 'employees-create',
    component: () => import('../presentation/views/EmployeeCreate.vue'),
    meta: {
      title: 'Crear Empleado',
      requiresAuth: true,
    },
  },
  {
    path: '/employees/:id',
    name: 'employees-detail',
    component: () => import('../presentation/views/EmployeeDetail.vue'),
    meta: {
      title: 'Detalle del Empleado',
      requiresAuth: true,
    },
  },
  {
    path: '/employees/:id/edit',
    name: 'employees-edit',
    component: () => import('../presentation/views/EmployeeEdit.vue'),
    meta: {
      title: 'Editar Empleado',
      requiresAuth: true,
    },
  },
]

export default employeeRoutes
