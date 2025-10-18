<script setup lang="ts">
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { useTheme } from 'vuetify'

export interface ProjectStatisticsTabProps {
  statistics?: {
    totalReports?: number
    totalHours?: number
    totalPersonnel?: number
    totalEquipment?: number
  }
  budgetData?: {
    total: number
    spent: number
    remaining: number
  }
  costsData?: any[]
  progressData?: any[]
  reportsData?: any[]
  equipmentData?: any[]
}

const props = withDefaults(defineProps<ProjectStatisticsTabProps>(), {
  statistics: () => ({
    totalReports: 42,
    totalHours: 1250,
    totalPersonnel: 8,
    totalEquipment: 5,
  }),
  budgetData: () => ({
    total: 100000,
    spent: 65000,
    remaining: 35000,
  }),
  costsData: () => [],
  progressData: () => [],
  reportsData: () => [],
  equipmentData: () => [],
})

const theme = useTheme()

// Budget Chart (Donut)
const budgetChartSeries = computed(() => [
  props.budgetData.spent,
  props.budgetData.remaining,
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
            formatter: (val: number) => `$${(val / 1000).toFixed(0)}k`,
          },
          total: {
            show: true,
            label: 'Total',
            fontSize: '14px',
            formatter: () => `$${(props.budgetData.total / 1000).toFixed(0)}k`,
          },
        },
      },
    },
  },
}))

// Costs by Category Chart (Bar)
const costsByCategorySeries = computed(() => [{
  name: 'Monto',
  data: [25000, 18000, 12000, 6000, 4000],
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
    enabled: false,
  },
  xaxis: {
    categories: ['Personal', 'Materiales', 'Equipo', 'Transporte', 'Servicios'],
    labels: {
      style: {
        colors: theme.current.value.dark ? '#fff' : '#000',
      },
    },
  },
  yaxis: {
    labels: {
      formatter: (val: number) => `$${(val / 1000).toFixed(0)}k`,
      style: {
        colors: theme.current.value.dark ? '#fff' : '#000',
      },
    },
  },
  colors: ['#3B82F6'],
  grid: {
    borderColor: theme.current.value.dark ? '#404040' : '#e0e0e0',
  },
}))

// Progress Timeline Chart (Area)
const progressTimelineSeries = computed(() => [{
  name: 'Progreso (%)',
  data: [0, 15, 28, 42, 58, 71, 85],
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
    categories: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul'],
    labels: {
      style: {
        colors: theme.current.value.dark ? '#fff' : '#000',
      },
    },
  },
  yaxis: {
    labels: {
      formatter: (val: number) => `${val}%`,
      style: {
        colors: theme.current.value.dark ? '#fff' : '#000',
      },
    },
    max: 100,
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
  data: [5000, 12000, 22000, 35000, 48000, 58000, 65000],
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
    categories: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul'],
    labels: {
      style: {
        colors: theme.current.value.dark ? '#fff' : '#000',
      },
    },
  },
  yaxis: {
    labels: {
      formatter: (val: number) => `$${(val / 1000).toFixed(0)}k`,
      style: {
        colors: theme.current.value.dark ? '#fff' : '#000',
      },
    },
  },
  colors: ['#EAB308'],
  grid: {
    borderColor: theme.current.value.dark ? '#404040' : '#e0e0e0',
  },
}))

// Reports by Status Chart (Pie)
const reportsByStatusSeries = computed(() => [15, 22, 5])

const reportsByStatusOptions = computed(() => ({
  chart: {
    type: 'pie',
    fontFamily: 'inherit',
  },
  labels: ['Borrador', 'Aprobado', 'Rechazado'],
  colors: ['#6B7280', '#16A34A', '#DC2626'],
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
}))

// Equipment Status Chart (RadialBar)
const equipmentStatusSeries = computed(() => [80])

const equipmentStatusOptions = computed(() => ({
  chart: {
    type: 'radialBar',
    fontFamily: 'inherit',
  },
  plotOptions: {
    radialBar: {
      hollow: {
        size: '60%',
      },
      dataLabels: {
        name: {
          show: true,
          fontSize: '14px',
        },
        value: {
          show: true,
          fontSize: '24px',
          fontWeight: 600,
          formatter: (val: number) => `${val}%`,
        },
      },
    },
  },
  labels: ['Operativos'],
  colors: ['#16A34A'],
}))
</script>

<template>
  <div class="project-statistics-tab pa-6">
    <h6 class="text-h6 mb-6">
      Estadísticas del Proyecto
    </h6>

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
                {{ statistics?.totalReports || 0 }}
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
                {{ statistics?.totalHours || 0 }}
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
                {{ statistics?.totalPersonnel || 0 }}
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
                {{ statistics?.totalEquipment || 0 }}
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
            <VueApexCharts
              type="donut"
              :options="budgetChartOptions"
              :series="budgetChartSeries"
              height="300"
            />
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
            <VueApexCharts
              type="bar"
              :options="costsByCategoryOptions"
              :series="costsByCategorySeries"
              height="300"
            />
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
          <VCardTitle>Progreso del Proyecto</VCardTitle>
          <VCardText>
            <VueApexCharts
              type="area"
              :options="progressTimelineOptions"
              :series="progressTimelineSeries"
              height="300"
            />
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
            <VueApexCharts
              type="line"
              :options="costTrendsOptions"
              :series="costTrendsSeries"
              height="300"
            />
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Charts Row 3 -->
    <VRow>
      <!-- Reports by Status -->
      <VCol
        cols="12"
        md="6"
      >
        <VCard>
          <VCardTitle>Reportes por Estado</VCardTitle>
          <VCardText>
            <VueApexCharts
              type="pie"
              :options="reportsByStatusOptions"
              :series="reportsByStatusSeries"
              height="300"
            />
          </VCardText>
        </VCard>
      </VCol>

      <!-- Equipment Status -->
      <VCol
        cols="12"
        md="6"
      >
        <VCard>
          <VCardTitle>Estado de Equipos</VCardTitle>
          <VCardText>
            <VueApexCharts
              type="radialBar"
              :options="equipmentStatusOptions"
              :series="equipmentStatusSeries"
              height="300"
            />
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>

<style scoped lang="scss">
.project-statistics-tab {
  min-block-size: 400px;
}
</style>
