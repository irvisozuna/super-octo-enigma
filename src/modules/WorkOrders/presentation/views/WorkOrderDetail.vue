<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseDataTable from '@/components/BaseDataTable.vue'
import { WorkOrderApiService } from '../../infrastructure/api/services/WorkOrderApiService'
import { useWorkOrdersStore } from '../stores/workOrdersStore'
import { useTenantStore } from '@/stores/tenant.store'
import { useCurrentUser } from '@/composables/useCurrentUser'
import { useNotification } from '@/helpers/notificationHelper'

const route = useRoute()
const router = useRouter()
const store = useWorkOrdersStore()
const tenantStore = useTenantStore()
const { getUserData } = useCurrentUser()
const { showError } = useNotification()
const apiService = new WorkOrderApiService()

const histories = ref<any[]>([])
const photos = ref<any[]>([])
const historiesLoading = ref(false)
const photosLoading = ref(false)
const savingUpdate = ref(false)
const savingAssignment = ref(false)
const commentText = ref('')
const notesText = ref('')
const selectedStatus = ref('')
const statusLoading = ref(false)
const selectedWorkerId = ref<string | null>(null)
const workers = ref<any[]>([])
const workersLoading = ref(false)
const photosDialog = ref(false)
const activePhoto = ref(0)

const historyPagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0,
})

const historySort = ref({
  sortBy: 'date',
  sortDesc: true,
})

const historyHeaders = [
  { title: 'Fecha', key: 'date', sortable: true },
  { title: 'Estado', key: 'status', sortable: true },
  { title: 'Comentario', key: 'comment', sortable: false },
  { title: 'Autor', key: 'author', sortable: false },
]

const workOrderId = computed(() => route.params.id as string)
const workOrder = computed(() => store.currentItem)
const companyId = computed(() => tenantStore.data?.companyId || '')
const pageLoading = computed(() => store.detailLoading)

const statusCatalogs = ref<any[]>([])
const statusOptions = computed(() => {
  return statusCatalogs.value.map(item => ({
    title: item.name ?? item.label ?? item.code ?? item.external_id ?? item.externalId ?? item.id,
    value: item.code ?? item.external_id ?? item.externalId ?? item.id ?? item.name,
  })).filter(item => item.value)
})
const statusSteps = [
  { key: 'created', label: 'Creada' },
  { key: 'pending', label: 'Pendiente' },
  { key: 'in_progress', label: 'En proceso' },
  { key: 'in_review', label: 'En revision' },
  { key: 'completed', label: 'Completada' },
  { key: 'closed', label: 'Cerrada' },
]

const normalizeArray = (response: any) => {
  if (Array.isArray(response))
    return response
  if (Array.isArray(response?.data))
    return response.data
  if (Array.isArray(response?.data?.data))
    return response.data.data

  return []
}

const resolveWorkerId = async (userId?: string | number | null) => {
  if (!userId)
    return null

  let workers = normalizeArray(await apiService.getWorkers({ user_id: userId }).catch(() => []))

  if (!workers.length)
    workers = normalizeArray(await apiService.getWorkers().catch(() => []))

  const match = workers.find(item => {
    const workerUserId = item.user_id ?? item.userId ?? item.userid ?? item.user?.id ?? item.assigned_to ?? item.assigned?.id
    return String(workerUserId ?? '') === String(userId)
  })

  const workerExternalId = match?.external_id ?? match?.externalId ?? match?.employee_code ?? match?.code ?? null
  const workerId = match?.id ?? match?.worker_id ?? match?.worker?.id ?? null

  return workerExternalId
    ? String(workerExternalId)
    : (workerId ? String(workerId) : null)
}

const formatDate = (value?: string) => {
  if (!value)
    return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime()))
    return value

  return date.toLocaleString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const resolvePhotoUrl = (value?: string) => {
  if (!value)
    return ''

  if (value.startsWith('http') || value.startsWith('data:'))
    return value

  const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL
  const prefix = baseUrl ? baseUrl.replace(/\/$/, '') : ''

  if (value.startsWith('/'))
    return `${prefix}${value}`

  return `${prefix}/${value}`
}

const photoItems = computed(() => {
  return photos.value
    .map(item => ({
      id: item.id ?? item.uuid ?? item.path ?? item.url,
      src: resolvePhotoUrl(
        item.url
        ?? item.photo_url
        ?? item.path
        ?? item.photo_path
        ?? item.file_path,
      ),
      title: item.title ?? item.name ?? 'Foto de la orden',
    }))
    .filter(item => item.src)
})

