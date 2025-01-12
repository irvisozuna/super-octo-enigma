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
    meta:{
      action: 'read',
      subject: 'users'
    }
  },
  {
    path: '/users/:id',
    name: 'UserDetail',
    component: userViewComponent,
    meta:{
      action: 'read',
      subject: 'users'
    }
  }
];

export default userRoutes;
