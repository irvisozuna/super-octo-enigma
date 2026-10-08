<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { serieHoraria, useDetalleSector } from '../composables/useDetalleSector'
import type { ParametrosMonitor } from '../types/monitor'
import type { PendienteSector } from '../types/sector'
import { fechaCorta, haceCuanto, horaCorta } from '../utils/tiempo'
import type { ColumnaTabla } from '@/components/as/tipos'
import { TOKEN_SECTOR, tokenAvance } from '@/utils/estados'
import { entero, porcentaje } from '@/utils/formato'

/*
 * Panel lateral con el detalle de un sector (respuesta D4): avance del periodo, lecturistas asignados según Aquasoft
 * Comercial frente a quienes leyeron, línea de tiempo por día y por hora, pendientes por secuencia y exportación a
 * Excel. Solo lectura; la reasignación llega en F3.9. Sobre AsPanelLateral y AsTablaDatos del sistema de diseño.
 */
const props = defineProps<{
  abierto: boolean
  sector: number | null
  parametros: ParametrosMonitor
  ahora: Date
}>()

const emit = defineEmits<{
  'update:abierto': [valor: boolean]
  'verEnMapa': [sector: number]
  'toma': [contrato: number]
}>()

const { t } = useI18n()
const datos = useDetalleSector()
const vistaTiempo = ref<'dias' | 'horas_dia' | 'horas_periodo'>('horas_dia')
const busqueda = ref('')

const relativo = (clave: 'nunca' | 'ahora' | 'minutos' | 'horas' | 'dias', valor?: number) => t(`monitoreo.tiempo.${clave}`, { n: valor })

const avance = datos.avance
const detalle = datos.detalle

const diasParaCerrar = computed(() => {
  const a = avance.value
  if (!a?.primera_lectura)
    return null
  const inicio = new Date(`${a.primera_lectura.replace(' ', 'T')}-07:00`)
  const fin = a.estado === 'terminado' && a.ultima_lectura ? new Date(`${a.ultima_lectura.replace(' ', 'T')}-07:00`) : props.ahora

  return Math.max(1, Math.floor((fin.getTime() - inicio.getTime()) / 86400000) + 1)
})

const serie = computed(() => {
  const lt = detalle.value?.linea_tiempo
  if (!lt)
    return [] as { etiqueta: string; lecturas: number }[]
  if (vistaTiempo.value === 'dias')
    return lt.dias.map(d => ({ etiqueta: fechaCorta(`${d.fecha} 12:00:00`), lecturas: d.lecturas }))

  return serieHoraria(vistaTiempo.value === 'horas_dia' ? lt.horas_dia : lt.horas_periodo).map(h => ({ etiqueta: `${String(h.hora).padStart(2, '0')}h`, lecturas: h.lecturas }))
})

const maxSerie = computed(() => Math.max(1, ...serie.value.map(s => s.lecturas)))
const totalSerie = computed(() => serie.value.reduce((a, b) => a + b.lecturas, 0))

/** Con muchas barras solo se etiquetan algunas para que el texto siga siendo legible (12 px). */
const pasoEtiquetas = computed(() => Math.max(1, Math.ceil(serie.value.length / 8)))

const cifras = computed(() => {
  const a = avance.value
  if (!a)
    return []

  return [
    { clave: 'esperadas', valor: a.esperadas },
    { clave: 'leidas', valor: a.leidas },
    { clave: 'anomalias', valor: a.con_anomalia },
    { clave: 'estimadas', valor: a.estimadas },
    { clave: 'tarifaFija', valor: a.tarifa_fija },
    { clave: 'pendientes', valor: a.pendientes, alerta: a.pendientes > 0 },
  ]
})

const pendientesFiltrados = computed(() => {
  const lista = detalle.value?.pendientes ?? []
  const q = busqueda.value.trim().toLowerCase()
  if (!q)
    return lista

  return lista.filter(p => p.cuenta.toLowerCase().includes(q) || (p.nombre ?? '').toLowerCase().includes(q) || (p.direccion ?? '').toLowerCase().includes(q))
})

