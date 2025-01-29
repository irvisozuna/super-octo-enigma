import { createCrudStore } from '@/stores/crudFactory';
import dbConfig from '../indexedDbConfig';
import type { Account } from '../types/Contract';

// Define el store base
const baseContractStore = createCrudStore<Account>({
  id: dbConfig.tableName,
  baseEndpoint: '/supports',
  transformFetchListResponse(raw) {
    const data = raw?.data ?? [];
    const total = raw?.pagination?.total ?? 0;
    return { data, total };
  },
  transformFetchItemResponse(raw) {
    return raw?.data ?? raw;
  },
});

// Extiende el tipo del store base para incluir métodos personalizados
type ContractStore = ReturnType<typeof baseContractStore> & {
  getContracts: (filters?: Record<string, any>) => Promise<any>;
  getContract: (id: string) => Promise<any>;
  getBillingsByContract: (id: string, filters?: Record<string, any>) => Promise<any>;
  getPaymentsByContract: (id: string, filters?: Record<string, any>) => Promise<any>;
  getReadingsByContract: (id: string, filters?: Record<string, any>) => Promise<any>;
  getWorkOrdersByContract: (id: string, filters?: Record<string, any>) => Promise<any>;
  getAgreementsByContract: (id: string, filters?: Record<string, any>) => Promise<any>;
  getAdjustmentsByContract: (id: string, filters?: Record<string, any>) => Promise<any>;
  getPdFBalance: (account: string) => Promise<any>;
  performContractAction: (
    endpoint: string,
    id: string,
    filters?: Record<string, any>
  ) => Promise<any>;
};

// Crea el store extendido con los métodos personalizados
export const useContractStore = baseContractStore as unknown as () => ContractStore;

// Implementa los métodos personalizados
const contractStore = useContractStore();

// Método genérico para realizar acciones relacionadas con contratos
contractStore.performContractAction = async function (
  endpoint: string,
  id: string,
  filters = {}
) {
  return await this.customAction(`${endpoint}/${id}`, 'GET', filters);
};

// Métodos personalizados utilizando `performContractAction`
contractStore.getContracts = async function (filters = {}) {
  return await this.customAction('/getContracts', 'GET', filters);
};

contractStore.getContract = async function (id: string) {
  const response = await this.customAction(`/getContract/${id}`, 'GET');
  this.item = response; // Almacena el contrato en el estado del store
  return response;
};

contractStore.getBillingsByContract = async function (id: string, filters = {}) {
  return await this.performContractAction('/getBillingsByContract', id, filters);
};

contractStore.getPaymentsByContract = async function (id: string, filters = {}) {
  return await this.performContractAction('/getPaymentsByContract', id, filters);
};

contractStore.getReadingsByContract = async function (id: string, filters = {}) {
  return await this.performContractAction('/getReadingsByContract', id, filters);
};

contractStore.getWorkOrdersByContract = async function (id: string, filters = {}) {
  return await this.performContractAction('/getWorkOrdersByContract', id, filters);
};

contractStore.getAgreementsByContract = async function (id: string, filters = {}) {
  return await this.performContractAction('/getAgreementsByContract', id, filters);
};

contractStore.getAdjustmentsByContract = async function (id: string, filters = {}) {
  return await this.performContractAction('/getAdjustmentsByContract', id, filters);
};

contractStore.getPdFBalance = async function (account: string) {
  return await this.performContractAction('/getPdFBalance', account);
}

// Escucha de eventos en WebSocket
contractStore.listenToWebSocketEvents();

export default contractStore;
