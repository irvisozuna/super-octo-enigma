<script setup lang="ts">
import { useDocumentVisibility, useIntervalFn, useNow } from '@vueuse/core'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import MapaMonitoreo from '../components/MapaMonitoreo.vue'
import { gerenciaFijaDesdeQuery, useQuiosco } from '../composables/useQuiosco'
import { obtenerConfiguracion, obtenerGerencias } from '../services/monitoreoApi'
import { useAlcanceStore } from '../stores/alcanceStore'
import { useMonitorStore } from '../stores/monitorStore'
import type { GerenciaRef } from '../types/api'
import { COLORES_SECTOR } from '../utils/geojson'
import { haceCuanto, horaCorta, minutosDesde } from '../utils/tiempo'

/*
 * Pantalla grande (quiosco): sin menú ni barra, tipografía grande, mapa + indicadores + sectores por terminar +
 * lecturistas del día. Rota las gerencias del alcance del usuario cada N segundos (parámetro `quiosco_rotacion_s`) o
 * se fija en una con `?gerencia=`. Refresco automático; si el servidor deja de responder, conserva el último estado
 * con su hora y lo avisa. Solo lectura: la cuenta del quiosco solo necesita `read monitoring`.
 */
const REFRESCO_MS = 60000

const { t, n } = useI18n()
const route = useRoute()
const alcance = useAlcanceStore()
const monitor = useMonitorStore()
const quiosco = useQuiosco(30)
const ahora = useNow({ interval: 1000 })
const visibilidad = useDocumentVisibility()

const mapa = ref<InstanceType<typeof MapaMonitoreo> | null>(null)
const listo = ref(false)
const ultimoExito = ref<Date | null>(null)

const gerencia = computed(() => quiosco.actual.value)
const parametros = computed(() => (gerencia.value ? { gerencia: gerencia.value.id } : {}))
const resumen = computed(() => monitor.resumen)
const avance = computed(() => resumen.value?.avance ?? null)
const lect = computed(() => resumen.value?.lecturistas ?? null)
const avisos = computed(() => resumen.value?.avisos ?? null)
const porEstado = computed(() => resumen.value?.sectores.por_estado ?? null)

const sectoresPorTerminar = computed(() => [...monitor.sectores]
  .filter(s => s.estado === 'rezagado' || s.estado === 'iniciado' || s.estado === 'pendiente')
  .sort((a, b) => {
    const peso = (e: string) => (e === 'rezagado' ? 0 : e === 'iniciado' ? 1 : 2)
    if (peso(a.estado) !== peso(b.estado))
      return peso(a.estado) - peso(b.estado)

    return (b.pct_campo ?? 0) - (a.pct_campo ?? 0)
  })
  .slice(0, 10))

const lecturistasDia = computed(() => [...monitor.lecturistas].filter(l => l.lecturas > 0 || l.estado === 'activo').sort((a, b) => b.lecturas - a.lecturas).slice(0, 12))

const sinRespuesta = computed(() => monitor.error !== null && monitor.listo)

const syncCaido = computed(() => {
  const m = minutosDesde(resumen.value?.datos.ultima_sincronizacion, ahora.value)

  return m !== null && m > 10
})

const relativo = (clave: 'nunca' | 'ahora' | 'minutos' | 'horas' | 'dias', valor?: number) => t(`monitoreo.tiempo.${clave}`, { n: valor })

const COLOR_ESTADO_LECTURISTA: Record<string, string> = { activo: '#2e7d32', silencio: '#c62828', sin_iniciar: '#f9a825', terminado: '#1e88e5', fuera_de_jornada: '#9e9e9e' }

async function cargar() {
  await monitor.cargar(parametros.value)
  if (!monitor.error)
    ultimoExito.value = new Date()
}

async function refrescar() {
  await monitor.refrescar()
  if (!monitor.error)
    ultimoExito.value = new Date()
}

// Reloj de la rotación (1 s) y refresco de datos (60 s); se pausan con la pestaña oculta
const rotacion = useIntervalFn(() => {
  if (visibilidad.value === 'visible' && quiosco.tic())
    cargar()
}, 1000, { immediate: false })

const refresco = useIntervalFn(() => {
  if (visibilidad.value === 'visible')
    refrescar()
}, REFRESCO_MS, { immediate: false })

