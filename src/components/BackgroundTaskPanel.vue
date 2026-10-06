<script setup lang="ts">
/**
 * BackgroundTaskPanel - Panel de tareas en segundo plano mejorado
 *
 * Cambios principales:
 * - El panel NO se cierra automáticamente al completar tareas
 * - Mantiene historial completo de todas las tareas
 * - Nuevo modo minimizado (botón flotante)
 * - Tareas completadas pueden ocultarse después de 30s (opcional)
 * - Confirmaciones de seguridad al cerrar/eliminar
 * - Iconos dinámicos según categoría de tarea
 * - Gestión avanzada de tareas ocultas
 */
import { computed, defineExpose, defineProps, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { rawApi } from '@/services/api'

// Tipos para mejor type safety
interface BackgroundTask {
  task_id: string
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  message: string
  messageKey?: string
  started: number
  download_url?: string
  progress?: number
  category?: string
  title?: string
  estimatedTime?: number
  hidden?: boolean
  export_format?: string // Added for file type
}

const props = defineProps({
  location: { type: String, default: 'bottom end' },
  maxWidth: { type: String, default: '450px' },
  minWidth: { type: String, default: '380px' },
  enableNotifications: { type: Boolean, default: true },
  enableSound: { type: Boolean, default: true },
})

const emit = defineEmits(['task-completed', 'task-failed', 'all-tasks-done'])

const TASKS_KEY = 'backgroundTasks'
const pollingIntervals = new Map<string, any>()

// Estados
const expanded = ref(true)
const visible = ref(true)
const minimized = ref(false)
const showHidden = ref(false)
const hasNewTasks = ref(false)
const tasks = ref<BackgroundTask[]>([])
const filter = ref<'all' | 'pending' | 'completed' | 'failed'>('all')
const searchQuery = ref('')
const showSettings = ref(false)
const autoHideCompleted = ref(false)
const soundEnabled = ref(props.enableSound)
const notificationsEnabled = ref(props.enableNotifications)
const snackbar = ref<{ show: boolean; message: string; color: string }>({ show: false, message: '', color: 'success' })

const { t } = useI18n()

// Computed
const filteredTasks = computed(() => {
  let filtered = showHidden.value ? tasks.value : tasks.value.filter(task => !task.hidden)

  // Filtrar por estado
  if (filter.value !== 'all')
    filtered = filtered.filter(task => task.status === filter.value)

  // Filtrar por búsqueda
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()

    filtered = filtered.filter(task =>
      task.message.toLowerCase().includes(query)
      || task.title?.toLowerCase().includes(query)
      || task.category?.toLowerCase().includes(query),
    )
  }

  return filtered
})

const hiddenTasksCount = computed(() =>
  tasks.value.filter(task => task.hidden).length,
)

const taskStats = computed(() => {
  const stats = {
    total: tasks.value.length,
    pending: 0,
    completed: 0,
    failed: 0,
    cancelled: 0,
  }

  tasks.value.forEach(task => {
    stats[task.status]++
  })

  return stats
})

const hasActiveTasks = computed(() => taskStats.value.pending > 0)

// Funciones de persistencia
function getPersistedTasks(): BackgroundTask[] {
  return JSON.parse(localStorage.getItem(TASKS_KEY) || '[]')
}

function persistTasks() {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks.value))
}

// Funciones de gestión de tareas
function addTask(task: Partial<BackgroundTask>) {
  if (!tasks.value.find(e => e.task_id === task.task_id)) {
    // Siempre agrega como pending, el polling actualizará el estado
    const newTask: BackgroundTask = {
      task_id: task.task_id!,
      status: 'pending',
      message: t(task.messageKey || 'task.processing'),
      started: task.started || Date.now(),
      progress: 0,
      ...task,
    }

    tasks.value.unshift(newTask)
    persistTasks()
    pollTaskStatus(newTask)
    if (!visible.value || minimized.value) {
      visible.value = true
      minimized.value = false
    }
    if (minimized.value)
      hasNewTasks.value = true
  }
}

