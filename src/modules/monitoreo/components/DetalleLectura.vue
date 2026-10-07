<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAccionesLectura } from '../composables/useAccionesLectura'
import { useDetalleLectura } from '../composables/useDetalleLectura'
import type { MotivoRelectura } from '../types/relecturas'
import { fechaCorta, haceCuanto, horaCorta } from '../utils/tiempo'
import EstadoError from '@/modules/reportes/components/comunes/EstadoError.vue'

/*
 * Panel lateral con el detalle de la lectura de una toma (sección H del cuestionario): toma, lectura (anterior,
 * actual, consumo, promedio, variación, anomalía, comentario), captura y llegada, recibo, lecturista y dispositivo,
 * GPS contra la toma, fotos (pendientes de la app), historial de 12 lecturas con mini gráfica y enlaces. Solo lectura;
 * la botonera de acciones se habilita en F2.5.
 */
const props = defineProps<{
  abierto: boolean
  contrato: number | null
  periodo: number | null
}>()

const emit = defineEmits<{
  'update:abierto': [valor: boolean]
  'verEnMapa': [centro: [number, number]]
}>()

const { t, n } = useI18n()
const router = useRouter()
const datos = useDetalleLectura()

const lectura = datos.lectura
const toma = datos.contrato
const acciones = useAccionesLectura()

const relativo = (clave: 'nunca' | 'ahora' | 'minutos' | 'horas' | 'dias', valor?: number) => t(`monitoreo.tiempo.${clave}`, { n: valor })
const MOTIVOS: MotivoRelectura[] = ['consumo_cero', 'consumo_alto', 'consumo_bajo', 'lectura_menor', 'anomalia', 'revisar', 'otro']
const motivoElegido = ref<MotivoRelectura>('revisar')
const notaRelectura = ref('')
const nuevaNota = ref('')
const puedeOperar = computed(() => datos.detalle.value?.permisos.operar ?? false)
const relectura = computed(() => datos.detalle.value?.relectura ?? null)
const sugerencias = computed(() => datos.detalle.value?.sugerencias ?? [])
const notas = computed(() => datos.detalle.value?.notas ?? [])
const opcionesMotivo = computed(() => MOTIVOS.map(m => ({ value: m, title: t(`monitoreo.lectura.motivos.${m}`) })))

async function refrescar() {
  if (props.contrato !== null)
    await datos.cargar(props.contrato, props.periodo)
}

async function pedirRelectura(motivo: MotivoRelectura) {
  const periodo = datos.detalle.value?.periodo?.id
  if (props.contrato === null || !periodo)
    return
  if (await acciones.pedir(props.contrato, periodo, motivo, notaRelectura.value.trim() || null)) {
    notaRelectura.value = ''
    await refrescar()
  }
}

async function cancelarRelectura() {
  if (relectura.value && await acciones.cancelar(relectura.value.id))
    await refrescar()
}

async function anotar() {
  if (props.contrato === null || !nuevaNota.value.trim())
    return
  if (await acciones.anotar('lectura', props.contrato, datos.detalle.value?.periodo?.id ?? null, nuevaNota.value.trim())) {
    nuevaNota.value = ''
    await refrescar()
  }
}

async function borrarNota(id: string) {
  if (await acciones.quitarNota(id))
    await refrescar()
}

async function marcarCoordenada(enDuda: boolean) {
  if (props.contrato !== null && await acciones.marcarCoordenada(props.contrato, enDuda))
    await refrescar()
}

const variacionColor = computed(() => {
  const v = lectura.value?.variacion_pct
  if (v === null || v === undefined)
    return 'secondary'

  return Math.abs(v) >= 50 ? 'error' : Math.abs(v) >= 25 ? 'warning' : 'success'
})

const retraso = computed(() => {
  const m = lectura.value?.retraso_min
  if (m === null || m === undefined)
    return '—'

  return m >= 60 ? t('monitoreo.lectura.retrasoHoras', { h: Math.floor(m / 60), m: m % 60 }) : t('monitoreo.lectura.retrasoMin', { n: m })
})

const maxConsumo = computed(() => Math.max(1, ...datos.serieConsumo.value.map(s => s.consumo)))

const urlFicha = computed(() => (toma.value ? router.resolve({ path: '/supports', query: { cuenta: toma.value.cuenta } }).href : null))

