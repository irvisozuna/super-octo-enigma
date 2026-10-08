<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FilaSector, VistaMonitor } from '../types/monitor'
import { aFecha, fechaCorta, horaCorta } from '../utils/tiempo'
import type { ColumnaTabla, OrdenTabla } from '@/components/as/tipos'
import { TOKEN_SECTOR, tokenAvance } from '@/utils/estados'
import { entero, porcentaje } from '@/utils/formato'

/*
 * Lista de sectores del periodo (ordenable): avance, estado, pendientes, días en curso, lecturistas y última lectura.
 * En la vista "hoy" muestra además las lecturas del día. Al elegir una fila, el mapa va al sector.
 * Sobre AsTablaDatos (virtual, encabezado fijo); los colores de estado salen de los tokens.
 */
const props = withDefaults(defineProps<{
  sectores: FilaSector[]
  vista: VistaMonitor
  seleccionado?: number | null
  cargando?: boolean
  altura?: number | string
}>(), { seleccionado: null, cargando: false, altura: 560 })

const emit = defineEmits<{
  seleccionar: [sector: FilaSector]
}>()

const { t } = useI18n()

const busqueda = ref('')
const soloHoy = ref(false)
const orden = ref<OrdenTabla>([{ key: 'orden_avance', order: 'asc' }])

/** Fila con una clave de orden para el avance: sin esperadas (sin porcentaje) va al final en orden ascendente. */
type FilaOrdenable = FilaSector & { orden_avance: number }

const columnas = computed<ColumnaTabla<FilaOrdenable>[]>(() => {
  const base: ColumnaTabla<FilaOrdenable>[] = [
    { clave: 'sector', titulo: t('monitoreo.sectores.sector'), formato: 'personalizado' },
    { clave: 'estado', titulo: t('monitoreo.sectores.estado'), formato: 'personalizado', ancho: 96 },
    { clave: 'orden_avance', titulo: t('monitoreo.sectores.avance'), formato: 'personalizado', ancho: 132, descripcion: t('monitoreo.indicadores.avance') },
    { clave: 'pendientes', titulo: t('monitoreo.sectores.pendientes'), formato: 'entero', ancho: 64 },
  ]

  if (props.vista === 'hoy')
    base.push({ clave: 'hoy.lecturas', titulo: t('monitoreo.sectores.hoy'), formato: 'personalizado', alineacion: 'end', ancho: 72 })
  else
    base.push({ clave: 'dias_activo', titulo: t('monitoreo.sectores.dias'), formato: 'personalizado', alineacion: 'end', ancho: 88, descripcion: t('monitoreo.sectores.diasParaCerrar') })

  return base
})

const filas = computed<FilaOrdenable[]>(() => {
  let lista = props.sectores
  if (soloHoy.value && props.vista === 'hoy')
    lista = lista.filter(s => s.hoy)
  const q = busqueda.value.trim().toLowerCase()
  if (q)
    lista = lista.filter(s => s.sector.toLowerCase().includes(q) || (s.sistema ?? '').toLowerCase().includes(q) || s.lecturistas.some(l => l.nombre.toLowerCase().includes(q)))

  return lista.map(s => ({ ...s, orden_avance: s.pct_campo ?? 999 }))
})

const conHoy = computed(() => props.sectores.filter(s => s.hoy).length)

function nombres(s: FilaSector): string {
  return s.lecturistas.map(l => l.nombre).join(', ')
}

/**
 * Días para cerrar el sector: de la primera a la última lectura si ya terminó; de la primera a hoy si sigue abierto.
 * Null si no ha empezado.
 */
function diasParaCerrar(s: FilaSector): number | null {
  const inicio = aFecha(s.primera_lectura)
  if (!inicio)
    return null
  const fin = (s.estado === 'terminado' ? aFecha(s.ultima_lectura) : null) ?? new Date()

  return Math.max(1, Math.floor((fin.getTime() - inicio.getTime()) / 86400000) + 1)
}

/** Última lectura del día (vista hoy) o del periodo, como hora corta. */
function ultima(s: FilaSector): string {
  const valor = props.vista === 'hoy' && s.hoy ? s.hoy.ultima : s.ultima_lectura

  return valor ? horaCorta(valor) : '—'
}
</script>

