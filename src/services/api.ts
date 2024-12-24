// services/api.ts
export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  params?: Record<string, any>
  body?: any
  headers?: Record<string, string>
}

/**
 * Función genérica para consumir la API.
 * Ajusta la URL base, interceptores y manejo de errores según tu proyecto.
 */
export async function rawApi(
  url: string,
  { method = 'GET', params = {}, body, headers = {} }: ApiOptions = {},
) {
  // Base URL (puedes extraerlo de env variables, etc.)
  let finalUrl = import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}${url}`
    : url

  // Manejo básico de query params
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null) {
      query.append(key, String(val))
    }
  })
  if (query.toString()) {
    finalUrl += `?${query.toString()}`
  }

  const accessToken = useCookie('accessToken').value;

  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...headers,
    },
  }

  if (accessToken) {
    fetchOptions.headers = {
      ...fetchOptions.headers,
      Authorization: `Bearer ${accessToken}`,
    }
  }

  // Serializa body si es objeto
  if (body && typeof body === 'object') {
    fetchOptions.body = JSON.stringify(body)
  }

  try {
    const response = await fetch(finalUrl, fetchOptions)
    // Manejo de error en base al status
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    // Retorna JSON parseado
    return await response.json()
  } catch (error) {
    // Manejo de error global: logs, notificaciones, etc.
    console.error(`[rawApi] Error en ${method} ${url}`, error)
    throw error
  }
}
