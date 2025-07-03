import type { RouteRecordRaw } from 'vue-router'

const paymentmandateComponent = () => import('./views/index.vue')
const paymentmandateViewComponent = () => import('./views/PaymentmandateView.vue')
const paymentmandateAddComponent = () => import('./views/PaymentmandateAdd.vue')
const paymentmandateEditComponent = () => import('./views/PaymentmandateEdit.vue')

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
]

export default paymentmandateRoutes
