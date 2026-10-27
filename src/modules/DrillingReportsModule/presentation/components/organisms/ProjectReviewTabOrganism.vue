<script setup lang="ts">
/**
 * Pestaña "Por revisar": borradores y pendientes del proyecto con semáforo.
 * Verde = listo para aprobar; amarillo = hay que mirarlo; rojo = no se puede aprobar todavía.
 * "Aprobar los verdes" termina y aprueba de una vez los que están listos (el desgaste de sus aceros se aplica ahí).
 * Arriba van las hojas que la IA ya leyó pero cuyo pozo no se reconoció: al elegirlo se crea su borrador.
 */
import { computed, onMounted, ref } from 'vue'
import type { BulkApproveResult, ReviewLight, ReviewQueue, ReviewQueueEntry } from '../../../infrastructure/api/services/ReviewQueueApiService'
import { ReviewQueueApiService } from '../../../infrastructure/api/services/ReviewQueueApiService'
import type { AiImport } from '../../../infrastructure/api/services/AiCaptureApiService'
import { AiCaptureApiService } from '../../../infrastructure/api/services/AiCaptureApiService'
import { formatDate } from '../../../shared/utils/dateUtils'

const props = withDefaults(defineProps<{
  projectId: string
  /** Pozos que reciben reportes: para elegir el de una hoja sin pozo */
  wells?: Array<{ id: string; label: string }>
}>(), { wells: () => [] })

const emit = defineEmits<{
  review: [report: { id: string; well_id: string }]
  approved: []
  count: [pending: number]
}>()

const queue = ref<ReviewQueue | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const selected = ref<string[]>([])
const filter = ref<ReviewLight | 'all'>('all')
const confirmOpen = ref(false)
const approving = ref(false)
const results = ref<BulkApproveResult[] | null>(null)
const wellFilter = ref<string | null>(null)

const withoutWell = ref<AiImport[]>([])
const chosenWell = ref<Record<string, string>>({})
const assigning = ref<string | null>(null)
const wellItems = computed(() => props.wells.map(well => ({ title: well.label, value: well.id })))

async function loadWithoutWell() {
  try {
    withoutWell.value = await AiCaptureApiService.list({ projectId: props.projectId, status: 'needs_well' })
  }
  catch {
    withoutWell.value = []
  }
}

async function assignWell(item: AiImport) {
  const wellId = chosenWell.value[item.id]
  if (!wellId)
    return
  assigning.value = item.id
  error.value = null
  try {
    await AiCaptureApiService.assignWell(item.id, wellId)
    await Promise.all([load(), loadWithoutWell()])
  }
  catch (err: any) {
    error.value = err?.data?.message || err?.message || 'No se pudo asignar el pozo'
  }
  finally {
    assigning.value = null
  }
}

const LIGHTS: Record<ReviewLight, { color: string; label: string; icon: string }> = {
  green: { color: 'success', label: 'Listos para aprobar', icon: 'tabler-circle-check' },
  yellow: { color: 'warning', label: 'Con avisos', icon: 'tabler-alert-triangle' },
  red: { color: 'error', label: 'Con bloqueos', icon: 'tabler-circle-x' },
}
const SHIFTS = { day: 'Día', night: 'Noche', mixed: 'Mixto' }

const wellsInQueue = computed(() => {
  const seen = new Map<string, string>()

  ;(queue.value?.reports ?? []).forEach(r => seen.set(r.well_id, r.well_number ?? 'Pozo'))

  return [...seen].map(([value, title]) => ({ value, title }))
})
const reports = computed(() => (queue.value?.reports ?? [])
  .filter(r => filter.value === 'all' || r.light === filter.value)
  .filter(r => !wellFilter.value || r.well_id === wellFilter.value))
const greens = computed(() => (queue.value?.reports ?? []).filter(r => r.light === 'green'))
const toApprove = computed(() => (selected.value.length ? selected.value : greens.value.map(r => r.id)))

async function load() {
  loading.value = true
  error.value = null
  try {
    queue.value = await ReviewQueueApiService.get(props.projectId)
    selected.value = selected.value.filter(id => greens.value.some(r => r.id === id))
    emit('count', queue.value.reports.length)
  }
  catch (err: any) {
    error.value = err?.message || 'No se pudo cargar la bandeja'
  }
  finally {
    loading.value = false
  }
}

