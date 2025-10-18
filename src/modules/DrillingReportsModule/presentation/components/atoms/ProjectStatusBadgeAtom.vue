<script setup lang="ts">
import { computed } from 'vue'

export interface ProjectStatusBadgeProps {
  status: 'planned' | 'active' | 'completed' | 'suspended' | 'cancelled'
  size?: 'x-small' | 'small' | 'default' | 'large' | 'x-large'
  variant?: 'flat' | 'text' | 'elevated' | 'tonal' | 'outlined' | 'plain'
  showIcon?: boolean
}

const props = withDefaults(defineProps<ProjectStatusBadgeProps>(), {
  size: 'default',
  variant: 'tonal',
  showIcon: true,
})

const statusConfig = {
  planned: {
    color: 'info',
    label: 'Planificado',
    icon: 'tabler-clock',
  },
  active: {
    color: 'success',
    label: 'Activo',
    icon: 'tabler-circle-check',
  },
  completed: {
    color: 'success',
    label: 'Completado',
    icon: 'tabler-check',
  },
  suspended: {
    color: 'warning',
    label: 'Suspendido',
    icon: 'tabler-pause',
  },
  cancelled: {
    color: 'error',
    label: 'Cancelado',
    icon: 'tabler-x',
  },
}

const statusColor = computed(() => statusConfig[props.status]?.color || 'grey')
const statusLabel = computed(() => statusConfig[props.status]?.label || props.status)
const statusIcon = computed(() => statusConfig[props.status]?.icon || 'tabler-help-circle')

const iconSize = computed(() => {
  const sizeMap = {
    'x-small': 12,
    'small': 14,
    'default': 16,
    'large': 18,
    'x-large': 20,
  }

  return sizeMap[props.size]
})
</script>

<template>
  <VChip
    :color="statusColor"
    :variant="variant"
    :size="size"
    class="project-status-badge"
    :class="[`status-${status}`]"
  >
    <VIcon
      v-if="showIcon"
      :icon="statusIcon"
      :size="iconSize"
      start
    />
    {{ statusLabel }}
  </VChip>
</template>

<style scoped lang="scss">
.project-status-badge {
  font-weight: 500;
  text-transform: capitalize;
}
</style>
