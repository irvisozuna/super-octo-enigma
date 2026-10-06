<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { rawApi } from '@/services/api'

const TASKS_KEY = 'pendingTasks'
const pollingIntervals = new Map<string, any>()

const snackbarQueue = ref<any[]>([])
const visible = ref(false)
const current = computed(() => snackbarQueue.value[0] || null)
const { t } = useI18n()

function getPendingTasks() {
  return JSON.parse(localStorage.getItem(TASKS_KEY) || '[]')
}
function addPendingTask(task) {
  const tasks = getPendingTasks()

  tasks.push(task)
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks))
}
function removePendingTask(task_id) {
  const tasks = getPendingTasks().filter(e => e.task_id !== task_id)

  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks))
}

function showTaskSnackbar(task) {
  // Evita duplicados
  if (!snackbarQueue.value.find(e => e.task_id === task.task_id)) {
    snackbarQueue.value.push({
      ...task,
      status: 'pending',
      message: t(task.messageKey || 'task.processing'),
      progressIndeterminate: true,
      action: {
        label: t('Cancelar'),
        callback: () => cancelTask(task.task_id),
      },
    })
    visible.value = true
  }
}

function updateTaskSnackbar(task_id, update) {
  const idx = snackbarQueue.value.findIndex(e => e.task_id === task_id)
  if (idx !== -1)
    snackbarQueue.value[idx] = { ...snackbarQueue.value[idx], ...update }
}

function closeCurrentSnackbar() {
  if (current.value) {
    removePendingTask(current.value.task_id)
    snackbarQueue.value.shift()
    visible.value = snackbarQueue.value.length > 0
  }
}

function cancelTask(task_id) {
  // Solo borra localmente, no cancela en backend
  updateTaskSnackbar(task_id, {
    status: 'cancelled',
    message: t('Tarea cancelada'),
    progressIndeterminate: false,
    color: 'warning',
    action: null,
  })
  setTimeout(() => closeCurrentSnackbar(), 1500)
}

async function pollTaskStatus(task) {
  if (pollingIntervals.has(task.task_id))
    return
  pollingIntervals.set(task.task_id, true)
  let polling = true
  while (polling) {
    await new Promise(res => setTimeout(res, 3000))

    const status = await rawApi(`/dynamic-reports/executions/${task.task_id}/status`, { method: 'GET', responseType: 'json' })
    if (status.status === 'completed') {
      removePendingTask(task.task_id)
      updateTaskSnackbar(task.task_id, {
        status: 'completed',
        message: t('¡Tarea completada!'),
        progressIndeterminate: false,
        color: 'success',
        action: {
          label: t('Descargar'),
          callback: () => window.open(status.download_url, '_blank'),
        },
      })
      polling = false
      setTimeout(() => closeCurrentSnackbar(), 20000)
    }
    else if (status.status === 'failed') {
      removePendingTask(task.task_id)
      updateTaskSnackbar(task.task_id, {
        status: 'failed',
        message: status.error_message || t('Error en la tarea'),
        progressIndeterminate: false,
        color: 'error',
        action: null,
      })
      polling = false
      setTimeout(() => closeCurrentSnackbar(), 10000)
    }

    // Si sigue pending, no cambia nada
  }
  pollingIntervals.delete(task.task_id)
}

onMounted(() => {
  // Al cargar, reanuda las tareas pendientes
  getPendingTasks().forEach(task => {
    showTaskSnackbar(task)
    pollTaskStatus(task)
  })
})

// Permite que otros componentes agreguen tareas pendientes
function addTaskAndStartPolling(task) {
  addPendingTask(task)
  showTaskSnackbar(task)
  pollTaskStatus(task)
}

defineExpose({ addTaskAndStartPolling })
</script>

<template>
  <VSnackbar
    v-model="visible"
    location="bottom end"
    :timeout="-1"
    multi-line
    elevation="6"
    :color="current?.color || 'info'"
    class="background-task-snackbar"
  >
    <div class="d-flex align-center">
      <span>{{ current?.message }}</span>
      <VProgressCircular
        v-if="current?.progressIndeterminate"
        indeterminate
        color="primary"
        size="24"
        class="ml-3"
      />
      <VBtn
        v-if="current?.action"
        color="primary"
        variant="text"
        class="ml-4"
        @click="current.action.callback"
      >
        {{ current.action.label }}
      </VBtn>
      <VBtn
        icon
        variant="text"
        class="ml-2"
        @click="closeCurrentSnackbar"
      >
        <VIcon icon="tabler-x" />
      </VBtn>
    </div>
  </VSnackbar>
</template>

<style scoped>
.background-task-snackbar {
  max-inline-size: 420px;
  min-inline-size: 340px;
}
</style>
