<script setup lang="ts">
import { onMounted } from 'vue'
import debounce from 'lodash/debounce'
import { useI18n } from 'vue-i18n'
import { useDriverStore } from '../stores/driverStore'

// Composable para manejar diálogos
const { navigateTo } = useAppManager()
const { t } = useI18n()

// Store
const driverStore = useDriverStore()

// Headers para la tabla
const headers = [
  { title: t('driver.fields.license_number'), key: 'licenseNumber' },
  { title: t('driver.fields.full_name'), key: 'fullName' },
  { title: t('driver.fields.license_type'), key: 'licenseType' },
  { title: t('driver.fields.phone'), key: 'phone' },
  { title: t('driver.fields.expiration_date'), key: 'licenseExpirationDate' },
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
  driverStore.fetchList()
}, 500)

function applyFilters() {
  debouncedFetchList()
}

function openViewDialog(item: any) {
  navigateTo(`/drivers/${item.id}`)
}

function openEditDialog(item: any) {
  navigateTo(`/drivers/${item.id}/edit`)
}

function openDeleteDialog(item: any) {
  console.log('Delete driver:', item)
}

function exportItems(type: string) {
  driverStore.exportItems(type)
}

// Métodos auxiliares para los chips
function getLicenseTypeColor(type: string) {
  const colors = {
    A: 'info',
    B: 'primary',
    C: 'warning',
    D: 'success',
    E: 'secondary',
    professional: 'purple',
    commercial: 'orange',
  }

  return colors[type?.toUpperCase()] || 'grey'
}

function getStatusColor(status: string) {
  const colors = {
    active: 'success',
    inactive: 'warning',
    suspended: 'error',
    expired: 'error',
    pending: 'info',
  }

  return colors[status?.toLowerCase()] || 'grey'
}

function getStatusText(status: string) {
  const texts = {
    active: 'Active',
    inactive: 'Inactive',
    suspended: 'Suspended',
    expired: 'Expired',
    pending: 'Pending',
  }

  return texts[status?.toLowerCase()] || status
}

function formatDate(date: string) {
  if (!date)
    return '-'

  return new Date(date).toLocaleDateString()
}

function isExpiringSoon(expirationDate: string, days: number = 30) {
  if (!expirationDate)
    return false

  const expiry = new Date(expirationDate)
  const today = new Date()
  const diffTime = expiry.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays <= days && diffDays >= 0
}

// onMounted
onMounted(() => {
  driverStore.fetchList()
})
</script>

<template>
  <VCard>
    <VCardTitle>
      <h4 class="text-h4 mb-1">
        {{ t('driver.title') }}
      </h4>
      <p class="text-body-1 mb-4">
        {{ t('driver.list_title') }}
      </p>
    </VCardTitle>

    <VCardText>
      <div class="d-flex align-center flex-wrap gap-4 justify-end">
        <!-- Campo de búsqueda -->
        <VTextField
          v-model="driverStore.filters.search"
          :label="t('driver.search_placeholder')"
          variant="outlined"
          dense
          class="filter-field"
          @input="applyFilters"
        />

        <!-- Botón para exportar -->
        <GlobalMenu
          :menu-options="menuOptions"
          :loading="driverStore.loading"
          :disabled="!driverStore.hasItems"
        >
          <template #activator="{ props }">
            <VBtn
              v-bind="props"
              variant="outlined"
              :loading="driverStore.loading"
              :disabled="!driverStore.hasItems"
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
          :to="{ name: 'driversCreate' }"
        >
          <VIcon start>
            tabler-plus
          </VIcon>
          {{ t('driver.actions.add_driver') }}
        </VBtn>
      </div>

      <!-- Tabla de conductores -->
      <VDataTableServer
        v-model:items-per-page="driverStore.itemsPerPage"
        v-model:page="driverStore.page"
        :headers="headers"
        :items="driverStore.items"
        :items-length="driverStore.total"
        :loading="driverStore.loading"
        :search="driverStore.filters.search"
        class="elevation-1"
        item-value="id"
        @update:options="driverStore.fetchList"
      >
        <!-- Slot para número de licencia -->
        <template #[`item.licenseNumber`]="{ item }">
          <div class="d-flex align-center">
            <VIcon
              size="20"
              class="me-2"
            >
              tabler-id-badge-2
            </VIcon>
            <span class="font-weight-medium">{{ item.licenseNumber }}</span>
          </div>
        </template>

        <!-- Slot para nombre completo -->
        <template #[`item.fullName`]="{ item }">
          <div class="d-flex align-center">
            <VIcon
              size="18"
              class="me-2"
            >
              tabler-user
            </VIcon>
            <div>
              <div class="font-weight-medium">
                {{ item.fullName }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ item.identificationNumber }}
              </div>
            </div>
          </div>
        </template>

        <!-- Slot para tipo de licencia -->
        <template #[`item.licenseType`]="{ item }">
          <VChip
            :color="getLicenseTypeColor(item.licenseType)"
            size="small"
            variant="tonal"
          >
            {{ item.licenseType }}
          </VChip>
        </template>

        <!-- Slot para teléfono -->
        <template #[`item.phone`]="{ item }">
          <div class="d-flex align-center">
            <VIcon
              size="18"
              class="me-2"
            >
              tabler-phone
            </VIcon>
            <span>{{ item.phone || '-' }}</span>
          </div>
        </template>

        <!-- Slot para fecha de vencimiento -->
        <template #[`item.licenseExpirationDate`]="{ item }">
          <span :class="{ 'text-error': isExpiringSoon(item.licenseExpirationDate) }">
            {{ formatDate(item.licenseExpirationDate) }}
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
              tabler-user-off
            </VIcon>
            <h6 class="text-h6 mb-2">
              {{ t('driver.no_data') }}
            </h6>
            <p class="text-body-2 mb-4">
              {{ t('driver.no_data_description') }}
            </p>
            <VBtn
              color="primary"
              :to="{ name: 'driversCreate' }"
            >
              {{ t('driver.actions.add_driver') }}
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
