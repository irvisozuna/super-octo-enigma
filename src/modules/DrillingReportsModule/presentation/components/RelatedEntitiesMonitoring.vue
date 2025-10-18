<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  modelValue?: any
}

interface Emits {
  (e: 'update:modelValue', value: any): void
  (e: 'alertTriggered', alert: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()

const systemStatus = ref({
  api: 'healthy',
  database: 'healthy',
  cache: 'warning',
  storage: 'healthy',
})

const metrics = ref({
  cpu: 45,
  memory: 62,
  disk: 78,
  network: 23,
})

const connections = ref({
  active: 45,
  max: 100,
})

const responseTimes = ref({
  average: 125,
  min: 45,
  max: 890,
  p95: 340,
})

const errorLogs = ref([
  {
    id: 1,
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    level: 'error',
    message: 'Database connection timeout',
    source: 'database',
  },
  {
    id: 2,
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    level: 'warning',
    message: 'High memory usage detected',
    source: 'system',
  },
  {
    id: 3,
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    level: 'error',
    message: 'API endpoint /api/projects failed',
    source: 'api',
  },
  {
    id: 4,
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    level: 'info',
    message: 'Cache cleared successfully',
    source: 'cache',
  },
  {
    id: 5,
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    level: 'warning',
    message: 'Disk space running low',
    source: 'storage',
  },
])

const systemAlerts = ref([
  {
    id: 1,
    type: 'warning',
    title: 'High CPU Usage',
    message: 'CPU usage is above 80% for the last 5 minutes',
  },
  {
    id: 2,
    type: 'error',
    title: 'Database Connection Issues',
    message: 'Multiple database connection timeouts detected',
  },
  {
    id: 3,
    type: 'info',
    title: 'System Update Available',
    message: 'A new system update is available for installation',
  },
])

const errorHeaders = computed(() => [
  { title: t('DrillingReportsModule.common.timestamp'), key: 'timestamp' },
  { title: t('DrillingReportsModule.common.level'), key: 'level' },
  { title: t('DrillingReportsModule.common.message'), key: 'message' },
  { title: t('DrillingReportsModule.common.source'), key: 'source' },
])

const getStatusIcon = (service: string) => {
  const status = systemStatus.value[service as keyof typeof systemStatus.value]

  const icons: Record<string, string> = {
    healthy: 'mdi-check-circle',
    warning: 'mdi-alert-circle',
    error: 'mdi-close-circle',
  }

  return icons[status] || 'mdi-help-circle'
}

const getStatusColor = (service: string) => {
  const status = systemStatus.value[service as keyof typeof systemStatus.value]

  const colors: Record<string, string> = {
    healthy: 'success',
    warning: 'warning',
    error: 'error',
  }

  return colors[status] || 'grey'
}

const getStatusText = (service: string) => {
  const status = systemStatus.value[service as keyof typeof systemStatus.value]

  const texts: Record<string, string> = {
    healthy: t('DrillingReportsModule.common.healthy'),
    warning: t('DrillingReportsModule.common.warning'),
    error: t('DrillingReportsModule.common.error'),
  }

  return texts[status] || status
}

const getConnectionPercentage = () => {
  return Math.round((connections.value.active / connections.value.max) * 100)
}

const getErrorLevelColor = (level: string) => {
  const colors: Record<string, string> = {
    error: 'error',
    warning: 'warning',
    info: 'info',
  }

  return colors[level] || 'grey'
}

const formatTime = (timestamp: Date) => {
  return timestamp.toLocaleString()
}

let monitoringInterval: NodeJS.Timeout | null = null

const startMonitoring = () => {
  monitoringInterval = setInterval(() => {
    // Simulate real-time monitoring data
    metrics.value.cpu = Math.max(0, Math.min(100, metrics.value.cpu + (Math.random() - 0.5) * 10))
    metrics.value.memory = Math.max(0, Math.min(100, metrics.value.memory + (Math.random() - 0.5) * 5))
    metrics.value.disk = Math.max(0, Math.min(100, metrics.value.disk + (Math.random() - 0.5) * 2))
    metrics.value.network = Math.max(0, Math.min(100, metrics.value.network + (Math.random() - 0.5) * 15))

    connections.value.active = Math.max(0, Math.min(connections.value.max, connections.value.active + Math.floor((Math.random() - 0.5) * 10)))

    responseTimes.value.average = Math.max(50, responseTimes.value.average + Math.floor((Math.random() - 0.5) * 20))
    responseTimes.value.min = Math.max(20, responseTimes.value.min + Math.floor((Math.random() - 0.5) * 10))
    responseTimes.value.max = Math.max(100, responseTimes.value.max + Math.floor((Math.random() - 0.5) * 50))
    responseTimes.value.p95 = Math.max(80, responseTimes.value.p95 + Math.floor((Math.random() - 0.5) * 30))
  }, 5000)
}

const stopMonitoring = () => {
  if (monitoringInterval) {
    clearInterval(monitoringInterval)
    monitoringInterval = null
  }
}

onMounted(() => {
  startMonitoring()
})

onUnmounted(() => {
  stopMonitoring()
})
</script>

<template>
  <div class="related-entities-monitoring">
    <VRow>
      <!-- System Status -->
      <VCol
        cols="12"
        md="6"
      >
        <VCard>
          <VCardTitle>
            <VIcon
              icon="mdi-heart-pulse"
              class="me-2"
            />
            {{ $t('DrillingReportsModule.common.systemStatus') }}
          </VCardTitle>
          <VCardText>
            <VList>
              <VListItem>
                <template #prepend>
                  <VIcon
                    :icon="getStatusIcon('api')"
                    :color="getStatusColor('api')"
                  />
                </template>
                <VListItemTitle>{{ $t('DrillingReportsModule.common.api') }}</VListItemTitle>
                <VListItemSubtitle>{{ getStatusText('api') }}</VListItemSubtitle>
              </VListItem>
              <VListItem>
                <template #prepend>
                  <VIcon
                    :icon="getStatusIcon('database')"
                    :color="getStatusColor('database')"
                  />
                </template>
                <VListItemTitle>{{ $t('DrillingReportsModule.common.database') }}</VListItemTitle>
                <VListItemSubtitle>{{ getStatusText('database') }}</VListItemSubtitle>
              </VListItem>
              <VListItem>
                <template #prepend>
                  <VIcon
                    :icon="getStatusIcon('cache')"
                    :color="getStatusColor('cache')"
                  />
                </template>
                <VListItemTitle>{{ $t('DrillingReportsModule.common.cache') }}</VListItemTitle>
                <VListItemSubtitle>{{ getStatusText('cache') }}</VListItemSubtitle>
              </VListItem>
              <VListItem>
                <template #prepend>
                  <VIcon
                    :icon="getStatusIcon('storage')"
                    :color="getStatusColor('storage')"
                  />
                </template>
                <VListItemTitle>{{ $t('DrillingReportsModule.common.storage') }}</VListItemTitle>
                <VListItemSubtitle>{{ getStatusText('storage') }}</VListItemSubtitle>
              </VListItem>
            </VList>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Performance Metrics -->
      <VCol
        cols="12"
        md="6"
      >
        <VCard>
          <VCardTitle>
            <VIcon
              icon="mdi-speedometer"
              class="me-2"
            />
            {{ $t('DrillingReportsModule.common.performanceMetrics') }}
          </VCardTitle>
          <VCardText>
            <div class="d-flex justify-space-between align-center mb-4">
              <span>{{ $t('DrillingReportsModule.common.cpuUsage') }}</span>
              <div class="d-flex align-center">
                <VProgressCircular
                  :model-value="metrics.cpu"
                  :size="40"
                  :width="4"
                  color="primary"
                  class="me-2"
                />
                <span class="text-h6 font-weight-bold">{{ metrics.cpu }}%</span>
              </div>
            </div>
            <div class="d-flex justify-space-between align-center mb-4">
              <span>{{ $t('DrillingReportsModule.common.memoryUsage') }}</span>
              <div class="d-flex align-center">
                <VProgressCircular
                  :model-value="metrics.memory"
                  :size="40"
                  :width="4"
                  color="success"
                  class="me-2"
                />
                <span class="text-h6 font-weight-bold">{{ metrics.memory }}%</span>
              </div>
            </div>
            <div class="d-flex justify-space-between align-center mb-4">
              <span>{{ $t('DrillingReportsModule.common.diskUsage') }}</span>
              <div class="d-flex align-center">
                <VProgressCircular
                  :model-value="metrics.disk"
                  :size="40"
                  :width="4"
                  color="warning"
                  class="me-2"
                />
                <span class="text-h6 font-weight-bold">{{ metrics.disk }}%</span>
              </div>
            </div>
            <div class="d-flex justify-space-between align-center">
              <span>{{ $t('DrillingReportsModule.common.networkUsage') }}</span>
              <div class="d-flex align-center">
                <VProgressCircular
                  :model-value="metrics.network"
                  :size="40"
                  :width="4"
                  color="info"
                  class="me-2"
                />
                <span class="text-h6 font-weight-bold">{{ metrics.network }}%</span>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Active Connections -->
      <VCol
        cols="12"
        md="6"
      >
        <VCard>
          <VCardTitle>
            <VIcon
              icon="mdi-account-group"
              class="me-2"
            />
            {{ $t('DrillingReportsModule.common.activeConnections') }}
          </VCardTitle>
          <VCardText>
            <div class="text-center">
              <div class="text-h4 font-weight-bold text-primary mb-2">
                {{ connections.active }}
              </div>
              <div class="text-caption text-medium-emphasis mb-4">
                {{ $t('DrillingReportsModule.common.currentConnections') }}
              </div>
              <VProgressLinear
                :model-value="getConnectionPercentage()"
                color="primary"
                height="8"
                class="mb-2"
              />
              <div class="text-caption text-medium-emphasis">
                {{ $t('DrillingReportsModule.common.maxConnections') }}: {{ connections.max }}
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Response Times -->
      <VCol
        cols="12"
        md="6"
      >
        <VCard>
          <VCardTitle>
            <VIcon
              icon="mdi-clock-outline"
              class="me-2"
            />
            {{ $t('DrillingReportsModule.common.responseTimes') }}
          </VCardTitle>
          <VCardText>
            <div class="d-flex justify-space-between align-center mb-4">
              <span>{{ $t('DrillingReportsModule.common.averageResponseTime') }}</span>
              <div class="text-h6 font-weight-bold text-primary">
                {{ responseTimes.average }}ms
              </div>
            </div>
            <div class="d-flex justify-space-between align-center mb-4">
              <span>{{ $t('DrillingReportsModule.common.minResponseTime') }}</span>
              <div class="text-h6 font-weight-bold text-success">
                {{ responseTimes.min }}ms
              </div>
            </div>
            <div class="d-flex justify-space-between align-center mb-4">
              <span>{{ $t('DrillingReportsModule.common.maxResponseTime') }}</span>
              <div class="text-h6 font-weight-bold text-warning">
                {{ responseTimes.max }}ms
              </div>
            </div>
            <div class="d-flex justify-space-between align-center">
              <span>{{ $t('DrillingReportsModule.common.p95ResponseTime') }}</span>
              <div class="text-h6 font-weight-bold text-info">
                {{ responseTimes.p95 }}ms
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Error Logs -->
      <VCol cols="12">
        <VCard>
          <VCardTitle>
            <VIcon
              icon="mdi-alert-circle"
              class="me-2"
            />
            {{ $t('DrillingReportsModule.common.errorLogs') }}
          </VCardTitle>
          <VCardText>
            <VDataTable
              :headers="errorHeaders"
              :items="errorLogs"
              :items-per-page="5"
              density="compact"
            >
              <template #item.timestamp="{ item }">
                {{ formatTime(item.timestamp) }}
              </template>
              <template #item.level="{ item }">
                <VChip
                  :color="getErrorLevelColor(item.level)"
                  size="small"
                >
                  {{ item.level.toUpperCase() }}
                </VChip>
              </template>
              <template #item.message="{ item }">
                <div
                  class="text-truncate"
                  style="max-inline-size: 300px;"
                >
                  {{ item.message }}
                </div>
              </template>
            </VDataTable>
          </VCardText>
        </VCard>
      </VCol>

      <!-- System Alerts -->
      <VCol cols="12">
        <VCard>
          <VCardTitle>
            <VIcon
              icon="mdi-bell-alert"
              class="me-2"
            />
            {{ $t('DrillingReportsModule.common.systemAlerts') }}
          </VCardTitle>
          <VCardText>
            <VAlert
              v-for="alert in systemAlerts"
              :key="alert.id"
              :type="alert.type"
              :title="alert.title"
              :text="alert.message"
              class="mb-2"
            />
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>

<style scoped>
.related-entities-monitoring {
  inline-size: 100%;
}
</style>
