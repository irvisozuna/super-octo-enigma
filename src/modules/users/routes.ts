// src/modules/users/routes.ts
import { RouteRecordRaw } from 'vue-router';

const usersComponent = () => import('./users.vue')
const userRoutes: RouteRecordRaw[] = [
  {
    path: '/users',
    name: 'UsersList',
    component: usersComponent, // Ruta para la lista de usuarios
  }
];

export default userRoutes;
