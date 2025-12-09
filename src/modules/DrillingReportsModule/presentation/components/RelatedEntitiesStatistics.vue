<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProjects } from '../composables/useProjects'
import { useWells } from '../composables/useWells'
import { useTools } from '../composables/useTools'
import { useEmployees } from '../composables/useEmployees'
import { useEquipment } from '../composables/useEquipment'
import { useDocuments } from '../composables/useDocuments'

interface Props {
  modelValue?: any
}

interface Emits {
  (e: 'update:modelValue', value: any): void
  (e: 'activityClicked', activity: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()

const { projects, fetchProjectsSimple: fetchProjects } = useProjects()
const { wells, fetchWellsByProjectSimple: fetchWellsByProject } = useWells()
const { tools, fetchTools } = useTools()
const { employees, fetchEmployeesSimple: fetchEmployees } = useEmployees()
const { equipment, fetchEquipmentSimple: fetchEquipment } = useEquipment()
const { documents, fetchDocumentsByEntity } = useDocuments()

const statistics = ref({
  projects: {
    total: 0,
    active: 0,
    activePercentage: 0,
  },
  wells: {
    total: 0,
    completed: 0,
    completedPercentage: 0,
  },
  tools: {
    total: 0,
    available: 0,
    availablePercentage: 0,
  },
  employees: {
    total: 0,
    active: 0,
    activePercentage: 0,
  },
  overview: {
    active: 0,
    completed: 0,
    inProgress: 0,
    overdue: 0,
  },
  metrics: {
    efficiency: 85,
    productivity: 92,
    quality: 88,
    safety: 95,
  },
})

const recentActivities = ref([
  {
    id: 1,
    title: 'Nuevo Proyecto Creado',
    description: 'Proyecto "Exploración Norte" ha sido creado',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    icon: 'mdi-folder-plus',
    color: 'success',
  },
  {
    id: 2,
    title: 'Pozo Completado',
    description: 'Pozo "Norte-001" ha sido completado exitosamente',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    icon: 'mdi-well',
    color: 'info',
  },
  {
    id: 3,
    title: 'Herramienta Asignada',
    description: 'Broca de perforación asignada al proyecto',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    icon: 'mdi-tools',
    color: 'warning',
  },
  {
    id: 4,
    title: 'Empleado Agregado',
    description: 'Nuevo operador agregado al equipo',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
    icon: 'mdi-account-plus',
    color: 'primary',
  },
  {
    id: 5,
    title: 'Documento Subido',
    description: 'Manual de seguridad actualizado',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
    icon: 'mdi-file-upload',
    color: 'purple',
  },
])

const calculateStatistics = () => {
  // Projects statistics
  statistics.value.projects.total = projects.value.length
  statistics.value.projects.active = projects.value.filter(p => p.status === 'active').length
  statistics.value.projects.activePercentage = statistics.value.projects.total > 0
    ? Math.round((statistics.value.projects.active / statistics.value.projects.total) * 100)
    : 0

  // Wells statistics
  statistics.value.wells.total = wells.value.length
  statistics.value.wells.completed = wells.value.filter(w => w.status === 'completed').length
  statistics.value.wells.completedPercentage = statistics.value.wells.total > 0
    ? Math.round((statistics.value.wells.completed / statistics.value.wells.total) * 100)
    : 0

  // Tools statistics
  statistics.value.tools.total = tools.value.length
  statistics.value.tools.available = tools.value.filter(t => t.status === 'available').length
  statistics.value.tools.availablePercentage = statistics.value.tools.total > 0
    ? Math.round((statistics.value.tools.available / statistics.value.tools.total) * 100)
    : 0

  // Employees statistics
  statistics.value.employees.total = employees.value.length
  statistics.value.employees.active = employees.value.filter(e => e.status === 'active').length
  statistics.value.employees.activePercentage = statistics.value.employees.total > 0
    ? Math.round((statistics.value.employees.active / statistics.value.employees.total) * 100)
    : 0

  // Overview statistics
  statistics.value.overview.active = statistics.value.projects.active
  statistics.value.overview.completed = statistics.value.wells.completed
  statistics.value.overview.inProgress = projects.value.filter(p => p.status === 'active').length
  statistics.value.overview.overdue = projects.value.filter(p => {
    if (!p.end_date)
      return false
    const endDate = new Date(p.end_date)
    const now = new Date()

    return now > endDate && p.status !== 'completed'
  }).length
}

const formatTime = (timestamp: Date) => {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))

