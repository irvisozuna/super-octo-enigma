import { useI18n } from 'vue-i18n'

/**
 * Helper para traducir errores del backend a español
 */
export function useErrorTranslation() {
  const { t } = useI18n()

  /**
   * Traduce errores comunes del backend
   * @param errorMessage - Mensaje de error del backend
   * @param errorType - Tipo de error (tool, equipment, well, etc.)
   * @returns Mensaje traducido o el original si no hay traducción
   */
  const translateError = (errorMessage: string, errorType: 'tool' | 'equipment' | 'well' = 'tool'): string => {
    if (!errorMessage) return errorMessage

    const lowerMessage = errorMessage.toLowerCase()

    // Errores de serial number duplicado
    if (lowerMessage.includes('serial number') && lowerMessage.includes('already exists')) {
      const serialNumber = extractSerialNumber(errorMessage)
      return t(`DrillingReportsModule.${errorType}s.serial_number_exists`, { serialNumber })
    }

    // Errores de equipment code duplicado
    if (lowerMessage.includes('equipment code') && lowerMessage.includes('already exists')) {
      const equipmentCode = extractEquipmentCode(errorMessage)
      return t('DrillingReportsModule.equipment.equipment_code_exists', { equipmentCode })
    }

    // Errores de well name duplicado
    if (lowerMessage.includes('well name') && lowerMessage.includes('already exists')) {
      const wellName = extractWellName(errorMessage)
      return t('DrillingReportsModule.wells.name_exists', { wellName })
    }

    // Errores de well code duplicado
    if (lowerMessage.includes('well code') && lowerMessage.includes('already exists')) {
      const wellCode = extractWellCode(errorMessage)
      return t('DrillingReportsModule.wells.code_exists', { wellCode })
    }

    // Errores de validación
    if (lowerMessage.includes('validation failed')) {
      return t(`DrillingReportsModule.${errorType}s.validation_failed`)
    }

    // Errores de no encontrado
    if (lowerMessage.includes('not found')) {
      return t(`DrillingReportsModule.${errorType}s.${errorType}_not_found`)
    }

    // Errores de en uso
    if (lowerMessage.includes('in use') || lowerMessage.includes('currently in use')) {
      return t(`DrillingReportsModule.${errorType}s.${errorType}_in_use`)
    }

    // Si no hay traducción específica, devolver el mensaje original
    return errorMessage
  }

  /**
   * Extrae el número de serie del mensaje de error
   */
  const extractSerialNumber = (message: string): string => {
    const match = message.match(/serial number (\w+)/i)
    return match ? match[1] : ''
  }

  /**
   * Extrae el código de equipo del mensaje de error
   */
  const extractEquipmentCode = (message: string): string => {
    const match = message.match(/equipment code (\w+)/i)
    return match ? match[1] : ''
  }

  /**
   * Extrae el nombre del pozo del mensaje de error
   */
  const extractWellName = (message: string): string => {
    const match = message.match(/well name "([^"]+)"/i)
    return match ? match[1] : ''
  }

  /**
   * Extrae el código del pozo del mensaje de error
   */
  const extractWellCode = (message: string): string => {
    const match = message.match(/well code (\w+)/i)
    return match ? match[1] : ''
  }

  return {
    translateError,
  }
}
