<script setup lang="ts">
import { computed } from 'vue'
import type { VehicleType } from '../../../../shared/types'
import { ICONS, VEHICLE_TYPE_LABELS } from '../../../../shared/constants'

interface Props {
  vehicleType: VehicleType
  size?: string | number
  showTooltip?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 24,
  showTooltip: true,
})

const vehicleIcon = computed(() => {
  return ICONS.VEHICLE_TYPES[props.vehicleType] || ICONS.VEHICLE_TYPES.OTHER
})

const vehicleTypeLabel = computed(() => {
  return VEHICLE_TYPE_LABELS[props.vehicleType] || props.vehicleType
})

const iconColor = computed(() => {
  const colorMap = {
    MICROBUS: 'primary',
    TAXI: 'success',
    BUS: 'secondary',
    TRUCK: 'warning',
    MOTORCYCLE: 'error',
    OTHER: 'default',
  }

  return colorMap[props.vehicleType] || 'default'
})
</script>

<template>
  <VTooltip location="top">
    <template #activator="{ props: tooltipProps }">
      <VIcon
        v-bind="tooltipProps"
        :icon="vehicleIcon"
        :color="iconColor"
        :size="size"
        class="vehicle-type-icon"
      />
    </template>
    <span>{{ vehicleTypeLabel }}</span>
  </VTooltip>
</template>

<style scoped>
.vehicle-type-icon {
  cursor: help;
  transition: color 0.2s ease;
}

.vehicle-type-icon:hover {
  opacity: 0.8;
}
</style>
