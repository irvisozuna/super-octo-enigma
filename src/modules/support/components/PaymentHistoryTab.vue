<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import PaymentFolioPaymentsDialog from './PaymentFolioPaymentsDialog.vue'
import PaymentDetailsDialog from './PaymentDetailsDialog.vue'
import BaseTable from '@/components/BaseTable.vue'
import { useContractStore } from '@/modules/support/stores/contractStore'

const props = defineProps({
  activeTab: { type: Number, required: true },
})

const { t } = useI18n()
const contractStore = useContractStore()

// State
const contracts = ref<any[]>([])
const loading = ref(true)
const selectedContract = ref<any | null>(null)

const pagination = ref({
  limit: 10,
  offset: 0,
  count: 0,
  total: 0,
})

// For new structure
const showPaymentsDialog = ref(false)
const selectedFolioPayments = ref<any[]>([])
const selectedFolioTitle = ref('')

// For payment details (old and new)
const showDetailsDialog = ref(false)
const selectedDetails = ref<any[]>([])
const selectedDetailsTitle = ref('')

// Table headers
const mainHeaders = [
  { title: t('payment_folio'), value: 'payment_folio' },
  { title: t('cashbox_label'), value: 'cashbox_label' },
  { title: t('cashier_name'), value: 'cashier_name' },
  { title: t('user_name'), value: 'user_name' },
  { title: t('prepaid_payment'), value: 'prepaid_payment' },
  { title: t('other_payment_methods'), value: 'other_payment_methods' },
  { title: t('credit_applied'), value: 'credit_applied' },
  { title: t('credit_used'), value: 'credit_used' },
  { title: t('payment_date'), value: 'payment_date' },
  { title: t('payment_status'), value: 'payment_status' },
  { title: t('details'), value: 'details', sortable: false },
]

const oldHeaders = [
  { title: t('paymentId'), value: 'paymentId' },
  { title: t('billingPeriod'), value: 'billingPeriod' },
  { title: t('date'), value: 'DATE' },
  { title: t('consumo'), value: 'consumo' },
  { title: t('drenaje'), value: 'drenaje' },
  { title: t('saneamiento'), value: 'saneamiento' },
  { title: t('recargos'), value: 'recargos' },
  { title: t('bomberos'), value: 'bomberos' },
  { title: t('otros'), value: 'otros' },
  { title: t('total_concept'), value: 'total_concept' },
  { title: t('totalPaid'), value: 'totalPaid' },
  { title: t('payment_method'), value: 'payment_method' },
  { title: t('details'), value: 'details', sortable: false },
]

// Detect structure
const isNewStructure = (data: any[]): boolean => {
  return data.length > 0 && 'payment_folio' in data[0]
}

