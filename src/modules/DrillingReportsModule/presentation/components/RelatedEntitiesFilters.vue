<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useProjects } from '../composables/useProjects'
import { useWells } from '../composables/useWells'
import { useEmployees } from '../composables/useEmployees'
import { useTools } from '../composables/useTools'
import { useEquipment } from '../composables/useEquipment'
import { DOCUMENT_TYPES } from '../../shared/constants/DocumentConstants'

interface Props {
  modelValue?: any
}

interface Emits {
  (e: 'update:modelValue', value: any): void
  (e: 'filtersChanged', filters: any): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({}),
})

const emit = defineEmits<Emits>()

const { projects, fetchProjectsSimple: fetchProjects } = useProjects()
const { wells, fetchWellsByProjectSimple: fetchWellsByProject } = useWells()
const { employees, fetchEmployeesSimple: fetchEmployees } = useEmployees()
const { tools, fetchTools } = useTools()
const { equipment, fetchEquipmentSimple: fetchEquipment } = useEquipment()

const filters = ref({
  project_id: '',
  well_id: '',
  employee_id: '',
  tool_id: '',
  equipment_id: '',
  document_type: '',
  date_from: '',
  date_to: '',
  search: '',
})

const projectOptions = computed(() =>
  projects.value.map(project => ({
    title: project.name,
    value: project.id,
  })),
)

const wellOptions = computed(() =>
  wells.value.map(well => ({
    title: well.name,
    value: well.id,
  })),
)

const employeeOptions = computed(() =>
  employees.value.map(employee => ({
    title: `${employee.first_name} ${employee.last_name}`,
    value: employee.id,
  })),
)

const toolOptions = computed(() =>
  tools.value.map(tool => ({
    title: tool.name,
    value: tool.id,
  })),
)

const equipmentOptions = computed(() =>
  equipment.value.map(eq => ({
    title: eq.name,
    value: eq.id,
  })),
)

const documentTypeOptions = computed(() =>
  DOCUMENT_TYPES.map(type => ({
    title: type.label,
    value: type.value,
  })),
)

const handleFilterChange = () => {
  emit('update:modelValue', { ...filters.value })
  emit('filtersChanged', { ...filters.value })
}

const handleClearFilters = () => {
  filters.value = {
    project_id: '',
    well_id: '',
    employee_id: '',
    tool_id: '',
    equipment_id: '',
    document_type: '',
    date_from: '',
    date_to: '',
    search: '',
  }
  handleFilterChange()
}

const handleApplyFilters = () => {
  handleFilterChange()
}

onMounted(() => {
  if (projects.value.length === 0)
    fetchProjects()

  if (employees.value.length === 0)
    fetchEmployees()

  if (tools.value.length === 0)
    fetchTools()

  if (equipment.value.length === 0)
    fetchEquipment()
})

watch(() => filters.value.project_id, newProjectId => {
  if (newProjectId) {
    fetchWellsByProject(newProjectId)
    filters.value.well_id = ''
  }
  else {
    filters.value.well_id = ''
  }
})

watch(() => props.modelValue, newValue => {
  if (newValue)
    filters.value = { ...newValue }
})
</script>

<template>
  <VCard class="mb-4">
    <VCardTitle>
      <VIcon
        icon="mdi-filter"
        class="me-2"
      />
      {{ $t('DrillingReportsModule.common.filters') }}
    </VCardTitle>

    <VCardText>
      <VRow>
        <!-- Project Filter -->
        <VCol
          cols="12"
          md="6"
          lg="4"
        >
          <VSelect
            v-model="filters.project_id"
            :items="projectOptions"
            :label="$t('DrillingReportsModule.projects.title')"
            clearable
            @update:model-value="handleFilterChange"
          />
        </VCol>

        <!-- Well Filter -->
        <VCol
          cols="12"
          md="6"
          lg="4"
        >
          <VSelect
            v-model="filters.well_id"
            :items="wellOptions"
            :label="$t('DrillingReportsModule.wells.title')"
            :disabled="!filters.project_id"
            clearable
            @update:model-value="handleFilterChange"
          />
        </VCol>

        <!-- Employee Filter -->
        <VCol
          cols="12"
          md="6"
          lg="4"
        >
          <VSelect
            v-model="filters.employee_id"
            :items="employeeOptions"
            :label="$t('DrillingReportsModule.employees.title')"
            clearable
            @update:model-value="handleFilterChange"
          />
        </VCol>

        <!-- Tool Filter -->
        <VCol
          cols="12"
          md="6"
          lg="4"
        >
          <VSelect
            v-model="filters.tool_id"
            :items="toolOptions"
            :label="$t('DrillingReportsModule.tools.title')"
            clearable
            @update:model-value="handleFilterChange"
          />
        </VCol>

        <!-- Equipment Filter -->
        <VCol
          cols="12"
          md="6"
          lg="4"
        >
          <VSelect
            v-model="filters.equipment_id"
            :items="equipmentOptions"
            :label="$t('DrillingReportsModule.equipment.title')"
            clearable
            @update:model-value="handleFilterChange"
          />
        </VCol>

        <!-- Document Type Filter -->
        <VCol
          cols="12"
          md="6"
          lg="4"
        >
          <VSelect
            v-model="filters.document_type"
            :items="documentTypeOptions"
            :label="$t('DrillingReportsModule.documents.type')"
            clearable
            @update:model-value="handleFilterChange"
          />
        </VCol>

        <!-- Date Range -->
        <VCol
          cols="12"
          md="6"
          lg="4"
        >
          <VTextField
            v-model="filters.date_from"
            :label="$t('DrillingReportsModule.filters.dateFrom')"
            type="date"
            @update:model-value="handleFilterChange"
          />
        </VCol>

        <VCol
          cols="12"
          md="6"
          lg="4"
        >
          <VTextField
            v-model="filters.date_to"
            :label="$t('DrillingReportsModule.filters.dateTo')"
            type="date"
            @update:model-value="handleFilterChange"
          />
        </VCol>

        <!-- Search -->
        <VCol
          cols="12"
          md="6"
          lg="4"
        >
          <VTextField
            v-model="filters.search"
            :label="$t('DrillingReportsModule.common.search')"
            prepend-inner-icon="mdi-magnify"
            clearable
            @update:model-value="handleFilterChange"
          />
        </VCol>
      </VRow>

      <VRow>
        <VCol
          cols="12"
          class="d-flex justify-end"
        >
          <VBtn
            color="grey"
            variant="text"
            @click="handleClearFilters"
          >
            {{ $t('DrillingReportsModule.common.clearFilters') }}
          </VBtn>
          <VBtn
            color="primary"
            @click="handleApplyFilters"
          >
            {{ $t('DrillingReportsModule.common.applyFilters') }}
          </VBtn>
        </VCol>
      </VRow>
    </VCardText>
  </VCard>
</template>

<style scoped>
.related-entities-filters {
  inline-size: 100%;
}
</style>
