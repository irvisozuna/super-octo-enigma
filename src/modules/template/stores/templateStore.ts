import { ENDPOINTS } from '@/services/endpoints';
import { createCrudStore } from '@/stores/crudFactory';
import  dbConfig  from '../indexedDbConfig';
import { Template } from '../types/template';

export const useTemplateStore = createCrudStore<Template>({
  id: dbConfig.tableName,
  baseEndpoint: ENDPOINTS.TEMPLATES || 'templates',
  transformFetchListResponse(raw) {
    const data = raw?.data ?? [];
    const total = raw?.pagination?.total ?? 0;
    return { data, total };
  },
  transformFetchItemResponse(raw) {
    return raw?.data ?? raw;
  },
});

const templateStore = useTemplateStore();
templateStore.listenToWebSocketEvents(); 
