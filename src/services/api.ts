/*********************************************************
 * rawApi.ts
 * 
 * Responsable de manejar requests HTTP con las mejores
 * prácticas para la serialización de parámetros, el manejo
 * de errores y la descarga de binarios.
 *********************************************************/

import { ApiOptions } from "@/types/types"



/**
 * Función principal para realizar peticiones HTTP.
 * 
 * @param url - Ruta parcial o completa al recurso.
 * @param options - Parámetros de configuración de la petición.
 * @returns Dependiendo de `responseType`: JSON, Blob, texto, etc.
 */
export async function rawApi(
  url: string,
  {
    method = 'GET',
    params = {},
    body,
    headers = {},
    responseType = 'json', // Por defecto queremos JSON
  }: ApiOptions = {}
) {
  // 1. Construcción de la URL final (base + endpoint)
  //    Reemplaza con tu lógica para obtener la URL base si no usas import.meta.env.
  let finalUrl = import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}${url}`
    : url

  // 2. Manejo de query params
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null) {
      query.append(key, String(val))
    }
  })
  if (query.toString()) {
    finalUrl += `?${query.toString()}`
  }

  // 3. Obtención del token de acceso (si lo hay) desde cookies
  //    Ajusta la función `useCookie` según tu librería preferida.
  const accessToken = useCookie('accessToken').value

  // 4. Opciones iniciales del fetch
  const fetchOptions: RequestInit = {
    method,
    headers: {
      Accept: 'application/json',
      ...headers, // merge con headers adicionales si los hay
    },
  }

  // 5. Si tenemos token, lo añadimos al header
  if (accessToken) {
    fetchOptions.headers = {
      ...fetchOptions.headers,
      Authorization: `Bearer ${accessToken}`,
    }
  }

  // 6. Manejo del body:
  //    - Si es un objeto normal, lo convertimos a JSON.
  //    - Si es FormData, Blob u otro tipo especial, lo dejamos pasar tal cual.
  if (body instanceof FormData) {
    // Cuando es FormData, eliminamos el Content-Type para que fetch lo maneje
    // y establezca correctamente boundary y multipart/form-data
    if (fetchOptions.headers && (fetchOptions.headers as Record<string, string>)['Content-Type']) {
      delete (fetchOptions.headers as Record<string, string>)['Content-Type']
    }
    fetchOptions.body = body
  } else if (body && typeof body === 'object' && !(body instanceof FormData)) {
    (fetchOptions.headers as Record<string, string>)['Content-Type'] = 'application/json'
    fetchOptions.body = JSON.stringify(body)
  } else {
    fetchOptions.body = body
  }

  try {
    // 7. Realizamos el fetch
    const response = await fetch(finalUrl, fetchOptions)

    // 8. Validamos si no fue exitoso => parseamos el mensaje de error si se puede
    if (!response.ok) {
      let errorBody: any = null

      try {
        // Intentamos leer la respuesta como JSON
        errorBody = await response.json()
      } catch (_) {
        // Si no es JSON, capturamos otro tipo de respuesta (p.ej. texto)
        try {
          errorBody = await response.text()
        } catch (__) {
          errorBody = null
        }
      }

      const error = new Error(
        errorBody?.message || `HTTP error! status: ${response.status}`
      ) as Error & {
        status?: number
        errors?: string[]
      }

      error.status = response.status
      // Por convención, muchos endpoints devuelven
      // un array de errors en la propiedad `errors`.
      error.errors = errorBody?.errors || []

      throw error
    }

    // 9. Si la respuesta es exitosa, retornamos en base a `responseType`
    switch (responseType) {
      case 'blob': {
        // Descarga de archivos binarios
        return await response.blob()
      }
      case 'text': {
        // Respuesta de texto plano
        return await response.text()
      }
      case 'json':
      default: {
        // Por defecto, parseamos JSON
        return await response.json()
      }
    }
  } catch (error) {
    // 10. Manejo global de errores (logs, analíticas, etc.)
    console.error(`[rawApi] Error en ${method} ${finalUrl}`, error)
    throw error
  }
}

