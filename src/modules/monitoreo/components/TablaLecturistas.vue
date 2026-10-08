<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AvisoLecturista, EstadoLecturista, FilaLecturista } from '../types/monitor'
import { haceCuanto, horaCorta } from '../utils/tiempo'
import type { ColumnaTabla, OrdenTabla } from '@/components/as/tipos'
import { TOKEN_LECTURISTA, tokenMeta } from '@/utils/estados'
import { decimal, entero } from '@/utils/formato'

/*
 * Lecturistas del día: estado (activo, en silencio, terminado, sin iniciar), última señal ("hace 4 min" o
 * "sin reporte desde las 10:12"), lecturas contra la meta, sectores, anomalías, batería y pendientes por enviar.
 * Sobre AsTablaDatos; los colores de estado salen de los tokens (TOKEN_LECTURISTA).
 */
const props = withDefaults(defineProps<{
  lecturistas: FilaLecturista[]
  esHoy: boolean
  ahora: Date
  cargando?: boolean
  filtroEstado?: EstadoLecturista | null
  seleccionado?: number | null
}>(), { cargando: false, filtroEstado: null, seleccionado: null })

const emit = defineEmits<{
  'seleccionar': [lecturista: FilaLecturista]
  'sector': [sectorId: number]
  'update:filtroEstado': [estado: EstadoLecturista | null]
}>()

const { t } = useI18n()

const ORDEN_ESTADOS: EstadoLecturista[] = ['activo', 'silencio', 'sin_iniciar', 'terminado', 'fuera_de_jornada']
const ICONO_AVISO: Record<AvisoLecturista, string> = { silencio: 'tabler-bell-off', bateria: 'tabler-battery-1', atoradas: 'tabler-cloud-upload', lejos: 'tabler-map-pin-off' }

const busqueda = ref('')
const orden = ref<OrdenTabla>([{ key: 'lecturas', order: 'desc' }])

const columnas = computed<ColumnaTabla<FilaLecturista>[]>(() => [
  { clave: 'nombre', titulo: t('monitoreo.lecturistas.nombre'), formato: 'personalizado', anchoMin: 200 },
  { clave: 'estado', titulo: t('monitoreo.lecturistas.estado'), formato: 'personalizado', ancho: 136 },
  { clave: 'ultima_actividad', titulo: t('monitoreo.lecturistas.ultimaSenal'), formato: 'personalizado', ancho: 150 },
  { clave: 'lecturas', titulo: t('monitoreo.lecturistas.lecturas'), formato: 'personalizado', ancho: 190 },
  { clave: 'sectores', titulo: t('monitoreo.lecturistas.sectores'), formato: 'personalizado', ordenable: false },
  { clave: 'anomalias', titulo: t('monitoreo.lecturistas.anomalias'), formato: 'entero', ancho: 80 },
  { clave: 'lejos', titulo: t('monitoreo.lecturistas.lejos'), formato: 'entero', ancho: 72, descripcion: t('monitoreo.lectura.lejos', { n: 50 }) },
  { clave: 'bateria_min', titulo: t('monitoreo.lecturistas.bateria'), formato: 'personalizado', alineacion: 'end', ancho: 84 },
  { clave: 'pendientes_enviar', titulo: t('monitoreo.lecturistas.pendientes'), formato: 'entero', ancho: 96 },
])

const conteos = computed(() => {
  const c: Partial<Record<EstadoLecturista, number>> = {}
  for (const l of props.lecturistas)
    c[l.estado] = (c[l.estado] ?? 0) + 1

  // El estado filtrado se muestra aunque ya no tenga filas, para poder quitarlo
  return ORDEN_ESTADOS.filter(e => c[e] || e === props.filtroEstado).map(e => ({ estado: e, n: c[e] ?? 0 }))
})

const filas = computed(() => {
  let lista = props.lecturistas
  if (props.filtroEstado)
    lista = lista.filter(l => l.estado === props.filtroEstado)
  const q = busqueda.value.trim().toLowerCase()
  if (q)
    lista = lista.filter(l => l.nombre.toLowerCase().includes(q) || (l.gerencia ?? '').toLowerCase().includes(q) || l.sectores.some(s => s.sector.toLowerCase().includes(q)))

  return lista
})

const relativo = (clave: 'nunca' | 'ahora' | 'minutos' | 'horas' | 'dias', valor?: number) => t(`monitoreo.tiempo.${clave}`, { n: valor })

function senal(l: FilaLecturista): string {
  if (!l.ultima_actividad)
    return l.estado === 'sin_iniciar' ? t('monitoreo.lecturistas.sinActividad') : '—'
  if (!props.esHoy)
    return t('monitoreo.lecturistas.ultimaA', { hora: horaCorta(l.ultima_actividad) })
  if (l.estado === 'silencio')
    return t('monitoreo.lecturistas.sinReporteDesde', { hora: horaCorta(l.ultima_actividad) })

  return haceCuanto(l.ultima_actividad, relativo, props.ahora)
}

function alternarEstado(e: EstadoLecturista) {
  emit('update:filtroEstado', props.filtroEstado === e ? null : e)
}
</script>