function removeTask(task_id: string) {
  tasks.value = tasks.value.filter(e => e.task_id !== task_id)
  persistTasks()
}

function clearCompleted() {
  // Eliminar tareas completadas, canceladas u ocultas
  tasks.value = tasks.value.filter(e =>
    e.status === 'pending'
    || (e.status === 'failed' && !e.hidden),
  )
  persistTasks()
}

function clearHidden() {
  tasks.value = tasks.value.filter(e => !e.hidden)
  persistTasks()
  showHidden.value = false
}

function clearAll() {
  const hasImportantTasks = tasks.value.some(t =>
    t.status === 'pending'
    || (t.status === 'completed' && t.download_url && !t.hidden),
  )

  if (hasImportantTasks) {
    if (!confirm(t('Hay tareas importantes (activas o con descargas disponibles). ¿Estás seguro de que quieres eliminar TODAS las tareas?')))
      return
  }

  tasks.value = []
  persistTasks()
  pollingIntervals.forEach((_, key) => pollingIntervals.delete(key))
}

function allDone() {
  return tasks.value.every(t => t.status !== 'pending')
}

function toggleExpand() {
  expanded.value = !expanded.value
}

function closePanel() {
  // Advertir al usuario si hay tareas activas
  if (hasActiveTasks.value) {
    if (!confirm(t('Hay tareas activas en progreso. Si cierras el panel, las tareas continuarán ejecutándose pero no podrás ver su progreso. ¿Deseas continuar?')))
      return
  }

  // Cerrar el panel pero mantener las tareas en localStorage
  visible.value = false
  minimized.value = false
}

function retryTask(task: BackgroundTask) {
  task.status = 'pending'
  task.message = t(task.messageKey || 'task.processing')
  task.progress = 0
  task.hidden = false // Hacer visible de nuevo
  persistTasks()
  pollTaskStatus(task)
}

function cancelTask(task: BackgroundTask) {
  task.status = 'cancelled'
  task.message = t('Tarea cancelada')
  persistTasks()

  // Detener el polling si existe
  if (pollingIntervals.has(task.task_id))
    pollingIntervals.delete(task.task_id)
}

// Notificaciones
function showNotification(title: string, body: string, type: 'success' | 'error' = 'success') {
  if (!notificationsEnabled.value)
    return

  // Notificación del navegador si está permitido
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: type === 'success' ? '/icon-success.png' : '/icon-error.png',
      tag: 'background-task',
    })
  }

  // Sonido de notificación
  if (soundEnabled.value) {
    const audio = new Audio(type === 'success' ? '/sounds/success.wav' : '/sounds/error.wav')

    audio.volume = 0.3
    audio.play().catch(() => {})
  }
}

// Helper para extraer el nombre de archivo de una URL
function getFileNameFromUrl(url?: string): string | undefined {
  if (!url)
    return undefined
  try {
    const parts = url.split('/')

    return parts[parts.length - 1] || undefined
  }
  catch {
    return undefined
  }
}