async function iniciar() {
  const controlador = new AbortController()

  const [, configuracion] = await Promise.all([
    alcance.cargado ? Promise.resolve() : alcance.cargar(controlador.signal),
    obtenerConfiguracion({ signal: controlador.signal }).catch(() => null),
    monitor.catalogos ? Promise.resolve() : monitor.cargarCatalogos(controlador.signal),
  ])

  let gerencias: GerenciaRef[] = alcance.gerencias
  if (alcance.todas) {
    try {
      gerencias = (await obtenerGerencias({ signal: controlador.signal })).gerencias
    }
    catch {
      gerencias = []
    }
  }
  const segundos = Number(configuracion?.efectivos?.quiosco_rotacion_s ?? 30)

  quiosco.configurar(gerencias, gerenciaFijaDesdeQuery(route.query.gerencia, gerencias), segundos)
  listo.value = true
  if (alcance.sinAsignar)
    return
  await cargar()
  rotacion.resume()
  refresco.resume()
}

watch(() => quiosco.actual.value?.id, (nuevo, viejo) => {
  if (listo.value && nuevo !== viejo)
    cargar()
})

onMounted(iniciar)
onBeforeUnmount(() => {
  rotacion.pause()
  refresco.pause()
  monitor.cancelar()
})
</script>

