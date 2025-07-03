import { RouteRecordRaw } from 'vue-router';

const templateComponent = () => import('./views/index.vue');
const templateViewComponent = () => import('./views/TemplateView.vue');
const templateAddComponent = () => import('./views/TemplateAdd.vue');
const templateEditComponent = () => import('./views/TemplateEdit.vue');

const templateRoutes: RouteRecordRaw[] = [
  {
    path: '/templates',
    name: 'templatesList',
    component: templateComponent,
  },
  {
    path: '/templates/:id',
    name: 'templatesDetail',
    component: templateViewComponent,
  },
  {
    path: '/template/add',
    name: 'templatesAdd',
    component: () => templateAddComponent
  },
  {
    path: '/template/edit/:id',
    name: 'templatesEdit',
    component: () => templateEditComponent
  }
];

export default templateRoutes;