const historyRows = computed(() => {
  const rows = histories.value.map(item => ({
    date: formatDate(item.changed_at ?? item.created_at ?? item.date ?? item.createdAt),
    status: item.status ?? item.state ?? '-',
    comment: item.comment ?? item.notes ?? item.message ?? '-',
    author: item.changed_by_worker?.name
      ?? item.changed_by_user?.name
      ?? workersByExternalId.value.get(String(item.changed_by ?? ''))?.name
      ?? item.changed_by
      ?? item.author
      ?? item.user_name
      ?? item.created_by
      ?? '-',
    _raw: item,
  }))

  const sortKey = historySort.value.sortBy
  const sortDesc = historySort.value.sortDesc

  if (!sortKey)
    return rows

  const keyMap: Record<string, (row: any) => string | number> = {
    date: row => new Date(row._raw?.changed_at ?? row._raw?.created_at ?? row._raw?.date ?? row._raw?.createdAt ?? 0).getTime(),
    status: row => String(row.status || '').toLowerCase(),
    author: row => String(row.author || '').toLowerCase(),
  }

  const getter = keyMap[sortKey] || keyMap.date

  return [...rows].sort((a, b) => {
    const aVal = getter(a)
    const bVal = getter(b)
    if (aVal === bVal)
      return 0

    if (sortDesc)
      return aVal > bVal ? -1 : 1

    return aVal > bVal ? 1 : -1
  })
})

const currentWorkerId = computed(() => {
  const value = workOrder.value?.worker_id ?? workOrder.value?.assigned_to ?? workOrder.value?.worker?.id ?? null
  return value ? String(value) : null
})

const currentWorkerName = computed(() => {
  return workOrder.value?.worker?.name ?? workOrder.value?.assigned_to ?? workOrder.value?.worker_id ?? '-'
})

const workerOptions = computed(() => {
  return workers.value.map(item => ({
    title: item.name ?? item.full_name ?? item.username ?? item.assigned_to ?? '-',
    value: String(item.id ?? item.worker_id ?? item.user_id ?? ''),
  })).filter(item => item.value && item.value !== currentWorkerId.value)
})

const workersById = computed(() => {
  const map = new Map<string, any>()
  workers.value.forEach(item => {
    const key = String(item.id ?? item.worker_id ?? item.user_id ?? '')
    if (key)
      map.set(key, item)
  })
  return map
})

const workersByExternalId = computed(() => {
  const map = new Map<string, any>()
  workers.value.forEach(item => {
    const keys = [
      item.external_id,
      item.externalId,
      item.employee_code,
      item.code,
    ].filter(key => key !== null && key !== undefined && key !== '')

    keys.forEach(key => map.set(String(key), item))
  })
  return map
})

const normalizeStatus = (value?: string) => {
  const normalized = String(value || '').toLowerCase()

  if (normalized.includes('creat') || normalized.includes('cread'))
    return 'created'
  if (normalized.includes('assign') || normalized.includes('asignad'))
    return 'pending'
  if (normalized.includes('pend'))
    return 'pending'
  if (normalized.includes('proceso') || normalized.includes('progress'))
    return 'in_progress'
  if (normalized.includes('revision') || normalized.includes('revisión') || normalized.includes('review'))
    return 'in_review'
  if (normalized.includes('complet') || normalized.includes('terminad') || normalized.includes('finaliz'))
    return 'completed'
  if (normalized.includes('cerrad') || normalized.includes('closed'))
    return 'closed'

  return normalized
}

const getPriorityColor = (value: string) => {
  const normalized = String(value || '').toLowerCase()

  if (normalized.includes('high') || normalized.includes('alta'))
    return 'priority--high'

  if (normalized.includes('medium') || normalized.includes('media'))
    return 'priority--medium'

  if (normalized.includes('low') || normalized.includes('baja'))
    return 'priority--low'

  return 'priority--default'
}

const getPriorityLabel = (value?: string) => {
  const normalized = String(value || '').toLowerCase()

  if (normalized.includes('high') || normalized.includes('alta'))
    return 'Alta'
  if (normalized.includes('medium') || normalized.includes('media'))
    return 'Media'
  if (normalized.includes('low') || normalized.includes('baja'))
    return 'Baja'

  return value || 'Sin prioridad'
}

const getPriorityBadge = (value?: string) => {
  const normalized = String(value || '').toLowerCase()

  if (normalized.includes('high') || normalized.includes('alta'))
    return 'priority-badge--high'
  if (normalized.includes('medium') || normalized.includes('media'))
    return 'priority-badge--medium'
  if (normalized.includes('low') || normalized.includes('baja'))
    return 'priority-badge--low'

  return 'priority-badge--default'
}

