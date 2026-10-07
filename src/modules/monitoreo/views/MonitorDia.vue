<script setup lang="ts">
import { useDocumentVisibility, useIntervalFn, useNow } from '@vueuse/core'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import BarraActualizacion from '../components/BarraActualizacion.vue'
import FiltrosMonitor from '../components/FiltrosMonitor.vue'
import IndicadoresMonitor from '../components/IndicadoresMonitor.vue'
import MapaMonitoreo from '../components/MapaMonitoreo.vue'
import TablaLecturistas from '../components/TablaLecturistas.vue'
import TablaSectores from '../components/TablaSectores.vue'
import { acotaSectores, filtrosDesdeQuery, queryDesdeFiltros, useFiltrosMonitor } from '../composables/useFiltrosMonitor'
import { useAlcanceStore } from '../stores/alcanceStore'
import { useMonitorStore } from '../stores/monitorStore'
import type { EstadoSector, SectorProps, TomaProps } from '../types/mapa'
import type { EstadoLecturista, FilaLecturista, FilaSector } from '../types/monitor'
import EstadoError from '@/modules/reportes/components/comunes/EstadoError.vue'

/*
 * Pantalla principal del monitoreo (F1.1): indicadores, filtros, mapa, sectores y lecturistas del día o del periodo.
 * Se refresca cada 60 s mientras la pestaña está visible; el refresco no vacía nada (no parpadea) y el mapa aplica
 * solo los cambios (conserva zoom y selección). Los filtros viven en la URL para poder compartir la vista.
 */
const REFRESCO_MS = 60000

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const alcance = useAlcanceStore()
const monitor = useMonitorStore()
const visibilidad = useDocumentVisibility()
const ahora = useNow({ interval: 1000 })

const { filtros, sistemas, sectores, lecturistas, periodos, periodoActual, activos, parametros, cambiarVista, limpiar, aplicar }
  = useFiltrosMonitor(() => monitor.catalogos, filtrosDesdeQuery(route.query))

const mapa = ref<InstanceType<typeof MapaMonitoreo> | null>(null)
const sectorSeleccionado = ref<number | null>(null)
const filtroEstadoLecturista = ref<EstadoLecturista | null>(null)
const tomaSeleccionada = ref<{ props: TomaProps; lngLat: [number, number] } | null>(null)

let controlador: AbortController | null = null

const pausado = computed(() => visibilidad.value !== 'visible')
const esHoy = computed(() => monitor.resumen?.es_hoy ?? true)
const sectoresMapa = computed(() => (acotaSectores(filtros) || filtros.estado !== null ? monitor.sectorIds : null))
const periodoMapa = computed(() => filtros.periodo ?? periodoActual.value?.id ?? null)

const { pause, resume } = useIntervalFn(() => {
  if (!pausado.value)
    monitor.refrescar()
}, REFRESCO_MS, { immediate: false })

async function cargarTodo() {
  controlador?.abort()
  controlador = new AbortController()
  await Promise.all([alcance.cargado ? Promise.resolve() : alcance.cargar(controlador.signal), monitor.cargarCatalogos(controlador.signal)])
  if (alcance.sinAsignar)
    return
  await monitor.cargar(parametros.value)
}

function sincronizarRuta() {
  const query = queryDesdeFiltros(filtros)
  if (JSON.stringify(query) !== JSON.stringify(route.query))
    router.replace({ query })
}

watch(parametros, async (nuevo, viejo) => {
  if (JSON.stringify(nuevo) === JSON.stringify(viejo))
    return
  sincronizarRuta()
  sectorSeleccionado.value = null
  filtroEstadoLecturista.value = null
  await monitor.cargar(nuevo)
})
watch(() => filtros.vista, sincronizarRuta)

// Al volver a la pestaña, se refresca de inmediato si pasó más de un minuto
watch(pausado, p => {
  if (p) {
    pause()

    return
  }
  resume()
  if (monitor.actualizado && Date.now() - monitor.actualizado.getTime() > REFRESCO_MS)
    monitor.refrescar()
})

function elegirSector(fila: FilaSector) {
  sectorSeleccionado.value = fila.sector_id
  mapa.value?.irASector(fila.sector_id)
}

function sectorDesdeMapa(props: SectorProps) {
  sectorSeleccionado.value = props.s
}

function tomaDesdeMapa(props: TomaProps, lngLat: [number, number]) {
  tomaSeleccionada.value = { props, lngLat }
}

function irASectorPorId(id: number) {
  sectorSeleccionado.value = id
  mapa.value?.irASector(id)
}

function elegirLecturista(l: FilaLecturista) {
  aplicar({ lecturista: filtros.lecturista === l.lecturista_id ? null : l.lecturista_id })
}

function filtrarEstado(estado: EstadoSector) {
  aplicar({ estado: filtros.estado === estado ? null : estado })
}

