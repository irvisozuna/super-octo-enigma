<script setup lang="ts">
import { computed } from 'vue'
import { useWidgetRefresh } from '../composables/useWidgetRefresh'
import type { WidgetInstanceConfig } from '../../domain/types/WidgetTypes'

interface Props {
  widget: WidgetInstanceConfig
  autoRefresh?: boolean
  refreshInterval?: number
}

const props = withDefaults(defineProps<Props>(), {
  autoRefresh: false,
  refreshInterval: 60,
})

const emit = defineEmits<{
  refresh: []
  edit: []
}>()

const {
  widgetData,
  loading,
  error,
  isAutoRefreshing,
  manualRefresh,
} = useWidgetRefresh(props.widget.id, {
  autoRefresh: props.autoRefresh,
  interval: props.refreshInterval,
  refreshOnMount: true,
  refreshOnFocus: true,
})

// Obtener config de display
const displayConfig = computed(() => props.widget.widget?.props.displayConfig)

// Calcular el valor principal del stat
const value = computed(() => {
  if (!widgetData.value || widgetData.value.rows.length === 0)
    return 0

  const firstRow = widgetData.value.rows[0]
  const valueField = displayConfig.value?.valueField || widgetData.value.columns[0]

  return firstRow[valueField] || 0
})

// Calcular valor de comparación (para trend)
const compareValue = computed(() => {
  if (!displayConfig.value?.compareField || !widgetData.value)
    return null

  const firstRow = widgetData.value.rows[0]

  return firstRow[displayConfig.value.compareField] || null
})

// Calcular tendencia
const trend = computed(() => {
  if (compareValue.value === null)
    return null

  const current = Number(value.value)
  const previous = Number(compareValue.value)

  if (previous === 0)
    return null

  const change = ((current - previous) / previous) * 100

  return {
    value: change,
    isPositive: change > 0,
    isNegative: change < 0,
  }
})

// Formatear valor
const formattedValue = computed(() => {
  const val = Number(value.value)
  const format = displayConfig.value?.format || 'number'
  const decimals = displayConfig.value?.decimals ?? 0
  const prefix = displayConfig.value?.prefix || ''
  const suffix = displayConfig.value?.suffix || ''

  let formatted = ''

  switch (format) {
    case 'currency':
      formatted = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(val)
      break

    case 'percent':
      formatted = `${val.toFixed(decimals)}%`
      break

    case 'compact':
      formatted = new Intl.NumberFormat('es-MX', {
        notation: 'compact',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(val)
      break

    default:
      formatted = new Intl.NumberFormat('es-MX', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(val)
  }

  return `${prefix}${formatted}${suffix}`
})

// Color del stat
const statColor = computed(() => {
  if (displayConfig.value?.color)
    return displayConfig.value.color

  if (trend.value?.isPositive)
    return 'success'
  if (trend.value?.isNegative)
    return 'error'

  return 'primary'
})

// Icono
const icon = computed(() => {
  return displayConfig.value?.icon || props.widget.widget?.props.icon || 'tabler-hash'
})

async function handleRefresh() {
  await manualRefresh()
  emit('refresh')
}
</script>

<template>
  <VCard
    flat
    :loading="loading"
    :color="displayConfig?.backgroundColor"
    class="stat-widget"
  >
    <VCardText>
      <div class="d-flex align-center justify-space-between mb-4">
        <div class="d-flex align-center">
          <VAvatar
            :color="statColor"
            :icon="icon"
            size="48"
            variant="tonal"
            class="me-3"
          />
          <div>
            <p class="text-caption text-medium-emphasis mb-1">
              {{ widget.title || widget.widget?.props.name }}
            </p>
            <p
              v-if="widget.description"
              class="text-caption text-disabled"
            >
              {{ widget.description }}
            </p>
          </div>
        </div>

        <VBtn
          icon
          variant="text"
          size="small"
          @click="handleRefresh"
        >
          <VIcon icon="tabler-refresh" />
        </VBtn>
      </div>

      <!-- Error State -->
      <VAlert
        v-if="error"
        type="error"
        variant="tonal"
        density="compact"
        class="mb-4"
      >
        {{ error }}
      </VAlert>

      <!-- Value -->
      <div class="stat-value-container">
        <h2
          class="stat-value"
          :class="`text-${statColor}`"
        >
          {{ formattedValue }}
        </h2>

        <!-- Trend -->
        <div
          v-if="trend"
          class="stat-trend"
          :class="{
            'text-success': trend.isPositive,
            'text-error': trend.isNegative,
          }"
        >
          <VIcon
            :icon="trend.isPositive ? 'tabler-trending-up' : 'tabler-trending-down'"
            size="20"
          />
          <span class="text-sm font-weight-medium">
            {{ Math.abs(trend.value).toFixed(1) }}%
          </span>
        </div>
      </div>

      <!-- Compare Label -->
      <p
        v-if="displayConfig?.compareLabel"
        class="text-caption text-medium-emphasis mt-2"
      >
        {{ displayConfig.compareLabel }}
      </p>

      <!-- Auto-refresh indicator -->
      <div
        v-if="isAutoRefreshing"
        class="text-caption text-disabled mt-2"
      >
        <VIcon
          icon="tabler-refresh"
          size="12"
          class="me-1"
        />
        Auto-refresh activo
      </div>
    </VCardText>
  </VCard>
</template>

<style scoped lang="scss">
.stat-widget {
  block-size: 100%;
}

.stat-value-container {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.stat-value {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
