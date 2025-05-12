<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AgreementDetails from './AgreementDetails.vue'
import BaseTable from '@/components/BaseTable.vue' // Asegúrate de importar correctamente tu componente BaseTable
import { useAppManager } from '@/composables/useAppManager'
import { useContractStore } from '@/modules/support/stores/contractStore'

// Define types
interface Detail {
  rowid: number
  fk_agreements: number
  numpay: number
  fk_invoice: number | null
  payment_amount: number
  paid: number
  remaining_balance: number
  issue_date: string
  due_date: string
  payment_date: string | null
  tms: string
  created_at: string
  status: number
}

interface Pagination {
  limit: number
  offset: number
  count: number
  total: number
  page?: number
  search?: string
}

// Props para personalizar el título y descripción
const props = defineProps({
  activeTab: { type: Number, required: true },
})

const { t } = useI18n()
const { closeDialog } = useAppManager()
const contractStore = useContractStore()

const contracts = ref<any[]>([])
const loading = ref(true)
const selectedContract = ref<any>(null)
const searchQuery = ref('')

const pagination = ref<Pagination>({
  limit: 10,
  offset: 0,
  count: 0,
  total: 0,
})

// Encabezados de la tabla
const headers = [
  { title: t('folio'), value: 'ref' },

  // { title: t('type_agreement'), value: 'label' },
  { title: t('amount'), value: 'payment_amount' },
  { title: t('advance'), value: 'agreed_balance' },
  { title: t('user_created'), value: 'user' },
  { title: t('date_creation'), value: 'date_creation' },
  { title: t('advance_amount'), value: 'advance_amount' },
  { title: t('number_payments'), value: 'number_payments' },
  { title: t('pay_frecuency'), value: 'pay_frecuency' },
  { title: t('previous_balance'), value: 'previous_balance' },
  { title: t('fk_advance_type'), value: 'type' },
  { title: t('details'), value: 'details', sortable: false },
]

const showDetailsDialog = ref(false)
const selectedDetails = ref<Detail[]>([])

// Computed properties for summary
const summary = computed(() => {
  if (!selectedDetails.value.length) {
    return {
      total: 0,
      paid: 0,
      overdue: 0,
      pending: 0,
    }
  }

  const today = new Date()

  return {
    total: selectedDetails.value.length,
    paid: selectedDetails.value.filter((detail: Detail) => detail.status === 4).length,
    overdue: selectedDetails.value.filter((detail: Detail) => {
      const dueDate = new Date(detail.due_date)

      return detail.status !== 4 && dueDate < today
    }).length,
    pending: selectedDetails.value.filter((detail: Detail) => {
      const dueDate = new Date(detail.due_date)

      return detail.status !== 4 && dueDate >= today
    }).length,
  }
})

// Función para actualizar la página
function updatePage(newPage: number) {
  pagination.value.page = newPage
  fetchData()
}

// Función para actualizar los elementos por página
function updateItemsPerPage(newItemsPerPage: number) {
  pagination.value.limit = newItemsPerPage
  fetchData()
}

// Función para manejar la entrada de búsqueda
function onSearchInput() {
  pagination.value.offset = 0
  pagination.value.search = searchQuery.value
  fetchData()
}

// Función para cargar los datos
async function fetchData() {
  loading.value = true
  try {
    if (!contractStore.item?.id_account)
      return

    const response = await contractStore.getAgreementsByContract(
      String(contractStore.item.id_account),
      pagination.value,
    )

    contracts.value = replaceNullWithEmptyString(response.data)
    pagination.value = response.pagination
  }
  catch (error) {
    console.error('Error al cargar los Pagos:', error)
  }
  finally {
    loading.value = false
  }
}

// Función para reemplazar valores null por una cadena vacía
function replaceNullWithEmptyString(data: any[]) {
  return data.map(item => {
    const newItem = { ...item }
    for (const key in newItem) {
      if (newItem[key] === null)
        newItem[key] = ''
    }

    return newItem
  })
}

// Montar datos al iniciar el componente
onMounted(fetchData)

// Escuchar cambios en el tab activo y recargar datos
watch(() => props.activeTab, newTab => {
  if (newTab === 5) { // Suponiendo que el tab de BillingHistory es el índice 1
    fetchData()
  }
})

function showAgreementDetails(details: Detail[]) {
  selectedDetails.value = details
  showDetailsDialog.value = true
}

function isOverdue(detail: Detail): boolean {
  const today = new Date()
  const dueDate = new Date(detail.due_date)

  return detail.status !== 4 && dueDate < today
}

function getStatusColor(detail: Detail): string {
  if (detail.status === 4)
    return 'success'
  if (isOverdue(detail))
    return 'error'

  return 'warning'
}

function getStatusText(detail: Detail): string {
  if (detail.status === 4)
    return t('paid')
  if (isOverdue(detail))
    return t('overdue')

  return t('pending')
}
</script>

<template>
  <VCard class="pa-sm-10 pa-2">
    <VCardText>
      <!-- Tabla de contratos -->
      <BaseTable
        v-if="!loading"
        v-model:selection="selectedContract"
        :headers="headers"
        :items="contracts"
        :total="pagination.total"
        :page="pagination.offset / pagination.limit + 1"
        :items-per-page="pagination.limit"
        :loading="loading"
        @update:page="updatePage"
        @update:items-per-page="updateItemsPerPage"
      >
        <template #payment_amount="{ item }">
          {{ $formatCurrency(item?.payment_amount) || '0' }}
        </template>
        <template #agreed_balance="{ item }">
          {{ $formatCurrency(item?.agreed_balance) || '0' }}
        </template>
        <template #advance_amount="{ item }">
          {{ $formatCurrency(item?.advance_amount) || '0' }}
        </template>
        <template #previous_balance="{ item }">
          {{ $formatCurrency(item?.previous_balance) || '0' }}
        </template>
        <template #date_creation="{ item }">
          {{ $formatDate(item.date_creation) || '0' }}
        </template>
        <template #details="{ item }">
          <VIcon
            v-if="item.details && item.details.length > 0"
            icon="tabler-eye"
            size="small"
            class="ms-2 cursor-pointer"
            @click="showAgreementDetails(item.details)"
          />
          <span v-if="item.details && item.details.length === 0">
            {{ t('imported') }}
          </span>
        </template>
      </BaseTable>

      <!-- Estado de carga -->
      <div
        v-if="loading"
        class="text-center py-6"
      >
        <VProgressCircular
          indeterminate
          color="primary"
        />
        <p class="mt-2">
          {{ t('loading') }}...
        </p>
      </div>
    </VCardText>

    <!-- Modal de detalles del acuerdo -->
    <AgreementDetails
      v-model="showDetailsDialog"
      :details="selectedDetails"
    />
  </VCard>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.text-success {
  color: rgb(var(--v-theme-success));
}

.text-error {
  color: rgb(var(--v-theme-error));
}

.text-warning {
  color: rgb(var(--v-theme-warning));
}
</style>
