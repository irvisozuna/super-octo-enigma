<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useJornada } from '../composables/useJornada'
import { haceCuanto, horaCorta, hoyLocal } from '../utils/tiempo'
import EstadoError from '@/modules/reportes/components/comunes/EstadoError.vue'

/*
 * Panel lateral con la jornada de un lecturista en un día (sección F): indicadores del día con su promedio de los
 * últimos tres periodos, línea de tiempo (lecturas, huecos > pausa, tramos sin señal), señales del dispositivo y la
 * lista de lecturas (cada una abre su detalle). Solo lectura.
 */
const props = defineProps<{
  abierto: boolean
  lecturista: number | null
  dia: string | null
  ahora: Date
}>()

const emit = defineEmits<{
  'update:abierto': [valor: boolean]
  'update:dia': [dia: string]
  'verRecorrido': [lecturista: number]
  'toma': [contrato: number]
}>()

const { t, n } = useI18n()
const j = useJornada()

const relativo = (clave: 'nunca' | 'ahora' | 'minutos' | 'horas' | 'dias', valor?: number) => t(`monitoreo.tiempo.${clave}`, { n: valor })

const COLOR_ESTADO: Record<string, string> = { activo: 'success', silencio: 'error', sin_iniciar: 'warning', terminado: 'primary', fuera_de_jornada: 'secondary' }

const d = j.datos
const hoy = computed(() => hoyLocal())
const diaActual = computed(() => d.value?.dia ?? props.dia ?? hoy.value)

interface Indicador { clave: string; valor: string; promedio: string | null; alerta?: boolean }

