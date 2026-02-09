/**
 * Contract Module Routes
 */

import type { RouteRecordRaw } from 'vue-router'
import { CONTRACT_PERMISSIONS } from './permissions'

const contractsRoutes: RouteRecordRaw[] = [
  {
    path: '/contracts',
    name: 'contracts-list',
    component: () => import('../presentation/views/index.vue'),
    meta: {
      action: 'manage',
      subject: CONTRACT_PERMISSIONS.viewContracts,
      requiresAuth: true,
    },
  },
  {
    path: '/contracts/:id',
    name: 'contracts-detail',
    component: () => import('../presentation/views/ContractDetailView.vue'),
    meta: {
      action: 'manage',
      subject: CONTRACT_PERMISSIONS.viewContractDetail,
      requiresAuth: true,
    },
  },
]

export default contractsRoutes
