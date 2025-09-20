<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import debounce from 'lodash/debounce'
import { useI18n } from 'vue-i18n'
import { useFineStore } from '../stores/fineStore'
import { useAppManager } from '@/composables/useAppManager'
import type { FineStatus, SubjectType } from '../../types/fine'

// Composable para manejar diálogos
const { navigateTo } = useAppManager()
const { t } = useI18n()

// Store
const fineStore = useFineStore()

// Estado para filtros avanzados
const showAdvancedFilters = ref(false)
const dateFrom = ref('')
const dateTo = ref('')
const amountMin = ref('')
const amountMax = ref('')
const selectedStatus = ref<FineStatus | ''>('')
const selectedSubjectType = ref<SubjectType | ''>('')
const selectedConcessionId = ref('')
const selectedConcessionHolderId = ref('')
const selectedViolationTypeId = ref('')
const selectedCreatedBy = ref('')
const selectedPaymentStatus = ref('')

// Headers para la tabla
const headers = [
  { title: t('TransportModule.fine.fields.fine_number'), key: 'id', sortable: true },
  { title: t('TransportModule.fine.fields.status'), key: 'status', sortable: true },
  { title: t('TransportModule.fine.fields.amount'), key: 'total_amount', sortable: true },
  { title: t('TransportModule.fine.fields.issued_at'), key: 'issued_at', sortable: true },
  { title: t('TransportModule.fine.fields.created_by'), key: 'created_by', sortable: true },
  { title: t('TransportModule.fine.fields.violation_type'), key: 'violation_type', sortable: true },
  { title: t('TransportModule.fine.fields.concession_info'), key: 'concession', sortable: false },
  { title: t('TransportModule.fine.fields.concession_holder'), key: 'concession_holder', sortable: false },
  { title: t('TransportModule.fine.fields.subject_type'), key: 'subject_type', sortable: true },
  { title: t('TransportModule.fine.fields.payment_status'), key: 'payment_status', sortable: true },
  { title: t('common.actions'), key: 'actions', sortable: false },
]

// Opciones para los selects
const statusOptions = [
  { value: '', text: t('TransportModule.fine.filters.all_statuses') },
  { value: 'DRAFT', text: t('TransportModule.fine.status.draft') },
  { value: 'ISSUED', text: t('TransportModule.fine.status.issued') },
  { value: 'PAID', text: t('TransportModule.fine.status.paid') },
  { value: 'CANCELLED', text: t('TransportModule.fine.status.cancelled') },
  { value: 'OVERDUE', text: t('TransportModule.fine.status.overdue') },
  { value: 'APPEALED', text: t('TransportModule.fine.status.appealed') },
]

const subjectTypeOptions = [
  { value: '', text: t('TransportModule.fine.filters.all_subject_types') },
  { value: 'concession', text: t('TransportModule.fine.subject_type.concession') },
  { value: 'concession_holder', text: t('TransportModule.fine.subject_type.concession_holder') },
  { value: 'driver', text: t('TransportModule.fine.subject_type.driver') },
]

const paymentStatusOptions = [
  { value: '', text: t('TransportModule.fine.filters.all_payment_statuses') },
  { value: 'paid', text: t('TransportModule.fine.payment_status.paid') },
  { value: 'pending', text: t('TransportModule.fine.payment_status.pending') },
  { value: 'overdue', text: t('TransportModule.fine.payment_status.overdue') },
  { value: 'partial', text: t('TransportModule.fine.payment_status.partial') },
]

// Opciones del menú de exportación
const menuOptions = [
  {
    text: 'Export to Excel',
    icon: 'tabler-file-spreadsheet',
    action: () => exportItems('excel'),
  },
  {
    text: 'Export to PDF',
    icon: 'tabler-file-type-pdf',
    action: () => exportItems('pdf'),
  },
]

// Computed para items del store
const items = computed(() => fineStore.list || [])
const loading = computed(() => fineStore.loading)
const total = computed(() => fineStore.total || 0)
const page = computed(() => fineStore.page || 1)
const itemsPerPage = computed(() => fineStore.itemsPerPage || 15)
const hasItems = computed(() => items.value && items.value.length > 0)

// Métodos
const debouncedFetchList = debounce(() => {
  applyFilters()
}, 500)