// Polling mejorado con reintentos
async function pollTaskStatus(task: BackgroundTask) {
  if (pollingIntervals.has(task.task_id))
    return
  pollingIntervals.set(task.task_id, true)
  let polling = true
  let retryCount = 0
  const maxRetries = 3
  while (polling && task.status === 'pending') {
    await new Promise(resolve => setTimeout(resolve, 3000))
    try {
      const status = await rawApi(`/dynamic-reports/executions/${task.task_id}/status`, {
        method: 'GET',
        responseType: 'json',
      })

      const idx = tasks.value.findIndex(t => t.task_id === task.task_id)
      if (status.status === 'completed' && idx !== -1) {
        const fileName = getFileNameFromUrl(status.download_url)

        tasks.value[idx] = {
          ...tasks.value[idx],
          status: 'completed',
          message: fileName || t('¡Tarea completada!'),
          download_url: status.download_url,
          progress: 100,
        }
        persistTasks()
        polling = false
        showNotification(t('Tarea completada'), fileName || task.title || task.message, 'success')
        emit('task-completed', tasks.value[idx])
        if (autoHideCompleted.value) {
          setTimeout(() => {
            tasks.value[idx] = { ...tasks.value[idx], hidden: true }
            persistTasks()
          }, 30000)
        }
      }
      else if (status.status === 'failed' && idx !== -1) {
        tasks.value[idx] = {
          ...tasks.value[idx],
          status: 'failed',
          message: status.error_message || t('Error en la tarea'),
        }
        persistTasks()
        polling = false
        showNotification(t('Error en tarea'), tasks.value[idx].message, 'error')
        emit('task-failed', tasks.value[idx])
      }
      if (status.progress !== undefined && idx !== -1) {
        tasks.value[idx] = {
          ...tasks.value[idx],
          progress: status.progress,
        }
        persistTasks()
      }
      retryCount = 0
    }
    catch (error) {
      retryCount++
      if (retryCount >= maxRetries) {
        const idx = tasks.value.findIndex(t => t.task_id === task.task_id)
        if (idx !== -1) {
          tasks.value[idx] = {
            ...tasks.value[idx],
            status: 'failed',
            message: t('Error de conexión después de varios intentos'),
          }
          persistTasks()
        }
        polling = false
      }
    }
  }
  pollingIntervals.delete(task.task_id)
  if (allDone())
    emit('all-tasks-done')
}

// Solicitar permisos de notificación
async function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    const permission = await Notification.requestPermission()

    notificationsEnabled.value = permission === 'granted'
  }
}

// Agrega la función utilitaria para descargar
function downloadFile(url: string) {
  if (typeof window !== 'undefined' && url)
    window.open(url, '_blank')
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    snackbar.value = { show: true, message: t('Enlace copiado al portapapeles'), color: 'success' }
  }
  catch (e) {
    snackbar.value = { show: true, message: t('No se pudo copiar el enlace'), color: 'error' }
  }
}

// Lifecycle
onMounted(() => {
  tasks.value = getPersistedTasks()

  // Reanudar polling para tareas pendientes
  tasks.value.forEach(task => {
    if (task.status === 'pending')
      pollTaskStatus(task)
  })

  // Siempre mostrar el panel si hay tareas
  if (tasks.value.length > 0) {
    visible.value = true
    minimized.value = false
  }

  // Solicitar permisos de notificación si está habilitado
  if (props.enableNotifications)
    requestNotificationPermission()
})

// Watchers
watch(minimized, isMinimized => {
  if (!isMinimized)
    hasNewTasks.value = false
})

// Exponer métodos
function addTaskAndStartPolling(task: Partial<BackgroundTask>) {
  addTask(task)
}

function toggleVisibility() {
  if (!visible.value) {
    visible.value = true
    minimized.value = false
  }
  else {
    minimized.value = !minimized.value
  }
}

function showPanel() {
  visible.value = true
  minimized.value = false
}

defineExpose({
  addTaskAndStartPolling,
  clearAll,
  toggleVisibility,
  showPanel,
})

// Helpers para UI
const getCategoryIcon = (category?: string) => {
  const categoryIcons: Record<string, string> = {
    reporte: 'tabler-file-analytics',
    exportacion: 'tabler-file-export',
    importacion: 'tabler-file-import',
    procesamiento: 'tabler-cpu',
    descarga: 'tabler-download',
    email: 'tabler-mail',
    sincronizacion: 'tabler-refresh',
    backup: 'tabler-database-export',
    default: 'tabler-file',
  }

  return categoryIcons[category?.toLowerCase()] || categoryIcons.default
}

