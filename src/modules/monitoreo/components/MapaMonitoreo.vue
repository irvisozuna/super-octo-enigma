<script setup lang="ts">
import maplibregl from 'maplibre-gl'
import type { ExpressionSpecification, LngLatBoundsLike, MapGeoJSONFeature, Map as MapLibreMap, MapMouseEvent } from 'maplibre-gl'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMapaTomas } from '../composables/useMapaTomas'
import type { EstadoToma, SectorProps, TomaProps } from '../types/mapa'
import { CLAVES_ESTADO, COLORES_ESTADO, COLORES_SECTOR, ORDEN_ESTADOS, cajaDe } from '../utils/geojson'
import 'maplibre-gl/dist/maplibre-gl.css'

/*
 * Mapa base del monitoreo (MapLibre GL, sin llaves de pago): calles de OpenStreetMap (OpenFreeMap) con capa satelital
 * (Esri World Imagery) conmutable; tomas del periodo por estado con `feature-state` para aplicar cambios sin volver a
 * bajar todo; contornos de sector por estado. El servidor acota al alcance del usuario.
 */
const props = withDefaults(defineProps<{
  periodo?: number | null
  gerencia?: number | null
  altura?: string
  refrescoMs?: number
}>(), { periodo: null, gerencia: null, altura: '560px', refrescoMs: 60000 })

const emit = defineEmits<{
  toma: [props: TomaProps, lngLat: [number, number]]
  sector: [props: SectorProps]
}>()

const ESTILO_CALLES = 'https://tiles.openfreemap.org/styles/liberty'
const SATELITE = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
const CENTRO_LOS_CABOS: [number, number] = [-109.82, 23.0]

const { t } = useI18n()
const datos = useMapaTomas()
const contenedor = ref<HTMLDivElement | null>(null)
const satelite = ref(false)
const verSectores = ref(true)
const listo = ref(false)

let mapa: MapLibreMap | null = null
let controlador: AbortController | null = null
let temporizador: ReturnType<typeof setInterval> | null = null
let ajustado = false

const expresionEstado: ExpressionSpecification = ['coalesce', ['feature-state', 'e'], ['get', 'e']]
const expresionMarcas: ExpressionSpecification = ['coalesce', ['feature-state', 'm'], ['get', 'm']]

const colorPorEstado: ExpressionSpecification = ['match', expresionEstado, ...ORDEN_ESTADOS.flatMap(e => [e, COLORES_ESTADO[e]]), '#9e9e9e']
const colorSector: ExpressionSpecification = ['match', ['get', 'e'], ...Object.entries(COLORES_SECTOR).flat(), '#bdbdbd']

const leyenda = computed(() => ORDEN_ESTADOS.map(e => ({ estado: e, color: COLORES_ESTADO[e], etiqueta: t(`monitoreo.mapa.estados.${CLAVES_ESTADO[e]}`), n: datos.conteos.value[e] })))

