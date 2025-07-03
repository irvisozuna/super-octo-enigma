import { defineStore } from 'pinia'
import { useRouter } from 'vue-router'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    accessToken: useCookie('accessToken').value,
  }),
  actions: {
    async logout() {
      try {
        // Make logout request to backend
        await $api('/auth/logout', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'X-Organization': import.meta.env.VITE_API_ORGANIZATION,
          },
        })
      }
      catch (error) {
        console.error('Error during logout:', error)
      }
      finally {
        // Remove "accessToken" from cookie
        useCookie('accessToken').value = null

        // Remove "userData" from cookie
        useCookie('userData').value = null

        // Remove "userAbilities" from cookie
        useCookie('userAbilityRules').value = null
        useCookie('dolibarrToken').value = null
      }
    },
  },
})
