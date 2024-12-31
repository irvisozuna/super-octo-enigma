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

    // Intenta parsear el JSON independientemente del status
    let jsonResponse: any
    try {
      jsonResponse = await response.json()
    } catch (parseError) {
      jsonResponse = null
    }

    // Manejo de error en base al status
    if (!response.ok) {
      const error = new Error(
        jsonResponse?.message || `HTTP error! status: ${response.status}`
      ) as Error & { status?: number; errors?: string[] }

      error.status = response.status
      error.errors = jsonResponse?.errors || []

      throw error
    }

    // Retorna JSON parseado si no hay errores
    return jsonResponse
  } catch (error) {
    // Manejo de error global: logs, notificaciones, etc.
    console.error(`[rawApi] Error en ${method} ${url}`, error)

    // Re-lanza el error con el formato esperado
    throw error
  }
}
