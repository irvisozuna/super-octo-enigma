<script setup lang="ts">
import { computed } from 'vue'

export interface ProjectProgressBarProps {
  current: number
  total: number
  label?: string
  currentLabel?: string
  totalLabel?: string
  height?: number
  rounded?: boolean
  striped?: boolean
  indeterminate?: boolean
  showDetails?: boolean
  colorThreshold?: {
    warning: number
    danger: number
  }
  formatType?: 'number' | 'currency' | 'percentage'
}

const props = withDefaults(defineProps<ProjectProgressBarProps>(), {
  label: 'Progreso',
  currentLabel: 'Actual',
  totalLabel: 'Total',
  height: 8,
  rounded: true,
  striped: false,
  indeterminate: false,
  showDetails: true,
  colorThreshold: () => ({
    warning: 75,
    danger: 90,
  }),
  formatType: 'number',
})

const percentage = computed(() => {
  if (props.total === 0)
    return 0

  return Math.min(Math.round((props.current / props.total) * 100), 100)
})

const progressColor = computed(() => {
  if (percentage.value >= props.colorThreshold.danger)
    return 'error'
  if (percentage.value >= props.colorThreshold.warning)
    return 'warning'

  return 'success'
})

const percentageColor = computed(() => {
  return `text-${progressColor.value}`
})

const formatValue = (value: number) => {
  switch (props.formatType) {
  case 'currency':
    return `$${value.toLocaleString()}`
  case 'percentage':
    return `${value}%`
  default:
    return value.toLocaleString()
  }
}
</script>

<template>
  <div class="project-progress-bar">
    <div class="d-flex justify-space-between align-center mb-2">
      <span class="text-body-2 font-weight-medium">{{ label }}</span>
      <span
        class="text-body-2 font-weight-bold"
        :class="percentageColor"
      >
        {{ percentage }}%
      </span>
    </div>
    <VProgressLinear
      :model-value="percentage"
      :color="progressColor"
      :height="height"
      :rounded="rounded"
      :striped="striped"
      :indeterminate="indeterminate"
    />
    <div
      v-if="showDetails"
      class="d-flex justify-space-between mt-2"
    >
      <span class="text-caption text-medium-emphasis">{{ currentLabel }}: {{ formatValue(current) }}</span>
      <span class="text-caption text-medium-emphasis">{{ totalLabel }}: {{ formatValue(total) }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.project-progress-bar {
  inline-size: 100%;
}
</style>
