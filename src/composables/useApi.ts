import { createFetch } from '@vueuse/core'
import { destr } from 'destr'

export const useApi = createFetch({
  baseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  fetchOptions: {
    headers: {
      Accept: 'application/json',
    },
  },
  options: {
    refetch: true,
    async beforeFetch({ options }) {
      const accessToken = useCookie('accessToken').value

      // Obtener organización del tenant store o usar fallback
      let organization = ''
      try {
        const { useTenantStore } = await import('@/stores/tenant.store')
        const tenantStore = useTenantStore()

        organization = tenantStore.organization || import.meta.env.VITE_API_ORGANIZATION || ''
      }
      catch (error) {
        // Fallback a variable de entorno si hay error
        organization = import.meta.env.VITE_API_ORGANIZATION || ''
      }

      if (accessToken) {
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${accessToken}`,
          'X-Organization': `${organization}`,
        }
      }

      return { options }
    },
    afterFetch(ctx) {
      const { data, response } = ctx

      // Parse data if it's JSON

      let parsedData = null
      try {
        parsedData = destr(data)
      }
      catch (error) {
        console.error(error)
      }

      return { data: parsedData, response }
    },
  },
})
