import type { RouteRecordRaw } from 'vue-router'

const userComponent = () => import('./views/index.vue')
const userViewComponent = () => import('./views/UserView.vue')
const userAddComponent = () => import('./views/UserAdd.vue')
const userEditComponent = () => import('./views/UserEdit.vue')

const userRoutes: RouteRecordRaw[] = [
  {
    path: '/users',
    name: 'UsersList',
    component: userComponent,
    meta: {
      action: 'read',
      subject: 'User',
    },
  },
  {
    path: '/users/create',
    name: 'UsersCreate',
    component: userAddComponent,
    meta: {
      action: 'create',
      subject: 'User',
    },
  },
  {
    path: '/users/:id',
    name: 'UserDetail',
    component: userViewComponent,
    meta: {
      action: 'read',
      subject: 'User',
    },
  },
  {
    path: '/users/:id/edit',
    name: 'UserEdit',
    component: userEditComponent,
    meta: {
      action: 'update',
      subject: 'User',
    },
  },
]

export default userRoutes
