import { RouteRecordRaw } from 'vue-router';

const supportComponent = () => import('./views/index.vue');

const supportRoutes: RouteRecordRaw[] = [
  {
    path: '/supports',
    name: 'supportsList',
    component: supportComponent,
    meta:{
      action: 'read',
      subject: 'supports'
    }
  }
];

export default supportRoutes;