  if (hours < 1)
    return 'Hace menos de 1 hora'
  if (hours === 1)
    return 'Hace 1 hora'
  if (hours < 24)
    return `Hace ${hours} horas`

  const days = Math.floor(hours / 24)
  if (days === 1)
    return 'Hace 1 día'

  return `Hace ${days} días`
}

onMounted(() => {
  if (projects.value.length === 0)
    fetchProjects()

  if (wells.value.length === 0)
    fetchWellsByProject('')

  if (tools.value.length === 0)
    fetchTools()

  if (employees.value.length === 0)
    fetchEmployees()

  if (equipment.value.length === 0)
    fetchEquipment()

  if (documents.value.length === 0)
    fetchDocumentsByEntity('', '')

  // Calculate statistics after data is loaded
  setTimeout(() => {
    calculateStatistics()
  }, 1000)
})
</script>

<template>
  <div class="related-entities-statistics">
    <VRow>
      <!-- Overview Cards -->
      <VCol
        cols="12"
        md="3"
      >
        <VCard>
          <VCardText class="text-center">
            <VIcon
              icon="mdi-folder"
              size="48"
              color="primary"
              class="mb-4"
            />
            <div class="text-h4 font-weight-bold text-primary mb-2">
              {{ statistics.projects.total }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ $t('DrillingReportsModule.projects.title') }}
            </div>
            <VProgressLinear
              :model-value="statistics.projects.activePercentage"
              color="primary"
              height="8"
              class="mt-2"
            />
            <div class="text-caption text-success mt-1">
              {{ statistics.projects.activePercentage }}% {{ $t('DrillingReportsModule.common.active') }}
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        md="3"
      >
        <VCard>
          <VCardText class="text-center">
            <VIcon
              icon="mdi-well"
              size="48"
              color="success"
              class="mb-4"
            />
            <div class="text-h4 font-weight-bold text-success mb-2">
              {{ statistics.wells.total }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ $t('DrillingReportsModule.wells.title') }}
            </div>
            <VProgressLinear
              :model-value="statistics.wells.completedPercentage"
              color="success"
              height="8"
              class="mt-2"
            />
            <div class="text-caption text-success mt-1">
              {{ statistics.wells.completedPercentage }}% {{ $t('DrillingReportsModule.common.completed') }}
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        md="3"
      >
        <VCard>
          <VCardText class="text-center">
            <VIcon
              icon="mdi-tools"
              size="48"
              color="warning"
              class="mb-4"
            />
            <div class="text-h4 font-weight-bold text-warning mb-2">
              {{ statistics.tools.total }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ $t('DrillingReportsModule.tools.title') }}
            </div>
            <VProgressLinear
              :model-value="statistics.tools.availablePercentage"
              color="warning"
              height="8"
              class="mt-2"
            />
            <div class="text-caption text-warning mt-1">
              {{ statistics.tools.availablePercentage }}% {{ $t('DrillingReportsModule.common.available') }}
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        md="3"
      >
        <VCard>
          <VCardText class="text-center">
            <VIcon
              icon="mdi-account-group"
              size="48"
              color="info"
              class="mb-4"
            />
            <div class="text-h4 font-weight-bold text-info mb-2">
              {{ statistics.employees.total }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ $t('DrillingReportsModule.employees.title') }}
            </div>
            <VProgressLinear
              :model-value="statistics.employees.activePercentage"
              color="info"
              height="8"
              class="mt-2"
            />
            <div class="text-caption text-info mt-1">
              {{ statistics.employees.activePercentage }}% {{ $t('DrillingReportsModule.common.active') }}
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Charts -->
      <VCol
        cols="12"
        md="6"
      >
        <VCard>
          <VCardTitle>
            <VIcon
              icon="mdi-chart-pie"
              class="me-2"
            />
            {{ $t('DrillingReportsModule.common.statusDistribution') }}
          </VCardTitle>
          <VCardText>
            <div class="d-flex justify-space-between align-center mb-4">
              <div class="d-flex align-center">
                <div
                  class="me-3"
                  style=" border-radius: 4px; background-color: #4caf50; block-size: 20px;inline-size: 20px;"
                />
                <span>{{ $t('DrillingReportsModule.common.active') }}</span>
              </div>
              <div class="text-h6 font-weight-bold text-success">
                {{ statistics.overview.active }}
              </div>
            </div>
            <div class="d-flex justify-space-between align-center mb-4">
              <div class="d-flex align-center">
                <div
                  class="me-3"
                  style=" border-radius: 4px; background-color: #2196f3; block-size: 20px;inline-size: 20px;"
                />
                <span>{{ $t('DrillingReportsModule.common.completed') }}</span>
              </div>
              <div class="text-h6 font-weight-bold text-info">
                {{ statistics.overview.completed }}
              </div>
            </div>
            <div class="d-flex justify-space-between align-center mb-4">
              <div class="d-flex align-center">
                <div
                  class="me-3"
                  style=" border-radius: 4px; background-color: #ff9800; block-size: 20px;inline-size: 20px;"
                />
                <span>{{ $t('DrillingReportsModule.common.inProgress') }}</span>
              </div>
              <div class="text-h6 font-weight-bold text-warning">
                {{ statistics.overview.inProgress }}
              </div>
            </div>
            <div class="d-flex justify-space-between align-center">
              <div class="d-flex align-center">
                <div
                  class="me-3"
                  style=" border-radius: 4px; background-color: #f44336; block-size: 20px;inline-size: 20px;"
                />
                <span>{{ $t('DrillingReportsModule.common.overdue') }}</span>
              </div>
              <div class="text-h6 font-weight-bold text-error">
                {{ statistics.overview.overdue }}
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        md="6"
      >
        <VCard>
          <VCardTitle>
            <VIcon
              icon="mdi-chart-line"
              class="me-2"
            />
            {{ $t('DrillingReportsModule.common.performanceMetrics') }}
          </VCardTitle>
          <VCardText>
            <div class="d-flex justify-space-between align-center mb-4">
              <span>{{ $t('DrillingReportsModule.common.efficiency') }}</span>
              <div class="d-flex align-center">
                <VProgressCircular
                  :model-value="statistics.metrics.efficiency"
                  :size="40"
                  :width="4"
                  color="success"
                  class="me-2"
                />
                <span class="text-h6 font-weight-bold">{{ statistics.metrics.efficiency }}%</span>
              </div>
            </div>
            <div class="d-flex justify-space-between align-center mb-4">
              <span>{{ $t('DrillingReportsModule.common.productivity') }}</span>
              <div class="d-flex align-center">
                <VProgressCircular
                  :model-value="statistics.metrics.productivity"
                  :size="40"
                  :width="4"
                  color="info"
                  class="me-2"
                />
                <span class="text-h6 font-weight-bold">{{ statistics.metrics.productivity }}%</span>
              </div>
            </div>
            <div class="d-flex justify-space-between align-center mb-4">
              <span>{{ $t('DrillingReportsModule.common.quality') }}</span>
              <div class="d-flex align-center">
                <VProgressCircular
                  :model-value="statistics.metrics.quality"
                  :size="40"
                  :width="4"
                  color="warning"
                  class="me-2"
                />
                <span class="text-h6 font-weight-bold">{{ statistics.metrics.quality }}%</span>
              </div>
            </div>
            <div class="d-flex justify-space-between align-center">
              <span>{{ $t('DrillingReportsModule.common.safety') }}</span>
              <div class="d-flex align-center">
                <VProgressCircular
                  :model-value="statistics.metrics.safety"
                  :size="40"
                  :width="4"
                  color="error"
                  class="me-2"
                />
                <span class="text-h6 font-weight-bold">{{ statistics.metrics.safety }}%</span>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Recent Activity -->
      <VCol cols="12">
        <VCard>
          <VCardTitle>
            <VIcon
              icon="mdi-clock-outline"
              class="me-2"
            />
            {{ $t('DrillingReportsModule.common.recentActivity') }}
          </VCardTitle>
          <VCardText>
            <VTimeline density="compact">
              <VTimelineItem
                v-for="activity in recentActivities"
                :key="activity.id"
                :dot-color="activity.color"
                size="small"
              >
                <template #icon>
                  <VIcon
                    :icon="activity.icon"
                    size="small"
                  />
                </template>
                <div class="d-flex justify-space-between align-center">
                  <div>
                    <div class="font-weight-medium">
                      {{ activity.title }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ activity.description }}
                    </div>
                  </div>
                  <div class="text-caption">
                    {{ formatTime(activity.timestamp) }}
                  </div>
                </div>
              </VTimelineItem>
            </VTimeline>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>

<style scoped>
.related-entities-statistics {
  inline-size: 100%;
}
</style>
