<script setup lang="ts">
import type { EmploymentHistoryDto } from '../../../application/dtos/EmployeeDtos'

interface Props {
  history: EmploymentHistoryDto[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

function formatDate(date?: string) {
  if (!date)
    return '-'

  return new Date(date).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function getEventIcon(event: string) {
  const icons = {
    hired: 'tabler-user-plus',
    promoted: 'tabler-trending-up',
    salary_change: 'tabler-currency-dollar',
    position_change: 'tabler-briefcase',
    suspended: 'tabler-pause',
    reactivated: 'tabler-player-play',
    terminated: 'tabler-user-x',
    status_change: 'tabler-refresh',
    reactivation: 'tabler-player-play',
    termination: 'tabler-user-x',
  }

  return icons[event] || 'tabler-point'
}

function getEventColor(event: string) {
  const colors = {
    hired: 'success',
    promoted: 'primary',
    salary_change: 'warning',
    position_change: 'info',
    suspended: 'error',
    reactivated: 'success',
    terminated: 'error',
    status_change: 'secondary',
    reactivation: 'success',
    termination: 'error',
  }

  return colors[event] || 'default'
}

function getEventTitle(event: string) {
  const titles = {
    hired: 'Contratación',
    promoted: 'Promoción',
    salary_change: 'Cambio de Salario',
    position_change: 'Cambio de Puesto',
    suspended: 'Suspensión',
    reactivated: 'Reactivación',
    terminated: 'Terminación',
    status_change: 'Cambio de Estado',
    reactivation: 'Reactivación',
    termination: 'Terminación',
  }

  return titles[event] || event
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-4">
      <h6 class="text-h6 mb-1">
        Historial de Empleo
      </h6>
      <p class="text-body-2 text-medium-emphasis mb-0">
        Cronología de cambios y eventos importantes del empleado
      </p>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="text-center pa-8"
    >
      <VProgressCircular
        indeterminate
        color="primary"
      />
    </div>

    <!-- Timeline -->
    <VTimeline
      v-else-if="history.length > 0"
      side="end"
      truncate-line="both"
      density="compact"
    >
      <VTimelineItem
        v-for="(item, index) in history"
        :key="index"
        :dot-color="getEventColor(item.change_type)"
        size="small"
      >
        <template #icon>
          <VIcon
            :icon="getEventIcon(item.change_type)"
            size="16"
          />
        </template>

        <VCard>
          <VCardText>
            <div class="d-flex align-center justify-space-between mb-2">
              <h6 class="text-subtitle-1 font-weight-medium">
                {{ item.reason }}
              </h6>
              <VChip
                size="x-small"
                :color="getEventColor(item.change_type)"
                variant="tonal"
              >
                {{ formatDate(item.change_date) }}
              </VChip>
            </div>

            <p
              v-if="item.notes"
              class="text-body-2 mb-2"
            >
              {{ item.notes }}
            </p>

            <div
              v-if="item.changed_by_user"
              class="d-flex align-center gap-1 text-caption text-medium-emphasis"
            >
              <VIcon size="14">
                tabler-user
              </VIcon>
              <span>Por: {{ item.changed_by_user.name }}</span>
            </div>
          </VCardText>
        </VCard>
      </VTimelineItem>
    </VTimeline>

    <!-- Empty State -->
    <VAlert
      v-else
      color="info"
      variant="tonal"
      icon="tabler-history"
    >
      <div class="text-body-2">
        No hay eventos registrados en el historial de empleo.
      </div>
    </VAlert>
  </div>
</template>
