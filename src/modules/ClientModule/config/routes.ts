/**
 * Client Module Routes
 */

import type { RouteRecordRaw } from 'vue-router'

const clientRoutes: RouteRecordRaw[] = [
  {
    path: '/clients',
    name: 'clients-list',
    component: () => import('../presentation/views/ClientList.vue'),
    meta: {
      layout: 'default',
      title: 'Clientes',
      requiresAuth: true,
      action: 'read',
      subject: 'Client',
    },
  },
  {
    path: '/clients/create',
    name: 'clients-create',
    component: () => import('../presentation/views/ClientCreate.vue'),
    meta: {
      layout: 'default',
      title: 'Crear Cliente',
      requiresAuth: true,
      action: 'create',
      subject: 'Client',
    },
  },
  {
    path: '/clients/:id',
    name: 'clients-detail',
    component: () => import('../presentation/views/ClientDetail.vue'),
    meta: {
      layout: 'default',
      title: 'Detalle del Cliente',
      requiresAuth: true,
      action: 'read',
      subject: 'Client',
    },
  },
  {
    path: '/clients/:id/edit',
    name: 'clients-edit',
    component: () => import('../presentation/views/ClientEdit.vue'),
    meta: {
      layout: 'default',
      title: 'Editar Cliente',
      requiresAuth: true,
      action: 'update',
      subject: 'Client',
    },
  },
]

export default clientRoutes
