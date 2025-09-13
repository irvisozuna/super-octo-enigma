<script setup lang="ts">
import { onMounted } from 'vue'
import debounce from 'lodash/debounce'
import { useI18n } from 'vue-i18n'
import { useFineStore } from '../stores/fineStore'

// Composable para manejar diálogos
const { navigateTo } = useAppManager()
const { t } = useI18n()

// Store
const fineStore = useFineStore()

// Headers para la tabla
const headers = [
  { title: t('fine.fields.fine_number'), key: 'fineNumber' },
  { title: t('fine.fields.vehicle_plate'), key: 'vehiclePlate' },
  { title: t('fine.fields.violation_type'), key: 'violationType' },
  { title: t('fine.fields.amount'), key: 'amount' },
  { title: t('fine.fields.issue_date'), key: 'issueDate' },
  { title: t('fine.fields.due_date'), key: 'dueDate' },
  { title: t('common.status'), key: 'status' },
  { title: t('common.actions'), key: 'actions', sortable: false },
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

// Métodos
const debouncedFetchList = debounce(() => {
  fineStore.fetchList()
}, 500)

function applyFilters() {
  debouncedFetchList()
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
  fineStore.exportItems(type)
}

// Métodos auxiliares para los chips
function getViolationTypeColor(type: string) {
  const colors = {
    speeding: 'red',
    parking: 'orange',
    no_license: 'error',
    reckless_driving: 'error',
    traffic_light: 'warning',
    illegal_overtaking: 'red',
    mobile_phone: 'info',
    no_seatbelt: 'warning',
    document_violation: 'secondary',
    other: 'grey',
  }

  return colors[type?.toLowerCase()] || 'grey'
}

function getStatusColor(status: string) {
  const colors = {
    paid: 'success',
    unpaid: 'warning',
    overdue: 'error',
    cancelled: 'secondary',
    contested: 'info',
  }

  return colors[status?.toLowerCase()] || 'grey'
}

function getStatusText(status: string) {
  const texts = {
    paid: 'Paid',
    unpaid: 'Unpaid',
    overdue: 'Overdue',
    cancelled: 'Cancelled',
    contested: 'Contested',
  }

  return texts[status?.toLowerCase()] || status
}

function formatCurrency(amount: number) {
  if (!amount)
    return '$0.00'

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function formatDate(date: string) {
  if (!date)
    return '-'

  return new Date(date).toLocaleDateString()
}

function isOverdue(dueDate: string, status: string) {
  if (status === 'paid')
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
        {{ t('fine.title') }}
      </h4>
      <p class="text-body-1 mb-4">
        {{ t('fine.list_title') }}
      </p>
    </VCardTitle>

    <VCardText>
      <div class="d-flex align-center flex-wrap gap-4 justify-end">
        <!-- Campo de búsqueda -->
        <VTextField
          v-model="fineStore.filters.search"
          :label="t('fine.search_placeholder')"
          variant="outlined"
          dense
          class="filter-field"
          @input="applyFilters"
        />

        <!-- Botón para exportar -->
        <GlobalMenu
          :menu-options="menuOptions"
          :loading="fineStore.loading"
          :disabled="!fineStore.hasItems"
        >
          <template #activator="{ props }">
            <VBtn
              v-bind="props"
              variant="outlined"
              :loading="fineStore.loading"
              :disabled="!fineStore.hasItems"
            >
              <VIcon start>
                tabler-download
              </VIcon>
              Export
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
          {{ t('fine.actions.issue_fine') }}
        </VBtn>
      </div>

      <!-- Tabla de multas -->
      <VDataTableServer
        v-model:items-per-page="fineStore.itemsPerPage"
        v-model:page="fineStore.page"
        :headers="headers"
        :items="fineStore.items"
        :items-length="fineStore.total"
        :loading="fineStore.loading"
        :search="fineStore.filters.search"
        class="elevation-1"
        item-value="id"
        @update:options="fineStore.fetchList"
      >
        <!-- Slot para número de multa -->
        <template #[`item.fineNumber`]="{ item }">
          <div class="d-flex align-center">
            <VIcon
              size="20"
              class="me-2"
            >
              tabler-file-dollar
            </VIcon>
            <span class="font-weight-medium">{{ item.fineNumber }}</span>
          </div>
        </template>

        <!-- Slot para placa del vehículo -->
        <template #[`item.vehiclePlate`]="{ item }">
          <div class="d-flex align-center">
            <VIcon
              size="18"
              class="me-2"
            >
              tabler-car
            </VIcon>
            <span>{{ item.vehiclePlate }}</span>
          </div>
        </template>

        <!-- Slot para tipo de violación -->
        <template #[`item.violationType`]="{ item }">
          <VChip
            :color="getViolationTypeColor(item.violationType)"
            size="small"
            variant="tonal"
          >
            {{ item.violationType }}
          </VChip>
        </template>

        <!-- Slot para monto -->
        <template #[`item.amount`]="{ item }">
          <span class="font-weight-medium">
            {{ formatCurrency(item.amount) }}
          </span>
        </template>

        <!-- Slot para fecha de emisión -->
        <template #[`item.issueDate`]="{ item }">
          {{ formatDate(item.issueDate) }}
        </template>

        <!-- Slot para fecha de vencimiento -->
        <template #[`item.dueDate`]="{ item }">
          <span :class="{ 'text-error': isOverdue(item.dueDate, item.status) }">
            {{ formatDate(item.dueDate) }}
          </span>
        </template>

        <!-- Slot para estatus -->
        <template #[`item.status`]="{ item }">
          <VChip
            :color="getStatusColor(item.status)"
            size="small"
            variant="tonal"
          >
            {{ getStatusText(item.status) }}
          </VChip>
        </template>

        <!-- Slot para acciones -->
        <template #[`item.actions`]="{ item }">
          <div class="d-flex gap-2">
            <VBtn
              icon
              variant="text"
              size="small"
              color="default"
              @click="openViewDialog(item)"
            >
              <VIcon size="22">
                tabler-eye
              </VIcon>
            </VBtn>

            <VBtn
              v-if="item.status !== 'paid'"
              icon
              variant="text"
              size="small"
              color="success"
              @click="openPayDialog(item)"
            >
              <VIcon size="22">
                tabler-credit-card
              </VIcon>
            </VBtn>

            <VBtn
              icon
              variant="text"
              size="small"
              color="info"
              @click="openEditDialog(item)"
            >
              <VIcon size="22">
                tabler-pencil
              </VIcon>
            </VBtn>

            <VBtn
              icon
              variant="text"
              size="small"
              color="error"
              @click="openDeleteDialog(item)"
            >
              <VIcon size="22">
                tabler-trash
              </VIcon>
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
              {{ t('fine.no_data') }}
            </h6>
            <p class="text-body-2 mb-4">
              {{ t('fine.no_data_description') }}
            </p>
            <VBtn
              color="primary"
              :to="{ name: 'finesCreate' }"
            >
              {{ t('fine.actions.issue_fine') }}
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
</style>
