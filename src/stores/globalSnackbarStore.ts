import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useGlobalSnackbarStore = defineStore('globalSnackbar', () => {
  // Cola de snackbars pendientes
  const snackbarQueue = ref<
  ({
    title: string
    message: {
      messageKey: string
      variables: Record<string, any>
    }
    color: 'success' | 'error' | 'info' | 'warning'
    timeout: number
    position: 'top' | 'bottom' | 'top end' | 'top start' | 'bottom end' | 'bottom start'
    closable?: boolean
    variant?: 'text' | 'tonal' | 'flat' | 'elevated' | 'outlined' | 'plain'
    rounded?: boolean | string
    elevation?: number
    progress?: number | null
    progressIndeterminate?: boolean
    action?: { label: string; callback: () => void }
  })[]
    >([])

  // Snackbar actual mostrada en la pantalla
  const currentSnackbar = ref<
  ({
    title: string
    message: {
      messageKey: string
      variables: Record<string, any>
    }
    color: 'success' | 'error' | 'info' | 'warning'
    timeout: number
    position: 'top' | 'bottom' | 'top end' | 'top start' | 'bottom end' | 'bottom start'
    closable?: boolean
    variant?: 'text' | 'tonal' | 'flat' | 'elevated' | 'outlined' | 'plain'
    rounded?: boolean | string
    elevation?: number
    progress?: number | null
    progressIndeterminate?: boolean
    action?: { label: string; callback: () => void }
  }
  | null)
    >(null)

  let timeoutId: ReturnType<typeof setTimeout> | null = null

  /**
   * Agrega un nuevo snackbar a la cola.
   */
  function showSnackbar(
    title: string,
    message: { messageKey: string; variables: Record<string, any> },
    color: 'success' | 'error' | 'info' | 'warning',
    options: {
      timeout?: number
      position?: 'top' | 'bottom' | 'top end' | 'top start' | 'bottom end' | 'bottom start'
      closable?: boolean
      variant?: 'text' | 'tonal' | 'flat' | 'elevated' | 'outlined' | 'plain'
      rounded?: boolean | string
      elevation?: number
      progress?: number | null
      progressIndeterminate?: boolean
      action?: { label: string; callback: () => void }
    } = {},
  ) {
    snackbarQueue.value.push({
      title,
      message,
      color,
      timeout: options.timeout ?? 7000,
      position: options.position ?? 'top end',
      closable: options.closable ?? false,
      variant: options.variant ?? 'elevated',
      rounded: options.rounded ?? 'lg',
      elevation: options.elevation ?? 4,
      progress: options.progress ?? null,
      progressIndeterminate: options.progressIndeterminate ?? false,
      action: options.action,
    })

    // Si no hay un snackbar actual, procesamos la cola
    if (!currentSnackbar.value)
      processQueue()
  }

  /**
   * Procesa la cola de snackbars y muestra el siguiente.
   */
  function processQueue() {
    if (snackbarQueue.value.length > 0) {
      const nextSnackbar = snackbarQueue.value.shift()
      if (nextSnackbar) {
        currentSnackbar.value = nextSnackbar

        timeoutId = setTimeout(() => {
          closeSnackbar()
        }, nextSnackbar.timeout)
      }
    }
  }

  /**
   * Cierra el snackbar actual y pasa al siguiente.
   */
  function closeSnackbar() {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    currentSnackbar.value = null
    processQueue()
  }

  /**
   * Actualiza el snackbar actual (progreso, mensaje, acción, etc.)
   */
  function updateSnackbar(partial) {
    if (currentSnackbar.value) {
      currentSnackbar.value = {
        ...currentSnackbar.value,
        ...partial,
      }
    }
  }

  return {
    // State
    snackbarQueue,
    currentSnackbar,

    // Actions
    showSnackbar,
    closeSnackbar,
    updateSnackbar,
  }
})
