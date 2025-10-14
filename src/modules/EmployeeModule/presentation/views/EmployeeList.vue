<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import debounce from 'lodash/debounce'
import { useI18n } from 'vue-i18n'
import { useEmployeeStore } from '../stores/employeeStore'
import type { EmployeeEntity } from '../../domain/entities/EmployeeEntity'

// Composables
const { t } = useI18n()
const router = useRouter()

// Store
const employeeStore = useEmployeeStore()

// Estado local para filtros múltiples
const selectedStatuses = ref<string[]>([])
const selectedPositions = ref<string[]>([])
const selectedEmploymentTypes = ref<string[]>([])

// Headers para la tabla
const headers = [
  { title: t('EmployeeModule.employee.fields.employee_code'), key: 'employee_code' },
  { title: t('EmployeeModule.employee.fields.full_name'), key: 'full_name' },
  { title: t('EmployeeModule.employee.fields.position'), key: 'position' },
  { title: t('EmployeeModule.employee.fields.department'), key: 'department' },
  { title: t('EmployeeModule.employee.fields.employment_type'), key: 'employment_type' },
  { title: t('EmployeeModule.common.status'), key: 'status' },
  { title: t('EmployeeModule.common.actions'), key: 'actions', sortable: false },
]

// Opciones del menú de exportación
const menuOptions = [
  {
    text: t('EmployeeModule.common.export_excel'),
    icon: 'tabler-file-spreadsheet',
    action: () => exportItems('excel'),
  },
  {
    text: t('EmployeeModule.common.export_pdf'),
    icon: 'tabler-file-type-pdf',
    action: () => exportItems('pdf'),
  },
  {
    text: t('EmployeeModule.common.export_csv'),
    icon: 'tabler-file-text',
    action: () => exportItems('csv'),
  },
]

// Opciones para los selects
const statusOptions = [
  { value: 'active', title: t('EmployeeModule.employee.status.active'), color: 'success' },
  { value: 'inactive', title: t('EmployeeModule.employee.status.inactive'), color: 'warning' },
  { value: 'suspended', title: t('EmployeeModule.employee.status.suspended'), color: 'error' },
  { value: 'terminated', title: t('EmployeeModule.employee.status.terminated'), color: 'error' },
  { value: 'vacation', title: t('EmployeeModule.employee.status.vacation'), color: 'info' },
]

const positionOptions = [
  { value: 'operator', title: t('EmployeeModule.employee.positions.operator') },
  { value: 'helper', title: t('EmployeeModule.employee.positions.helper') },
  { value: 'manager', title: t('EmployeeModule.employee.positions.manager') },
  { value: 'supervisor', title: t('EmployeeModule.employee.positions.supervisor') },
  { value: 'admin', title: t('EmployeeModule.employee.positions.admin') },
]

const employmentTypeOptions = [
  { value: 'full_time', title: t('EmployeeModule.employee.employment_types.full_time') },
  { value: 'part_time', title: t('EmployeeModule.employee.employment_types.part_time') },
  { value: 'contractor', title: t('EmployeeModule.employee.employment_types.contractor') },
  { value: 'temporary', title: t('EmployeeModule.employee.employment_types.temporary') },
]

// Computed para chips de filtros activos
const activeFilters = computed(() => {
  const filters: Array<{ label: string; value: string; type: string }> = []

  if (employeeStore.filters.search) {
    filters.push({
      label: `Búsqueda: ${employeeStore.filters.search}`,
      value: 'search',
      type: 'search',
    })
  }

  selectedStatuses.value.forEach(status => {
    const option = statusOptions.find(o => o.value === status)
    if (option) {
      filters.push({
        label: option.title,
        value: status,
        type: 'status',
      })
    }
  })

  selectedPositions.value.forEach(position => {
    const option = positionOptions.find(o => o.value === position)
    if (option) {
      filters.push({
        label: option.title,
        value: position,
        type: 'position',
      })
    }
  })

  selectedEmploymentTypes.value.forEach(type => {
    const option = employmentTypeOptions.find(o => o.value === type)
    if (option) {
      filters.push({
        label: option.title,
        value: type,
        type: 'employment_type',
      })
    }
  })

  return filters
})

