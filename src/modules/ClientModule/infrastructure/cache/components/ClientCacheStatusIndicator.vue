<script setup lang="ts">
import { useClientCacheV2 } from '../composables/useClientCacheV2'
import BaseCacheStatusIndicator from '@/@core/cache/components/BaseCacheStatusIndicator.vue'

// Definir el componente para poder exportarlo
defineOptions({
  name: 'ClientCacheStatusIndicator',
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

// Usar el composable de cache de clientes refactorizado
const clientCache = useClientCacheV2()
</script>

<template>
  <BaseCacheStatusIndicator
    :cache-composable="clientCache"
    module-name="Clientes"
    :show-detailed-info="showDetailedInfo"
    :show-actions="showActions"
    :variant="variant"
    :custom-status-text="customStatusText"
    :custom-status-color="customStatusColor"
    :custom-status-icon="customStatusIcon"
  />
</template>
