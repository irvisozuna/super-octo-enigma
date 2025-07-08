<script setup lang="ts">
import debounce from 'lodash/debounce'
import { useI18n } from 'vue-i18n'

// Componentes internos
import PaymentmandateTable from '../components/PaymentmandateTable.vue'
import PaymentmandateAdd from './PaymentmandateAdd.vue'
import PaymentmandateDelete from './PaymentmandateDelete.vue'
import PaymentmandateEdit from './PaymentmandateEdit.vue'
import PaymentmandateView from './PaymentmandateView.vue'
import type { newOptions } from '@/types/types'
import { usePaymentmandateStore } from '@/modules/paymentmandate/stores/paymentmandateStore'

// Props para personalizar el título y descripción
const props = defineProps({
  title: {
    type: String,
    default: 'Paymentmandate Management',
  },
  description: {
    type: String,
    default: 'Manage your paymentmandate with ease.',
  },
})

const { t } = useI18n()
const moduleName = 'paymentmandate'

// Composable para manejar diálogos
const { openDialog, navigateTo } = useAppManager()

// Store
const paymentmandateStore = usePaymentmandateStore()

// Headers para la tabla
const headers = [
  { title: t(`${moduleName}.consecutive_number`), key: 'consecutive_number' },
  { title: t(`${moduleName}.status`), key: 'status' },
  { title: t(`${moduleName}.file_path`), key: 'file_path' },
  { title: t(`${moduleName}.actions`), key: 'actions', sortable: false },
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
  paymentmandateStore.fetchList()
}, 500)

function applyFilters(newFilters: any) {
  Object.assign(paymentmandateStore.filters, newFilters)
  debouncedFetchList()
}

function onPageChange(newPage: number) {
  paymentmandateStore.page = newPage
  paymentmandateStore.fetchList()
}

function onItemsPerPageChange(newItemsPerPage: number) {
  paymentmandateStore.itemsPerPage = newItemsPerPage
  paymentmandateStore.fetchList()
}

function onItemsSortChange(newOptions: newOptions) {
  templateStore.sortBy = newOptions.sortBy.map(option => option.key)
  templateStore.sortDesc = newOptions.sortBy.map(option => option.order === 'desc')
  templateStore.fetchList()
}

function deleteSelected() {
  openDialog(PaymentmandateDelete, {}, { width: '900px', persistent: true }).then(result => {
    if (result === 'submit')
      paymentmandateStore.fetchList()
  })
}

function openAddDialog() {
  openDialog(PaymentmandateAdd, { }, { width: '900px', persistent: true }).then(result => {
    if (result === 'submit')
      paymentmandateStore.fetchList()
  })
}

function openEditDialog(item: any) {
  openDialog(PaymentmandateEdit, { item, title: 'Edit Paymentmandate' }, { width: '800px', persistent: true }).then(result => {
    if (result === 'submit')
      paymentmandateStore.fetchList()
  })
}

function openViewDialog(item: any) {
  openDialog(PaymentmandateView, { mandate: item, title: 'View Paymentmandate' }, { width: '900px', persistent: true }).then(result => {
    if (result === 'submit')
      paymentmandateStore.fetchList()
  })
}

function openDeleteDialog(item: any) {
  openDialog(PaymentmandateDelete, { item, title: 'Delete Paymentmandate' }, { width: '900px', persistent: true }).then(result => {
    if (result === 'submit')
      paymentmandateStore.fetchList()
  })
}
function exportItems(type: string) {
  paymentmandateStore.exportItems(type)
}

// onMounted
onMounted(() => {
  paymentmandateStore.fetchList()
})
</script>

<template>
  <VCard>
    <VCardTitle>
      <h4 class="text-h4 mb-1">
        {{ $t('paymentmandate.title') }}
      </h4>
      <p class="text-body-1 mb-4">
        {{ $t('paymentmandate.description') }}
      </p>
    </VCardTitle>

    <!-- Filtros reutilizables -->
    <!--
      <PaymentmandateFilters
      :initial-filters="paymentmandateStore.filters"
      @update:filters="applyFilters"
      />
    -->

    <VCardText>
      <div class="d-flex align-center flex-wrap gap-4 justify-end">
        <!-- Campo de búsqueda -->
        <VTextField
          v-model="paymentmandateStore.filters.search"
          :label="$t('paymentmandate.search_paymentmandate')"
          variant="outlined"
          dense
          class="filter-field"
          @input="applyFilters"
        />

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

        <!-- Botón para agregar usuario -->
        <VBtn
          prepend-icon="tabler-plus"
          color="primary"
          @click="openAddDialog"
        >
          {{ $t('paymentmandate.add paymentmandate') }}
        </VBtn>

        <!-- Botones para acciones con seleccionados -->
        <!--
          <VBtn
          v-if="paymentmandateStore.selectedItems.length > 1"
          color="error"
          @click="deleteSelected"
          >
          {{ $t('delete selected') }}
          </VBtn>
        -->
      </div>
    </VCardText>

    <VDivider />

    <!-- Tabla de elementos -->
    <PaymentmandateTable
      :headers="headers"
      :items="paymentmandateStore.list"
      :total="paymentmandateStore.total"
      :page="paymentmandateStore.page"
      :items-per-page="paymentmandateStore.itemsPerPage"
      :loading="paymentmandateStore.isLoading"
      :selection="paymentmandateStore.selectedItems"
      module="paymentmandate"
      @update:selection="val => paymentmandateStore.selectedItems = val"
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
