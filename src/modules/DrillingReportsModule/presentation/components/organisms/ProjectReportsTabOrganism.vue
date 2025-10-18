<script setup lang="ts">
import { computed, ref } from 'vue'
import { formatDate } from '../../../shared/utils/dateUtils'

export interface ProjectReportsTabProps {
  reports: any[]
  loading?: boolean
}

const props = defineProps<ProjectReportsTabProps>()

defineEmits<{
  'create': []
  'view': [report: any]
  'edit': [report: any]
  'delete': [report: any]
}>()

const filters = ref({
  search: '',
  status: null as string | null,
  shift: null as string | null,
  date: '',
})

const headers = [
  { title: 'Fecha', key: 'report_date', sortable: true },
  { title: 'Turno', key: 'shift', sortable: true },
  { title: 'Estado', key: 'status', sortable: true },
  { title: 'Profundidad', key: 'depth', sortable: false },
  { title: 'Operador', key: 'operator_name', sortable: true },
  { title: 'Acciones', key: 'actions', sortable: false, align: 'end' },
]

const statusOptions = [
  { title: 'Borrador', value: 'draft' },
  { title: 'Enviado', value: 'submitted' },
  { title: 'Revisado', value: 'reviewed' },
  { title: 'Aprobado', value: 'approved' },
  { title: 'Rechazado', value: 'rejected' },
]

const shiftOptions = [
  { title: 'Día', value: 'day' },
  { title: 'Noche', value: 'night' },
  { title: 'Mixto', value: 'mixed' },
]

const totalReports = computed(() => props.reports.length)

const filteredReports = computed(() => {
  let result = [...props.reports]

  if (filters.value.search) {
    const searchLower = filters.value.search.toLowerCase()

    result = result.filter(r =>
      r.operator_name?.toLowerCase().includes(searchLower)
      || r.report_date?.includes(searchLower),
    )
  }

  if (filters.value.status)
    result = result.filter(r => r.status === filters.value.status)

  if (filters.value.shift)
    result = result.filter(r => r.shift === filters.value.shift)

  if (filters.value.date)
    result = result.filter(r => r.report_date === filters.value.date)

  return result
})

const getShiftColor = (shift: string) => {
  const colors = {
    day: 'warning',
    night: 'info',
    mixed: 'primary',
  }

  return colors[shift] || 'grey'
}

const getShiftLabel = (shift: string) => {
  const labels = {
    day: 'Día',
    night: 'Noche',
    mixed: 'Mixto',
  }

  return labels[shift] || shift
}

const getStatusColor = (status: string) => {
  const colors = {
    draft: 'grey',
    submitted: 'info',
    reviewed: 'warning',
    approved: 'success',
    rejected: 'error',
  }

  return colors[status] || 'grey'
}

const getStatusLabel = (status: string) => {
  const labels = {
    draft: 'Borrador',
    submitted: 'Enviado',
    reviewed: 'Revisado',
    approved: 'Aprobado',
    rejected: 'Rechazado',
  }

  return labels[status] || status
}
</script>

