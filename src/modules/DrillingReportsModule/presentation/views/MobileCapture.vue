<script setup lang="ts">
/**
 * Captura de hojas desde el celular, pensada para la mina: pocos toques, la foto se revisa ahí mismo
 * (borrosa, oscura, chica) y se guarda en el teléfono hasta que hay señal. Si la foto trae la etiqueta QR
 * del pozo, el pozo se elige solo.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { AiImportStatus } from '../../infrastructure/api/services/AiCaptureApiService'
import { AiCaptureApiService } from '../../infrastructure/api/services/AiCaptureApiService'
import { DrillingReportApiService } from '../../infrastructure/api/services/DrillingReportApiService'
import type { QueuedPhoto } from '../../infrastructure/persistence/captureQueue'
import { captureQueue } from '../../infrastructure/persistence/captureQueue'
import type { PhotoQuality } from '../../shared/utils/photoQualityUtils'
import { QUALITY_MESSAGES, assessQuality, readPixels } from '../../shared/utils/photoQualityUtils'
import { prepareSheetPhotos } from '../../shared/utils/sheetPhotoUtils'
import { findWellIdInPhoto } from '../../shared/utils/wellQrUtils'

interface Option { title: string; value: string }
interface Review { file: File; preview: string; quality: PhotoQuality; wellId: string; fromQr: boolean }

const STORAGE = { project: 'simo-capture-project', well: 'simo-capture-well' }
const remembered = (key: string) => { try { return localStorage.getItem(key) } catch { return null } }
const remember = (key: string, value: string | null) => { try { value ? localStorage.setItem(key, value) : localStorage.removeItem(key) } catch {} }

const projects = ref<Option[]>([])
const wells = ref<Option[]>([])
const projectId = ref<string | null>(remembered(STORAGE.project))
const wellId = ref<string | null>(remembered(STORAGE.well))
const online = ref(typeof navigator === 'undefined' ? true : navigator.onLine)
const queue = ref<QueuedPhoto[]>([])
const aiStatus = ref<Record<string, AiImportStatus>>({})
const reviewing = ref<Review | null>(null)
const processing = ref(false)
const error = ref<string | null>(null)
const cameraInput = ref<HTMLInputElement | null>(null)
const galleryInput = ref<HTMLInputElement | null>(null)
const previews = new Map<string, string>()
let timer: ReturnType<typeof setInterval> | null = null

/** Pozo '' = automático: cada hoja se ubica por el número de pozo escrito (o por su etiqueta QR). */
const AUTO_WELL = ''
const canCapture = computed(() => !!projectId.value && wellId.value !== null)
const wellName = (id: string) => id === AUTO_WELL ? 'Pozo según la hoja' : wells.value.find(w => w.value === id)?.title ?? 'Pozo'

async function loadProjects() {
  const response = await DrillingReportApiService.getProjects({ per_page: 100 })

  projects.value = (response?.data ?? []).filter((p: any) => !p.status || p.status === 'active')
    .map((p: any) => ({ title: p.project_name ?? p.name ?? p.project_code, value: p.id }))
  if (projectId.value && !projects.value.some(p => p.value === projectId.value))
    projectId.value = null
  if (!projectId.value && projects.value.length === 1)
    projectId.value = projects.value[0].value
}

async function loadWells() {
  wells.value = []
  if (!projectId.value)
    return
  const response = await DrillingReportApiService.getWellsByProject(projectId.value)

  // Los pozos en stand-by, terminados o abandonados no reciben reportes
  const receiving = (response?.data ?? response ?? [])
    .filter((w: any) => w.accepts_reports !== false)
    .map((w: any) => ({ title: w.well_number ?? w.name ?? w.well_name, value: w.id }))

  wells.value = receiving.length > 1 ? [{ title: 'Automático (según la hoja)', value: AUTO_WELL }, ...receiving] : receiving
  if (!wells.value.some(w => w.value === wellId.value))
    wellId.value = wells.value[0]?.value ?? null
}

watch(projectId, async value => {
  remember(STORAGE.project, value)
  await loadWells()
})
watch(wellId, value => remember(STORAGE.well, value))

function previewOf(photo: QueuedPhoto) {
  if (!previews.has(photo.id))
    previews.set(photo.id, URL.createObjectURL(photo.blob))

  return previews.get(photo.id)
}

