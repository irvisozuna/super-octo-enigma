import { createCrudStore } from '@/stores/crudFactory'
import type { Contract } from '../types/Contract'
import dbConfig from '../indexedDbConfig'
import { ENDPOINTS } from '@/services/endpoints'

export const useContractsStore = createCrudStore<Contract>({
  id: dbConfig.tableName,
  baseEndpoint: ENDPOINTS.CONTRACTS || 'contracts',
  transformFetchListResponse(raw) {
    const data = raw?.data ?? []
    const total = raw?.meta?.total ?? 0

    return { data, total }
  },
  transformFetchItemResponse(raw) {
    return raw?.data ?? raw
  },
})

const contractsStore = useContractsStore()

export default contractsStore
