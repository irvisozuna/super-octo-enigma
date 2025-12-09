<script setup lang="ts">
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { useTheme } from 'vuetify'

/**
 * Interfaz para las estadísticas del endpoint /statistics
 */
interface ProjectStatisticsResponse {
  basic_stats: {
    reports_count: number
    total_hours_worked: number
    personnel_count: number
    equipment_count: number
  }
  budget_utilization: {
    total_budget: number
    spent: number
    remaining: number
    percentage_spent: number
  }
  costs_by_category: Array<{
    category: string
    category_name: string
    amount: number
  }>
  project_progress: Array<{
    month: string
    meters_drilled: number
    cumulative: number
  }>
  cost_trend: Array<{
    month: string
    cost: number
    cumulative: number
  }>
}

export interface ProjectStatisticsTabProps {

  /** Estadísticas básicas del proyecto (resumen) */
  statistics?: {
    totalReports?: number
    totalHours?: number
    totalPersonnel?: number
    totalEquipment?: number
  }

  /** Estadísticas completas desde el endpoint /statistic */
  projectStatistics?: ProjectStatisticsResponse | null

  /** Estado de carga */
  loading?: boolean
}

const props = withDefaults(defineProps<ProjectStatisticsTabProps>(), {
  statistics: () => ({
    totalReports: 0,
    totalHours: 0,
    totalPersonnel: 0,
    totalEquipment: 0,
  }),
  projectStatistics: null,
  loading: false,
})

const theme = useTheme()

// Helper: Formatear montos (muestra en k/M solo si corresponde)
const formatAmount = (val: number): string => {
  if (val === null || val === undefined)
    return '$0'
  if (val >= 1000000)
    return `$${(val / 1000000).toFixed(1)}M`

  if (val >= 1000)
    return `$${(val / 1000).toFixed(0)}k`

  return `$${val.toFixed(0)}`
}

// Computed: Datos básicos (prioridad al endpoint, fallback a props)
const basicStats = computed(() => ({
  reports: props.projectStatistics?.basic_stats?.reports_count ?? props.statistics?.totalReports ?? 0,
  hours: props.projectStatistics?.basic_stats?.total_hours_worked ?? props.statistics?.totalHours ?? 0,
  personnel: props.projectStatistics?.basic_stats?.personnel_count ?? props.statistics?.totalPersonnel ?? 0,
  equipment: props.projectStatistics?.basic_stats?.equipment_count ?? props.statistics?.totalEquipment ?? 0,
}))

// Computed: Datos de presupuesto
const budgetData = computed(() => ({
  total: props.projectStatistics?.budget_utilization?.total_budget ?? 0,
  spent: props.projectStatistics?.budget_utilization?.spent ?? 0,
  remaining: props.projectStatistics?.budget_utilization?.remaining ?? 0,
  percentageSpent: props.projectStatistics?.budget_utilization?.percentage_spent ?? 0,
}))

// Computed: Verificar si hay datos de presupuesto
const hasBudgetData = computed(() => budgetData.value.total > 0)

// Computed: Verificar si hay datos de costos por categoría
const hasCostsByCategory = computed(() =>
  (props.projectStatistics?.costs_by_category?.length ?? 0) > 0,
)

// Computed: Verificar si hay datos de progreso
const hasProgressData = computed(() =>
  (props.projectStatistics?.project_progress?.length ?? 0) > 0,
)

// Computed: Verificar si hay datos de tendencia de costos
const hasCostTrendData = computed(() =>
  (props.projectStatistics?.cost_trend?.length ?? 0) > 0,
)

// Budget Chart (Donut)
const budgetChartSeries = computed(() => [
  budgetData.value.spent,
  budgetData.value.remaining,
])

const budgetChartOptions = computed(() => ({
  chart: {
    type: 'donut',
    fontFamily: 'inherit',
  },
  labels: ['Gastado', 'Restante'],
  colors: ['#DC2626', '#16A34A'],
  legend: {
    position: 'bottom',
    labels: {
      colors: theme.current.value.dark ? '#fff' : '#000',
    },
  },
  dataLabels: {
    enabled: true,
    formatter: (val: number) => `${val.toFixed(1)}%`,
  },
  tooltip: {
    y: {
      formatter: (val: number) => formatAmount(val),
    },
  },
  plotOptions: {
    pie: {
      donut: {
        size: '70%',
        labels: {
          show: true,
          name: {
            show: true,
            fontSize: '14px',
          },
          value: {
            show: true,
            fontSize: '24px',
            fontWeight: 600,
            formatter: (val: string) => formatAmount(Number(val)),
          },
          total: {
            show: true,
            label: 'Total',
            fontSize: '14px',
            formatter: () => formatAmount(budgetData.value.total),
          },
        },
      },
    },
  },
}))