<template>
  <div class="quiosco">
    <header class="quiosco__cabecera">
      <div class="d-flex align-center gap-4">
        <div>
          <div class="quiosco__titulo">
            {{ t('monitoreo.quiosco.titulo') }}
          </div>
          <div class="quiosco__subtitulo">
            <span v-if="gerencia">{{ gerencia.label }}</span>
            <span v-else>{{ t('monitoreo.quiosco.todas') }}</span>
            <span
              v-if="quiosco.rota.value"
              class="quiosco__tenue"
            > · {{ t('monitoreo.quiosco.rotaEn', { n: quiosco.restante.value }) }}</span>
            <span
              v-else-if="quiosco.fija.value !== null"
              class="quiosco__tenue"
            > · {{ t('monitoreo.quiosco.fija') }}</span>
            <span
              v-if="resumen?.periodo"
              class="quiosco__tenue"
            > · {{ resumen.periodo.nombre }}</span>
          </div>
        </div>
        <div
          v-if="quiosco.rota.value"
          class="quiosco__puntos"
        >
          <span
            v-for="g in quiosco.gerencias.value"
            :key="g.id"
            class="quiosco__punto"
            :class="{ 'quiosco__punto--activo': g.id === gerencia?.id }"
          />
        </div>
      </div>
      <div class="text-end">
        <div class="quiosco__reloj">
          {{ ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Mazatlan' }) }}
        </div>
        <div class="quiosco__subtitulo quiosco__tenue">
          {{ ultimoExito ? t('monitoreo.quiosco.actualizado', { hora: ultimoExito.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false }) }) : t('monitoreo.quiosco.sinDatos') }}
          <span v-if="resumen?.datos.ultima_lectura_recibida"> · {{ t('monitoreo.quiosco.ultimaLectura', { hace: haceCuanto(resumen.datos.ultima_lectura_recibida, relativo, ahora) }) }}</span>
        </div>
      </div>
      <RouterLink
        :to="{ name: 'monitoreoInicio' }"
        class="quiosco__salir"
        :title="t('monitoreo.quiosco.salir')"
      >
        <VIcon
          icon="tabler-x"
          size="28"
        />
      </RouterLink>
    </header>

    <div
      v-if="sinRespuesta || syncCaido"
      class="quiosco__aviso"
      :class="{ 'quiosco__aviso--grave': sinRespuesta }"
    >
      <VIcon
        :icon="sinRespuesta ? 'tabler-plug-connected-x' : 'tabler-clock-exclamation'"
        size="28"
        class="me-3"
      />
      {{ sinRespuesta ? t('monitoreo.quiosco.sinRespuesta', { hora: ultimoExito ? ultimoExito.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false }) : '—' }) : t('monitoreo.quiosco.syncCaido') }}
    </div>

    <div
      v-if="listo && alcance.sinAsignar"
      class="quiosco__aviso quiosco__aviso--grave"
    >
      {{ t('monitoreo.quiosco.sinGerencias') }}
    </div>

    <template v-else>
      <section class="quiosco__indicadores">
        <div class="quiosco__tarjeta">
          <div class="quiosco__etiqueta">
            {{ t('monitoreo.quiosco.avance') }}
          </div>
          <div class="quiosco__valor">
            {{ avance?.pct_campo == null ? '—' : `${n(avance.pct_campo)} %` }}
          </div>
          <div class="quiosco__barra">
            <div
              class="quiosco__barra-relleno"
              :style="{ inlineSize: `${avance?.pct_campo ?? 0}%` }"
            />
          </div>
          <div class="quiosco__detalle">
            {{ avance ? t('monitoreo.quiosco.atendidas', { a: n(avance.atendidas), e: n(avance.esperadas) }) : '' }}
          </div>
        </div>
        <div class="quiosco__tarjeta">
          <div class="quiosco__etiqueta">
            {{ t('monitoreo.quiosco.sectores') }}
          </div>
          <div class="quiosco__estados">
            <div
              v-for="e in (['pendiente', 'iniciado', 'terminado', 'rezagado'] as const)"
              :key="e"
              class="quiosco__estado"
              :class="{ 'quiosco__estado--alerta': e === 'rezagado' && (porEstado?.[e] ?? 0) > 0 }"
            >
              <span
                class="quiosco__punto-estado"
                :style="{ backgroundColor: COLORES_SECTOR[e] }"
              />
              <span class="quiosco__estado-n">{{ n(porEstado?.[e] ?? 0) }}</span>
              <span class="quiosco__estado-t">{{ t(`monitoreo.estadosSector.${e}`) }}</span>
            </div>
          </div>
        </div>
        <div class="quiosco__tarjeta">
          <div class="quiosco__etiqueta">
            {{ t('monitoreo.quiosco.lecturistas') }}
          </div>
          <div class="quiosco__valor">
            {{ lect ? n(lect.activos) : '—' }} <span class="quiosco__detalle-inline">{{ lect ? t('monitoreo.quiosco.deConLecturas', { n: n(lect.con_lecturas) }) : '' }}</span>
          </div>
          <div class="quiosco__detalle">
            {{ lect ? t('monitoreo.quiosco.lecturasDia', { n: n(lect.lecturas_dia) }) : '' }}
          </div>
        </div>
        <div
          class="quiosco__tarjeta"
          :class="{ 'quiosco__tarjeta--alerta': (avisos?.total ?? 0) > 0 }"
        >
          <div class="quiosco__etiqueta">
            {{ t('monitoreo.quiosco.avisos') }}
          </div>
          <div class="quiosco__valor">
            {{ avisos ? n(avisos.total) : '—' }}
          </div>
          <div class="quiosco__detalle">
            <template v-if="avisos">
              <span v-if="avisos.silencio">{{ avisos.silencio }} {{ t('monitoreo.avisos.silencio') }}</span>
              <span v-if="avisos.atoradas"> · {{ avisos.atoradas }} {{ t('monitoreo.avisos.atoradas') }}</span>
              <span v-if="avisos.bateria"> · {{ avisos.bateria }} {{ t('monitoreo.avisos.bateria') }}</span>
              <span v-if="avisos.rezagados"> · {{ avisos.rezagados }} {{ t('monitoreo.avisos.rezagados') }}</span>
            </template>
          </div>
        </div>
      </section>

      <section class="quiosco__contenido">
        <div class="quiosco__mapa">
          <MapaMonitoreo
            ref="mapa"
            altura="100%"
            :gerencia="gerencia?.id ?? null"
            :parametros-lecturistas="parametros"
            :refresco-ms="REFRESCO_MS"
          />
        </div>
        <aside class="quiosco__lateral">
          <div class="quiosco__panel">
            <div class="quiosco__etiqueta">
              {{ t('monitoreo.quiosco.sectoresAtrasados') }}
            </div>
            <div
              v-if="!sectoresPorTerminar.length && monitor.listo"
              class="quiosco__detalle"
            >
              {{ t('monitoreo.quiosco.sinSectoresAtrasados') }}
            </div>
            <div
              v-for="s in sectoresPorTerminar"
              :key="s.sector_id"
              class="quiosco__fila"
            >
              <span
                class="quiosco__punto-estado"
                :style="{ backgroundColor: COLORES_SECTOR[s.estado] }"
              />
              <span class="quiosco__fila-nombre">{{ s.sector }} <span class="quiosco__tenue">· {{ s.sistema }}</span></span>
              <span class="quiosco__fila-dato">{{ s.pct_campo === null ? '—' : `${n(s.pct_campo)} %` }}</span>
              <span class="quiosco__fila-dato quiosco__tenue">{{ t('monitoreo.quiosco.pendientesN', { n: n(s.pendientes) }) }}</span>
            </div>
          </div>
          <div class="quiosco__panel">
            <div class="quiosco__etiqueta">
              {{ t('monitoreo.quiosco.lecturistasActivos') }}
            </div>
            <div
              v-if="!lecturistasDia.length && monitor.listo"
              class="quiosco__detalle"
            >
              {{ t('monitoreo.quiosco.sinLecturistas') }}
            </div>
            <div
              v-for="l in lecturistasDia"
              :key="l.lecturista_id"
              class="quiosco__fila"
            >
              <span
                class="quiosco__punto-estado"
                :style="{ backgroundColor: COLOR_ESTADO_LECTURISTA[l.estado] }"
              />
              <span class="quiosco__fila-nombre">{{ l.nombre }}</span>
              <span class="quiosco__fila-dato">{{ n(l.lecturas) }} <span class="quiosco__tenue">/ {{ n(l.meta) }}</span></span>
              <span
                class="quiosco__fila-dato quiosco__tenue"
                :class="{ quiosco__rojo: l.estado === 'silencio' }"
              >{{ l.ultima_actividad ? (l.estado === 'silencio' ? horaCorta(l.ultima_actividad) : haceCuanto(l.ultima_actividad, relativo, ahora)) : '—' }}</span>
            </div>
          </div>
        </aside>
      </section>
    </template>
  </div>
