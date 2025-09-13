<script setup lang="ts">
import { nextTick, onMounted } from 'vue'
import debounce from 'lodash/debounce'
import { useI18n } from 'vue-i18n'
import { useVehicleStore } from '../stores/vehicleStore'

// Composable para manejar diálogos
const { openDialog, navigateTo } = useAppManager()
const { t } = useI18n()

// Store
const vehicleStore = useVehicleStore()

// Headers para la tabla
const headers = [
  { title: t('vehicle.fields.plate_number'), key: 'plateNumber' },
  { title: t('vehicle.fields.make'), key: 'make' },
  { title: t('vehicle.fields.model'), key: 'model' },
  { title: t('vehicle.fields.year'), key: 'year' },
  { title: t('vehicle.fields.fuel_type'), key: 'fuelType' },
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
  vehicleStore.fetchList()
}, 500)

function applyFilters() {
  debouncedFetchList()
}

function clearFilters() {
  vehicleStore.$patch({
    filters: {
      search: '',
      status: '',
      fuel_type: '',
      make: '',
    },
  })

  nextTick(() => {
    vehicleStore.fetchList()
  })
}

function openViewDialog(item: any) {
  navigateTo(`/vehicles/${item.id}`)
}

function openEditDialog(item: any) {
  navigateTo(`/vehicles/${item.id}/edit`)
}

function openDeleteDialog(item: any) {
  // Implementar dialog de eliminación cuando esté disponible
  console.log('Delete vehicle:', item)
}

function exportItems(type: string) {
  vehicleStore.exportItems(type)
}

// Métodos auxiliares para los chips
function getFuelTypeColor(fuelType: string) {
  const colors = {
    gasoline: 'orange',
    diesel: 'blue',
    electric: 'green',
    hybrid: 'purple',
    lpg: 'amber',
    cng: 'cyan',
  }

  return colors[fuelType?.toLowerCase()] || 'grey'
}

function getStatusColor(status: string) {
  const colors = {
    active: 'success',
    inactive: 'warning',
    maintenance: 'info',
    retired: 'error',
  }

  return colors[status?.toLowerCase()] || 'grey'
}

function getStatusText(status: string) {
  const texts = {
    active: 'Active',
    inactive: 'Inactive',
    maintenance: 'Maintenance',
    retired: 'Retired',
  }

  return texts[status?.toLowerCase()] || status
}

// onMounted
onMounted(() => {
  vehicleStore.fetchList()
})
</script>

<template>
  <VCard>
    <VCardTitle>
      <h4 class="text-h4 mb-1">
        {{ t('vehicle.title') }}
      </h4>
      <p class="text-body-1 mb-4">
        {{ t('vehicle.list_title') }}
      </p>
    </VCardTitle>

    <VCardText>
      <div class="d-flex align-center flex-wrap gap-4 justify-end">
        <!-- Campo de búsqueda -->
        <VTextField
          v-model="vehicleStore.filters.search"
          :label="t('vehicle.search_placeholder')"
          variant="outlined"
          dense
          class="filter-field"
          @input="applyFilters"
        />

        <!-- Botón para exportar -->
        <GlobalMenu
          :menu-options="menuOptions"
          :loading="vehicleStore.loading"
          :disabled="!vehicleStore.hasItems"
        >
          <template #activator="{ props }">
            <VBtn
              v-bind="props"
              variant="outlined"
              :loading="vehicleStore.loading"
              :disabled="!vehicleStore.hasItems"
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
          :to="{ name: 'vehiclesCreate' }"
        >
          <VIcon start>
            tabler-plus
          </VIcon>
          {{ t('vehicle.actions.add_vehicle') }}
        </VBtn>
      </div>

      <!-- Tabla de vehículos -->
      <VDataTableServer
        v-model:items-per-page="vehicleStore.itemsPerPage"
        v-model:page="vehicleStore.page"
        :headers="headers"
        :items="vehicleStore.items"
        :items-length="vehicleStore.total"
        :loading="vehicleStore.loading"
        :search="vehicleStore.filters.search"
        class="elevation-1"
        item-value="id"
        @update:options="vehicleStore.fetchList"
      >
        <!-- Slot para placa -->
        <template #[`item.plateNumber`]="{ item }">
          <div class="d-flex align-center">
            <VIcon
              size="20"
              class="me-2"
            >
              tabler-car
            </VIcon>
            <span class="font-weight-medium">{{ item.plateNumber }}</span>
          </div>
        </template>

        <!-- Slot para tipo de combustible -->
        <template #[`item.fuelType`]="{ item }">
          <VChip
            :color="getFuelTypeColor(item.fuelType)"
            size="small"
            variant="tonal"
          >
            {{ item.fuelType }}
          </VChip>
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
              tabler-car-off
            </VIcon>
            <h6 class="text-h6 mb-2">
              {{ t('vehicle.no_data') }}
            </h6>
            <p class="text-body-2 mb-4">
              {{ t('vehicle.no_data_description') }}
            </p>
            <VBtn
              color="primary"
              :to="{ name: 'vehiclesCreate' }"
            >
              {{ t('vehicle.actions.add_vehicle') }}
            </VBtn>
          </div>
        </template>
      </VDataTableServer>
    </VCardText>
  </VCard>
</template>

<style scoped>
.filter-field {
  min-width: 250px;
}
</style>
