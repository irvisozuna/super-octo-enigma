<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { VehicleEntity } from '../../../domain/entities/VehicleEntity'
import type { EntityStatus, VehicleFilter, VehicleType } from '../../../../shared/types'
import { STATUS_LABELS, VEHICLE_TYPE_LABELS } from '../../../../shared/constants'
import { debounce, formatDate } from '../../../../shared/utils'
import VehicleStatusChipAtom from '../atoms/VehicleStatusChipAtom.vue'
import VehicleTypeIconAtom from '../atoms/VehicleTypeIconAtom.vue'

interface Props {
  vehicles: VehicleEntity[]
  loading?: boolean
  totalItems?: number
  filters?: VehicleFilter
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  totalItems: 0,
  filters: () => ({}),
})

const emit = defineEmits<{
  'update:filters': [filters: VehicleFilter]
  'create': []
  'view': [vehicle: VehicleEntity]
  'edit': [vehicle: VehicleEntity]
  'delete': [vehicle: VehicleEntity]
  'export': [filters: VehicleFilter]
}>()

const { t } = useI18n()

// Local state
const showFilters = ref(false)
const page = ref(1)
const itemsPerPage = ref(10)
const sortBy = ref([{ key: 'created_at', order: 'desc' }])

const localFilters = ref<VehicleFilter>({
  search: '',
  vehicle_type: undefined,
  status: undefined,
})

// Table headers
const headers = computed(() => [
  {
    title: t('vehicle.type'),
    key: 'vehicle_type',
    sortable: true,
    width: '120px',
  },
  {
    title: t('vehicle.vehicleInfo'),
    key: 'vehicle_info',
    sortable: false,
    width: '250px',
  },
  {
    title: t('common.status'),
    key: 'status',
    sortable: true,
    width: '120px',
  },
  {
    title: t('vehicle.capacity'),
    key: 'capacity',
    sortable: true,
    width: '100px',
  },
  {
    title: t('vehicle.inspection'),
    key: 'inspection',
    sortable: false,
    width: '150px',
  },
  {
    title: t('common.actions'),
    key: 'actions',
    sortable: false,
    width: '120px',
    align: 'center',
  },
])

// Select options
const vehicleTypeOptions = computed(() => {
  return Object.entries(VEHICLE_TYPE_LABELS).map(([value, text]) => ({
    value: value as VehicleType,
    title: text,
  }))
})

const statusOptions = computed(() => {
  return Object.entries(STATUS_LABELS).map(([value, text]) => ({
    value: value as EntityStatus,
    title: text,
  }))
})

// Debounced search
const debouncedSearch = debounce(() => {
  applyFilters()
}, 300)

// Methods
function getVehicleTypeLabel(type: VehicleType): string {
  return VEHICLE_TYPE_LABELS[type] || type
}

function applyFilters() {
  const filters: VehicleFilter = {
    ...localFilters.value,
    page: 1,
    per_page: itemsPerPage.value,
    sort_by: sortBy.value[0]?.key || 'created_at',
    sort_order: sortBy.value[0]?.order === 'desc' ? 'desc' : 'asc',
  }

  // Remove empty values
  Object.keys(filters).forEach(key => {
    if (filters[key] === '' || filters[key] === null || filters[key] === undefined)
      delete filters[key]
  })

  emit('update:filters', filters)
}

function clearFilters() {
  localFilters.value = {
    search: '',
    vehicle_type: undefined,
    status: undefined,
  }
  page.value = 1
  applyFilters()
}

function handleOptionsUpdate(options: any) {
  page.value = options.page
  itemsPerPage.value = options.itemsPerPage
  sortBy.value = options.sortBy || [{ key: 'created_at', order: 'desc' }]
  applyFilters()
}

function handleExport() {
  const filters: VehicleFilter = {
    ...localFilters.value,
    page: undefined,
    per_page: undefined,
  }

  emit('export', filters)
}

// Watch for external filter changes
watch(() => props.filters, newFilters => {
  if (newFilters) {
    localFilters.value = {
      search: newFilters.search || '',
      vehicle_type: newFilters.vehicle_type,
      status: newFilters.status,
    }
  }
}, { immediate: true })
</script>

