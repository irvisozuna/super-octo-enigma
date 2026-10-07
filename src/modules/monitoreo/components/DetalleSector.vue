<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { serieHoraria, useDetalleSector } from '../composables/useDetalleSector'
import type { ParametrosMonitor } from '../types/monitor'
import type { PendienteSector } from '../types/sector'
import { COLORES_SECTOR } from '../utils/geojson'
import { fechaCorta, haceCuanto, horaCorta } from '../utils/tiempo'
import EstadoError from '@/modules/reportes/components/comunes/EstadoError.vue'

/*
 * Panel lateral con el detalle de un sector (respuesta D4): avance del periodo, lecturistas asignados según Aquasoft Comercial
 * frente a quienes leyeron, línea de tiempo por día y por hora, pendientes por secuencia y exportación a Excel.
 * Solo lectura; la reasignación llega en F3.9.
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

const { t, n } = useI18n()
const datos = useDetalleSector()
const vistaTiempo = ref<'dias' | 'horas_dia' | 'horas_periodo'>('horas_dia')
const busqueda = ref('')

const relativo = (clave: 'nunca' | 'ahora' | 'minutos' | 'horas' | 'dias', valor?: number) => t(`monitoreo.tiempo.${clave}`, { n: valor })

const avance = datos.avance

const colorEstado = computed(() => (avance.value ? COLORES_SECTOR[avance.value.estado] ?? '#bdbdbd' : '#bdbdbd'))

const diasParaCerrar = computed(() => {
  const a = avance.value
  if (!a?.primera_lectura)
    return null
  const inicio = new Date(`${a.primera_lectura.replace(' ', 'T')}-07:00`)
  const fin = a.estado === 'terminado' && a.ultima_lectura ? new Date(`${a.ultima_lectura.replace(' ', 'T')}-07:00`) : props.ahora

  return Math.max(1, Math.floor((fin.getTime() - inicio.getTime()) / 86400000) + 1)
})

const serie = computed(() => {
  const lt = datos.detalle.value?.linea_tiempo
  if (!lt)
    return [] as { etiqueta: string; lecturas: number }[]
  if (vistaTiempo.value === 'dias')
    return lt.dias.map(d => ({ etiqueta: fechaCorta(`${d.fecha} 12:00:00`), lecturas: d.lecturas }))

  return serieHoraria(vistaTiempo.value === 'horas_dia' ? lt.horas_dia : lt.horas_periodo).map(h => ({ etiqueta: `${String(h.hora).padStart(2, '0')}h`, lecturas: h.lecturas }))
})

const maxSerie = computed(() => Math.max(1, ...serie.value.map(s => s.lecturas)))
const totalSerie = computed(() => serie.value.reduce((a, b) => a + b.lecturas, 0))

const pendientesFiltrados = computed(() => {
  const lista = datos.detalle.value?.pendientes ?? []
  const q = busqueda.value.trim().toLowerCase()
  if (!q)
    return lista

  return lista.filter(p => p.cuenta.toLowerCase().includes(q) || (p.nombre ?? '').toLowerCase().includes(q) || (p.direccion ?? '').toLowerCase().includes(q))
})

const headersPendientes = computed(() => [
  { title: t('monitoreo.sector.secuencia'), key: 'secuencia', width: 56, align: 'end' as const },
  { title: t('monitoreo.sector.cuenta'), key: 'cuenta', width: 96 },
  { title: t('monitoreo.sector.nombre'), key: 'nombre' },
  { title: t('monitoreo.sector.manzana'), key: 'manzana', width: 56 },
  { title: t('monitoreo.sector.lote'), key: 'lote', width: 56 },
  { title: t('monitoreo.sector.ultimaConocida'), key: 'ultima_lectura', width: 120, sortable: false },
])

function fmt(v: number | null | undefined): string {
  return v === null || v === undefined ? '—' : n(v)
}

function fechaHora(valor: string | null | undefined): string {
  return valor ? `${fechaCorta(valor)} ${horaCorta(valor)}` : '—'
}

function ultimaConocida(p: PendienteSector): string {
  if (!p.ultima_lectura)
    return '—'

  return `${p.ultima_lectura.periodo ?? ''}${p.ultima_lectura.actual !== null ? ` · ${fmt(p.ultima_lectura.actual)}` : ''}`.trim()
}

function cerrar() {
  emit('update:abierto', false)
}

watch(() => [props.abierto, props.sector, JSON.stringify(props.parametros)] as const, ([abierto, sector]) => {
  if (abierto && sector !== null)
    datos.cargar(sector, props.parametros)
  else if (!abierto)
    datos.limpiar()
}, { immediate: true })

watch(() => datos.detalle.value, d => {
  // Sin lecturas el día elegido, la vista por hora del periodo o por día dice más
  if (d && !d.linea_tiempo.horas_dia.length)
    vistaTiempo.value = d.linea_tiempo.dias.length > 1 ? 'dias' : 'horas_periodo'
  else if (d)
    vistaTiempo.value = 'horas_dia'
})
</script>

<template>
  <VNavigationDrawer
    :model-value="abierto"
    location="end"
    temporary
    :width="560"
    class="detalle-sector"
    @update:model-value="(v: boolean) => emit('update:abierto', v)"
  >
    <div class="d-flex align-center justify-space-between px-4 pt-3 pb-2">
      <div>
        <div class="text-overline text-medium-emphasis">
          {{ t('monitoreo.sector.titulo') }}
        </div>
        <div
          v-if="datos.detalle.value"
          class="text-h6"
        >
          {{ datos.detalle.value.sector.nombre }}
        </div>
      </div>
      <div class="d-flex align-center gap-1">
        <VBtn
          v-if="datos.detalle.value"
          size="small"
          variant="text"
          prepend-icon="tabler-current-location"
          class="text-none"
          @click="emit('verEnMapa', datos.detalle.value.sector.id)"
        >
          {{ t('monitoreo.sector.verEnMapa') }}
        </VBtn>
        <VBtn
          icon="tabler-x"
          variant="text"
          size="small"
          :aria-label="t('monitoreo.sector.cerrar')"
          @click="cerrar"
        />
      </div>
    </div>
    <VDivider />

    <VProgressLinear
      v-if="datos.cargando.value"
      indeterminate
    />

    <div
      v-if="datos.error.value && !datos.detalle.value"
      class="pa-4"
    >
      <VAlert
        v-if="datos.noVisible.value"
        type="warning"
        variant="tonal"
        density="compact"
      >
        {{ t('monitoreo.sector.noVisible') }}
      </VAlert>
      <EstadoError
        v-else
        :error="datos.error.value"
        @reintentar="props.sector !== null && datos.cargar(props.sector, props.parametros)"
      />
    </div>

    <div
      v-else-if="datos.detalle.value"
      class="detalle-sector__cuerpo px-4 pb-6"
    >
      <!-- Cabecera -->
      <section class="mt-3">
        <div class="d-flex flex-wrap gap-1">
          <VChip
            v-if="datos.detalle.value.sector.sistema"
            size="x-small"
            label
            variant="tonal"
          >
            {{ datos.detalle.value.sector.sistema }}
          </VChip>
          <VChip
            v-if="datos.detalle.value.sector.gerencia"
            size="x-small"
            label
            variant="tonal"
            prepend-icon="tabler-map-pin"
          >
            {{ datos.detalle.value.sector.gerencia }}
          </VChip>
          <VChip
            v-if="avance"
            size="x-small"
            label
            :style="{ backgroundColor: `${colorEstado}22`, color: colorEstado }"
          >
            {{ t(`monitoreo.estadoSector.${avance.estado}`) }}
          </VChip>
          <VChip
            v-if="!datos.detalle.value.sector.tiene_contorno"
            size="x-small"
            label
            variant="outlined"
          >
            {{ t('monitoreo.sector.sinContorno') }}
          </VChip>
          <VChip
            v-if="!datos.detalle.value.sector.activo"
            size="x-small"
            label
            color="warning"
            variant="tonal"
          >
            {{ t('monitoreo.sector.inactivo') }}
          </VChip>
        </div>
      </section>

      <!-- Avance -->
      <section class="mt-4">
        <h6 class="text-subtitle-1 font-weight-medium mb-1">
          {{ t('monitoreo.sector.avance', { periodo: datos.detalle.value.periodo?.nombre ?? '—' }) }}
        </h6>
        <VAlert
          v-if="!avance"
          type="info"
          variant="tonal"
          density="compact"
        >
          {{ t('monitoreo.sector.sinAvance', { periodo: datos.detalle.value.periodo?.nombre ?? '—' }) }}
        </VAlert>
        <template v-else>
          <div class="d-flex align-baseline gap-2">
            <span class="text-h4 font-weight-bold">{{ avance.pct_campo === null ? '—' : `${n(avance.pct_campo)} %` }}</span>
            <span
              v-if="avance.pct_total !== null && avance.pct_total !== avance.pct_campo"
              class="text-body-2 text-medium-emphasis"
            >{{ t('monitoreo.sector.conEstimadas', { pct: n(avance.pct_total) }) }}</span>
          </div>
          <VProgressLinear
            :model-value="avance.pct_campo ?? 0"
            :color="(avance.pct_campo ?? 0) >= 98 ? 'success' : (avance.pct_campo ?? 0) >= 90 ? 'warning' : 'primary'"
            height="6"
            rounded
            class="my-2"
          />
          <div class="text-caption text-medium-emphasis mb-2">
            {{ t('monitoreo.sector.atendidas', { a: fmt(avance.atendidas), e: fmt(avance.esperadas) }) }}
          </div>
          <VAlert
            v-if="datos.soloTarifaFija.value"
            type="info"
            variant="tonal"
            density="compact"
            class="mb-2"
          >
            {{ t('monitoreo.sector.soloTarifaFija', { n: avance.tarifa_fija }) }}
          </VAlert>
          <div class="detalle-sector__cifras">
            <div
              v-for="c in ([['esperadas', avance.esperadas], ['leidas', avance.leidas], ['anomalias', avance.con_anomalia], ['estimadas', avance.estimadas], ['tarifaFija', avance.tarifa_fija], ['pendientes', avance.pendientes]] as [string, number][])"
              :key="c[0]"
              class="detalle-sector__cifra"
            >
              <div
                class="text-h6"
                :class="{ 'text-error': c[0] === 'pendientes' && c[1] > 0 }"
              >
                {{ fmt(c[1]) }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ t(`monitoreo.sector.${c[0]}`) }}
              </div>
            </div>
          </div>
          <div
            v-if="avance.lecturas_extra"
            class="text-caption text-medium-emphasis mt-1"
          >
            {{ t('monitoreo.sector.lecturasExtra', { n: avance.lecturas_extra }) }}
          </div>
          <VList
            density="compact"
            class="py-0 mt-2 detalle-sector__lista"
          >
            <VListItem :title="t('monitoreo.sector.primera')">
              <template #append>
                <span class="font-weight-medium">{{ fechaHora(avance.primera_lectura) }}</span>
              </template>
            </VListItem>
            <VListItem :title="t('monitoreo.sector.ultima')">
              <template #append>
                <span class="font-weight-medium">{{ fechaHora(avance.ultima_lectura) }}</span>
              </template>
            </VListItem>
            <VListItem :title="t('monitoreo.sector.dias')">
              <template #append>
                <span class="font-weight-medium">{{ avance.dias_activo || '—' }}<span
                  v-if="diasParaCerrar"
                  class="text-medium-emphasis"
                > · {{ t('monitoreo.sector.diasParaCerrar') }} {{ diasParaCerrar }}</span></span>
              </template>
            </VListItem>
            <VListItem :title="`${t('monitoreo.sector.programada')} / ${t('monitoreo.sector.limite')}`">
              <template #append>
                <span class="font-weight-medium">{{ avance.fecha_programada ? fechaCorta(`${avance.fecha_programada} 12:00:00`) : '—' }} / {{ avance.fecha_limite ? fechaCorta(`${avance.fecha_limite} 12:00:00`) : '—' }}</span>
              </template>
            </VListItem>
          </VList>
          <div
            v-if="!avance.fecha_programada && !avance.fecha_limite"
            class="text-caption text-disabled"
          >
            {{ t('monitoreo.sector.sinCalendario') }}
          </div>
        </template>
      </section>

      <!-- Lecturistas -->
      <section class="mt-5">
        <h6 class="text-subtitle-1 font-weight-medium mb-0">
          {{ t('monitoreo.sector.lecturistas') }}
        </h6>
        <div class="text-caption text-medium-emphasis mb-2">
          {{ t('monitoreo.sector.asignadosVsLeyeron') }}
        </div>
        <div
          v-if="!datos.detalle.value.lecturistas.length"
          class="text-body-2 text-medium-emphasis"
        >
          {{ t('monitoreo.sector.sinLecturistas') }}
        </div>
        <VList
          v-else
          density="compact"
          class="py-0 detalle-sector__lista"
        >
          <VListItem
            v-for="l in datos.detalle.value.lecturistas"
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
            <VListItemSubtitle>
              <span v-if="l.lecturas">{{ t('monitoreo.sector.lecturasN', { n: l.lecturas }) }}<span v-if="l.pct !== null"> ({{ n(l.pct) }} %)</span> · {{ horaCorta(l.primera) }}–{{ horaCorta(l.ultima) }}</span>
              <span v-if="l.ultima_senal"><span v-if="l.lecturas"> · </span>{{ t('monitoreo.sector.ultimaSenal', { hace: haceCuanto(l.ultima_senal, relativo, ahora) }) }}</span>
            </VListItemSubtitle>
          </VListItem>
        </VList>
      </section>

      <!-- Línea de tiempo -->
      <section class="mt-5">
        <div class="d-flex flex-wrap align-center justify-space-between gap-2">
          <h6 class="text-subtitle-1 font-weight-medium mb-0">
            {{ t('monitoreo.sector.lineaTiempo') }}
          </h6>
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
              {{ t('monitoreo.sector.porHoraDia', { dia: fechaCorta(`${datos.detalle.value.dia} 12:00:00`) }) }}
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
        </div>
        <div
          v-if="!totalSerie"
          class="text-body-2 text-medium-emphasis mt-2"
        >
          {{ t('monitoreo.sector.sinLecturas') }}
        </div>
        <template v-else>
          <div class="text-caption text-medium-emphasis mt-1">
            {{ t('monitoreo.sector.lecturasEn', { n: fmt(totalSerie) }) }}
          </div>
          <div class="detalle-sector__grafica">
            <div
              v-for="(p, i) in serie"
              :key="i"
              class="detalle-sector__barra"
              :title="`${p.etiqueta}: ${fmt(p.lecturas)}`"
            >
              <div
                class="detalle-sector__barra-relleno"
                :style="{ blockSize: `${Math.max(p.lecturas ? 3 : 0, (p.lecturas / maxSerie) * 56)}px` }"
              />
              <div class="detalle-sector__barra-etiqueta text-caption text-medium-emphasis">
                {{ p.etiqueta }}
              </div>
            </div>
          </div>
        </template>
      </section>

      <!-- Pendientes -->
      <section class="mt-5">
        <div class="d-flex flex-wrap align-center justify-space-between gap-2">
          <h6 class="text-subtitle-1 font-weight-medium mb-0">
            {{ t('monitoreo.sector.listaPendientes') }}
            <VChip
              size="x-small"
              variant="tonal"
              class="ms-1"
            >
              {{ fmt(pendientesFiltrados.length) }}
            </VChip>
          </h6>
          <VBtn
            v-if="datos.detalle.value.pendientes.length"
            size="x-small"
            variant="tonal"
            prepend-icon="tabler-file-spreadsheet"
            class="text-none"
            :loading="datos.exportando.value"
            @click="datos.exportar()"
          >
            {{ t('monitoreo.sector.exportar') }}
          </VBtn>
        </div>
        <VAlert
          v-if="datos.errorExportar.value"
          type="error"
          variant="tonal"
          density="compact"
          class="mt-2"
        >
          {{ datos.errorExportar.value.mensaje || t('monitoreo.sector.exportarError') }}
        </VAlert>
        <div
          v-if="!datos.detalle.value.pendientes.length"
          class="text-body-2 text-medium-emphasis mt-2"
        >
          {{ t('monitoreo.sector.sinPendientes') }}
        </div>
        <template v-else>
          <VTextField
            v-model="busqueda"
            density="compact"
            variant="outlined"
            hide-details
            clearable
            prepend-inner-icon="tabler-search"
            :placeholder="t('monitoreo.sector.buscarPendiente')"
            class="my-2"
          />
          <VDataTableVirtual
            :headers="headersPendientes"
            :items="pendientesFiltrados"
            :height="Math.min(420, 44 + pendientesFiltrados.length * 40)"
            item-value="contrato_id"
            density="compact"
            fixed-header
            hover
            class="detalle-sector__tabla"
          >
            <template #item="{ item }">
              <tr
                class="detalle-sector__fila"
                @click="emit('toma', item.contrato_id)"
              >
                <td class="text-end">
                  {{ item.secuencia ?? '—' }}
                </td>
                <td class="font-weight-medium">
                  {{ item.cuenta }}
                </td>
                <td>
                  <div class="text-truncate detalle-sector__nombre">
                    {{ item.nombre ?? '—' }}
                  </div>
                  <div class="text-caption text-medium-emphasis text-truncate detalle-sector__nombre">
                    {{ item.direccion ?? '' }}
                  </div>
                  <div
                    v-if="item.sin_coordenada || item.estimada"
                    class="d-flex gap-1 mt-1"
                  >
                    <VChip
                      v-if="item.sin_coordenada"
                      size="x-small"
                      color="warning"
                      variant="tonal"
                      label
                    >
                      {{ t('monitoreo.sector.sinCoordenada') }}
                    </VChip>
                    <VChip
                      v-if="item.estimada"
                      size="x-small"
                      color="info"
                      variant="tonal"
                      label
                    >
                      {{ t('monitoreo.sector.estimada') }}
                    </VChip>
                  </div>
                </td>
                <td>{{ item.manzana ?? '—' }}</td>
                <td>{{ item.lote ?? '—' }}</td>
                <td class="text-caption">
                  {{ ultimaConocida(item) }}
                </td>
              </tr>
            </template>
          </VDataTableVirtual>
        </template>
      </section>
    </div>
  </VNavigationDrawer>
</template>

<style scoped>
/* El drawer de Vuetify recorta su contenido (overflow hidden): el panel es una columna a toda la altura y solo el cuerpo
   se desplaza; overscroll-behavior evita que la rueda arrastre la página de atrás al llegar al final. */
.detalle-sector :deep(.v-navigation-drawer__content) {
  display: flex;
  flex-direction: column;
  block-size: 100%;
}

.detalle-sector__cuerpo {
  flex: 1 1 auto;
  min-block-size: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.detalle-sector__cifras {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.detalle-sector__cifra {
  padding: 6px 10px;
  border-radius: 6px;
  background: rgba(var(--v-theme-on-surface), 0.04);
}

.detalle-sector__lista :deep(.v-list-item) {
  min-block-size: 32px;
  padding-inline: 0;
}

.detalle-sector__grafica {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  margin-block-start: 6px;
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
  background: #1e88e5;
  inline-size: 100%;
}

.detalle-sector__barra-etiqueta {
  overflow: hidden;
  font-size: 9px !important;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detalle-sector__fila {
  cursor: pointer;
}

.detalle-sector__vistas :deep(.v-slide-group__content) {
  gap: 4px;
}

.detalle-sector__nombre {
  max-inline-size: 190px;
}

.detalle-sector__tabla :deep(th),
.detalle-sector__tabla :deep(td) {
  padding-inline: 6px !important;
}
</style>