function fmt(v: number | null | undefined, decimales = 0): string {
  return v === null || v === undefined ? '—' : n(v, { maximumFractionDigits: decimales })
}

function fechaHora(valor: string | null | undefined): string {
  return valor ? `${fechaCorta(valor)} ${horaCorta(valor)}` : '—'
}

function cerrar() {
  emit('update:abierto', false)
}

function verEnMapa() {
  const g = lectura.value?.gps
  const c = toma.value?.coordenada
  const lng = g?.lng ?? (c?.lng !== null && c?.lng !== undefined ? Number(c.lng) : null)
  const lat = g?.lat ?? (c?.lat !== null && c?.lat !== undefined ? Number(c.lat) : null)
  if (lng !== null && lat !== null && Number.isFinite(lng) && Number.isFinite(lat))
    emit('verEnMapa', [lng, lat])
}

watch(() => [props.abierto, props.contrato, props.periodo] as const, ([abierto, contratoId, periodoId]) => {
  if (abierto && contratoId !== null)
    datos.cargar(contratoId, periodoId)
  else if (!abierto)
    datos.limpiar()
}, { immediate: true })
</script>

<template>
  <VNavigationDrawer
    :model-value="abierto"
    location="end"
    temporary
    :width="520"
    class="detalle-lectura"
    @update:model-value="(v: boolean) => emit('update:abierto', v)"
  >
    <div class="d-flex align-center justify-space-between px-4 pt-3 pb-2">
      <div>
        <div class="text-overline text-medium-emphasis">
          {{ t('monitoreo.lectura.titulo') }}
        </div>
        <div
          v-if="toma"
          class="text-h6"
        >
          {{ t('monitoreo.lectura.cuenta') }} {{ toma.cuenta }}
        </div>
      </div>
      <VBtn
        icon="tabler-x"
        variant="text"
        size="small"
        :aria-label="t('monitoreo.lectura.cerrar')"
        @click="cerrar"
      />
    </div>
    <VDivider />

    <VProgressLinear
      v-if="datos.cargando.value"
      indeterminate
    />

    <div
      v-if="datos.error.value && !toma"
      class="pa-4"
    >
      <VAlert
        v-if="datos.noVisible.value"
        type="warning"
        variant="tonal"
        density="compact"
      >
        {{ t('monitoreo.lectura.noVisible') }}
      </VAlert>
      <EstadoError
        v-else
        :error="datos.error.value"
        @reintentar="props.contrato !== null && datos.cargar(props.contrato, props.periodo)"
      />
    </div>

    <div
      v-else-if="toma"
      class="detalle-lectura__cuerpo px-4 pb-6"
    >
      <!-- Toma -->
      <section class="mt-3">
        <div class="font-weight-medium">
          {{ toma.nombre ?? '—' }}
        </div>
        <div class="text-body-2 text-medium-emphasis">
          {{ toma.direccion ?? '—' }}
        </div>
        <div class="d-flex flex-wrap gap-1 mt-2">
          <VChip
            v-if="toma.sector"
            size="x-small"
            label
            variant="tonal"
            prepend-icon="tabler-polygon"
          >
            {{ toma.sector }}<span v-if="toma.secuencia !== null"> · {{ t('monitoreo.lectura.secuencia', { n: toma.secuencia }) }}</span>
          </VChip>
          <VChip
            v-if="toma.gerencia"
            size="x-small"
            label
            variant="tonal"
            prepend-icon="tabler-map-pin"
          >
            {{ toma.gerencia }}
          </VChip>
          <VChip
            v-if="toma.medidor"
            size="x-small"
            label
            variant="tonal"
            prepend-icon="tabler-gauge"
          >
            {{ t('monitoreo.lectura.medidor', { n: toma.medidor }) }}
          </VChip>
          <VChip
            v-if="toma.tarifa_fija"
            size="x-small"
            label
            color="purple"
            variant="tonal"
          >
            {{ t('monitoreo.lectura.tarifaFija') }}
          </VChip>
          <VChip
            v-if="!toma.activo"
            size="x-small"
            label
            color="warning"
            variant="tonal"
          >
            {{ t('monitoreo.lectura.inactivo') }}<span v-if="toma.estatus"> · {{ toma.estatus }}</span>
          </VChip>
        </div>
      </section>

      <!-- Lectura -->
      <section class="mt-5">
        <div class="d-flex align-center justify-space-between">
          <h6 class="text-subtitle-1 font-weight-medium mb-0">
            {{ t('monitoreo.lectura.lecturaDe', { periodo: datos.detalle.value?.periodo?.nombre ?? '—' }) }}
          </h6>
          <VChip
            v-if="lectura"
            size="x-small"
            label
            :color="lectura.origen === 'promedio_automatico' ? 'info' : 'success'"
            variant="tonal"
          >
            {{ lectura.origen === 'promedio_automatico' ? t('monitoreo.lectura.origenPromedio') : t('monitoreo.lectura.origenCampo') }}
          </VChip>
        </div>

        <VAlert
          v-if="!lectura"
          type="info"
          variant="tonal"
          density="compact"
          class="mt-2"
        >
          {{ t('monitoreo.lectura.sinLectura', { periodo: datos.detalle.value?.periodo?.nombre ?? '—' }) }}
        </VAlert>

        <template v-else>
          <VRow
            dense
            class="mt-1"
          >
            <VCol cols="3">
              <div class="text-caption text-medium-emphasis">
                {{ t('monitoreo.lectura.anterior') }}
              </div>
              <div class="text-h6">
                {{ fmt(lectura.anterior) }}
              </div>
            </VCol>
            <VCol cols="3">
              <div class="text-caption text-medium-emphasis">
                {{ t('monitoreo.lectura.actual') }}
              </div>
              <div class="text-h6">
                {{ fmt(lectura.actual) }}
              </div>
            </VCol>
            <VCol cols="3">
              <div class="text-caption text-medium-emphasis">
                {{ t('monitoreo.lectura.consumo') }}
              </div>
              <div class="text-h6">
                {{ fmt(lectura.consumo) }}
              </div>
              <div
                v-if="lectura.consumo_real !== null && lectura.consumo_real !== lectura.consumo"
                class="text-caption text-medium-emphasis"
              >
                {{ t('monitoreo.lectura.consumoReal') }} {{ fmt(lectura.consumo_real) }}
              </div>
            </VCol>
            <VCol cols="3">
              <div class="text-caption text-medium-emphasis">
                {{ t('monitoreo.lectura.promedio') }}
              </div>
              <div class="text-h6">
                {{ fmt(lectura.promedio, 1) }}
              </div>
              <VChip
                v-if="lectura.variacion_pct !== null"
                size="x-small"
                label
                :color="variacionColor"
                variant="tonal"
              >
                {{ lectura.variacion_pct > 0 ? '+' : '' }}{{ n(lectura.variacion_pct, { maximumFractionDigits: 0 }) }} %
              </VChip>
              <span
                v-else
                class="text-caption text-disabled"
              >{{ t('monitoreo.lectura.variacionSinPromedio') }}</span>
            </VCol>
          </VRow>

          <div class="mt-3">
            <div class="text-caption text-medium-emphasis">
              {{ t('monitoreo.lectura.anomalia') }}
            </div>
            <div
              v-if="lectura.anomalia"
              class="d-flex flex-wrap align-center gap-1"
            >
              <VChip
                size="small"
                label
                :color="lectura.anomalia.accion_inmediata ? 'error' : 'warning'"
                variant="tonal"
              >
                <span v-if="lectura.anomalia.codigo">{{ lectura.anomalia.codigo }} · </span>{{ lectura.anomalia.etiqueta }}
              </VChip>
              <VChip
                v-if="lectura.anomalia.accion_inmediata"
                size="x-small"
                color="error"
                variant="flat"
                label
              >
                {{ t('monitoreo.lectura.accionInmediata') }}
              </VChip>
              <span
                v-if="lectura.anomalia.requiere_foto"
                class="text-caption text-medium-emphasis"
              >{{ t('monitoreo.lectura.requiereFoto') }}</span>
            </div>
            <div
              v-else
              class="text-body-2"
            >
              {{ t('monitoreo.lectura.sinAnomalia') }}
            </div>
            <div
              v-if="lectura.comentario"
              class="text-body-2 mt-1"
            >
              <span class="text-medium-emphasis">{{ t('monitoreo.lectura.comentario') }}:</span> {{ lectura.comentario }}
            </div>
          </div>
        </template>
      </section>

      <template v-if="lectura">
        <!-- Tiempos -->
        <section class="mt-5">
          <h6 class="text-subtitle-1 font-weight-medium mb-1">
            {{ t('monitoreo.lectura.tiempos') }}
          </h6>
          <VList
            density="compact"
            class="py-0 detalle-lectura__lista"
          >
            <VListItem :title="t('monitoreo.lectura.captura')">
              <template #append>
                <span class="font-weight-medium">{{ fechaHora(lectura.captura.hora) }}</span>
              </template>
            </VListItem>
            <VListItem :title="t('monitoreo.lectura.llegada')">
              <template #append>
                <span class="font-weight-medium">{{ fechaHora(lectura.llegada) }}</span>
              </template>
            </VListItem>
            <VListItem :title="t('monitoreo.lectura.retraso')">
              <template #append>
                <span
                  class="font-weight-medium"
                  :class="{ 'text-warning': (lectura.retraso_min ?? 0) > 180 }"
                >{{ retraso }}</span>
              </template>
            </VListItem>
          </VList>
          <VAlert
            v-if="!lectura.captura.confiable"
            type="warning"
            variant="tonal"
            density="compact"
            class="mt-1"
          >
            {{ t('monitoreo.lectura.capturaRespaldo') }}
          </VAlert>
        </section>

        <!-- Recibo -->
        <section class="mt-5">
          <h6 class="text-subtitle-1 font-weight-medium mb-1">
            {{ t('monitoreo.lectura.recibo') }}
          </h6>
          <div class="d-flex flex-wrap align-center gap-2">
            <VChip
              size="small"
              label
              :color="lectura.recibo.impreso === null ? 'secondary' : lectura.recibo.impreso ? 'success' : 'warning'"
              variant="tonal"
              :prepend-icon="lectura.recibo.impreso ? 'tabler-printer' : 'tabler-printer-off'"
            >
              {{ lectura.recibo.impreso === null ? t('monitoreo.lectura.impresoDesconocido') : lectura.recibo.impreso ? t('monitoreo.lectura.impreso') : t('monitoreo.lectura.noImpreso') }}
            </VChip>
            <span
              v-if="lectura.recibo.importe !== null"
              class="text-body-2"
            >{{ t('monitoreo.lectura.importe') }} <strong>{{ n(lectura.recibo.importe, { style: 'currency', currency: 'MXN' }) }}</strong></span>
            <span
              v-if="lectura.recibo.impresora"
              class="text-caption text-medium-emphasis"
            >{{ t('monitoreo.lectura.impresora', { n: lectura.recibo.impresora }) }}</span>
            <span
              v-if="lectura.recibo.factura_id"
              class="text-caption text-medium-emphasis"
            >{{ t('monitoreo.lectura.factura', { n: lectura.recibo.factura_id }) }}</span>
          </div>
        </section>

        <!-- Lecturista y dispositivo -->
        <section class="mt-5">
          <h6 class="text-subtitle-1 font-weight-medium mb-1">
            {{ t('monitoreo.lectura.lecturista') }}
          </h6>
          <div
            v-if="lectura.origen === 'promedio_automatico'"
            class="text-body-2 text-medium-emphasis"
          >
            {{ t('monitoreo.lectura.sinLecturista') }}
          </div>
          <template v-else>
            <div class="font-weight-medium">
              {{ lectura.lecturista?.nombre ?? '—' }}
            </div>
            <div
              v-if="lectura.dispositivo"
              class="d-flex flex-wrap gap-1 mt-1"
            >
              <VChip
                v-if="lectura.dispositivo.id"
                size="x-small"
                label
                variant="tonal"
                prepend-icon="tabler-device-mobile"
              >
                {{ t('monitoreo.lectura.dispositivo', { id: lectura.dispositivo.id }) }}
              </VChip>
              <VChip
                v-if="lectura.dispositivo.bateria !== null"
                size="x-small"
                label
                variant="tonal"
                :color="lectura.dispositivo.bateria < 15 ? 'error' : undefined"
                prepend-icon="tabler-battery-2"
              >
                {{ t('monitoreo.lectura.bateria', { n: lectura.dispositivo.bateria }) }}
              </VChip>
              <VChip
                v-if="lectura.dispositivo.datos_moviles !== null"
                size="x-small"
                label
                variant="tonal"
                :prepend-icon="lectura.dispositivo.datos_moviles ? 'tabler-antenna-bars-5' : 'tabler-antenna-bars-off'"
              >
                {{ lectura.dispositivo.datos_moviles ? t('monitoreo.lectura.datosMoviles') : t('monitoreo.lectura.sinDatosMoviles') }}
              </VChip>
            </div>
          </template>
        </section>

        <!-- GPS -->
        <section class="mt-5">
          <div class="d-flex align-center justify-space-between">
            <h6 class="text-subtitle-1 font-weight-medium mb-0">
              {{ t('monitoreo.lectura.gps') }}
            </h6>
            <VBtn
              size="x-small"
              variant="text"
              prepend-icon="tabler-current-location"
              class="text-none"
              @click="verEnMapa"
            >
              {{ t('monitoreo.lectura.verEnMapa') }}
            </VBtn>
          </div>
          <div
            v-if="lectura.gps.toma_sin_coordenada"
            class="text-body-2 text-warning"
          >
            {{ t('monitoreo.lectura.tomaSinCoordenada') }}
          </div>
          <div
            v-else-if="lectura.gps.lectura_sin_gps"
            class="text-body-2 text-medium-emphasis"
          >
            {{ t('monitoreo.lectura.lecturaSinGps') }}
          </div>
          <div
            v-else
            class="d-flex align-center gap-2"
          >
            <VChip
              size="small"
              label
              :color="lectura.gps.lejos ? 'error' : 'success'"
              variant="tonal"
              :prepend-icon="lectura.gps.lejos ? 'tabler-map-pin-off' : 'tabler-map-pin-check'"
            >
              {{ lectura.gps.lejos ? t('monitoreo.lectura.lejos', { n: lectura.gps.umbral_m }) : t('monitoreo.lectura.distancia', { n: fmt(lectura.gps.distancia_m) }) }}
            </VChip>
            <span
              v-if="lectura.gps.lejos"
              class="text-caption text-medium-emphasis"
            >{{ t('monitoreo.lectura.distancia', { n: fmt(lectura.gps.distancia_m) }) }}</span>
          </div>
        </section>

        <!-- Fotos -->
        <section class="mt-5">
          <h6 class="text-subtitle-1 font-weight-medium mb-1">
            {{ t('monitoreo.lectura.fotos') }}
          </h6>
          <div class="detalle-lectura__fotos text-caption text-medium-emphasis d-flex align-center justify-center">
            <VIcon
              icon="tabler-photo-off"
              size="18"
              class="me-1"
            />{{ t('monitoreo.lectura.sinFoto') }}
          </div>
        </section>
      </template>

      <!-- Otras lecturas del periodo -->
      <section
        v-if="datos.detalle.value?.otras_lecturas.length"
        class="mt-5"
      >
        <h6 class="text-subtitle-1 font-weight-medium mb-1">
          {{ t('monitoreo.lectura.otrasLecturas', { n: datos.detalle.value.otras_lecturas.length }) }}
        </h6>
        <VList
          density="compact"
          class="py-0 detalle-lectura__lista"
        >
          <VListItem
            v-for="otra in datos.detalle.value.otras_lecturas"
            :key="otra.id"
            :title="`${fechaHora(otra.captura.hora)} · ${otra.origen === 'promedio_automatico' ? t('monitoreo.lectura.origenPromedio') : (otra.lecturista?.nombre ?? t('monitoreo.lectura.origenCampo'))}`"
            :subtitle="`${t('monitoreo.lectura.actual')} ${fmt(otra.actual)} · ${t('monitoreo.lectura.consumo')} ${fmt(otra.consumo)}${otra.anomalia ? ` · ${otra.anomalia.etiqueta}` : ''}`"
          />
        </VList>
      </section>

      <!-- Historial -->
      <section class="mt-5">
        <h6 class="text-subtitle-1 font-weight-medium mb-0">
          {{ t('monitoreo.lectura.historial') }}
        </h6>
        <div class="text-caption text-medium-emphasis mb-2">
          {{ t('monitoreo.lectura.historialDetalle', { n: 12 }) }}
        </div>
        <VProgressLinear
          v-if="datos.cargandoHistorial.value"
          indeterminate
        />
        <VAlert
          v-else-if="datos.errorHistorial.value"
          type="warning"
          variant="tonal"
          density="compact"
        >
          {{ t('monitoreo.lectura.historialError') }}
        </VAlert>
        <template v-else-if="datos.historial.value.length">
          <svg
            class="detalle-lectura__grafica"
            viewBox="0 0 240 48"
            preserveAspectRatio="none"
            role="img"
            :aria-label="t('monitoreo.lectura.consumo')"
          >
            <rect
              v-for="(punto, i) in datos.serieConsumo.value"
              :key="i"
              :x="i * (240 / datos.serieConsumo.value.length) + 1"
              :y="48 - Math.max(1, (punto.consumo / maxConsumo) * 46)"
              :width="Math.max(2, 240 / datos.serieConsumo.value.length - 2)"
              :height="Math.max(1, (punto.consumo / maxConsumo) * 46)"
              :fill="punto.anomalia ? '#ef6c00' : '#1e88e5'"
              rx="1"
            >
              <title>{{ punto.periodo }}: {{ fmt(punto.consumo) }}</title>
            </rect>
          </svg>
          <VTable
            density="compact"
            class="detalle-lectura__tabla"
          >
            <thead>
              <tr>
                <th>{{ t('monitoreo.lectura.periodo') }}</th>
                <th class="text-end">
                  {{ t('monitoreo.lectura.anterior') }}
                </th>
                <th class="text-end">
                  {{ t('monitoreo.lectura.actual') }}
                </th>
                <th class="text-end">
                  {{ t('monitoreo.lectura.consumo') }}
                </th>
                <th>{{ t('monitoreo.lectura.anomalia') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="fila in datos.historial.value"
                :key="fila.periodoId"
              >
                <td>
                  <div>{{ fila.periodo }}</div>
                  <div class="text-caption text-medium-emphasis">
                    {{ fila.fecha ?? '' }}<span v-if="fila.lecturista"> · {{ fila.lecturista }}</span>
                  </div>
                </td>
                <td class="text-end">
                  {{ fmt(fila.anterior) }}
                </td>
                <td class="text-end">
                  {{ fmt(fila.actual) }}
                </td>
                <td class="text-end font-weight-medium">
                  {{ fmt(fila.consumo) }}
                </td>
                <td class="text-caption">
                  {{ fila.anomalia ?? '—' }}
                </td>
              </tr>
            </tbody>
          </VTable>
        </template>
        <div
          v-else
          class="text-body-2 text-medium-emphasis"
        >
          {{ t('monitoreo.lectura.historialVacio') }}
        </div>
      </section>

      <!-- Enlaces -->
      <section class="mt-5">
        <h6 class="text-subtitle-1 font-weight-medium mb-1">
          {{ t('monitoreo.lectura.enlaces') }}
        </h6>
        <div class="d-flex flex-wrap gap-2">
          <VBtn
            v-if="urlFicha"
            size="small"
            variant="tonal"
            prepend-icon="tabler-user-square-rounded"
            class="text-none"
            :href="urlFicha"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ t('monitoreo.lectura.fichaContrato') }}
          </VBtn>
          <VBtn
            v-if="datos.detalle.value?.permisos.duplicado && datos.detalle.value?.periodo"
            size="small"
            variant="tonal"
            prepend-icon="tabler-file-type-pdf"
            class="text-none"
            :loading="datos.generandoDuplicado.value"
            @click="datos.abrirDuplicado()"
          >
            {{ t('monitoreo.lectura.duplicado') }}
          </VBtn>
        </div>
        <VAlert
          v-if="datos.errorDuplicado.value"
          type="error"
          variant="tonal"
          density="compact"
          class="mt-2"
        >
          {{ datos.errorDuplicado.value.mensaje || t('monitoreo.lectura.duplicadoError') }}
        </VAlert>
        <VAlert
          v-if="datos.duplicadoBloqueado.value"
          type="warning"
          variant="tonal"
          density="compact"
          class="mt-2"
        >
          {{ t('monitoreo.lectura.duplicadoBloqueado') }}
          <a
            :href="datos.duplicadoBloqueado.value"
            target="_blank"
            rel="noopener noreferrer"
            class="ms-1"
          >PDF</a>
        </VAlert>
      </section>

      <!-- Acciones (F2.5) -->
      <section class="mt-5">
        <h6 class="text-subtitle-1 font-weight-medium mb-1">
          {{ t('monitoreo.lectura.acciones') }}
        </h6>
        <div
          v-if="!puedeOperar"
          class="text-caption text-medium-emphasis mb-2"
        >
          {{ t('monitoreo.lectura.soloLecturaAcciones') }}
        </div>
        <VAlert
          v-if="acciones.error.value"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-2"
          closable
          @click:close="acciones.error.value = null"
        >
          {{ acciones.error.value.mensaje }}
        </VAlert>

        <!-- Re-lectura: estado vigente -->
        <VAlert
          v-if="relectura"
          :type="relectura.estado === 'solicitada' ? 'warning' : relectura.estado === 'releida' ? 'success' : 'info'"
          variant="tonal"
          density="compact"
          class="mb-2"
        >
          <template v-if="relectura.estado === 'solicitada'">
            {{ t('monitoreo.lectura.relecturaSolicitada', { quien: relectura.pedida_por ?? '—', hace: haceCuanto(relectura.pedida_en, relativo), motivo: relectura.motivo_etiqueta }) }}
            <span v-if="relectura.nota"> · {{ relectura.nota }}</span>
            <div v-if="puedeOperar">
              <VBtn
                size="x-small"
                variant="text"
                class="text-none mt-1"
                :loading="acciones.ocupado.value === 'cancelar'"
                @click="cancelarRelectura"
              >
                {{ t('monitoreo.lectura.cancelarRelectura') }}
              </VBtn>
            </div>
          </template>
          <template v-else-if="relectura.estado === 'releida'">
            {{ t('monitoreo.lectura.relecturaReleida', { hace: haceCuanto(relectura.resuelta_en, relativo), actual: relectura.resultado?.actual ?? '—', consumo: relectura.resultado?.consumo ?? '—' }) }}
          </template>
          <template v-else>
            {{ t('monitoreo.lectura.relecturaCancelada', { motivo: relectura.motivo_etiqueta, quien: relectura.pedida_por ?? '—' }) }}
          </template>
        </VAlert>

        <!-- Sugerencias con la lógica del reporte de anomalías -->
        <div class="text-caption text-medium-emphasis">
          {{ t('monitoreo.lectura.sugerencias') }} · {{ t('monitoreo.lectura.sugerenciasDetalle') }}
        </div>
        <div
          v-if="sugerencias.length"
          class="d-flex flex-wrap gap-1 mt-1 mb-2"
        >
          <VChip
            v-for="s in sugerencias"
            :key="s.motivo"
            size="small"
            label
            color="warning"
            variant="tonal"
            :disabled="!puedeOperar || relectura?.estado === 'solicitada' || acciones.ocupado.value === 'relectura'"
            prepend-icon="tabler-refresh"
            :title="t('monitoreo.lectura.pedirPor', { motivo: s.etiqueta })"
            @click="pedirRelectura(s.motivo)"
          >
            {{ s.etiqueta }}
          </VChip>
        </div>
        <div
          v-else
          class="text-body-2 text-medium-emphasis mb-2"
        >
          {{ t('monitoreo.lectura.sinSugerencias') }}
        </div>

        <!-- Pedir re-lectura con motivo -->
        <div
          v-if="puedeOperar && lectura && relectura?.estado !== 'solicitada'"
          class="d-flex flex-wrap align-center gap-2 mb-3"
        >
          <VSelect
            v-model="motivoElegido"
            :items="opcionesMotivo"
            :label="t('monitoreo.lectura.motivo')"
            density="compact"
            variant="outlined"
            hide-details
            class="detalle-lectura__motivo"
          />
          <VTextField
            v-model="notaRelectura"
            :label="t('monitoreo.lectura.notaOpcional')"
            density="compact"
            variant="outlined"
            hide-details
            maxlength="500"
            class="flex-grow-1"
          />
          <VBtn
            size="small"
            color="primary"
            variant="tonal"
            class="text-none"
            prepend-icon="tabler-refresh"
            :loading="acciones.ocupado.value === 'relectura'"
            @click="pedirRelectura(motivoElegido)"
          >
            {{ t('monitoreo.lectura.pedirRelectura') }}
          </VBtn>
        </div>

        <!-- Otras acciones -->
        <div class="d-flex flex-wrap gap-2 mb-3">
          <VBtn
            v-if="urlFicha"
            size="small"
            variant="outlined"
            class="text-none"
            prepend-icon="tabler-ticket"
            :href="urlFicha"
            target="_blank"
            rel="noopener noreferrer"
            :title="t('monitoreo.lectura.ticketSoporteDetalle')"
          >
            {{ t('monitoreo.lectura.ticketSoporte') }}
          </VBtn>
          <VBtn
            v-if="puedeOperar && toma && !toma.coordenada.en_duda"
            size="small"
            variant="outlined"
            class="text-none"
            prepend-icon="tabler-map-pin-question"
            :loading="acciones.ocupado.value === 'coordenada'"
            @click="marcarCoordenada(true)"
          >
            {{ t('monitoreo.lectura.marcarCoordenada') }}
          </VBtn>
        </div>
        <VAlert
          v-if="toma?.coordenada.en_duda"
          type="info"
          variant="tonal"
          density="compact"
          class="mb-3"
        >
          {{ t('monitoreo.lectura.coordenadaMarcada') }}
          <VBtn
            v-if="puedeOperar"
            size="x-small"
            variant="text"
            class="text-none ms-1"
            :loading="acciones.ocupado.value === 'coordenada'"
            @click="marcarCoordenada(false)"
          >
            {{ t('monitoreo.lectura.quitarMarcaCoordenada') }}
          </VBtn>
        </VAlert>

        <!-- Anotaciones -->
        <h6 class="text-subtitle-2 font-weight-medium mb-1">
          {{ t('monitoreo.lectura.anotaciones') }}
        </h6>
        <div
          v-if="!notas.length"
          class="text-body-2 text-medium-emphasis"
        >
          {{ t('monitoreo.lectura.sinAnotaciones') }}
        </div>
        <VList
          v-else
          density="compact"
          class="py-0 detalle-lectura__lista"
        >
          <VListItem
            v-for="nota in notas"
            :key="nota.id"
            :title="nota.texto"
            :subtitle="`${nota.autor ?? '—'} · ${fechaCorta(nota.fecha)} ${horaCorta(nota.fecha)}`"
          >
            <template
              v-if="puedeOperar"
              #append
            >
              <VBtn
                icon="tabler-trash"
                size="x-small"
                variant="text"
                :title="t('monitoreo.lectura.borrarNota')"
                :loading="acciones.ocupado.value === 'borrarNota'"
                @click="borrarNota(nota.id)"
              />
            </template>
          </VListItem>
        </VList>
        <div
          v-if="puedeOperar"
          class="d-flex align-center gap-2 mt-2"
        >
          <VTextField
            v-model="nuevaNota"
            :placeholder="t('monitoreo.lectura.nuevaAnotacion')"
            density="compact"
            variant="outlined"
            hide-details
            maxlength="1000"
            class="flex-grow-1"
            @keyup.enter="anotar"
          />
          <VBtn
            size="small"
            variant="tonal"
            class="text-none"
            :disabled="!nuevaNota.trim()"
            :loading="acciones.ocupado.value === 'nota'"
            @click="anotar"
          >
            {{ t('monitoreo.lectura.anotar') }}
          </VBtn>
        </div>
      </section>
    </div>
  </VNavigationDrawer>
</template>

<style scoped>
.detalle-lectura__cuerpo {
  overflow-y: auto;
}

.detalle-lectura__motivo {
  flex: 0 1 220px;
  min-inline-size: 180px;
}

.detalle-lectura__lista :deep(.v-list-item) {
  min-block-size: 32px;
  padding-inline: 0;
}

.detalle-lectura__fotos {
  border: 1px dashed rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 6px;
  block-size: 72px;
}

.detalle-lectura__grafica {
  display: block;
  inline-size: 100%;
  block-size: 48px;
  margin-block-end: 6px;
}

.detalle-lectura__tabla :deep(th),
.detalle-lectura__tabla :deep(td) {
  padding-inline: 6px !important;
  white-space: nowrap;
}
</style>
