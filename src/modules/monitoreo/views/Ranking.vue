<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { comparacion, useRanking } from '../composables/useRanking'
import { obtenerCatalogos } from '../services/monitoreoApi'
import { useAlcanceStore } from '../stores/alcanceStore'
import type { RespuestaCatalogos } from '../types/monitor'
import type { FilaRanking } from '../types/ranking'
import { fechaCorta } from '../utils/tiempo'
import EstadoError from '@/modules/reportes/components/comunes/EstadoError.vue'

/*
 * Ranking y comparativos de lecturistas (F2.4): suma de jornadas por lecturista en un rango de días del periodo, por
 * gerencia, con la comparación contra su propio promedio de los tres periodos anteriores. Exporta a Excel y PDF.
 */
const { t, n } = useI18n()
const router = useRouter()
const alcance = useAlcanceStore()
const r = useRanking()
const catalogos = ref<RespuestaCatalogos | null>(null)

const periodos = computed(() => (catalogos.value?.periodos ?? []).map(p => ({ value: p.id, title: p.abierto ? `${p.nombre} (abierto)` : p.nombre })))
const opcionesGerencia = computed(() => alcance.gerencias.map(g => ({ value: g.id, title: g.label })))
const nombreGerencia = (id: number | null) => (id === null ? '—' : alcance.gerencias.find(g => g.id === id)?.label ?? `#${id}`)

const headers = computed(() => [
  { title: '#', key: 'posicion', width: 56, align: 'end' as const },
  { title: t('monitoreo.ranking.lecturista'), key: 'nombre' },
  { title: t('monitoreo.ranking.dias'), key: 'dias', align: 'end' as const, width: 70 },
  { title: t('monitoreo.ranking.lecturas'), key: 'lecturas', align: 'end' as const, width: 100 },
  { title: t('monitoreo.ranking.lecturasDia'), key: 'lecturas_dia', align: 'end' as const, width: 150 },
  { title: t('monitoreo.ranking.lecturasHora'), key: 'lecturas_hora', align: 'end' as const, width: 130 },
  { title: t('monitoreo.ranking.minTotales'), key: 'min_totales', align: 'end' as const, width: 100 },
  { title: t('monitoreo.ranking.minMuertos'), key: 'min_muertos', align: 'end' as const, width: 130 },
  { title: t('monitoreo.ranking.anomalias'), key: 'anomalias', align: 'end' as const, width: 100 },
  { title: t('monitoreo.ranking.impresas'), key: 'impresas', align: 'end' as const, width: 90 },
  { title: t('monitoreo.ranking.lejos', { m: r.datos.value?.distancia_m ?? 50 }), key: 'lejos', align: 'end' as const, width: 90 },
  { title: t('monitoreo.ranking.apego'), key: 'apego_pct', align: 'end' as const, width: 90 },
  { title: t('monitoreo.ranking.sectores'), key: 'sectores', align: 'end' as const, width: 90 },
])

const esUnDia = computed(() => r.filtros.desde && r.filtros.desde === r.filtros.hasta)

function minutos(v: number): string {
  if (v < 60)
    return `${v} min`
  const h = Math.floor(v / 60)

  return `${h} h ${String(v % 60).padStart(2, '0')}`
}

function verJornada(fila: FilaRanking) {
  router.push({ name: 'monitoreoInicio', query: { lecturista: String(fila.lecturista_id), ...(esUnDia.value ? { dia: r.filtros.desde as string } : {}) } })
}

