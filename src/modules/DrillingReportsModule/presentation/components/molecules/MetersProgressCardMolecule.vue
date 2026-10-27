<script setup lang="ts">
import { computed } from 'vue'
import ProjectProgressBarAtom from '../atoms/ProjectProgressBarAtom.vue'

/**
 * Avance del proyecto en metros: lo perforado en todos sus pozos contra los metros contratados,
 * comparado con el tiempo transcurrido del proyecto (como el presupuesto, pero en metros).
 */
export interface MetersProgressCardProps {
  target: number
  drilled: number
  /** 'target' = metros contratados del proyecto; 'wells' = suma de lo planeado en los pozos */
  source: 'target' | 'wells'
  /** % del plazo transcurrido; null si el proyecto no tiene fecha estimada de fin */
  timePercentage: number | null
  wellCount: number
  suspendedCount: number
  loading?: boolean
}

const props = withDefaults(defineProps<MetersProgressCardProps>(), {
  loading: false,
})

defineEmits<{
  'view-wells': []
  'set-target': []
}>()

/** Diferencia (en puntos) entre avance en metros y avance en tiempo que se considera "en tiempo" */
const ON_TIME_TOLERANCE = 5

const remaining = computed(() => Math.max(0, props.target - props.drilled))
const metersPercentage = computed(() => props.target > 0 ? (props.drilled / props.target) * 100 : 0)

const pace = computed(() => {
  if (props.target <= 0)
    return { color: 'secondary', label: 'Sin meta', icon: 'tabler-ruler-measure' }
  if (props.timePercentage === null)
    return { color: 'info', label: 'Sin fecha de fin', icon: 'tabler-calendar-question' }
  const gap = metersPercentage.value - props.timePercentage
  if (gap < -ON_TIME_TOLERANCE)
    return { color: 'error', label: `Atrasado ${Math.abs(gap).toFixed(0)} pts`, icon: 'tabler-trending-down' }
  if (gap > ON_TIME_TOLERANCE)
    return { color: 'success', label: `Adelantado ${gap.toFixed(0)} pts`, icon: 'tabler-trending-up' }

  return { color: 'success', label: 'En tiempo', icon: 'tabler-circle-check' }
})

const formatMeters = (value: number) =>
  `${new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 }).format(value)} m`
</script>

<template>
  <VSkeletonLoader
    :loading="loading"
    type="card"
    transition="fade-transition"
  >
    <VCard
      variant="outlined"
      class="meters-card"
    >
      <VCardText>
        <div class="d-flex align-center justify-space-between mb-4">
          <div class="d-flex align-center gap-2">
            <VAvatar
              :color="pace.color"
              size="48"
              variant="tonal"
            >
              <VIcon
                :icon="pace.icon"
                size="28"
              />
            </VAvatar>
            <div>
              <h6 class="text-h6 mb-0">
                Avance en metros
              </h6>
              <p class="text-caption text-medium-emphasis mb-0">
                {{ wellCount }} {{ wellCount === 1 ? 'pozo' : 'pozos' }}<span v-if="suspendedCount"> · {{ suspendedCount }} en stand-by</span>
              </p>
            </div>
          </div>
          <VChip
            :color="pace.color"
            variant="tonal"
            size="small"
          >
            {{ pace.label }}
          </VChip>
        </div>

        <div class="meters-amounts mb-4">
          <div class="amount-item">
            <p class="text-caption text-medium-emphasis mb-1">
              {{ source === 'target' ? 'Metros contratados' : 'Planeado en pozos' }}
            </p>
            <h4 class="text-h4 font-weight-bold mb-0">
              {{ formatMeters(target) }}
            </h4>
          </div>
          <div class="amount-item">
            <p class="text-caption text-medium-emphasis mb-1">
              Perforado
            </p>
            <h5 class="text-h5 font-weight-bold mb-0 text-primary">
              {{ formatMeters(drilled) }}
            </h5>
          </div>
          <div class="amount-item">
            <p class="text-caption text-medium-emphasis mb-1">
              Faltan
            </p>
            <h5 class="text-h5 font-weight-bold mb-0">
              {{ formatMeters(remaining) }}
            </h5>
          </div>
        </div>

        <VDivider class="mb-4" />

        <ProjectProgressBarAtom
          :current="drilled"
          :total="target"
          label="Metros perforados (reportes aprobados)"
          current-label="Perforado"
          total-label="Meta"
          :height="12"
          :color-threshold="{ warning: 101, danger: 101 }"
        />
        <p
          v-if="timePercentage !== null"
          class="text-caption text-medium-emphasis mt-2 mb-0"
        >
          Tiempo transcurrido del proyecto: {{ timePercentage.toFixed(0) }} %
        </p>
        <VAlert
          v-if="source === 'wells'"
          type="info"
          variant="tonal"
          density="compact"
          class="mt-3"
        >
          El proyecto no tiene metros contratados: la meta es la suma de lo planeado en sus pozos.
        </VAlert>
      </VCardText>

      <VCardActions>
        <VBtn
          variant="text"
          size="small"
          @click="$emit('view-wells')"
        >
          Ver pozos
          <VIcon
            end
            icon="tabler-arrow-right"
            size="18"
          />
        </VBtn>
        <VSpacer />
        <VBtn
          v-if="source === 'wells'"
          color="primary"
          variant="tonal"
          size="small"
          prepend-icon="tabler-ruler-measure"
          @click="$emit('set-target')"
        >
          Capturar metros contratados
        </VBtn>
      </VCardActions>
    </VCard>
  </VSkeletonLoader>
</template>

<style scoped lang="scss">
.meters-card {
  block-size: 100%;
}

.meters-amounts {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));

  .amount-item {
    padding: 1rem;
    border-radius: 8px;
    background-color: rgba(var(--v-theme-on-surface), 0.02);
  }
}
</style>
