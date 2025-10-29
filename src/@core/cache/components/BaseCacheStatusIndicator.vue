<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { BaseCacheComposable } from '../composables/useBaseCache'

// Definir el componente para poder exportarlo
defineOptions({
  name: 'BaseCacheStatusIndicator',
})

const props = withDefaults(defineProps<Props>(), {
  moduleName: 'Cache',
  showDetailedInfo: true,
  showActions: true,
  variant: 'chip',
})

interface Props {
  cacheComposable: BaseCacheComposable
  moduleName?: string
  showDetailedInfo?: boolean
  showActions?: boolean
  variant?: 'chip' | 'badge' | 'icon'
  customStatusText?: string
  customStatusColor?: string
  customStatusIcon?: string
}

const { t } = useI18n()

// Extraer propiedades del composable
const {
  isCacheAvailable,
  hasPendingChanges,
  hasConflicts,
  formattedStats,
  loading,
} = props.cacheComposable

// ========== ESTADO CALCULADO ==========

const statusColor = computed(() => {
  if (props.customStatusColor)
    return props.customStatusColor

  if (hasConflicts.value)
    return 'error'
  if (hasPendingChanges.value)
    return 'warning'
  if (!isCacheAvailable.value)
    return 'secondary'

  return 'success'
})

const statusIcon = computed(() => {
  if (props.customStatusIcon)
    return props.customStatusIcon

  if (hasConflicts.value)
    return 'tabler-alert-triangle'
  if (hasPendingChanges.value)
    return 'tabler-clock'
  if (!isCacheAvailable.value)
    return 'tabler-wifi-off'

  return 'tabler-check'
})

const statusText = computed(() => {
  if (props.customStatusText)
    return props.customStatusText

  if (hasConflicts.value)
    return t('cache.status.conflicts')
  if (hasPendingChanges.value)
    return t('cache.status.pending')
  if (!isCacheAvailable.value)
    return t('cache.status.offline')

  return t('cache.status.online')
})

const isSyncing = computed(() => loading.value)
const isEnabled = computed(() => isCacheAvailable.value)

const hasIssues = computed(() => {
  return hasConflicts.value || hasPendingChanges.value || !isCacheAvailable.value
})

const detailedTooltip = computed(() => {
  const stats = formattedStats.value

  return `
    ${t('cache.info.module')}: ${props.moduleName}
    ${t('cache.info.status')}: ${stats.status}
    ${t('cache.info.last_sync')}: ${stats.lastSync}
    ${t('cache.info.cache_size')}: ${stats.cacheSize}
    ${t('cache.info.efficiency')}: ${stats.efficiency}
  `.trim()
})

// ========== MÉTODOS ==========

async function handleForceSync() {
  try {
    await props.cacheComposable.forceSync()
  }
  catch (error) {
    console.error('Error en sincronización forzada:', error)
  }
}

async function handleClearCache() {
  try {
    await props.cacheComposable.clearCache()
  }
  catch (error) {
    console.error('Error limpiando cache:', error)
  }
}

async function handleToggleCache() {
  try {
    await props.cacheComposable.toggleCache(!isEnabled.value)
  }
  catch (error) {
    console.error('Error alternando cache:', error)
  }
}
</script>

<template>
  <VChip
    :color="statusColor"
    :variant="hasIssues ? 'flat' : 'outlined'"
    size="small"
    class="cache-status-indicator"
    :class="[`variant-${variant}`, { 'animate-pulse': isSyncing }]"
  >
    <VIcon
      :icon="statusIcon"
      size="16"
      class="mr-1"
      :class="{ 'animate-spin': isSyncing }"
    />

    <span class="text-caption">{{ statusText }}</span>

    <!-- Tooltip con información detallada -->
    <VTooltip
      v-if="showDetailedInfo"
      location="bottom"
      :text="detailedTooltip"
    >
      <template #activator="{ props }">
        <VIcon
          v-bind="props"
          icon="tabler-info-circle"
          size="14"
          class="ml-1 opacity-60"
        />
      </template>
    </VTooltip>

    <!-- Menú de acciones -->
    <VMenu v-if="showActions">
      <template #activator="{ props }">
        <VIcon
          v-bind="props"
          icon="tabler-dots-vertical"
          size="14"
          class="ml-1 opacity-60"
        />
      </template>

      <VList>
        <VListItem
          :disabled="isSyncing"
          @click="handleForceSync"
        >
          <template #prepend>
            <VIcon icon="tabler-refresh" />
          </template>
          <VListItemTitle>{{ $t('cache.actions.force_sync') }}</VListItemTitle>
        </VListItem>

        <VListItem
          :disabled="isSyncing"
          @click="handleClearCache"
        >
          <template #prepend>
            <VIcon icon="tabler-trash" />
          </template>
          <VListItemTitle>{{ $t('cache.actions.clear_cache') }}</VListItemTitle>
        </VListItem>

        <VListItem
          :disabled="isSyncing"
          @click="handleToggleCache"
        >
          <template #prepend>
            <VIcon :icon="isEnabled ? 'tabler-toggle-right' : 'tabler-toggle-left'" />
          </template>
          <VListItemTitle>
            {{ isEnabled ? $t('cache.actions.disable') : $t('cache.actions.enable') }}
          </VListItemTitle>
        </VListItem>
      </VList>
    </VMenu>
  </VChip>
</template>

<style scoped>
.cache-status-indicator {
  transition: all 0.2s ease;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

/* Variantes de estilo */
.cache-status-indicator.variant-badge {
  border-radius: 12px;
  padding-block: 4px;
  padding-inline: 8px;
}

.cache-status-indicator.variant-icon {
  justify-content: center;
  block-size: 32px;
  inline-size: 32px;
  min-inline-size: auto;
}

/* Estados específicos */
.cache-status-indicator[data-status="error"] {
  background-color: rgb(var(--v-theme-error));
  color: white;
}

.cache-status-indicator[data-status="warning"] {
  background-color: rgb(var(--v-theme-warning));
  color: white;
}

.cache-status-indicator[data-status="success"] {
  background-color: rgb(var(--v-theme-success));
  color: white;
}
</style>