const stateIcon = (status: string) => {
  switch (status) {
    case 'completed': return { icon: 'tabler-circle-check-filled', color: 'success' }
    case 'failed': return { icon: 'tabler-alert-circle-filled', color: 'error' }
    case 'cancelled': return { icon: 'tabler-ban', color: 'warning' }
    default: return { icon: 'tabler-loader-2', color: 'info', spin: true }
  }
}

const stateTooltip = (task: BackgroundTask) => {
  switch (task.status) {
    case 'completed': return t('Descarga disponible')
    case 'failed': return t('Hubo un error: ') + (task.message || '')
    case 'cancelled': return t('Tarea cancelada por el usuario')
    default: return t('Procesando...') + (task.progress ? ` ${task.progress}%` : '')
  }
}

const getRelativeTime = (timestamp: number) => {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)

  if (hours > 0)
    return t(`Hace ${hours}h`)
  if (minutes > 0)
    return t(`Hace ${minutes}m`)

  return t('Ahora mismo')
}

// 1. Función para icono de archivo exportado
const getFileIcon = (format?: string) => {
  switch ((format || '').toLowerCase()) {
    case 'excel':
    case 'xlsx':
    case 'xls':
      return 'tabler-file-type-xls'
  case 'csv':
      return 'tabler-file-type-csv'
  case 'pdf':
      return 'tabler-file-type-pdf'
  default:
      return 'tabler-file'
  }
}
</script>

