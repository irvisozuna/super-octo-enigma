<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { EstadoSector } from '../types/mapa'
import type { FilaSector, VistaMonitor } from '../types/monitor'
import { COLORES_SECTOR } from '../utils/geojson'
import { aFecha, fechaCorta, horaCorta } from '../utils/tiempo'

/*
 * Lista de sectores del periodo (ordenable): avance, estado, pendientes, días en curso, lecturistas y última lectura.
 * En la vista "hoy" muestra además las lecturas del día. Al elegir una fila, el mapa va al sector.
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

const { t, n } = useI18n()

const busqueda = ref('')
const soloHoy = ref(false)

type Orden = { key: string; order?: 'asc' | 'desc' | boolean }[]
const orden = ref<Orden>([{ key: 'orden_avance', order: 'asc' }])

const headers = computed(() => {
  const base = [
    { title: t('monitoreo.sectores.sector'), key: 'sector', sortable: true },
    { title: t('monitoreo.sectores.estado'), key: 'estado', sortable: true, width: 90 },
    { title: t('monitoreo.sectores.avance'), key: 'orden_avance', sortable: true, width: 120 },
    { title: t('monitoreo.sectores.pendientes'), key: 'pendientes', sortable: true, align: 'end' as const, width: 56 },
  ]

  if (props.vista === 'hoy')
    base.push({ title: t('monitoreo.sectores.hoy'), key: 'hoy.lecturas', sortable: true, align: 'end' as const, width: 64 })
  else
    base.push({ title: t('monitoreo.sectores.dias'), key: 'dias_activo', sortable: true, align: 'end' as const, width: 64 })

  return base
})

/** Fila con una clave de orden para el avance: sin esperadas (sin porcentaje) va al final en orden ascendente. */
type FilaOrdenable = FilaSector & { orden_avance: number }

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

function colorEstado(e: EstadoSector): string {
  return COLORES_SECTOR[e] ?? '#bdbdbd'
}

function colorAvance(p: number | null): string {
  if (p === null)
    return 'secondary'

  return p >= 98 ? 'success' : p >= 90 ? 'warning' : p > 0 ? 'primary' : 'secondary'
}

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
  <VCard class="tabla-sectores d-flex flex-column">
    <VCardItem class="pb-2">
      <VCardTitle class="d-flex align-center gap-2">
        {{ t('monitoreo.sectores.titulo') }}
        <VChip
          size="small"
          variant="tonal"
        >
          {{ n(filas.length) }}
        </VChip>
      </VCardTitle>
      <template #append>
        <VCheckbox
          v-if="vista === 'hoy'"
          v-model="soloHoy"
          density="compact"
          hide-details
          :label="t('monitoreo.sectores.soloHoy', { n: conHoy })"
        />
      </template>
    </VCardItem>
    <VCardText class="pt-0 pb-2">
      <VTextField
        v-model="busqueda"
        density="compact"
        variant="outlined"
        hide-details
        clearable
        prepend-inner-icon="tabler-search"
        :placeholder="t('monitoreo.sectores.buscar')"
      />
    </VCardText>
    <VDataTableVirtual
      v-model:sort-by="orden"
      :headers="headers"
      :items="filas"
      :height="altura"
      item-value="sector_id"
      density="compact"
      fixed-header
      hover
      :loading="cargando"
      :no-data-text="t('monitoreo.sectores.sinResultados')"
      class="tabla-sectores__tabla flex-grow-1"
    >
      <template #item="{ item }">
        <tr
          class="tabla-sectores__fila"
          :class="{ 'tabla-sectores__fila--activa': item.sector_id === seleccionado }"
          @click="emit('seleccionar', item)"
        >
          <td>
            <div class="font-weight-medium text-truncate tabla-sectores__nombre">
              {{ item.sector }}
            </div>
            <div class="text-caption text-medium-emphasis text-truncate tabla-sectores__nombre">
              {{ item.sistema ?? '' }}<span v-if="item.gerencia && item.sistema"> · </span>{{ item.gerencia ?? '' }}
            </div>
            <div
              v-if="item.lecturistas.length"
              class="text-caption text-truncate tabla-sectores__nombre"
              :title="nombres(item)"
            >
              <VIcon
                icon="tabler-user"
                size="12"
                class="me-1"
              />{{ nombres(item) }}
            </div>
          </td>
          <td>
            <VChip
              size="x-small"
              label
              :style="{ backgroundColor: `${colorEstado(item.estado)}22`, color: colorEstado(item.estado) }"
            >
              {{ t(`monitoreo.estadoSector.${item.estado}`) }}
            </VChip>
          </td>
          <td>
            <div class="d-flex align-center gap-2">
              <VProgressLinear
                :model-value="item.pct_campo ?? 0"
                :color="colorAvance(item.pct_campo)"
                height="6"
                rounded
                class="flex-grow-1"
              />
              <span class="text-caption text-no-wrap tabla-sectores__pct">{{ item.pct_campo === null ? '—' : `${n(item.pct_campo)} %` }}</span>
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ n(item.atendidas) }} / {{ n(item.esperadas) }}
            </div>
          </td>
          <td class="text-end">
            {{ n(item.pendientes) }}
          </td>
          <td
            v-if="vista === 'hoy'"
            class="text-end"
          >
            <div :class="item.hoy ? 'font-weight-medium' : 'text-disabled'">
              {{ item.hoy ? n(item.hoy.lecturas) : '—' }}
            </div>
            <div
              v-if="item.hoy"
              class="text-caption text-medium-emphasis text-no-wrap"
            >
              {{ ultima(item) }}
            </div>
          </td>
          <td
            v-else
            class="text-end"
          >
            <div
              :class="{ 'text-error font-weight-medium': item.estado !== 'terminado' && (diasParaCerrar(item) ?? 0) > 3 }"
              :title="t('monitoreo.sectores.diasParaCerrar')"
            >
              {{ diasParaCerrar(item) ?? '—' }}
            </div>
            <div
              v-if="item.fecha_limite"
              class="text-caption text-no-wrap"
              :class="item.estado === 'rezagado' ? 'text-error' : 'text-medium-emphasis'"
              :title="t('monitoreo.sectores.limite')"
            >
              {{ t('monitoreo.sectores.limiteCorta', { fecha: fechaCorta(`${item.fecha_limite} 12:00:00`) }) }}
            </div>
            <div
              v-if="item.ultima_lectura"
              class="text-caption text-medium-emphasis text-no-wrap"
              :title="t('monitoreo.sectores.ultima')"
            >
              {{ fechaCorta(item.ultima_lectura) }}
            </div>
          </td>
        </tr>
      </template>
    </VDataTableVirtual>
  </VCard>
</template>

<style scoped>
.tabla-sectores__fila {
  cursor: pointer;
}

.tabla-sectores__fila--activa {
  background: rgba(var(--v-theme-primary), 0.08);
}

.tabla-sectores__nombre {
  max-inline-size: 150px;
}

.tabla-sectores__pct {
  min-inline-size: 48px;
  text-align: end;
}

.tabla-sectores__tabla :deep(th) {
  white-space: nowrap;
}
</style>
