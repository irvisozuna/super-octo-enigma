import type { ContractCatalogItem, ContractRegistry, ContractRegistryListResponse } from '../types/contractRegistry'
import { ENDPOINTS } from '@/services/endpoints'
import { createCrudStore } from '@/stores/crudFactory'

// Define el store base
const baseContractRegistryStore = createCrudStore<ContractRegistry>({
  id: 'contractRegistry',
  baseEndpoint: ENDPOINTS.CONTRACT_REGISTRY || 'payment_mandates/contract-registry',
  transformFetchListResponse(raw: ContractRegistryListResponse) {
    const data = raw?.data ?? []
    const total = raw?.pagination?.total ?? 0

    return { data, total }
  },
  transformFetchItemResponse(raw) {
    return raw?.data ?? raw
  },
})

// Extiende el tipo del store base para incluir métodos personalizados
type ContractRegistryStore = ReturnType<typeof baseContractRegistryStore> & {
  getContractsCatalog: (search?: string) => Promise<ContractCatalogItem[]>
}

// Crea el store extendido con los métodos personalizados
export const useContractRegistryStore = baseContractRegistryStore as unknown as () => ContractRegistryStore

const contractRegistryStore = useContractRegistryStore()

// Método para obtener catálogo de contratos
contractRegistryStore.getContractsCatalog = async function (search?: string) {
  const params = search ? { search } : {}
  const response = await this.customAction('/contracts-catalog', 'GET', null, params)

  return response?.data ?? []
}

contractRegistryStore.listenToWebSocketEvents()

export default contractRegistryStore