function applyFilters() {
  // Verificar que el store esté disponible
  if (!fineStore) {
    console.error('FineStore not available')
    return
  }
  
  const filters: any = {}
  
  // Filtros básicos
  if (fineStore.filters?.search) {
    filters.search = fineStore.filters.search
  }
  
  // Filtros avanzados
  if (selectedStatus.value) {
    filters.status = selectedStatus.value
  }
  
  if (selectedSubjectType.value) {
    filters.subject_type = selectedSubjectType.value
  }
  
  if (dateFrom.value) {
    filters.date_from = dateFrom.value
  }
  
  if (dateTo.value) {
    filters.date_to = dateTo.value
  }
  
  if (amountMin.value) {
    filters.min_amount = parseFloat(amountMin.value)
  }
  
  if (amountMax.value) {
    filters.max_amount = parseFloat(amountMax.value)
  }
  
  if (selectedConcessionId.value) {
    filters.concession_id = selectedConcessionId.value
  }
  
  if (selectedConcessionHolderId.value) {
    filters.concession_holder_id = selectedConcessionHolderId.value
  }
  
  if (selectedViolationTypeId.value) {
    filters.violation_type_id = selectedViolationTypeId.value
  }
  
  if (selectedCreatedBy.value) {
    filters.created_by = selectedCreatedBy.value
  }
  
  if (selectedPaymentStatus.value) {
    filters.payment_status = selectedPaymentStatus.value
  }
  
  // Actualizar filtros en el store directamente
  if (fineStore.filters) {
    fineStore.filters = { ...fineStore.filters, ...filters }
  }
  
  // Verificar que fetchList esté disponible
  if (typeof fineStore.fetchList === 'function') {
    fineStore.fetchList()
  } else {
    console.error('fetchList method not available in fineStore')
  }
}

function clearFilters() {
  // Verificar que el store esté disponible
  if (!fineStore) {
    console.error('FineStore not available')
    return
  }
  
  // Limpiar filtros del store directamente
  if (fineStore.filters) {
    fineStore.filters = {}
  }
  
  // Limpiar filtros locales
  selectedStatus.value = ''
  selectedSubjectType.value = ''
  dateFrom.value = ''
  dateTo.value = ''
  amountMin.value = ''
  amountMax.value = ''
  selectedConcessionId.value = ''
  selectedConcessionHolderId.value = ''
  selectedViolationTypeId.value = ''
  selectedCreatedBy.value = ''
  selectedPaymentStatus.value = ''
  
  // Recargar datos
  if (typeof fineStore.fetchList === 'function') {
    fineStore.fetchList()
  } else {
    console.error('fetchList method not available in fineStore')
  }
}

function toggleAdvancedFilters() {
  showAdvancedFilters.value = !showAdvancedFilters.value
}

function openViewDialog(item: any) {
  navigateTo(`/fines/${item.id}`)
}

function openEditDialog(item: any) {
  navigateTo(`/fines/${item.id}/edit`)
}

function openDeleteDialog(item: any) {
  console.log('Delete fine:', item)
}

function openPayDialog(item: any) {
  navigateTo(`/fines/${item.id}/pay`)
}

function exportItems(type: string) {
  // TODO: Implementar exportación
  console.log('Export items:', type)
}

function handleTableUpdate(options: any) {
  // Manejar cambios de paginación y ordenamiento directamente
  if (options.page !== undefined) {
    fineStore.page = options.page
  }
  
  if (options.itemsPerPage !== undefined) {
    fineStore.itemsPerPage = options.itemsPerPage
  }
  
  if (options.sortBy && options.sortBy.length > 0) {
    fineStore.sortBy = options.sortBy
    fineStore.sortDesc = options.sortDesc || []
  }
  
  // Aplicar filtros con los nuevos parámetros
  applyFilters()
}

// Métodos auxiliares para los chips
function getStatusColor(status: string) {
  const colors = {
    DRAFT: 'grey',
    ISSUED: 'warning',
    PAID: 'success',
    CANCELLED: 'secondary',
    OVERDUE: 'error',
    APPEALED: 'info',
  }

  return colors[status as keyof typeof colors] || 'grey'
}

function getSubjectTypeColor(type: string) {
  const colors = {
    concession: 'primary',
    concession_holder: 'info',
    driver: 'warning',
  }

  return colors[type as keyof typeof colors] || 'grey'
}

