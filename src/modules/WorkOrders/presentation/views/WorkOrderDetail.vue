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

const statusOptions = [
  'Pendiente',
  'En proceso',
  'En revision',
  'Completado',
  'Cerrado',
]
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

  const workerId = match?.id ?? match?.worker_id ?? match?.worker?.id

  return workerId ? String(workerId) : null
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
    author: item.changed_by_worker?.name ?? item.changed_by_user?.name ?? item.changed_by ?? item.author ?? item.user_name ?? item.created_by ?? '-',
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

const normalizeStatus = (value?: string) => {
  const normalized = String(value || '').toLowerCase()

  if (normalized.includes('creat'))
    return 'created'
  if (normalized.includes('pend'))
    return 'pending'
  if (normalized.includes('proceso') || normalized.includes('progress'))
    return 'in_progress'
  if (normalized.includes('revision') || normalized.includes('review'))
    return 'in_review'
  if (normalized.includes('complet'))
    return 'completed'
  if (normalized.includes('cerrad') || normalized.includes('closed'))
    return 'closed'

  return normalized
}

const getPriorityColor = (value: string) => {
  const normalized = String(value || '').toLowerCase()

  if (normalized.includes('high'))
    return 'priority--high'

  if (normalized.includes('medium'))
    return 'priority--medium'

  if (normalized.includes('low'))
    return 'priority--low'

  return 'priority--default'
}