<template>
  <div class="vehicle-table-organism">
    <!-- Table Header with Actions -->
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <h2 class="text-h5 mb-1">
          {{ t('vehicle.vehicles') }}
        </h2>
        <p class="text-body-2 text-medium-emphasis">
          {{ t('vehicle.totalVehicles', { count: totalItems }) }}
        </p>
      </div>

      <div class="d-flex gap-2">
        <VBtn
          variant="outlined"
          prepend-icon="tabler-filter"
          @click="showFilters = !showFilters"
        >
          {{ t('common.filters') }}
        </VBtn>

        <VBtn
          variant="outlined"
          prepend-icon="tabler-download"
          @click="handleExport"
        >
          {{ t('common.export') }}
        </VBtn>

        <VBtn
          color="primary"
          prepend-icon="tabler-plus"
          @click="$emit('create')"
        >
          {{ t('vehicle.createVehicle') }}
        </VBtn>
      </div>
    </div>

    <!-- Filters Panel -->
    <VExpandTransition>
      <VCard
        v-show="showFilters"
        class="mb-4"
      >
        <VCardText>
          <VRow>
            <VCol
              cols="12"
              md="3"
            >
              <VTextField
                v-model="localFilters.search"
                :label="t('common.search')"
                prepend-inner-icon="tabler-search"
                clearable
                @update:model-value="debouncedSearch"
              />
            </VCol>

            <VCol
              cols="12"
              md="3"
            >
              <VSelect
                v-model="localFilters.vehicle_type"
                :label="t('vehicle.type')"
                :items="vehicleTypeOptions"
                clearable
                @update:model-value="applyFilters"
              />
            </VCol>

            <VCol
              cols="12"
              md="3"
            >
              <VSelect
                v-model="localFilters.status"
                :label="t('common.status')"
                :items="statusOptions"
                clearable
                @update:model-value="applyFilters"
              />
            </VCol>

            <VCol
              cols="12"
              md="3"
            >
              <div class="d-flex gap-2">
                <VBtn
                  variant="outlined"
                  @click="clearFilters"
                >
                  {{ t('common.clear') }}
                </VBtn>
              </div>
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
    </VExpandTransition>

    <!-- Data Table -->
    <VDataTableServer
      v-model:items-per-page="itemsPerPage"
      v-model:page="page"
      v-model:sort-by="sortBy"
      :headers="headers"
      :items="vehicles"
      :items-length="totalItems"
      :loading="loading"
      :search="localFilters.search"
      class="elevation-1"
      item-value="id"
      hover
      @update:options="handleOptionsUpdate"
    >
      <!-- Vehicle Type Column -->
      <template #item.vehicle_type="{ item }">
        <div class="d-flex align-center gap-2">
          <VehicleTypeIconAtom
            :vehicle-type="item.vehicle_type"
            size="20"
          />
          <span>{{ getVehicleTypeLabel(item.vehicle_type) }}</span>
        </div>
      </template>

      <!-- Vehicle Info Column -->
      <template #item.vehicle_info="{ item }">
        <div>
          <div class="text-body-1 font-weight-medium">
            {{ item.plate_number }}
          </div>
          <div class="text-body-2 text-medium-emphasis">
            {{ item.brand }} {{ item.model }} ({{ item.year }})
          </div>
        </div>
      </template>

      <!-- Status Column -->
      <template #item.status="{ item }">
        <VehicleStatusChipAtom :status="item.status" />
      </template>

      <!-- Capacity Column -->
      <template #item.capacity="{ item }">
        <div class="d-flex align-center gap-1">
          <VIcon
            icon="tabler-users"
            size="16"
          />
          <span>{{ item.capacity }}</span>
        </div>
      </template>

      <!-- Inspection Column -->
      <template #item.inspection="{ item }">
        <div
          v-if="item.inspection_due"
          class="text-warning"
        >
          <VIcon
            icon="tabler-alert-circle"
            size="16"
            class="me-1"
          />
          {{ t('vehicle.inspectionDue') }}
        </div>
        <div
          v-else-if="item.next_inspection_date"
          class="text-success"
        >
          <VIcon
            icon="tabler-check-circle"
            size="16"
            class="me-1"
          />
          {{ formatDate(item.next_inspection_date) }}
        </div>
        <div
          v-else
          class="text-medium-emphasis"
        >
          {{ t('common.notSet') }}
        </div>
      </template>

      <!-- Actions Column -->
      <template #item.actions="{ item }">
        <div class="d-flex gap-1">
          <VBtn
            icon
            size="small"
            variant="text"
            @click="$emit('view', item)"
          >
            <VIcon icon="tabler-eye" />
            <VTooltip
              activator="parent"
              location="top"
            >
              {{ t('common.view') }}
            </VTooltip>
          </VBtn>

          <VBtn
            icon
            size="small"
            variant="text"
            @click="$emit('edit', item)"
          >
            <VIcon icon="tabler-edit" />
            <VTooltip
              activator="parent"
              location="top"
            >
              {{ t('common.edit') }}
            </VTooltip>
          </VBtn>

          <VBtn
            icon
            size="small"
            variant="text"
            color="error"
            @click="$emit('delete', item)"
          >
            <VIcon icon="tabler-trash" />
            <VTooltip
              activator="parent"
              location="top"
            >
              {{ t('common.delete') }}
            </VTooltip>
          </VBtn>
        </div>
      </template>

      <!-- Empty State -->
      <template #no-data>
        <div class="text-center py-8">
          <VIcon
            icon="tabler-car-off"
            size="64"
            class="text-disabled mb-4"
          />
          <h3 class="text-h6 mb-2">
            {{ t('vehicle.noVehicles') }}
          </h3>
          <p class="text-body-2 text-medium-emphasis mb-4">
            {{ t('vehicle.noVehiclesDescription') }}
          </p>
          <VBtn
            color="primary"
            prepend-icon="tabler-plus"
            @click="$emit('create')"
          >
            {{ t('vehicle.createFirstVehicle') }}
          </VBtn>
        </div>
      </template>

      <!-- Loading State -->
      <template #loading>
        <div class="text-center py-8">
          <VProgressCircular
            indeterminate
            color="primary"
          />
          <p class="text-body-2 mt-2">
            {{ t('common.loading') }}
          </p>
        </div>
      </template>
    </VDataTableServer>
  </div>
</template>

<style scoped>
.vehicle-table-organism {
  width: 100%;
}

:deep(.v-data-table__wrapper) {
  border-radius: 8px;
}

:deep(.v-data-table-header) {
  background-color: rgb(var(--v-theme-surface-variant));
}

:deep(.v-data-table__tr:hover) {
  background-color: rgb(var(--v-theme-surface-variant)) !important;
}
</style>
