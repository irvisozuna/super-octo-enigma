<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEquipmentStore } from '../stores/equipmentStore'
import { useEquipmentPermissions } from '../composables/useEquipmentPermissions'
import EquipmentForm from '../components/EquipmentForm.vue'
import EquipmentDetailDialog from '../components/EquipmentDetailDialog.vue'
import DeleteConfirmationDialog from '@/components/shared/DeleteConfirmationDialog.vue'

const { t } = useI18n()
const equipmentStore = useEquipmentStore()
const { canCreate, canView, canEdit, canDelete } = useEquipmentPermissions()

const loading = ref(false)
const showEquipmentDialog = ref(false)
const showDetailDialog = ref(false)
const showDeleteDialog = ref(false)
const isEditing = ref(false)
const selectedEquipment = ref(null)
const deleting = ref(false)

const filters = ref({
  search: '',
  types: [] as string[],
  statuses: [] as string[],
})

// Active filters for chips display
const activeFilters = computed(() => {
  const active: Array<{ key: string; label: string; value: any }> = []

  if (filters.value.search) {
    active.push({
      key: 'search',
      label: `Búsqueda: ${filters.value.search}`,
      value: filters.value.search,
    })
  }

  filters.value.types.forEach(type => {
    const option = typeOptions.value.find(opt => opt.value === type)
    if (option) {
      active.push({
        key: 'type',
        label: `Tipo: ${option.title}`,
        value: type,
      })
    }
  })

  filters.value.statuses.forEach(status => {
    const option = statusOptions.value.find(opt => opt.value === status)
    if (option) {
      active.push({
        key: 'status',
        label: `Estado: ${option.title}`,
        value: status,
      })
    }
  })

  return active
})

const hasActiveFilters = computed(() => activeFilters.value.length > 0)

const headers = computed(() => [
  { title: t('DrillingReportsModule.equipment.code'), key: 'equipment_code', sortable: true },
  { title: t('DrillingReportsModule.common.name'), key: 'equipment_name', sortable: true },
  { title: t('DrillingReportsModule.equipment.type'), key: 'equipment_type', sortable: true },
  { title: t('DrillingReportsModule.equipment.manufacturer'), key: 'manufacturer', sortable: true },
  { title: t('DrillingReportsModule.equipment.model'), key: 'model', sortable: true },
  { title: t('DrillingReportsModule.common.status'), key: 'status', sortable: true },
  { title: t('DrillingReportsModule.equipment.operatingHours'), key: 'operating_hours', sortable: true },
  { title: t('DrillingReportsModule.common.actions'), key: 'actions', sortable: false },
])

const equipment = computed(() => equipmentStore.equipment)
const pagination = computed(() => equipmentStore.pagination)

const typeOptions = computed(() => [
  { title: 'Equipo de perforación', value: 'drill_rig' },
  { title: 'Perforadora de núcleo', value: 'core_drill' },
  { title: 'Perforadora rotatoria', value: 'rotary_drill' },
  { title: 'Bomba', value: 'pump' },
  { title: 'Compresor', value: 'compressor' },
  { title: 'Generador', value: 'generator' },
  { title: 'Vehículo', value: 'vehicle' },
  { title: 'Otro', value: 'other' },
])

const statusOptions = computed(() => [
  { title: 'Activo', value: 'active' },
  { title: 'Inactivo', value: 'inactive' },
  { title: 'En mantenimiento', value: 'in_maintenance' },
  { title: 'Retirado', value: 'retired' },
  { title: 'Fuera de servicio', value: 'out_of_service' },
])

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    drill_rig: 'primary',
    core_drill: 'info',
    rotary_drill: 'secondary',
    pump: 'warning',
    compressor: 'cyan',
    generator: 'success',
    vehicle: 'purple',
    other: 'grey',
  }

  return colors[type] || 'grey'
}

const getTypeLabel = (type: string) => {
  const option = typeOptions.value.find(opt => opt.value === type)

  return option ? option.title : type
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    active: 'success',
    inactive: 'grey',
    in_maintenance: 'warning',
    retired: 'error',
    out_of_service: 'error',
  }

  return colors[status] || 'grey'
}

const getStatusLabel = (status: string) => {
  const option = statusOptions.value.find(opt => opt.value === status)

  return option ? option.title : status
}

let searchTimeout: NodeJS.Timeout

const handleSearch = () => {
  // Debounce search
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    // Reset to page 1 when searching
    equipmentStore.setPage(1)
    loadEquipment()
  }, 300)
}

const handleFilterChange = () => {
  // Reset to page 1 when filters change
  equipmentStore.setPage(1)
  loadEquipment()
}

