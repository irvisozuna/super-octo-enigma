<script setup lang="ts">
import { computed } from 'vue'
import type { ApexOptions } from 'apexcharts'
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
}>()

const {
  widgetData,
  loading,
  error,
  manualRefresh,
} = useWidgetRefresh(props.widget.id, {
  autoRefresh: props.autoRefresh,
  interval: props.refreshInterval,
  refreshOnMount: true,
})

// Config de display
const displayConfig = computed(() => props.widget.widget?.props.displayConfig)

// Tipo de gráfico
const chartType = computed(() => {
  const type = props.widget.widget?.props.type

  switch (type) {
    case 'chart_line':
      return 'line'
    case 'chart_bar':
      return 'bar'
    case 'chart_pie':
      return 'pie'
    case 'chart_donut':
      return 'donut'
    case 'chart_area':
      return 'area'
    case 'chart_scatter':
      return 'scatter'
    default:
      return 'line'
  }
})

// Preparar series
const series = computed(() => {
  if (!widgetData.value || widgetData.value.rows.length === 0)
    return []

  const config = displayConfig.value
  const rows = widgetData.value.rows

  // Para pie/donut
  if (chartType.value === 'pie' || chartType.value === 'donut')
    return rows.map(row => Number(row[config?.yAxisField || widgetData.value.columns[1]]))

  // Para otros tipos
  const seriesField = config?.seriesField
  const yField = config?.yAxisField || widgetData.value.columns[1]

  if (seriesField) {
    // Agrupar por serie
    const grouped = rows.reduce((acc, row) => {
      const seriesName = row[seriesField]
      if (!acc[seriesName])
        acc[seriesName] = []

      acc[seriesName].push(Number(row[yField]))

      return acc
    }, {} as Record<string, number[]>)

    return Object.entries(grouped).map(([name, data]) => ({
      name,
      data,
    }))
  }

  // Serie única
  return [{
    name: config?.yAxisLabel || yField,
    data: rows.map(row => Number(row[yField])),
  }]
})

// Categorías (labels)
const categories = computed(() => {
  if (!widgetData.value || widgetData.value.rows.length === 0)
    return []

  const config = displayConfig.value
  const xField = config?.xAxisField || widgetData.value.columns[0]

  return widgetData.value.rows.map(row => row[xField])
})

// Opciones de ApexCharts
const chartOptions = computed<ApexOptions>(() => {
  const config = displayConfig.value

  return {
    chart: {
      type: chartType.value as any,
      height: config?.height || 350,
      toolbar: {
        show: config?.showToolbar ?? true,
      },
      zoom: {
        enabled: config?.enableZoom ?? true,
      },
    },
    plotOptions: {
      bar: {
        horizontal: config?.horizontal ?? false,
        borderRadius: 4,
      },
      pie: {
        donut: {
          size: chartType.value === 'donut' ? '65%' : undefined,
        },
      },
    },
    colors: config?.colors || undefined,
    dataLabels: {
      enabled: config?.showDataLabels ?? false,
    },
    stroke: {
      curve: config?.curve || 'smooth',
      width: config?.strokeWidth || 2,
    },
    grid: {
      show: config?.showGrid ?? true,
    },
    xaxis: {
      categories: categories.value,
      title: {
        text: config?.xAxisLabel,
      },
    },
    yaxis: {
      title: {
        text: config?.yAxisLabel,
      },
    },
    legend: {
      show: config?.showLegend ?? true,
      position: config?.legendPosition || 'bottom',
    },
    tooltip: {
      enabled: true,
    },
    title: {
      text: config?.chartTitle || '',
      align: 'left',
    },
  }
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
    class="chart-widget"
  >
    <VCardText>
      <div class="d-flex align-center justify-space-between mb-4">
        <div>
          <h3 class="text-h6">
            {{ widget.title || widget.widget?.props.name }}
          </h3>
          <p
            v-if="widget.description"
            class="text-caption text-disabled"
          >
            {{ widget.description }}
          </p>
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

      <!-- Empty State -->
      <div
        v-else-if="!loading && (!widgetData || widgetData.rows.length === 0)"
        class="chart-empty"
      >
        <VIcon
          icon="tabler-chart-line"
          size="64"
          color="disabled"
        />
        <p class="text-body-2 text-disabled mt-4">
          No hay datos para mostrar
        </p>
      </div>

      <!-- Chart -->
      <div
        v-else-if="widgetData && widgetData.rows.length > 0"
        class="chart-container"
      >
        <VueApexCharts
          :type="chartType"
          :options="chartOptions"
          :series="series"
          :height="displayConfig?.height || 350"
        />
      </div>
    </VCardText>
  </VCard>
</template>

<style scoped lang="scss">
.chart-widget {
  block-size: 100%;
}

.chart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-block-size: 300px;
  text-align: center;
}

.chart-container {
  inline-size: 100%;
}
</style>
