import { RouteRecordRaw } from 'vue-router';

const userComponent = () => import('./views/index.vue');
const userViewComponent = () => import('./views/UserView.vue');
const userAddComponent = () => import('./views/UserAdd.vue');
const userEditComponent = () => import('./views/UserEdit.vue');

const userRoutes: RouteRecordRaw[] = [
  {
    path: '/users',
    name: 'UsersList',
    component: userComponent,
  },
  {
    path: '/users/:id',
    name: 'UserDetail',
    component: userViewComponent,
  },
  {
    path: '/user/add',
    name: 'UserAdd',
    component: () => userAddComponent
  },
  {
    path: '/user/edit/:id',
    name: 'UserEdit',
    component: () => userEditComponent
  }
];

export default userRoutes;
