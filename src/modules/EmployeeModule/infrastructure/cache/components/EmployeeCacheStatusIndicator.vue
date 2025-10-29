<script setup lang="ts">
import { useEmployeeCache } from '../composables/useEmployeeCache'
import BaseCacheStatusIndicator from '@/@core/cache/components/BaseCacheStatusIndicator.vue'

// Definir el componente para poder exportarlo
defineOptions({
  name: 'EmployeeCacheStatusIndicator',
})

const props = withDefaults(defineProps<Props>(), {
  showDetailedInfo: true,
  showActions: true,
  variant: 'chip',
})

interface Props {
  showDetailedInfo?: boolean
  showActions?: boolean
  variant?: 'chip' | 'badge' | 'icon'
  customStatusText?: string
  customStatusColor?: string
  customStatusIcon?: string
}

// Usar el composable de cache de empleados
const employeeCache = useEmployeeCache()
</script>

<template>
  <BaseCacheStatusIndicator
    :cache-composable="employeeCache"
    module-name="Empleados"
    :show-detailed-info="showDetailedInfo"
    :show-actions="showActions"
    :variant="variant"
    :custom-status-text="customStatusText"
    :custom-status-color="customStatusColor"
    :custom-status-icon="customStatusIcon"
  />
</template>