const columnasPendientes = computed<ColumnaTabla<PendienteSector>[]>(() => [
  { clave: 'secuencia', titulo: t('monitoreo.sector.secuencia'), formato: 'entero', ancho: 56 },
  { clave: 'cuenta', titulo: t('monitoreo.sector.cuenta'), formato: 'personalizado', ancho: 96 },
  { clave: 'nombre', titulo: t('monitoreo.sector.nombre'), formato: 'personalizado' },
  { clave: 'manzana', titulo: t('monitoreo.sector.manzana'), formato: 'texto', ancho: 56 },
  { clave: 'lote', titulo: t('monitoreo.sector.lote'), formato: 'texto', ancho: 56 },
  { clave: 'ultima_lectura', titulo: t('monitoreo.sector.ultimaConocida'), formato: 'personalizado', ancho: 120, ordenable: false },
])

function fechaHora(valor: string | null | undefined): string {
  return valor ? `${fechaCorta(valor)} ${horaCorta(valor)}` : '—'
}

function ultimaConocida(p: PendienteSector): string {
  if (!p.ultima_lectura)
    return '—'

  return `${p.ultima_lectura.periodo ?? ''}${p.ultima_lectura.actual !== null ? ` · ${entero(p.ultima_lectura.actual)}` : ''}`.trim()
}

function recargar() {
  if (props.sector !== null)
    datos.cargar(props.sector, props.parametros)
}

watch(() => [props.abierto, props.sector, JSON.stringify(props.parametros)] as const, ([abierto, sector]) => {
  if (abierto && sector !== null)
    datos.cargar(sector, props.parametros)
  else if (!abierto)
    datos.limpiar()
}, { immediate: true })

watch(() => detalle.value, d => {
  // Sin lecturas el día elegido, la vista por hora del periodo o por día dice más
  if (d && !d.linea_tiempo.horas_dia.length)
    vistaTiempo.value = d.linea_tiempo.dias.length > 1 ? 'dias' : 'horas_periodo'
  else if (d)
    vistaTiempo.value = 'horas_dia'
})
</script>

