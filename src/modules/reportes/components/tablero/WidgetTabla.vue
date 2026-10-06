<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DatosWidget } from '../../types/tablero'
import { formatearValor } from '../../utils/formato'

const props = defineProps<{
  datos: DatosWidget
}>()

const { t } = useI18n()

const NUMERICOS = new Set(['entero', 'decimal', 'moneda', 'porcentaje'])

const headers = computed(() => props.datos.columnas.map(c => ({
  title: c.etiqueta,
  key: c.columna,
  align: (NUMERICOS.has(c.formato) ? 'end' : 'start') as 'end' | 'start',
  sortable: true,
})))

const formatos = computed(() => Object.fromEntries(props.datos.columnas.map(c => [c.columna, c.formato])))
</script>

<template>
  <VDataTable
    :headers="headers"
    :items="datos.filas"
    :items-per-page="10"
    density="compact"
    class="widget-tabla"
    :items-per-page-text="t('reportes.tabla.filasPorPagina')"
    :no-data-text="t('reportes.tablero.widgetSinDatos')"
  >
    <template
      v-for="col in datos.columnas"
      :key="col.columna"
      #[`item.${col.columna}`]="{ item }"
    >
      {{ formatearValor((item as Record<string, unknown>)[col.columna], formatos[col.columna]) }}
    </template>
  </VDataTable>
</template>

<style scoped>
.widget-tabla :deep(th) {
  white-space: nowrap;
}
</style>