const getStatusChipColor = (value?: string) => {
  const normalized = String(value || '').toLowerCase()

  if (normalized.includes('cerrad') || normalized.includes('closed'))
    return 'default'
  if (normalized.includes('complet') || normalized.includes('complete'))
    return 'success'
  if (normalized.includes('revision') || normalized.includes('review'))
    return 'info'
  if (normalized.includes('proceso') || normalized.includes('progress'))
    return 'warning'
  if (normalized.includes('pend'))
    return 'secondary'

  return 'primary'
}

const getStatusDisplay = (item: any) => {
  return item?.status_catalog?.name ?? item?.status ?? item?.estado ?? item?.state ?? '-'
}

const getStatusValue = (item: any) => {
  return item?.status_catalog?.code
    ?? item?.status_catalog?.external_id
    ?? item?.status_catalog?.externalId
    ?? item?.external_work_order_status_id
    ?? item?.status
    ?? ''
}

const currentStatusKey = computed(() => {
  const raw = workOrder.value?.status_catalog?.name
    ?? workOrder.value?.status_catalog?.code
    ?? workOrder.value?.status_catalog?.external_id
    ?? workOrder.value?.status
    ?? workOrder.value?.estado
    ?? workOrder.value?.state
    ?? ''

  return normalizeStatus(raw)
})

const currentStepIndex = computed(() => {
  return statusSteps.findIndex(step => step.key === currentStatusKey.value)
})

const getStepState = (index: number) => {
  if (currentStepIndex.value < 0)
    return 'pending'

  if (index < currentStepIndex.value)
    return 'done'

  if (index === currentStepIndex.value)
    return 'active'

  return 'pending'
}

const getLineState = (index: number) => {
  if (currentStepIndex.value < 0)
    return 'pending'

  return index < currentStepIndex.value ? 'done' : 'pending'
}

const loadWorkOrder = async () => {
  if (!workOrderId.value)
    return

  store.clearCurrent()
  await store.fetchById(workOrderId.value)
}

const loadStatusCatalogs = async () => {
  statusLoading.value = true
  try {
    const response = await apiService.getStatusCatalogs({
      company_id: companyId.value || undefined,
      itemsPerPage: 500,
      page: 1,
    })
    const data = normalizeArray(response)
    statusCatalogs.value = data.length
      ? data
      : (workOrder.value?.status_catalog ? [workOrder.value.status_catalog] : [])
  }
  catch {
    statusCatalogs.value = workOrder.value?.status_catalog ? [workOrder.value.status_catalog] : []
  }
  finally {
    statusLoading.value = false
  }
}

const loadWorkers = async () => {
  workersLoading.value = true
  try {
    const response = await apiService.getWorkers()
    workers.value = normalizeArray(response)
  }
  finally {
    workersLoading.value = false
  }
}

const loadHistories = async () => {
  if (!workOrderId.value)
    return

  historiesLoading.value = true
  try {
    const response = await apiService.getHistories({
      workorder_id: workOrderId.value,
      work_order_id: workOrderId.value,
    })
    const data = normalizeArray(response)

    histories.value = data.filter(item => {
      const historyWorkOrderId = item.workorder_id ?? item.work_order_id ?? item.workorder?.id ?? item.work_order?.id

      return String(historyWorkOrderId || '') === String(workOrderId.value)
    })
  }
  finally {
    historiesLoading.value = false
  }
}

const handleHistoryOptions = (params: Record<string, any>) => {
  if (params?.sort_by) {
    historySort.value = {
      sortBy: params.sort_by,
      sortDesc: params.sort_order === 'desc',
    }
  }

  if (params?.page)
    historyPagination.value.current_page = params.page

  if (params?.per_page)
    historyPagination.value.per_page = params.per_page
}

const loadPhotos = async () => {
  if (!workOrderId.value)
    return

  photosLoading.value = true
  try {
    const response = await apiService.getPhotos({ workorder_id: workOrderId.value })
    photos.value = normalizeArray(response)
  }
  finally {
    photosLoading.value = false
  }
}

const saveStatusAndComment = async () => {
  if (!workOrderId.value || !commentText.value.trim())
    return

  savingUpdate.value = true
  try {
    const statusValue = selectedStatus.value || workOrder.value?.status || undefined
    const statusLabel = statusCatalogs.value.find(item =>
      String(item.code ?? item.external_id ?? item.externalId ?? item.id ?? item.name) === String(statusValue),
    )?.name ?? statusValue
    const userId = getUserData.value?.id ?? getUserData.value?.name ?? undefined
    const workerId = await resolveWorkerId(userId)
    if (userId && !workerId) {
      showError('Usuario no tiene activado para hacer cambios.')
      return
    }
    const changedBy = workerId ?? userId
    const changedAt = new Date().toISOString()

  if (statusValue)
      await apiService.update(workOrderId.value, {
        status: statusValue,
        external_work_order_status_id: statusValue,
        work_order_id: workOrderId.value,
        changed_by: changedBy,
        changed_at: changedAt,
      })

    await apiService.addHistory({
      workorder_id: workOrderId.value,
      work_order_id: workOrderId.value,
      notes: commentText.value.trim(),
      status: statusLabel,
      company_id: companyId.value || undefined,
      changed_by: changedBy,
      changed_at: changedAt,
    })

    commentText.value = ''
    await loadWorkOrder()
    await loadHistories()
  }
  finally {
    savingUpdate.value = false
  }
}

