<script setup lang="ts">
import { computed } from 'vue'
import BudgetCardMolecule from '../molecules/BudgetCardMolecule.vue'
import { formatDate } from '../../../shared/utils/dateUtils'

export interface ProjectStatistics {
  well_count: number
  active_personnel_count: number
  reports_count: number
  equipment_count: number
}

export interface ProjectDates {
  start_date: string
  estimated_end_date: string
  actual_end_date?: string
}

export interface ProjectBudget {
  total: number
  current_cost: number
  currency: string
  projected_total?: number
}

export interface ProjectCoordinates {
  latitude: number
  longitude: number
}

export interface RecentActivity {
  id: string
  description: string
  created_at: string
  color: string
}

export interface ProjectOverviewTabProps {
  status?: string
  statistics?: ProjectStatistics
  dates?: ProjectDates
  budget?: ProjectBudget
  generalLocation?: string
  coordinates?: ProjectCoordinates
  recentActivities?: RecentActivity[]
}

const props = defineProps<ProjectOverviewTabProps>()

defineEmits<{
  'view-map': []
  'view-budget': []
  'add-expense': []
}>()

const isPlanned = computed(() => props.status === 'planned')

const hasAnyStats = computed(() => {
  return (
    (props.statistics?.well_count || 0) > 0
    || (props.statistics?.active_personnel_count || 0) > 0
    || (props.statistics?.reports_count || 0) > 0
    || (props.statistics?.equipment_count || 0) > 0
  )
})

const projectDuration = computed(() => {
  if (!props.dates?.start_date || !props.dates?.estimated_end_date)
    return null
  const start = new Date(props.dates.start_date)
  const end = new Date(props.dates.estimated_end_date)

  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
})

const projectProgress = computed(() => {
  if (!props.dates?.start_date || !props.dates?.estimated_end_date)
    return 0
  const start = new Date(props.dates.start_date)
  const end = new Date(props.dates.estimated_end_date)
  const now = new Date()

  const total = end.getTime() - start.getTime()
  const elapsed = now.getTime() - start.getTime()

  return Math.min(Math.max(Math.round((elapsed / total) * 100), 0), 100)
})

const daysRemaining = computed(() => {
  if (!props.dates?.estimated_end_date)
    return 0
  const end = new Date(props.dates.estimated_end_date)
  const now = new Date()
  const remaining = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  return Math.max(0, remaining)
})
</script>

