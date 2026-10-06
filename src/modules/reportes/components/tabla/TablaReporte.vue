<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ColumnaDef, Fila, OrdenDef } from '../../types/reporte'
import { formatearEntero, formatearValor } from '../../utils/formato'

const props = withDefaults(defineProps<{
  columnas: ColumnaDef[]
  filas: Fila[]
  totalFilas: number
  totales?: Record<string, number | string> | null
  pagina: number
  porPagina: number
  orden: OrdenDef[]
  cargando?: boolean
  porPaginaMax?: number
  compacta?: boolean
}>(), {
  totales: null,
  cargando: false,
  porPaginaMax: 500,
  compacta: false,
})

const emit = defineEmits<{
  'update:pagina': [pagina: number]
  'update:porPagina': [porPagina: number]
  'update:orden': [orden: OrdenDef[]]
}>()

const { t } = useI18n()

const visibles = computed(() => props.columnas.filter(c => c.visible))

const headers = computed(() => visibles.value.map(c => ({
  title: c.etiqueta,
  key: c.columna,
  align: c.alineacion,
  sortable: true,
  nowrap: true,
})))

const sortBy = computed(() => props.orden.map(o => ({ key: o.columna, order: o.dir })))

const opcionesPorPagina = computed(() => [25, 50, 100, 200, 500]
  .filter(n => n <= props.porPaginaMax)
  .map(n => ({ value: n, title: String(n) })))

const hayTotales = computed(() => props.totales !== null && visibles.value.some(c => c.total && props.totales?.[c.columna] !== undefined))

function alinear(columna: ColumnaDef) {
  return `text-${columna.alineacion}`
}

function actualizarOrden(nuevo: { key: string; order?: boolean | 'asc' | 'desc' }[]) {
  emit('update:orden', nuevo.map(s => ({ columna: s.key, dir: s.order === 'desc' ? 'desc' : 'asc' })))
}
</script>

<template>
  <VDataTableServer
    :headers="headers"
    :items="filas"
    :items-length="totalFilas"
    :page="pagina"
    :items-per-page="porPagina"
    :items-per-page-options="opcionesPorPagina"
    :items-per-page-text="t('reportes.tabla.filasPorPagina')"
    :sort-by="sortBy"
    :loading="cargando"
    :density="compacta ? 'compact' : 'default'"
    :no-data-text="t('reportes.tabla.sinResultados')"
    class="tabla-reporte"
    hover
    @update:page="(p: number) => emit('update:pagina', p)"
    @update:items-per-page="(n: number) => emit('update:porPagina', n)"
    @update:sort-by="actualizarOrden"
  >
    <template #item="{ item }">
      <tr>
        <td
          v-for="columna in visibles"
          :key="columna.columna"
          :class="[alinear(columna), { 'text-no-wrap': columna.formato !== 'texto' }]"
        >
          {{ formatearValor(item[columna.columna], columna.formato) }}
        </td>
      </tr>
    </template>

    <template
      v-if="hayTotales"
      #body.append
    >
      <tr class="tabla-reporte__totales">
        <td
          v-for="(columna, indice) in visibles"
          :key="columna.columna"
          :class="alinear(columna)"
        >
          <template v-if="columna.total && totales?.[columna.columna] !== undefined">
            {{ formatearValor(totales?.[columna.columna], columna.formato) }}
          </template>
          <template v-else-if="indice === 0">
            {{ t('reportes.tabla.total') }} · {{ t('reportes.tabla.filas', { n: formatearEntero(totalFilas) }) }}
          </template>
        </td>
      </tr>
    </template>
  </VDataTableServer>
</template>

<style scoped>
.tabla-reporte :deep(.v-table__wrapper) {
  overflow-x: auto;
}

.tabla-reporte__totales td {
  background: rgba(var(--v-theme-primary), 0.06);
  font-weight: 600;
}
</style>