const saveNotes = async () => {
  if (!workOrderId.value)
    return

  savingUpdate.value = true
  try {
    const userId = getUserData.value?.id ?? getUserData.value?.name ?? undefined
    const workerId = await resolveWorkerId(userId)
    if (userId && !workerId) {
      showError('Usuario no tiene activado para hacer cambios.')
      return
    }

    const previousNotes = String(workOrder.value?.notes ?? '')
    const nextNotes = String(notesText.value ?? '')
    const historyNote = `Notas actualizadas: ${previousNotes || '-'} -> ${nextNotes || '-'}`

    await apiService.update(workOrderId.value, {
      work_order_id: workOrderId.value,
      notes: nextNotes,
      changed_by: workerId ?? userId,
      changed_at: new Date().toISOString(),
    })

    await apiService.addHistory({
      workorder_id: workOrderId.value,
      work_order_id: workOrderId.value,
      notes: historyNote,
      comment: historyNote,
      message: historyNote,
      status: getStatusDisplay(workOrder.value) || undefined,
      company_id: companyId.value || undefined,
      changed_by: workerId ?? userId,
      changed_at: new Date().toISOString(),
    })

    await loadWorkOrder()
    await loadHistories()
  }
  finally {
    savingUpdate.value = false
  }
}

const saveAssignment = async () => {
  if (!workOrderId.value || !selectedWorkerId.value)
    return

  savingAssignment.value = true
  try {
    const userId = getUserData.value?.id ?? getUserData.value?.name ?? undefined
    const workerId = await resolveWorkerId(userId)
    if (userId && !workerId) {
      showError('Usuario no tiene activado para hacer cambios.')
      return
    }

  const previousWorker = currentWorkerName.value
  const nextWorker = workerOptions.value.find(option => option.value === selectedWorkerId.value)?.title ?? selectedWorkerId.value
  const selectedWorker = selectedWorkerId.value ? workersById.value.get(String(selectedWorkerId.value)) : null
  const selectedWorkerExternalId = selectedWorker?.external_id ?? selectedWorker?.externalId ?? selectedWorker?.employee_code ?? selectedWorker?.code ?? null

  await apiService.update(workOrderId.value, {
    work_order_id: workOrderId.value,
    worker_id: selectedWorkerExternalId ?? selectedWorkerId.value,
    assigned_to: selectedWorkerExternalId ?? selectedWorkerId.value,
    external_worker_id: selectedWorkerExternalId ?? undefined,
  })

    await apiService.addHistory({
      workorder_id: workOrderId.value,
      work_order_id: workOrderId.value,
      notes: `Cambio de asignación: ${previousWorker} -> ${nextWorker}`,
      status: getStatusDisplay(workOrder.value) || undefined,
      company_id: companyId.value || undefined,
      changed_by: workerId ?? userId,
      changed_at: new Date().toISOString(),
    })

    await loadWorkOrder()
    await loadHistories()
  }
  finally {
    savingAssignment.value = false
  }
}

const openPhotos = (index: number) => {
  activePhoto.value = index
  photosDialog.value = true
}

const goBack = () => {
  router.back()
}

watch(workOrder, value => {
  if (value)
    selectedStatus.value = getStatusValue(value)
  notesText.value = value?.notes ?? ''
  selectedWorkerId.value = null
}, { immediate: true })

watch(workOrderId, async () => {
  await loadWorkOrder()
  await loadHistories()
  await loadPhotos()
})

onMounted(async () => {
  await loadWorkOrder()
  await loadHistories()
  await loadPhotos()
  await loadWorkers()
  await loadStatusCatalogs()
})
</script>

