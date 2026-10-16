<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { AiImport, AiImportSteel, AiImportStep } from '../../../infrastructure/api/services/AiCaptureApiService'
import { AiCaptureApiService } from '../../../infrastructure/api/services/AiCaptureApiService'

export interface AiCapturePhotoPanelProps {
  aiImport: AiImport
}

const props = defineProps<AiCapturePhotoPanelProps>()

const emit = defineEmits<{
  'goToStep': [step: string]
}>()

/** Paso del asistente (valor de REPORT_WIZARD_STEPS) para cada sección de advertencias. */
const STEPS: Record<AiImportStep, { value: string; title: string }> = {
  basic: { value: '1', title: 'Información básica' },
  personnel: { value: '2', title: 'Personal' },
  activities: { value: '3', title: 'Actividades' },
  directional: { value: '4', title: 'Mediciones direccionales' },
  consumptions: { value: '5', title: 'Consumos' },
  tools: { value: '6', title: 'Herramientas' },
  review: { value: '7', title: 'Revisión' },
}

const imageUrl = ref<string | null>(null)
const imageError = ref(false)
const zoom = ref(1)
const rotation = ref(0)
const offset = ref({ x: 0, y: 0 })
let dragStart: { x: number; y: number } | null = null

const imageStyle = computed(() => ({
  transform: `translate(${offset.value.x}px, ${offset.value.y}px) scale(${zoom.value}) rotate(${rotation.value}deg)`,
}))

async function loadImage(importId: string) {
  releaseImage()
  imageError.value = false
  try {
    imageUrl.value = URL.createObjectURL(await AiCaptureApiService.image(importId))
  }
  catch (err) {
    console.error('No se pudo cargar la foto de la hoja:', err)
    imageError.value = true
  }
}

function releaseImage() {
  if (imageUrl.value)
    URL.revokeObjectURL(imageUrl.value)
  imageUrl.value = null
}

function setZoom(value: number) {
  zoom.value = Math.min(6, Math.max(0.5, value))
}

function resetView() {
  zoom.value = 1
  rotation.value = 0
  offset.value = { x: 0, y: 0 }
}

function onWheel(event: WheelEvent) {
  setZoom(zoom.value * (event.deltaY < 0 ? 1.15 : 1 / 1.15))
}

