// src/composables/useApi.ts
import { createFetch } from '@vueuse/core'
import { destr } from 'destr'

const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api'

export const useApi = createFetch({
  baseUrl,
  fetchOptions: {
    headers: {
      Accept: 'application/json',
    },
  },
  options: {
    refetch: true,
    async beforeFetch({ url, options }) {
      // Ejemplo: leer token de cookies o Pinia
      const accessToken = useCookie('accessToken').value
      if (accessToken) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${accessToken}`,
        }
      }
      return { options }
    },
    afterFetch(ctx) {
      const { data, response } = ctx
      let parsedData = null

      try {
        parsedData = destr(data)
      } catch (error) {
        console.error('[useApi] Error destr parsing:', error)
      }

      if (!response.ok) {
        console.warn(`[useApi] Response not OK: ${response.status}`)
        // Manejo de 401 u otros errores
      }
      return { data: parsedData, response }
    },
    onFetchError(ctx) {
      const { error, data, response } = ctx
      console.error('[useApi] onFetchError', error, data, response)
      // Manejo global de errores
      return ctx
    },
  },
})

// atajo para rawApi (llamada simple sin .json())
// Podrías exportar un helper genérico:
export async function rawApi(url: string, options?: any) {
  const { data } = await useApi(url, options).json()
  return data
}