// Handle VDataTableServer options update (pagination, sorting)
const handleOptionsUpdate = (options: any) => {
  const { page, itemsPerPage, sortBy } = options

  const params: any = {
    search: filters.value.search,
    page,
    per_page: itemsPerPage,
  }

  // Handle multiple types (join with comma for backend)
  if (filters.value.types.length > 0)
    params.equipment_type = filters.value.types.join(',')

  // Handle multiple statuses (join with comma for backend)
  if (filters.value.statuses.length > 0)
    params.status = filters.value.statuses.join(',')

  // Handle sorting
  if (sortBy && sortBy.length > 0) {
    params.sort_by = sortBy[0].key
    params.sort_order = sortBy[0].order === 'desc' ? 'desc' : 'asc'
  }

  loading.value = true
  equipmentStore.fetchEquipment(params)
    .catch(error => {
      console.error('Error loading equipment:', error)
    })
    .finally(() => {
      loading.value = false
    })
}

// Clear all filters
const clearAllFilters = () => {
  filters.value.search = ''
  filters.value.types = []
  filters.value.statuses = []
  equipmentStore.setPage(1)
  loadEquipment()
}

// Remove individual filter
const removeFilter = (filter: { key: string; value: any }) => {
  if (filter.key === 'search') {
    filters.value.search = ''
  }
  else if (filter.key === 'type') {
    const index = filters.value.types.indexOf(filter.value)
    if (index > -1)
      filters.value.types.splice(index, 1)
  }
  else if (filter.key === 'status') {
    const index = filters.value.statuses.indexOf(filter.value)
    if (index > -1)
      filters.value.statuses.splice(index, 1)
  }

  equipmentStore.setPage(1)
  loadEquipment()
}

const handleCreateEquipment = () => {
  isEditing.value = false
  selectedEquipment.value = null
  showEquipmentDialog.value = true
}

const handleViewEquipment = (equipment: any) => {
  selectedEquipment.value = equipment
  showDetailDialog.value = true
}

const handleEditEquipment = (equipment: any) => {
  isEditing.value = true
  selectedEquipment.value = equipment
  showEquipmentDialog.value = true
}

const handleDeleteEquipment = (equipment: any) => {
  selectedEquipment.value = equipment
  showDeleteDialog.value = true
}

const confirmDeleteEquipment = async () => {
  if (!selectedEquipment.value)
    return

  deleting.value = true
  try {
    await equipmentStore.deleteEquipment(selectedEquipment.value.id)
    showDeleteDialog.value = false
    selectedEquipment.value = null
    loadEquipment()
  }
  catch (error) {
    console.error('Error deleting equipment:', error)
  }
  finally {
    deleting.value = false
  }
}

const closeDeleteDialog = () => {
  showDeleteDialog.value = false
  selectedEquipment.value = null
}

const handleEquipmentSubmit = async () => {
  showEquipmentDialog.value = false
  loadEquipment()
}

const loadEquipment = async () => {
  loading.value = true
  try {
    const params: any = {
      search: filters.value.search,
      page: pagination.value.current_page,
      per_page: pagination.value.per_page,
    }

    // Handle multiple types
    if (filters.value.types.length > 0)
      params.equipment_type = filters.value.types.join(',')

    // Handle multiple statuses
    if (filters.value.statuses.length > 0)
      params.status = filters.value.statuses.join(',')

    await equipmentStore.fetchEquipment(params)
  }
  catch (error) {
    console.error('Error loading equipment:', error)
  }
  finally {
    loading.value = false
  }
}

// No need for onMounted - VDataTableServer handles initial load via @update:options
</script>

