<script setup lang="ts">
import debounce from 'lodash/debounce'
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

// Componentes internos
import ContractRegistryFilters from '../components/ContractRegistryFilters.vue'
import ContractRegistryTable from '../components/ContractRegistryTable.vue'
import ContractRegistryAdd from './ContractRegistryAdd.vue'
import ContractRegistryDelete from './ContractRegistryDelete.vue'
import ContractRegistryEdit from './ContractRegistryEdit.vue'
import ContractRegistryView from './ContractRegistryView.vue'
import { useAppManager } from '@/composables/useAppManager'
import GlobalMenu from '@/components/GlobalMenu.vue'
import type { newOptions } from '@/types/types'
import { useContractRegistryStore } from '@/modules/paymentmandate/stores/contractRegistryStore'

// Props para personalizar el título y descripción
const props = defineProps({
  title: {
    type: String,
    default: 'Contract Registry Management',
  },
  description: {
    type: String,
    default: 'Manage your payment contracts with ease.',
  },
})

const { t } = useI18n()
const moduleName = 'contractRegistry'

// Composable para manejar diálogos
const { openDialog, navigateTo } = useAppManager()

// Store
const contractRegistryStore = useContractRegistryStore()

// Headers para la tabla
const headers = [
  { title: t(`paymentmandate.${moduleName}.control_number`), key: 'controlNumber' },
  { title: t(`paymentmandate.${moduleName}.contract_number`), key: 'contractNumber' },
  { title: t(`paymentmandate.${moduleName}.name`), key: 'name' },
  { title: t(`paymentmandate.${moduleName}.card_number`), key: 'cardNumber' },
  { title: t(`paymentmandate.${moduleName}.max_amount`), key: 'maxAmount' },
  { title: t(`paymentmandate.${moduleName}.bank`), key: 'bank' },
  { title: t(`paymentmandate.${moduleName}.account_type`), key: 'accountType' },
  { title: t(`paymentmandate.${moduleName}.registration_date`), key: 'registrationDate' },
  { title: t('acciones'), key: 'actions', sortable: false },
]

// Opciones del menú de exportación
const menuOptions = [
  {
    text: `${t('export_to')} ${t('excel')}`,
    icon: 'tabler-file-spreadsheet',
    action: () => exportItems('excel'),
  },
  {
    text: `${t('export_to')} ${t('pdf')}`,
    icon: 'tabler-file-type-pdf',
    action: () => exportItems('pdf'),
  },
]

// Métodos
const debouncedFetchList = debounce(() => {
  contractRegistryStore.fetchList()
}, 500)

function applyFilters(newFilters: any) {
  Object.assign(contractRegistryStore.filters, newFilters)
  debouncedFetchList()
}

function onPageChange(newPage: number) {
  contractRegistryStore.page = newPage
  contractRegistryStore.fetchList()
}

function onItemsPerPageChange(newItemsPerPage: number) {
  contractRegistryStore.itemsPerPage = newItemsPerPage
  contractRegistryStore.fetchList()
}

function onItemsSortChange(newOptions: newOptions) {
  contractRegistryStore.sortBy = newOptions.sortBy.map(option => option.key)
  contractRegistryStore.sortDesc = newOptions.sortBy.map(option => option.order === 'desc')
  contractRegistryStore.fetchList()
}

function deleteSelected() {
  openDialog(ContractRegistryDelete, {}, { width: '900px', persistent: true }).then(result => {
    if (result === 'submit')
      contractRegistryStore.fetchList()
  })
}

function openAddDialog() {
  openDialog(ContractRegistryAdd, { }, { width: '900px', persistent: true }).then(result => {
    if (result === 'submit')
      contractRegistryStore.fetchList()
  })
}

function openEditDialog(item: any) {
  openDialog(ContractRegistryEdit, { item, title: 'Editar Contrato' }, { width: '800px', persistent: true }).then(result => {
    if (result === 'submit')
      contractRegistryStore.fetchList()
  })
}

function openViewDialog(item: any) {
  openDialog(ContractRegistryView, { contract: item, title: 'Ver Contrato' }, { width: '900px', persistent: true }).then(result => {
    if (result === 'submit')
      contractRegistryStore.fetchList()
  })
}

function openDeleteDialog(item: any) {
  openDialog(ContractRegistryDelete, { item, title: 'Eliminar Contrato' }, { width: '900px', persistent: true }).then(result => {
    if (result === 'submit')
      contractRegistryStore.fetchList()
  })
}

function exportItems(type: string) {
  contractRegistryStore.exportItems(type)
}

// onMounted
onMounted(() => {
  contractRegistryStore.fetchList()
})
</script>

<template>
  <VCard>
    <VCardTitle>
      <h4 class="text-h4 mb-1">
        {{ $t('paymentmandate.contractRegistry.title') }}
      </h4>
      <p class="text-body-1 mb-4">
        {{ $t('paymentmandate.contractRegistry.description') }}
      </p>
    </VCardTitle>

    <!-- Filtros reutilizables -->
    <ContractRegistryFilters
      :initial-filters="contractRegistryStore.filters"
      @update:filters="applyFilters"
    />

    <VCardText>
      <div class="d-flex align-center flex-wrap gap-4 justify-end">
        <!-- Campo de búsqueda -->
        <!--
          <VTextField
          v-model="contractRegistryStore.filters.search"
          :label="$t('contractRegistry.search_contracts')"
          variant="outlined"
          dense
          class="filter-field"
          @input="applyFilters"
          />
        -->

        <!-- Botón para exportar -->
        <!--
          <GlobalMenu
          :label="$t('export')"
          :options="menuOptions"
          color="secondary"
          variant="tonal"
          icon="tabler-chevron-down"
          />
        -->

        <!-- Botón para agregar contrato -->
        <VBtn
          prepend-icon="tabler-plus"
          color="primary"
          @click="openAddDialog"
        >
          {{ $t('paymentmandate.contractRegistry.add_contract') }}
        </VBtn>

        <!-- Botones para acciones con seleccionados -->
        <VBtn
          v-if="contractRegistryStore.selectedItems.length > 1"
          color="error"
          @click="deleteSelected"
        >
          {{ $t('paymentmandate.delete_selected') }}
        </VBtn>
      </div>
    </VCardText>

    <VDivider />

    <!-- Tabla de elementos -->
    <ContractRegistryTable
      :headers="headers"
      :items="contractRegistryStore.list"
      :total="contractRegistryStore.total"
      :page="contractRegistryStore.page"
      :items-per-page="contractRegistryStore.itemsPerPage"
      :loading="contractRegistryStore.isLoading"
      :selection="contractRegistryStore.selectedItems"
      module="contractRegistry"
      @update:selection="val => contractRegistryStore.selectedItems = val"
      @update:page="onPageChange"
      @update:items-per-page="onItemsPerPageChange"
      @view="openViewDialog"
      @edit="openEditDialog"
      @delete="openDeleteDialog"
      @update:items-update-option="onItemsSortChange"
    />
  </VCard>
</template>

<style scoped>
.buttons-container {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
}

.filter-field {
  flex: 1;
  max-inline-size: 300px;
}
</style>
