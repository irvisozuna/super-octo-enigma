import { useI18n } from 'vue-i18n'
import { useGlobalSnackbarStore } from '@/stores/globalSnackbarStore'

/**
 * Helper para notificaciones / snackbars.
 * Muestra distintos tipos de alerta (success, error, info, warning).
 */
export function useNotification() {
  const snackbarStore = useGlobalSnackbarStore()
  const { t } = useI18n()

  function showSuccess(
    messageKey: string,
    title = 'common.success',
    variables: Record<string, any> = {},
  ) {
    const translatedTitle = t(title)

    snackbarStore.showSnackbar(translatedTitle, { messageKey, variables }, 'success', {
      position: 'top end',
    })
  }

  function showError(
    messageKey: string,
    title = 'common.error',
    variables: Record<string, any> = {},
  ) {
    const translatedTitle = t(title)

    snackbarStore.showSnackbar(translatedTitle, { messageKey, variables }, 'error', {
      position: 'top end',
    })
  }

  function showInfo(
    messageKey: string,
    title = 'common.info',
    variables: Record<string, any> = {},
  ) {
    const translatedTitle = t(title)

    snackbarStore.showSnackbar(translatedTitle, { messageKey, variables }, 'info', {
      position: 'top end',
    })
  }

  function showWarning(
    messageKey: string,
    title = 'common.warning',
    variables: Record<string, any> = {},
  ) {
    const translatedTitle = t(title)

    snackbarStore.showSnackbar(translatedTitle, { messageKey, variables }, 'warning', {
      position: 'top end',
    })
  }

  return {
    showSuccess,
    showError,
    showInfo,
    showWarning,
  }
}

/**
 * Helper para notificaciones que funciona fuera del contexto de setup.
 * Usa el store directamente sin dependencias de Vue composables.
 */
export function useNotificationDirect() {
  const snackbarStore = useGlobalSnackbarStore()

  function showSuccess(
    messageKey: string,
    title = 'common.success',
    variables: Record<string, any> = {},
  ) {
    snackbarStore.showSnackbar(title, { messageKey, variables }, 'success', {
      position: 'top end',
    })
  }

  function showError(
    messageKey: string,
    title = 'common.error',
    variables: Record<string, any> = {},
  ) {
    snackbarStore.showSnackbar(title, { messageKey, variables }, 'error', {
      position: 'top end',
    })
  }

  function showInfo(
    messageKey: string,
    title = 'common.info',
    variables: Record<string, any> = {},
  ) {
    snackbarStore.showSnackbar(title, { messageKey, variables }, 'info', {
      position: 'top end',
    })
  }

  function showWarning(
    messageKey: string,
    title = 'common.warning',
    variables: Record<string, any> = {},
  ) {
    snackbarStore.showSnackbar(title, { messageKey, variables }, 'warning', {
      position: 'top end',
    })
  }

  return {
    showSuccess,
    showError,
    showInfo,
    showWarning,
  }
}
