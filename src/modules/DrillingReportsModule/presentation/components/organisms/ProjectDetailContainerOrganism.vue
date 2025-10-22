<script setup lang="ts">
import { computed } from 'vue'
import type { Project } from '../../../domain/types'

/**
 * Container principal para el detalle del proyecto
 * Organism siguiendo Atomic Design
 * Gestiona el layout y la estructura principal
 */

interface Props {
  project: Project | null
  loading?: boolean
  error?: Error | null
}

interface Emits {
  (e: 'edit'): void
  (e: 'delete'): void
  (e: 'status-change', action: string): void
  (e: 'refresh'): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
})

const emit = defineEmits<Emits>()

// Computed para calcular el porcentaje de uso del presupuesto
const budgetUsagePercentage = computed(() => {
  if (!props.project?.budget?.total || props.project.budget.total === 0)
    return 0

  const currentCost = props.project.budget?.current_cost || 0
  const total = props.project.budget.total

  return Math.round((currentCost / total) * 100)
})

// Computed para el estado del proyecto
const projectStatus = computed(() => props.project?.status || 'unknown')

const statusColor = computed(() => {
  const colors: Record<string, string> = {
    planned: 'info',
    active: 'success',
    suspended: 'warning',
    completed: 'primary',
    cancelled: 'error',
    unknown: 'grey',
  }

  return colors[projectStatus.value] || 'grey'
})

const statusIcon = computed(() => {
  const icons: Record<string, string> = {
    planned: 'tabler-calendar-clock',
    active: 'tabler-player-play',
    suspended: 'tabler-pause',
    completed: 'tabler-check',
    cancelled: 'tabler-x',
    unknown: 'tabler-help-circle',
  }

  return icons[projectStatus.value] || 'tabler-help-circle'
})

// Actions disponibles según estado
const availableActions = computed(() => {
  const actions = []

  switch (projectStatus.value) {
    case 'planned':
      actions.push(
        { icon: 'tabler-player-play', label: 'Iniciar', action: 'start', color: 'success' },
        { icon: 'tabler-x', label: 'Cancelar', action: 'cancel', color: 'error' },
    )
      break
    case 'active':
      actions.push(
        { icon: 'tabler-pause', label: 'Suspender', action: 'suspend', color: 'warning' },
        { icon: 'tabler-check', label: 'Completar', action: 'complete', color: 'primary' },
        { icon: 'tabler-x', label: 'Cancelar', action: 'cancel', color: 'error' },
    )
      break
    case 'suspended':
      actions.push(
        { icon: 'tabler-player-play', label: 'Reanudar', action: 'resume', color: 'success' },
        { icon: 'tabler-check', label: 'Completar', action: 'complete', color: 'primary' },
        { icon: 'tabler-x', label: 'Cancelar', action: 'cancel', color: 'error' },
    )
      break
  }

  return actions
})