const indicadores = computed<Indicador[]>(() => {
  const jd = d.value?.jornada
  const p = d.value?.promedio
  if (!jd)
    return []
  const horas = (min: number) => (min >= 60 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${min} min`)

  return [
    { clave: 'lecturas', valor: n(jd.lecturas), promedio: p ? n(p.lecturas) : null },
    { clave: 'porHora', valor: jd.lecturas_por_hora === null ? '—' : n(jd.lecturas_por_hora), promedio: p?.lecturas_por_hora != null ? n(p.lecturas_por_hora) : null },
    { clave: 'tiempoTotal', valor: horas(jd.minutos_totales), promedio: p ? horas(p.minutos_totales) : null },
    { clave: 'tiempoMuerto', valor: horas(jd.minutos_muertos), promedio: p ? horas(p.minutos_muertos) : null, alerta: jd.minutos_muertos > 0 },
    { clave: 'anomalias', valor: n(jd.anomalias), promedio: p ? n(p.anomalias) : null },
    { clave: 'impresas', valor: n(jd.impresas), promedio: p ? n(p.impresas) : null },
    { clave: 'lejos', valor: n(jd.lejos), promedio: p ? n(p.lejos) : null, alerta: d.value?.avisos.includes('lejos') },
    { clave: 'sectores', valor: n(jd.sectores.length), promedio: p ? n(p.sectores) : null },
    { clave: 'km', valor: jd.km === null ? t('monitoreo.jornada.sinRastreo') : n(jd.km, { maximumFractionDigits: 1 }), promedio: null },
  ]
})

const ticks = computed(() => {
  const out: { pct: number; etiqueta: string }[] = []
  const { desde, hasta } = j.eje.value
  for (let h = desde; h <= hasta; h++)
    out.push({ pct: ((h - desde) / (hasta - desde)) * 100, etiqueta: `${String(h).padStart(2, '0')}h` })

  return out
})

function etiquetaIndicador(clave: string): string {
  return clave === 'lejos' ? t('monitoreo.jornada.lejos', { n: d.value?.parametros.distancia_m ?? 50 }) : t(`monitoreo.jornada.${clave}`)
}

function cambiarDia(delta: number) {
  const base = new Date(`${diaActual.value}T12:00:00-07:00`)

  base.setDate(base.getDate() + delta)

  const nuevo = base.toISOString().slice(0, 10)
  if (nuevo <= hoy.value)
    emit('update:dia', nuevo)
}

function cerrar() {
  emit('update:abierto', false)
}

watch(() => [props.abierto, props.lecturista, props.dia] as const, ([abierto, lecturista, dia]) => {
  if (abierto && lecturista !== null)
    j.cargar(lecturista, dia)
  else if (!abierto)
    j.limpiar()
}, { immediate: true })
</script>

<template>
  <VNavigationDrawer
    :model-value="abierto"
    location="end"
    temporary
    :width="560"
    class="jornada-lecturista"
    @update:model-value="(v: boolean) => emit('update:abierto', v)"
  >
    <div class="d-flex align-center justify-space-between px-4 pt-3 pb-2">
      <div>
        <div class="text-overline text-medium-emphasis">
          {{ t('monitoreo.jornada.titulo') }}
        </div>
        <div
          v-if="d"
          class="text-h6 d-flex align-center flex-wrap gap-2"
        >
          {{ d.lecturista.nombre }}
          <VChip
            size="x-small"
            :color="COLOR_ESTADO[d.estado]"
            variant="tonal"
            label
          >
            {{ t(`monitoreo.estadoLecturista.${d.estado}`) }}
          </VChip>
          <span
            v-if="d.lecturista.gerencia"
            class="text-body-2 text-medium-emphasis"
          >{{ d.lecturista.gerencia }}</span>
        </div>
      </div>
      <VBtn
        icon="tabler-x"
        variant="text"
        size="small"
        :aria-label="t('monitoreo.jornada.cerrar')"
        @click="cerrar"
      />
    </div>
    <div class="d-flex align-center justify-space-between px-4 pb-2">
      <div class="d-flex align-center gap-1">
        <VBtn
          icon="tabler-chevron-left"
          size="x-small"
          variant="text"
          :aria-label="t('monitoreo.jornada.diaAnterior')"
          @click="cambiarDia(-1)"
        />
        <span class="text-body-2 font-weight-medium">{{ new Date(`${diaActual}T12:00:00-07:00`).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Mazatlan' }) }}</span>
        <VBtn
          icon="tabler-chevron-right"
          size="x-small"
          variant="text"
          :disabled="diaActual >= hoy"
          :aria-label="t('monitoreo.jornada.diaSiguiente')"
          @click="cambiarDia(1)"
        />
      </div>
      <VBtn
        v-if="d"
        size="small"
        variant="text"
        prepend-icon="tabler-route"
        class="text-none"
        @click="emit('verRecorrido', d.lecturista.id)"
      >
        {{ t('monitoreo.jornada.verRecorrido') }}
      </VBtn>
    </div>
    <VDivider />

    <VProgressLinear
      v-if="j.cargando.value"
      indeterminate
    />

    <div
      v-if="j.error.value && !d"
      class="pa-4"
    >
      <VAlert
        v-if="j.noVisible.value"
        type="warning"
        variant="tonal"
        density="compact"
      >
        {{ t('monitoreo.jornada.noVisible') }}
      </VAlert>
      <EstadoError
        v-else
        :error="j.error.value"
        @reintentar="props.lecturista !== null && j.cargar(props.lecturista, props.dia)"
      />
    </div>

    <div
      v-else-if="d"
      class="jornada-lecturista__cuerpo px-4 pb-6"
    >
      <VAlert
        v-if="j.sinActividad.value"
        type="info"
        variant="tonal"
        density="compact"
        class="mt-3"
      >
        {{ t('monitoreo.jornada.sinActividad', { dia: diaActual }) }}
      </VAlert>

      <template v-if="d.jornada">
        <!-- Cabecera del día -->
        <section class="mt-3">
          <div class="text-body-2 mb-2">
            <span class="text-medium-emphasis">{{ t('monitoreo.jornada.primera') }}</span> <strong>{{ horaCorta(d.jornada.primera_lectura) }}</strong>
            <span class="text-medium-emphasis ms-3">{{ t('monitoreo.jornada.ultima') }}</span> <strong>{{ horaCorta(d.jornada.ultima_lectura) }}</strong>
          </div>
          <div class="jornada-lecturista__cifras">
            <div
              v-for="ind in indicadores"
              :key="ind.clave"
              class="jornada-lecturista__cifra"
            >
              <div
                class="text-h6"
                :class="{ 'text-warning': ind.alerta }"
              >
                {{ ind.valor }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ etiquetaIndicador(ind.clave) }}
              </div>
              <div
                v-if="ind.promedio !== null"
                class="text-caption text-disabled"
              >
                {{ t('monitoreo.jornada.promedio', { n: ind.promedio }) }}
              </div>
            </div>
          </div>
          <div class="text-caption text-medium-emphasis mt-1">
            {{ d.promedio ? t('monitoreo.jornada.promedioDetalle', { n: d.promedio.dias }) : t('monitoreo.jornada.sinPromedio') }}
          </div>
          <div
            v-if="d.jornada.sectores.length"
            class="d-flex flex-wrap gap-1 mt-2"
          >
            <VChip
              v-for="s in d.jornada.sectores"
              :key="s.sector_id"
              size="x-small"
              label
              variant="outlined"
            >
              {{ s.sector }}
            </VChip>
          </div>
        </section>

        <!-- Línea de tiempo -->
        <section class="mt-5">
          <h6 class="text-subtitle-1 font-weight-medium mb-1">
            {{ t('monitoreo.jornada.lineaTiempo') }}
          </h6>
          <div class="jornada-lecturista__eje">
            <div
              v-for="(seg, i) in j.segmentos.value.filter(s => s.tipo !== 'lectura')"
              :key="`b${i}`"
              class="jornada-lecturista__bloque"
              :class="seg.tipo === 'hueco' ? 'jornada-lecturista__bloque--hueco' : 'jornada-lecturista__bloque--silencio'"
              :style="{ insetInlineStart: `${seg.inicio}%`, inlineSize: `${Math.max(0.5, seg.fin - seg.inicio)}%` }"
              :title="seg.etiqueta"
            />
            <div
              v-for="(seg, i) in j.segmentos.value.filter(s => s.tipo === 'lectura')"
              :key="`l${i}`"
              class="jornada-lecturista__marca"
              :class="{ 'jornada-lecturista__marca--anomalia': seg.anomalia, 'jornada-lecturista__marca--lejos': seg.lejos }"
              :style="{ insetInlineStart: `${seg.inicio}%` }"
              :title="seg.etiqueta"
              @click="seg.contrato && emit('toma', seg.contrato)"
            />
          </div>
          <div class="jornada-lecturista__ticks">
            <span
              v-for="tick in ticks"
              :key="tick.etiqueta"
              class="text-caption text-medium-emphasis"
              :style="{ insetInlineStart: `${tick.pct}%` }"
            >{{ tick.etiqueta }}</span>
          </div>
          <div class="mt-3">
            <div class="text-caption text-medium-emphasis">
              {{ t('monitoreo.jornada.huecos', { n: d.parametros.pausa_min }) }}
            </div>
            <div
              v-if="!d.jornada.huecos.length"
              class="text-body-2"
            >
              {{ t('monitoreo.jornada.sinHuecos') }}
            </div>
            <div
              v-for="(h, i) in d.jornada.huecos"
              :key="i"
              class="text-body-2"
            >
              <VIcon
                icon="tabler-clock-pause"
                size="14"
                color="warning"
                class="me-1"
              />{{ t('monitoreo.jornada.hueco', { desde: horaCorta(h.desde), hasta: horaCorta(h.hasta), min: h.minutos }) }}
            </div>
          </div>
          <div
            v-if="d.dispositivo.tramos_sin_senal.length"
            class="mt-2"
          >
            <div class="text-caption text-medium-emphasis">
              {{ t('monitoreo.jornada.tramosSinSenal', { n: d.parametros.silencio_min }) }}
            </div>
            <div
              v-for="(tr, i) in d.dispositivo.tramos_sin_senal"
              :key="i"
              class="text-body-2"
            >
              <VIcon
                icon="tabler-antenna-bars-off"
                size="14"
                color="error"
                class="me-1"
              />{{ tr.abierto ? t('monitoreo.jornada.sinSenalDesde', { hora: horaCorta(tr.desde) }) : t('monitoreo.jornada.hueco', { desde: horaCorta(tr.desde), hasta: horaCorta(tr.hasta), min: tr.minutos }) }}
            </div>
          </div>
        </section>
      </template>

      <!-- Dispositivo -->
      <section class="mt-5">
        <h6 class="text-subtitle-1 font-weight-medium mb-1">
          {{ t('monitoreo.jornada.dispositivo') }}
        </h6>
        <VAlert
          v-if="d.dispositivo.sin_rastreo"
          type="info"
          variant="tonal"
          density="compact"
          class="mb-2"
        >
          {{ t('monitoreo.jornada.sinRastreoDetalle') }}
        </VAlert>
        <VAlert
          v-if="j.atorado.value"
          type="warning"
          variant="tonal"
          density="compact"
          class="mb-2"
        >
          {{ t('monitoreo.jornada.atoradas', { h: d.parametros.atoradas_h }) }}
        </VAlert>
        <div class="d-flex flex-wrap gap-1">
          <VChip
            v-if="d.dispositivo.bateria_min !== null"
            size="small"
            label
            variant="tonal"
            :color="d.avisos.includes('bateria') ? 'error' : undefined"
            prepend-icon="tabler-battery-2"
          >
            {{ t('monitoreo.jornada.bateriaMin', { n: d.dispositivo.bateria_min }) }}<span v-if="d.dispositivo.bateria_actual !== null"> · {{ t('monitoreo.jornada.bateriaActual', { n: d.dispositivo.bateria_actual }) }}</span>
          </VChip>
          <VChip
            v-if="d.dispositivo.version_app"
            size="small"
            label
            variant="tonal"
            prepend-icon="tabler-device-mobile"
          >
            {{ t('monitoreo.jornada.version', { v: d.dispositivo.version_app }) }}
          </VChip>
          <VChip
            v-if="d.dispositivo.datos_moviles !== null"
            size="small"
            label
            variant="tonal"
            :prepend-icon="d.dispositivo.datos_moviles ? 'tabler-antenna-bars-5' : 'tabler-antenna-bars-off'"
          >
            {{ d.dispositivo.datos_moviles ? t('monitoreo.jornada.datosMoviles') : t('monitoreo.jornada.sinDatosMoviles') }}
          </VChip>
          <VChip
            size="small"
            label
            variant="tonal"
            :color="j.atorado.value ? 'warning' : (d.dispositivo.recibos_por_enviar ? undefined : 'success')"
            prepend-icon="tabler-cloud-upload"
          >
            {{ t('monitoreo.jornada.pendientesEnviar', { n: d.dispositivo.recibos_por_enviar }) }}
          </VChip>
          <VChip
            v-if="d.dispositivo.fotos_por_enviar"
            size="small"
            label
            variant="tonal"
            prepend-icon="tabler-photo-up"
          >
            {{ t('monitoreo.jornada.fotosPendientes', { n: n(d.dispositivo.fotos_por_enviar) }) }}
          </VChip>
          <VChip
            v-if="d.dispositivo.ultima_senal"
            size="small"
            label
            variant="tonal"
            prepend-icon="tabler-clock"
          >
            {{ t('monitoreo.jornada.ultimaSenal', { hace: d.es_hoy ? haceCuanto(d.dispositivo.ultima_senal, relativo, ahora) : horaCorta(d.dispositivo.ultima_senal) }) }}
          </VChip>
        </div>
      </section>

      <!-- Lecturas del día -->
      <section class="mt-5">
        <h6 class="text-subtitle-1 font-weight-medium mb-1">
          {{ t('monitoreo.jornada.lecturasDia') }}
          <VChip
            size="x-small"
            variant="tonal"
            class="ms-1"
          >
            {{ n(d.lecturas.length) }}
          </VChip>
        </h6>
        <div
          v-if="!d.lecturas.length"
          class="text-body-2 text-medium-emphasis"
        >
          {{ t('monitoreo.jornada.sinLecturas') }}
        </div>
        <VDataTableVirtual
          v-else
          :headers="[
            { title: t('monitoreo.jornada.hora'), key: 'hora', width: 70 },
            { title: t('monitoreo.jornada.cuenta'), key: 'cuenta', width: 100 },
            { title: t('monitoreo.jornada.sector'), key: 'sector' },
            { title: t('monitoreo.jornada.anomalia'), key: 'anomalia' },
            { title: t('monitoreo.jornada.distancia'), key: 'distancia_m', width: 70, align: 'end' },
          ]"
          :items="d.lecturas"
          :height="Math.min(380, 44 + d.lecturas.length * 36)"
          item-value="id"
          density="compact"
          fixed-header
          hover
          class="jornada-lecturista__tabla"
        >
          <template #item="{ item }">
            <tr
              class="jornada-lecturista__fila"
              @click="emit('toma', item.contrato_id)"
            >
              <td class="text-no-wrap">
                {{ horaCorta(item.hora) }}
              </td>
              <td class="font-weight-medium">
                {{ item.cuenta ?? '—' }}
              </td>
              <td class="text-caption">
                {{ item.sector ?? '—' }}
              </td>
              <td class="text-caption">
                <span :class="{ 'text-warning': item.anomalia }">{{ item.anomalia ?? '—' }}</span>
              </td>
              <td class="text-end text-caption">
                <span :class="{ 'text-error': item.lejos }">{{ item.distancia_m === null ? '—' : `${item.distancia_m} m` }}</span>
              </td>
            </tr>
          </template>
        </VDataTableVirtual>
      </section>
    </div>
  </VNavigationDrawer>
</template>

<style scoped>
.jornada-lecturista__cuerpo {
  overflow-y: auto;
}

.jornada-lecturista__cifras {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.jornada-lecturista__cifra {
  padding: 6px 10px;
  border-radius: 6px;
  background: rgba(var(--v-theme-on-surface), 0.04);
}

.jornada-lecturista__eje {
  position: relative;
  border-radius: 4px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  block-size: 28px;
  margin-block-start: 6px;
}

.jornada-lecturista__bloque {
  position: absolute;
  inset-block: 0;
  border-radius: 3px;
}

.jornada-lecturista__bloque--hueco {
  background: rgba(249, 168, 37, 0.35);
}

.jornada-lecturista__bloque--silencio {
  background: repeating-linear-gradient(45deg, rgba(198, 40, 40, 0.3) 0 4px, transparent 4px 8px);
}

.jornada-lecturista__marca {
  position: absolute;
  inset-block: 4px;
  border-radius: 1px;
  background: #1e88e5;
  cursor: pointer;
  inline-size: 2px;
  transform: translateX(-1px);
}

.jornada-lecturista__marca--anomalia {
  background: #ef6c00;
}

.jornada-lecturista__marca--lejos {
  inset-block: 0;
  background: #c62828;
}

.jornada-lecturista__ticks {
  position: relative;
  block-size: 16px;
}

.jornada-lecturista__ticks span {
  position: absolute;
  font-size: 9px !important;
  transform: translateX(-50%);
}

.jornada-lecturista__fila {
  cursor: pointer;
}

.jornada-lecturista__tabla :deep(th),
.jornada-lecturista__tabla :deep(td) {
  padding-inline: 6px !important;
}
</style>
