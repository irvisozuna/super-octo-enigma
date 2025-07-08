import dbConfig from '../indexedDbConfig'
import type { Template } from '../types/template'
import { ENDPOINTS } from '@/services/endpoints'
import { createCrudStore } from '@/stores/crudFactory'

export const useTemplateStore = createCrudStore<Template>({
  id: dbConfig.tableName,
  baseEndpoint: ENDPOINTS.TEMPLATES || 'templates',
  transformFetchListResponse(raw) {
    const data = raw?.data ?? []
    const total = raw?.pagination?.total ?? 0

    return { data, total }
  },
  transformFetchItemResponse(raw) {
    return raw?.data ?? raw
  },
})

const templateStore = useTemplateStore()

templateStore.listenToWebSocketEvents()
