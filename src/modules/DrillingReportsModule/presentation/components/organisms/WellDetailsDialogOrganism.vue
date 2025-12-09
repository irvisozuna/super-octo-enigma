<script setup lang="ts">
import { computed } from 'vue'
import WellProgressVisualizationMolecule from '../molecules/WellProgressVisualizationMolecule.vue'
import { formatWellDiameter } from '../../../shared/utils/WellUtils'

interface Well {
  id: string
  company_id: string
  project_id: string
  well_number: string
  well_name: string
  surface_coordinates: {
    latitude: number
    longitude: number
  }
  bottom_coordinates?: {
    latitude: number
    longitude: number
  } | null
  status: string
  depth: {
    planned_meters: number
    current_meters: number
    remaining_meters: number
    progress_percentage: number
  }
  hole_diameter_inches: number
  purpose?: string | null
  well_type: string
  orientation?: {
    azimuth: number
    inclination: number
  }
  dates: {
    spud_date: string
    completion_date?: string | null
  }
  statistics: {
    drilling_section_count: number
    lithology_log_count: number
  }
  drilling_sections: any[]
  lithology_logs: any[]
  equipment_usage: any[]
  timestamps: {
    created_at: string
    updated_at: string
    deleted_at?: string | null
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
  if (!props.well?.depth)
    return 0

  return props.well.depth.progress_percentage || 0
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
          <span class="text-h6">{{ well.well_name }}</span>
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
              :depth-planned="well.depth?.planned_meters || 0"
              :depth-actual="well.depth?.current_meters || 0"
              :status="well.status"
              :well-name="well.well_name"
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

          <!-- Well Number -->
          <VCol
            cols="12"
            sm="6"
          >
            <div class="detail-block">
              <p class="text-caption text-medium-emphasis mb-1">
                <VIcon
                  icon="tabler-hash"
                  size="16"
                  class="me-1"
                />
                Número de Pozo
              </p>
              <p class="text-body-1 font-weight-medium">
                {{ well.well_number }}
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
                {{ well.depth?.planned_meters || 0 }} m
              </p>
            </div>
          </VCol>

          <!-- Current Depth -->
          <VCol
            v-if="well.depth?.current_meters > 0"
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
                {{ well.depth?.current_meters || 0 }} m
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
                {{ formatWellDiameter(well.hole_diameter_inches) }}
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
                {{ well.surface_coordinates?.latitude?.toFixed(6) || 'N/A' }}, {{ well.surface_coordinates?.longitude?.toFixed(6) || 'N/A' }}
              </p>
            </div>
          </VCol>

          <!-- Orientation -->
          <VCol
            v-if="well.orientation"
            cols="12"
            sm="6"
          >
            <div class="detail-block">
              <p class="text-caption text-medium-emphasis mb-1">
                <VIcon
                  icon="tabler-compass"
                  size="16"
                  class="me-1"
                />
                Orientación
              </p>
              <p class="text-body-2">
                Azimut: {{ well.orientation.azimuth?.toFixed(2) ?? 'N/A' }}°
              </p>
              <p class="text-body-2">
                Inclinación: {{ well.orientation.inclination?.toFixed(2) ?? 'N/A' }}°
              </p>
            </div>
          </VCol>

          <!-- Start Date -->
          <VCol
            v-if="well.dates?.spud_date"
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
                {{ new Date(well.dates.spud_date).toLocaleDateString() }}
              </p>
            </div>
          </VCol>

          <!-- Completion Date -->
          <VCol
            v-if="well.dates?.completion_date"
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
                {{ new Date(well.dates.completion_date).toLocaleDateString() }}
              </p>
            </div>
          </VCol>

          <!-- Progress Bar -->
          <VCol
            v-if="well.depth?.current_meters > 0"
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
                <span class="text-caption">{{ well.depth?.current_meters || 0 }} m</span>
                <span class="text-caption font-weight-bold">{{ progress.toFixed(1) }}%</span>
                <span class="text-caption">{{ well.depth?.planned_meters || 0 }} m</span>
              </div>
              <p
                v-if="well.depth?.remaining_meters > 0"
                class="text-caption text-medium-emphasis mt-2 mb-0"
              >
                Restante: {{ well.depth?.remaining_meters || 0 }} m
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
  padding-block: 0.5rem;
  padding-inline: 0;
}
</style>