function crearMapa() {
  if (!contenedor.value)
    return
  mapa = new maplibregl.Map({
    container: contenedor.value,
    style: ESTILO_CALLES,
    center: CENTRO_LOS_CABOS,
    zoom: 10,
    attributionControl: { compact: true },
  })
  mapa.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
  mapa.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left')

  mapa.on('load', () => {
    if (!mapa)
      return
    const primeraEtiqueta = mapa.getStyle().layers?.find(l => l.type === 'symbol')?.id

    mapa.addSource('satelite', { type: 'raster', tiles: [SATELITE], tileSize: 256, attribution: 'Imágenes: Esri, Maxar, Earthstar Geographics' })
    mapa.addLayer({ id: 'satelite', type: 'raster', source: 'satelite', layout: { visibility: 'none' } }, primeraEtiqueta)

    mapa.addSource('sectores', { type: 'geojson', data: datos.sectores.value })
    mapa.addLayer({ id: 'sectores-relleno', type: 'fill', source: 'sectores', paint: { 'fill-color': colorSector, 'fill-opacity': 0.08 } }, primeraEtiqueta)
    mapa.addLayer({ id: 'sectores-linea', type: 'line', source: 'sectores', paint: { 'line-color': colorSector, 'line-width': 1.5, 'line-opacity': 0.9 } }, primeraEtiqueta)
    mapa.addLayer({
      id: 'sectores-etiqueta',
      type: 'symbol',
      source: 'sectores',
      minzoom: 13,
      layout: { 'text-field': ['concat', ['get', 'n'], ' · ', ['coalesce', ['to-string', ['get', 'p']], '—'], ' %'], 'text-size': 12, 'text-anchor': 'center' },
      paint: { 'text-color': '#263238', 'text-halo-color': '#ffffff', 'text-halo-width': 1.2 },
    })

    mapa.addSource('tomas', { type: 'geojson', data: datos.tomas.value, promoteId: 'i' })
    mapa.addLayer({
      id: 'tomas-circulos',
      type: 'circle',
      source: 'tomas',
      paint: {
        'circle-color': colorPorEstado,
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 1.2, 13, 3, 16, 6, 19, 10],
        'circle-opacity': ['interpolate', ['linear'], ['zoom'], 10, 0.6, 14, 0.9],
        'circle-stroke-color': '#c62828',

        // El borde rojo marca "lejos de la toma" (bit 1 de las marcas); el zoom solo puede ir en el nivel superior de la expresión
        'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 12, ['case', ['==', ['%', expresionMarcas, 2], 1], 0.5, 0], 16, ['case', ['==', ['%', expresionMarcas, 2], 1], 2, 0]],
      },
    })

    for (const capa of ['tomas-circulos', 'sectores-relleno']) {
      mapa.on('mouseenter', capa, () => {
        if (mapa)
          mapa.getCanvas().style.cursor = 'pointer'
      })
      mapa.on('mouseleave', capa, () => {
        if (mapa)
          mapa.getCanvas().style.cursor = ''
      })
    }
    mapa.on('click', (evento: MapMouseEvent) => {
      if (!mapa)
        return
      const tomas = mapa.queryRenderedFeatures(evento.point, { layers: ['tomas-circulos'] }) as MapGeoJSONFeature[]
      if (tomas.length) {
        const f = tomas[0]
        const estado = (mapa.getFeatureState({ source: 'tomas', id: f.id as number }) ?? {}) as Partial<TomaProps>
        const propiedades = { ...(f.properties as TomaProps), ...estado }

        emit('toma', propiedades, (f.geometry as GeoJSON.Point).coordinates as [number, number])

        return
      }
      const sectores = mapa.queryRenderedFeatures(evento.point, { layers: ['sectores-relleno'] }) as MapGeoJSONFeature[]
      if (sectores.length)
        emit('sector', sectores[0].properties as SectorProps)
    })

    listo.value = true
    aplicarDatos()
  })
}

function aplicarDatos() {
  if (!mapa || !listo.value)
    return
  const fuenteTomas = mapa.getSource('tomas') as maplibregl.GeoJSONSource | undefined
  const fuenteSectores = mapa.getSource('sectores') as maplibregl.GeoJSONSource | undefined

  fuenteTomas?.setData(datos.tomas.value)
  fuenteSectores?.setData(datos.sectores.value)
  if (!ajustado) {
    const caja = cajaDe(datos.tomas.value.features)
    if (caja) {
      mapa.fitBounds(caja as LngLatBoundsLike, { padding: 24, duration: 0, maxZoom: 15 })
      ajustado = true
    }
  }
}

async function cargar() {
  controlador?.abort()
  controlador = new AbortController()
  ajustado = false
  await datos.cargar(props.periodo, props.gerencia, controlador.signal)
  aplicarDatos()
}

async function refrescar() {
  const cambios = await datos.refrescar(controlador?.signal)
  if (!mapa || !listo.value)
    return
  for (const c of cambios)
    mapa.setFeatureState({ source: 'tomas', id: c.i }, { e: c.e as EstadoToma, m: c.m })
}

function alternarSatelite() {
  satelite.value = !satelite.value
  mapa?.setLayoutProperty('satelite', 'visibility', satelite.value ? 'visible' : 'none')
}

function alternarSectores() {
  verSectores.value = !verSectores.value
  for (const capa of ['sectores-relleno', 'sectores-linea', 'sectores-etiqueta'])
    mapa?.setLayoutProperty(capa, 'visibility', verSectores.value ? 'visible' : 'none')
}

watch(() => [props.periodo, props.gerencia], cargar)

