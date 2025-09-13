<script setup lang="ts">
import { computed } from 'vue'
import type { EntityStatus } from '../../../../shared/types'
import { ICONS, STATUS_LABELS } from '../../../../shared/constants'

interface Props {
  status: EntityStatus
  variant?: 'flat' | 'tonal' | 'outlined' | 'text' | 'elevated'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'tonal',
})

const statusColor = computed(() => {
  const colorMap = {
    ACTIVE: 'success',
    INACTIVE: 'default',
    PENDING: 'warning',
    SUSPENDED: 'error',
    CANCELLED: 'error',
  }

  return colorMap[props.status] || 'default'
})

const statusLabel = computed(() => {
  return STATUS_LABELS[props.status] || props.status
})

const statusIcon = computed(() => {
  return ICONS.STATUS[props.status] || ICONS.STATUS.INACTIVE
})
</script>

<template>
  <VChip
    :color="statusColor"
    :variant="variant"
    size="small"
    class="vehicle-status-chip"
  >
    <VIcon
      :icon="statusIcon"
      start
      size="16"
    />
    {{ statusLabel }}
  </VChip>
</template>

<style scoped>
.vehicle-status-chip {
  font-weight: 500;
  letter-spacing: 0.025em;
}
</style>