<template>
  <Teleport to="body">
    <!-- Panel completo -->
    <VSlideYTransition>
      <div
        v-if="visible && tasks.length > 0 && !minimized"
        class="background-task-panel"
        :class="[props.location.replace(' ', '-')]"
      >
        <VCard
          elevation="12"
          class="task-card"
          :style="{
            maxWidth: props.maxWidth,
            minWidth: props.minWidth,
          }"
        >
          <!-- Header -->
          <VCardTitle class="task-header pa-4">
            <div class="d-flex align-center justify-space-between">
              <div class="d-flex align-center gap-2">
                <VBadge
                  v-if="hasActiveTasks"
                  :content="taskStats.pending"
                  color="primary"
                  class="badge-animation"
                >
                  <VIcon
                    icon="tabler-clock-hour-4"
                    size="24"
                  />
                </VBadge>
                <VIcon
                  v-else
                  icon="tabler-clock-check"
                  size="24"
                  color="success"
                />

                <div>
                  <div class="text-h6 font-weight-medium">
                    {{ t('Tareas en segundo plano') }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ taskStats.pending }} {{ t('activas') }},
                    {{ taskStats.completed }} {{ t('completadas') }}
                  </div>
                </div>
              </div>

              <div class="d-flex align-center gap-1">
                <VBtn
                  icon
                  size="small"
                  variant="text"
                  @click="showSettings = !showSettings"
                >
                  <VIcon icon="tabler-settings" />
                  <VTooltip
                    :attach="undefined"
                    activator="parent"
                    location="top"
                  >
                    {{ t('Configuración') }}
                  </VTooltip>
                </VBtn>

                <VBtn
                  icon
                  size="small"
                  variant="text"
                  @click="toggleExpand"
                >
                  <VIcon
                    :icon="expanded ? 'tabler-chevron-down' : 'tabler-chevron-up'"
                    class="expand-icon"
                    :class="{ rotated: !expanded }"
                  />
                  <VTooltip
                    :attach="undefined"
                    activator="parent"
                    location="top"
                  >
                    {{ expanded ? t('Colapsar') : t('Expandir') }}
                  </VTooltip>
                </VBtn>

                <VBtn
                  icon
                  size="small"
                  variant="text"
                  @click="minimized = true"
                >
                  <VIcon icon="tabler-minus" />
                  <VTooltip
                    :attach="undefined"
                    activator="parent"
                    location="top"
                  >
                    {{ t('Minimizar') }}
                  </VTooltip>
                </VBtn>

                <VBtn
                  icon
                  size="small"
                  variant="text"
                  @click="closePanel"
                >
                  <VIcon icon="tabler-x" />
                  <VTooltip
                    :attach="undefined"
                    activator="parent"
                    location="top"
                  >
                    {{ t('Cerrar panel') }}
                  </VTooltip>
                </VBtn>
              </div>
            </div>
          </VCardTitle>

          <VExpandTransition>
            <div v-show="expanded">
              <VDivider />

              <!-- Configuración -->
              <VExpandTransition>
                <div
                  v-if="showSettings"
                  class="pa-4 settings-section"
                >
                  <div class="d-flex flex-column gap-3">
                    <VSwitch
                      v-model="notificationsEnabled"
                      :label="t('Notificaciones del navegador')"
                      density="compact"
                      hide-details
                    />
                    <VSwitch
                      v-model="soundEnabled"
                      :label="t('Sonido de notificación')"
                      density="compact"
                      hide-details
                    />
                    <VSwitch
                      v-model="autoHideCompleted"
                      :label="t('Ocultar completadas automáticamente (30s)')"
                      density="compact"
                      hide-details
                    />
                  </div>
                  <VDivider class="mt-3" />
                </div>
              </VExpandTransition>

              <!-- Filtros y búsqueda -->
              <div
                v-if="false"
                class="pa-3 filters-section"
              >
                <VTextField

                  v-model="searchQuery"
                  placeholder="Buscar tareas..."
                  density="compact"
                  variant="outlined"
                  hide-details
                  clearable
                  class="mb-3"
                >
                  <template #prepend-inner>
                    <VIcon
                      icon="tabler-search"
                      size="20"
                    />
                  </template>
                </VTextField>

                <!-- 1. Nuevo toggle de filtros con íconos y tooltips -->
                <VBtnToggle
                  v-model="filter"
                  density="comfortable"
                  class="my-2 w-100"
                  divided
                >
                  <VTooltip
                    :attach="undefined"
                    activator="parent"
                    location="top"
                  >
                    {{ t('Todas') }}
                  </VTooltip>
                  <VBtn value="all">
                    <VIcon icon="tabler-list" />
                  </VBtn>
                  <VTooltip
                    :attach="undefined"
                    activator="parent"
                    location="top"
                  >
                    {{ t('Activas') }}
                  </VTooltip>
                  <VBtn value="pending">
                    <VIcon icon="tabler-loader-2" />
                  </VBtn>
                  <VTooltip
                    :attach="undefined"
                    activator="parent"
                    location="top"
                  >
                    {{ t('Listas') }}
                  </VTooltip>
                  <VBtn value="completed">
                    <VIcon icon="tabler-check" />
                  </VBtn>
                  <VTooltip
                    :attach="undefined"
                    activator="parent"
                    location="top"
                  >
                    {{ t('Error') }}
                  </VTooltip>
                  <VBtn value="failed">
                    <VIcon icon="tabler-x" />
                  </VBtn>
                </VBtnToggle>
              </div>

              <VDivider />

              <!-- Lista de tareas -->
              <div class="task-list">
                <VList
                  v-if="filteredTasks.length > 0"
                  density="compact"
                  class="pa-0"
                >
                  <TransitionGroup name="task-list">
                    <VListItem
                      v-for="task in filteredTasks"
                      :key="task.task_id"
                      class="task-item"
                      :class="[`task-${task.status}`, { 'task-hidden': task.hidden }]"
                    >
                      <template #prepend>
                        <VAvatar
                          size="36"
                          :color="stateIcon(task.status).color"
                          variant="tonal"
                        >
                          <VIcon
                            v-if="task.status === 'pending'"
                            :icon="getFileIcon(task.export_format)"
                            size="20"
                          />
                          <VIcon
                            v-else
                            :icon="stateIcon(task.status).icon"
                            size="20"
                          />
                        </VAvatar>
                      </template>

                      <VListItemTitle class="font-weight-medium">
                        {{ task.title || task.message }}
                      </VListItemTitle>

                      <VListItemSubtitle>
                        <div class="d-flex align-center gap-2">
                          <VChip
                            v-if="task.category"
                            size="x-small"
                            variant="tonal"
                            :color="stateIcon(task.status).color"
                          >
                            {{ task.category }}
                          </VChip>
                          <span class="text-caption">
                            {{ getRelativeTime(task.started) }}
                          </span>
                        </div>
                      </VListItemSubtitle>

                      <!-- 2. Barra de progreso lineal moderna en cada tarea -->
                      <VProgressLinear
                        v-if="task.status === 'pending'"
                        :model-value="task.progress > 0 ? task.progress : undefined"
                        :indeterminate="!task.progress || task.progress === 0"
                        color="primary"
                        height="4"
                        rounded
                        class="my-2"
                      />

                      <template #append>
                        <div class="d-flex align-center gap-1">
                          <!-- Botón de descarga -->
                          <VBtn
                            v-if="task.status === 'completed' && task.download_url"
                            icon
                            size="small"
                            variant="tonal"
                            color="primary"
                            @click="downloadFile(task.download_url)"
                          >
                            <VIcon icon="tabler-download" />
                            <VTooltip
                              :attach="undefined"
                              activator="parent"
                              location="top"
                            >
                              {{ t('Descargar resultado') }}
                            </VTooltip>
                          </VBtn>

                          <!-- Botón de reintentar -->
                          <VBtn
                            v-if="task.status === 'failed'"
                            icon
                            size="small"
                            variant="tonal"
                            color="warning"
                            @click="() => retryTask(task)"
                          >
                            <VIcon icon="tabler-refresh" />
                            <VTooltip
                              :attach="undefined"
                              activator="parent"
                              location="top"
                            >
                              {{ t('Reintentar tarea') }}
                            </VTooltip>
                          </VBtn>

                          <!-- Botón de cancelar -->
                          <VBtn
                            v-if="task.status === 'pending'"
                            icon
                            size="small"
                            variant="tonal"
                            color="error"
                            @click="() => cancelTask(task)"
                          >
                            <VIcon icon="tabler-x" />
                            <VTooltip
                              :attach="undefined"
                              activator="parent"
                              location="top"
                            >
                              {{ t('Cancelar tarea') }}
                            </VTooltip>
                          </VBtn>

                          <!-- Menú de opciones -->
                          <VMenu :attach="undefined">
                            <template #activator="{ props }">
                              <VBtn
                                icon
                                size="small"
                                variant="text"
                                v-bind="props"
                              >
                                <VIcon icon="tabler-dots-vertical" />
                              </VBtn>
                            </template>
                            <VList density="compact">
                              <VListItem
                                v-if="task.hidden"
                                @click="() => { task.hidden = false; persistTasks() }"
                              >
                                <VListItemTitle>
                                  <VIcon
                                    icon="tabler-eye"
                                    size="20"
                                    class="me-2"
                                  />
                                  {{ t('Mantener visible') }}
                                </VListItemTitle>
                              </VListItem>
                              <VListItem @click="() => removeTask(task.task_id)">
                                <VListItemTitle>
                                  <VIcon
                                    icon="tabler-trash"
                                    size="20"
                                    class="me-2"
                                  />
                                  {{ t('Eliminar') }}
                                </VListItemTitle>
                              </VListItem>
                              <VListItem
                                v-if="task.download_url"
                                @click="() => copyToClipboard(task.download_url)"
                              >
                                <VListItemTitle>
                                  <VIcon
                                    icon="tabler-copy"
                                    size="20"
                                    class="me-2"
                                  />
                                  {{ t('Copiar enlace') }}
                                </VListItemTitle>
                              </VListItem>
                            </VList>
                          </VMenu>
                        </div>
                      </template>

                      <VTooltip
                        :attach="undefined"
                        activator="parent"
                        location="top"
                      >
                        {{ stateTooltip(task) }}
                      </VTooltip>
                    </VListItem>
                  </TransitionGroup>
                </VList>

                <!-- Estado vacío -->
                <div
                  v-else
                  class="empty-state pa-6 text-center"
                >
                  <VIcon
                    icon="tabler-inbox"
                    size="48"
                    color="medium-emphasis"
                    class="mb-3"
                  />
                  <div class="text-body-2 text-medium-emphasis">
                    {{ t('No hay tareas que mostrar') }}
                  </div>
                </div>
              </div>

              <!-- Footer con acciones -->
              <VDivider />
              <div class="d-flex flex-column pa-3 gap-2">
                <!-- Mostrar tareas ocultas si las hay -->
                <div
                  v-if="hiddenTasksCount > 0 && !showHidden"
                  class="text-center"
                >
                  <VBtn
                    variant="tonal"
                    color="info"
                    size="small"
                    block
                    @click="showHidden = true"
                  >
                    <VIcon
                      icon="tabler-eye"
                      size="18"
                      class="me-1"
                    />
                    {{ t(`Mostrar ${hiddenTasksCount} tareas ocultas`) }}
                  </VBtn>
                </div>

                <div
                  v-else-if="showHidden && hiddenTasksCount > 0"
                  class="text-center"
                >
                  <div class="d-flex gap-2">
                    <VBtn
                      variant="tonal"
                      color="info"
                      size="small"
                      @click="showHidden = false"
                    >
                      <VIcon
                        icon="tabler-eye-off"
                        size="18"
                        class="me-1"
                      />
                      {{ t('Ocultar antiguas') }}
                    </VBtn>
                    <VBtn
                      variant="tonal"
                      color="warning"
                      size="small"
                      @click="clearHidden"
                    >
                      <VIcon
                        icon="tabler-trash"
                        size="18"
                        class="me-1"
                      />
                      {{ t('Eliminar ocultas') }}
                    </VBtn>
                  </div>
                </div>

                <div class="d-flex justify-space-between align-center">
                  <div class="text-caption text-medium-emphasis">
                    {{ taskStats.total }} {{ t('tareas en total') }}
                  </div>
                  <div class="d-flex gap-2">
                    <VBtn
                      variant="text"
                      color="secondary"
                      size="small"
                      :disabled="taskStats.completed === 0 && taskStats.cancelled === 0"
                      @click="clearCompleted"
                    >
                      <VIcon
                        icon="tabler-circle-check"
                        size="18"
                        class="me-1"
                      />
                      {{ t('Limpiar completadas') }}
                    </VBtn>
                    <VBtn
                      variant="text"
                      color="error"
                      size="small"
                      :disabled="tasks.length === 0"
                      @click="clearAll"
                    >
                      <VIcon
                        icon="tabler-trash"
                        size="18"
                        class="me-1"
                      />
                      {{ t('Limpiar todo') }}
                    </VBtn>
                  </div>
                </div>
              </div>
            </div>
          </VExpandTransition>
        </VCard>
      </div>
    </VSlideYTransition>

    <!-- Botón flotante cuando está minimizado -->
    <VSlideYTransition>
      <div
        v-if="visible && tasks.length > 0 && minimized"
        class="floating-task-button"
        :class="[props.location.replace(' ', '-')]"
      >
        <VBtn
          icon
          size="large"
          color="primary"
          elevation="8"
          @click="() => { minimized = false; hasNewTasks = false }"
        >
          <VBadge
            v-if="hasActiveTasks"
            :content="taskStats.pending"
            color="error"
            class="badge-animation"
          >
            <VIcon icon="tabler-clock-hour-4" />
          </VBadge>
          <VIcon
            v-else
            icon="tabler-clock-check"
          />
          <VTooltip
            :attach="undefined"
            activator="parent"
            location="top"
          >
            {{ taskStats.pending }} tareas activas, {{ taskStats.completed }} completadas
          </VTooltip>
        </VBtn>
      </div>
    </VSlideYTransition>
  </Teleport>
  <!-- Snackbar de feedback para copiar enlace -->
  <VSnackbar
    v-model="snackbar.show"
    :color="snackbar.color"
    timeout="2000"
    location="bottom right"
    elevation="6"
  >
    {{ snackbar.message }}
  </VSnackbar>