function verAvisos() {
  filtroEstadoLecturista.value = filtroEstadoLecturista.value === 'silencio' ? null : 'silencio'
  document.getElementById('monitoreo-lecturistas')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

onMounted(async () => {
  await cargarTodo()
  resume()
})

onBeforeUnmount(() => {
  pause()
  controlador?.abort()
  monitor.cancelar()
})
</script>

<template>
  <div class="monitor-dia">
    <div class="d-flex flex-wrap align-center justify-space-between gap-3 mb-4">
      <div class="d-flex align-center flex-wrap gap-2">
        <h4 class="text-h4 mb-0">
          {{ t('monitoreo.inicio.titulo') }}
        </h4>
        <VChip
          v-if="periodoActual"
          size="small"
          variant="tonal"
          color="primary"
          prepend-icon="tabler-calendar"
        >
          {{ periodoActual.nombre }}
        </VChip>
        <template v-if="alcance.me && !alcance.todas">
          <VChip
            v-for="g in alcance.gerencias"
            :key="g.id"
            size="small"
            variant="outlined"
            prepend-icon="tabler-map-pin"
          >
            {{ g.label }}
          </VChip>
        </template>
      </div>
      <div class="d-flex align-center gap-2">
        <BarraActualizacion
          :actualizado="monitor.actualizado"
          :datos="monitor.resumen?.datos ?? null"
          :ahora="ahora"
          :refrescando="monitor.refrescando"
          :pausado="pausado"
          @refrescar="monitor.refrescar()"
        />
        <VBtn
          v-if="alcance.puedeAdministrar"
          variant="text"
          size="small"
          icon="tabler-users-group"
          :to="{ name: 'monitoreoAdminAlcances' }"
          :aria-label="t('monitoreo.menu.alcances')"
        />
      </div>
    </div>

    <EstadoError
      v-if="alcance.error"
      class="mb-4"
      :error="alcance.error"
      @reintentar="cargarTodo"
    />

    <VAlert
      v-if="alcance.me && alcance.sinAsignar"
      type="warning"
      variant="tonal"
      class="mb-4"
      :title="t('monitoreo.inicio.sinGerenciasTitulo')"
    >
      {{ t('monitoreo.inicio.sinGerenciasDetalle') }}
    </VAlert>

    <template v-if="alcance.me && !alcance.sinAsignar">
      <FiltrosMonitor
        class="mb-4"
        :filtros="filtros"
        :gerencias="alcance.gerencias"
        :periodos="periodos"
        :sistemas="sistemas"
        :sectores="sectores"
        :lecturistas="lecturistas"
        :activos="activos"
        :deshabilitado="monitor.cargando && !monitor.listo"
        @cambiar="aplicar"
        @vista="cambiarVista"
        @limpiar="limpiar"
      />

      <EstadoError
        v-if="monitor.error && !monitor.listo"
        class="mb-4"
        :error="monitor.error"
        @reintentar="monitor.cargar(parametros)"
      />
      <VAlert
        v-else-if="monitor.error"
        type="warning"
        variant="tonal"
        density="compact"
        class="mb-4"
        closable
      >
        {{ t('monitoreo.barra.errorRefresco', { mensaje: monitor.error.mensaje }) }}
      </VAlert>

      <VProgressLinear
        v-if="monitor.cargando && !monitor.listo"
        indeterminate
        class="mb-4"
      />

      <IndicadoresMonitor
        class="mb-4"
        :resumen="monitor.resumen"
        :vista="filtros.vista"
        :cargando="monitor.cargando"
        @estado="filtrarEstado"
        @avisos="verAvisos"
      />

      <VRow class="mb-1">
        <VCol
          cols="12"
          lg="6"
          xl="7"
        >
          <VCard>
            <VCardText class="pa-2">
              <MapaMonitoreo
                ref="mapa"
                altura="620px"
                :periodo="periodoMapa"
                :gerencia="filtros.gerencia"
                :sectores-filtro="sectoresMapa"
                :sector-seleccionado="sectorSeleccionado"
                :refresco-ms="REFRESCO_MS"
                @toma="tomaDesdeMapa"
                @sector="sectorDesdeMapa"
              />
            </VCardText>
          </VCard>
          <VSnackbar
            :model-value="tomaSeleccionada !== null"
            location="bottom"
            timeout="6000"
            variant="elevated"
            @update:model-value="(v: boolean) => { if (!v) tomaSeleccionada = null }"
          >
            <span v-if="tomaSeleccionada">
              {{ t('monitoreo.mapa.tomaElegida', { id: tomaSeleccionada.props.i, estado: t(`monitoreo.mapa.estados.${({ p: 'pendiente', l: 'leida', a: 'anomalia', x: 'estimada', f: 'fija' } as const)[tomaSeleccionada.props.e]}`) }) }}
              <span class="text-medium-emphasis"> · {{ t('monitoreo.mapa.detalleProximo') }}</span>
            </span>
          </VSnackbar>
        </VCol>
        <VCol
          cols="12"
          lg="6"
          xl="5"
        >
          <TablaSectores
            :sectores="monitor.sectores"
            :vista="filtros.vista"
            :seleccionado="sectorSeleccionado"
            :cargando="monitor.cargando && !monitor.listo"
            :altura="500"
            @seleccionar="elegirSector"
          />
        </VCol>
      </VRow>

      <div id="monitoreo-lecturistas">
        <TablaLecturistas
          v-model:filtro-estado="filtroEstadoLecturista"
          :lecturistas="monitor.lecturistas"
          :es-hoy="esHoy"
          :ahora="ahora"
          :cargando="monitor.cargando && !monitor.listo"
          @seleccionar="elegirLecturista"
          @sector="irASectorPorId"
        />
      </div>
    </template>
  </div>
</template>
