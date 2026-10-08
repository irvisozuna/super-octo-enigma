<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAccionesLectura } from '../composables/useAccionesLectura'
import { useDetalleLectura } from '../composables/useDetalleLectura'
import type { MotivoRelectura } from '../types/relecturas'
import { fechaCorta, haceCuanto, horaCorta } from '../utils/tiempo'
import type { ColumnaTabla } from '@/components/as/tipos'
import { useTokensTema } from '@/composables/useTokensTema'
import { COLOR_RELECTURA } from '@/utils/estados'
import { conSigno, decimal, duracion, entero, moneda } from '@/utils/formato'

/*
 * Panel lateral con el detalle de la lectura de una toma (sección H del cuestionario): toma, lectura (anterior,
 * actual, consumo, promedio, variación, anomalía, comentario), captura y llegada, recibo, lecturista y dispositivo,
 * GPS contra la toma, fotos (pendientes de la app), historial de 12 lecturas con mini gráfica, enlaces y acciones
 * (re-lectura, coordenada en duda, anotaciones). Sobre AsPanelLateral con pie fijo para la acción principal.
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

const { t } = useI18n()
const router = useRouter()
const tokens = useTokensTema()
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
const puedePedir = computed(() => puedeOperar.value && !!lectura.value && relectura.value?.estado !== 'solicitada')

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

  return m === null || m === undefined ? '—' : duracion(m)
})

const cifrasLectura = computed(() => {
  const l = lectura.value
  if (!l)
    return []

  return [
    { clave: 'anterior', valor: entero(l.anterior) },
    { clave: 'actual', valor: entero(l.actual) },
    { clave: 'consumo', valor: entero(l.consumo), extra: l.consumo_real !== null && l.consumo_real !== l.consumo ? `${t('monitoreo.lectura.consumoReal')} ${entero(l.consumo_real)}` : null },
    { clave: 'promedio', valor: decimal(l.promedio, 1) },
  ]
})

const maxConsumo = computed(() => Math.max(1, ...datos.serieConsumo.value.map(s => s.consumo)))

const columnasHistorial = computed<ColumnaTabla[]>(() => [
  { clave: 'periodo', titulo: t('monitoreo.lectura.periodo'), formato: 'personalizado', ordenable: false },
  { clave: 'anterior', titulo: t('monitoreo.lectura.anterior'), formato: 'entero', ancho: 80, ordenable: false },
  { clave: 'actual', titulo: t('monitoreo.lectura.actual'), formato: 'entero', ancho: 80, ordenable: false },
  { clave: 'consumo', titulo: t('monitoreo.lectura.consumo'), formato: 'entero', ancho: 80, ordenable: false },
  { clave: 'anomalia', titulo: t('monitoreo.lectura.anomalia'), formato: 'texto', truncar: true, ordenable: false },
])

const urlFicha = computed(() => (toma.value ? router.resolve({ path: '/supports', query: { cuenta: toma.value.cuenta } }).href : null))

function fechaHora(valor: string | null | undefined): string {
  return valor ? `${fechaCorta(valor)} ${horaCorta(valor)}` : '—'
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
  <AsPanelLateral
    :abierto="abierto"
    :sobrelinea="t('monitoreo.lectura.titulo')"
    :titulo="toma ? `${t('monitoreo.lectura.cuenta')} ${toma.cuenta}` : ''"
    :subtitulo="toma?.nombre ?? undefined"
    tamano="lg"
    :cargando="datos.cargando.value"
    class="detalle-lectura"
    @update:abierto="(v: boolean) => emit('update:abierto', v)"
  >
    <template #acciones>
      <VBtn
        v-if="lectura || toma?.coordenada"
        size="small"
        variant="text"
        prepend-icon="tabler-current-location"
        @click="verEnMapa"
      >
        {{ t('monitoreo.lectura.verEnMapa') }}
      </VBtn>
    </template>

    <template
      v-if="toma"
      #subencabezado
    >
      <div class="as-secundario mb-2">
        {{ toma.direccion ?? '—' }}
      </div>
      <div class="d-flex flex-wrap gap-1">
        <VChip
          v-if="toma.sector"
          size="small"
          label
          variant="tonal"
          prepend-icon="tabler-polygon"
        >
          {{ toma.sector }}<span v-if="toma.secuencia !== null"> · {{ t('monitoreo.lectura.secuencia', { n: toma.secuencia }) }}</span>
        </VChip>
        <VChip
          v-if="toma.gerencia"
          size="small"
          label
          variant="tonal"
          prepend-icon="tabler-map-pin"
        >
          {{ toma.gerencia }}
        </VChip>
        <VChip
          v-if="toma.medidor"
          size="small"
          label
          variant="tonal"
          prepend-icon="tabler-gauge"
        >
          {{ t('monitoreo.lectura.medidor', { n: toma.medidor }) }}
        </VChip>
        <VChip
          v-if="toma.tarifa_fija"
          size="small"
          label
          color="toma-tarifa-fija"
          variant="tonal"
        >
          {{ t('monitoreo.lectura.tarifaFija') }}
        </VChip>
        <VChip
          v-if="!toma.activo"
          size="small"
          label
          color="warning"
          variant="tonal"
        >
          {{ t('monitoreo.lectura.inactivo') }}<span v-if="toma.estatus"> · {{ toma.estatus }}</span>
        </VChip>
      </div>
    </template>

    <template v-if="datos.error.value && !toma">
      <AsEstado
        v-if="datos.noVisible.value"
        tipo="sin-permiso"
        :detalle="t('monitoreo.lectura.noVisible')"
      />
      <AsEstado
        v-else
        tipo="error"
        :error="datos.error.value"
        @reintentar="refrescar"
      />
    </template>

    <AsEstado
      v-else-if="!toma"
      tipo="cargando"
      esqueleto="tarjeta"
      :filas="3"
    />

    <template v-else>
      <!-- Lectura -->
      <section>
        <h3 class="as-seccion">
          <span>{{ t('monitoreo.lectura.lecturaDe', { periodo: datos.detalle.value?.periodo?.nombre ?? '—' }) }}</span>
          <VChip
            v-if="lectura"
            size="small"
            label
            :color="lectura.origen === 'promedio_automatico' ? 'toma-estimada' : 'toma-leida'"
            variant="tonal"
          >
            {{ lectura.origen === 'promedio_automatico' ? t('monitoreo.lectura.origenPromedio') : t('monitoreo.lectura.origenCampo') }}
          </VChip>
        </h3>

        <VAlert
          v-if="!lectura"
          type="info"
          variant="tonal"
          density="compact"
        >
          {{ t('monitoreo.lectura.sinLectura', { periodo: datos.detalle.value?.periodo?.nombre ?? '—' }) }}
        </VAlert>

        <template v-else>
          <div class="detalle-lectura__cifras">
            <div
              v-for="c in cifrasLectura"
              :key="c.clave"
              class="detalle-lectura__cifra"
            >
              <div class="as-etiqueta">
                {{ t(`monitoreo.lectura.${c.clave}`) }}
              </div>
              <div class="detalle-lectura__cifra-valor as-num">
                {{ c.valor }}
              </div>
              <div
                v-if="c.extra"
                class="text-caption text-medium-emphasis as-num"
              >
                {{ c.extra }}
              </div>
              <template v-if="c.clave === 'promedio'">
                <VChip
                  v-if="lectura.variacion_pct !== null"
                  size="x-small"
                  label
                  :color="variacionColor"
                  variant="tonal"
                  class="as-num mt-1"
                >
                  {{ conSigno(lectura.variacion_pct, 0) }} %
                </VChip>
                <span
                  v-else
                  class="text-caption text-disabled"
                >{{ t('monitoreo.lectura.variacionSinPromedio') }}</span>
              </template>
            </div>
          </div>

          <div class="mt-3">
            <div class="as-etiqueta mb-1">
              {{ t('monitoreo.lectura.anomalia') }}
            </div>
            <div
              v-if="lectura.anomalia"
              class="d-flex flex-wrap align-center gap-1"
            >
              <VChip
                size="small"
                label
                :color="lectura.anomalia.accion_inmediata ? 'alerta-alta' : 'toma-anomalia'"
                variant="tonal"
              >
                <span
                  v-if="lectura.anomalia.codigo"
                  class="as-num"
                >{{ lectura.anomalia.codigo }} · </span>{{ lectura.anomalia.etiqueta }}
              </VChip>
              <VChip
                v-if="lectura.anomalia.accion_inmediata"
                size="x-small"
                color="alerta-alta"
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
        <!-- Tiempos y recibo -->
        <section>
          <h3 class="as-seccion">
            {{ t('monitoreo.lectura.tiempos') }}
          </h3>
          <dl class="as-datos mb-0">
            <div class="as-dato">
              <dt class="as-etiqueta">
                {{ t('monitoreo.lectura.captura') }}
              </dt>
              <dd class="as-valor as-num mb-0">
                {{ fechaHora(lectura.captura.hora) }}
              </dd>
            </div>
            <div class="as-dato">
              <dt class="as-etiqueta">
                {{ t('monitoreo.lectura.llegada') }}
              </dt>
              <dd class="as-valor as-num mb-0">
                {{ fechaHora(lectura.llegada) }}
              </dd>
            </div>
            <div class="as-dato">
              <dt class="as-etiqueta">
                {{ t('monitoreo.lectura.retraso') }}
              </dt>
              <dd
                class="as-valor as-num mb-0"
                :class="{ 'text-warning': (lectura.retraso_min ?? 0) > 180 }"
              >
                {{ retraso }}
              </dd>
            </div>
          </dl>
          <VAlert
            v-if="!lectura.captura.confiable"
            type="warning"
            variant="tonal"
            density="compact"
            class="mt-2"
          >
            {{ t('monitoreo.lectura.capturaRespaldo') }}
          </VAlert>
        </section>

        <section>
          <h3 class="as-seccion">
            {{ t('monitoreo.lectura.recibo') }}
          </h3>
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
              class="text-body-2 as-num"
            >{{ t('monitoreo.lectura.importe') }} <strong>{{ moneda(lectura.recibo.importe) }}</strong></span>
            <span
              v-if="lectura.recibo.impresora"
              class="as-secundario"
            >{{ t('monitoreo.lectura.impresora', { n: lectura.recibo.impresora }) }}</span>
            <span
              v-if="lectura.recibo.factura_id"
              class="as-secundario as-num"
            >{{ t('monitoreo.lectura.factura', { n: lectura.recibo.factura_id }) }}</span>
          </div>
        </section>

        <!-- Lecturista, dispositivo y GPS -->
        <section>
          <h3 class="as-seccion">
            {{ t('monitoreo.lectura.lecturista') }}
          </h3>
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
                size="small"
                label
                variant="tonal"
                prepend-icon="tabler-device-mobile"
                class="as-num"
              >
                {{ t('monitoreo.lectura.dispositivo', { id: lectura.dispositivo.id }) }}
              </VChip>
              <VChip
                v-if="lectura.dispositivo.bateria !== null"
                size="small"
                label
                variant="tonal"
                :color="lectura.dispositivo.bateria < 15 ? 'error' : undefined"
                prepend-icon="tabler-battery-2"
                class="as-num"
              >
                {{ t('monitoreo.lectura.bateria', { n: lectura.dispositivo.bateria }) }}
              </VChip>
              <VChip
                v-if="lectura.dispositivo.datos_moviles !== null"
                size="small"
                label
                variant="tonal"
                :prepend-icon="lectura.dispositivo.datos_moviles ? 'tabler-antenna-bars-5' : 'tabler-antenna-bars-off'"
              >
                {{ lectura.dispositivo.datos_moviles ? t('monitoreo.lectura.datosMoviles') : t('monitoreo.lectura.sinDatosMoviles') }}
              </VChip>
            </div>
          </template>

          <div class="as-etiqueta mt-3 mb-1">
            {{ t('monitoreo.lectura.gps') }}
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
            class="d-flex align-center flex-wrap gap-2"
          >
            <VChip
              size="small"
              label
              :color="lectura.gps.lejos ? 'toma-lejos' : 'success'"
              variant="tonal"
              :prepend-icon="lectura.gps.lejos ? 'tabler-map-pin-off' : 'tabler-map-pin-check'"
              class="as-num"
            >
              {{ lectura.gps.lejos ? t('monitoreo.lectura.lejos', { n: lectura.gps.umbral_m }) : t('monitoreo.lectura.distancia', { n: entero(lectura.gps.distancia_m) }) }}
            </VChip>
            <span
              v-if="lectura.gps.lejos"
              class="as-secundario as-num"
            >{{ t('monitoreo.lectura.distancia', { n: entero(lectura.gps.distancia_m) }) }}</span>
          </div>

          <div class="as-etiqueta mt-3 mb-1">
            {{ t('monitoreo.lectura.fotos') }}
          </div>
          <AsEstado
            tipo="vacio"
            compacto
            icono="tabler-photo-off"
            :titulo="t('monitoreo.lectura.sinFoto')"
            detalle=""
            class="detalle-lectura__fotos"
          />
        </section>
      </template>

      <!-- Otras lecturas del periodo -->
      <section v-if="datos.detalle.value?.otras_lecturas.length">
        <h3 class="as-seccion">
          {{ t('monitoreo.lectura.otrasLecturas', { n: datos.detalle.value.otras_lecturas.length }) }}
        </h3>
        <VList
          density="compact"
          class="py-0 detalle-lectura__lista"
        >
          <VListItem
            v-for="otra in datos.detalle.value.otras_lecturas"
            :key="otra.id"
            :title="`${fechaHora(otra.captura.hora)} · ${otra.origen === 'promedio_automatico' ? t('monitoreo.lectura.origenPromedio') : (otra.lecturista?.nombre ?? t('monitoreo.lectura.origenCampo'))}`"
            :subtitle="`${t('monitoreo.lectura.actual')} ${entero(otra.actual)} · ${t('monitoreo.lectura.consumo')} ${entero(otra.consumo)}${otra.anomalia ? ` · ${otra.anomalia.etiqueta}` : ''}`"
          />
        </VList>
      </section>

      <!-- Historial -->
      <section>
        <h3 class="as-seccion mb-0">
          {{ t('monitoreo.lectura.historial') }}
        </h3>
        <div class="as-secundario mb-2">
          {{ t('monitoreo.lectura.historialDetalle', { n: 12 }) }}
        </div>
        <AsEstado
          v-if="datos.cargandoHistorial.value"
          tipo="cargando"
          :filas="4"
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
              :fill="punto.anomalia ? tokens.hex('toma-anomalia') : tokens.hex('primary')"
              rx="1"
            >
              <title>{{ punto.periodo }}: {{ entero(punto.consumo) }}</title>
            </rect>
          </svg>
          <AsTablaDatos
            sin-tarjeta
            densidad="densa"
            :columnas="columnasHistorial"
            :filas="datos.historial.value"
            clave-fila="periodoId"
            :por-pagina="-1"
            ocultar-pie
            class="detalle-lectura__tabla"
          >
            <template #celda-periodo="{ fila }">
              <div>{{ fila.periodo }}</div>
              <div class="as-secundario">
                {{ fila.fecha ?? '' }}<span v-if="fila.lecturista"> · {{ fila.lecturista }}</span>
              </div>
            </template>
            <template #celda-consumo="{ texto }">
              <span class="font-weight-medium">{{ texto }}</span>
            </template>
          </AsTablaDatos>
        </template>
        <AsEstado
          v-else
          tipo="vacio"
          compacto
          icono="tabler-history-off"
          :titulo="t('monitoreo.lectura.historialVacio')"
          detalle=""
        />
      </section>

      <!-- Acciones -->
      <section>
        <h3 class="as-seccion">
          {{ t('monitoreo.lectura.acciones') }}
        </h3>
        <div
          v-if="!puedeOperar"
          class="as-secundario mb-2"
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
          :color="COLOR_RELECTURA[relectura.estado as keyof typeof COLOR_RELECTURA]"
          variant="tonal"
          density="compact"
          class="mb-3"
        >
          <template v-if="relectura.estado === 'solicitada'">
            {{ t('monitoreo.lectura.relecturaSolicitada', { quien: relectura.pedida_por ?? '—', hace: haceCuanto(relectura.pedida_en, relativo), motivo: relectura.motivo_etiqueta }) }}
            <span v-if="relectura.nota"> · {{ relectura.nota }}</span>
            <div v-if="puedeOperar">
              <VBtn
                size="small"
                variant="text"
                class="mt-1 px-0"
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
        <div class="as-etiqueta mb-1">
          {{ t('monitoreo.lectura.sugerencias') }} · {{ t('monitoreo.lectura.sugerenciasDetalle') }}
        </div>
        <div
          v-if="sugerencias.length"
          class="d-flex flex-wrap gap-1 mb-3"
        >
          <VChip
            v-for="s in sugerencias"
            :key="s.motivo"
            size="small"
            label
            color="warning"
            variant="tonal"
            :disabled="!puedePedir || acciones.ocupado.value === 'relectura'"
            prepend-icon="tabler-refresh"
            :title="t('monitoreo.lectura.pedirPor', { motivo: s.etiqueta })"
            @click="pedirRelectura(s.motivo)"
          >
            {{ s.etiqueta }}
          </VChip>
        </div>
        <div
          v-else
          class="text-body-2 text-medium-emphasis mb-3"
        >
          {{ t('monitoreo.lectura.sinSugerencias') }}
        </div>

        <!-- Motivo y nota de la re-lectura (la acción va en el pie del panel) -->
        <div
          v-if="puedePedir"
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
        </div>

        <!-- Otras acciones -->
        <div class="d-flex flex-wrap gap-2 mb-3">
          <VBtn
            v-if="urlFicha"
            size="small"
            variant="outlined"
            color="primary"
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
            color="primary"
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
            size="small"
            variant="text"
            class="ms-1"
            :loading="acciones.ocupado.value === 'coordenada'"
            @click="marcarCoordenada(false)"
          >
            {{ t('monitoreo.lectura.quitarMarcaCoordenada') }}
          </VBtn>
        </VAlert>

        <!-- Anotaciones -->
        <div class="as-etiqueta mb-1">
          {{ t('monitoreo.lectura.anotaciones') }}
        </div>
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
                size="small"
                variant="text"
                :title="t('monitoreo.lectura.borrarNota')"
                :aria-label="t('monitoreo.lectura.borrarNota')"
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
            :aria-label="t('monitoreo.lectura.nuevaAnotacion')"
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
            color="primary"
            :disabled="!nuevaNota.trim()"
            :loading="acciones.ocupado.value === 'nota'"
            @click="anotar"
          >
            {{ t('monitoreo.lectura.anotar') }}
          </VBtn>
        </div>
      </section>
    </template>

    <!-- Pie fijo: enlaces y la acción principal -->
    <template
      v-if="toma"
      #pie
    >
      <VBtn
        v-if="urlFicha"
        size="small"
        variant="text"
        prepend-icon="tabler-user-square-rounded"
        :href="urlFicha"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ t('monitoreo.lectura.fichaContrato') }}
      </VBtn>
      <VBtn
        v-if="datos.detalle.value?.permisos.duplicado && datos.detalle.value?.periodo"
        size="small"
        variant="text"
        prepend-icon="tabler-file-type-pdf"
        :loading="datos.generandoDuplicado.value"
        @click="datos.abrirDuplicado()"
      >
        {{ t('monitoreo.lectura.duplicado') }}
      </VBtn>
      <VSpacer />
      <VBtn
        v-if="puedePedir"
        size="small"
        color="primary"
        variant="flat"
        prepend-icon="tabler-refresh"
        :loading="acciones.ocupado.value === 'relectura'"
        @click="pedirRelectura(motivoElegido)"
      >
        {{ t('monitoreo.lectura.pedirRelectura') }}
      </VBtn>
      <VAlert
        v-if="datos.errorDuplicado.value"
        type="error"
        variant="tonal"
        density="compact"
        class="w-100 mt-1"
      >
        {{ datos.errorDuplicado.value.mensaje || t('monitoreo.lectura.duplicadoError') }}
      </VAlert>
      <VAlert
        v-if="datos.duplicadoBloqueado.value"
        type="warning"
        variant="tonal"
        density="compact"
        class="w-100 mt-1"
      >
        {{ t('monitoreo.lectura.duplicadoBloqueado') }}
        <a
          :href="datos.duplicadoBloqueado.value"
          target="_blank"
          rel="noopener noreferrer"
          class="ms-1"
        >PDF</a>
      </VAlert>
    </template>
  </AsPanelLateral>
</template>

<style scoped>
.detalle-lectura__cifras {
  display: grid;
  gap: var(--as-sp-2);
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.detalle-lectura__cifra {
  border: var(--as-borde);
  border-radius: var(--as-radio-md);
  background: rgb(var(--v-theme-surface-variant));
  padding-block: var(--as-sp-2);
  padding-inline: var(--as-sp-3);
}

.detalle-lectura__cifra-valor {
  font-size: var(--as-fs-lg);
  font-weight: var(--as-peso-semi);
  line-height: 1.3;
}

.detalle-lectura__motivo {
  flex: 0 1 var(--as-ancho-filtro-md);
  min-inline-size: var(--as-ancho-filtro-sm);
}

.detalle-lectura__lista :deep(.v-list-item) {
  min-block-size: 32px;
  padding-inline: 0;
}

.detalle-lectura__fotos {
  border: 1px dashed rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: var(--as-radio-md);
}

.detalle-lectura__grafica {
  display: block;
  block-size: 48px;
  inline-size: 100%;
  margin-block-end: var(--as-sp-2);
}

.detalle-lectura__tabla {
  border: var(--as-borde);
  border-radius: var(--as-radio-md);
}
</style>
