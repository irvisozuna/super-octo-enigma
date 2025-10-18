<script setup lang="ts">
import { computed } from 'vue'
import { useDrillingReport } from '../../composables/useDrillingReport'

// Props
interface Props {
  report: any
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  view: [report: any]
  edit: [report: any]
  delete: [report: any]
  approve: [report: any]
  reject: [report: any]
  complete: [report: any]
}>()

// Composable
const {
  getStatusColor,
  getStatusLabel,
  getStatusIcon,
  canEditReport,
  canCompleteReport,
  canApproveReport,
} = useDrillingReport()

// Methods
const formatDate = (dateString: string) => {
  const date = new Date(dateString)

  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const getShiftLabel = (shift: string) => {
  const labels = {
    day: 'Turno Día',
    night: 'Turno Noche',
    mixed: 'Turno Mixto',
  }

  return labels[shift as keyof typeof labels] || shift
}

const getPersonnelInfo = () => {
  const personnel = props.report.personnel
  if (!personnel)
    return 'Sin personal asignado'

  if (personnel.operator_day)
    return personnel.operator_day.name

  if (personnel.operator_night)
    return personnel.operator_night.name

  return 'Sin operador asignado'
}

const canEdit = (report: any) => {
  return canEditReport(report, 'current-user-id') // TODO: Get from auth
}

const canComplete = (report: any) => {
  return canCompleteReport(report)
}

const canApprove = (report: any) => {
  return canApproveReport(report)
}

const canReject = (report: any) => {
  return report.status === 'completed'
}

const canDelete = (report: any) => {
  return report.status === 'draft'
}
</script>

<template>
  <VCard
    class="drilling-report-card"
    elevation="2"
  >
    <VCardText>
      <!-- Header -->
      <div class="d-flex justify-space-between align-start mb-4">
        <div>
          <h3 class="text-h6 font-weight-bold">
            {{ report.report_number }}
          </h3>
          <p class="text-body-2 text-medium-emphasis">
            {{ formatDate(report.report_date) }}
          </p>
        </div>

        <VBadge
          :color="getStatusColor(report.status)"
          :content="getStatusLabel(report.status)"
          class="status-badge"
        >
          <VIcon
            :icon="getStatusIcon(report.status)"
            size="24"
          />
        </VBadge>
      </div>

      <!-- Project and Well Info -->
      <div class="mb-4">
        <h4 class="text-subtitle-2 font-weight-medium mb-1">
          {{ report.project?.name || 'Proyecto' }}
        </h4>
        <p class="text-body-2 text-medium-emphasis">
          {{ report.well?.name || 'Pozo' }} - {{ report.well?.well_number || '' }}
        </p>
      </div>

      <!-- Personnel Info -->
      <div class="mb-4">
        <div class="d-flex align-center mb-2">
          <VIcon
            icon="tabler-user"
            size="16"
            class="mr-2"
          />
          <span class="text-body-2 font-weight-medium">
            {{ getPersonnelInfo() }}
          </span>
        </div>

        <div class="d-flex align-center">
          <VIcon
            icon="tabler-clock"
            size="16"
            class="mr-2"
          />
          <span class="text-body-2">
            {{ getShiftLabel(report.shift) }}
          </span>
        </div>
      </div>

      <!-- Totals -->
      <div class="d-flex justify-space-between mb-4">
        <div class="text-center">
          <div class="text-h6 font-weight-bold text-primary">
            {{ report.totals?.hours_worked || 0 }}h
          </div>
          <div class="text-caption text-medium-emphasis">
            Horas
          </div>
        </div>

        <div class="text-center">
          <div class="text-h6 font-weight-bold text-success">
            {{ report.totals?.meters_drilled || 0 }}m
          </div>
          <div class="text-caption text-medium-emphasis">
            Metros
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="d-flex gap-2 flex-wrap">
        <!-- View Button -->
        <VBtn
          size="small"
          variant="outlined"
          @click="$emit('view', report)"
        >
          <VIcon
            icon="tabler-eye"
            size="16"
            class="mr-1"
          />
          Ver
        </VBtn>

        <!-- Edit Button -->
        <VBtn
          v-if="canEdit(report)"
          size="small"
          color="primary"
          variant="outlined"
          @click="$emit('edit', report)"
        >
          <VIcon
            icon="tabler-edit"
            size="16"
            class="mr-1"
          />
          Editar
        </VBtn>

        <!-- Complete Button -->
        <VBtn
          v-if="canComplete(report)"
          size="small"
          color="success"
          @click="$emit('complete', report)"
        >
          <VIcon
            icon="tabler-check"
            size="16"
            class="mr-1"
          />
          Completar
        </VBtn>

        <!-- Approve Button -->
        <VBtn
          v-if="canApprove(report)"
          size="small"
          color="success"
          @click="$emit('approve', report)"
        >
          <VIcon
            icon="tabler-circle-check"
            size="16"
            class="mr-1"
          />
          Aprobar
        </VBtn>

        <!-- Reject Button -->
        <VBtn
          v-if="canReject(report)"
          size="small"
          color="error"
          variant="outlined"
          @click="$emit('reject', report)"
        >
          <VIcon
            icon="tabler-circle-x"
            size="16"
            class="mr-1"
          />
          Rechazar
        </VBtn>

        <!-- Delete Button -->
        <VBtn
          v-if="canDelete(report)"
          size="small"
          color="error"
          variant="outlined"
          @click="$emit('delete', report)"
        >
          <VIcon
            icon="tabler-trash"
            size="16"
            class="mr-1"
          />
          Eliminar
        </VBtn>
      </div>
    </VCardText>
  </VCard>
</template>

<style scoped>
.drilling-report-card {
  cursor: pointer;
  transition: all 0.2s ease;
}

.drilling-report-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 15%);
  transform: translateY(-2px);
}

.status-badge {
  position: relative;
}

.status-badge::after {
  position: absolute;
  border-radius: 10px;
  background: var(--status-color);
  color: white;
  content: attr(data-status);
  font-size: 10px;
  font-weight: 500;
  inset-block-start: -8px;
  inset-inline-end: -8px;
  padding-block: 2px;
  padding-inline: 6px;
}
</style>
