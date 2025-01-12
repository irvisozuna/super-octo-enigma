import { User } from '@/types/types';
import { computed } from 'vue';

export function useCurrentUser() {
  // Obtenemos el user actual desde la cookie
  const user = useCookie('userData');

  const getUserData = computed((): User => {
    return user.value as unknown as User;
  });

  const isAdmin = computed(() => {
    // Verificamos si entre los roles hay alguno con name === 'admin'
    return getUserData.value.roles.some((role: { name: string }) => role.name === 'admin');
  });

  return {
    getUserData,
    isAdmin,
  };
}
