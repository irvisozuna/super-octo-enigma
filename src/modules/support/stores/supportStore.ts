import { ENDPOINTS } from '@/services/endpoints'
import { createCrudStore } from '@/stores/crudFactory'
import dbConfig from '../indexedDbConfig'
import type { Support } from '../types/support'

export const useSupportStore = createCrudStore<Support>({
  id: dbConfig.tableName,
  baseEndpoint: ENDPOINTS.SUPPORTS || 'supports',
  transformFetchListResponse(raw) {
    const data = raw?.data ?? []
    const total = raw?.pagination?.total ?? 0

    return { data, total }
  },
  transformFetchItemResponse(raw) {
    return raw?.data ?? raw
  },
})

const supportStore = useSupportStore()

supportStore.listenToWebSocketEvents()
