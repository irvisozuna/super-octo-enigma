import { useAuthStore } from '@/stores/auth.store'; // Ajusta la importación según tu estructura
import { ofetch } from 'ofetch'

const apiService = ofetch.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  async onRequest({ options }) {
    const accessToken = useCookie('accessToken').value
    const organization = import.meta.env.VITE_API_ORGANIZATION
    if (accessToken) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`,
        'X-Organization': `${organization}`,
      }
    }
  },
  async onResponseError({ response }) {
    if (response.status === 401) {
      const authStore = useAuthStore()
      const errorData = await response._data

      console.error('Error: ', response)
      if (errorData.error === 'TokenExpiredError') {
        // Cierra la sesión del usuario
        await authStore.logout()
      }
    }

    return Promise.reject(response)
  },
})

export const ApiService = {
  get(apiPath: string, options = {}) {
    return apiService(apiPath, { method: 'GET', ...options })
  },
  post(apiPath: string, data: any, options = {}) {
    return apiService(apiPath, { method: 'POST', body: data, ...options })
  },
  put(apiPath: string, data: any, options = {}) {
    return apiService(apiPath, { method: 'PUT', body: data, ...options })
  },
  delete(apiPath: string, options = {}) {
    return apiService(apiPath, { method: 'DELETE', ...options })
  },
}
