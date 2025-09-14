// src/modules/paymentmandates/index.ts
export { default as PaymentmandateFilters } from './components/PaymentmandateFilters.vue'
export { default as PaymentmandateTable } from './components/PaymentmandateTable.vue'
export { default as PaymentmandateViewDialog } from './components/PaymentmandateViewDialog.vue'
export { usePaymentmandateHelpers } from './composables/usePaymentmandateHelpers'
export { usePaymentmandateStore } from './stores/paymentmandateStore'
export { default as PaymentmandateAdd } from './views/PaymentmandateAdd.vue'
export { default as PaymentmandateDelete } from './views/PaymentmandateDelete.vue'
export { default as PaymentmandateEdit } from './views/PaymentmandateEdit.vue'
export { default as PaymentmandateList } from './views/PaymentmandateList.vue'

// Contract Registry exports
export { default as ContractRegistryFilters } from './components/ContractRegistryFilters.vue'
export { default as ContractRegistryTable } from './components/ContractRegistryTable.vue'
export { useContractRegistryStore } from './stores/contractRegistryStore'
export { useContractDataDialogStore } from './stores/contractDataDialogStore'
export { default as ContractRegistryAdd } from './views/ContractRegistryAdd.vue'
export { default as ContractRegistryDelete } from './views/ContractRegistryDelete.vue'
export { default as ContractRegistryEdit } from './views/ContractRegistryEdit.vue'
export { default as ContractRegistryList } from './views/ContractRegistryList.vue'
export { default as ContractRegistryView } from './views/ContractRegistryView.vue'
export { default as ContractDataDialog } from './views/ContractDataDialog.vue'

// Types
export type { ContractRegistry, ContractRegistryCreateRequest, ContractRegistryUpdateRequest, ContractRegistryListResponse, ContractCatalogItem } from './types/contractRegistry'