onMounted(() => {
  crearMapa()
  cargar()
  temporizador = setInterval(() => {
    if (document.visibilityState === 'visible')
      refrescar()
  }, props.refrescoMs)
})

onBeforeUnmount(() => {
  controlador?.abort()
  if (temporizador)
    clearInterval(temporizador)
  mapa?.remove()
  mapa = null
})

/** Centra el mapa (p. ej. al elegir un sector en una lista). */
function irA(centro: [number, number], zoom = 15) {
  mapa?.flyTo({ center: centro, zoom, duration: 600 })
}

defineExpose({ recargar: cargar, irA })
</script>

<template>
  <div
    class="mapa-monitoreo"
    :style="{ blockSize: altura }"
  >
    <div
      ref="contenedor"
      class="mapa-monitoreo__lienzo"
    />

    <div class="mapa-monitoreo__controles d-flex flex-column gap-2">
      <VBtn
        size="small"
        variant="elevated"
        color="surface"
        :prepend-icon="satelite ? 'tabler-map' : 'tabler-world'"
        @click="alternarSatelite"
      >
        {{ satelite ? t('monitoreo.mapa.calles') : t('monitoreo.mapa.satelite') }}
      </VBtn>
      <VBtn
        size="small"
        variant="elevated"
        color="surface"
        :prepend-icon="verSectores ? 'tabler-polygon-off' : 'tabler-polygon'"
        @click="alternarSectores"
      >
        {{ verSectores ? t('monitoreo.mapa.ocultarSectores') : t('monitoreo.mapa.verSectores') }}
      </VBtn>
    </div>

    <VCard
      class="mapa-monitoreo__leyenda"
      density="compact"
    >
      <VCardText class="py-2 px-3">
        <div class="text-caption text-medium-emphasis mb-1">
          {{ t('monitoreo.mapa.tomas', { n: datos.total.value.toLocaleString('es-MX') }) }}
          <span v-if="datos.actualizado.value"> · {{ t('monitoreo.mapa.actualizado', { hora: datos.actualizado.value.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) }) }}</span>
        </div>
        <div class="d-flex flex-wrap gap-x-3 gap-y-1">
          <span
            v-for="item in leyenda"
            :key="item.estado"
            class="d-inline-flex align-center text-caption"
          >
            <span
              class="mapa-monitoreo__punto me-1"
              :style="{ backgroundColor: item.color }"
            />
            {{ item.etiqueta }} <strong class="ms-1">{{ item.n.toLocaleString('es-MX') }}</strong>
          </span>
          <span class="d-inline-flex align-center text-caption">
            <span class="mapa-monitoreo__punto mapa-monitoreo__punto--lejos me-1" />
            {{ t('monitoreo.mapa.estados.lejos') }}
          </span>
        </div>
      </VCardText>
    </VCard>

    <VProgressLinear
      v-if="datos.cargando.value"
      indeterminate
      class="mapa-monitoreo__progreso"
    />
    <VAlert
      v-if="datos.error.value"
      type="error"
      variant="tonal"
      density="compact"
      class="mapa-monitoreo__error"
    >
      {{ datos.error.value.mensaje || t('monitoreo.mapa.error') }}
    </VAlert>
  </div>
</template>

<style scoped>
.mapa-monitoreo {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  inline-size: 100%;
}

.mapa-monitoreo__lienzo {
  block-size: 100%;
  inline-size: 100%;
}

.mapa-monitoreo__controles {
  position: absolute;
  inset-block-start: 10px;
  inset-inline-start: 10px;
}

.mapa-monitoreo__leyenda {
  position: absolute;
  inset-block-end: 28px;
  inset-inline-end: 10px;
  max-inline-size: 520px;
}

.mapa-monitoreo__punto {
  display: inline-block;
  border-radius: 50%;
  block-size: 10px;
  inline-size: 10px;
}

.mapa-monitoreo__punto--lejos {
  border: 2px solid #c62828;
  background: transparent;
}

.mapa-monitoreo__progreso {
  position: absolute;
  inset-block-start: 0;
  inset-inline: 0;
}

.mapa-monitoreo__error {
  position: absolute;
  inset-block-start: 10px;
  inset-inline-start: 50%;
  max-inline-size: 420px;
  transform: translateX(-50%);
}
</style>
