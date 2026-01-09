/**
 * Contract Module Routes - Configuration Layer
 */

import type { RouteRecordRaw } from 'vue-router'

const contractsRoutes: RouteRecordRaw[] = [
  {
    path: '/contracts',
    name: 'contracts-list',
    component: () => import('./presentation/views/index.vue'),
    meta: {
      action: 'read',
      subject: 'Contract',
    },
  },
  {
    path: '/contracts/:id',
    name: 'contracts-detail',
    component: () => import('./presentation/views/ContractDetailView.vue'),
    meta: {
      action: 'read',
      subject: 'Contract',
    },
  },
]

export default contractsRoutes