<template>
  <div class="project-overview-tab">
    <!-- Compact Stats Cards - Solo si tienen datos -->
    <VRow
      v-if="hasAnyStats"
      dense
      class="mb-4"
    >
      <VCol
        v-if="statistics?.well_count"
        cols="6"
        sm="6"
        md="3"
      >
        <VCard
          variant="tonal"
          color="primary"
          class="stat-card-compact"
        >
          <VCardText class="pa-3">
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-caption text-medium-emphasis mb-1">
                  Pozos
                </p>
                <h4 class="text-h4 font-weight-bold mb-0">
                  {{ statistics.well_count }}
                </h4>
              </div>
              <VIcon
                icon="tabler-droplet"
                size="32"
                class="opacity-50"
              />
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        v-if="statistics?.active_personnel_count"
        cols="6"
        sm="6"
        md="3"
      >
        <VCard
          variant="tonal"
          color="success"
          class="stat-card-compact"
        >
          <VCardText class="pa-3">
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-caption text-medium-emphasis mb-1">
                  Personal
                </p>
                <h4 class="text-h4 font-weight-bold mb-0">
                  {{ statistics.active_personnel_count }}
                </h4>
              </div>
              <VIcon
                icon="tabler-users"
                size="32"
                class="opacity-50"
              />
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        v-if="statistics?.reports_count"
        cols="6"
        sm="6"
        md="3"
      >
        <VCard
          variant="tonal"
          color="info"
          class="stat-card-compact"
        >
          <VCardText class="pa-3">
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-caption text-medium-emphasis mb-1">
                  Reportes
                </p>
                <h4 class="text-h4 font-weight-bold mb-0">
                  {{ statistics.reports_count }}
                </h4>
              </div>
              <VIcon
                icon="tabler-file-text"
                size="32"
                class="opacity-50"
              />
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        v-if="statistics?.equipment_count"
        cols="6"
        sm="6"
        md="3"
      >
        <VCard
          variant="tonal"
          color="warning"
          class="stat-card-compact"
        >
          <VCardText class="pa-3">
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-caption text-medium-emphasis mb-1">
                  Equipos
                </p>
                <h4 class="text-h4 font-weight-bold mb-0">
                  {{ statistics.equipment_count }}
                </h4>
              </div>
              <VIcon
                icon="tabler-tools"
                size="32"
                class="opacity-50"
              />
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Main Content Row -->
    <VRow>
      <!-- Left Column: Charts and Details -->
      <VCol
        cols="12"
        lg="8"
      >
        <!-- Project Timeline -->
        <VCard
          v-if="!isPlanned"
          variant="outlined"
          class="mb-6"
        >
          <VCardTitle class="d-flex align-center gap-2">
            <VIcon icon="tabler-calendar-event" />
            Timeline del Proyecto
          </VCardTitle>
          <VCardText>
            <div class="timeline-info">
              <div class="timeline-item">
                <VIcon
                  icon="tabler-calendar"
                  class="text-success"
                />
                <div>
                  <p class="text-caption text-medium-emphasis mb-0">
                    Fecha de Inicio
                  </p>
                  <p class="text-body-1 font-weight-medium mb-0">
                    {{ formatDate(dates?.start_date) }}
                  </p>
                </div>
              </div>
              <div class="timeline-divider">
                <VIcon
                  icon="tabler-arrow-right"
                  class="text-medium-emphasis"
                />
              </div>
              <div class="timeline-item">
                <VIcon
                  icon="tabler-calendar-due"
                  class="text-warning"
                />
                <div>
                  <p class="text-caption text-medium-emphasis mb-0">
                    Fecha Estimada de Fin
                  </p>
                  <p class="text-body-1 font-weight-medium mb-0">
                    {{ formatDate(dates?.estimated_end_date) }}
                  </p>
                </div>
              </div>
              <div
                v-if="dates?.actual_end_date"
                class="timeline-divider"
              >
                <VIcon
                  icon="tabler-arrow-right"
                  class="text-medium-emphasis"
                />
              </div>
              <div
                v-if="dates?.actual_end_date"
                class="timeline-item"
              >
                <VIcon
                  icon="tabler-calendar-check"
                  class="text-success"
                />
                <div>
                  <p class="text-caption text-medium-emphasis mb-0">
                    Fecha Real de Fin
                  </p>
                  <p class="text-body-1 font-weight-medium mb-0">
                    {{ formatDate(dates?.actual_end_date) }}
                  </p>
                </div>
              </div>
            </div>

            <VDivider class="my-4" />

            <div
              v-if="projectDuration"
              class="duration-info"
            >
              <div class="d-flex justify-space-between align-center">
                <span class="text-body-2 text-medium-emphasis">Duración del Proyecto</span>
                <span class="text-h6 font-weight-bold">{{ projectDuration }} días</span>
              </div>
              <VProgressLinear
                :model-value="projectProgress"
                color="primary"
                height="8"
                rounded
                class="mt-3"
              />
              <div class="d-flex justify-space-between mt-2">
                <span class="text-caption text-medium-emphasis">Progreso: {{ projectProgress }}%</span>
                <span class="text-caption text-medium-emphasis">
                  {{ daysRemaining }} días restantes
                </span>
              </div>
            </div>
          </VCardText>
        </VCard>

        <!-- Location Card -->
        <VCard variant="outlined">
          <VCardTitle class="d-flex align-center gap-2">
            <VIcon icon="tabler-map-pin" />
            Ubicación
          </VCardTitle>
          <VCardText>
            <div class="location-info">
              <div class="d-flex align-center gap-3 mb-3">
                <VAvatar
                  color="error"
                  size="48"
                  variant="tonal"
                >
                  <VIcon
                    icon="tabler-map-2"
                    size="24"
                  />
                </VAvatar>
                <div>
                  <p class="text-body-1 font-weight-medium mb-1">
                    {{ generalLocation || 'Ubicación no especificada' }}
                  </p>
                  <p class="text-caption text-medium-emphasis mb-0">
                    {{ coordinates?.latitude.toFixed(6) }}, {{ coordinates?.longitude.toFixed(6) }}
                  </p>
                </div>
              </div>
              <VBtn
                v-if="coordinates"
                variant="tonal"
                color="primary"
                size="small"
                prepend-icon="tabler-map"
                @click="$emit('view-map')"
              >
                Ver en Mapa
              </VBtn>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Right Column: Budget and Alerts -->
      <VCol
        cols="12"
        lg="4"
      >
        <!-- Recent Activity -->
        <VCard
          v-if="!isPlanned"
          variant="outlined"
        >
          <VCardTitle class="d-flex align-center gap-2">
            <VIcon icon="tabler-activity" />
            Actividad Reciente
          </VCardTitle>
          <VCardText>
            <VTimeline
              v-if="recentActivities && recentActivities.length > 0"
              density="compact"
              align="start"
              truncate-line="both"
              side="end"
            >
              <VTimelineItem
                v-for="activity in recentActivities"
                :key="activity.id"
                :dot-color="activity.color"
                size="x-small"
              >
                <div class="activity-item">
                  <p class="text-body-2 mb-1">
                    {{ activity.description }}
                  </p>
                  <p class="text-caption text-medium-emphasis mb-0">
                    {{ formatDate(activity.created_at) }}
                  </p>
                </div>
              </VTimelineItem>
            </VTimeline>
            <VAlert
              v-else
              type="info"
              variant="tonal"
              density="compact"
            >
              No hay actividad reciente
            </VAlert>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>

<style scoped lang="scss">
.project-overview-tab {
  padding: 1rem;
}

.stat-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 10%);
    transform: translateY(-4px);
  }
}

.stat-card-compact {
  transition: transform 0.15s ease;

  &:hover {
    transform: translateY(-2px);
  }
}

.timeline-info {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.5rem;

  .timeline-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .timeline-divider {
    display: flex;
    align-items: center;
  }
}

.activity-item {
  padding-block: 0.5rem;
}
</style>