// Costs by Category Chart (Bar)
const costsByCategorySeries = computed(() => [{
  name: 'Monto',
  data: props.projectStatistics?.costs_by_category?.map(c => c.amount) ?? [],
}])

const costsByCategoryOptions = computed(() => ({
  chart: {
    type: 'bar',
    fontFamily: 'inherit',
    toolbar: {
      show: false,
    },
  },
  plotOptions: {
    bar: {
      horizontal: false,
      borderRadius: 8,
      columnWidth: '50%',
    },
  },
  dataLabels: {
    enabled: true,
    formatter: (val: number) => formatAmount(val),
  },
  xaxis: {
    categories: props.projectStatistics?.costs_by_category?.map(c => c.category_name) ?? [],
    labels: {
      style: {
        colors: theme.current.value.dark ? '#fff' : '#000',
      },
    },
  },
  yaxis: {
    labels: {
      formatter: (val: number) => formatAmount(val),
      style: {
        colors: theme.current.value.dark ? '#fff' : '#000',
      },
    },
  },
  tooltip: {
    y: {
      formatter: (val: number) => formatAmount(val),
    },
  },
  colors: ['#3B82F6'],
  grid: {
    borderColor: theme.current.value.dark ? '#404040' : '#e0e0e0',
  },
}))

// Progress Timeline Chart (Area) - Metros perforados acumulados
const progressTimelineSeries = computed(() => [{
  name: 'Metros Perforados',
  data: props.projectStatistics?.project_progress?.map(p => p.cumulative) ?? [],
}])

const progressTimelineOptions = computed(() => ({
  chart: {
    type: 'area',
    fontFamily: 'inherit',
    toolbar: {
      show: false,
    },
  },
  dataLabels: {
    enabled: false,
  },
  stroke: {
    curve: 'smooth',
    width: 3,
  },
  xaxis: {
    categories: props.projectStatistics?.project_progress?.map(p => p.month) ?? [],
    labels: {
      style: {
        colors: theme.current.value.dark ? '#fff' : '#000',
      },
    },
  },
  yaxis: {
    labels: {
      formatter: (val: number) => `${val.toFixed(0)} m`,
      style: {
        colors: theme.current.value.dark ? '#fff' : '#000',
      },
    },
  },
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.7,
      opacityTo: 0.3,
    },
  },
  colors: ['#16A34A'],
  grid: {
    borderColor: theme.current.value.dark ? '#404040' : '#e0e0e0',
  },
}))

// Cost Trends Chart (Line)
const costTrendsSeries = computed(() => [{
  name: 'Costos Acumulados',
  data: props.projectStatistics?.cost_trend?.map(c => c.cumulative) ?? [],
}])

const costTrendsOptions = computed(() => ({
  chart: {
    type: 'line',
    fontFamily: 'inherit',
    toolbar: {
      show: false,
    },
  },
  stroke: {
    curve: 'smooth',
    width: 3,
  },
  markers: {
    size: 5,
  },
  xaxis: {
    categories: props.projectStatistics?.cost_trend?.map(c => c.month) ?? [],
    labels: {
      style: {
        colors: theme.current.value.dark ? '#fff' : '#000',
      },
    },
  },
  yaxis: {
    labels: {
      formatter: (val: number) => formatAmount(val),
      style: {
        colors: theme.current.value.dark ? '#fff' : '#000',
      },
    },
  },
  tooltip: {
    y: {
      formatter: (val: number) => formatAmount(val),
    },
  },
  colors: ['#EAB308'],
  grid: {
    borderColor: theme.current.value.dark ? '#404040' : '#e0e0e0',
  },
}))

// NOTA: Los siguientes gráficos están deshabilitados temporalmente
// porque el endpoint /statistic no proporciona estos datos:
// - Reports by Status Chart (Pie)
// - Equipment Status Chart (RadialBar)
</script>

