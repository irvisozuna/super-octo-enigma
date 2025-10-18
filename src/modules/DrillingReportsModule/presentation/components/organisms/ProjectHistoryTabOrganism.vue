<script setup lang="ts">
import { computed } from 'vue'
import { formatDate } from '../../../shared/utils/dateUtils'

export interface ProjectHistoryTabProps {
  history: any[]
  summary?: {
    total_changes: number
    current_status: string
    days_in_planning?: number
    days_in_progress?: number
    days_suspended?: number
    total_project_days?: number
  }
  loading?: boolean
}

const props = withDefaults(defineProps<ProjectHistoryTabProps>(), {
  loading: false,
})

defineEmits<{
  'refresh': []
}>()

const statusConfig = {
  planning: { color: 'info', label: 'Planificación', icon: 'tabler-edit' },
  in_progress: { color: 'success', label: 'En Progreso', icon: 'tabler-player-play' },
  suspended: { color: 'warning', label: 'Suspendido', icon: 'tabler-player-pause' },
  completed: { color: 'primary', label: 'Completado', icon: 'tabler-check' },
  cancelled: { color: 'error', label: 'Cancelado', icon: 'tabler-x' },
}

const getStatusColor = (status: string) => {
  return statusConfig[status]?.color || 'grey'
}

const getStatusLabel = (status: string) => {
  return statusConfig[status]?.label || status
}

const getStatusIcon = (status: string) => {
  return statusConfig[status]?.icon || 'tabler-point-filled'
}

const getTimelineDotColor = (status: string) => {
  return getStatusColor(status)
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount)
}
</script>