function getPaymentStatusColor(status: string) {
  const colors = {
    paid: 'success',
    pending: 'warning',
    overdue: 'error',
    partial: 'info',
  }

  return colors[status as keyof typeof colors] || 'grey'
}

function formatCurrency(amount: number) {
  if (!amount)
    return '$0.00'

  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount)
}

function formatDate(date: string) {
  if (!date)
    return '-'

  return new Date(date).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDateTime(date: string) {
  if (!date)
    return '-'

  return new Date(date).toLocaleString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function isOverdue(dueDate: string, status: string) {
  if (status === 'PAID')
    return false
  if (!dueDate)
    return false

  const due = new Date(dueDate)
  const today = new Date()

  return due < today
}

// onMounted
onMounted(() => {
  fineStore.fetchList()
})
</script>

<template>
  <VCard>
    <VCardTitle>
      <h4 class="text-h4 mb-1">
        {{ t('TransportModule.fine.title') }}
      </h4>
      <p class="text-body-1 mb-4">
        {{ t('TransportModule.fine.list_title') }}
      </p>
    </VCardTitle>

    <VCardText>
      <!-- Filtros básicos -->
      <div class="d-flex align-center flex-wrap gap-4 justify-space-between mb-4">
        <div class="d-flex align-center flex-wrap gap-4">
          <!-- Campo de búsqueda -->
          <VTextField
            v-model="fineStore.filters.search"
            :label="t('TransportModule.fine.search_placeholder')"
            variant="outlined"
            dense
            class="filter-field"
            @input="debouncedFetchList"
          />

          <!-- Botón para filtros avanzados -->
          <VBtn
            variant="outlined"
            @click="toggleAdvancedFilters"
          >
            <VIcon start>
              tabler-filter
            </VIcon>
            {{ t('TransportModule.fine.filters.advanced') }}
          </VBtn>

          <!-- Botón para limpiar filtros -->
          <VBtn
            variant="outlined"
            color="secondary"
            @click="clearFilters"
          >
            <VIcon start>
              tabler-x
            </VIcon>
            {{ t('TransportModule.fine.filters.clear') }}
          </VBtn>
        </div>

        <div class="d-flex align-center gap-4">
          <!-- Botón para exportar -->
          <GlobalMenu
            :menu-options="menuOptions"
            :loading="loading"
            :disabled="!hasItems"
          >
            <template #activator="{ props }">
              <VBtn
                v-bind="props"
                variant="outlined"
                :loading="loading"
                :disabled="!hasItems"
              >
                <VIcon start>
                  tabler-download
                </VIcon>
                {{ t('common.export') }}
              </VBtn>
            </template>
          </GlobalMenu>

          <!-- Botón para agregar -->
          <VBtn
            color="primary"
            :to="{ name: 'finesCreate' }"
          >
            <VIcon start>
              tabler-plus
            </VIcon>
            {{ t('TransportModule.fine.actions.issue_fine') }}
          </VBtn>
        </div>
      </div>

      <!-- Filtros avanzados -->
      <VExpandTransition>
        <VCard
          v-show="showAdvancedFilters"
          variant="outlined"
          class="mb-4"
        >
          <VCardText>
            <VRow>
              <VCol cols="12" md="3">
                <VSelect
                  v-model="selectedStatus"
                  :items="statusOptions"
                  :label="t('TransportModule.fine.fields.status')"
                  variant="outlined"
                  dense
                  clearable
                  @update:model-value="applyFilters"
                />
              </VCol>
              
              <VCol cols="12" md="3">
                <VSelect
                  v-model="selectedSubjectType"
                  :items="subjectTypeOptions"
                  :label="t('TransportModule.fine.fields.subject_type')"
                  variant="outlined"
                  dense
                  clearable
                  @update:model-value="applyFilters"
                />
              </VCol>
              
              <VCol cols="12" md="3">
                <VSelect
                  v-model="selectedPaymentStatus"
                  :items="paymentStatusOptions"
                  :label="t('TransportModule.fine.fields.payment_status')"
                  variant="outlined"
                  dense
                  clearable
                  @update:model-value="applyFilters"
                />
              </VCol>
              
              <VCol cols="12" md="3">
                <VTextField
                  v-model="selectedCreatedBy"
                  :label="t('TransportModule.fine.fields.created_by')"
                  variant="outlined"
                  dense
                  @input="debouncedFetchList"
                />
              </VCol>
              
              <VCol cols="12" md="3">
                <VTextField
                  v-model="dateFrom"
                  :label="t('TransportModule.fine.filters.date_from')"
                  type="date"
                  variant="outlined"
                  dense
                  @update:model-value="applyFilters"
                />
              </VCol>
              
              <VCol cols="12" md="3">
                <VTextField
                  v-model="dateTo"
                  :label="t('TransportModule.fine.filters.date_to')"
                  type="date"
                  variant="outlined"
                  dense
                  @update:model-value="applyFilters"
                />
              </VCol>
              
              <VCol cols="12" md="3">
                <VTextField
                  v-model="amountMin"
                  :label="t('TransportModule.fine.filters.amount_min')"
                  type="number"
                  variant="outlined"
                  dense
                  prefix="$"
                  @input="debouncedFetchList"
                />
              </VCol>
              
              <VCol cols="12" md="3">
                <VTextField
                  v-model="amountMax"
                  :label="t('TransportModule.fine.filters.amount_max')"
                  type="number"
                  variant="outlined"
                  dense
                  prefix="$"
                  @input="debouncedFetchList"
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VExpandTransition>

      <!-- Tabla de multas -->
      <VDataTableServer
        v-model:items-per-page="itemsPerPage"
        v-model:page="page"
        :headers="headers"
        :items="items"
        :items-length="total"
        :loading="loading"
        class="elevation-1"
        item-value="id"
        @update:options="handleTableUpdate"
      >
        <!-- Slot para ID y número de multa -->
        <template #[`item.id`]="{ item }">
          <div class="d-flex align-center">
            <VIcon
              size="20"
              class="me-2"
            >
              tabler-file-dollar
            </VIcon>
            <div>
              <div class="font-weight-medium">{{ item.id }}</div>
              <div class="text-caption text-medium-emphasis">
                {{ item.fine_number || `#${item.id.slice(-8)}` }}
              </div>
            </div>
          </div>
        </template>

        <!-- Slot para status -->
        <template #[`item.status`]="{ item }">
          <VChip
            :color="getStatusColor(item.status)"
            size="small"
            variant="tonal"
          >
            {{ item.status_label || item.status }}
          </VChip>
        </template>

        <!-- Slot para monto total -->
        <template #[`item.total_amount`]="{ item }">
          <div class="text-right">
            <div class="font-weight-medium">
              {{ item.formatted_amount || formatCurrency(item.total_amount) }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ t('TransportModule.fine.fields.base_amount') }}: {{ formatCurrency(item.base_amount) }}
            </div>
          </div>
        </template>

        <!-- Slot para fecha de emisión -->
        <template #[`item.issued_at`]="{ item }">
          <div>
            <div>{{ formatDateTime(item.issued_at) }}</div>
            <div class="text-caption text-medium-emphasis">
              {{ t('TransportModule.fine.fields.due_date') }}: {{ formatDate(item.due_date) }}
            </div>
          </div>
        </template>

        <!-- Slot para usuario creador -->
        <template #[`item.created_by`]="{ item }">
          <div>
            <div class="font-weight-medium">{{ item.created_by_name || 'N/A' }}</div>
            <div class="text-caption text-medium-emphasis">{{ item.created_by_email || '' }}</div>
          </div>
        </template>

        <!-- Slot para tipo de violación -->
        <template #[`item.violation_type`]="{ item }">
          <div>
            <div class="font-weight-medium">{{ item.violation_type?.name || 'N/A' }}</div>
            <div class="text-caption text-medium-emphasis">
              {{ item.violation_type?.description || '' }}
            </div>
          </div>
        </template>

        <!-- Slot para información de concesión -->
        <template #[`item.concession`]="{ item }">
          <div v-if="item.concession">
            <div class="font-weight-medium">{{ item.concession.concession_number }}</div>
            <div class="text-caption text-medium-emphasis">
              {{ item.concession.modality || 'N/A' }} - {{ item.concession.municipality || 'N/A' }}
            </div>
          </div>
          <span v-else class="text-medium-emphasis">N/A</span>
        </template>

        <!-- Slot para información del concesionario -->
        <template #[`item.concession_holder`]="{ item }">
          <div v-if="item.concession_holder">
            <div class="font-weight-medium">{{ item.concession_holder.name }}</div>
            <div class="text-caption text-medium-emphasis">
              {{ item.concession_holder.type || 'N/A' }} - {{ item.concession_holder.document_number || 'N/A' }}
            </div>
          </div>
          <span v-else class="text-medium-emphasis">N/A</span>
        </template>

        <!-- Slot para tipo de sujeto -->
        <template #[`item.subject_type`]="{ item }">
          <VChip
            :color="getSubjectTypeColor(item.subject_type)"
            size="small"
            variant="tonal"
          >
            {{ t(`TransportModule.fine.subject_type.${item.subject_type}`) }}
          </VChip>
        </template>

        <!-- Slot para estado de pago -->
        <template #[`item.payment_status`]="{ item }">
          <div>
            <VChip
              :color="getPaymentStatusColor(item.payment_status)"
              size="small"
              variant="tonal"
            >
              {{ t(`TransportModule.fine.payment_status.${item.payment_status}`) }}
            </VChip>
            <div v-if="item.remaining_amount > 0" class="text-caption text-medium-emphasis mt-1">
              {{ t('TransportModule.fine.fields.remaining') }}: {{ formatCurrency(item.remaining_amount) }}
            </div>
          </div>
        </template>

        <!-- Slot para acciones -->
        <template #[`item.actions`]="{ item }">
          <div class="d-flex gap-1">
            <VBtn
              icon
              variant="text"
              size="small"
              color="default"
              @click="openViewDialog(item)"
            >
              <VIcon size="20">
                tabler-eye
              </VIcon>
              <VTooltip activator="parent" location="top">
                {{ t('common.view') }}
              </VTooltip>
            </VBtn>

            <VBtn
              v-if="item.status !== 'PAID' && item.status !== 'CANCELLED'"
              icon
              variant="text"
              size="small"
              color="success"
              @click="openPayDialog(item)"
            >
              <VIcon size="20">
                tabler-credit-card
              </VIcon>
              <VTooltip activator="parent" location="top">
                {{ t('TransportModule.fine.actions.pay') }}
              </VTooltip>
            </VBtn>

            <VBtn
              v-if="item.status === 'DRAFT'"
              icon
              variant="text"
              size="small"
              color="info"
              @click="openEditDialog(item)"
            >
              <VIcon size="20">
                tabler-pencil
              </VIcon>
              <VTooltip activator="parent" location="top">
                {{ t('common.edit') }}
              </VTooltip>
            </VBtn>

            <VBtn
              v-if="item.status === 'DRAFT'"
              icon
              variant="text"
              size="small"
              color="error"
              @click="openDeleteDialog(item)"
            >
              <VIcon size="20">
                tabler-trash
              </VIcon>
              <VTooltip activator="parent" location="top">
                {{ t('common.delete') }}
              </VTooltip>
            </VBtn>
          </div>
        </template>

        <!-- Slot para cuando no hay datos -->
        <template #no-data>
          <div class="text-center pa-5">
            <VIcon
              size="64"
              color="grey-400"
              class="mb-4"
            >
              tabler-file-dollar-off
            </VIcon>
            <h6 class="text-h6 mb-2">
              {{ t('TransportModule.fine.no_fines') }}
            </h6>
            <p class="text-body-2 mb-4">
              {{ t('TransportModule.fine.no_fines_filtered') }}
            </p>
            <VBtn
              color="primary"
              :to="{ name: 'finesCreate' }"
            >
              <VIcon start>
                tabler-plus
              </VIcon>
              {{ t('TransportModule.fine.actions.issue_fine') }}
            </VBtn>
          </div>
        </template>
      </VDataTableServer>
    </VCardText>
  </VCard>
</template>

<style scoped>
.filter-field {
  min-inline-size: 250px;
}

.text-error {
  color: rgb(var(--v-theme-error)) !important;
}

.v-data-table {
  border-radius: 8px;
}

.v-chip {
  font-size: 0.75rem;
  font-weight: 500;
}

.text-caption {
  font-size: 0.75rem;
  line-height: 1.25;
}

.font-weight-medium {
  font-weight: 500;
}

.text-medium-emphasis {
  opacity: 0.6;
}

.v-card {
  border-radius: 12px;
}

.v-expand-transition-enter-active,
.v-expand-transition-leave-active {
  transition: all 0.3s ease;
}

.v-expand-transition-enter-from,
.v-expand-transition-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