const hasActiveFilters = computed(() => activeFilters.value.length > 0)

// Métodos
const debouncedFetchList = debounce(() => {
  applyFiltersToStore()
}, 500)

function applyFiltersToStore() {
  employeeStore.updateFilters({
    status: selectedStatuses.value.length > 0 ? selectedStatuses.value.join(',') : undefined,
    position: selectedPositions.value.length > 0 ? selectedPositions.value.join(',') : undefined,
    employment_type: selectedEmploymentTypes.value.length > 0 ? selectedEmploymentTypes.value.join(',') : undefined,
  })
  employeeStore.fetchList()
}

function applyFilters() {
  debouncedFetchList()
}

function clearFilters() {
  selectedStatuses.value = []
  selectedPositions.value = []
  selectedEmploymentTypes.value = []

  employeeStore.updateFilters({
    search: '',
    status: undefined,
    position: undefined,
    department: '',
    employment_type: undefined,
  })

  nextTick(() => {
    employeeStore.fetchList()
  })
}

function removeFilter(filter: { type: string; value: string }) {
  if (filter.type === 'search')
    employeeStore.filters.search = ''

  else if (filter.type === 'status')
    selectedStatuses.value = selectedStatuses.value.filter(s => s !== filter.value)

  else if (filter.type === 'position')
    selectedPositions.value = selectedPositions.value.filter(p => p !== filter.value)

  else if (filter.type === 'employment_type')
    selectedEmploymentTypes.value = selectedEmploymentTypes.value.filter(t => t !== filter.value)

  applyFiltersToStore()
}

function navigateToView(item: EmployeeEntity) {
  router.push({ name: 'employees-detail', params: { id: item.id } })
}

function navigateToEdit(item: EmployeeEntity) {
  router.push({ name: 'employees-edit', params: { id: item.id } })
}

async function deleteEmployee(item: EmployeeEntity) {
  if (confirm(t('EmployeeModule.employee.confirm_delete', { name: item.full_name }))) {
    try {
      await employeeStore.deleteItem(item.id)
    }
    catch (error) {
      console.error('Error deleting employee:', error)
    }
  }
}

async function exportItems(format: 'excel' | 'pdf' | 'csv') {
  try {
    await employeeStore.exportData(format)
  }
  catch (error) {
    console.error('Error exporting:', error)
  }
}

// Métodos auxiliares para los chips
function getStatusColor(status: string) {
  const colors = {
    active: 'success',
    inactive: 'warning',
    suspended: 'error',
    terminated: 'error',
    vacation: 'info',
  }

  return colors[status?.toLowerCase()] || 'grey'
}

function getPositionLabel(position: string) {
  return t(`EmployeeModule.employee.positions.${position}`)
}

function getEmploymentTypeLabel(type: string) {
  return t(`EmployeeModule.employee.employment_types.${type}`)
}

// Handle VDataTableServer options update (pagination, sorting)
function handleOptionsUpdate(options: any) {
  const { page, itemsPerPage, sortBy } = options

  const filters: any = {
    page,
    per_page: itemsPerPage,
  }

  // Handle sorting
  if (sortBy && sortBy.length > 0) {
    filters.sort_by = sortBy[0].key
    filters.sort_order = sortBy[0].order || 'asc'
  }

  employeeStore.fetchList(filters)
}

// No need for onMounted fetchList - VDataTableServer handles initial load via @update:options
</script>