<template>
  <AsTablaDatos
    class="tabla-lecturistas"
    :titulo="esHoy ? t('monitoreo.lecturistas.tituloHoy') : t('monitoreo.lecturistas.tituloDia')"
    :columnas="columnas"
    :filas="filas"
    clave-fila="lecturista_id"
    densidad="estandar"
    :por-pagina="-1"
    :orden="orden"
    :seleccionada="seleccionado"
    clic-fila
    :cargando="cargando"
    :busqueda="busqueda"
    :placeholder-busqueda="t('monitoreo.lecturistas.buscar')"
    :vacio-titulo="t('monitoreo.lecturistas.sinResultados')"
    vacio-detalle=""
    @update:orden="(o: OrdenTabla) => { orden = o }"
    @update:busqueda="(q: string) => { busqueda = q }"
    @fila="(f: Record<string, unknown>) => emit('seleccionar', f as FilaLecturista)"
  >
    <template #encabezado-acciones>
      <div
        class="d-flex flex-wrap align-center gap-1"
        role="group"
        :aria-label="t('monitoreo.lecturistas.estado')"
      >
        <VChip
          v-for="c in conteos"
          :key="c.estado"
          size="small"
          :color="TOKEN_LECTURISTA[c.estado]"
          :variant="filtroEstado === c.estado ? 'flat' : 'tonal'"
          label
          :aria-pressed="filtroEstado === c.estado"
          @click="alternarEstado(c.estado)"
        >
          <span class="as-num me-1">{{ c.n }}</span>{{ t(`monitoreo.estadosLecturista.${c.estado}`) }}
        </VChip>
      </div>
    </template>

    <template #celda-nombre="{ fila }">
      <div class="font-weight-medium">
        {{ fila.nombre }}
      </div>
      <div class="as-secundario">
        {{ fila.gerencia ?? '' }}
      </div>
    </template>

    <template #celda-estado="{ fila }">
      <div class="d-flex align-center flex-wrap gap-1">
        <VChip
          size="small"
          :color="TOKEN_LECTURISTA[fila.estado]"
          variant="tonal"
          label
        >
          {{ t(`monitoreo.estadoLecturista.${fila.estado}`) }}
        </VChip>
        <VIcon
          v-for="a in fila.avisos"
          :key="a"
          :icon="ICONO_AVISO[a]"
          size="16"
          :color="a === 'silencio' ? 'error' : 'warning'"
          :title="t(`monitoreo.avisos.${a}`)"
          :aria-label="t(`monitoreo.avisos.${a}`)"
        />
      </div>
    </template>

    <template #celda-ultima_actividad="{ fila }">
      <span
        class="text-body-2"
        :class="{ 'text-error': fila.estado === 'silencio' }"
      >{{ senal(fila) }}</span>
    </template>

    <template #celda-lecturas="{ fila }">
      <div class="d-flex align-center gap-2">
        <VProgressLinear
          :model-value="fila.pct_meta ?? 0"
          :color="tokenMeta(fila.pct_meta)"
          height="6"
          rounded
          class="flex-grow-1"
        />
        <span class="text-body-2 as-num text-no-wrap tabla-lecturistas__meta">{{ entero(fila.lecturas) }} / {{ entero(fila.meta) }}</span>
      </div>
      <div
        v-if="fila.primera_lectura"
        class="as-secundario as-num"
      >
        {{ horaCorta(fila.primera_lectura) }} – {{ horaCorta(fila.ultima_lectura) }}<span v-if="fila.lecturas_por_hora"> · {{ t('monitoreo.lecturistas.porHora', { n: decimal(fila.lecturas_por_hora, 1) }) }}</span>
      </div>
    </template>

    <template #celda-sectores="{ fila }">
      <div class="d-flex flex-wrap gap-1 py-1">
        <VChip
          v-for="s in fila.sectores"
          :key="s.sector_id"
          size="x-small"
          variant="outlined"
          :title="t('monitoreo.sectores.sector')"
          @click.stop="emit('sector', s.sector_id)"
        >
          {{ s.sector }} <span class="text-medium-emphasis as-num ms-1">{{ s.lecturas }}</span>
        </VChip>
        <span
          v-if="!fila.sectores.length && fila.sectores_asignados.length"
          class="text-caption text-disabled"
        >{{ t('monitoreo.lecturistas.asignados', { n: fila.sectores_asignados.length }) }}</span>
      </div>
    </template>

    <template #celda-anomalias="{ fila }">
      {{ fila.anomalias ? entero(fila.anomalias) : '—' }}
    </template>

    <template #celda-lejos="{ fila }">
      <span :class="{ 'text-error font-weight-medium': fila.avisos.includes('lejos') }">{{ fila.lejos ? entero(fila.lejos) : '—' }}</span>
    </template>

    <template #celda-bateria_min="{ fila }">
      <span
        class="as-num"
        :class="{ 'text-error font-weight-medium': fila.avisos.includes('bateria') }"
      >{{ fila.bateria_min === null ? '—' : `${fila.bateria_min} %` }}</span>
    </template>

    <template #celda-pendientes_enviar="{ fila }">
      <span :class="{ 'text-warning font-weight-medium': fila.pendientes_enviar > 0 }">{{ fila.pendientes_enviar ? entero(fila.pendientes_enviar) : '—' }}</span>
    </template>
  </AsTablaDatos>
</template>

<style scoped>
.tabla-lecturistas__meta {
  min-inline-size: 5em;
  text-align: end;
}
</style>