async function approve(ids: string[]) {
  approving.value = true
  try {
    results.value = await ReviewQueueApiService.bulkApprove(props.projectId, ids)
    selected.value = []
    emit('approved')
    await load()
  }
  catch (err: any) {
    error.value = err?.message || 'No se pudo aprobar'
  }
  finally {
    approving.value = false
    confirmOpen.value = false
  }
}

const approvedCount = computed(() => results.value?.filter(r => r.result === 'approved').length ?? 0)
const notApproved = computed(() => results.value?.filter(r => r.result !== 'approved') ?? [])

function reviewPrevious(issue: { previous_report_id?: string | null }, entry: ReviewQueueEntry) {
  if (issue.previous_report_id)
    emit('review', { id: issue.previous_report_id, well_id: entry.well_id })
}

onMounted(() => Promise.all([load(), loadWithoutWell()]))
defineExpose({ load })
</script>

<template>
  <div>
    <div class="d-flex flex-wrap align-center justify-space-between gap-4 mb-4">
      <div>
        <h6 class="text-h6 mb-1">
          Por revisar
        </h6>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Revisa solo lo marcado; lo verde está listo para aprobar.
        </p>
      </div>
      <div class="d-flex gap-2">
        <VBtn
          variant="text"
          icon="tabler-refresh"
          :loading="loading"
          aria-label="Actualizar"
          @click="load"
        />
        <VBtn
          v-if="queue?.can_approve"
          color="success"
          prepend-icon="tabler-checks"
          :disabled="!toApprove.length"
          @click="confirmOpen = true"
        >
          {{ selected.length ? `Aprobar seleccionados (${selected.length})` : `Aprobar los verdes (${greens.length})` }}
        </VBtn>
      </div>
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

    <VAlert
      v-if="results"
      :type="notApproved.length ? 'warning' : 'success'"
      variant="tonal"
      class="mb-4"
      closable
      @click:close="results = null"
    >
      Se aprobaron {{ approvedCount }} {{ approvedCount === 1 ? 'reporte' : 'reportes' }}.
      <div
        v-for="item in notApproved"
        :key="item.report_id"
        class="text-body-2"
      >
        {{ item.report_number ?? item.report_id }}: {{ item.message }}
      </div>
    </VAlert>

    <VCard
      v-if="withoutWell.length"
      variant="outlined"
      color="warning"
      class="mb-4"
    >
      <VCardTitle class="d-flex align-center gap-2 text-body-1 font-weight-medium">
        <VIcon icon="tabler-map-pin-question" />
        Hojas sin pozo ({{ withoutWell.length }})
      </VCardTitle>
      <VCardText>
        <p class="text-body-2 mb-3">
          La IA ya leyó estas hojas, pero el número de pozo no coincide con ningún pozo del proyecto. Elige el pozo y se crea el borrador.
        </p>
        <div
          v-for="item in withoutWell"
          :key="item.id"
          class="d-flex flex-wrap align-center gap-3 mb-2"
        >
          <div class="flex-grow-1">
            <div class="text-body-2 font-weight-medium">
              {{ item.original_name }}
            </div>
            <div class="text-caption text-medium-emphasis">
              La hoja dice pozo «{{ item.well_number_read || 'sin número' }}»
            </div>
          </div>
          <VSelect
            v-model="chosenWell[item.id]"
            :items="wellItems"
            label="Pozo"
            density="compact"
            hide-details
            style="max-inline-size: 260px; min-inline-size: 200px;"
          />
          <VBtn
            color="primary"
            size="small"
            :disabled="!chosenWell[item.id]"
            :loading="assigning === item.id"
            @click="assignWell(item)"
          >
            Crear borrador
          </VBtn>
        </div>
      </VCardText>
    </VCard>

    <div
      v-if="queue"
      class="d-flex flex-wrap gap-2 mb-4"
    >
      <VChip
        :variant="filter === 'all' ? 'elevated' : 'tonal'"
        @click="filter = 'all'"
      >
        Todos ({{ queue.reports.length }})
      </VChip>
      <VChip
        v-for="(light, key) in LIGHTS"
        :key="key"
        :color="light.color"
        :prepend-icon="light.icon"
        :variant="filter === key ? 'elevated' : 'tonal'"
        @click="filter = key"
      >
        {{ light.label }} ({{ queue.summary[key] }})
      </VChip>
      <VSelect
        v-if="wellsInQueue.length > 1"
        v-model="wellFilter"
        :items="wellsInQueue"
        label="Pozo"
        density="compact"
        hide-details
        clearable
        style="max-inline-size: 220px;"
      />
    </div>

    <VCard
      v-if="queue && !queue.reports.length"
      variant="tonal"
      color="success"
      class="pa-6 text-center"
    >
      <VIcon
        icon="tabler-confetti"
        size="40"
        class="mb-2"
      />
      <p class="text-h6 mb-0">
        Nada pendiente: todos los reportes están aprobados.
      </p>
    </VCard>

    <div class="d-flex flex-column gap-3">
      <VCard
        v-for="entry in reports"
        :key="entry.id"
        variant="outlined"
        :class="`review-card review-card--${entry.light}`"
      >
        <VCardText class="d-flex flex-wrap align-start gap-3">
          <VCheckbox
            v-if="queue?.can_approve"
            v-model="selected"
            :value="entry.id"
            :disabled="entry.light !== 'green'"
            hide-details
            density="compact"
            class="flex-grow-0"
            :aria-label="`Seleccionar ${entry.report_number}`"
          />
          <VIcon
            :icon="LIGHTS[entry.light].icon"
            :color="LIGHTS[entry.light].color"
            size="28"
            class="mt-1"
          />
          <div class="flex-grow-1">
            <div class="d-flex flex-wrap align-center gap-2">
              <span class="text-subtitle-1 font-weight-medium">{{ entry.report_number }}</span>
              <span class="text-body-2 text-medium-emphasis">
                {{ formatDate(entry.report_date) }} · {{ SHIFTS[entry.shift] }} · Pozo {{ entry.well_number ?? '—' }}
                <template v-if="entry.meters !== null"> · {{ entry.meters }} m</template>
                · {{ entry.hours }} h
              </span>
              <VChip
                v-if="entry.ai_import_id"
                size="x-small"
                prepend-icon="tabler-camera"
                variant="tonal"
              >
                Desde foto
              </VChip>
              <VChip
                v-if="entry.status === 'pending_approval'"
                size="x-small"
                color="info"
                variant="tonal"
              >
                Pendiente de aprobar
              </VChip>
            </div>
            <ul
              v-if="entry.issues.length"
              class="issues mt-2"
            >
              <li
                v-for="(issue, index) in entry.issues.slice(0, 4)"
                :key="index"
                :class="issue.severity === 'error' ? 'text-error' : 'text-warning'"
              >
                {{ issue.message }}
                <a
                  v-if="issue.previous_report_id"
                  href="#"
                  class="ms-1"
                  @click.prevent="reviewPrevious(issue, entry)"
                >Ver {{ issue.previous_report_number }}</a>
              </li>
              <li
                v-if="entry.issues.length > 4"
                class="text-medium-emphasis"
              >
                y {{ entry.issues.length - 4 }} más
              </li>
            </ul>
          </div>
          <div class="d-flex gap-2">
            <VBtn
              variant="tonal"
              prepend-icon="tabler-eye-check"
              @click="emit('review', { id: entry.id, well_id: entry.well_id })"
            >
              Revisar
            </VBtn>
            <VBtn
              v-if="queue?.can_approve && entry.light === 'green'"
              color="success"
              variant="elevated"
              :loading="approving && toApprove.length === 1 && toApprove[0] === entry.id"
              @click="approve([entry.id])"
            >
              Aprobar
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </div>

    <VDialog
      v-model="confirmOpen"
      max-width="480"
    >
      <VCard>
        <VCardTitle class="pa-6 pb-2">
          Aprobar {{ toApprove.length }} {{ toApprove.length === 1 ? 'reporte' : 'reportes' }}
        </VCardTitle>
        <VCardText class="px-6">
          Se terminarán y aprobarán. Al aprobar se suma el desgaste de sus aceros y se actualiza el avance del pozo.
          Si alguno no se puede aprobar, los demás sí se aprueban y te diremos por qué.
        </VCardText>
        <VCardActions class="px-6 pb-6">
          <VSpacer />
          <VBtn
            variant="text"
            @click="confirmOpen = false"
          >
            Cancelar
          </VBtn>
          <VBtn
            color="success"
            variant="elevated"
            :loading="approving"
            @click="approve(toApprove)"
          >
            Aprobar
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
.review-card--red { border-inline-start: 4px solid rgb(var(--v-theme-error)); }
.review-card--yellow { border-inline-start: 4px solid rgb(var(--v-theme-warning)); }
.review-card--green { border-inline-start: 4px solid rgb(var(--v-theme-success)); }
.issues { margin: 0; padding-inline-start: 1.1rem; }
</style>
