// src/modules/users/stores/userStore.ts
import { ENDPOINTS } from '@/services/endpoints';
import { createCrudStore } from '@/stores/crudFactory';
import { User } from '../types/user';

export const useUserStore = createCrudStore<User>({
  id: 'user',
  baseEndpoint: ENDPOINTS.USERS || 'users',
  transformFetchListResponse(raw) {
    const data = raw?.data?.data ?? [];
    const total = raw?.data?.meta?.total ?? 0;
    return { data, total };
  },
  transformFetchItemResponse(raw) {
    return raw?.data ?? raw;
  },
});
