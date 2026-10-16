import { ofetch } from 'ofetch'
import { sesionVencida } from '@/utils/sesion'

export const $api = ofetch.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  async onRequest({ options }) {
    const accessToken = useCookie('accessToken').value

    if (accessToken)
      options.headers.append('Authorization', `Bearer ${accessToken}`)
  },
  onResponseError({ request, response }) {
    // Token vencido o revocado: de regreso al login (XEL1-514)
    if (response.status === 401)
      void sesionVencida(String(request))
  },
})
