<script setup lang="ts">
import { useDocumentVisibility, useIntervalFn } from '@vueuse/core'
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import FichaNotificacion from '../components/FichaNotificacion.vue'
import JornadaNotificador from '../components/JornadaNotificador.vue'
import type { PuntoMapa } from '../components/MapaPuntos.vue'
import { obtenerCatalogos, obtenerMonitorCampo } from '../services/carteraApi'
import type { AgenteMonitor, Opcion, RespuestaMonitorCampo, ResultadoNotificacion } from '../types/cartera'
import { TOKEN_GRUPO, grupoResultado } from '../utils/cartera'
import type { ColumnaTabla } from '@/components/as/tipos'
import { normalizarError } from '@/services/errores'
import type { ErrorReporte } from '@/services/errores'
import { TOKEN_TOMA_LEJOS } from '@/utils/estados'
import { entero, fechaIso, fechaLarga, hora, porcentaje } from '@/utils/formato'

/*
 * Monitor de campo de los notificadores (XEL1-681), como el monitor de lecturas: cifras del día, mapa de las visitas
 * capturadas con la app (color por resultado; las lejos de la toma en su color) con la última posición de cada uno, y
 * su tabla. Tocar a un notificador abre su jornada. Hoy se actualiza solo cada minuto mientras la pestaña se ve.
 */
const MapaPuntos = defineAsyncComponent(() => import('../components/MapaPuntos.vue'))

const { t } = useI18n()
const hoy = fechaIso()
const dia = ref(hoy)
const datos = ref<RespuestaMonitorCampo | null>(null)
const cargando = ref(false)
const error = ref<ErrorReporte | null>(null)
const actualizado = ref<Date | null>(null)
const resultados = ref<Opcion<ResultadoNotificacion>[]>([])
const jornadaDe = ref<{ id: string; nombre: string } | null>(null)
const jornadaAbierta = ref(false)
const fichaId = ref<string | null>(null)
const fichaAbierta = ref(false)
let controlador: AbortController | null = null

const esHoy = computed(() => dia.value === hoy)
const ind = computed(() => datos.value?.indicadores ?? null)

async function cargar() {
  controlador?.abort()
  controlador = new AbortController()
  cargando.value = true
  try {
    datos.value = await obtenerMonitorCampo(dia.value, dia.value, { signal: controlador.signal })
    actualizado.value = new Date()
    error.value = null
  }
  catch (e) {
    if ((e as { name?: string }).name === 'AbortError')
      return
    error.value = normalizarError(e)
  }
  finally {
    cargando.value = false
  }
}

function moverDia(dias: number) {
  const d = new Date(`${dia.value}T12:00:00`)

  d.setDate(d.getDate() + dias)

  const nuevo = fechaIso(d)
  if (nuevo <= hoy)
    dia.value = nuevo
}

watch(dia, cargar)

const visible = useDocumentVisibility()

useIntervalFn(() => {
  if (esHoy.value && visible.value === 'visible' && !cargando.value)
    cargar()
}, 60_000)

const nombreResultado = (codigo: string) => resultados.value.find(r => r.codigo === codigo)?.nombre ?? codigo.replaceAll('_', ' ')

const puntos = computed<PuntoMapa[]>(() => {
  const d = datos.value
  if (!d)
    return []
  const agentes = new Map(d.agentes.map(a => [a.id, a.nombre]))

  const visitas: PuntoMapa[] = d.puntos.map(v => ({
    id: `v:${v.notificacion_id}`,
    lat: v.lat!,
    lng: v.lng!,
    token: v.lejos ? TOKEN_TOMA_LEJOS : TOKEN_GRUPO[grupoResultado(v.resultado)],
    titulo: `${hora(v.en)} · ${agentes.get(v.agente_id ?? '') ?? ''} · ${v.cuenta ?? v.ref} · ${nombreResultado(v.resultado)}`,
  }))

  const ultimas: PuntoMapa[] = d.agentes.filter(a => a.ultima_posicion).map(a => ({
    id: `a:${a.id}`,
    lat: a.ultima_posicion!.lat,
    lng: a.ultima_posicion!.lng,
    token: 'primary',
    destacado: true,
    titulo: t('cartera.monitor.ultimaPosicion', { nombre: a.nombre, hora: hora(a.ultima_posicion!.en) }),
  }))

  return [...visitas, ...ultimas]
})

/** Un punto de visita abre su ficha; la última posición de alguien abre su jornada. */
function verPunto(id: string) {
  if (id.startsWith('v:')) {
    fichaId.value = id.slice(2)
    fichaAbierta.value = true

    return
  }
  const a = datos.value?.agentes.find(x => x.id === id.slice(2))
  if (a)
    verJornada(a)
}

function verJornada(a: AgenteMonitor) {
  jornadaDe.value = { id: a.id, nombre: a.nombre }
  jornadaAbierta.value = true
}

