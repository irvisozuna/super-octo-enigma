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

<script setup lang="ts">
import BaseCacheStatusIndicator from '@/@core/cache/components/BaseCacheStatusIndicator.vue'
import { useClientCacheV2 } from '../composables/useClientCacheV2'

// Definir el componente para poder exportarlo
defineOptions({
  name: 'ClientCacheStatusIndicator'
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

// Usar el composable de cache de clientes refactorizado
const clientCache = useClientCacheV2()
</script>