function iconoComparacion(flecha: 'arriba' | 'abajo' | 'igual' | null): string {
  return flecha === 'arriba' ? 'tabler-arrow-up-right' : flecha === 'abajo' ? 'tabler-arrow-down-right' : 'tabler-minus'
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
  <div>
    <div class="d-flex flex-wrap align-center justify-space-between gap-4 mb-4">
      <div>
        <h4 class="text-h4 mb-1">
          {{ t('monitoreo.ranking.titulo') }}
        </h4>
        <p class="text-body-2 text-medium-emphasis mb-0">
          {{ t('monitoreo.ranking.descripcion') }}
        </p>
      </div>
      <div class="d-flex align-center gap-2">
        <VBtn
          variant="tonal"
          prepend-icon="tabler-file-spreadsheet"
          class="text-none"
          :loading="r.exportando.value === 'xlsx'"
          :disabled="!r.filas.value.length"
          @click="r.exportar('xlsx')"
        >
          Excel
        </VBtn>
        <VBtn
          variant="tonal"
          prepend-icon="tabler-file-type-pdf"
          class="text-none"
          :loading="r.exportando.value === 'pdf'"
          :disabled="!r.filas.value.length"
          @click="r.exportar('pdf')"
        >
          PDF
        </VBtn>
      </div>
    </div>

    <EstadoError
      v-if="r.error.value && !r.datos.value"
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

    <VCard>
      <VCardText class="d-flex flex-wrap align-center gap-3 py-3">
        <VSelect
          :model-value="r.filtros.periodo"
          :items="periodos"
          :label="t('monitoreo.ranking.periodo')"
          density="compact"
          variant="outlined"
          hide-details
          class="ranking__campo"
          @update:model-value="(v: number | null) => r.aplicar({ periodo: v })"
        />
        <VSelect
          v-if="alcance.gerencias.length !== 1"
          :model-value="r.filtros.gerencia"
          :items="opcionesGerencia"
          :label="t('monitoreo.ranking.gerencia')"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          class="ranking__campo"
          @update:model-value="(v: number | null) => r.aplicar({ gerencia: v })"
        />
        <VTextField
          :model-value="r.filtros.desde"
          type="date"
          :label="t('monitoreo.ranking.desde')"
          density="compact"
          variant="outlined"
          hide-details
          :min="r.datos.value?.periodo?.inicio"
          :max="r.datos.value?.periodo?.fin"
          class="ranking__fecha"
          @update:model-value="(v: string) => r.aplicar({ desde: v || null })"
        />
        <VTextField
          :model-value="r.filtros.hasta"
          type="date"
          :label="t('monitoreo.ranking.hasta')"
          density="compact"
          variant="outlined"
          hide-details
          :min="r.filtros.desde ?? r.datos.value?.periodo?.inicio"
          :max="r.datos.value?.periodo?.fin"
          class="ranking__fecha"
          @update:model-value="(v: string) => r.aplicar({ hasta: v || null })"
        />
        <VBtn
          variant="text"
          size="small"
          class="text-none"
          @click="r.aplicar({ desde: r.datos.value?.hasta ?? null, hasta: r.datos.value?.hasta ?? null })"
        >
          {{ t('monitoreo.ranking.soloUltimoDia') }}
        </VBtn>
        <VBtn
          variant="text"
          size="small"
          class="text-none"
          @click="r.aplicar({ desde: r.datos.value?.periodo?.inicio ?? null, hasta: null })"
        >
          {{ t('monitoreo.ranking.todoElPeriodo') }}
        </VBtn>
        <VSpacer />
        <span
          v-if="r.totales.value"
          class="text-caption text-medium-emphasis"
        >
          {{ t('monitoreo.ranking.resumen', { l: r.totales.value.lecturistas, n: n(r.totales.value.lecturas), d: r.totales.value.lecturas_dia ?? '—', h: r.totales.value.lecturas_hora ?? '—' }) }}
        </span>
      </VCardText>
      <VDivider />
      <VProgressLinear
        v-if="r.cargando.value"
        indeterminate
      />
      <div
        v-if="r.datos.value"
        class="px-4 py-2 text-caption text-medium-emphasis"
      >
        <template v-if="r.datos.value.referencia_periodos.length">
          {{ t('monitoreo.ranking.referencia', { periodos: r.datos.value.referencia_periodos.join(', ') }) }}
        </template>
        <template v-else>
          {{ t('monitoreo.ranking.sinReferenciaPeriodos') }}
        </template>
      </div>

      <VDataTable
        :headers="headers"
        :items="r.filas.value"
        item-value="lecturista_id"
        density="compact"
        :items-per-page="-1"
        hide-default-footer
        :no-data-text="t('monitoreo.ranking.sinFilas')"
        class="ranking__tabla"
        hover
      >
        <template #item.posicion="{ item }">
          <span class="font-weight-medium">{{ item.posicion }}</span>
        </template>
        <template #item.nombre="{ item }">
          <a
            class="text-primary text-decoration-none font-weight-medium"
            href="#"
            @click.prevent="verJornada(item)"
          >{{ item.nombre }}</a>
          <div
            v-if="!r.filtros.gerencia && alcance.gerencias.length !== 1"
            class="text-caption text-medium-emphasis"
          >
            {{ nombreGerencia(item.gerencia_id) }}
          </div>
        </template>
        <template #item.lecturas="{ item }">
          {{ n(item.lecturas) }}
        </template>
        <template #item.lecturas_dia="{ item }">
          <div class="d-flex align-center justify-end gap-1">
            <span>{{ item.lecturas_dia ?? '—' }}</span>
            <template v-if="item.referencia">
              <VChip
                size="x-small"
                label
                variant="tonal"
                :color="comparacion(item, 'lecturas_dia').mejor === null ? undefined : comparacion(item, 'lecturas_dia').mejor ? 'success' : 'error'"
                :prepend-icon="iconoComparacion(comparacion(item, 'lecturas_dia').flecha)"
                :title="t('monitoreo.ranking.promedioPropio', { v: item.referencia.lecturas_dia ?? '—', p: item.referencia.periodos })"
              >
                {{ comparacion(item, 'lecturas_dia').texto }}
              </VChip>
            </template>
            <span
              v-else
              class="text-caption text-medium-emphasis"
            >{{ t('monitoreo.ranking.sinReferencia') }}</span>
          </div>
        </template>
        <template #item.lecturas_hora="{ item }">
          <div class="d-flex align-center justify-end gap-1">
            <span>{{ item.lecturas_hora ?? '—' }}</span>
            <VChip
              v-if="item.referencia && comparacion(item, 'lecturas_hora').flecha"
              size="x-small"
              label
              variant="tonal"
              :color="comparacion(item, 'lecturas_hora').mejor === null ? undefined : comparacion(item, 'lecturas_hora').mejor ? 'success' : 'error'"
              :prepend-icon="iconoComparacion(comparacion(item, 'lecturas_hora').flecha)"
              :title="t('monitoreo.ranking.promedioPropio', { v: item.referencia.lecturas_hora ?? '—', p: item.referencia.periodos })"
            >
              {{ comparacion(item, 'lecturas_hora').texto }}
            </VChip>
          </div>
        </template>
        <template #item.min_totales="{ item }">
          {{ minutos(item.min_totales) }}
        </template>
        <template #item.min_muertos="{ item }">
          <div class="d-flex align-center justify-end gap-1">
            <span>{{ minutos(item.min_muertos) }}</span>
            <VChip
              v-if="item.referencia && comparacion(item, 'min_muertos_dia').flecha"
              size="x-small"
              label
              variant="tonal"
              :color="comparacion(item, 'min_muertos_dia').mejor === null ? undefined : comparacion(item, 'min_muertos_dia').mejor ? 'success' : 'error'"
              :prepend-icon="iconoComparacion(comparacion(item, 'min_muertos_dia').flecha)"
              :title="t('monitoreo.ranking.promedioPropioMuertos', { v: item.referencia.min_muertos_dia ?? '—', p: item.referencia.periodos })"
            >
              {{ comparacion(item, 'min_muertos_dia').texto }}
            </VChip>
          </div>
        </template>
        <template #item.lejos="{ item }">
          {{ item.lejos }}<span
            v-if="item.pct_lejos !== null"
            class="text-caption text-medium-emphasis"
          > ({{ item.pct_lejos }} %)</span>
        </template>
        <template #item.apego_pct="{ item }">
          {{ item.apego_pct === null ? '—' : `${item.apego_pct} %` }}
        </template>
        <template #bottom>
          <VDivider />
          <div
            v-if="r.totales.value && r.datos.value"
            class="d-flex flex-wrap justify-space-between align-center px-4 py-2 text-caption text-medium-emphasis"
          >
            <span>{{ t('monitoreo.ranking.pie', { desde: fechaCorta(`${r.datos.value.desde} 12:00:00`), hasta: fechaCorta(`${r.datos.value.hasta} 12:00:00`), periodo: r.datos.value.periodo?.nombre ?? '' }) }}</span>
            <span>{{ t('monitoreo.ranking.totales', { l: n(r.totales.value.lecturas), a: n(r.totales.value.anomalias), i: n(r.totales.value.impresas), m: minutos(r.totales.value.min_muertos) }) }}</span>
          </div>
        </template>
      </VDataTable>
    </VCard>
  </div>
</template>

<style scoped>
.ranking__campo {
  flex: 1 1 220px;
  max-inline-size: 300px;
  min-inline-size: 180px;
}

.ranking__fecha {
  flex: 0 1 170px;
  max-inline-size: 190px;
  min-inline-size: 150px;
}

.ranking__tabla :deep(td) {
  white-space: nowrap;
}
</style>