<template>
  <AsTablaDatos
    class="tabla-sectores"
    :titulo="t('monitoreo.sectores.titulo')"
    :columnas="columnas"
    :filas="filas"
    clave-fila="sector_id"
    densidad="estandar"
    virtual
    :altura="altura"
    :orden="orden"
    :seleccionada="seleccionado"
    clic-fila
    :cargando="cargando"
    :busqueda="busqueda"
    :placeholder-busqueda="t('monitoreo.sectores.buscar')"
    :vacio-titulo="t('monitoreo.sectores.sinResultados')"
    vacio-detalle=""
    ocultar-pie
    @update:orden="(o: OrdenTabla) => { orden = o }"
    @update:busqueda="(q: string) => { busqueda = q }"
    @fila="(f: Record<string, unknown>) => emit('seleccionar', f as FilaSector)"
  >
    <template #encabezado-acciones>
      <VCheckbox
        v-if="vista === 'hoy'"
        v-model="soloHoy"
        density="compact"
        hide-details
        :label="t('monitoreo.sectores.soloHoy', { n: conHoy })"
      />
    </template>

    <template #celda-sector="{ fila }">
      <div class="tabla-sectores__nombre">
        <div class="font-weight-medium text-truncate">
          {{ fila.sector }}
        </div>
        <div class="as-secundario text-truncate">
          {{ fila.sistema ?? '' }}<span v-if="fila.gerencia && fila.sistema"> · </span>{{ fila.gerencia ?? '' }}
        </div>
        <div
          v-if="fila.lecturistas.length"
          class="text-caption text-truncate d-flex align-center"
          :title="nombres(fila)"
        >
          <VIcon
            icon="tabler-user"
            size="12"
            class="me-1 flex-shrink-0"
          />{{ nombres(fila) }}
        </div>
      </div>
    </template>

    <template #celda-estado="{ fila }">
      <VChip
        size="small"
        label
        variant="tonal"
        :color="TOKEN_SECTOR[fila.estado] ?? 'secondary'"
      >
        {{ t(`monitoreo.estadoSector.${fila.estado}`) }}
      </VChip>
    </template>

    <template #celda-orden_avance="{ fila }">
      <div class="d-flex align-center gap-2">
        <VProgressLinear
          :model-value="fila.pct_campo ?? 0"
          :color="tokenAvance(fila.pct_campo)"
          height="6"
          rounded
          class="flex-grow-1"
          :aria-label="`${t('monitoreo.sectores.avance')} ${fila.sector}`"
        />
        <span class="text-body-2 as-num text-no-wrap tabla-sectores__pct">{{ fila.pct_campo === null ? '—' : porcentaje(fila.pct_campo) }}</span>
      </div>
      <div class="as-secundario as-num">
        {{ entero(fila.atendidas) }} / {{ entero(fila.esperadas) }}
      </div>
    </template>

    <template #[`celda-hoy.lecturas`]="{ fila }">
      <div
        class="as-num"
        :class="fila.hoy ? 'font-weight-medium' : 'text-disabled'"
      >
        {{ fila.hoy ? entero(fila.hoy.lecturas) : '—' }}
      </div>
      <div
        v-if="fila.hoy"
        class="as-secundario as-num text-no-wrap"
      >
        {{ ultima(fila) }}
      </div>
    </template>

    <template #celda-dias_activo="{ fila }">
      <div
        class="as-num"
        :class="{ 'text-error font-weight-medium': fila.estado !== 'terminado' && (diasParaCerrar(fila) ?? 0) > 3 }"
        :title="t('monitoreo.sectores.diasParaCerrar')"
      >
        {{ diasParaCerrar(fila) ?? '—' }}
      </div>
      <div
        v-if="fila.fecha_limite"
        class="text-caption text-no-wrap"
        :class="fila.estado === 'rezagado' ? 'text-error' : 'text-medium-emphasis'"
        :title="t('monitoreo.sectores.limite')"
      >
        {{ t('monitoreo.sectores.limiteCorta', { fecha: fechaCorta(`${fila.fecha_limite} 12:00:00`) }) }}
      </div>
      <div
        v-if="fila.ultima_lectura"
        class="as-secundario text-no-wrap"
        :title="t('monitoreo.sectores.ultima')"
      >
        {{ fechaCorta(fila.ultima_lectura) }}
      </div>
    </template>
  </AsTablaDatos>
</template>

<style scoped>
.tabla-sectores__nombre {
  max-inline-size: 22ch;
  padding-block: var(--as-sp-1);
}

.tabla-sectores__pct {
  min-inline-size: 3.5em;
  text-align: end;
}
</style>