<template>
  <div class="workorder-detail">
    <VCard class="detail-card">
      <VCardText>
        <div v-if="pageLoading" class="detail-header">
          <VSkeletonLoader type="heading" class="mb-2" />
          <VSkeletonLoader type="text" />
        </div>
        <div v-else class="detail-header">
          <div class="detail-hero">
            <div class="detail-hero__main">
              <div class="detail-hero__eyebrow">Orden de trabajo</div>
              <div class="detail-hero__title">
                {{ workOrder?.local_id ?? workOrder?.folio ?? workOrder?.external_id ?? workOrder?.code ?? workOrderId }}
              </div>
              <div class="detail-hero__meta">
                <span>ID: {{ workOrderId }}</span>
                <span>•</span>
                <span>Programada: {{ formatDate(workOrder?.scheduled_at) }}</span>
              </div>
              <div class="detail-hero__chips">
                <VChip size="small" variant="tonal" :color="getStatusChipColor(getStatusDisplay(workOrder))">
                  {{ getStatusDisplay(workOrder) }}
                </VChip>
                <VChip size="small" variant="tonal" color="info">
                  {{ workOrder?.type ?? workOrder?.type_catalog?.name ?? 'Sin tipo' }}
                </VChip>
                <VChip size="small" variant="tonal" color="secondary">
                  Asignado: {{ currentWorkerName }}
                </VChip>
              </div>
            </div>
            <div class="detail-hero__actions">
              <VBtn variant="flat" color="primary" prepend-icon="tabler-camera" @click="openPhotos(0)">
                Ver fotos
              </VBtn>
              <VBtn variant="tonal" color="secondary" prepend-icon="tabler-arrow-left" @click="goBack">
                Regresar
              </VBtn>
            </div>
          </div>
        </div>

        <VDivider class="my-4" />

        <div v-if="pageLoading" class="detail-top">
          <VSkeletonLoader type="text@6" />
        </div>
        <div v-else-if="workOrder" class="detail-top">
          <div class="detail-strip">
            <div class="detail-strip__section">
              <div class="detail-strip__title">Resumen</div>
              <dl class="detail-list">
                <div class="detail-list__row">
                  <dt>Folio</dt>
                  <dd>{{ workOrder.local_id ?? workOrder.folio ?? workOrder.external_id ?? workOrder.code ?? workOrder.id ?? '-' }}</dd>
                </div>
                <div class="detail-list__row">
                  <dt>Tipo</dt>
                  <dd>{{ workOrder.type ?? workOrder.type_catalog?.name ?? workOrder.work_order_type_id ?? '-' }}</dd>
                </div>
                <div class="detail-list__row">
                  <dt>Estado</dt>
                  <dd>{{ getStatusDisplay(workOrder) }}</dd>
                </div>
                <div class="detail-list__row" :class="getPriorityColor(workOrder.priority ?? workOrder.severity ?? workOrder.priority_code ?? '')">
                  <dt>Prioridad</dt>
                  <dd>
                    <span class="priority-badge" :class="getPriorityBadge(workOrder.priority ?? workOrder.severity ?? workOrder.priority_code ?? '')">
                      <span class="priority-badge__dot" />
                      {{ getPriorityLabel(workOrder.priority ?? workOrder.severity ?? workOrder.priority_code ?? '') }}
                    </span>
                  </dd>
                </div>
                <div class="detail-list__row">
                  <dt>Asignado a</dt>
                  <dd>{{ workOrder.worker?.name ?? workOrder.assigned_to ?? workOrder.worker_id ?? '-' }}</dd>
                </div>
              </dl>
            </div>

            <div class="detail-strip__section">
              <div class="detail-strip__title">Contrato</div>
              <dl class="detail-list">
                <div class="detail-list__row">
                  <dt>Contrato</dt>
                  <dd>{{ workOrder.contract_number ?? workOrder.contract?.contract_number ?? workOrder.contract_id ?? '-' }}</dd>
                </div>
                <div class="detail-list__row">
                  <dt>Usuario</dt>
                  <dd>{{ workOrder.user_name ?? workOrder.contract?.user_name ?? '-' }}</dd>
                </div>
                <div class="detail-list__row">
                  <dt>Sistema</dt>
                  <dd>{{ workOrder.system?.name ?? workOrder.system_id ?? '-' }}</dd>
                </div>
                <div class="detail-list__row">
                  <dt>Sector</dt>
                  <dd>{{ workOrder.sector?.name ?? workOrder.sector_id ?? '-' }}</dd>
                </div>
                <div class="detail-list__row">
                  <dt>Ruta</dt>
                  <dd>{{ workOrder.route?.name ?? workOrder.route_id ?? '-' }}</dd>
                </div>
              </dl>
            </div>

            <div class="detail-strip__section">
              <div class="detail-strip__title">Fechas</div>
              <dl class="detail-list">
                <div class="detail-list__row">
                  <dt>Programada</dt>
                  <dd>{{ formatDate(workOrder.scheduled_at) }}</dd>
                </div>
                <div class="detail-list__row">
                  <dt>Solicitada</dt>
                  <dd>{{ formatDate(workOrder.requested_at) }}</dd>
                </div>
                <div class="detail-list__row">
                  <dt>Vencimiento</dt>
                  <dd>{{ formatDate(workOrder.due_at) }}</dd>
                </div>
                <div class="detail-list__row">
                  <dt>Completada</dt>
                  <dd>{{ formatDate(workOrder.completed_at) }}</dd>
                </div>
                <div class="detail-list__row">
                  <dt>Barrio</dt>
                  <dd>{{ workOrder.neighborhood ?? '-' }}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div class="status-panel status-panel--wide">
            <div class="status-panel__title">Estatus</div>
            <div class="status-traffic status-traffic--vertical">
              <div
                v-for="(step, index) in statusSteps"
                :key="step.key"
                class="status-step"
                :class="`status-step--${getStepState(index)}`"
              >
                <div class="status-step__dot" />
                <div class="status-step__label">{{ step.label }}</div>
                <div
                  v-if="index < statusSteps.length - 1"
                  class="status-step__line"
                />
              </div>
            </div>
          </div>
        </div>

        <div v-if="workOrder" class="detail-notes">
          <div class="detail-strip__title">Notas</div>
          <div class="detail-notes__content">
            {{ workOrder.notes ?? '-' }}
          </div>
        </div>

        <div v-else class="detail-empty">
          No se encontro la orden. Regresa y vuelve a cargar la lista.
        </div>

        <VExpansionPanels
          variant="accordion"
          class="detail-panels"
        >
          <VExpansionPanel elevation="0" class="detail-panel">
            <VExpansionPanelTitle>
              <div class="detail-panel__title">
                <div class="detail-panel__icon">
                  <VIcon icon="tabler-message-circle" size="18" />
                </div>
                <div>
                  <div class="detail-panel__label">Actualizar estado</div>
                  <div class="detail-panel__hint">Agrega un comentario y guarda el cambio</div>
                </div>
              </div>
            </VExpansionPanelTitle>
            <VExpansionPanelText>
              <div class="detail-section detail-section--form">
                <div class="detail-actions">
                  <VSelect
                    v-model="selectedStatus"
                    :items="statusOptions"
                    item-title="title"
                    item-value="value"
                    density="compact"
                    variant="outlined"
                    hide-details
                    class="detail-actions__select"
                    :loading="statusLoading"
                    :disabled="savingUpdate || statusLoading"
                  />
                </div>
                <VTextarea
                  v-model="commentText"
                  variant="outlined"
                  placeholder="Escribe un comentario"
                  rows="3"
                  class="detail-comment"
                />
                <div class="detail-actions">
                  <VBtn
                    color="primary"
                    variant="tonal"
                    :loading="savingUpdate"
                    :disabled="!commentText.trim()"
                    @click="saveStatusAndComment"
                  >
                    Guardar
                  </VBtn>
                </div>
              </div>
            </VExpansionPanelText>
          </VExpansionPanel>

          <VExpansionPanel elevation="0" class="detail-panel">
            <VExpansionPanelTitle>
              <div class="detail-panel__title">
                <div class="detail-panel__icon">
                  <VIcon icon="tabler-user-check" size="18" />
                </div>
                <div>
                  <div class="detail-panel__label">Cambiar asignación</div>
                  <div class="detail-panel__hint">Selecciona un nuevo operador</div>
                </div>
              </div>
            </VExpansionPanelTitle>
            <VExpansionPanelText>
              <div class="detail-section detail-section--form">
                <div class="detail-actions">
                  <VSelect
                    v-model="selectedWorkerId"
                    :items="workerOptions"
                    item-title="title"
                    item-value="value"
                    label="Asignado a"
                    density="compact"
                    variant="outlined"
                    hide-details
                    :loading="workersLoading"
                    :disabled="workersLoading || savingAssignment"
                    class="detail-actions__select"
                  />
                  <div class="detail-actions__hint">
                    <VChip color="primary" variant="tonal" size="small">
                      Actual: {{ currentWorkerName }}
                    </VChip>
                  </div>
                  <VBtn
                    color="primary"
                    variant="tonal"
                    :loading="savingAssignment"
                    :disabled="!selectedWorkerId"
                    @click="saveAssignment"
                  >
                    Guardar
                  </VBtn>
                </div>
              </div>
            </VExpansionPanelText>
          </VExpansionPanel>

          <VExpansionPanel elevation="0" class="detail-panel">
            <VExpansionPanelTitle>
              <div class="detail-panel__title">
                <div class="detail-panel__icon">
                  <VIcon icon="tabler-notes" size="18" />
                </div>
                <div>
                  <div class="detail-panel__label">Actualizar notas</div>
                  <div class="detail-panel__hint">Edita la descripción interna</div>
                </div>
              </div>
            </VExpansionPanelTitle>
            <VExpansionPanelText>
              <div class="detail-section detail-section--form">
                <VTextarea
                  v-model="notesText"
                  variant="outlined"
                  placeholder="Notas de la orden"
                  rows="3"
                  class="detail-comment"
                />
                <div class="detail-actions">
                  <VBtn
                    color="primary"
                    variant="tonal"
                    :loading="savingUpdate"
                    @click="saveNotes"
                  >
                    Guardar
                  </VBtn>
                </div>
              </div>
            </VExpansionPanelText>
          </VExpansionPanel>
        </VExpansionPanels>

        <div class="detail-section detail-section--history">
          <div class="detail-section__title">Historial</div>
          <BaseDataTable
            :headers="historyHeaders"
            :items="historyRows"
            :meta="historyPagination"
            :loading="historiesLoading"
            :items-per-page-options="[10, 15, 25]"
            empty-state-title="Sin historial"
            empty-state-description="No hay eventos registrados."
            empty-state-icon="tabler-history"
            @update:options="handleHistoryOptions"
          />
        </div>

        <div class="detail-section">
          <div class="detail-section__title">Fotos</div>
          <div v-if="photosLoading" class="detail-empty">Cargando fotos...</div>
          <div v-else-if="!photoItems.length" class="detail-empty">Sin fotos disponibles.</div>
          <div v-else class="photo-grid">
            <VCard
              v-for="(photo, index) in photoItems"
              :key="photo.id"
              class="photo-card"
              @click="openPhotos(index)"
            >
              <VImg :src="photo.src" :alt="photo.title" cover />
            </VCard>
          </div>
        </div>
      </VCardText>
    </VCard>

    <VDialog v-model="photosDialog" max-width="820">
      <VCard>
        <VCardTitle class="photo-modal__title">
          Fotos de la orden
          <VSpacer />
          <VBtn icon="tabler-x" variant="text" @click="photosDialog = false" />
        </VCardTitle>
        <VCardText>
          <VCarousel
            v-if="photoItems.length"
            v-model="activePhoto"
            hide-delimiter-background
            show-arrows="hover"
            height="440"
          >
            <VCarouselItem
              v-for="photo in photoItems"
              :key="photo.id"
            >
              <div class="photo-slide">
                <VImg :src="photo.src" :alt="photo.title" cover />
              </div>
            </VCarouselItem>
          </VCarousel>
        </VCardText>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped lang="scss">
