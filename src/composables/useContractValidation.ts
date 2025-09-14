import { ref } from 'vue'
import { ENDPOINTS } from '@/services/endpoints'
import { ApiService } from '@/services/apiService'

interface ContractValidationResponse {
  contract_number: number
  exists: boolean
  data: {
    id: number | null
    controlNumber: number | null
    contractNumber: number
    name: string
    cardNumber: string | null
    maxAmount: number | null
    expirationDate: string | null
    bank: string | null
    accountType: string | null
    registrationDate: string | null
    chargeFrequency: number | null
    phone: string | null
  } | null
  message: string
}

export function useContractValidation() {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Validar si un número de contrato existe
  async function validateContractNumber(contractNumber: number): Promise<{ 
    isValid: boolean; 
    message: string; 
    contractData?: any 
  }> {
    isLoading.value = true
    error.value = null

    try {
      console.log('Validating contract number:', contractNumber)
      const response = await ApiService.post<ContractValidationResponse>(
        ENDPOINTS.VALIDATE_CONTRACT_NUMBER,
        { contract_number: contractNumber },
      )

      console.log('Contract validation response:', response)

      // El API retorna directamente los datos, no con wrapper success/data
      if (response && response.exists) {
        return {
          isValid: true,
          message: response.message,
          contractData: response.data
        }
      } else {
        return {
          isValid: false,
          message: response?.message || 'Contrato no encontrado'
        }
      }
    }
    catch (err: any) {
      console.error('Error validating contract number:', err)
      
      // Manejar diferentes códigos de estado
      if (err.response?.status === 404) {
        return {
          isValid: false,
          message: 'Contrato no encontrado'
        }
      } else if (err.response?.status === 422) {
        return {
          isValid: false,
          message: 'Número de contrato inválido'
        }
      } else {
        error.value = err._data?.message || err.response?.data?.message || 'Error al validar el número de contrato'
        return {
          isValid: false,
          message: error.value as string
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
    validateContractNumber
  }
}
