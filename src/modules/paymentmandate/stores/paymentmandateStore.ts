import dbConfig from '../indexedDbConfig'
import type { Paymentmandate } from '../types/paymentmandate'
import { ENDPOINTS } from '@/services/endpoints'
import { createCrudStore } from '@/stores/crudFactory'

// Define el store base
const basePaymentmandateStore = createCrudStore<Paymentmandate>({
  id: dbConfig.tableName,
  baseEndpoint: ENDPOINTS.PAYMENTMANDATES || 'paymentmandates',
  transformFetchListResponse(raw) {
    const data = raw?.data ?? []
    const total = raw?.pagination?.total ?? 0

    return { data, total }
  },
  transformFetchItemResponse(raw) {
    return raw?.data ?? raw
  },
})

// Extiende el tipo del store base para incluir métodos personalizados
type PaymentmandateStore = ReturnType<typeof basePaymentmandateStore> & {
  generateLot: (date: string) => Promise<any>
  processBankResponse: (formData: FormData) => Promise<any>
}

// Crea el store extendido con los métodos personalizados
export const usePaymentmandateStore = basePaymentmandateStore as unknown as () => PaymentmandateStore

const paymentmandateStore = usePaymentmandateStore()

// Método para generar lote
paymentmandateStore.generateLot = async function (date: string) {
  return await this.customAction('/generate_lot', 'POST', { date })
}

// Método para procesar respuesta del banco
paymentmandateStore.processBankResponse = async function (formData: FormData) {
  return await this.customAction('/process_bank_response', 'POST', formData)
}

paymentmandateStore.listenToWebSocketEvents()

export default paymentmandateStore