</template>

<style scoped>
/* Tipografía escalada a la pantalla: ~16 px en 1080p, ~32 px en 4K */
.quiosco {
  display: flex;
  flex-direction: column;
  padding: 1rem 1.25rem;
  background: rgb(var(--v-theme-background));
  block-size: 100vh;
  color: rgb(var(--v-theme-on-background));
  font-size: clamp(14px, 0.85vw, 34px);
  gap: 0.75rem;
}

.quiosco__cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.quiosco__titulo {
  font-size: 1.75em;
  font-weight: 700;
  line-height: 1.1;
}

.quiosco__subtitulo {
  font-size: 1.15em;
}

.quiosco__tenue {
  opacity: 0.65;
}

.quiosco__rojo {
  color: #c62828;
  opacity: 1;
}

.quiosco__reloj {
  font-size: 2.4em;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  line-height: 1;
}

.quiosco__puntos {
  display: flex;
  gap: 0.4em;
}

.quiosco__punto {
  display: inline-block;
  border-radius: 50%;
  background: rgba(var(--v-theme-on-background), 0.25);
  block-size: 0.6em;
  inline-size: 0.6em;
}

.quiosco__punto--activo {
  background: rgb(var(--v-theme-primary));
}

.quiosco__salir {
  color: inherit;
  opacity: 0.4;
}

.quiosco__salir:hover {
  opacity: 1;
}

.quiosco__aviso {
  display: flex;
  align-items: center;
  padding: 0.6em 1em;
  border-radius: 0.5em;
  background: rgba(249, 168, 37, 0.2);
  font-size: 1.2em;
}

.quiosco__aviso--grave {
  background: rgba(198, 40, 40, 0.18);
}

.quiosco__indicadores {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.quiosco__tarjeta,
.quiosco__panel {
  padding: 0.8em 1em;
  border-radius: 0.6em;
  background: rgb(var(--v-theme-surface));
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.quiosco__tarjeta--alerta {
  box-shadow: inset 0.3em 0 0 #c62828, 0 1px 4px rgba(0, 0, 0, 0.08);
}

.quiosco__etiqueta {
  font-size: 1em;
  opacity: 0.7;
}

.quiosco__valor {
  font-size: 3em;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  line-height: 1.1;
}

.quiosco__detalle {
  font-size: 1em;
  opacity: 0.8;
}

.quiosco__detalle-inline {
  font-size: 0.4em;
  font-weight: 400;
  opacity: 0.7;
}

.quiosco__barra {
  overflow: hidden;
  border-radius: 0.3em;
  background: rgba(var(--v-theme-on-surface), 0.1);
  block-size: 0.5em;
  margin-block: 0.4em;
}

.quiosco__barra-relleno {
  background: rgb(var(--v-theme-primary));
  block-size: 100%;
}

.quiosco__estados {
  display: grid;
  gap: 0.3em 1em;
  grid-template-columns: 1fr 1fr;
  margin-block-start: 0.4em;
}

.quiosco__estado {
  display: flex;
  align-items: baseline;
  gap: 0.4em;
}

.quiosco__estado-n {
  font-size: 1.8em;
  font-weight: 700;
}

.quiosco__estado-t {
  font-size: 0.95em;
  opacity: 0.7;
}

.quiosco__estado--alerta .quiosco__estado-n {
  color: #c62828;
}

.quiosco__punto-estado {
  display: inline-block;
  flex: 0 0 auto;
  border-radius: 50%;
  block-size: 0.7em;
  inline-size: 0.7em;
}

.quiosco__contenido {
  display: grid;
  flex: 1 1 auto;
  gap: 0.75rem;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  min-block-size: 0;
}

.quiosco__mapa {
  overflow: hidden;
  border-radius: 0.6em;
  min-block-size: 0;
}

.quiosco__lateral {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-block-size: 0;
}

.quiosco__panel {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  min-block-size: 0;
  overflow-y: hidden;
}

.quiosco__fila {
  display: flex;
  align-items: center;
  gap: 0.6em;
  border-block-start: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  font-size: 1.05em;
  padding-block: 0.35em;
}

.quiosco__fila-nombre {
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quiosco__fila-dato {
  flex: 0 0 auto;
  font-variant-numeric: tabular-nums;
  text-align: end;
}
</style>