async function refreshQueue() {
  queue.value = await captureQueue.list()
  const ids = queue.value.filter(p => p.importId && !['completed', 'failed'].includes(aiStatus.value[p.importId] ?? '')).map(p => p.importId!)
  if (ids.length && online.value) {
    const imports = await AiCaptureApiService.list({ ids }).catch(() => [])

    imports.forEach(item => { aiStatus.value[item.id] = item.status })
  }
}

async function sync() {
  if (online.value) {
    await captureQueue.uploadPending().catch(() => 0)
  }
  await refreshQueue()
}

/** Revisa la foto antes de guardarla: calidad y QR del pozo. */
async function onPhotos(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])

  input.value = ''
  if (!files.length || !canCapture.value)
    return
  processing.value = true
  error.value = null
  try {
    for (const file of await prepareSheetPhotos(files)) {
      const { pixels, originalLongEdge } = await readPixels(file)
      const quality = assessQuality(pixels, originalLongEdge)
      const qrWell = await findWellIdInPhoto(file)
      const fromQr = !!qrWell && wells.value.some(w => w.value === qrWell)
      const review: Review = { file, preview: URL.createObjectURL(file), quality, wellId: fromQr ? qrWell! : wellId.value!, fromQr }
      if (quality.ok)
        await keep(review)
      else
        reviewing.value = review
    }
  }
  catch (err: any) {
    error.value = err?.message || 'No se pudo leer la foto'
  }
  finally {
    processing.value = false
  }
}

async function keep(review: Review) {
  await captureQueue.add({ projectId: projectId.value!, wellId: review.wellId, name: review.file.name, blob: review.file })
  URL.revokeObjectURL(review.preview)
  reviewing.value = null
  await sync()
}

function retake() {
  if (reviewing.value)
    URL.revokeObjectURL(reviewing.value.preview)
  reviewing.value = null
  cameraInput.value?.click()
}

async function removeFromQueue(photo: QueuedPhoto) {
  await captureQueue.remove(photo.id)
  URL.revokeObjectURL(previews.get(photo.id) ?? '')
  previews.delete(photo.id)
  await refreshQueue()
}

const STATUS: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: 'Guardada en el teléfono', color: 'secondary', icon: 'tabler-device-mobile' },
  uploading: { label: 'Subiendo…', color: 'info', icon: 'tabler-upload' },
  failed: { label: 'No se pudo subir: se reintentará', color: 'warning', icon: 'tabler-alert-triangle' },
  uploaded: { label: 'Subida: la IA la está leyendo', color: 'info', icon: 'tabler-sparkles' },
  completed: { label: 'Lista para revisar', color: 'success', icon: 'tabler-circle-check' },
  aiFailed: { label: 'La IA no pudo leerla', color: 'error', icon: 'tabler-circle-x' },
}
const statusOf = (photo: QueuedPhoto) => {
  if (photo.status !== 'uploaded' || !photo.importId)
    return STATUS[photo.status]
  const ai = aiStatus.value[photo.importId]

  return ai === 'completed' ? STATUS.completed : ai === 'failed' ? STATUS.aiFailed : STATUS.uploaded
}

const setOnline = () => { online.value = true; sync() }
const setOffline = () => { online.value = false }

onMounted(async () => {
  window.addEventListener('online', setOnline)
  window.addEventListener('offline', setOffline)
  await captureQueue.prune().catch(() => {})
  await Promise.all([loadProjects().catch(() => {}), sync()])
  if (projectId.value)
    await loadWells().catch(() => {})
  timer = setInterval(sync, 15000)
})

onBeforeUnmount(() => {
  window.removeEventListener('online', setOnline)
  window.removeEventListener('offline', setOffline)
  if (timer)
    clearInterval(timer)
  previews.forEach(url => URL.revokeObjectURL(url))
})
</script>

