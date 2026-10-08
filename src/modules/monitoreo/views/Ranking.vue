<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RouteLocationRaw } from 'vue-router'
import { comparacion, useRanking } from '../composables/useRanking'
import { obtenerCatalogos } from '../services/monitoreoApi'
import { useAlcanceStore } from '../stores/alcanceStore'
import type { RespuestaCatalogos } from '../types/monitor'
import type { FilaRanking } from '../types/ranking'
import type { ColumnaTabla } from '@/components/as/tipos'
import { decimal, duracion, entero, fechaCorta } from '@/utils/formato'

/*
 * Ranking y comparativos de lecturistas (F2.4): suma de jornadas por lecturista en un rango de días del periodo, por
 * gerencia, con la comparación contra su propio promedio de los tres periodos anteriores. Exporta a Excel y PDF.
 * Sobre los componentes del sistema de diseño: encabezado, barra de filtros y tabla con fila de totales.
 */
const { t } = useI18n()
const alcance = useAlcanceStore()
const r = useRanking()
const catalogos = ref<RespuestaCatalogos | null>(null)

const periodos = computed(() => (catalogos.value?.periodos ?? []).map(p => ({ value: p.id, title: p.abierto ? `${p.nombre} (abierto)` : p.nombre })))
const opcionesGerencia = computed(() => alcance.gerencias.map(g => ({ value: g.id, title: g.label })))
const nombreGerencia = (id: number | null) => (id === null ? '—' : alcance.gerencias.find(g => g.id === id)?.label ?? `#${id}`)
const distancia = computed(() => r.datos.value?.distancia_m ?? 50)
const esUnDia = computed(() => !!r.filtros.desde && r.filtros.desde === r.filtros.hasta)
const mostrarGerencia = computed(() => !r.filtros.gerencia && alcance.gerencias.length !== 1)

const columnas = computed<ColumnaTabla<FilaRanking>[]>(() => [
  { clave: 'posicion', titulo: '#', formato: 'entero', ancho: 56, descripcion: t('monitoreo.ranking.posicion') },
  { clave: 'nombre', titulo: t('monitoreo.ranking.lecturista'), formato: 'personalizado', anchoMin: 220 },
  { clave: 'dias', titulo: t('monitoreo.ranking.dias'), formato: 'entero', ancho: 72 },
  { clave: 'lecturas', titulo: t('monitoreo.ranking.lecturas'), formato: 'entero', ancho: 100 },
  { clave: 'lecturas_dia', titulo: t('monitoreo.ranking.lecturasDia'), formato: 'personalizado', alineacion: 'end', ancho: 170, descripcion: t('monitoreo.ranking.referencia', { periodos: r.datos.value?.referencia_periodos.join(', ') ?? '' }) },
  { clave: 'lecturas_hora', titulo: t('monitoreo.ranking.lecturasHora'), formato: 'personalizado', alineacion: 'end', ancho: 150 },
  { clave: 'min_totales', titulo: t('monitoreo.ranking.minTotales'), formato: 'personalizado', alineacion: 'end', ancho: 120 },
  { clave: 'min_muertos', titulo: t('monitoreo.ranking.minMuertos'), formato: 'personalizado', alineacion: 'end', ancho: 150 },
  { clave: 'anomalias', titulo: t('monitoreo.ranking.anomalias'), formato: 'entero', ancho: 100 },
  { clave: 'impresas', titulo: t('monitoreo.ranking.impresas'), formato: 'entero', ancho: 96 },
  { clave: 'lejos', titulo: t('monitoreo.ranking.lejos', { m: distancia.value }), formato: 'personalizado', alineacion: 'end', ancho: 100, descripcion: t('monitoreo.ranking.lejosDetalle', { m: distancia.value }) },
  { clave: 'apego_pct', titulo: t('monitoreo.ranking.apego'), formato: 'porcentaje', decimales: 0, ancho: 90 },
  { clave: 'sectores', titulo: t('monitoreo.ranking.sectores'), formato: 'entero', ancho: 90 },
])

/** Fila de totales: lo que suma el periodo; los promedios y tiempos ya formateados. */
const totales = computed(() => {
  const tot = r.totales.value
  if (!tot)
    return null

  return {
    nombre: t('monitoreo.ranking.totalesFila', { l: entero(tot.lecturistas) }),
    lecturas: tot.lecturas,
    lecturas_dia: decimal(tot.lecturas_dia, 1),
    lecturas_hora: decimal(tot.lecturas_hora, 1),
    min_totales: duracion(tot.min_totales),
    min_muertos: duracion(tot.min_muertos),
    anomalias: tot.anomalias,
    impresas: tot.impresas,
    lejos: entero(tot.lejos),
  }
})