<template>
  <AsPanelLateral
    :abierto="abierto"
    :sobrelinea="t('monitoreo.sector.titulo')"
    :titulo="detalle?.sector.nombre ?? ''"
    tamano="lg"
    :cargando="datos.cargando.value"
    class="detalle-sector"
    @update:abierto="(v: boolean) => emit('update:abierto', v)"
  >
    <template #acciones>
      <VBtn
        v-if="detalle"
        size="small"
        variant="text"
        prepend-icon="tabler-current-location"
        @click="emit('verEnMapa', detalle.sector.id)"
      >
        {{ t('monitoreo.sector.verEnMapa') }}
      </VBtn>
    </template>

    <template
      v-if="detalle"
      #subencabezado
    >
      <div class="d-flex flex-wrap gap-1">
        <VChip
          v-if="detalle.sector.sistema"
          size="small"
          label
          variant="tonal"
        >
          {{ detalle.sector.sistema }}
        </VChip>
        <VChip
          v-if="detalle.sector.gerencia"
          size="small"
          label
          variant="tonal"
          prepend-icon="tabler-map-pin"
        >
          {{ detalle.sector.gerencia }}
        </VChip>
        <VChip
          v-if="avance"
          size="small"
          label
          variant="tonal"
          :color="TOKEN_SECTOR[avance.estado] ?? 'secondary'"
        >
          {{ t(`monitoreo.estadoSector.${avance.estado}`) }}
        </VChip>
        <VChip
          v-if="!detalle.sector.tiene_contorno"
          size="small"
          label
          variant="outlined"
        >
          {{ t('monitoreo.sector.sinContorno') }}
        </VChip>
        <VChip
          v-if="!detalle.sector.activo"
          size="small"
          label
          color="warning"
          variant="tonal"
        >
          {{ t('monitoreo.sector.inactivo') }}
        </VChip>
      </div>
    </template>

    <!-- Error o sin permiso -->
    <template v-if="datos.error.value && !detalle">
      <AsEstado
        v-if="datos.noVisible.value"
        tipo="sin-permiso"
        :detalle="t('monitoreo.sector.noVisible')"
      />
      <AsEstado
        v-else
        tipo="error"
        :error="datos.error.value"
        @reintentar="recargar"
      />
    </template>

    <AsEstado
      v-else-if="!detalle"
      tipo="cargando"
      esqueleto="tarjeta"
      :filas="3"
    />

    <template v-else>
      <!-- Avance -->
      <section>
        <h3 class="as-seccion">
          {{ t('monitoreo.sector.avance', { periodo: detalle.periodo?.nombre ?? '—' }) }}
        </h3>
        <VAlert
          v-if="!avance"
          type="info"
          variant="tonal"
          density="compact"
        >
          {{ t('monitoreo.sector.sinAvance', { periodo: detalle.periodo?.nombre ?? '—' }) }}
        </VAlert>
        <template v-else>
          <div class="d-flex align-baseline flex-wrap gap-x-2">
            <span class="detalle-sector__pct as-num">{{ avance.pct_campo === null ? '—' : porcentaje(avance.pct_campo) }}</span>
            <span
              v-if="avance.pct_total !== null && avance.pct_total !== avance.pct_campo"
              class="text-body-2 text-medium-emphasis"
            >{{ t('monitoreo.sector.conEstimadas', { pct: porcentaje(avance.pct_total) }) }}</span>
          </div>
          <VProgressLinear
            :model-value="avance.pct_campo ?? 0"
            :color="tokenAvance(avance.pct_campo)"
            height="6"
            rounded
            class="my-2"
            :aria-label="t('monitoreo.indicadores.avance')"
          />
          <div class="as-secundario as-num mb-3">
            {{ t('monitoreo.sector.atendidas', { a: entero(avance.atendidas), e: entero(avance.esperadas) }) }}
          </div>
          <VAlert
            v-if="datos.soloTarifaFija.value"
            type="info"
            variant="tonal"
            density="compact"
            class="mb-3"
          >
            {{ t('monitoreo.sector.soloTarifaFija', { n: avance.tarifa_fija }) }}
          </VAlert>
          <div class="detalle-sector__cifras">
            <div
              v-for="c in cifras"
              :key="c.clave"
              class="detalle-sector__cifra"
            >
              <div
                class="detalle-sector__cifra-valor as-num"
                :class="{ 'text-error': c.alerta }"
              >
                {{ entero(c.valor) }}
              </div>
              <div class="as-etiqueta">
                {{ t(`monitoreo.sector.${c.clave}`) }}
              </div>
            </div>
          </div>
          <div
            v-if="avance.lecturas_extra"
            class="as-secundario mt-1"
          >
            {{ t('monitoreo.sector.lecturasExtra', { n: avance.lecturas_extra }) }}
          </div>

          <dl class="as-datos mt-3 mb-0">
            <div class="as-dato">
              <dt class="as-etiqueta">
                {{ t('monitoreo.sector.primera') }}
              </dt>
              <dd class="as-valor as-num mb-0">
                {{ fechaHora(avance.primera_lectura) }}
              </dd>
            </div>
            <div class="as-dato">
              <dt class="as-etiqueta">
                {{ t('monitoreo.sector.ultima') }}
              </dt>
              <dd class="as-valor as-num mb-0">
                {{ fechaHora(avance.ultima_lectura) }}
              </dd>
            </div>
            <div class="as-dato">
              <dt class="as-etiqueta">
                {{ t('monitoreo.sector.dias') }}
              </dt>
              <dd class="as-valor as-num mb-0">
                {{ avance.dias_activo || '—' }}<span
                  v-if="diasParaCerrar"
                  class="text-medium-emphasis font-weight-regular"
                > · {{ t('monitoreo.sector.diasParaCerrar') }} {{ diasParaCerrar }}</span>
              </dd>
            </div>
            <div class="as-dato">
              <dt class="as-etiqueta">
                {{ t('monitoreo.sector.programada') }} / {{ t('monitoreo.sector.limite') }}
              </dt>
              <dd class="as-valor as-num mb-0">
                {{ avance.fecha_programada ? fechaCorta(`${avance.fecha_programada} 12:00:00`) : '—' }} / {{ avance.fecha_limite ? fechaCorta(`${avance.fecha_limite} 12:00:00`) : '—' }}
              </dd>
            </div>
          </dl>
          <div
            v-if="!avance.fecha_programada && !avance.fecha_limite"
            class="text-caption text-disabled mt-1"
          >
            {{ t('monitoreo.sector.sinCalendario') }}
          </div>
        </template>
      </section>

      <!-- Lecturistas -->
      <section>
        <h3 class="as-seccion mb-0">
          {{ t('monitoreo.sector.lecturistas') }}
        </h3>
        <div class="as-secundario mb-2">
          {{ t('monitoreo.sector.asignadosVsLeyeron') }}
        </div>
        <AsEstado
          v-if="!detalle.lecturistas.length"
          tipo="vacio"
          compacto
          icono="tabler-user-off"
          :titulo="t('monitoreo.sector.sinLecturistas')"
          detalle=""
        />
        <VList
          v-else
          density="compact"
          class="py-0 detalle-sector__lista"
        >
          <VListItem
            v-for="l in detalle.lecturistas"
            :key="l.lecturista_id"
          >
            <template #prepend>
              <VIcon
                :icon="l.asignado ? 'tabler-user-check' : 'tabler-user-exclamation'"
                :color="l.asignado ? (l.lecturas ? 'success' : 'secondary') : 'warning'"
                size="20"
                class="me-2"
              />
            </template>
            <VListItemTitle class="d-flex flex-wrap align-center gap-1">
              <span class="font-weight-medium">{{ l.nombre }}</span>
              <VChip
                v-if="!l.asignado"
                size="x-small"
                color="warning"
                variant="tonal"
                label
              >
                {{ t('monitoreo.sector.noAsignado') }}
              </VChip>
              <VChip
                v-else-if="!l.lecturas"
                size="x-small"
                variant="outlined"
                label
              >
                {{ t('monitoreo.sector.sinLeer') }}
              </VChip>
              <VChip
                v-else
                size="x-small"
                variant="tonal"
                label
              >
                {{ t('monitoreo.sector.asignado') }}
              </VChip>
            </VListItemTitle>
            <VListItemSubtitle class="as-num">
              <span v-if="l.lecturas">{{ t('monitoreo.sector.lecturasN', { n: l.lecturas }) }}<span v-if="l.pct !== null"> ({{ porcentaje(l.pct) }})</span> · {{ horaCorta(l.primera) }}–{{ horaCorta(l.ultima) }}</span>
              <span v-if="l.ultima_senal"><span v-if="l.lecturas"> · </span>{{ t('monitoreo.sector.ultimaSenal', { hace: haceCuanto(l.ultima_senal, relativo, ahora) }) }}</span>
            </VListItemSubtitle>
          </VListItem>
        </VList>
      </section>

      <!-- Línea de tiempo -->
      <section>
        <h3 class="as-seccion">
          <span>{{ t('monitoreo.sector.lineaTiempo') }}</span>
          <VChipGroup
            v-model="vistaTiempo"
            mandatory
            selected-class="text-primary"
            class="detalle-sector__vistas"
          >
            <VChip
              value="horas_dia"
              size="small"
              label
              filter
            >
              {{ t('monitoreo.sector.porHoraDia', { dia: fechaCorta(`${detalle.dia} 12:00:00`) }) }}
            </VChip>
            <VChip
              value="horas_periodo"
              size="small"
              label
              filter
            >
              {{ t('monitoreo.sector.porHoraPeriodo') }}
            </VChip>
            <VChip
              value="dias"
              size="small"
              label
              filter
            >
              {{ t('monitoreo.sector.porDia') }}
            </VChip>
          </VChipGroup>
        </h3>
        <AsEstado
          v-if="!totalSerie"
          tipo="vacio"
          compacto
          icono="tabler-chart-bar-off"
          :titulo="t('monitoreo.sector.sinLecturas')"
          detalle=""
        />
        <template v-else>
          <div class="as-secundario as-num">
            {{ t('monitoreo.sector.lecturasEn', { n: entero(totalSerie) }) }}
          </div>
          <div
            class="detalle-sector__grafica"
            role="img"
            :aria-label="t('monitoreo.sector.lineaTiempo')"
          >
            <div
              v-for="(p, i) in serie"
              :key="i"
              class="detalle-sector__barra"
              :title="`${p.etiqueta}: ${entero(p.lecturas)}`"
            >
              <div
                class="detalle-sector__barra-relleno bg-primary"
                :style="{ blockSize: `${Math.max(p.lecturas ? 3 : 0, (p.lecturas / maxSerie) * 56)}px` }"
              />
              <div class="detalle-sector__barra-etiqueta text-caption text-medium-emphasis as-num">
                {{ i % pasoEtiquetas === 0 ? p.etiqueta : '' }}
              </div>
            </div>
          </div>
        </template>
      </section>

      <!-- Pendientes -->
      <section>
        <h3 class="as-seccion">
          <span>{{ t('monitoreo.sector.listaPendientes') }} <span class="as-num text-medium-emphasis font-weight-regular">{{ entero(pendientesFiltrados.length) }}</span></span>
          <VBtn
            v-if="detalle.pendientes.length"
            size="small"
            variant="tonal"
            color="primary"
            prepend-icon="tabler-file-spreadsheet"
            :loading="datos.exportando.value"
            @click="datos.exportar()"
          >
            {{ t('monitoreo.sector.exportar') }}
          </VBtn>
        </h3>
        <VAlert
          v-if="datos.errorExportar.value"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-2"
        >
          {{ datos.errorExportar.value.mensaje || t('monitoreo.sector.exportarError') }}
        </VAlert>
        <AsEstado
          v-if="!detalle.pendientes.length"
          tipo="vacio"
          compacto
          icono="tabler-circle-check"
          :titulo="t('monitoreo.sector.sinPendientes')"
          detalle=""
        />
        <AsTablaDatos
          v-else
          sin-tarjeta
          densidad="densa"
          virtual
          :altura="Math.min(420, 36 + Math.max(1, pendientesFiltrados.length) * 44)"
          :columnas="columnasPendientes"
          :filas="pendientesFiltrados"
          clave-fila="contrato_id"
          clic-fila
          :busqueda="busqueda"
          :placeholder-busqueda="t('monitoreo.sector.buscarPendiente')"
          :vacio-titulo="t('monitoreo.sector.sinPendientes')"
          vacio-detalle=""
          ocultar-pie
          class="detalle-sector__tabla"
          @update:busqueda="(q: string) => { busqueda = q }"
          @fila="(f: Record<string, unknown>) => emit('toma', (f as PendienteSector).contrato_id)"
        >
          <template #celda-cuenta="{ fila }">
            <span class="font-weight-medium as-num">{{ fila.cuenta }}</span>
          </template>
          <template #celda-nombre="{ fila }">
            <div class="text-truncate detalle-sector__nombre">
              {{ fila.nombre ?? '—' }}
            </div>
            <div class="as-secundario text-truncate detalle-sector__nombre">
              {{ fila.direccion ?? '' }}
            </div>
            <div
              v-if="fila.sin_coordenada || fila.estimada"
              class="d-flex gap-1 mt-1"
            >
              <VChip
                v-if="fila.sin_coordenada"
                size="x-small"
                color="warning"
                variant="tonal"
                label
              >
                {{ t('monitoreo.sector.sinCoordenada') }}
              </VChip>
              <VChip
                v-if="fila.estimada"
                size="x-small"
                color="toma-estimada"
                variant="tonal"
                label
              >
                {{ t('monitoreo.sector.estimada') }}
              </VChip>
            </div>
          </template>
          <template #celda-ultima_lectura="{ fila }">
            <span class="as-secundario as-num">{{ ultimaConocida(fila) }}</span>
          </template>
        </AsTablaDatos>
      </section>
    </template>
  </AsPanelLateral>