// Formatear fecha
function formatDate(date: string | null | undefined): string {
  if (!date)
    return 'N/A'

  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// Handlers
function handleStatusAction(action: string) {
  emit('status-change', action)
}
</script>

<template>
  <div class="project-detail-container">
    <!-- Loading Overlay -->
    <VOverlay
      v-if="loading"
      :model-value="loading"
      class="align-center justify-center"
      contained
      persistent
    >
      <VProgressCircular
        indeterminate
        size="64"
      />
    </VOverlay>

    <!-- Error State -->
    <VAlert
      v-else-if="error"
      type="error"
      prominent
      variant="tonal"
      class="ma-4"
    >
      <template #title>
        Error al cargar el proyecto
      </template>
      {{ error.message }}
      <template #actions>
        <VBtn
          variant="text"
          @click="emit('refresh')"
        >
          Reintentar
        </VBtn>
      </template>
    </VAlert>

    <!-- Main Content -->
    <template v-else-if="project">
      <!-- Header Card - Opción 2: Compacto y Moderno -->
      <VCard class="mb-4 project-header-card">
        <VCardText class="pa-6">
          <!-- Fila 1: Título y acciones -->
          <div class="d-flex align-center justify-space-between mb-3">
            <div class="d-flex align-center gap-3">
              <VAvatar
                :color="statusColor"
                size="40"
                variant="tonal"
              >
                <VIcon
                  :icon="statusIcon"
                  size="20"
                />
              </VAvatar>
              <div>
                <div class="d-flex align-center gap-2">
                  <h5 class="text-h5 mb-0">
                    {{ project.project_name }}
                  </h5>
                  <VChip
                    :color="statusColor"
                    variant="flat"
                    size="small"
                    class="text-capitalize"
                  >
                    {{ project.status }}
                  </VChip>
                </div>
                <div class="text-body-2 text-medium-emphasis mt-1">
                  {{ project.project_code }}
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="d-flex gap-1">
              <!-- Refresh -->
              <VBtn
                icon="tabler-refresh"
                variant="text"
                size="small"
                @click="emit('refresh')"
              />

              <!-- Edit -->
              <VBtn
                v-if="projectStatus !== 'completed' && projectStatus !== 'cancelled'"
                icon="tabler-pencil"
                variant="text"
                size="small"
                @click="emit('edit')"
              />

              <!-- More Actions Menu -->
              <VMenu>
                <template #activator="{ props: menuProps }">
                  <VBtn
                    icon="tabler-dots-vertical"
                    variant="text"
                    size="small"
                    v-bind="menuProps"
                  />
                </template>
                <VList>
                  <!-- Status Actions -->
                  <VListItem
                    v-for="action in availableActions"
                    :key="action.action"
                    :prepend-icon="action.icon"
                    @click="handleStatusAction(action.action)"
                  >
                    <VListItemTitle>{{ action.label }}</VListItemTitle>
                  </VListItem>

                  <!-- Delete -->
                  <VDivider v-if="projectStatus === 'planned' && availableActions.length > 0" />
                  <VListItem
                    v-if="projectStatus === 'planned'"
                    prepend-icon="tabler-trash"
                    @click="emit('delete')"
                  >
                    <VListItemTitle class="text-error">
                      Eliminar
                    </VListItemTitle>
                  </VListItem>
                </VList>
              </VMenu>
            </div>
          </div>

          <!-- Fila 2: Métricas clave en formato compacto -->
          <div class="metrics-bar d-flex align-center gap-4 flex-wrap mb-3">
            <!-- Presupuesto -->
            <div class="metric-item d-flex align-center gap-2">
              <VIcon
                icon="tabler-wallet"
                size="18"
                color="success"
              />
              <div>
                <span class="text-body-2 font-weight-medium">
                  ${{ (project.budget?.current_cost || 0).toLocaleString() }}
                </span>
                <span class="text-caption text-medium-emphasis">
                  / ${{ (project.budget?.total || 0).toLocaleString() }}
                </span>
                <span class="text-caption text-medium-emphasis ml-1">
                  ({{ project.budget?.usage_percentage || 0 }}%)
                </span>
              </div>
            </div>

            <VDivider
              vertical
              class="my-1"
            />

            <!-- Ubicación -->
            <div class="metric-item d-flex align-center gap-2">
              <VIcon
                icon="tabler-map-pin"
                size="18"
                color="primary"
              />
              <span class="text-body-2">
                {{ project.general_location || 'Sin ubicación' }}
              </span>
            </div>

            <VDivider
              vertical
              class="my-1"
            />

            <!-- Fechas -->
            <div class="metric-item d-flex align-center gap-2">
              <VIcon
                icon="tabler-calendar"
                size="18"
                color="warning"
              />
              <span class="text-body-2">
                {{ formatDate(project.dates?.start_date) }}
                <span
                  v-if="project.dates?.end_date"
                  class="text-medium-emphasis"
                >
                  - {{ formatDate(project.dates?.end_date) }}
                </span>
              </span>
            </div>

            <VDivider
              vertical
              class="my-1"
            />

            <!-- Reportes -->
            <div class="metric-item d-flex align-center gap-2">
              <VIcon
                icon="tabler-file-text"
                size="18"
                color="info"
              />
              <span class="text-body-2">
                <span class="font-weight-medium">{{ project.statistics?.reports_count || 0 }}</span>
                <span class="text-caption text-medium-emphasis ml-1">reportes</span>
              </span>
            </div>

            <VDivider
              vertical
              class="my-1"
            />

            <!-- Equipos -->
            <div class="metric-item d-flex align-center gap-2">
              <VIcon
                icon="tabler-tools"
                size="18"
                color="secondary"
              />
              <span class="text-body-2">
                <span class="font-weight-medium">{{ project.statistics?.equipment_count || 0 }}</span>
                <span class="text-caption text-medium-emphasis ml-1">equipos</span>
              </span>
            </div>
          </div>

          <!-- Fila 3: Barra de progreso del presupuesto -->
          <div class="mt-2">
            <VProgressLinear
              :model-value="budgetUsagePercentage"
              :color="budgetUsagePercentage >= 90 ? 'error' : budgetUsagePercentage >= 75 ? 'warning' : 'success'"
              height="6"
              rounded
              class="budget-progress"
            />
            <div class="d-flex justify-space-between mt-1">
              <span class="text-caption text-medium-emphasis">
                {{ budgetUsagePercentage }}% del presupuesto utilizado
              </span>
              <span
                class="text-caption font-weight-medium"
                :class="budgetUsagePercentage >= 90 ? 'text-error' : ''"
              >
                ${{ ((project.budget?.total || 0) - (project.budget?.current_cost || 0)).toLocaleString() }} restante
              </span>
            </div>
          </div>
        </VCardText>
      </VCard>

      <!-- Content Slot -->
      <div class="project-detail-content">
        <slot />
      </div>
    </template>

    <!-- Empty State -->
    <VCard
      v-else
      class="text-center py-12"
    >
      <VCardText>
        <VIcon
          icon="tabler-folder-off"
          size="64"
          color="grey"
        />
        <p class="text-h6 mt-4">
          No se encontró el proyecto
        </p>
        <p class="text-body-2 text-medium-emphasis">
          El proyecto solicitado no existe o ha sido eliminado
        </p>
      </VCardText>
    </VCard>
  </div>
</template>

<style scoped>
.project-header-card {
  overflow: hidden;
  border-radius: 12px !important;
}

.metrics-bar {
  border-radius: 8px;
  padding-block: 12px;
  padding-inline: 0;
}

.metric-item {
  white-space: nowrap;
}

.budget-progress {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 5%);
}

.project-detail-content {
  min-block-size: 400px;
}

/* Responsive */
@media (max-width: 960px) {
  .metrics-bar {
    flex-direction: column;
    align-items: flex-start !important;
    gap: 12px !important;
  }

  .metrics-bar .v-divider {
    display: none;
  }

  .metric-item {
    inline-size: 100%;
  }
}

@media (max-width: 600px) {
  .project-header-card :deep(.pa-6) {
    padding: 16px !important;
  }
}
</style>