const resumen = computed(() => {
  const tot = r.totales.value

  return tot ? t('monitoreo.ranking.resumen', { l: entero(tot.lecturistas), n: entero(tot.lecturas), d: decimal(tot.lecturas_dia, 1), h: decimal(tot.lecturas_hora, 1) }) : ''
})

function destinoJornada(fila: FilaRanking): RouteLocationRaw {
  return { name: 'monitoreoInicio', query: { lecturista: String(fila.lecturista_id), ...(esUnDia.value ? { dia: r.filtros.desde as string } : {}) } }
}

function iconoComparacion(flecha: 'arriba' | 'abajo' | 'igual' | null): string {
  return flecha === 'arriba' ? 'tabler-arrow-up-right' : flecha === 'abajo' ? 'tabler-arrow-down-right' : 'tabler-minus'
}

function colorComparacion(mejor: boolean | null): string | undefined {
  return mejor === null ? undefined : mejor ? 'success' : 'error'
}

onMounted(async () => {
  await Promise.all([alcance.cargado ? Promise.resolve() : alcance.cargar(), obtenerCatalogos().then(c => {
    catalogos.value = c
  }).catch(() => null)])
  await r.cargar()
})
onBeforeUnmount(() => r.cancelar())
</script>

<template>
  <div class="ranking">
    <AsEncabezadoPagina
      :titulo="t('monitoreo.ranking.titulo')"
      :descripcion="t('monitoreo.ranking.descripcion')"
    >
      <template #acciones>
        <AsBtnSecundario
          prepend-icon="tabler-file-spreadsheet"
          :loading="r.exportando.value === 'xlsx'"
          :disabled="!r.filas.value.length"
          @click="r.exportar('xlsx')"
        >
          Excel
        </AsBtnSecundario>
        <AsBtnSecundario
          prepend-icon="tabler-file-type-pdf"
          :loading="r.exportando.value === 'pdf'"
          :disabled="!r.filas.value.length"
          @click="r.exportar('pdf')"
        >
          PDF
        </AsBtnSecundario>
      </template>
    </AsEncabezadoPagina>

    <AsEstado
      v-if="r.error.value && !r.datos.value"
      tipo="error"
      class="mb-4"
      :error="r.error.value"
      @reintentar="r.cargar()"
    />
    <VAlert
      v-if="r.errorExportacion.value"
      type="error"
      variant="tonal"
      density="compact"
      class="mb-3"
      closable
      @click:close="r.errorExportacion.value = null"
    >
      {{ r.errorExportacion.value.mensaje }}
    </VAlert>

    <AsBarraFiltros class="mb-3">
      <VSelect
        :model-value="r.filtros.periodo"
        :items="periodos"
        :label="t('monitoreo.ranking.periodo')"
        class="as-filtro--md"
        @update:model-value="(v: number | null) => r.aplicar({ periodo: v })"
      />
      <VSelect
        v-if="alcance.gerencias.length !== 1"
        :model-value="r.filtros.gerencia"
        :items="opcionesGerencia"
        :label="t('monitoreo.ranking.gerencia')"
        clearable
        class="as-filtro--sm"
        @update:model-value="(v: number | null) => r.aplicar({ gerencia: v })"
      />
      <VTextField
        :model-value="r.filtros.desde"
        type="date"
        :label="t('monitoreo.ranking.desde')"
        :aria-label="t('monitoreo.ranking.desde')"
        :min="r.datos.value?.periodo?.inicio"
        :max="r.datos.value?.periodo?.fin"
        class="as-filtro--sm"
        @update:model-value="(v: string) => r.aplicar({ desde: v || null })"
      />
      <VTextField
        :model-value="r.filtros.hasta"
        type="date"
        :label="t('monitoreo.ranking.hasta')"
        :aria-label="t('monitoreo.ranking.hasta')"
        :min="r.filtros.desde ?? r.datos.value?.periodo?.inicio"
        :max="r.datos.value?.periodo?.fin"
        class="as-filtro--sm"
        @update:model-value="(v: string) => r.aplicar({ hasta: v || null })"
      />
      <VBtn
        variant="text"
        size="small"
        @click="r.aplicar({ desde: r.datos.value?.hasta ?? null, hasta: r.datos.value?.hasta ?? null })"
      >
        {{ t('monitoreo.ranking.soloUltimoDia') }}
      </VBtn>
      <VBtn
        variant="text"
        size="small"
        @click="r.aplicar({ desde: r.datos.value?.periodo?.inicio ?? null, hasta: null })"
      >
        {{ t('monitoreo.ranking.todoElPeriodo') }}
      </VBtn>
      <template
        v-if="resumen"
        #fin
      >
        <span class="as-secundario as-num">{{ resumen }}</span>
      </template>
    </AsBarraFiltros>

    <AsTablaDatos
      :columnas="columnas"
      :filas="r.filas.value"
      clave-fila="lecturista_id"
      densidad="estandar"
      :cargando="r.cargando.value"
      :por-pagina="-1"
      :totales="totales"
      :vacio-titulo="t('monitoreo.ranking.sinFilas')"
      vacio-detalle=""
      vacio-icono="tabler-trophy"
      class="ranking__tabla"
    >
      <template
        v-if="r.datos.value"
        #encabezado
      >
        <span class="as-secundario">
          <template v-if="r.datos.value.referencia_periodos.length">
            {{ t('monitoreo.ranking.referencia', { periodos: r.datos.value.referencia_periodos.join(', ') }) }}
          </template>
          <template v-else>
            {{ t('monitoreo.ranking.sinReferenciaPeriodos') }}
          </template>
        </span>
      </template>

      <template #celda-nombre="{ fila }">
        <RouterLink
          :to="destinoJornada(fila)"
          class="ranking__enlace font-weight-medium"
        >
          {{ fila.nombre }}
        </RouterLink>
        <div
          v-if="mostrarGerencia"
          class="as-secundario"
        >
          {{ nombreGerencia(fila.gerencia_id) }}
        </div>
      </template>
      <template #celda-lecturas_dia="{ fila }">
        <span class="d-inline-flex align-center gap-1 as-num">
          <span>{{ decimal(fila.lecturas_dia, 1) }}</span>
          <VChip
            v-if="fila.referencia && comparacion(fila, 'lecturas_dia').flecha"
            size="x-small"
            label
            variant="tonal"
            :color="colorComparacion(comparacion(fila, 'lecturas_dia').mejor)"
            :prepend-icon="iconoComparacion(comparacion(fila, 'lecturas_dia').flecha)"
            :title="t('monitoreo.ranking.promedioPropio', { v: decimal(fila.referencia.lecturas_dia, 1), p: fila.referencia.periodos })"
          >
            {{ comparacion(fila, 'lecturas_dia').texto }}
          </VChip>
          <span
            v-else-if="!fila.referencia"
            class="as-secundario"
          >{{ t('monitoreo.ranking.sinReferencia') }}</span>
        </span>
      </template>
      <template #celda-lecturas_hora="{ fila }">
        <span class="d-inline-flex align-center gap-1 as-num">
          <span>{{ decimal(fila.lecturas_hora, 1) }}</span>
          <VChip
            v-if="fila.referencia && comparacion(fila, 'lecturas_hora').flecha"
            size="x-small"
            label
            variant="tonal"
            :color="colorComparacion(comparacion(fila, 'lecturas_hora').mejor)"
            :prepend-icon="iconoComparacion(comparacion(fila, 'lecturas_hora').flecha)"
            :title="t('monitoreo.ranking.promedioPropio', { v: decimal(fila.referencia.lecturas_hora, 1), p: fila.referencia.periodos })"
          >
            {{ comparacion(fila, 'lecturas_hora').texto }}
          </VChip>
        </span>
      </template>
      <template #celda-min_totales="{ fila }">
        <span class="as-num">{{ duracion(fila.min_totales) }}</span>
      </template>
      <template #celda-min_muertos="{ fila }">
        <span class="d-inline-flex align-center gap-1 as-num">
          <span>{{ duracion(fila.min_muertos) }}</span>
          <VChip
            v-if="fila.referencia && comparacion(fila, 'min_muertos_dia').flecha"
            size="x-small"
            label
            variant="tonal"
            :color="colorComparacion(comparacion(fila, 'min_muertos_dia').mejor)"
            :prepend-icon="iconoComparacion(comparacion(fila, 'min_muertos_dia').flecha)"
            :title="t('monitoreo.ranking.promedioPropioMuertos', { v: decimal(fila.referencia.min_muertos_dia, 1), p: fila.referencia.periodos })"
          >
            {{ comparacion(fila, 'min_muertos_dia').texto }}
          </VChip>
        </span>
      </template>
      <template #celda-lejos="{ fila }">
        <span class="as-num">{{ entero(fila.lejos) }}</span>
        <span
          v-if="fila.pct_lejos !== null"
          class="as-secundario as-num"
        > ({{ decimal(fila.pct_lejos, 0) }} %)</span>
      </template>

      <template
        v-if="r.datos.value"
        #pie
      >
        <span>{{ t('monitoreo.ranking.pie', { desde: fechaCorta(`${r.datos.value.desde} 12:00:00`), hasta: fechaCorta(`${r.datos.value.hasta} 12:00:00`), periodo: r.datos.value.periodo?.nombre ?? '' }) }}</span>
      </template>
    </AsTablaDatos>
  </div>
</template>

<style scoped>
.ranking__tabla :deep(td) {
  white-space: nowrap;
}

.ranking__enlace {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
}

.ranking__enlace:hover,
.ranking__enlace:focus-visible {
  text-decoration: underline;
}
</style>
