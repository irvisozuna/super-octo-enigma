<script setup lang="ts">
import { useDocumentVisibility, useIntervalFn, useNow } from '@vueuse/core'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import BarraActualizacion from '../components/BarraActualizacion.vue'
import DetalleLectura from '../components/DetalleLectura.vue'
import DetalleSector from '../components/DetalleSector.vue'
import FiltrosMonitor from '../components/FiltrosMonitor.vue'
import IndicadoresMonitor from '../components/IndicadoresMonitor.vue'
import JornadaLecturista from '../components/JornadaLecturista.vue'
import MapaMonitoreo from '../components/MapaMonitoreo.vue'
import PanelesPeriodo from '../components/PanelesPeriodo.vue'
import TablaLecturistas from '../components/TablaLecturistas.vue'
import TablaSectores from '../components/TablaSectores.vue'
import { acotaSectores, filtrosDesdeQuery, queryDesdeFiltros, useFiltrosMonitor } from '../composables/useFiltrosMonitor'
import { useAlcanceStore } from '../stores/alcanceStore'
import { useMonitorStore } from '../stores/monitorStore'
import type { EstadoSector, LecturistaMapaProps, SectorProps, TomaProps } from '../types/mapa'
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
const detalleSectorAbierto = ref(false)
const lecturistaSeleccionado = ref<{ id: number; nombre: string; estado: EstadoLecturista; sinRastreo: boolean } | null>(null)
const jornadaAbierta = ref(false)
const diaJornada = ref<string | null>(null)
const filtroEstadoLecturista = ref<EstadoLecturista | null>(null)
const lecturaSeleccionada = ref<{ contrato: number; periodo: number | null } | null>(null)

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
  lecturistaSeleccionado.value = null
  jornadaAbierta.value = false
  lecturaSeleccionada.value = null
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

/** Elegir un sector (lista o mapa) lo resalta, lo encuadra y abre su detalle. */
function elegirSector(fila: FilaSector) {
  sectorSeleccionado.value = fila.sector_id
  detalleSectorAbierto.value = true
  mapa.value?.irASector(fila.sector_id)
}

function sectorDesdeMapa(props: SectorProps) {
  sectorSeleccionado.value = props.s
  detalleSectorAbierto.value = true
}

/** Desde el detalle del sector: una toma pendiente abre su detalle de lectura. */
function tomaDesdeSector(contrato: number) {
  lecturaSeleccionada.value = { contrato, periodo: periodoMapa.value }
}

/** Clic en una toma: abre el detalle de su lectura en el periodo del mapa. */
function tomaDesdeMapa(props: TomaProps) {
  lecturaSeleccionada.value = { contrato: props.i, periodo: periodoMapa.value }
}

function irASectorPorId(id: number) {
  sectorSeleccionado.value = id
  detalleSectorAbierto.value = true
  mapa.value?.irASector(id)
}

/** Elegir un lecturista (en la lista o en el mapa) traza su recorrido del día y abre su jornada. */
function elegirLecturista(l: FilaLecturista) {
  lecturistaSeleccionado.value = { id: l.lecturista_id, nombre: l.nombre, estado: l.estado, sinRastreo: l.puntos_rastreo === 0 }
  diaJornada.value = filtros.vista === 'hoy' ? filtros.dia : null
  jornadaAbierta.value = true
}

function lecturistaDesdeMapa(p: LecturistaMapaProps) {
  lecturistaSeleccionado.value = { id: p.id, nombre: p.nombre, estado: p.estado, sinRastreo: p.sin_rastreo }
  diaJornada.value = filtros.vista === 'hoy' ? filtros.dia : null
  jornadaAbierta.value = true
}

/** Desde la jornada: "ver recorrido" cierra el panel y deja el recorrido en el mapa. */
function verRecorrido(id: number) {
  jornadaAbierta.value = false
  if (lecturistaSeleccionado.value?.id !== id)
    lecturistaSeleccionado.value = { id, nombre: '', estado: 'activo', sinRastreo: false }
  mapa.value?.irALecturista(id)
  document.querySelector('.mapa-monitoreo')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}