<template>
  <div class="mobile-capture mx-auto">
    <div class="d-flex align-center justify-space-between mb-4">
      <h4 class="text-h5 mb-0">
        Capturar hojas
      </h4>
      <VChip
        :color="online ? 'success' : 'warning'"
        :prepend-icon="online ? 'tabler-wifi' : 'tabler-wifi-off'"
        size="small"
      >
        {{ online ? 'Con señal' : 'Sin señal' }}
      </VChip>
    </div>

    <VAlert
      v-if="!online"
      type="info"
      variant="tonal"
      density="compact"
      class="mb-4"
    >
      Puedes seguir tomando fotos: se guardan en el teléfono y se suben solas cuando haya señal.
    </VAlert>

    <VCard class="pa-4 mb-4">
      <VSelect
        v-model="projectId"
        :items="projects"
        label="Proyecto"
        class="mb-3"
        hide-details
      />
      <VSelect
        v-model="wellId"
        :items="wells"
        label="Pozo"
        :disabled="!projectId"
        hint="En automático, cada hoja va al pozo que trae escrito (o al de su etiqueta QR)"
        persistent-hint
      />
    </VCard>

    <div class="d-flex flex-column gap-3 mb-6">
      <VBtn
        size="x-large"
        color="primary"
        prepend-icon="tabler-camera"
        :disabled="!canCapture"
        :loading="processing"
        block
        @click="cameraInput?.click()"
      >
        Tomar foto de la hoja
      </VBtn>
      <VBtn
        variant="tonal"
        prepend-icon="tabler-photo"
        :disabled="!canCapture || processing"
        block
        @click="galleryInput?.click()"
      >
        Elegir de la galería
      </VBtn>
      <p class="text-caption text-medium-emphasis text-center mb-0">
        Toma la hoja completa, de frente, con buena luz y sin sombras. Una foto por hoja.
      </p>
      <input
        ref="cameraInput"
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        @change="onPhotos"
      >
      <input
        ref="galleryInput"
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        hidden
        @change="onPhotos"
      >
    </div>

    <VAlert
      v-if="error"
      type="error"
      variant="tonal"
      class="mb-4"
      closable
    >
      {{ error }}
    </VAlert>

    <h6
      v-if="queue.length"
      class="text-subtitle-1 mb-2"
    >
      Hojas capturadas
    </h6>
    <VCard
      v-for="photo in queue"
      :key="photo.id"
      class="d-flex align-center gap-3 pa-3 mb-2"
    >
      <img
        :src="previewOf(photo)"
        alt=""
        class="thumb"
      >
      <div class="flex-grow-1">
        <div class="text-body-2 font-weight-medium">
          {{ wellName(photo.wellId) }}
        </div>
        <VChip
          size="small"
          :color="statusOf(photo).color"
          :prepend-icon="statusOf(photo).icon"
          variant="tonal"
        >
          {{ statusOf(photo).label }}
        </VChip>
        <div
          v-if="photo.status === 'failed' && photo.error"
          class="text-caption text-medium-emphasis"
        >
          {{ photo.error }}
        </div>
      </div>
      <VBtn
        v-if="photo.status !== 'uploading'"
        icon="tabler-trash"
        variant="text"
        size="small"
        :aria-label="photo.status === 'uploaded' ? 'Quitar de la lista' : 'Descartar foto'"
        @click="removeFromQueue(photo)"
      />
    </VCard>
    <VBtn
      v-if="queue.some(p => p.status === 'uploaded' && aiStatus[p.importId ?? ''] === 'completed')"
      variant="text"
      block
      prepend-icon="tabler-checklist"
      :to="{ name: 'drilling-projects-detail', params: { id: projectId }, query: { tab: 'review' } }"
    >
      Ver en la bandeja de revisión
    </VBtn>

    <VDialog
      :model-value="!!reviewing"
      max-width="520"
      persistent
    >
      <VCard v-if="reviewing">
        <VImg
          :src="reviewing.preview"
          max-height="320"
          cover
        />
        <VCardText>
          <p class="text-subtitle-1 font-weight-medium mb-2">
            Revisa la foto antes de guardarla
          </p>
          <VAlert
            v-for="issue in reviewing.quality.issues"
            :key="issue"
            type="warning"
            variant="tonal"
            density="compact"
            class="mb-2"
          >
            {{ QUALITY_MESSAGES[issue] }}
          </VAlert>
        </VCardText>
        <VCardActions class="px-4 pb-4">
          <VBtn
            variant="text"
            @click="keep(reviewing)"
          >
            Usar así
          </VBtn>
          <VSpacer />
          <VBtn
            color="primary"
            variant="elevated"
            prepend-icon="tabler-camera-rotate"
            @click="retake"
          >
            Repetir foto
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
.mobile-capture { max-inline-size: 560px; }
.thumb { block-size: 56px; border-radius: 6px; inline-size: 56px; object-fit: cover; }
</style>
