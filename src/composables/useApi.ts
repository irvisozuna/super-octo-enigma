import { createFetch } from '@vueuse/core'
import { destr } from 'destr'
import { sesionVencida } from '@/utils/sesion'

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
      const organization = import.meta.env.VITE_API_ORGANIZATION ?? ''

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
    onFetchError(ctx) {
      // Token vencido o revocado: de regreso al login (XEL1-514)
      if (ctx.response?.status === 401)
        void sesionVencida(ctx.response.url)

      return ctx
    },
  },
})
