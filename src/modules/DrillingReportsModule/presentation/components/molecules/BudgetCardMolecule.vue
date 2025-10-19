<script setup lang="ts">
import { computed } from 'vue'
import ProjectProgressBarAtom from '../atoms/ProjectProgressBarAtom.vue'

export interface BudgetCardProps {
  total: number
  current: number
  currency?: string
  loading?: boolean
  showProjection?: boolean
  projectedTotal?: number
}

const props = withDefaults(defineProps<BudgetCardProps>(), {
  currency: 'MXN',
  loading: false,
  showProjection: false,
})

defineEmits<{
  'view-details': []
  'add-expense': []
}>()

const remaining = computed(() => Math.max(0, props.total - props.current))

const utilizationPercentage = computed(() => {
  if (props.total === 0)
    return 0

  return (props.current / props.total) * 100
})

const budgetStatus = computed(() => {
  if (props.current > props.total) {
    return {
      color: 'error',
      label: 'Sobre Presupuesto',
      icon: 'tabler-alert-triangle',
    }
  }
  if (utilizationPercentage.value >= 90) {
    return {
      color: 'warning',
      label: 'Crítico',
      icon: 'tabler-alert-circle',
    }
  }
  if (utilizationPercentage.value >= 75) {
    return {
      color: 'warning',
      label: 'Alto',
      icon: 'tabler-alert-octagon',
    }
  }

  return {
    color: 'success',
    label: 'En Rango',
    icon: 'tabler-circle-check',
  }
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: props.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}
</script>

<template>
  <VSkeletonLoader
    :loading="loading"
    type="card"
    transition="fade-transition"
  >
    <VCard
      variant="outlined"
      class="budget-card"
    >
      <VCardText>
        <div class="d-flex align-center justify-space-between mb-4">
          <div class="d-flex align-center gap-2">
            <VAvatar
              :color="budgetStatus.color"
              size="48"
              variant="tonal"
            >
              <VIcon
                :icon="budgetStatus.icon"
                size="28"
              />
            </VAvatar>
            <div>
              <h6 class="text-h6 mb-0">
                Presupuesto
              </h6>
              <p class="text-caption text-medium-emphasis mb-0">
                {{ currency }}
              </p>
            </div>
          </div>
          <VChip
            :color="budgetStatus.color"
            variant="tonal"
            size="small"
          >
            {{ budgetStatus.label }}
          </VChip>
        </div>

        <div class="budget-amounts mb-4">
          <div class="amount-item">
            <p class="text-caption text-medium-emphasis mb-1">
              Presupuesto Total
            </p>
            <h4 class="text-h4 font-weight-bold mb-0">
              {{ formatCurrency(total) }}
            </h4>
          </div>
          <div class="amount-item">
            <p class="text-caption text-medium-emphasis mb-1">
              Costo Actual
            </p>
            <h5
              class="text-h5 font-weight-bold mb-0"
              :class="`text-${budgetStatus.color}`"
            >
              {{ formatCurrency(current) }}
            </h5>
          </div>
          <div class="amount-item">
            <p class="text-caption text-medium-emphasis mb-1">
              Disponible
            </p>
            <h5 class="text-h5 font-weight-bold mb-0 text-success">
              {{ formatCurrency(remaining) }}
            </h5>
          </div>
        </div>

        <VDivider class="mb-4" />

        <ProjectProgressBarAtom
          :current="current"
          :total="total"
          label="Utilización del Presupuesto"
          current-label="Gastado"
          total-label="Total"
          :height="12"
          format-type="currency"
          :color-threshold="{ warning: 75, danger: 90 }"
        />

        <div
          v-if="showProjection && projectedTotal"
          class="mt-4"
        >
          <VDivider class="mb-3" />
          <div class="d-flex align-center justify-space-between">
            <div class="d-flex align-center gap-2">
              <VIcon
                icon="tabler-trending-up"
                size="20"
                class="text-warning"
              />
              <span class="text-body-2 text-medium-emphasis">Proyección de Gasto</span>
            </div>
            <span class="text-body-1 font-weight-bold text-warning">
              {{ formatCurrency(projectedTotal) }}
            </span>
          </div>
          <p class="text-caption text-medium-emphasis mt-2 mb-0">
            Basado en tendencia actual
          </p>
        </div>
      </VCardText>

      <VCardActions>
        <VBtn
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
          color="primary"
          variant="tonal"
          size="small"
          prepend-icon="tabler-plus"
          @click="$emit('add-expense')"
        >
          Agregar Gasto
        </VBtn>
      </VCardActions>
    </VCard>
  </VSkeletonLoader>
</template>

<style scoped lang="scss">
.budget-card {
  block-size: 100%;
}

.budget-amounts {
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
