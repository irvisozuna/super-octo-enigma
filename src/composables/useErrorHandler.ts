import { useI18n } from 'vue-i18n'
import { useGlobalSnackbar } from '@/composables/useGlobalSnackbar'

/**
 * COMPOSABLE GLOBAL REUTILIZABLE
 * Manejo consistente de errores en toda la aplicación
 * Incluye parsing de errores de API, notificaciones y logging
 */

export interface ErrorMessage {
  code: string
  message: string
  statusCode?: number
  details?: Record<string, any>
  field?: string
}

export interface ErrorHandlerOptions {
  showNotification?: boolean
  logToConsole?: boolean
  throwError?: boolean
  context?: string
}

export function useErrorHandler() {
  const { showSnackbar } = useGlobalSnackbar()
  const { t } = useI18n()

  // Wrapper para mantener compatibilidad
  const showToast = (options: { type: string; title: string; message: string; duration?: number }) => {
    showSnackbar({
      message: `${options.title}: ${options.message}`,
      color: options.type === 'error' ? 'error' : options.type === 'success' ? 'success' : 'info',
      timeout: options.duration || 5000,
    })
  }

  /**
   * Parsear error de respuesta API
   * Soporta múltiples formatos de error de diferentes backends
   */
  function parseApiError(error: any): ErrorMessage {
    const statusCode = error.response?.status
    const errorData = error.response?.data

    // Formato 1: { error: { code, message, details } }
    if (errorData?.error) {
      return {
        code: errorData.error.code || 'UNKNOWN_ERROR',
        message: errorData.error.message || errorData.error,
        statusCode,
        details: errorData.error.details || errorData.details,
      }
    }

    // Formato 2: { message, errors: { field: [messages] } }
    if (errorData?.errors && typeof errorData.errors === 'object') {
      const firstField = Object.keys(errorData.errors)[0]
      const firstError = errorData.errors[firstField]?.[0]

      return {
        code: 'VALIDATION_ERROR',
        message: firstError || errorData.message || 'Error de validación',
        statusCode,
        field: firstField,
        details: errorData.errors,
      }
    }

    // Formato 3: { message } simple
    if (errorData?.message) {
      return {
        code: 'API_ERROR',
        message: errorData.message,
        statusCode,
        details: errorData,
      }
    }

    // Códigos HTTP específicos
    const httpErrorMessages: Record<number, { code: string; message: string }> = {
      400: { code: 'BAD_REQUEST', message: t('errors.bad_request', 'Solicitud inválida') },
      401: { code: 'UNAUTHORIZED', message: t('errors.unauthorized', 'No autorizado') },
      403: { code: 'FORBIDDEN', message: t('errors.forbidden', 'Acceso prohibido') },
      404: { code: 'NOT_FOUND', message: t('errors.not_found', 'No encontrado') },
      409: { code: 'CONFLICT', message: t('errors.conflict', 'Conflicto con el estado actual') },
      422: { code: 'UNPROCESSABLE', message: t('errors.unprocessable', 'Datos no procesables') },
      429: { code: 'RATE_LIMIT', message: t('errors.rate_limit', 'Demasiadas solicitudes') },
      500: { code: 'SERVER_ERROR', message: t('errors.server_error', 'Error del servidor') },
      502: { code: 'BAD_GATEWAY', message: t('errors.bad_gateway', 'Error de conexión') },
      503: { code: 'SERVICE_UNAVAILABLE', message: t('errors.service_unavailable', 'Servicio no disponible') },
    }

    if (statusCode && httpErrorMessages[statusCode]) {
      return {
        ...httpErrorMessages[statusCode],
        statusCode,
      }
    }

    // Error de red o desconocido
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return {
        code: 'TIMEOUT',
        message: t('errors.timeout', 'Tiempo de espera agotado'),
        statusCode: 0,
      }
    }

    if (error.code === 'NETWORK_ERROR' || !error.response) {
      return {
        code: 'NETWORK_ERROR',
        message: t('errors.network', 'Error de conexión'),
        statusCode: 0,
      }
    }

    // Error genérico
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || t('errors.unknown', 'Error desconocido'),
      statusCode: statusCode || 0,
    }
  }

  /**
   * Manejar error con opciones configurables
   */
  function handleError(
    error: any,
    options: ErrorHandlerOptions = {},
  ): ErrorMessage {
    const {
      showNotification = true,
      logToConsole = true,
      throwError = false,
      context,
    } = options

    const errorMessage = parseApiError(error)

    // Logging condicional
    if (logToConsole) {
      console.error(`[ErrorHandler] ${context || 'Error'}:`, {
        code: errorMessage.code,
        message: errorMessage.message,
        statusCode: errorMessage.statusCode,
        details: errorMessage.details,
        originalError: error,
      })
    }

    // Notificación condicional
    if (showNotification) {
      const title = context || t('errors.operation_failed', 'Operación fallida')

      showToast({
        type: 'error',
        title,
        message: errorMessage.message,
        duration: errorMessage.statusCode === 429 ? 10000 : 5000, // Más tiempo para rate limit
      })
    }

    // Re-lanzar error si es necesario
    if (throwError)
      throw error

    return errorMessage
  }

  /**
   * Wrapper para ejecutar funciones con manejo de errores
   */
  async function withErrorHandling<T>(
    fn: () => Promise<T>,
    options: ErrorHandlerOptions = {},
  ): Promise<T | null> {
    try {
      return await fn()
    }
    catch (error) {
      handleError(error, options)

      if (options.throwError)
        throw error

      return null
    }
  }

  /**
   * Retry logic con exponential backoff
   */
  async function withRetry<T>(
    fn: () => Promise<T>,
    options: {
      maxAttempts?: number
      delayMs?: number
      backoff?: boolean
      onRetry?: (attempt: number, error: any) => void
    } = {},
  ): Promise<T> {
    const {
      maxAttempts = 3,
      delayMs = 1000,
      backoff = true,
      onRetry,
    } = options

    let lastError: any

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn()
      }
      catch (error) {
        lastError = error

        if (attempt === maxAttempts)
          throw error

        const delay = backoff ? delayMs * 2 ** (attempt - 1) : delayMs

        if (onRetry)
          onRetry(attempt, error)

        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError
  }

  /**
   * Verificar si es un error específico
   */
  function isErrorType(error: any, code: string): boolean {
    const parsed = parseApiError(error)

    return parsed.code === code
  }

  /**
   * Obtener mensaje de error user-friendly
   */
  function getUserMessage(error: any): string {
    const parsed = parseApiError(error)

    return parsed.message
  }

  return {
    parseApiError,
    handleError,
    withErrorHandling,
    withRetry,
    isErrorType,
    getUserMessage,
  }
}