.workorder-detail {
  inline-size: 100%;
  padding-block: 12px 32px;
}

.detail-card {
  border-radius: 16px;
  box-shadow: 0 16px 32px rgba(15, 23, 42, 0.12);
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.9) 0%, #ffffff 45%);
}

.detail-header {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 16px;
}

.detail-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  inline-size: 100%;
  padding: 18px 20px;
  border-radius: 16px;
  background: #e8f1ff;
  border: 1px solid rgba(59, 130, 246, 0.25);
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08);
}

.detail-hero__main {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-hero__eyebrow {
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #64748b;
  font-weight: 700;
}

.detail-hero__title {
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
}

.detail-hero__meta {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 12px;
  color: #64748b;
}

.detail-hero__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-hero__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.detail-top {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px;
  gap: 20px;
  align-items: start;
}

.detail-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  padding: 16px;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.25);
}

.detail-strip__section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-strip__title {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #64748b;
}

.detail-list {
  display: grid;
  gap: 10px;
  margin: 0;
}

.detail-list__row {
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 12px;
  align-items: baseline;
  padding-block-end: 8px;
  border-bottom: 1px dashed rgba(148, 163, 184, 0.3);
}

.detail-list__row:last-child {
  border-bottom: none;
  padding-block-end: 0;
}

