<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEquipmentStore } from '../stores/equipmentStore'
import { useEquipmentPermissions } from '../composables/useEquipmentPermissions'
import EquipmentForm from '../components/EquipmentForm.vue'

const { t } = useI18n()
const equipmentStore = useEquipmentStore()
const { canCreate, canView, canEdit, canDelete } = useEquipmentPermissions()

const loading = ref(false)
const showEquipmentDialog = ref(false)
const isEditing = ref(false)
const selectedEquipment = ref(null)

const filters = ref({
  search: '',
  type: '',
  status: '',
})

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

const handleSearch = () => {
  // Debounce search
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadEquipment()
  }, 300)
}

let searchTimeout: NodeJS.Timeout

const handleFilterChange = () => {
  loadEquipment()
}

const handlePageChange = (page: number) => {
  equipmentStore.setPage(page)
  loadEquipment()
}

const handleItemsPerPageChange = (itemsPerPage: number) => {
  equipmentStore.setItemsPerPage(itemsPerPage)
  loadEquipment()
}

const handleCreateEquipment = () => {
  isEditing.value = false
  selectedEquipment.value = null
  showEquipmentDialog.value = true
}

const handleViewEquipment = (equipment: any) => {
  // Navigate to equipment detail view
  console.log('View equipment:', equipment)
}

const handleEditEquipment = (equipment: any) => {
  isEditing.value = true
  selectedEquipment.value = equipment
  showEquipmentDialog.value = true
}

const handleDeleteEquipment = async (equipment: any) => {
  if (confirm(t('DrillingReportsModule.common.confirmDelete'))) {
    try {
      await equipmentStore.deleteEquipment(equipment.id)
      loadEquipment()
    }
    catch (error) {
      console.error('Error deleting equipment:', error)
    }
  }
}

const handleEquipmentSubmit = async () => {
  showEquipmentDialog.value = false
  loadEquipment()
}

const loadEquipment = async () => {
  loading.value = true
  try {
    await equipmentStore.fetchEquipment({
      search: filters.value.search,
      equipment_type: filters.value.type,
      status: filters.value.status,
      page: pagination.value.current_page,
      per_page: pagination.value.per_page,
    })
  }
  catch (error) {
    console.error('Error loading equipment:', error)
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  loadEquipment()
})
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
              v-model="filters.type"
              :items="typeOptions"
              :label="$t('DrillingReportsModule.equipment.type')"
              clearable
              @change="handleFilterChange"
            />
          </VCol>
          <VCol
            cols="12"
            md="3"
          >
            <VSelect
              v-model="filters.status"
              :items="statusOptions"
              :label="$t('DrillingReportsModule.common.status')"
              clearable
              @change="handleFilterChange"
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

        <!-- Equipment Table -->
        <VDataTable
          :headers="headers"
          :items="equipment"
          :loading="loading"
          :items-per-page="pagination.per_page"
          :page="pagination.current_page"
          :server-items-length="pagination.total"
          @update:page="handlePageChange"
          @update:items-per-page="handleItemsPerPageChange"
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
              :disabled="!canEdit(item)"
              @click="handleEditEquipment(item)"
            />
            <VBtn
              icon="tabler-trash"
              size="small"
              variant="text"
              color="error"
              :disabled="!canDelete(item)"
              @click="handleDeleteEquipment(item)"
            />
          </template>
        </VDataTable>
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
  </div>
</template>

<style scoped>
.equipment-list {
  inline-size: 100%;
}
</style>
