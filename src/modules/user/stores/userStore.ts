import { ENDPOINTS } from '@/services/endpoints';
import { createCrudStore } from '@/stores/crudFactory';
import { User } from '../types/user';

export const useUserStore = createCrudStore<User>({
  id: 'user',
  baseEndpoint: ENDPOINTS.USERS || 'users',
  transformFetchListResponse(raw) {
    console.log(raw.data)
    const data = raw?.data ?? [];
    const total = raw?.pagination?.total ?? 0;
    return { data, total };
  },
  transformFetchItemResponse(raw) {
    return raw?.data ?? raw;
  },
});