.detail-list__row dt {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
}

.detail-list__row dd {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
}

.detail-notes {
  margin-block-start: 16px;
  padding: 16px;
  border-radius: 14px;
  background: #ffffff;
  border: 1px solid rgba(148, 163, 184, 0.25);
}

.detail-notes__content {
  font-size: 14px;
  color: #0f172a;
  margin-block-start: 8px;
}

.priority--high {
  border-bottom: 1px dashed rgba(239, 68, 68, 0.35);
}

.priority--medium {
  border-bottom: 1px dashed rgba(245, 158, 11, 0.35);
}

.priority--low {
  border-bottom: 1px dashed rgba(34, 197, 94, 0.35);
}

.priority--default {
  border-bottom: 1px dashed rgba(148, 163, 184, 0.3);
}

.priority-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.priority-badge__dot {
  inline-size: 8px;
  block-size: 8px;
  border-radius: 50%;
  background: currentColor;
}

.priority-badge--high {
  color: #b91c1c;
  background: rgba(239, 68, 68, 0.12);
}

.priority-badge--medium {
  color: #b45309;
  background: rgba(245, 158, 11, 0.12);
}

.priority-badge--low {
  color: #15803d;
  background: rgba(34, 197, 94, 0.12);
}

.priority-badge--default {
  color: #475569;
  background: rgba(148, 163, 184, 0.16);
}