/** Escape cierra lo abierto (recorrido, selección de sector, aviso de toma) y deja el mapa como está. */
function cerrarTodo() {
  lecturistaSeleccionado.value = null
  jornadaAbierta.value = false
  sectorSeleccionado.value = null
  detalleSectorAbierto.value = false
  lecturaSeleccionada.value = null
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

  // Enlace directo a una lectura (desde re-lecturas o alertas): /monitoreo?contrato=ID&periodo=…
  const contrato = typeof route.query.contrato === 'string' ? Number.parseInt(route.query.contrato, 10) : Number.NaN
  if (Number.isFinite(contrato) && contrato > 0)
    lecturaSeleccionada.value = { contrato, periodo: periodoMapa.value }
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

      <PanelesPeriodo
        :periodo="periodoMapa"
        :gerencia="filtros.gerencia"
        :activo="filtros.vista === 'periodo'"
        @lectura="(c: number) => { lecturaSeleccionada = { contrato: c, periodo: periodoMapa } }"
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
                :parametros-lecturistas="parametros"
                :lecturista-seleccionado="lecturistaSeleccionado?.id ?? null"
                :refresco-ms="REFRESCO_MS"
                @toma="tomaDesdeMapa"
                @sector="sectorDesdeMapa"
                @lecturista="lecturistaDesdeMapa"
                @escape="cerrarTodo"
              />
            </VCardText>
          </VCard>
          <VSnackbar
            :model-value="lecturistaSeleccionado !== null"
            location="bottom"
            :timeout="-1"
            variant="elevated"
            color="surface"
          >
            <span v-if="lecturistaSeleccionado">
              {{ t('monitoreo.mapa.lecturistaElegido', { nombre: lecturistaSeleccionado.nombre, estado: t(`monitoreo.estadoLecturista.${lecturistaSeleccionado.estado}`) }) }}
              <span
                v-if="lecturistaSeleccionado.sinRastreo"
                class="text-medium-emphasis"
              > · {{ t('monitoreo.mapa.recorridoSinRastreo') }}</span>
            </span>
            <template #actions>
              <VBtn
                size="small"
                variant="text"
                @click="lecturistaSeleccionado = null"
              >
                {{ t('monitoreo.mapa.cerrar') }}
              </VBtn>
            </template>
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

      <JornadaLecturista
        :abierto="jornadaAbierta && lecturistaSeleccionado !== null"
        :lecturista="lecturistaSeleccionado?.id ?? null"
        :dia="diaJornada"
        :ahora="ahora"
        @update:abierto="(v: boolean) => { jornadaAbierta = v }"
        @update:dia="(d: string) => { diaJornada = d }"
        @ver-recorrido="verRecorrido"
        @toma="tomaDesdeSector"
      />

      <DetalleSector
        :abierto="detalleSectorAbierto && sectorSeleccionado !== null"
        :sector="sectorSeleccionado"
        :parametros="parametros"
        :ahora="ahora"
        @update:abierto="(v: boolean) => { detalleSectorAbierto = v }"
        @ver-en-mapa="(id: number) => mapa?.irASector(id)"
        @toma="tomaDesdeSector"
      />

      <DetalleLectura
        :abierto="lecturaSeleccionada !== null"
        :contrato="lecturaSeleccionada?.contrato ?? null"
        :periodo="lecturaSeleccionada?.periodo ?? null"
        @update:abierto="(v: boolean) => { if (!v) lecturaSeleccionada = null }"
        @ver-en-mapa="(c: [number, number]) => mapa?.irA(c, 17)"
      />

      <div id="monitoreo-lecturistas">
        <TablaLecturistas
          v-model:filtro-estado="filtroEstadoLecturista"
          :lecturistas="monitor.lecturistas"
          :seleccionado="lecturistaSeleccionado?.id ?? null"
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