<template>
  <VCard>
    <!-- Header mejorado con contador -->
    <VCardTitle class="d-flex align-center justify-space-between flex-wrap gap-4 pa-5">
      <div>
        <h4 class="text-h4 mb-1">
          {{ t('EmployeeModule.employee.title') }}
          <VChip
            v-if="employeeStore.totalItems > 0"
            size="small"
            color="primary"
            variant="tonal"
            class="ml-2"
          >
            {{ employeeStore.totalItems }}
          </VChip>
        </h4>
        <p class="text-body-2 text-medium-emphasis mb-0">
          {{ t('EmployeeModule.employee.list_description') }}
        </p>
      </div>

      <!-- Botones de acción principales -->
      <div class="d-flex gap-3">
        <VMenu>
          <template #activator="{ props }">
            <VBtn
              v-bind="props"
              variant="outlined"
              color="secondary"
              :loading="employeeStore.loading"
              :disabled="!employeeStore.hasItems"
            >
              <VIcon start>
                tabler-download
              </VIcon>
              {{ t('EmployeeModule.common.export') }}
            </VBtn>
          </template>

          <VList>
            <VListItem
              v-for="option in menuOptions"
              :key="option.text"
              @click="option.action"
            >
              <template #prepend>
                <VIcon :icon="option.icon" />
              </template>
              <VListItemTitle>{{ option.text }}</VListItemTitle>
            </VListItem>
          </VList>
        </VMenu>

        <VBtn
          color="primary"
          :to="{ name: 'employees-create' }"
        >
          <VIcon start>
            tabler-plus
          </VIcon>
          {{ t('EmployeeModule.employee.actions.add') }}
        </VBtn>
      </div>
    </VCardTitle>

    <VDivider />

    <VCardText>
      <!-- Sección de Filtros Mejorada -->
      <VRow class="mb-3">
        <!-- Búsqueda -->
        <VCol
          cols="12"
          md="4"
        >
          <VTextField
            v-model="employeeStore.filters.search"
            :label="t('EmployeeModule.employee.search_placeholder')"
            prepend-inner-icon="tabler-search"
            variant="outlined"
            density="compact"
            clearable
            hide-details
            @input="applyFilters"
          />
        </VCol>

        <!-- Estado - Múltiple -->
        <VCol
          cols="12"
          sm="6"
          md="3"
        >
          <VSelect
            v-model="selectedStatuses"
            :label="t('EmployeeModule.common.status')"
            :items="statusOptions"
            variant="outlined"
            density="compact"
            multiple
            chips
            closable-chips
            hide-details
            @update:model-value="applyFilters"
          >
            <template #chip="{ item, index }">
              <VChip
                size="small"
                closable
                @click:close="selectedStatuses.splice(index, 1); applyFilters()"
              >
                {{ item.title }}
              </VChip>
            </template>
          </VSelect>
        </VCol>

        <!-- Puesto - Múltiple -->
        <VCol
          cols="12"
          sm="6"
          md="3"
        >
          <VSelect
            v-model="selectedPositions"
            :label="t('EmployeeModule.employee.fields.position')"
            :items="positionOptions"
            variant="outlined"
            density="compact"
            multiple
            chips
            closable-chips
            hide-details
            @update:model-value="applyFilters"
          >
            <template #chip="{ item, index }">
              <VChip
                size="small"
                closable
                @click:close="selectedPositions.splice(index, 1); applyFilters()"
              >
                {{ item.title }}
              </VChip>
            </template>
          </VSelect>
        </VCol>

        <!-- Tipo de Empleo - Múltiple -->
        <VCol
          cols="12"
          sm="6"
          md="2"
        >
          <VSelect
            v-model="selectedEmploymentTypes"
            :label="t('EmployeeModule.employee.fields.employment_type')"
            :items="employmentTypeOptions"
            variant="outlined"
            density="compact"
            multiple
            chips
            closable-chips
            hide-details
            @update:model-value="applyFilters"
          >
            <template #chip="{ item, index }">
              <VChip
                size="small"
                closable
                @click:close="selectedEmploymentTypes.splice(index, 1); applyFilters()"
              >
                {{ item.title }}
              </VChip>
            </template>
          </VSelect>
        </VCol>
      </VRow>

      <!-- Chips de filtros activos -->
      <VRow v-if="hasActiveFilters">
        <VCol cols="12">
          <VAlert
            color="primary"
            variant="tonal"
            density="compact"
            border="start"
            border-color="primary"
            class="mb-0"
          >
            <div class="d-flex align-center flex-wrap gap-2">
              <span class="text-body-2 font-weight-medium">
                <VIcon
                  size="18"
                  class="me-1"
                >
                  tabler-filter
                </VIcon>
                Filtros activos:
              </span>

              <VChip
                v-for="filter in activeFilters"
                :key="`${filter.type}-${filter.value}`"
                size="small"
                closable
                color="primary"
                @click:close="removeFilter(filter)"
              >
                {{ filter.label }}
              </VChip>

              <VSpacer />

              <VBtn
                size="small"
                variant="text"
                color="error"
                prepend-icon="tabler-x"
                @click="clearFilters"
              >
                Limpiar todo
              </VBtn>
            </div>
          </VAlert>
        </VCol>
      </VRow>

      <!-- Tabla de empleados -->
      <VDataTableServer
        v-model:items-per-page="employeeStore.pagination.per_page"
        v-model:page="employeeStore.pagination.current_page"
        :headers="headers"
        :items="employeeStore.items"
        :items-length="employeeStore.totalItems"
        :loading="employeeStore.loading"
        class="elevation-1"
        item-value="id"
        @update:options="handleOptionsUpdate"
      >
        <!-- Slot para código de empleado -->
        <template #item.employee_code="{ item }">
          <div class="d-flex align-center">
            <VIcon
              size="20"
              class="me-2"
            >
              tabler-id
            </VIcon>
            <span class="font-weight-medium">{{ item.employee_code }}</span>
          </div>
        </template>

        <!-- Slot para nombre completo -->
        <template #item.full_name="{ item }">
          <div class="d-flex align-center">
            <VAvatar
              size="32"
              :color="item.photo_url ? undefined : 'primary'"
              class="me-2"
            >
              <VImg
                v-if="item.photo_url"
                :src="item.photo_url"
              />
              <span v-else>{{ item.first_name?.charAt(0) }}{{ item.last_name?.charAt(0) }}</span>
            </VAvatar>
            <div>
              <div class="font-weight-medium">
                {{ item.full_name }}
              </div>
              <div
                v-if="item.email"
                class="text-caption text-disabled"
              >
                {{ item.email }}
              </div>
            </div>
          </div>
        </template>

        <!-- Slot para posición -->
        <template #item.position="{ item }">
          <VChip
            size="small"
            variant="tonal"
          >
            {{ getPositionLabel(item.position) }}
          </VChip>
        </template>

        <!-- Slot para tipo de empleo -->
        <template #item.employment_type="{ item }">
          {{ getEmploymentTypeLabel(item.employment_type) }}
        </template>

        <!-- Slot para estatus -->
        <template #item.status="{ item }">
          <VChip
            :color="getStatusColor(item.status)"
            size="small"
            variant="tonal"
          >
            {{ t(`EmployeeModule.employee.status.${item.status}`) }}
          </VChip>
        </template>

        <!-- Slot para acciones -->
        <template #item.actions="{ item }">
          <div class="d-flex gap-2">
            <VBtn
              icon
              variant="text"
              size="small"
              color="default"
              @click="navigateToView(item)"
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
              @click="navigateToEdit(item)"
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
              @click="deleteEmployee(item)"
            >
              <VIcon size="22">
                tabler-trash
              </VIcon>
            </VBtn>
          </div>
        </template>

        <!-- Slot para cuando no hay datos -->
        <template #no-data>
          <div class="text-center pa-8">
            <VIcon
              size="64"
              color="grey-lighten-1"
              class="mb-4"
            >
              tabler-users-off
            </VIcon>
            <h6 class="text-h6 mb-2">
              {{ t('EmployeeModule.employee.no_data') }}
            </h6>
            <p class="text-body-2 mb-4">
              {{ t('EmployeeModule.employee.no_data_description') }}
            </p>
            <VBtn
              color="primary"
              :to="{ name: 'employees-create' }"
            >
              <VIcon start>
                tabler-plus
              </VIcon>
              {{ t('EmployeeModule.employee.actions.add') }}
            </VBtn>
          </div>
        </template>
      </VDataTableServer>
    </VCardText>
  </VCard>
</template>

<style scoped>
.filter-field {
  min-inline-size: 200px;
}
</style>