<template>
  <div class="equipment-list">
    <VCard>
      <VCardTitle>
        <VIcon
          icon="tabler-settings"
          class="me-2"
        />
        {{ $t('DrillingReportsModule.equipment.title') }}
      </VCardTitle>

      <VCardText>
        <!-- Filters -->
        <VRow class="mb-4">
          <VCol
            cols="12"
            md="3"
          >
            <VTextField
              v-model="filters.search"
              :label="$t('DrillingReportsModule.common.search')"
              prepend-inner-icon="tabler-search"
              clearable
              @input="handleSearch"
            />
          </VCol>
          <VCol
            cols="12"
            md="3"
          >
            <VSelect
              v-model="filters.types"
              :items="typeOptions"
              :label="$t('DrillingReportsModule.equipment.type')"
              multiple
              chips
              closable-chips
              clearable
              @update:model-value="handleFilterChange"
            />
          </VCol>
          <VCol
            cols="12"
            md="3"
          >
            <VSelect
              v-model="filters.statuses"
              :items="statusOptions"
              :label="$t('DrillingReportsModule.common.status')"
              multiple
              chips
              closable-chips
              clearable
              @update:model-value="handleFilterChange"
            />
          </VCol>
          <VCol
            cols="12"
            md="3"
          >
            <VBtn
              color="primary"
              :disabled="!canCreate"
              @click="handleCreateEquipment"
            >
              <VIcon
                icon="tabler-plus"
                class="me-2"
              />
              {{ $t('DrillingReportsModule.common.create') }}
            </VBtn>
          </VCol>
        </VRow>

        <!-- Active Filters Chips -->
        <VRow
          v-if="hasActiveFilters"
          class="mb-4"
        >
          <VCol cols="12">
            <div class="d-flex align-center gap-2 flex-wrap">
              <span class="text-body-2 text-medium-emphasis">Filtros activos:</span>
              <VChip
                v-for="filter in activeFilters"
                :key="`${filter.key}-${filter.value}`"
                closable
                size="small"
                color="primary"
                variant="tonal"
                @click:close="removeFilter(filter)"
              >
                {{ filter.label }}
              </VChip>
              <VBtn
                variant="text"
                color="error"
                size="small"
                @click="clearAllFilters"
              >
                <VIcon
                  icon="tabler-x"
                  class="me-1"
                />
                Limpiar todo
              </VBtn>
            </div>
          </VCol>
        </VRow>

        <!-- Equipment Table -->
        <VDataTableServer
          v-model:items-per-page="pagination.per_page"
          v-model:page="pagination.current_page"
          :headers="headers"
          :items="equipment"
          :items-length="pagination.total"
          :loading="loading"
          item-value="id"
          @update:options="handleOptionsUpdate"
        >
          <template #item.equipment_name="{ item }">
            <VBtn
              variant="text"
              color="primary"
              @click="handleViewEquipment(item)"
            >
              {{ item.equipment_name }}
            </VBtn>
          </template>

          <template #item.equipment_type="{ item }">
            <VChip
              :color="getTypeColor(item.equipment_type)"
              size="small"
            >
              {{ getTypeLabel(item.equipment_type) }}
            </VChip>
          </template>

          <template #item.status="{ item }">
            <VChip
              :color="getStatusColor(item.status)"
              size="small"
            >
              {{ getStatusLabel(item.status) }}
            </VChip>
          </template>

          <template #item.manufacturer="{ item }">
            {{ item.manufacturer || '-' }}
          </template>

          <template #item.model="{ item }">
            {{ item.model || '-' }}
          </template>

          <template #item.operating_hours="{ item }">
            {{ item.operating_hours?.toFixed(1) || '0.0' }} hrs
          </template>

          <template #item.actions="{ item }">
            <VBtn
              icon="tabler-eye"
              size="small"
              variant="text"
              :disabled="!canView"
              @click="handleViewEquipment(item)"
            />
            <VBtn
              icon="tabler-edit"
              size="small"
              variant="text"
              :disabled="!canEdit"
              @click="handleEditEquipment(item)"
            />
            <VBtn
              icon="tabler-trash"
              size="small"
              variant="text"
              color="error"
              :disabled="!canDelete"
              @click="handleDeleteEquipment(item)"
            />
          </template>

          <!-- Empty State -->
          <template #no-data>
            <div class="text-center pa-12">
              <VIcon
                icon="tabler-settings-off"
                size="64"
                class="text-medium-emphasis mb-4"
              />
              <h5 class="text-h5 mb-2">
                No hay equipos
              </h5>
              <p class="text-body-2 text-medium-emphasis mb-6">
                Aún no se han creado equipos
              </p>
              <VBtn
                v-if="canCreate"
                color="primary"
                prepend-icon="tabler-plus"
                @click="handleCreateEquipment"
              >
                Crear Primer Equipo
              </VBtn>
            </div>
          </template>
        </VDataTableServer>
      </VCardText>
    </VCard>

    <!-- Create/Edit Equipment Dialog -->
    <VDialog
      v-model="showEquipmentDialog"
      max-width="800"
    >
      <EquipmentForm
        :equipment="selectedEquipment"
        :is-editing="isEditing"
        :show-close-button="false"
        @submit="handleEquipmentSubmit"
        @cancel="showEquipmentDialog = false"
      />
    </VDialog>

    <!-- Equipment Detail Dialog -->
    <EquipmentDetailDialog
      v-model="showDetailDialog"
      :equipment="selectedEquipment"
    />

    <!-- Delete Confirmation Dialog -->
    <DeleteConfirmationDialog
      :visible="showDeleteDialog"
      :title="`Eliminar ${selectedEquipment?.equipment_name || 'Equipo'}`"
      entity-name="equipo"
      :entity-id="selectedEquipment?.equipment_code"
      :loading="deleting"
      confirmation-word="ELIMINAR"
      warning-message="Esta acción eliminará permanentemente el equipo del sistema. Toda la información relacionada con este equipo se perderá."
      @close="closeDeleteDialog"
      @confirm="confirmDeleteEquipment"
    >
      <template #entity-info>
        <div>
          <div class="font-weight-bold">
            {{ selectedEquipment?.equipment_name }}
          </div>
          <div class="text-caption">
            Tipo: {{ selectedEquipment?.equipment_type }}
          </div>
        </div>
      </template>
      <template #confirmation-text>
        el equipo <strong>{{ selectedEquipment?.equipment_name }}</strong>
      </template>
    </DeleteConfirmationDialog>
  </div>
</template>

<style scoped>
.equipment-list {
  inline-size: 100%;
}
</style>
