import type { RouteRecordRaw } from 'vue-router'

const paymentmandateComponent = () => import('./views/index.vue')
const paymentmandateViewComponent = () => import('./views/PaymentmandateView.vue')
const paymentmandateAddComponent = () => import('./views/PaymentmandateAdd.vue')
const paymentmandateEditComponent = () => import('./views/PaymentmandateEdit.vue')

// Contract Registry Components
const contractRegistryListComponent = () => import('./views/ContractRegistryList.vue')
const contractRegistryViewComponent = () => import('./views/ContractRegistryView.vue')
const contractRegistryAddComponent = () => import('./views/ContractRegistryAdd.vue')
const contractRegistryEditComponent = () => import('./views/ContractRegistryEdit.vue')

const paymentmandateRoutes: RouteRecordRaw[] = [
  {
    path: '/paymentmandates',
    name: 'paymentmandatesList',
    component: paymentmandateComponent,
    meta: {
      action: 'read',
      subject: 'PaymentMandates',
    },
  },
  {
    path: '/paymentmandates/:id',
    name: 'paymentmandatesDetail',
    component: paymentmandateViewComponent,
  },
  {
    path: '/paymentmandate/add',
    name: 'paymentmandatesAdd',
    component: () => paymentmandateAddComponent,
  },
  {
    path: '/paymentmandate/edit/:id',
    name: 'paymentmandatesEdit',
    component: () => paymentmandateEditComponent,
  },

  // Contract Registry Routes
  {
    path: '/contract-registry',
    name: 'contractRegistryList',
    component: contractRegistryListComponent,
    meta: {
      action: 'read',
      subject: 'PaymentMandates',
    },
  },
  {
    path: '/contract-registry/:id',
    name: 'contractRegistryDetail',
    component: contractRegistryViewComponent,
  },
  {
    path: '/contract-registry/add',
    name: 'contractRegistryAdd',
    component: contractRegistryAddComponent,
  },
  {
    path: '/contract-registry/edit/:id',
    name: 'contractRegistryEdit',
    component: contractRegistryEditComponent,
  },
]

export default paymentmandateRoutes
