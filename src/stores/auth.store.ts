import { defineStore } from 'pinia';
import { cerrarSesion } from '@/utils/sesion';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    accessToken: useCookie('accessToken').value,
  }),
  actions: {
    async logout() {
      // Revoca el token en la API antes de borrar las cookies (XEL1-514)
      await cerrarSesion()
    },
  },
});
