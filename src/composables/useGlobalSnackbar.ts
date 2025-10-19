import { computed } from 'vue'
import { useGlobalSnackbarStore } from '@/stores/globalSnackbarStore'

export function useGlobalSnackbar() {
  const snackbarStore = useGlobalSnackbarStore()

  // Acceso directo al snackbar actual
  const currentSnackbar = computed(() => snackbarStore.currentSnackbar)

  /**
   * Muestra un snackbar global
   * @param {object} params
   * @param {string} [params.title] - Título del snackbar
   * @param {string} [params.message] - Mensaje directo (legacy)
   * @param {string} [params.messageKey] - Clave de i18n o mensaje
   * @param {object} [params.variables] - Variables para i18n
   * @param {'success'|'error'|'info'|'warning'} [params.color] - Color del snackbar
   * @param {number} [params.timeout] - Tiempo de visibilidad
   * @param {string} [params.position] - Posición ('top', 'bottom', etc.)
   * @param {boolean} [params.closable] - Si es cerrable
   * @param {string} [params.variant] - Variante visual
   * @param {boolean|string} [params.rounded] - Bordes redondeados
   * @param {number} [params.elevation] - Elevación
   */
  function showSnackbar({
    title = '',
    message,
    messageKey,
    variables = {},
    color = 'info',
    timeout = 7000,
    position = 'top end',
    closable = false,
    variant = 'elevated',
    rounded = 'lg',
    elevation = 4,
  }: {
    title?: string
    message?: string
    messageKey?: string
    variables?: Record<string, any>
    color?: 'success' | 'error' | 'info' | 'warning'
    timeout?: number
    position?: 'top' | 'bottom' | 'top end' | 'top start' | 'bottom end' | 'bottom start'
    closable?: boolean
    variant?: 'text' | 'tonal' | 'flat' | 'elevated' | 'outlined' | 'plain'
    rounded?: boolean | string
    elevation?: number
  }) {
    // Support both legacy (message) and new (messageKey) formats
    const finalMessageKey = messageKey || message || ''

    snackbarStore.showSnackbar(
      title,
      { messageKey: finalMessageKey, variables },
      color,
      { timeout, position, closable, variant, rounded, elevation },
    )
  }

  /**
   * Cierra el snackbar actual
   */
  function closeSnackbar() {
    snackbarStore.closeSnackbar()
  }

  /**
   * Actualiza el snackbar actual (progreso, mensaje, acción, etc.)
   */
  function updateSnackbar(partial) {
    snackbarStore.updateSnackbar(partial)
  }

  return {
    showSnackbar,
    closeSnackbar,
    updateSnackbar,
    currentSnackbar,
  }
}
