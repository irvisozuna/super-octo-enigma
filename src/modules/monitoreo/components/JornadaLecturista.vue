<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useJornada } from '../composables/useJornada'
import type { LecturaJornada } from '../types/jornada'
import { haceCuanto, horaCorta, hoyLocal } from '../utils/tiempo'
import type { ColumnaTabla } from '@/components/as/tipos'
import { TOKEN_LECTURISTA } from '@/utils/estados'
import { decimal, duracion, entero, fechaLarga } from '@/utils/formato'

/*
 * Panel lateral con la jornada de un lecturista en un día (sección F): indicadores del día con su promedio de los
 * últimos tres periodos, línea de tiempo (lecturas, huecos > pausa, tramos sin señal), señales del dispositivo y la
 * lista de lecturas (cada una abre su detalle). Solo lectura. Sobre AsPanelLateral y AsTablaDatos.
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

const { t } = useI18n()
const j = useJornada()

const relativo = (clave: 'nunca' | 'ahora' | 'minutos' | 'horas' | 'dias', valor?: number) => t(`monitoreo.tiempo.${clave}`, { n: valor })

const d = j.datos
const hoy = computed(() => hoyLocal())
const diaActual = computed(() => d.value?.dia ?? props.dia ?? hoy.value)

const textoDia = computed(() => {
  const texto = fechaLarga(`${diaActual.value} 12:00:00`)

  return texto.charAt(0).toUpperCase() + texto.slice(1)
})

interface Indicador { clave: string; valor: string; promedio: string | null; alerta?: boolean }

const indicadores = computed<Indicador[]>(() => {
  const jd = d.value?.jornada
  const p = d.value?.promedio
  if (!jd)
    return []

  return [
    { clave: 'lecturas', valor: entero(jd.lecturas), promedio: p ? entero(p.lecturas) : null },
    { clave: 'porHora', valor: jd.lecturas_por_hora === null ? '—' : decimal(jd.lecturas_por_hora, 1), promedio: p?.lecturas_por_hora != null ? decimal(p.lecturas_por_hora, 1) : null },
    { clave: 'tiempoTotal', valor: duracion(jd.minutos_totales), promedio: p ? duracion(p.minutos_totales) : null },
    { clave: 'tiempoMuerto', valor: duracion(jd.minutos_muertos), promedio: p ? duracion(p.minutos_muertos) : null, alerta: jd.minutos_muertos > 0 },
    { clave: 'anomalias', valor: entero(jd.anomalias), promedio: p ? entero(p.anomalias) : null },
    { clave: 'impresas', valor: entero(jd.impresas), promedio: p ? entero(p.impresas) : null },
    { clave: 'lejos', valor: entero(jd.lejos), promedio: p ? entero(p.lejos) : null, alerta: d.value?.avisos.includes('lejos') },
    { clave: 'sectores', valor: entero(jd.sectores.length), promedio: p ? entero(p.sectores) : null },
    { clave: 'km', valor: jd.km === null ? t('monitoreo.jornada.sinRastreo') : decimal(jd.km, 1), promedio: null },
  ]
})

const ticks = computed(() => {
  const out: { pct: number; etiqueta: string }[] = []
  const { desde, hasta } = j.eje.value
  const paso = hasta - desde > 12 ? 2 : 1
  for (let h = desde; h <= hasta; h += paso)
    out.push({ pct: ((h - desde) / (hasta - desde)) * 100, etiqueta: `${String(h).padStart(2, '0')}h` })

  return out
})

const columnasLecturas = computed<ColumnaTabla<LecturaJornada>[]>(() => [
  { clave: 'hora', titulo: t('monitoreo.jornada.hora'), formato: 'hora', ancho: 64 },
  { clave: 'cuenta', titulo: t('monitoreo.jornada.cuenta'), formato: 'personalizado', ancho: 96 },
  { clave: 'sector', titulo: t('monitoreo.jornada.sector'), formato: 'texto', truncar: true },
  { clave: 'anomalia', titulo: t('monitoreo.jornada.anomalia'), formato: 'personalizado', truncar: true },
  { clave: 'distancia_m', titulo: t('monitoreo.jornada.distancia'), formato: 'personalizado', alineacion: 'end', ancho: 72 },
])

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

function recargar() {
  if (props.lecturista !== null)
    j.cargar(props.lecturista, props.dia)
}

watch(() => [props.abierto, props.lecturista, props.dia] as const, ([abierto, lecturista, dia]) => {
  if (abierto && lecturista !== null)
    j.cargar(lecturista, dia)
  else if (!abierto)
    j.limpiar()
}, { immediate: true })
</script>

<template>
  <AsPanelLateral
    :abierto="abierto"
    :sobrelinea="t('monitoreo.jornada.titulo')"
    :titulo="d?.lecturista.nombre ?? ''"
    :subtitulo="d?.lecturista.gerencia ?? undefined"
    tamano="lg"
    :cargando="j.cargando.value"
    class="jornada-lecturista"
    @update:abierto="(v: boolean) => emit('update:abierto', v)"
  >
    <template
      v-if="d"
      #titulo-extra
    >
      <VChip
        size="small"
        :color="TOKEN_LECTURISTA[d.estado as keyof typeof TOKEN_LECTURISTA] ?? 'secondary'"
        variant="tonal"
        label
      >
        {{ t(`monitoreo.estadoLecturista.${d.estado}`) }}
      </VChip>
    </template>

    <template #acciones>
      <VBtn
        v-if="d"
        size="small"
        variant="text"
        prepend-icon="tabler-route"
        @click="emit('verRecorrido', d.lecturista.id)"
      >
        {{ t('monitoreo.jornada.verRecorrido') }}
      </VBtn>
    </template>

    <template #subencabezado>
      <div
        class="d-flex align-center gap-1"
        role="group"
        :aria-label="t('monitoreo.filtros.dia')"
      >
        <VBtn
          icon="tabler-chevron-left"
          size="small"
          variant="text"
          :aria-label="t('monitoreo.jornada.diaAnterior')"
          @click="cambiarDia(-1)"
        />
        <span class="text-body-2 font-weight-medium">{{ textoDia }}</span>
        <VBtn
          icon="tabler-chevron-right"
          size="small"
          variant="text"
          :disabled="diaActual >= hoy"
          :aria-label="t('monitoreo.jornada.diaSiguiente')"
          @click="cambiarDia(1)"
        />
      </div>
    </template>

    <template v-if="j.error.value && !d">
      <AsEstado
        v-if="j.noVisible.value"
        tipo="sin-permiso"
        :detalle="t('monitoreo.jornada.noVisible')"
      />
      <AsEstado
        v-else
        tipo="error"
        :error="j.error.value"
        @reintentar="recargar"
      />
    </template>

    <AsEstado
      v-else-if="!d"
      tipo="cargando"
      esqueleto="tarjeta"
      :filas="3"
    />

    <template v-else>
      <VAlert
        v-if="j.sinActividad.value"
        type="info"
        variant="tonal"
        density="compact"
        class="mb-3"
      >
        {{ t('monitoreo.jornada.sinActividad', { dia: diaActual }) }}
      </VAlert>

      <template v-if="d.jornada">
        <!-- Cabecera del día -->
        <section>
          <div class="text-body-2 mb-3 as-num">
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
                class="jornada-lecturista__cifra-valor as-num"
                :class="{ 'text-warning': ind.alerta }"
              >
                {{ ind.valor }}
              </div>
              <div class="as-etiqueta">
                {{ etiquetaIndicador(ind.clave) }}
              </div>
              <div
                v-if="ind.promedio !== null"
                class="text-caption text-disabled as-num"
              >
                {{ t('monitoreo.jornada.promedio', { n: ind.promedio }) }}
              </div>
            </div>
          </div>
          <div class="as-secundario mt-2">
            {{ d.promedio ? t('monitoreo.jornada.promedioDetalle', { n: d.promedio.dias }) : t('monitoreo.jornada.sinPromedio') }}
          </div>
          <div
            v-if="d.jornada.sectores.length"
            class="d-flex flex-wrap gap-1 mt-2"
          >
            <VChip
              v-for="s in d.jornada.sectores"
              :key="s.sector_id"
              size="small"
              label
              variant="outlined"
            >
              {{ s.sector }}
            </VChip>
          </div>
        </section>

        <!-- Línea de tiempo -->
        <section>
          <h3 class="as-seccion">
            {{ t('monitoreo.jornada.lineaTiempo') }}
          </h3>
          <div
            class="jornada-lecturista__eje"
            role="img"
            :aria-label="t('monitoreo.jornada.lineaTiempo')"
          >
            <div
              v-for="(seg, i) in j.segmentos.value.filter(s => s.tipo !== 'lectura')"
              :key="`b${i}`"
              class="jornada-lecturista__bloque"
              :class="seg.tipo === 'hueco' ? 'jornada-lecturista__bloque--hueco' : 'jornada-lecturista__bloque--silencio'"
              :style="{ insetInlineStart: `${seg.inicio}%`, inlineSize: `${Math.max(0.5, seg.fin - seg.inicio)}%` }"
              :title="seg.etiqueta"
            />
            <button
              v-for="(seg, i) in j.segmentos.value.filter(s => s.tipo === 'lectura')"
              :key="`l${i}`"
              type="button"
              class="jornada-lecturista__marca"
              :class="seg.lejos ? 'bg-toma-lejos jornada-lecturista__marca--lejos' : seg.anomalia ? 'bg-toma-anomalia' : 'bg-primary'"
              :style="{ insetInlineStart: `${seg.inicio}%` }"
              :title="seg.etiqueta"
              :aria-label="seg.etiqueta"
              @click="seg.contrato && emit('toma', seg.contrato)"
            />
          </div>
          <div class="jornada-lecturista__ticks">
            <span
              v-for="tick in ticks"
              :key="tick.etiqueta"
              class="text-caption text-medium-emphasis as-num"
              :style="{ insetInlineStart: `${tick.pct}%` }"
            >{{ tick.etiqueta }}</span>
          </div>
          <div class="mt-3">
            <div class="as-etiqueta">
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
              class="text-body-2 as-num"
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
            <div class="as-etiqueta">
              {{ t('monitoreo.jornada.tramosSinSenal', { n: d.parametros.silencio_min }) }}
            </div>
            <div
              v-for="(tr, i) in d.dispositivo.tramos_sin_senal"
              :key="i"
              class="text-body-2 as-num"
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
      <section>
        <h3 class="as-seccion">
          {{ t('monitoreo.jornada.dispositivo') }}
        </h3>
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
            {{ t('monitoreo.jornada.fotosPendientes', { n: entero(d.dispositivo.fotos_por_enviar) }) }}
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
      <section>
        <h3 class="as-seccion">
          <span>{{ t('monitoreo.jornada.lecturasDia') }} <span class="as-num text-medium-emphasis font-weight-regular">{{ entero(d.lecturas.length) }}</span></span>
        </h3>
        <AsEstado
          v-if="!d.lecturas.length"
          tipo="vacio"
          compacto
          icono="tabler-list-details"
          :titulo="t('monitoreo.jornada.sinLecturas')"
          detalle=""
        />
        <AsTablaDatos
          v-else
          sin-tarjeta
          densidad="densa"
          virtual
          :altura="Math.min(380, 36 + d.lecturas.length * 36)"
          :columnas="columnasLecturas"
          :filas="d.lecturas"
          clave-fila="id"
          clic-fila
          ocultar-pie
          class="jornada-lecturista__tabla"
          @fila="(f: Record<string, unknown>) => emit('toma', (f as LecturaJornada).contrato_id)"
        >
          <template #celda-cuenta="{ fila }">
            <span class="font-weight-medium as-num">{{ fila.cuenta ?? '—' }}</span>
          </template>
          <template #celda-anomalia="{ fila }">
            <span
              class="d-block text-truncate"
              :class="{ 'text-toma-anomalia-darken-1': fila.anomalia }"
              :title="fila.anomalia ?? ''"
            >{{ fila.anomalia ?? '—' }}</span>
          </template>
          <template #celda-distancia_m="{ fila }">
            <span
              class="as-num"
              :class="{ 'text-error font-weight-medium': fila.lejos }"
            >{{ fila.distancia_m === null ? '—' : `${fila.distancia_m} m` }}</span>
          </template>
        </AsTablaDatos>
      </section>
    </template>
  </AsPanelLateral>
</template>

<style scoped>
.jornada-lecturista__cifras {
  display: grid;
  gap: var(--as-sp-2);
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.jornada-lecturista__cifra {
  border: var(--as-borde);
  border-radius: var(--as-radio-md);
  background: rgb(var(--v-theme-surface-variant));
  padding-block: var(--as-sp-2);
  padding-inline: var(--as-sp-3);
}

.jornada-lecturista__cifra-valor {
  font-size: var(--as-fs-lg);
  font-weight: var(--as-peso-semi);
  line-height: 1.3;
}

.jornada-lecturista__eje {
  position: relative;
  border-radius: var(--as-radio-sm);
  background: rgb(var(--v-theme-surface-variant));
  block-size: 28px;
  margin-block-start: var(--as-sp-2);
}

.jornada-lecturista__bloque {
  position: absolute;
  border-radius: 3px;
  inset-block: 0;
}

.jornada-lecturista__bloque--hueco {
  background: rgba(var(--v-theme-warning), 0.3);
}

.jornada-lecturista__bloque--silencio {
  background: repeating-linear-gradient(45deg, rgba(var(--v-theme-error), 0.3) 0 4px, transparent 4px 8px);
}

.jornada-lecturista__marca {
  position: absolute;
  border: 0;
  border-radius: 1px;
  cursor: pointer;
  inline-size: 2px;
  inset-block: 4px;
  padding-block: 0;
  padding-inline: 0;
  transform: translateX(-1px);
}

.jornada-lecturista__marca:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}

.jornada-lecturista__marca--lejos {
  inset-block: 0;
}

.jornada-lecturista__ticks {
  position: relative;
  block-size: 1rem;
}

.jornada-lecturista__ticks span {
  position: absolute;
  transform: translateX(-50%);
}

.jornada-lecturista__tabla {
  border: var(--as-borde);
  border-radius: var(--as-radio-md);
}
</style>
