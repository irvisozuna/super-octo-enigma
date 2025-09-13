<script setup lang="ts">
import { nextTick, onMounted } from 'vue'
import debounce from 'lodash/debounce'
import { useI18n } from 'vue-i18n'
import { useConcessionStore } from '../stores/concessionStore'

// Composable para manejar diálogos
const { openDialog, navigateTo } = useAppManager()
const { t } = useI18n()

// Store
const concessionStore = useConcessionStore()

// Headers para la tabla
const headers = [
  { title: t('TransportModule.concession.fields.concession_number'), key: 'concessionNumber' },
  { title: t('TransportModule.concession.fields.concession_type'), key: 'concessionType' },
  { title: t('TransportModule.concession.fields.service_area'), key: 'serviceArea' },
  { title: t('TransportModule.concession.fields.holder'), key: 'holderName' },
  { title: t('TransportModule.concession.fields.expiry_date'), key: 'expiryDate' },
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
  concessionStore.fetchList()
}, 500)

function applyFilters() {
  debouncedFetchList()
}

function clearFilters() {
  concessionStore.$patch({
    filters: {
      search: '',
      status: '',
      concession_type: '',
      holder_id: '',
    },
  })

  nextTick(() => {
    concessionStore.fetchList()
  })
}

function openViewDialog(item: any) {
  navigateTo(`/concessions/${item.id}`)
}

function openEditDialog(item: any) {
  navigateTo(`/concessions/${item.id}/edit`)
}

function openDeleteDialog(item: any) {
  // Implementar dialog de eliminación cuando esté disponible
  console.log('Delete concession:', item)
}

function exportItems(type: string) {
  concessionStore.exportItems(type)
}

// Métodos auxiliares para los chips
function getConcessionTypeColor(type: string) {
  const colors = {
    TAXI: 'yellow',
    BUS: 'blue',
    MICROBUS: 'green',
    TRUCK: 'orange',
  }

  return colors[type?.toUpperCase()] || 'grey'
}

function getStatusColor(status: string) {
  const colors = {
    active: 'success',
    inactive: 'warning',
    expired: 'error',
    suspended: 'info',
  }

  return colors[status?.toLowerCase()] || 'grey'
}

function getStatusText(status: string) {
  const texts = {
    active: 'Active',
    inactive: 'Inactive',
    expired: 'Expired',
    suspended: 'Suspended',
  }

  return texts[status?.toLowerCase()] || status
}

function formatDate(date: string) {
  if (!date)
    return '-'

  return new Date(date).toLocaleDateString()
}

// Método auxiliar para verificar si una concesión está por vencer
function isExpiringSoon(expiryDate: string, days: number = 30) {
  if (!expiryDate)
    return false
  const expiry = new Date(expiryDate)
  const today = new Date()
  const diffTime = expiry.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays <= days && diffDays >= 0
}

// onMounted
onMounted(() => {
  concessionStore.fetchList()
})
</script>

<template>
  <VCard>
    <VCardTitle>
      <h4 class="text-h4 mb-1">
        {{ t('TransportModule.concession.title') }}
      </h4>
      <p class="text-body-1 mb-4">
        {{ t('TransportModule.concession.list_title') }}
      </p>
    </VCardTitle>

    <VCardText>
      <div class="d-flex align-center flex-wrap gap-4 justify-end">
        <!-- Campo de búsqueda -->
        <VTextField
          v-model="concessionStore.filters.search"
          :label="t('TransportModule.concession.search_placeholder')"
          variant="outlined"
          dense
          class="filter-field"
          @input="applyFilters"
        />

        <!-- Botón para exportar -->
        <GlobalMenu
          :menu-options="menuOptions"
          :loading="concessionStore.loading"
          :disabled="!concessionStore.hasItems"
        >
          <template #activator="{ props }">
            <VBtn
              v-bind="props"
              variant="outlined"
              :loading="concessionStore.loading"
              :disabled="!concessionStore.hasItems"
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
          :to="{ name: 'concessionsCreate' }"
        >
          <VIcon start>
            tabler-plus
          </VIcon>
          {{ t('TransportModule.concession.actions.create_concession') }}
        </VBtn>
      </div>

      <!-- Tabla de concesiones -->
      <VDataTableServer
        v-model:items-per-page="concessionStore.itemsPerPage"
        v-model:page="concessionStore.page"
        :headers="headers"
        :items="concessionStore.items"
        :items-length="concessionStore.total"
        :loading="concessionStore.loading"
        :search="concessionStore.filters.search"
        class="elevation-1"
        item-value="id"
        @update:options="concessionStore.fetchList"
      >
        <!-- Slot para número de concesión -->
        <template #[`item.concessionNumber`]="{ item }">
          <div class="d-flex align-center">
            <VIcon
              size="20"
              class="me-2"
            >
              tabler-certificate
            </VIcon>
            <span class="font-weight-medium">{{ item.concessionNumber }}</span>
          </div>
        </template>

        <!-- Slot para tipo de concesión -->
        <template #[`item.concessionType`]="{ item }">
          <VChip
            :color="getConcessionTypeColor(item.concessionType)"
            size="small"
            variant="tonal"
          >
            {{ item.concessionType }}
          </VChip>
        </template>

        <!-- Slot para fecha de vencimiento -->
        <template #[`item.expiryDate`]="{ item }">
          <span :class="{ 'text-error': isExpiringSoon(item.expiryDate) }">
            {{ formatDate(item.expiryDate) }}
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
              tabler-certificate-off
            </VIcon>
            <h6 class="text-h6 mb-2">
              {{ t('TransportModule.concession.no_data') }}
            </h6>
            <p class="text-body-2 mb-4">
              {{ t('TransportModule.concession.no_data_description') }}
            </p>
            <VBtn
              color="primary"
              :to="{ name: 'concessionsCreate' }"
            >
              {{ t('TransportModule.concession.actions.create_concession') }}
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
