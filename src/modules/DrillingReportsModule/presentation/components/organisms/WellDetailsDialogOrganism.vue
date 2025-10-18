<script setup lang="ts">
import { computed } from 'vue'
import WellProgressVisualizationMolecule from '../molecules/WellProgressVisualizationMolecule.vue'

interface Well {
  id: string
  name: string
  status: string
  well_type: string
  depth_planned: number
  depth_actual?: number
  depth_remaining?: number
  progress_percentage?: number
  diameter: number
  coordinates: {
    latitude: number
    longitude: number
  }
  start_date?: string
  completion_date?: string
  purpose?: string
  statistics?: {
    drilling_section_count: number
    lithology_log_count: number
  }
}

interface Props {
  modelValue: boolean
  well: Well | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isOpen = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const progress = computed(() => {
  if (!props.well?.depth_actual || !props.well?.depth_planned)
    return 0

  return (props.well.depth_actual / props.well.depth_planned) * 100
})

const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    planned: 'info',
    drilling: 'primary',
    completed: 'success',
    abandoned: 'error',
  }

  return statusColors[status] || 'default'
}

const getStatusLabel = (status: string): string => {
  const statusLabels: Record<string, string> = {
    planned: 'Planificado',
    drilling: 'Perforando',
    completed: 'Completado',
    abandoned: 'Abandonado',
  }

  return statusLabels[status] || status
}

const getWellTypeLabel = (type: string): string => {
  const typeLabels: Record<string, string> = {
    exploration: 'Exploración',
    production: 'Producción',
    injection: 'Inyección',
    monitoring: 'Monitoreo',
  }

  return typeLabels[type] || type
}

const close = () => {
  emit('update:modelValue', false)
}
</script>