<template>
  <div class="project-history-tab pa-6">
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h6 class="text-h6 mb-1">
          Historial de Cambios de Estado
        </h6>
        <p class="text-body-2 text-medium-emphasis mb-0">
          {{ summary?.total_changes || 0 }} cambios registrados
        </p>
      </div>
      <VBtn
        variant="outlined"
        prepend-icon="tabler-refresh"
        @click="$emit('refresh')"
      >
        Actualizar
      </VBtn>
    </div>

    <!-- Summary Cards -->
    <VRow
      v-if="summary"
      class="mb-6"
    >
      <VCol
        cols="12"
        sm="6"
        md="3"
      >
        <VCard>
          <VCardText class="d-flex align-center gap-3">
            <VAvatar
              color="primary"
              variant="tonal"
              size="48"
            >
              <VIcon
                icon="tabler-status-change"
                size="24"
              />
            </VAvatar>
            <div>
              <p class="text-caption text-medium-emphasis mb-1">
                Estado Actual
              </p>
              <VChip
                :color="getStatusColor(summary.current_status)"
                size="small"
              >
                {{ getStatusLabel(summary.current_status) }}
              </VChip>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        sm="6"
        md="3"
      >
        <VCard>
          <VCardText class="d-flex align-center gap-3">
            <VAvatar
              color="info"
              variant="tonal"
              size="48"
            >
              <VIcon
                icon="tabler-calendar"
                size="24"
              />
            </VAvatar>
            <div>
              <p class="text-caption text-medium-emphasis mb-1">
                Días en Progreso
              </p>
              <h5 class="text-h5">
                {{ summary.days_in_progress || 0 }}
              </h5>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        sm="6"
        md="3"
      >
        <VCard>
          <VCardText class="d-flex align-center gap-3">
            <VAvatar
              color="warning"
              variant="tonal"
              size="48"
            >
              <VIcon
                icon="tabler-clock-pause"
                size="24"
              />
            </VAvatar>
            <div>
              <p class="text-caption text-medium-emphasis mb-1">
                Días Suspendido
              </p>
              <h5 class="text-h5">
                {{ summary.days_suspended || 0 }}
              </h5>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        sm="6"
        md="3"
      >
        <VCard>
          <VCardText class="d-flex align-center gap-3">
            <VAvatar
              color="success"
              variant="tonal"
              size="48"
            >
              <VIcon
                icon="tabler-clock"
                size="24"
              />
            </VAvatar>
            <div>
              <p class="text-caption text-medium-emphasis mb-1">
                Días Totales
              </p>
              <h5 class="text-h5">
                {{ summary.total_project_days || 0 }}
              </h5>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Timeline -->
    <VCard>
      <VCardText>
        <VTimeline
          v-if="history.length > 0"
          side="end"
          align="start"
          truncate-line="both"
          density="compact"
        >
          <VTimelineItem
            v-for="(item, index) in history"
            :key="item.id"
            :dot-color="getTimelineDotColor(item.to_status)"
            size="small"
          >
            <!-- Timeline Dot Icon -->
            <template #icon>
              <VIcon
                :icon="getStatusIcon(item.to_status)"
                size="16"
                color="white"
              />
            </template>

            <!-- Timeline Content -->
            <VCard variant="outlined">
              <VCardText>
                <div class="d-flex align-center justify-space-between mb-3">
                  <div class="d-flex align-center gap-3">
                    <VChip
                      v-if="item.from_status"
                      :color="getStatusColor(item.from_status)"
                      size="small"
                      variant="tonal"
                    >
                      {{ getStatusLabel(item.from_status) }}
                    </VChip>
                    <VIcon
                      icon="tabler-arrow-right"
                      size="20"
                      class="text-medium-emphasis"
                    />
                    <VChip
                      :color="getStatusColor(item.to_status)"
                      size="small"
                    >
                      {{ getStatusLabel(item.to_status) }}
                    </VChip>
                  </div>
                  <span class="text-caption text-medium-emphasis">
                    {{ formatDate(item.change_date) }}
                  </span>
                </div>

                <!-- Reason -->
                <p
                  v-if="item.reason"
                  class="text-body-2 mb-3"
                >
                  <VIcon
                    icon="tabler-message-circle"
                    size="16"
                    class="mr-2"
                  />
                  {{ item.reason }}
                </p>

                <!-- Metadata -->
                <div
                  v-if="item.metadata && Object.keys(item.metadata).length > 0"
                  class="metadata-section mb-3"
                >
                  <VDivider class="mb-3" />
                  <div class="d-flex flex-wrap gap-4">
                    <div
                      v-if="item.metadata.suspension_days"
                      class="d-flex align-center gap-1"
                    >
                      <VIcon
                        icon="tabler-clock-pause"
                        size="16"
                        class="text-medium-emphasis"
                      />
                      <span class="text-caption">{{ item.metadata.suspension_days }} días suspendido</span>
                    </div>
                    <div
                      v-if="item.metadata.cost_at_change !== undefined"
                      class="d-flex align-center gap-1"
                    >
                      <VIcon
                        icon="tabler-currency-dollar"
                        size="16"
                        class="text-medium-emphasis"
                      />
                      <span class="text-caption">{{ formatCurrency(item.metadata.cost_at_change) }}</span>
                    </div>
                    <div
                      v-if="item.metadata.expected_resume_date"
                      class="d-flex align-center gap-1"
                    >
                      <VIcon
                        icon="tabler-calendar-check"
                        size="16"
                        class="text-medium-emphasis"
                      />
                      <span class="text-caption">Reanudación: {{ formatDate(item.metadata.expected_resume_date) }}</span>
                    </div>
                    <div
                      v-if="item.metadata.start_date"
                      class="d-flex align-center gap-1"
                    >
                      <VIcon
                        icon="tabler-calendar-event"
                        size="16"
                        class="text-medium-emphasis"
                      />
                      <span class="text-caption">Inicio: {{ formatDate(item.metadata.start_date) }}</span>
                    </div>
                    <div
                      v-if="item.metadata.initial_budget"
                      class="d-flex align-center gap-1"
                    >
                      <VIcon
                        icon="tabler-wallet"
                        size="16"
                        class="text-medium-emphasis"
                      />
                      <span class="text-caption">Presupuesto: {{ formatCurrency(item.metadata.initial_budget) }}</span>
                    </div>
                  </div>
                </div>

                <!-- User Info -->
                <div class="d-flex align-center gap-2">
                  <VAvatar
                    size="24"
                    color="primary"
                    variant="tonal"
                  >
                    <VIcon
                      icon="tabler-user"
                      size="14"
                    />
                  </VAvatar>
                  <span class="text-caption text-medium-emphasis">
                    {{ item.changed_by?.name || 'Sistema' }}
                  </span>
                </div>
              </VCardText>
            </VCard>
          </VTimelineItem>
        </VTimeline>

        <!-- Empty State -->
        <div
          v-else
          class="text-center pa-12"
        >
          <VIcon
            icon="tabler-history-off"
            size="64"
            class="text-medium-emphasis mb-4"
          />
          <h5 class="text-h5 mb-2">
            No hay historial disponible
          </h5>
          <p class="text-body-2 text-medium-emphasis">
            Aún no se han registrado cambios de estado en este proyecto
          </p>
        </div>
      </VCardText>
    </VCard>

    <!-- Loading State -->
    <VProgressLinear
      v-if="loading"
      indeterminate
      color="primary"
      class="mt-4"
    />
  </div>
</template>

<style scoped lang="scss">
.project-history-tab {
  min-block-size: 400px;

  .metadata-section {
    background: rgba(var(--v-theme-on-surface), 0.02);
    padding: 0.75rem;
    border-radius: 4px;
  }

  :deep(.v-timeline) {
    .v-timeline-item {
      padding-block-end: 1.5rem;
    }
  }
}
</style>