const currentStepIndex = computed(() => {
  const key = normalizeStatus(workOrder.value?.status)

  return statusSteps.findIndex(step => step.key === key)
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
    const userId = getUserData.value?.id ?? getUserData.value?.name ?? undefined
    const workerId = await resolveWorkerId(userId)
    if (userId && !workerId) {
      showError('Usuario no tiene activado para hacer cambios.')
      return
    }
    const changedBy = workerId ?? userId
    const changedAt = new Date().toISOString()

    if (statusValue)
      await apiService.update(workOrderId.value, { status: statusValue, work_order_id: workOrderId.value, changed_by: changedBy, changed_at: changedAt })

    await apiService.addHistory({
      workorder_id: workOrderId.value,
      work_order_id: workOrderId.value,
      notes: commentText.value.trim(),
      status: statusValue,
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
      status: workOrder.value?.status ?? undefined,
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

    await apiService.update(workOrderId.value, {
      work_order_id: workOrderId.value,
      worker_id: selectedWorkerId.value,
      assigned_to: selectedWorkerId.value,
    })

    await apiService.addHistory({
      workorder_id: workOrderId.value,
      work_order_id: workOrderId.value,
      notes: `Cambio de asignación: ${previousWorker} -> ${nextWorker}`,
      status: workOrder.value?.status ?? undefined,
      company_id: companyId.value || undefined,
      changed_by: workerId ?? userId,
      changed_at: new Date().toISOString(),
    })

    await loadWorkOrder()
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
  if (value?.status)
    selectedStatus.value = value.status
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
})
</script>

<template>
  <div class="workorder-detail">
    <VCard class="detail-card">
      <VCardText>
        <div class="detail-header">
          <div>
            <div class="detail-title">Detalle de orden</div>
            <div class="detail-subtitle">ID: {{ workOrderId }}</div>
          </div>
          <div class="detail-actions detail-actions--header">
            <VBtn variant="tonal" color="primary" prepend-icon="tabler-camera" @click="openPhotos(0)">
              Ver fotos
            </VBtn>
            <VBtn variant="tonal" color="secondary" prepend-icon="tabler-arrow-left" @click="goBack">
              Regresar
            </VBtn>
          </div>
        </div>

        <VDivider class="my-4" />

        <div v-if="workOrder" class="detail-top">
          <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Folio</span>
            <span class="detail-value">
              {{ workOrder.local_id ?? workOrder.folio ?? workOrder.external_id ?? workOrder.code ?? workOrder.id ?? '-' }}
            </span>
          </div>
            <div class="detail-item">
              <span class="detail-label">Tipo</span>
              <span class="detail-value">
                {{ workOrder.type ?? workOrder.type_catalog?.name ?? workOrder.work_order_type_id ?? '-' }}
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Estado</span>
              <span class="detail-value">
                {{ workOrder.status ?? '-' }}
              </span>
            </div>
            <div class="detail-item" :class="getPriorityColor(workOrder.priority ?? workOrder.severity ?? workOrder.priority_code ?? '')">
              <span class="detail-label">Prioridad</span>
              <span class="detail-value">
                {{ workOrder.priority ?? workOrder.severity ?? workOrder.priority_code ?? '-' }}
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Contrato</span>
              <span class="detail-value">
                {{ workOrder.contract_number ?? workOrder.contract?.contract_number ?? workOrder.contract_id ?? '-' }}
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Usuario</span>
              <span class="detail-value">
                {{ workOrder.user_name ?? workOrder.contract?.user_name ?? '-' }}
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Programada</span>
              <span class="detail-value">
                {{ formatDate(workOrder.scheduled_at) }}
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Solicitada</span>
              <span class="detail-value">
                {{ formatDate(workOrder.requested_at) }}
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Vencimiento</span>
              <span class="detail-value">
                {{ formatDate(workOrder.due_at) }}
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Completada</span>
              <span class="detail-value">
                {{ formatDate(workOrder.completed_at) }}
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Barrio</span>
              <span class="detail-value">
                {{ workOrder.neighborhood ?? '-' }}
              </span>
            </div>
          <div class="detail-item">
            <span class="detail-label">Asignado a</span>
            <span class="detail-value">
              {{ workOrder.worker?.name ?? workOrder.assigned_to ?? workOrder.worker_id ?? '-' }}
            </span>
          </div>
            <div class="detail-item">
              <span class="detail-label">Sistema</span>
              <span class="detail-value">
                {{ workOrder.system?.name ?? workOrder.system_id ?? '-' }}
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Sector</span>
              <span class="detail-value">
                {{ workOrder.sector?.name ?? workOrder.sector_id ?? '-' }}
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Ruta</span>
              <span class="detail-value">
                {{ workOrder.route?.name ?? workOrder.route_id ?? '-' }}
              </span>
            </div>
            <div class="detail-item detail-item--full">
              <span class="detail-label">Notas</span>
              <span class="detail-value">
                {{ workOrder.notes ?? '-' }}
              </span>
            </div>
          </div>

          <div class="status-panel">
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

        <div v-else class="detail-empty">
          No se encontro la orden. Regresa y vuelve a cargar la lista.
        </div>

        <div class="detail-section">
          <div class="detail-section__title">Actualizar estado y comentario</div>
          <div class="detail-actions">
            <VSelect
              v-model="selectedStatus"
              :items="statusOptions"
              density="compact"
              variant="outlined"
              hide-details
              class="detail-actions__select"
              :disabled="savingUpdate"
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

        <div class="detail-section">
          <div class="detail-section__title">Cambiar asignación</div>
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

        <div class="detail-section">
          <div class="detail-section__title">Actualizar notas</div>
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

        <div class="detail-section">
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
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.12);
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.detail-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

.detail-subtitle {
  font-size: 13px;
  color: #94a3b8;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.detail-top {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px;
  gap: 20px;
  align-items: start;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #ffffff;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.08);
}

.detail-item--full {
  grid-column: 1 / -1;
}

.priority--high {
  border-color: rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.08);
}

.priority--medium {
  border-color: rgba(245, 158, 11, 0.3);
  background: rgba(245, 158, 11, 0.08);
}

.priority--low {
  border-color: rgba(34, 197, 94, 0.3);
  background: rgba(34, 197, 94, 0.08);
}

.priority--default {
  border-color: rgba(148, 163, 184, 0.3);
  background: rgba(148, 163, 184, 0.08);
}

.detail-label {
  font-size: 12px;
  color: #64748b;
}

.detail-value {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.detail-empty {
  font-size: 14px;
  color: #94a3b8;
  margin-block: 12px;
}

.detail-section {
  margin-block-start: 20px;
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
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.1);
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
}

.detail-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-block-start: 8px;
}

.detail-actions--header {
  margin-block-start: 0;
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
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.1);
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