<template>
  <div class="project-reports-tab pa-6">
    <!-- Header with Actions -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h6 class="text-h6 mb-1">
          Reportes de Perforación
        </h6>
        <p class="text-body-2 text-medium-emphasis mb-0">
          {{ totalReports }} {{ totalReports === 1 ? 'reporte' : 'reportes' }} registrados
        </p>
      </div>
      <VBtn
        color="primary"
        prepend-icon="tabler-file-plus"
        @click="$emit('create')"
      >
        Nuevo Reporte
      </VBtn>
    </div>

    <!-- Filters -->
    <VCard
      variant="outlined"
      class="mb-6"
    >
      <VCardText>
        <VRow>
          <VCol
            cols="12"
            md="3"
          >
            <VTextField
              v-model="filters.search"
              label="Buscar"
              prepend-inner-icon="tabler-search"
              clearable
              density="compact"
              hide-details
            />
          </VCol>
          <VCol
            cols="12"
            md="3"
          >
            <VSelect
              v-model="filters.status"
              label="Estado"
              :items="statusOptions"
              clearable
              density="compact"
              hide-details
            />
          </VCol>
          <VCol
            cols="12"
            md="3"
          >
            <VSelect
              v-model="filters.shift"
              label="Turno"
              :items="shiftOptions"
              clearable
              density="compact"
              hide-details
            />
          </VCol>
          <VCol
            cols="12"
            md="3"
          >
            <VTextField
              v-model="filters.date"
              label="Fecha"
              type="date"
              clearable
              density="compact"
              hide-details
            />
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Reports Data Table -->
    <VDataTable
      :headers="headers"
      :items="filteredReports"
      :loading="loading"
      :items-per-page="15"
      class="elevation-1"
    >
      <!-- Report Date -->
      <template #item.report_date="{ item }">
        <div class="d-flex align-center gap-2">
          <VIcon
            icon="tabler-calendar"
            size="18"
          />
          {{ formatDate(item.report_date) }}
        </div>
      </template>

      <!-- Shift -->
      <template #item.shift="{ item }">
        <VChip
          :color="getShiftColor(item.shift)"
          size="small"
          variant="tonal"
        >
          {{ getShiftLabel(item.shift) }}
        </VChip>
      </template>

      <!-- Status -->
      <template #item.status="{ item }">
        <VChip
          :color="getStatusColor(item.status)"
          size="small"
          variant="tonal"
        >
          {{ getStatusLabel(item.status) }}
        </VChip>
      </template>

      <!-- Depth Progress -->
      <template #item.depth="{ item }">
        <div v-if="item.depth_from && item.depth_to">
          <div class="text-body-2">
            {{ item.depth_from }}m → {{ item.depth_to }}m
          </div>
          <div class="text-caption text-medium-emphasis">
            Avance: {{ (item.depth_to - item.depth_from).toFixed(2) }}m
          </div>
        </div>
        <span
          v-else
          class="text-medium-emphasis"
        >N/A</span>
      </template>

      <!-- Actions -->
      <template #item.actions="{ item }">
        <div class="d-flex gap-1">
          <VTooltip text="Ver Detalles">
            <template #activator="{ props: tooltipProps }">
              <VBtn
                v-bind="tooltipProps"
                icon="tabler-eye"
                variant="text"
                size="small"
                @click="$emit('view', item)"
              />
            </template>
          </VTooltip>
          <VTooltip text="Editar">
            <template #activator="{ props: tooltipProps }">
              <VBtn
                v-bind="tooltipProps"
                icon="tabler-edit"
                variant="text"
                size="small"
                :disabled="item.status !== 'draft'"
                @click="$emit('edit', item)"
              />
            </template>
          </VTooltip>
          <VTooltip text="Eliminar">
            <template #activator="{ props: tooltipProps }">
              <VBtn
                v-bind="tooltipProps"
                icon="tabler-trash"
                variant="text"
                size="small"
                color="error"
                :disabled="item.status !== 'draft'"
                @click="$emit('delete', item)"
              />
            </template>
          </VTooltip>
        </div>
      </template>

      <!-- Empty State -->
      <template #no-data>
        <div class="text-center pa-12">
          <VIcon
            icon="tabler-file-off"
            size="64"
            class="text-medium-emphasis mb-4"
          />
          <h5 class="text-h5 mb-2">
            No hay reportes
          </h5>
          <p class="text-body-2 text-medium-emphasis mb-6">
            Aún no se han creado reportes para este proyecto
          </p>
          <VBtn
            color="primary"
            prepend-icon="tabler-plus"
            @click="$emit('create')"
          >
            Crear Primer Reporte
          </VBtn>
        </div>
      </template>
    </VDataTable>
  </div>
</template>

<style scoped lang="scss">
.project-reports-tab {
  min-block-size: 400px;
}
</style>
