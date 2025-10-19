import { useI18n } from 'vue-i18n'
import { useReportWizardStore } from '../stores/reportWizardStore'

export const useReportWizardErrorHandler = () => {
  const { t } = useI18n()
  const wizardStore = useReportWizardStore()

  const handleError = (error: any) => {
    if (!error)
      return

    console.log('🔴 Handling wizard error:', error)

    try {
      const errorObj = typeof error === 'string' ? JSON.parse(error) : error

      // Handle Laravel validation errors
      if (errorObj.errors) {
        const validationErrors: Record<string, string[]> = {}

        Object.entries(errorObj.errors).forEach(([field, messages]: [string, any]) => {
          // Clean up field name for better UX
          const cleanField = field.replace(/_/g, ' ').replace(/\.\d+\./g, ' > ')

          validationErrors[cleanField] = messages as string[]
        })

        wizardStore.setError(
          t('errors.validation_failed', 'Errores de validación'),
          errorObj.message || t('errors.please_correct', 'Por favor corrige los siguientes errores:'),
          validationErrors,
        )

        return 'validation'
      }

      // Handle structured error with error code
      if (errorObj.error) {
        const errorCode = errorObj.error.code

        const translatedMessage = t(`errors.${errorCode}`, '', {
          missingWarn: false,
          fallbackWarn: false,
        })

        if (translatedMessage && translatedMessage !== '' && translatedMessage !== `errors.${errorCode}`) {
          wizardStore.setError(
            t('common.error', 'Error'),
            translatedMessage,
          )
        }
        else {
          wizardStore.setError(
            errorCode || t('common.error', 'Error'),
            errorObj.error.message || error,
          )
        }

        return 'structured'
      }

      // Handle simple error message
      wizardStore.setError(
        t('common.error', 'Error'),
        errorObj.message || (typeof errorObj === 'string' ? errorObj : JSON.stringify(errorObj)),
      )

      return 'simple'
    }
    catch (e) {
      console.error('💥 Error parsing error message:', e)
      wizardStore.setError(
        t('common.error', 'Error'),
        typeof error === 'string' ? error : t('errors.unknown', 'Error desconocido'),
      )

      return 'parse_error'
    }
  }

  const clearError = () => {
    wizardStore.clearError()
  }

  const setCustomError = (title: string, message: string) => {
    wizardStore.setError(title, message)
  }

  return {
    handleError,
    clearError,
    setCustomError,
  }
}
