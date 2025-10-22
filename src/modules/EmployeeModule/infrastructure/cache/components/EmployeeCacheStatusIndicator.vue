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

<script setup lang="ts">
import BaseCacheStatusIndicator from '@/@core/cache/components/BaseCacheStatusIndicator.vue'
import { useEmployeeCache } from '../composables/useEmployeeCache'

// Definir el componente para poder exportarlo
defineOptions({
  name: 'EmployeeCacheStatusIndicator'
})

interface Props {
  showDetailedInfo?: boolean
  showActions?: boolean
  variant?: 'chip' | 'badge' | 'icon'
  customStatusText?: string
  customStatusColor?: string
  customStatusIcon?: string
}

const props = withDefaults(defineProps<Props>(), {
  showDetailedInfo: true,
  showActions: true,
  variant: 'chip'
})

// Usar el composable de cache de empleados
const employeeCache = useEmployeeCache()
</script>
