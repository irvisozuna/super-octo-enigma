<script setup lang="ts">
import { nextTick, onMounted } from 'vue'
import debounce from 'lodash/debounce'
import { useI18n } from 'vue-i18n'
import { useEmployeeStore } from '../stores/employeeStore'
import type { EmployeeEntity } from '../../domain/entities/EmployeeEntity'

// Composables
const { t } = useI18n()
const router = useRouter()

// Store
const employeeStore = useEmployeeStore()

// Headers para la tabla
const headers = [
  { title: t('employee.fields.employee_code'), key: 'employee_code' },
  { title: t('employee.fields.full_name'), key: 'full_name' },
  { title: t('employee.fields.position'), key: 'position' },
  { title: t('employee.fields.department'), key: 'department' },
  { title: t('employee.fields.employment_type'), key: 'employment_type' },
  { title: t('common.status'), key: 'status' },
  { title: t('common.actions'), key: 'actions', sortable: false },
]

// Opciones del menú de exportación
const menuOptions = [
  {
    text: t('common.export_excel'),
    icon: 'tabler-file-spreadsheet',
    action: () => exportItems('excel'),
  },
  {
    text: t('common.export_pdf'),
    icon: 'tabler-file-type-pdf',
    action: () => exportItems('pdf'),
  },
  {
    text: t('common.export_csv'),
    icon: 'tabler-file-text',
    action: () => exportItems('csv'),
  },
]

// Métodos
const debouncedFetchList = debounce(() => {
  employeeStore.fetchList()
}, 500)

function applyFilters() {
  debouncedFetchList()
}

function clearFilters() {
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

function navigateToView(item: EmployeeEntity) {
  router.push({ name: 'employees-detail', params: { id: item.id } })
}

function navigateToEdit(item: EmployeeEntity) {
  router.push({ name: 'employees-edit', params: { id: item.id } })
}

async function deleteEmployee(item: EmployeeEntity) {
  if (confirm(t('employee.confirm_delete', { name: item.full_name }))) {
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
  return t(`employee.positions.${position}`)
}

function getEmploymentTypeLabel(type: string) {
  return t(`employee.employment_types.${type}`)
}

// onMounted
onMounted(() => {
  employeeStore.fetchList()
})
</script>

<template>
  <VCard>
    <VCardTitle>
      <div class="d-flex align-center justify-space-between">
        <div>
          <h4 class="text-h4 mb-1">
            {{ t('employee.title') }}
          </h4>
          <p class="text-body-1 mb-0">
            {{ t('employee.list_description') }}
          </p>
        </div>
      </div>
    </VCardTitle>

    <VCardText>
      <!-- Filtros -->
      <VRow class="mb-4">
        <VCol
          cols="12"
          md="3"
        >
          <VTextField
            v-model="employeeStore.filters.search"
            :label="t('employee.search_placeholder')"
            prepend-inner-icon="tabler-search"
            variant="outlined"
            density="compact"
            clearable
            @input="applyFilters"
            @click:clear="clearFilters"
          />
        </VCol>

        <VCol
          cols="12"
          md="2"
        >
          <VSelect
            v-model="employeeStore.filters.status"
            :label="t('common.status')"
            :items="[
              { value: 'active', title: t('employee.status.active') },
              { value: 'inactive', title: t('employee.status.inactive') },
              { value: 'suspended', title: t('employee.status.suspended') },
              { value: 'terminated', title: t('employee.status.terminated') },
              { value: 'vacation', title: t('employee.status.vacation') },
            ]"
            variant="outlined"
            density="compact"
            clearable
            @update:model-value="applyFilters"
          />
        </VCol>

        <VCol
          cols="12"
          md="2"
        >
          <VSelect
            v-model="employeeStore.filters.position"
            :label="t('employee.fields.position')"
            :items="[
              { value: 'operator', title: t('employee.positions.operator') },
              { value: 'helper', title: t('employee.positions.helper') },
              { value: 'manager', title: t('employee.positions.manager') },
              { value: 'supervisor', title: t('employee.positions.supervisor') },
              { value: 'admin', title: t('employee.positions.admin') },
            ]"
            variant="outlined"
            density="compact"
            clearable
            @update:model-value="applyFilters"
          />
        </VCol>

        <VCol
          cols="12"
          md="2"
        >
          <VSelect
            v-model="employeeStore.filters.employment_type"
            :label="t('employee.fields.employment_type')"
            :items="[
              { value: 'full_time', title: t('employee.employment_types.full_time') },
              { value: 'part_time', title: t('employee.employment_types.part_time') },
              { value: 'contractor', title: t('employee.employment_types.contractor') },
              { value: 'temporary', title: t('employee.employment_types.temporary') },
            ]"
            variant="outlined"
            density="compact"
            clearable
            @update:model-value="applyFilters"
          />
        </VCol>

        <VCol
          cols="12"
          md="3"
          class="d-flex gap-2 align-center justify-end"
        >
          <!-- Botón para exportar -->
          <VMenu>
            <template #activator="{ props }">
              <VBtn
                v-bind="props"
                variant="outlined"
                :loading="employeeStore.loading"
                :disabled="!employeeStore.hasItems"
              >
                <VIcon start>
                  tabler-download
                </VIcon>
                {{ t('common.export') }}
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

          <!-- Botón para agregar -->
          <VBtn
            color="primary"
            :to="{ name: 'employees-create' }"
          >
            <VIcon start>
              tabler-plus
            </VIcon>
            {{ t('employee.actions.add') }}
          </VBtn>
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
        @update:options="employeeStore.fetchList"
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
            {{ t(`employee.status.${item.status}`) }}
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
              {{ t('employee.no_data') }}
            </h6>
            <p class="text-body-2 mb-4">
              {{ t('employee.no_data_description') }}
            </p>
            <VBtn
              color="primary"
              :to="{ name: 'employees-create' }"
            >
              <VIcon start>
                tabler-plus
              </VIcon>
              {{ t('employee.actions.add') }}
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