.detail-label {
  font-size: 12px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.detail-value {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
}

.detail-empty {
  font-size: 14px;
  color: #94a3b8;
  margin-block: 12px;
}

.detail-section {
  margin-block-start: 20px;
  padding: 16px;
  border-radius: 14px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #ffffff;
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.08);
}

.detail-section--form {
  background: #f8fafc;
  border: 1px solid rgba(59, 130, 246, 0.15);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
  position: relative;
}

.detail-section--form::before {
  content: '';
  position: absolute;
  inset-block: 16px;
  inset-inline-start: 0;
  width: 3px;
  border-radius: 999px;
  background: #2563eb;
}

.detail-section--form .detail-section__title {
  padding-inline-start: 8px;
}

.detail-panels {
  margin-block-start: 20px;
  display: grid;
  gap: 12px;
  inline-size: 100%;
  grid-template-columns: repeat(3, minmax(220px, 1fr));
  align-items: start;
}

.detail-panel {
  border-radius: 14px;
  border: 1px solid rgba(59, 130, 246, 0.15);
  background: #ffffff;
  box-shadow: 0 8px 16px rgba(15, 23, 42, 0.06);
  overflow: hidden;
}

.detail-panel__title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-panel__icon {
  inline-size: 36px;
  block-size: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e0ecff;
  color: #2563eb;
}

.detail-panel__label {
  font-weight: 700;
  color: #1f2937;
}

.detail-panel__hint {
  font-size: 12px;
  color: #94a3b8;
}

.detail-panel :global(.v-expansion-panel-title) {
  padding-block: 16px;
  padding-inline: 16px;
}

.detail-panel :global(.v-expansion-panel-text__wrapper) {
  padding-top: 0;
}

.detail-panel :global(.v-expansion-panel-title__overlay) {
  opacity: 0.06;
}

.detail-panel :global(.v-expansion-panel-title:hover) {
  background: rgba(37, 99, 235, 0.04);
}

.detail-section--history {
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.detail-section--history :global(.v-table) {
  border-radius: 12px;
  overflow: hidden;
  background: #ffffff;
}

.detail-section--history :global(th) {
  font-weight: 700;
  color: #64748b;
}

.detail-section--history :global(tbody tr:hover) {
  background: rgba(37, 99, 235, 0.04);
}

.detail-section__title {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  margin-block-end: 12px;
}

.status-panel {
  border-radius: 16px;
  padding: 14px 12px;
  background: linear-gradient(160deg, rgba(226, 232, 240, 0.6), #ffffff 60%);
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.12);
}

.status-panel--wide {
  padding: 18px 16px;
}

.status-panel__title {
  font-size: 12px;
  font-weight: 700;
  color: #1f2937;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-block-end: 12px;
  text-align: center;
}

.status-traffic {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  align-items: center;
}

.status-traffic--vertical {
  flex-direction: column;
  gap: 14px;
  align-items: flex-start;
}

.status-step {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding-inline-end: 0;
}

.status-step__dot {
  inline-size: 12px;
  block-size: 12px;
  border-radius: 50%;
  background: #475569;
  border: 2px solid #1e293b;
  box-shadow: inset 0 0 0 2px rgba(15, 23, 42, 0.25);
}

.status-step__label {
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  white-space: nowrap;
}

.status-step__line {
  inline-size: 2px;
  block-size: 16px;
  background: #1e293b;
  margin-inline-start: 5px;
}


.status-step--active .status-step__dot {
  background: #22c55e;
  border-color: #22c55e;
  box-shadow: 0 0 10px rgba(34, 197, 94, 0.6);
}

.status-step--active .status-step__label {
  color: #22c55e;
  font-weight: 700;
}

@media (max-width: 1100px) {
  .detail-top {
    grid-template-columns: 1fr;
  }

  .status-panel {
    max-inline-size: 320px;
  }

  .detail-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .detail-hero__actions {
    inline-size: 100%;
    justify-content: flex-start;
  }

  .detail-list__row {
    grid-template-columns: 1fr;
    gap: 4px;
  }

  .detail-panels {
    grid-template-columns: 1fr;
  }
}

.detail-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-block-start: 8px;
}

.detail-actions__select {
  min-inline-size: 200px;
}

.detail-comment {
  margin-block-start: 12px;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}

.photo-card {
  overflow: hidden;
  border-radius: 12px;
  cursor: pointer;
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.12);
}

.photo-modal__title {
  display: flex;
  align-items: center;
  font-weight: 700;
}

.photo-slide {
  display: flex;
  align-items: center;
  justify-content: center;
  block-size: 100%;
  border-radius: 12px;
  overflow: hidden;
  background: #f8fafc;
}
</style>
