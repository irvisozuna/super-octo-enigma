<script setup lang="ts">
import { useDocumentsCache } from '../composables/useDocumentsCache'
import BaseCacheStatusIndicator from '@/@core/cache/components/BaseCacheStatusIndicator.vue'

// Definir el componente para poder exportarlo
defineOptions({
  name: 'DocumentsCacheStatusIndicator',
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

// Usar el composable de cache de documentos
const documentsCache = useDocumentsCache()
</script>

<template>
  <BaseCacheStatusIndicator
    :cache-composable="documentsCache"
    module-name="Documentos"
    :show-detailed-info="showDetailedInfo"
    :show-actions="showActions"
    :variant="variant"
    :custom-status-text="customStatusText"
    :custom-status-color="customStatusColor"
    :custom-status-icon="customStatusIcon"
  />
</template>