function onPointerDown(event: PointerEvent) {
  dragStart = { x: event.clientX - offset.value.x, y: event.clientY - offset.value.y };
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

function onPointerMove(event: PointerEvent) {
  if (dragStart)
    offset.value = { x: event.clientX - dragStart.x, y: event.clientY - dragStart.y }
}

function onPointerUp() {
  dragStart = null
}

const warningsByStep = computed(() => {
  const groups = new Map<AiImportStep, AiImport['warnings']>()
  for (const warning of props.aiImport.warnings) {
    const step = STEPS[warning.step] ? warning.step : 'basic'

    groups.set(step, [...(groups.get(step) ?? []), warning])
  }

  return [...groups].sort(([a], [b]) => Number(STEPS[a].value) - Number(STEPS[b].value))
})

const pendingCount = computed(() => props.aiImport.warnings.filter(warning => warning.severity === 'warning').length)
const unmapped = computed(() => props.aiImport.unmapped)

const crew = computed(() => {
  const faena = unmapped.value?.faena
  if (!faena)
    return []

  return [
    ['Operador', faena.operador],
    ['Ayudante', faena.ayudante_1],
    ['Ayudante', faena.ayudante_2],
    ['Otro', faena.otro],
    ['Equipo', faena.equipo],
  ].filter(([, value]) => !!value) as Array<[string, string]>
})

const steels = computed(() => {
  const aceros = unmapped.value?.aceros
  if (!aceros)
    return []

  return [
    ...aceros.broca.map(steel => ({ kind: 'Broca', ...steel })),
    ...aceros.tricono.map(steel => ({ kind: 'Tricono', ...steel })),
    ...aceros.escareador.map(steel => ({ kind: 'Escareador', ...steel })),
  ] as Array<AiImportSteel & { kind: string }>
})

const fmt = (value: number | null | undefined) => (value === null || value === undefined ? '—' : String(value))

watch(() => props.aiImport.id, id => {
  resetView()
  loadImage(id)
}, { immediate: true })

onBeforeUnmount(releaseImage)
</script>

<template>
  <div class="ai-capture-panel d-flex flex-column">
    <div class="d-flex align-center gap-1 pa-2">
      <VChip
        size="small"
        color="primary"
        variant="tonal"
        prepend-icon="tabler-sparkles"
      >
        Capturado con IA{{ unmapped?.folio ? ` · Folio ${unmapped.folio}` : '' }}
      </VChip>
      <VSpacer />
      <VBtn
        icon="tabler-zoom-out"
        variant="text"
        size="small"
        aria-label="Alejar"
        @click="setZoom(zoom / 1.25)"
      />
      <VBtn
        icon="tabler-zoom-in"
        variant="text"
        size="small"
        aria-label="Acercar"
        @click="setZoom(zoom * 1.25)"
      />
      <VBtn
        icon="tabler-rotate-clockwise"
        variant="text"
        size="small"
        aria-label="Girar"
        @click="rotation = (rotation + 90) % 360"
      />
      <VBtn
        icon="tabler-maximize"
        variant="text"
        size="small"
        aria-label="Restablecer vista"
        @click="resetView"
      />
    </div>

    <div
      class="ai-capture-viewport"
      @wheel.prevent="onWheel"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <img
        v-if="imageUrl"
        :src="imageUrl"
        :style="imageStyle"
        alt="Foto de la hoja de perforación"
        draggable="false"
      >
      <div
        v-else-if="imageError"
        class="text-body-2 text-medium-emphasis pa-4"
      >
        No se pudo cargar la foto.
      </div>
      <VProgressCircular
        v-else
        indeterminate
        color="primary"
      />
    </div>

    <div class="ai-capture-details pa-3">
      <VAlert
        :type="pendingCount ? 'warning' : 'success'"
        variant="tonal"
        density="compact"
        class="mb-3"
      >
        {{ pendingCount ? `${pendingCount} puntos por revisar antes de completar el reporte.` : 'La IA no marcó puntos por revisar.' }}
        Compara siempre con la foto.
      </VAlert>

      <div
        v-for="[step, warnings] in warningsByStep"
        :key="step"
        class="mb-3"
      >
        <div class="d-flex align-center justify-space-between">
          <span class="text-subtitle-2">{{ STEPS[step].title }}</span>
          <VBtn
            size="x-small"
            variant="text"
            append-icon="tabler-arrow-right"
            @click="emit('goToStep', STEPS[step].value)"
          >
            Ir al paso
          </VBtn>
        </div>
        <div
          v-for="(warning, index) in warnings"
          :key="index"
          class="d-flex gap-2 text-body-2 mt-1"
        >
          <VIcon
            :icon="warning.severity === 'warning' ? 'tabler-alert-triangle' : 'tabler-info-circle'"
            :color="warning.severity === 'warning' ? 'warning' : 'info'"
            size="16"
            class="mt-1 flex-shrink-0"
          />
          <span>{{ warning.message }}</span>
        </div>
      </div>

      <template v-if="unmapped">
        <VDivider class="my-3" />
        <p class="text-subtitle-2 mb-1">
          Lo que dice la hoja y no se cargó solo
        </p>
        <p class="text-caption text-medium-emphasis mb-2">
          Captúralo en el paso correspondiente seleccionándolo de los catálogos.
        </p>

        <div
          v-if="crew.length"
          class="mb-3"
        >
          <span class="text-caption font-weight-medium">Personal y equipo</span>
          <div class="d-flex flex-wrap gap-1 mt-1">
            <VChip
              v-for="([label, value], index) in crew"
              :key="index"
              size="small"
            >
              {{ label }}: {{ value }}
            </VChip>
          </div>
        </div>

        <div
          v-if="unmapped.perforacion?.length"
          class="mb-3"
        >
          <span class="text-caption font-weight-medium">Corridas de perforación</span>
          <VTable
            density="compact"
            class="text-caption"
          >
            <thead>
              <tr>
                <th>Desde</th>
                <th>Hasta</th>
                <th>Mts.</th>
                <th>Recup.</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(run, index) in unmapped.perforacion"
                :key="index"
              >
                <td>{{ fmt(run.desde) }}</td>
                <td>{{ fmt(run.hasta) }}</td>
                <td>{{ fmt(run.mts_perforados) }}</td>
                <td>{{ fmt(run.recuperacion) }}</td>
              </tr>
            </tbody>
          </VTable>
        </div>

        <div
          v-if="steels.length"
          class="mb-3"
        >
          <span class="text-caption font-weight-medium">Aceros (broca, tricono, escareador)</span>
          <div
            v-for="(steel, index) in steels"
            :key="index"
            class="text-body-2"
          >
            {{ steel.kind }} {{ steel.diametro ?? '' }} · serie {{ [steel.no_serie, steel.serie_color].filter(Boolean).join(' / ') || '—' }} · {{ fmt(steel.desde) }} → {{ fmt(steel.hasta) }}
            <span v-if="steel.nota">({{ steel.nota }})</span>
          </div>
        </div>

        <div
          v-if="unmapped.perforacion_notas.length"
          class="mb-3"
        >
          <span class="text-caption font-weight-medium">Notas en la tabla de perforación</span>
          <div class="text-body-2">
            {{ unmapped.perforacion_notas.join(' · ') }}
          </div>
        </div>

        <div
          v-if="unmapped.accesorios.length"
          class="mb-3"
        >
          <span class="text-caption font-weight-medium">Accesorios</span>
          <div
            v-for="(item, index) in unmapped.accesorios"
            :key="index"
            class="text-body-2"
          >
            {{ fmt(item.cantidad) }} × {{ item.observaciones || item.accesorio || '—' }}
          </div>
        </div>

        <div class="text-body-2">
          <span class="text-caption font-weight-medium">Horómetro escrito:</span>
          {{ fmt(unmapped.horometro.inicial) }} → {{ fmt(unmapped.horometro.final) }}
          <span v-if="unmapped.horometro.total_horas !== null"> (total {{ fmt(unmapped.horometro.total_horas) }})</span>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.ai-capture-panel {
  block-size: 100%;
  border-inline-end: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.ai-capture-viewport {
  position: relative;
  display: flex;
  overflow: hidden;
  align-items: center;
  justify-content: center;
  background: rgb(var(--v-theme-background));
  block-size: 46vh;
  cursor: grab;
  touch-action: none;

  img {
    max-block-size: 100%;
    max-inline-size: 100%;
    transform-origin: center;
    transition: transform 0.05s linear;
    user-select: none;
  }
}

.ai-capture-details {
  overflow-y: auto;
  flex: 1;
  max-block-size: 30vh;
}
</style>
