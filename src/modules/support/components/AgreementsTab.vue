<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseTable from '@/components/BaseTable.vue' // Asegúrate de importar correctamente tu componente BaseTable
import { useAppManager } from '@/composables/useAppManager'
import { useContractStore } from '@/modules/support/stores/contractStore'

// Props para personalizar el título y descripción
const props = defineProps({
  activeTab: { type: Number, required: true },
})

const { t } = useI18n()
const { closeDialog } = useAppManager()
const contractStore = useContractStore()

const contracts = ref([]) // Inicialmente sin datos
const loading = ref(true) // Estado de carga activado al inicio
const selectedContract = ref(null)
const searchQuery = ref('')

const pagination = ref({
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
const selectedDetails = ref([])

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
    const response = await contractStore.getAgreementsByContract(contractStore.item.id_account, pagination.value)

    contracts.value = replaceNullWithEmptyString(response.data) // Reemplazar null por ''
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

function showAgreementDetails(details: any[]) {
  selectedDetails.value = details
  showDetailsDialog.value = true
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
          {{ $formatCurrency(item.payment_amount) || '0' }}
        </template>
        <template #agreed_balance="{ item }">
          {{ $formatCurrency(item.agreed_balance) || '0' }}
        </template>
        <template #advance_amount="{ item }">
          {{ $formatCurrency(item.advance_amount) || '0' }}
        </template>
        <template #previous_balance="{ item }">
          {{ $formatCurrency(item.previous_balance) || '0' }}
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
    <VDialog
      v-model="showDetailsDialog"
      max-width="800"
    >
      <VCard>
        <VCardTitle>{{ t('agreement_details') }}</VCardTitle>
        <VCardText>
          <VTable>
            <thead>
              <tr>
                <th>{{ t('payment_number') }}</th>
                <th>{{ t('payment_amount') }}</th>
                <th>{{ t('paid_amount') }}</th>
                <th>{{ t('remaining_balance') }}</th>
                <th>{{ t('issue_date') }}</th>
                <th>{{ t('due_date') }}</th>
                <th>{{ t('payment_date') }}</th>
                <th>{{ t('status') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="detail in selectedDetails"
                :key="detail.rowid"
              >
                <td>{{ detail.numpay }}</td>
                <td>{{ $formatCurrency(detail.payment_amount) }}</td>
                <td>{{ $formatCurrency(detail.paid) }}</td>
                <td>{{ $formatCurrency(detail.remaining_balance) }}</td>
                <td>{{ $formatDate(detail.issue_date) }}</td>
                <td>{{ $formatDate(detail.due_date) }}</td>
                <td v-if="detail.payment_date">
                  {{ $formatDate(detail.payment_date) }}
                </td>
                <td v-if="!detail.payment_date" />
                <td>
                  <VChip
                    :color="detail.status === 4 ? 'success' : 'warning'"
                    size="small"
                  >
                    {{ detail.status === 4 ? t('paid') : t('pending') }}
                  </VChip>
                </td>
              </tr>
            </tbody>
          </VTable>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn
            color="primary"
            @click="showDetailsDialog = false"
          >
            {{ t('close') }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </VCard>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