function verNotificacion(id: string) {
  fichaId.value = id
  fichaAbierta.value = true
}

const columnas: ColumnaTabla<AgenteMonitor>[] = [
  { clave: 'nombre', titulo: t('cartera.monitor.notificador'), formato: 'personalizado', anchoMin: 180 },
  { clave: 'visitas', titulo: t('cartera.monitor.visitas'), formato: 'personalizado', anchoMin: 170 },
  { clave: 'lejos', titulo: t('cartera.monitor.lejosTabla'), formato: 'personalizado', ancho: 80, alineacion: 'end' },
  { clave: 'ultima', titulo: t('cartera.monitor.primeraUltima'), formato: 'personalizado', ancho: 170 },
]

/** Activos primero (los que tienen visitas), luego por nombre. */
const filas = computed(() => [...(datos.value?.agentes ?? [])].sort((a, b) => (b.visitas > 0 ? 1 : 0) - (a.visitas > 0 ? 1 : 0) || a.nombre.localeCompare(b.nombre)))

onMounted(async () => {
  await Promise.all([cargar(), obtenerCatalogos().then(c => {
    resultados.value = c.resultados
  }).catch(() => null)])
})
</script>

<template>
  <div>
    <AsEncabezadoPagina
      :titulo="t('cartera.monitor.titulo')"
      :descripcion="t('cartera.monitor.descripcion')"
    >
      <template #acciones>
        <div class="monitor__dia">
          <VBtn
            icon="tabler-chevron-left"
            variant="text"
            size="small"
            :aria-label="t('cartera.monitor.diaAnterior')"
            @click="moverDia(-1)"
          />
          <VTextField
            v-model="dia"
            type="date"
            :max="hoy"
            :label="t('cartera.monitor.dia')"
            density="compact"
            hide-details
            class="monitor__fecha"
          />
          <VBtn
            icon="tabler-chevron-right"
            variant="text"
            size="small"
            :disabled="esHoy"
            :aria-label="t('cartera.monitor.diaSiguiente')"
            @click="moverDia(1)"
          />
          <AsBtnSecundario
            v-if="!esHoy"
            size="small"
            @click="dia = hoy"
          >
            {{ t('cartera.monitor.hoy') }}
          </AsBtnSecundario>
          <VBtn
            icon="tabler-refresh"
            variant="text"
            size="small"
            :loading="cargando"
            :aria-label="t('cartera.monitor.actualizar')"
            @click="cargar"
          />
        </div>
      </template>
    </AsEncabezadoPagina>

    <p class="as-secundario mb-3">
      {{ fechaLarga(`${dia}T12:00:00`) }}
      <template v-if="actualizado">
        · {{ esHoy ? t('cartera.monitor.actualizadoHoy', { hora: hora(actualizado) }) : t('cartera.monitor.actualizadoOtro', { hora: hora(actualizado) }) }}
      </template>
    </p>

    <AsEstado
      v-if="error && !datos"
      tipo="error"
      :error="error"
      @reintentar="cargar"
    />
    <template v-else>
      <div class="monitor__cifras mb-4">
        <AsIndicador
          :etiqueta="t('cartera.monitor.activos')"
          :valor="ind ? `${entero(ind.activos)} / ${entero(ind.notificadores)}` : null"
          formato="texto"
          :cargando="!ind"
          :apoyo="t('cartera.monitor.activosApoyo')"
        />
        <AsIndicador
          :etiqueta="t('cartera.monitor.visitas')"
          :valor="ind?.visitas"
          :cargando="!ind"
          :apoyo="ind ? t('cartera.monitor.desdeApp', { n: entero(ind.desde_app) }) : undefined"
        />
        <AsIndicador
          :etiqueta="t('cartera.monitor.entregadas')"
          :valor="ind?.entregadas"
          color="success"
          :cargando="!ind"
          :progreso="ind?.pct_entregadas ?? null"
          color-progreso="success"
          :apoyo="ind?.pct_entregadas != null ? t('cartera.monitor.pctVisitas', { p: porcentaje(ind.pct_entregadas, 0) }) : undefined"
        />
        <AsIndicador
          :etiqueta="t('cartera.monitor.lejos')"
          :valor="ind?.lejos"
          :color="ind?.lejos ? TOKEN_TOMA_LEJOS : undefined"
          :cargando="!ind"
          :apoyo="datos ? t('cartera.monitor.lejosApoyo', { n: datos.umbral_lejos_m }) : undefined"
        />
      </div>

      <VRow>
        <VCol cols="12">
          <VCard class="monitor__mapa">
            <MapaPuntos
              :puntos="puntos"
              :altura="420"
              :auto-encuadre="false"
              :etiqueta="t('cartera.monitor.mapaA11y', { n: puntos.length })"
              @ver="verPunto"
            />
            <div class="monitor__leyenda as-secundario">
              <span><span class="monitor__punto monitor__punto--success" /> {{ t('cartera.lotes.grupo.entregada') }}</span>
              <span><span class="monitor__punto monitor__punto--error" /> {{ t('cartera.lotes.grupo.noEntregada') }}</span>
              <span><span class="monitor__punto monitor__punto--lejos" /> {{ t('cartera.monitor.lejosCorto') }}</span>
              <span><span class="monitor__punto monitor__punto--primary monitor__punto--grande" /> {{ t('cartera.monitor.ultimaLeyenda') }}</span>
              <span
                v-if="datos && datos.puntos.length < datos.indicadores.visitas"
                class="ms-auto"
              >{{ t('cartera.monitor.sinGps', { n: entero(datos.indicadores.visitas - datos.puntos.length) }, datos.indicadores.visitas - datos.puntos.length) }}</span>
            </div>
          </VCard>
        </VCol>
        <VCol cols="12">
          <AsTablaDatos
            :columnas="columnas"
            :filas="filas"
            clave-fila="id"
            densidad="media"
            :cargando="cargando && !datos"
            :por-pagina="-1"
            ocultar-pie
            clic-fila
            :vacio-titulo="t('cartera.monitor.sinNotificadores')"
            vacio-detalle=""
            vacio-icono="tabler-users"
            @fila="(f: Record<string, unknown>) => verJornada(f as unknown as AgenteMonitor)"
          >
            <template #celda-nombre="{ fila }">
              <div
                class="text-truncate monitor__nombre"
                :title="fila.nombre"
              >
                {{ fila.nombre }}
              </div>
              <div
                v-if="!fila.usa_app"
                class="as-secundario"
              >
                {{ t('cartera.monitor.sinApp') }}
              </div>
            </template>
            <template #celda-visitas="{ fila }">
              <span class="as-num">{{ entero(fila.visitas) }}</span>
              <span class="as-secundario as-num ms-2">{{ t('cartera.monitor.entregadasPorVisitar', { entregadas: entero(fila.entregadas), pendientes: entero(fila.por_visitar) }) }}</span>
              <VProgressLinear
                v-if="fila.visitas + fila.por_visitar > 0"
                :model-value="fila.visitas / (fila.visitas + fila.por_visitar) * 100"
                height="4"
                rounded
                color="primary"
                class="mt-1"
                :aria-label="t('cartera.monitor.avanceA11y', { visitas: fila.visitas, total: fila.visitas + fila.por_visitar })"
              />
            </template>
            <template #celda-lejos="{ fila }">
              <span
                class="as-num"
                :class="fila.lejos ? 'text-toma-lejos' : 'as-secundario'"
              >{{ entero(fila.lejos) }}</span>
            </template>
            <template #celda-ultima="{ fila }">
              <span class="as-num">{{ fila.ultima ? `${hora(fila.primera)} – ${hora(fila.ultima)}` : '—' }}</span>
            </template>
          </AsTablaDatos>
        </VCol>
      </VRow>
    </template>

    <JornadaNotificador
      v-model:abierto="jornadaAbierta"
      :agente="jornadaDe"
      :desde="dia"
      :hasta="dia"
      :umbral="datos?.umbral_lejos_m ?? 100"
      :resultados="resultados"
      @ver="verNotificacion"
    />
    <FichaNotificacion
      :id="fichaId"
      v-model:abierto="fichaAbierta"
      :resultados="resultados"
      @cambio="cargar"
    />
  </div>
</template>

<style scoped>
.monitor__dia {
  display: flex;
  align-items: center;
  gap: var(--as-sp-1);
}

.monitor__fecha {
  inline-size: 11rem;
}

.monitor__cifras {
  display: grid;
  gap: var(--as-sp-3);
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
}

.monitor__mapa {
  overflow: hidden;
}

.monitor__leyenda {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--as-sp-4);
  padding-block: var(--as-sp-2);
  padding-inline: var(--as-sp-3);
}

.monitor__punto {
  display: inline-block;
  border-radius: 50%;
  block-size: 0.625rem;
  inline-size: 0.625rem;
  vertical-align: middle;
}

.monitor__punto--success {
  background: rgb(var(--v-theme-success));
}

.monitor__punto--error {
  background: rgb(var(--v-theme-error));
}

.monitor__punto--lejos {
  background: rgb(var(--v-theme-toma-lejos));
}

.monitor__punto--primary {
  background: rgb(var(--v-theme-primary));
}

.monitor__punto--grande {
  block-size: 0.875rem;
  inline-size: 0.875rem;
  outline: 2px solid rgb(var(--v-theme-surface));
}

.monitor__nombre {
  max-inline-size: 14rem;
}
</style>