</template>

<style scoped>
.background-task-panel {
  position: fixed;
  z-index: 0;
  margin: 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.background-task-panel.bottom-end {
  inset-block-end: 0;
  inset-inline-end: 0;
}

.background-task-panel.top-end {
  inset-block-start: 0;
  inset-inline-end: 0;
}

.background-task-panel.bottom-start {
  inset-block-end: 0;
  inset-inline-start: 0;
}

.background-task-panel.top-start {
  inset-block-start: 0;
  inset-inline-start: 0;
}

.floating-task-button {
  position: fixed;
  z-index: 9999;
  margin: 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.floating-task-button.bottom-end {
  inset-block-end: 0;
  inset-inline-end: 0;
}

.floating-task-button.top-end {
  inset-block-start: 0;
  inset-inline-end: 0;
}

.floating-task-button.bottom-start {
  inset-block-end: 0;
  inset-inline-start: 0;
}

.floating-task-button.top-start {
  inset-block-start: 0;
  inset-inline-start: 0;
}

.task-card {
  overflow: hidden;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 16px !important;
  backdrop-filter: blur(10px);
  background: rgba(var(--v-theme-surface), 0.95) !important;
}

.task-header {
  background:
    linear-gradient(
      135deg,
      rgba(var(--v-theme-primary), 0.08) 0%,
      rgba(var(--v-theme-surface), 0) 100%
    );
  border-block-end: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.settings-section {
  background: rgba(var(--v-theme-surface-variant), 0.3);
}

.filters-section {
  background: rgba(var(--v-theme-surface-variant), 0.1);
}

.task-list {
  overflow: hidden auto;
  max-block-size: 400px;
  scroll-behavior: smooth;
}

.task-list::-webkit-scrollbar {
  inline-size: 6px;
}

.task-list::-webkit-scrollbar-track {
  background: rgba(var(--v-theme-on-surface), 0.05);
}

.task-list::-webkit-scrollbar-thumb {
  border-radius: 3px;
  background: rgba(var(--v-theme-on-surface), 0.2);
}

.task-list::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--v-theme-on-surface), 0.3);
}