<template>
  <VDialog
    v-model="isOpen"
    max-width="700"
  >
    <VCard v-if="well">
      <VCardTitle class="d-flex align-center justify-space-between pa-4">
        <div class="d-flex align-center gap-2">
          <VIcon
            icon="tabler-droplet"
            color="primary"
            size="20"
          />
          <span class="text-h6">{{ well.name }}</span>
        </div>
        <VBtn
          icon="tabler-x"
          variant="text"
          size="small"
          @click="close"
        />
      </VCardTitle>

      <VDivider />

      <VCardText class="pa-4">
        <!-- Well Visual Progress -->
        <VRow
          dense
          class="mb-4"
        >
          <VCol cols="12">
            <WellProgressVisualizationMolecule
              :depth-planned="well.depth_planned"
              :depth-actual="well.depth_actual || 0"
              :status="well.status"
              :well-name="well.name"
            />
          </VCol>
        </VRow>

        <VDivider class="my-4" />

        <VRow dense>
          <!-- Status -->
          <VCol
            cols="12"
            sm="6"
          >
            <div class="detail-block">
              <p class="text-caption text-medium-emphasis mb-1">
                Estado
              </p>
              <VChip
                :color="getStatusColor(well.status)"
                size="small"
                variant="tonal"
              >
                {{ getStatusLabel(well.status) }}
              </VChip>
            </div>
          </VCol>

          <!-- Well Type -->
          <VCol
            cols="12"
            sm="6"
          >
            <div class="detail-block">
              <p class="text-caption text-medium-emphasis mb-1">
                Tipo de Pozo
              </p>
              <p class="text-body-1 font-weight-medium">
                {{ getWellTypeLabel(well.well_type) }}
              </p>
            </div>
          </VCol>

          <!-- Planned Depth -->
          <VCol
            cols="12"
            sm="6"
          >
            <div class="detail-block">
              <p class="text-caption text-medium-emphasis mb-1">
                <VIcon
                  icon="tabler-arrow-down"
                  size="16"
                  class="me-1"
                />
                Profundidad Planificada
              </p>
              <p class="text-h6 font-weight-medium">
                {{ well.depth_planned }} m
              </p>
            </div>
          </VCol>

          <!-- Current Depth -->
          <VCol
            v-if="well.depth_actual"
            cols="12"
            sm="6"
          >
            <div class="detail-block">
              <p class="text-caption text-medium-emphasis mb-1">
                <VIcon
                  icon="tabler-ruler-measure"
                  size="16"
                  class="me-1"
                />
                Profundidad Actual
              </p>
              <p class="text-h6 font-weight-medium">
                {{ well.depth_actual }} m
              </p>
            </div>
          </VCol>

          <!-- Diameter -->
          <VCol
            cols="12"
            sm="6"
          >
            <div class="detail-block">
              <p class="text-caption text-medium-emphasis mb-1">
                <VIcon
                  icon="tabler-circle"
                  size="16"
                  class="me-1"
                />
                Diámetro
              </p>
              <p class="text-h6 font-weight-medium">
                {{ well.diameter }}"
              </p>
            </div>
          </VCol>

          <!-- Coordinates -->
          <VCol
            cols="12"
            sm="6"
          >
            <div class="detail-block">
              <p class="text-caption text-medium-emphasis mb-1">
                <VIcon
                  icon="tabler-map-pin"
                  size="16"
                  class="me-1"
                />
                Coordenadas
              </p>
              <p class="text-body-2">
                {{ well.coordinates.latitude.toFixed(6) }}, {{ well.coordinates.longitude.toFixed(6) }}
              </p>
            </div>
          </VCol>

          <!-- Start Date -->
          <VCol
            v-if="well.start_date"
            cols="12"
            sm="6"
          >
            <div class="detail-block">
              <p class="text-caption text-medium-emphasis mb-1">
                <VIcon
                  icon="tabler-calendar"
                  size="16"
                  class="me-1"
                />
                Fecha de Inicio
              </p>
              <p class="text-body-1">
                {{ new Date(well.start_date).toLocaleDateString() }}
              </p>
            </div>
          </VCol>

          <!-- Completion Date -->
          <VCol
            v-if="well.completion_date"
            cols="12"
            sm="6"
          >
            <div class="detail-block">
              <p class="text-caption text-medium-emphasis mb-1">
                <VIcon
                  icon="tabler-calendar-check"
                  size="16"
                  class="me-1"
                />
                Fecha de Completación
              </p>
              <p class="text-body-1">
                {{ new Date(well.completion_date).toLocaleDateString() }}
              </p>
            </div>
          </VCol>

          <!-- Progress Bar -->
          <VCol
            v-if="well.depth_actual !== undefined && well.depth_planned"
            cols="12"
          >
            <VDivider class="my-3" />
            <div class="detail-block">
              <p class="text-caption text-medium-emphasis mb-2">
                Progreso de Perforación
              </p>
              <VProgressLinear
                :model-value="progress"
                color="primary"
                height="8"
                rounded
              />
              <div class="d-flex justify-space-between mt-1">
                <span class="text-caption">{{ well.depth_actual }} m</span>
                <span class="text-caption font-weight-bold">{{ progress.toFixed(1) }}%</span>
                <span class="text-caption">{{ well.depth_planned }} m</span>
              </div>
              <p
                v-if="well.depth_remaining"
                class="text-caption text-medium-emphasis mt-2 mb-0"
              >
                Restante: {{ well.depth_remaining }} m
              </p>
            </div>
          </VCol>

          <!-- Statistics -->
          <VCol
            v-if="well.statistics"
            cols="12"
          >
            <VDivider class="my-3" />
            <p class="text-subtitle-2 mb-2">
              Estadísticas
            </p>
            <div class="d-flex gap-4">
              <div class="detail-block">
                <p class="text-caption text-medium-emphasis mb-1">
                  Secciones de Perforación
                </p>
                <p class="text-h6 font-weight-medium">
                  {{ well.statistics.drilling_section_count || 0 }}
                </p>
              </div>
              <div class="detail-block">
                <p class="text-caption text-medium-emphasis mb-1">
                  Registros Litológicos
                </p>
                <p class="text-h6 font-weight-medium">
                  {{ well.statistics.lithology_log_count || 0 }}
                </p>
              </div>
            </div>
          </VCol>

          <!-- Purpose -->
          <VCol
            v-if="well.purpose"
            cols="12"
          >
            <VDivider class="my-3" />
            <div class="detail-block">
              <p class="text-caption text-medium-emphasis mb-1">
                Propósito
              </p>
              <p class="text-body-2">
                {{ well.purpose }}
              </p>
            </div>
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <VCardActions class="pa-4">
        <VSpacer />
        <VBtn
          variant="text"
          @click="close"
        >
          Cerrar
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped lang="scss">
.detail-block {
  padding: 0.5rem 0;
}
</style>
