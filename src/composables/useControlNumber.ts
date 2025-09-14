import { ref } from 'vue'
import { ENDPOINTS } from '@/services/endpoints'
import { ApiService } from '@/services/apiService'

interface LastControlNumberResponse {
  last_control_number: number
  next_available_number: number
  is_available: boolean
  message: string
}

interface ValidateControlNumberResponse {
  control_number: number
  is_available: boolean
  message: string
}

export function useControlNumber() {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Obtener el siguiente número de control disponible
  async function getNextControlNumber(): Promise<number | null> {
    isLoading.value = true
    error.value = null

    try {
      console.log('Making request to:', ENDPOINTS.LAST_CONTROL_NUMBER)

      const response = await ApiService.get(ENDPOINTS.LAST_CONTROL_NUMBER)

      console.log('Response received:', response)

      // El API retorna directamente los datos, no con wrapper success/data
      if (response && response.is_available) {
        console.log('Returning next available number:', response.next_available_number)

        return response.next_available_number
      }
      else {
        error.value = response?.message || 'No se pudo obtener el siguiente número de control'
        console.log('Response not available:', response)

        return null
      }
    }
    catch (err: any) {
      console.error('Error getting next control number:', err)
      error.value = err.response?.data?.message || 'Error al obtener el siguiente número de control'

      return null
    }
    finally {
      isLoading.value = false
    }
  }

  // Validar si un número de control está disponible
  async function validateControlNumber(controlNumber: number): Promise<{ isValid: boolean; message: string }> {
    isLoading.value = true
    error.value = null

    try {
      const response = await ApiService.post(
        ENDPOINTS.VALIDATE_CONTROL_NUMBER,
        { control_number: controlNumber },
      )

      // El API retorna directamente los datos, no con wrapper success/data
      return {
        isValid: response && response.is_available,
        message: response?.message || 'Número de control no disponible',
      }
    }
    catch (err: any) {
      console.error('Error validating control number:', err)

      // Manejar diferentes códigos de estado
      if (err.response?.status === 409) {
        return {
          isValid: false,
          message: 'Número de control ya está en uso',
        }
      }
      else if (err.response?.status === 422) {
        return {
          isValid: false,
          message: 'Número de control inválido',
        }
      }
      else {
        error.value = err._data.message || err.response?.data?.message || 'Error al validar el número de control'

        return {
          isValid: false,
          message: error.value as string,
        }
      }
    }
    finally {
      isLoading.value = false
    }
  }

  return {
    isLoading,
    error,
    getNextControlNumber,
    validateControlNumber,
  }
}
