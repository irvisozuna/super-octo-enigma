import type { User } from '../types/user'
import { ENDPOINTS } from '@/services/endpoints'
import { createCrudStore } from '@/stores/crudFactory'

export const useUserStore = createCrudStore<User>({
  id: 'users',
  baseEndpoint: ENDPOINTS.USERS || 'users',
  transformFetchListResponse(raw) {
    const data = raw?.data ?? []
    const total = raw?.pagination?.total ?? 0

    return { data, total }
  },
  transformFetchItemResponse(raw) {
    return raw?.data ?? raw
  },
})

const userStore = useUserStore()

userStore.listenToWebSocketEvents()