// Fetch data
async function fetchData() {
  loading.value = true
  try {
    const params = {
      limit: pagination.value.limit,
      page: pagination.value.page,
    }

    const response = await contractStore.getPaymentsByContract(contractStore.item?.id_account, params)

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

onMounted(fetchData)
watch(() => props.activeTab, newTab => {
  if (newTab === 2)
    fetchData()
})

// Main table actions
function openFolioPaymentsDialog(folio: any) {
  selectedFolioPayments.value = folio.payments
  selectedFolioTitle.value = `${t('payment_folio')}: ${folio.payment_folio}`
  showPaymentsDialog.value = true
}

function openPaymentDetailsDialog(details: any[], title = '') {
  // Group details by ref for dialog
  const groupedDetails = details.reduce((acc: any, detail: any) => {
    if (!acc[detail.ref])
      acc[detail.ref] = { ref: detail.ref, items: [], total: 0 }

    acc[detail.ref].items.push(detail)
    acc[detail.ref].total += detail.total_ttc

    return acc
  }, {})

  selectedDetails.value = Object.values(groupedDetails)
  selectedDetailsTitle.value = title
  showDetailsDialog.value = true
}

// Métodos para paginación
function handlePageChange(newPage: number) {
  pagination.value.page = newPage
  fetchData()
}

function handleItemsPerPageChange(newLimit: number) {
  pagination.value.limit = newLimit
  fetchData()
}
</script>

<template>
  <VCard class="pa-sm-10 pa-2">
    <VCardText>
      <!-- Nueva estructura -->
      <BaseTable
        v-if="!loading && isNewStructure(contracts)"
        :headers="mainHeaders"
        :items="contracts"
        :total="pagination.total"
        :page="pagination.offset / pagination.limit + 1"
        :items-per-page="pagination.limit"
        :loading="loading"
        @update:page="handlePageChange"
        @update:items-per-page="handleItemsPerPageChange"
      >
        <template #payment_date="{ item }">
          <div>{{ $formatDate(item.payment_date, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) || 'N/A' }}</div>
        </template>
        <template #details="{ item }">
          <VIcon
            v-if="item.payments && item.payments.length > 0"
            icon="tabler-eye"
            size="small"
            class="ms-2 cursor-pointer"
            @click="openFolioPaymentsDialog(item)"
          />
        </template>
        <template #prepaid_payment="{ item }">
          <div class="text-end">
            {{ $formatCurrency(item.prepaid_payment) || 'N/A' }}
          </div>
        </template>
        <template #other_payment_methods="{ item }">
          <div class="text-end">
            {{ $formatCurrency(item.other_payment_methods) || 'N/A' }}
          </div>
        </template>
        <template #credit_applied="{ item }">
          <div class="text-end">
            {{ $formatCurrency(item.credit_applied) || 'N/A' }}
          </div>
        </template>
        <template #credit_used="{ item }">
          <div class="text-end">
            {{ $formatCurrency(item.credit_used) || 'N/A' }}
          </div>
        </template>
        <template #payment_status="{ item }">
          <div class="text-end">
            {{ $t(item.payment_status) || '-' }}
          </div>
        </template>
      </BaseTable>

      <!-- Estructura antigua -->
      <BaseTable
        v-else-if="!loading && contracts.length > 0"
        v-model:selection="selectedContract"
        :headers="oldHeaders"
        :items="contracts"
        :total="pagination.total"
        :page="pagination.offset / pagination.limit + 1"
        :items-per-page="pagination.limit"
        :loading="loading"
        @update:page="handlePageChange"
        @update:items-per-page="handleItemsPerPageChange"
      >
        <template #consumo="{ item }">
          <div class="text-end">
            {{ $formatCurrency(item.consumo) || 'N/A' }}
          </div>
        </template>
        <template #DATE="{ item }">
          <div class="text">
            {{ $formatDate(item.DATE, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) || 'N/A' }}
          </div>
        </template>
        <template #drenaje="{ item }">
          <div class="text-end">
            {{ $formatCurrency(item.drenaje) || 'N/A' }}
          </div>
        </template>
        <template #saneamiento="{ item }">
          <div class="text-end">
            {{ $formatCurrency(item.saneamiento) || 'N/A' }}
          </div>
        </template>
        <template #recargos="{ item }">
          <div class="text-end">
            {{ $formatCurrency(item.recargos) || 'N/A' }}
          </div>
        </template>
        <template #bomberos="{ item }">
          <div class="text-end">
            {{ $formatCurrency(item.bomberos) || 'N/A' }}
          </div>
        </template>
        <template #totalPaid="{ item }">
          <div class="text-end">
            {{ $formatCurrency(item.totalPaid) || 'N/A' }}
          </div>
        </template>
        <template #total_concept="{ item }">
          <div class="text-end">
            {{ $formatCurrency(item.total_concept) || 'N/A' }}
          </div>
        </template>
        <template #otros="{ item }">
          <div class="text-end">
            {{ $formatCurrency(item.otros) || '0' }}
          </div>
        </template>
        <template #payment_method="{ item }">
          <div class="text">
            {{ item.payment_method || '-' }}
          </div>
        </template>
        <template #details="{ item }">
          <VIcon
            v-if="item.details && item.details.length > 0"
            icon="tabler-eye"
            size="small"
            class="ms-2 cursor-pointer"
            @click="openPaymentDetailsDialog(item.details, `${t('paymentId')}: ${item.paymentId}`)"
          />
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

      <template v-if="!loading && contracts.length > 0">
        <div class="text-center my-4">
          {{
            pagination.total === 0
              ? t('no_data')
              : `${pagination.offset + 1}-${Math.min(pagination.offset + pagination.limit, pagination.total)} de ${pagination.total}`
          }}
        </div>
      </template>
    </VCardText>

    <!-- Dialogo de pagos de folio (nueva estructura) -->
    <PaymentFolioPaymentsDialog
      v-if="showPaymentsDialog"
      :open="showPaymentsDialog"
      :payments="selectedFolioPayments"
      :title="selectedFolioTitle"
      @close="showPaymentsDialog = false"
      @show-details="openPaymentDetailsDialog"
    />

    <!-- Dialogo de detalles de pago (ambas estructuras) -->
    <PaymentDetailsDialog
      v-if="showDetailsDialog"
      :open="showDetailsDialog"
      :details="selectedDetails"
      :title="selectedDetailsTitle"
      @close="showDetailsDialog = false"
    />
  </VCard>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
