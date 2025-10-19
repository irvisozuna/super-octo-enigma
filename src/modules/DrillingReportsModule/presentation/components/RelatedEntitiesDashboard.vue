<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useProjects } from '../composables/useProjects'
import { useWells } from '../composables/useWells'
import { useTools } from '../composables/useTools'
import { useEmployees } from '../composables/useEmployees'
import { useEquipment } from '../composables/useEquipment'
import { useDocuments } from '../composables/useDocuments'

const { projects, fetchProjectsSimple: fetchProjects } = useProjects()
const { wells, fetchWellsByProjectSimple: fetchWellsByProject } = useWells()
const { tools, fetchTools } = useTools()
const { employees, fetchEmployeesSimple: fetchEmployees } = useEmployees()
const { equipment, fetchEquipmentSimple: fetchEquipment } = useEquipment()
const { documents, fetchDocumentsByEntity } = useDocuments()

const recentActivities = ref([
  {
    id: 1,
    title: 'Nuevo Proyecto Creado',
    description: 'Proyecto "Exploración Norte" ha sido creado',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    icon: 'tabler-folder-plus',
    color: 'success',
  },
  {
    id: 2,
    title: 'Pozo Completado',
    description: 'Pozo "Norte-001" ha sido completado exitosamente',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    icon: 'tabler-hole',
    color: 'info',
  },
  {
    id: 3,
    title: 'Herramienta Asignada',
    description: 'Broca de perforación asignada al proyecto',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    icon: 'tabler-tool',
    color: 'warning',
  },
  {
    id: 4,
    title: 'Empleado Agregado',
    description: 'Nuevo operador agregado al equipo',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
    icon: 'tabler-user-plus',
    color: 'primary',
  },
  {
    id: 5,
    title: 'Documento Subido',
    description: 'Manual de seguridad actualizado',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
    icon: 'tabler-file-upload',
    color: 'purple',
  },
])

const getProjectStatusPercentage = (status: string) => {
  if (projects.value.length === 0)
    return 0
  const statusCount = projects.value.filter(p => p.status === status).length

  return Math.round((statusCount / projects.value.length) * 100)
}

const getWellDepthPercentage = () => {
  if (wells.value.length === 0)
    return 0
  const totalDepth = wells.value.reduce((sum, well) => sum + (well.depth_actual || 0), 0)
  const averageDepth = totalDepth / wells.value.length

  return Math.round((averageDepth / 1000) * 100) // Assuming 1000m as max depth
}

const getToolConditionPercentage = (condition: string) => {
  if (tools.value.length === 0)
    return 0
  const conditionCount = tools.value.filter(t => t.condition === condition).length

  return Math.round((conditionCount / tools.value.length) * 100)
}

const getEmployeeDepartmentPercentage = (department: string) => {
  if (employees.value.length === 0)
    return 0
  const departmentCount = employees.value.filter(e => e.department === department).length

  return Math.round((departmentCount / employees.value.length) * 100)
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
})
</script>

<template>
  <div class="related-entities-dashboard">
    <!-- Summary Cards -->
    <RelatedEntitiesSummary />

    <!-- Charts Section -->
    <VRow class="mt-4">
      <!-- Projects Chart -->
      <VCol
        cols="12"
        md="6"
      >
        <VCard>
          <VCardTitle>
            <VIcon
              icon="tabler-chart-pie"
              class="me-2"
            />
            {{ $t('DrillingReportsModule.projects.statusDistribution') }}
          </VCardTitle>
          <VCardText>
            <div class="text-center">
              <VProgressCircular
                :model-value="getProjectStatusPercentage('active')"
                :size="100"
                :width="15"
                color="success"
                class="me-4"
              >
                {{ getProjectStatusPercentage('active') }}%
              </VProgressCircular>
              <div class="text-caption">
                {{ $t('DrillingReportsModule.projects.active') }}
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Wells Chart -->
      <VCol
        cols="12"
        md="6"
      >
        <VCard>
          <VCardTitle>
            <VIcon
              icon="tabler-chart-bar"
              class="me-2"
            />
            {{ $t('DrillingReportsModule.wells.depthDistribution') }}
          </VCardTitle>
          <VCardText>
            <div class="text-center">
              <VProgressCircular
                :model-value="getWellDepthPercentage()"
                :size="100"
                :width="15"
                color="info"
                class="me-4"
              >
                {{ getWellDepthPercentage() }}%
              </VProgressCircular>
              <div class="text-caption">
                {{ $t('DrillingReportsModule.wells.averageDepth') }}
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Tools Chart -->
      <VCol
        cols="12"
        md="6"
      >
        <VCard>
          <VCardTitle>
            <VIcon
              icon="tabler-chart-line"
              class="me-2"
            />
            {{ $t('DrillingReportsModule.tools.conditionDistribution') }}
          </VCardTitle>
          <VCardText>
            <div class="text-center">
              <VProgressCircular
                :model-value="getToolConditionPercentage('excellent')"
                :size="100"
                :width="15"
                color="success"
                class="me-4"
              >
                {{ getToolConditionPercentage('excellent') }}%
              </VProgressCircular>
              <div class="text-caption">
                {{ $t('DrillingReportsModule.tools.excellentCondition') }}
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Employees Chart -->
      <VCol
        cols="12"
        md="6"
      >
        <VCard>
          <VCardTitle>
            <VIcon
              icon="tabler-chart-donut"
              class="me-2"
            />
            {{ $t('DrillingReportsModule.employees.departmentDistribution') }}
          </VCardTitle>
          <VCardText>
            <div class="text-center">
              <VProgressCircular
                :model-value="getEmployeeDepartmentPercentage('operations')"
                :size="100"
                :width="15"
                color="primary"
                class="me-4"
              >
                {{ getEmployeeDepartmentPercentage('operations') }}%
              </VProgressCircular>
              <div class="text-caption">
                {{ $t('DrillingReportsModule.employees.operations') }}
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Recent Activity -->
    <VRow class="mt-4">
      <VCol cols="12">
        <VCard>
          <VCardTitle>
            <VIcon
              icon="tabler-clock-hour-4"
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
.related-entities-dashboard {
  inline-size: 100%;
}
</style>
