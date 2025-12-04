import type { RouteRecordRaw } from 'vue-router'

const contractsComponent = () => import('./views/index.vue')

const contractsRoutes: RouteRecordRaw[] = [
  {
    path: '/contracts',
    name: 'contracts-list',
    component: contractsComponent,
    meta: {
      action: 'manage',
      subject: 'all',
    },
  },
  {
    path: '/contracts/:id',
    name: 'contract-detail',
    component: () => import('./views/ContractDetailView.vue'),
    meta: {
      action: 'manage',
      subject: 'all',
    },
  },
]

export default contractsRoutes