</template>

<style scoped>
.detalle-sector__pct {
  font-size: var(--as-fs-2xl);
  font-weight: var(--as-peso-semi);
  letter-spacing: -0.01em;
  line-height: 1.2;
}

.detalle-sector__cifras {
  display: grid;
  gap: var(--as-sp-2);
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.detalle-sector__cifra {
  border: var(--as-borde);
  border-radius: var(--as-radio-md);
  background: rgb(var(--v-theme-surface-variant));
  padding-block: var(--as-sp-2);
  padding-inline: var(--as-sp-3);
}

.detalle-sector__cifra-valor {
  font-size: var(--as-fs-lg);
  font-weight: var(--as-peso-semi);
  line-height: 1.3;
}

.detalle-sector__lista :deep(.v-list-item) {
  min-block-size: 32px;
  padding-inline: 0;
}

.detalle-sector__grafica {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  margin-block-start: var(--as-sp-2);
  min-block-size: 76px;
}

.detalle-sector__barra {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  min-inline-size: 0;
}

.detalle-sector__barra-relleno {
  border-radius: 2px 2px 0 0;
  inline-size: 100%;
}

.detalle-sector__barra-etiqueta {
  overflow: hidden;
  block-size: 1rem;
  line-height: 1.4;
  white-space: nowrap;
}

.detalle-sector__vistas :deep(.v-slide-group__content) {
  gap: var(--as-sp-1);
}

.detalle-sector__nombre {
  max-inline-size: 24ch;
}

.detalle-sector__tabla {
  border: var(--as-borde);
  border-radius: var(--as-radio-md);
}
</style>