.task-item {
  border-block-end: 1px solid rgba(var(--v-theme-on-surface), 0.05);
  transition: all 0.2s ease;
}

.task-item:hover {
  background: rgba(var(--v-theme-primary), 0.04);
}

.task-item.task-completed {
  background: rgba(var(--v-theme-success), 0.04);
}

.task-item.task-failed {
  background: rgba(var(--v-theme-error), 0.04);
}

.task-item.task-cancelled {
  opacity: 0.7;
}

.task-item.task-hidden {
  background: rgba(var(--v-theme-surface-variant), 0.2);
  opacity: 0.5;
}

/* Animaciones */
.spin-animation {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

.expand-icon {
  transition: transform 0.3s ease;
}

.expand-icon.rotated {
  transform: rotate(180deg);
}

/* Transiciones de lista */
.task-list-enter-active,
.task-list-leave-active {
  transition: all 0.3s ease;
}

.task-list-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.task-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.task-list-move {
  transition: transform 0.3s ease;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-block-size: 200px;
}

/* Tema oscuro */
@media (prefers-color-scheme: dark) {
  .task-card {
    background: rgba(var(--v-theme-surface), 0.98) !important;
  }

  .task-header {
    background:
      linear-gradient(
        135deg,
        rgba(var(--v-theme-primary), 0.15) 0%,
        rgba(var(--v-theme-surface), 0) 100%
      );
  }
}

/* Asegura que los overlays de Vuetify estén por encima del panel */
:global(.v-overlay__content) {
  z-index: 10010 !important;
}
</style>
