<script setup lang="ts">
import { computed } from 'vue'
import type { Well } from '../../../domain/entities/WellEntity'
import ProjectProgressBarAtom from '../atoms/ProjectProgressBarAtom.vue'

export interface WellInfoCardProps {
  well?: Well | null
  loading?: boolean
}

const props = defineProps<WellInfoCardProps>()

defineEmits<{
  'view-details': []
  'assign-well': []
  'change-well': []
}>()

const statusConfig = {
  planned: { color: 'info', label: 'Planificado' },
  drilling: { color: 'primary', label: 'Perforando' },
  completed: { color: 'success', label: 'Completado' },
  abandoned: { color: 'error', label: 'Abandonado' },
}

const wellTypeConfig = {
  exploration: 'Exploración',
  production: 'Producción',
  injection: 'Inyección',
  monitoring: 'Monitoreo',
}

const statusColor = computed(() => {
  if (!props.well)
    return 'grey'

  return statusConfig[props.well.status]?.color || 'grey'
})

const statusLabel = computed(() => {
  if (!props.well)
    return ''

  return statusConfig[props.well.status]?.label || props.well.status
})

const wellTypeLabel = computed(() => {
  if (!props.well)
    return ''

  return wellTypeConfig[props.well.well_type] || props.well.well_type
})
</script>

<template>
  <VSkeletonLoader
    :loading="loading"
    type="card"
    transition="fade-transition"
  >
    <VCard
      variant="outlined"
      class="well-info-card"
    >
      <VCardText class="pa-3">
        <div class="d-flex align-center gap-2 mb-3">
          <VAvatar
            :color="statusColor"
            size="40"
            variant="tonal"
          >
            <VIcon
              icon="tabler-droplet"
              size="20"
            />
          </VAvatar>
          <div class="flex-grow-1">
            <h6 class="text-subtitle-1 mb-0">
              {{ well?.name || 'Sin Pozo Asignado' }}
            </h6>
            <div class="d-flex align-center gap-2">
              <VChip
                v-if="well"
                :color="statusColor"
                size="x-small"
                variant="tonal"
                density="compact"
              >
                {{ statusLabel }}
              </VChip>
              <span
                v-if="well?.well_type"
                class="text-caption text-medium-emphasis"
              >
                {{ wellTypeLabel }}
              </span>
            </div>
          </div>
        </div>

        <template v-if="well">
          <VDivider class="mb-3" />

          <div class="well-details">
            <div class="detail-row-compact">
              <div class="detail-item-compact">
                <VIcon
                  icon="tabler-arrow-down"
                  size="16"
                  class="text-medium-emphasis"
                />
                <span class="text-caption text-medium-emphasis">Profundidad Planificada</span>
                <span class="text-body-2 font-weight-medium">{{ well.depth_planned }} m</span>
              </div>
              <div class="detail-item-compact">
                <VIcon
                  icon="tabler-circle"
                  size="16"
                  class="text-medium-emphasis"
                />
                <span class="text-caption text-medium-emphasis">Diámetro</span>
                <span class="text-body-2 font-weight-medium">{{ well.diameter }}"</span>
              </div>
            </div>

            <div class="detail-row-compact mt-2">
              <div class="detail-item-compact">
                <VIcon
                  icon="tabler-map-pin"
                  size="16"
                  class="text-medium-emphasis"
                />
                <span class="text-caption text-medium-emphasis">Coordenadas</span>
                <span class="text-caption">
                  {{ well.coordinates.latitude.toFixed(4) }}, {{ well.coordinates.longitude.toFixed(4) }}
                </span>
              </div>
            </div>

            <template v-if="well.depth_actual && well.depth_planned">
              <VDivider class="my-3" />
              <ProjectProgressBarAtom
                :current="well.depth_actual"
                :total="well.depth_planned"
                label="Progreso"
                current-label="Actual"
                total-label="Planificado"
                :height="8"
                format-type="number"
              />
            </template>
          </div>
        </template>

        <VAlert
          v-else
          type="info"
          variant="tonal"
          density="compact"
          class="mt-2"
        >
          No hay pozo asignado a este proyecto
        </VAlert>
      </VCardText>

      <VCardActions>
        <VBtn
          v-if="well"
          variant="text"
          size="small"
          @click="$emit('view-details')"
        >
          Ver Detalles
          <VIcon
            end
            icon="tabler-arrow-right"
            size="18"
          />
        </VBtn>
        <VSpacer />
        <VBtn
          v-if="!well"
          color="primary"
          variant="tonal"
          size="small"
          prepend-icon="tabler-plus"
          @click="$emit('assign-well')"
        >
          Asignar Pozo
        </VBtn>
        <VBtn
          v-else
          variant="text"
          size="small"
          prepend-icon="tabler-replace"
          @click="$emit('change-well')"
        >
          Cambiar Pozo
        </VBtn>
      </VCardActions>
    </VCard>
  </VSkeletonLoader>
</template>

<style scoped lang="scss">
.well-info-card {
  block-size: 100%;
}

.well-details {
  .detail-row {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }

  .detail-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .detail-row-compact {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .detail-item-compact {
    display: flex;
    flex: 1;
    align-items: center;
    gap: 0.5rem;
    min-inline-size: 120px;
  }
}
</style>