<template>
  <div class="project-statistics-tab pa-6">
    <h6 class="text-h6 mb-6">
      Estadísticas del Proyecto
    </h6>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="d-flex justify-center align-center py-12"
    >
      <VProgressCircular
        indeterminate
        color="primary"
        size="64"
      />
    </div>

    <template v-else>
      <!-- Summary Stats Row -->
      <VRow class="mb-6">
        <VCol
          cols="12"
          sm="6"
          md="3"
        >
          <VCard>
            <VCardText class="d-flex align-center gap-3">
              <VAvatar
                color="primary"
                variant="tonal"
                size="48"
              >
                <VIcon
                  icon="tabler-file-text"
                  size="24"
                />
              </VAvatar>
              <div>
                <p class="text-caption text-medium-emphasis mb-1">
                  Reportes
                </p>
                <h5 class="text-h5">
                  {{ basicStats.reports }}
                </h5>
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <VCol
          cols="12"
          sm="6"
          md="3"
        >
          <VCard>
            <VCardText class="d-flex align-center gap-3">
              <VAvatar
                color="success"
                variant="tonal"
                size="48"
              >
                <VIcon
                  icon="tabler-clock"
                  size="24"
                />
              </VAvatar>
              <div>
                <p class="text-caption text-medium-emphasis mb-1">
                  Horas Trabajadas
                </p>
                <h5 class="text-h5">
                  {{ basicStats.hours }}
                </h5>
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <VCol
          cols="12"
          sm="6"
          md="3"
        >
          <VCard>
            <VCardText class="d-flex align-center gap-3">
              <VAvatar
                color="warning"
                variant="tonal"
                size="48"
              >
                <VIcon
                  icon="tabler-users"
                  size="24"
                />
              </VAvatar>
              <div>
                <p class="text-caption text-medium-emphasis mb-1">
                  Personal
                </p>
                <h5 class="text-h5">
                  {{ basicStats.personnel }}
                </h5>
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <VCol
          cols="12"
          sm="6"
          md="3"
        >
          <VCard>
            <VCardText class="d-flex align-center gap-3">
              <VAvatar
                color="info"
                variant="tonal"
                size="48"
              >
                <VIcon
                  icon="tabler-tool"
                  size="24"
                />
              </VAvatar>
              <div>
                <p class="text-caption text-medium-emphasis mb-1">
                  Equipos
                </p>
                <h5 class="text-h5">
                  {{ basicStats.equipment }}
                </h5>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Charts Row 1 -->
      <VRow class="mb-6">
        <!-- Budget Utilization Chart -->
        <VCol
          cols="12"
          md="6"
        >
          <VCard>
            <VCardTitle>Utilización de Presupuesto</VCardTitle>
            <VCardText>
              <template v-if="hasBudgetData">
                <VueApexCharts
                  type="donut"
                  :options="budgetChartOptions"
                  :series="budgetChartSeries"
                  height="300"
                />
              </template>
              <div
                v-else
                class="d-flex flex-column align-center justify-center py-12"
              >
                <VIcon
                  icon="tabler-chart-donut"
                  size="64"
                  color="grey-lighten-1"
                  class="mb-4"
                />
                <p class="text-body-2 text-medium-emphasis">
                  Sin datos de presupuesto disponibles
                </p>
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <!-- Costs by Category Chart -->
        <VCol
          cols="12"
          md="6"
        >
          <VCard>
            <VCardTitle>Costos por Categoría</VCardTitle>
            <VCardText>
              <template v-if="hasCostsByCategory">
                <VueApexCharts
                  type="bar"
                  :options="costsByCategoryOptions"
                  :series="costsByCategorySeries"
                  height="300"
                />
              </template>
              <div
                v-else
                class="d-flex flex-column align-center justify-center py-12"
              >
                <VIcon
                  icon="tabler-chart-bar"
                  size="64"
                  color="grey-lighten-1"
                  class="mb-4"
                />
                <p class="text-body-2 text-medium-emphasis">
                  Sin datos de costos por categoría
                </p>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Charts Row 2 -->
      <VRow class="mb-6">
        <!-- Project Progress Timeline -->
        <VCol
          cols="12"
          md="6"
        >
          <VCard>
            <VCardTitle>Progreso de Perforación</VCardTitle>
            <VCardText>
              <template v-if="hasProgressData">
                <VueApexCharts
                  type="area"
                  :options="progressTimelineOptions"
                  :series="progressTimelineSeries"
                  height="300"
                />
              </template>
              <div
                v-else
                class="d-flex flex-column align-center justify-center py-12"
              >
                <VIcon
                  icon="tabler-chart-area-line"
                  size="64"
                  color="grey-lighten-1"
                  class="mb-4"
                />
                <p class="text-body-2 text-medium-emphasis">
                  Sin datos de progreso disponibles
                </p>
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <!-- Cost Trends -->
        <VCol
          cols="12"
          md="6"
        >
          <VCard>
            <VCardTitle>Tendencia de Costos</VCardTitle>
            <VCardText>
              <template v-if="hasCostTrendData">
                <VueApexCharts
                  type="line"
                  :options="costTrendsOptions"
                  :series="costTrendsSeries"
                  height="300"
                />
              </template>
              <div
                v-else
                class="d-flex flex-column align-center justify-center py-12"
              >
                <VIcon
                  icon="tabler-chart-line"
                  size="64"
                  color="grey-lighten-1"
                  class="mb-4"
                />
                <p class="text-body-2 text-medium-emphasis">
                  Sin datos de tendencia de costos
                </p>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!--
        NOTA: Los siguientes gráficos están ocultos temporalmente
        porque el endpoint /statistic no proporciona estos datos:
        - Reportes por Estado (Pie)
        - Estado de Equipos (RadialBar)
      -->
    </template>
  </div>
</template>

<style scoped lang="scss">
.project-statistics-tab {
  min-block-size: 400px;
}
</style>
