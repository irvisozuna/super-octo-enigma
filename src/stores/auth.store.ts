import { defineStore } from 'pinia';
import { useRouter } from 'vue-router';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    accessToken: useCookie('accessToken').value,
  }),
  actions: {
    async logout() {
      // Remove "accessToken" from cookie
      useCookie('accessToken').value = null;

      // Remove "userData" from cookie
      useCookie('userData').value = null;

      // Remove "userAbilities" from cookie
      useCookie('userAbilityRules').value = null;

      // Reset ability to initial ability
      const ability = useAbility(); // Asegúrate de importar useAbility si no está ya definido en tu archivo
      ability.update([]);

      // Redirect to login page
      const router = useRouter();
      await router.push('/login');
    },
  },
});
