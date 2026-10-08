<script setup lang="ts">
import maplibregl from 'maplibre-gl'
import type { ExpressionSpecification, FilterSpecification, LngLatBoundsLike, MapGeoJSONFeature, Map as MapLibreMap, MapMouseEvent } from 'maplibre-gl'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMapaLecturistas } from '../composables/useMapaLecturistas'
import { useMapaTomas } from '../composables/useMapaTomas'
import type { EstadoToma, LecturistaMapaProps, SectorProps, TomaProps } from '../types/mapa'
import type { ParametrosMonitor } from '../types/monitor'
import { CLAVES_ESTADO, ORDEN_ESTADOS, cajaDe, conteosLeyenda } from '../utils/geojson'
import { haceCuanto } from '../utils/tiempo'
import { useTokensTema } from '@/composables/useTokensTema'
import { TOKEN_SECTOR, TOKEN_TOMA, tokenSenal } from '@/utils/estados'
import { entero, hora } from '@/utils/formato'
import 'maplibre-gl/dist/maplibre-gl.css'

/*
 * Mapa del monitoreo (MapLibre GL, sin llaves de pago): calles de OpenStreetMap (OpenFreeMap) con capa satelital
 * (Esri World Imagery) conmutable. Capas: tomas del periodo por estado (`feature-state` para aplicar cambios sin volver
 * a bajar todo), contornos de sector por estado, última posición de los lecturistas (color por frescura de la señal)
 * y recorrido del día del lecturista elegido. Leyenda con conteos del filtro vigente (incluye tomas sin coordenada,
 * que no se pintan). El servidor acota al alcance del usuario.
 */
const props = withDefaults(defineProps<{
  periodo?: number | null
  gerencia?: number | null
  altura?: string
  refrescoMs?: number

  /** Solo estos sectores (ids) se pintan; null = todos los del alcance. */
  sectoresFiltro?: number[] | null
  sectorSeleccionado?: number | null

  /** Parámetros de la capa de lecturistas (día, gerencia, sistema, sector, lecturista): los de la lista. */
  parametrosLecturistas?: ParametrosMonitor
  lecturistaSeleccionado?: number | null
  silencioMin?: number
}>(), { periodo: null, gerencia: null, altura: '560px', refrescoMs: 60000, sectoresFiltro: null, sectorSeleccionado: null, parametrosLecturistas: () => ({}), lecturistaSeleccionado: null, silencioMin: 90 })

const emit = defineEmits<{
  toma: [props: TomaProps, lngLat: [number, number]]
  sector: [props: SectorProps]
  lecturista: [props: LecturistaMapaProps, lngLat: [number, number]]
  escape: []
}>()

const ESTILO_CALLES = 'https://tiles.openfreemap.org/styles/liberty'
const SATELITE = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
const CENTRO_LOS_CABOS: [number, number] = [-109.82, 23.0]
const CAPAS_SECTORES = ['sectores-relleno', 'sectores-linea', 'sectores-etiqueta']
const CAPAS_LECTURISTAS = ['lecturistas-halo', 'lecturistas-puntos', 'lecturistas-etiqueta']
const CAPAS_RECORRIDO = ['recorrido-lecturas-linea', 'recorrido-linea', 'recorrido-flechas', 'recorrido-lecturas', 'recorrido-paradas', 'recorrido-paradas-texto', 'recorrido-extremos', 'recorrido-extremos-texto']

const { t } = useI18n()
const datos = useMapaTomas()
const lecturistas = useMapaLecturistas()
const contenedor = ref<HTMLDivElement | null>(null)
const satelite = ref(false)
const capas = ref({ tomas: true, sectores: true, lecturistas: true, recorrido: true })
const listo = ref(false)

let mapa: MapLibreMap | null = null
let popup: maplibregl.Popup | null = null
let controlador: AbortController | null = null
let temporizador: ReturnType<typeof setInterval> | null = null
let ajustado = false

const expresionEstado: ExpressionSpecification = ['coalesce', ['feature-state', 'e'], ['get', 'e']]
const expresionMarcas: ExpressionSpecification = ['coalesce', ['feature-state', 'm'], ['get', 'm']]

/*
 * Colores: todos salen de los tokens del tema (toma-*, sector-*, senal-*, primary…) a través de useTokensTema; al cambiar
 * de tema (claro/oscuro) se vuelven a aplicar con repintar(). Nada de hex en este archivo.
 */
const tokens = useTokensTema()
const tk = (token: string) => tokens.hex(token)
const colorPorEstado = (): ExpressionSpecification => ['match', expresionEstado, ...ORDEN_ESTADOS.flatMap(e => [e, tk(TOKEN_TOMA[e])]), tk('toma-pendiente')]
const colorSector = (): ExpressionSpecification => ['match', ['get', 'e'], ...Object.entries(TOKEN_SECTOR).flatMap(([e, token]) => [e, tk(token)]), tk('sector-sin-esperadas')]

/** Pinturas que dependen del tema, por capa: se aplican al crear y al cambiar de tema. */
function pinturasDelTema(): [string, string, unknown][] {
  return [
    ['sectores-relleno', 'fill-color', colorSector()],
    ['sectores-linea', 'line-color', colorSector()],
    ['sectores-seleccion', 'line-color', tk('primary')],
    ['sectores-etiqueta', 'text-color', tk('on-surface')],
    ['sectores-etiqueta', 'text-halo-color', tk('surface')],
    ['tomas-circulos', 'circle-color', colorPorEstado()],
    ['tomas-circulos', 'circle-stroke-color', tk('toma-lejos')],
    ['recorrido-lecturas-linea', 'line-color', tk('toma-tarifa-fija')],
    ['recorrido-linea', 'line-color', tk('primary')],
    ['recorrido-flechas', 'text-color', tk('primary-darken-1')],
    ['recorrido-flechas', 'text-halo-color', tk('surface')],
    ['recorrido-lecturas', 'circle-color', ['case', ['get', 'a'], tk('toma-anomalia'), tk('toma-tarifa-fija')]],
    ['recorrido-lecturas', 'circle-stroke-color', tk('surface')],
    ['recorrido-paradas', 'circle-color', tk('sector-iniciado')],
    ['recorrido-paradas', 'circle-stroke-color', tk('surface')],
    ['recorrido-paradas-texto', 'text-color', tk('on-sector-iniciado')],
    ['recorrido-extremos', 'circle-color', ['case', ['==', ['get', 'tipo'], 'inicio'], tk('toma-leida'), tk('toma-lejos')]],
    ['recorrido-extremos', 'circle-stroke-color', tk('surface')],
    ['recorrido-extremos-texto', 'text-color', tk('on-toma-leida')],
    ['lecturistas-halo', 'circle-color', tk('surface')],
    ['lecturistas-puntos', 'circle-stroke-color', ['case', ['get', 'elegido'], tk('primary'), tk('on-surface')]],
    ['lecturistas-etiqueta', 'text-color', tk('on-surface')],
    ['lecturistas-etiqueta', 'text-halo-color', tk('surface')],
  ]
}

function repintar() {
  if (!mapa || !listo.value)
    return
  for (const [capa, propiedad, valor] of pinturasDelTema()) {
    if (mapa.getLayer(capa))
      mapa.setPaintProperty(capa, propiedad, valor as never)
  }
  const fuente = mapa.getSource('lecturistas') as maplibregl.GeoJSONSource | undefined

  fuente?.setData(posicionesEtiquetadas())
}

tokens.alCambiar(repintar)

const relativo = (clave: 'nunca' | 'ahora' | 'minutos' | 'horas' | 'dias', n?: number) => t(`monitoreo.tiempo.${clave}`, { n })

const nombresSector = computed(() => new Map(datos.sectores.value.features.map(f => [f.properties.s, f.properties.n])))
const resumenLeyenda = computed(() => conteosLeyenda(datos.tomas.value.features, datos.sinCoordenada.value, props.sectoresFiltro))
const leyenda = computed(() => ORDEN_ESTADOS.map(e => ({ estado: e, token: TOKEN_TOMA[e], etiqueta: t(`monitoreo.mapa.estados.${CLAVES_ESTADO[e]}`), n: resumenLeyenda.value.conteos[e] })))
const leyendaSenal = [{ token: 'senal-reciente', clave: 'reciente' }, { token: 'senal-tarde', clave: 'media' }, { token: 'senal-sin-reporte', clave: 'sinReporte' }, { token: 'senal-termino', clave: 'termino' }] as const
const totalLeyenda = computed(() => Object.values(resumenLeyenda.value.conteos).reduce((a, b) => a + b, 0))

/** Posiciones con la etiqueta ("hace X") ya resuelta, para el símbolo del mapa. */
function posicionesEtiquetadas() {
  const ahora = new Date()

  return {
    type: 'FeatureCollection' as const,
    features: lecturistas.posiciones.value.features.map(f => ({
      ...f,
      properties: {
        ...f.properties,
        color: tk(tokenSenal(f.properties.estado, f.properties.minutos, props.silencioMin)),
        hace: f.properties.estado === 'sin_iniciar' ? t('monitoreo.estadoLecturista.sin_iniciar') : haceCuanto(f.properties.ultima_actividad, relativo, ahora),
        elegido: f.properties.id === props.lecturistaSeleccionado,
      },
    })),
  }
}

/** Recorrido: línea del rastreo, línea punteada por las lecturas en orden (la ruta real con la app 010A) y extremos. */
function recorridoGeoJson() {
  const r = lecturistas.recorrido.value
  if (!r)
    return { type: 'FeatureCollection' as const, features: [] as GeoJSON.Feature[] }
  const features: GeoJSON.Feature[] = [...(r.recorrido.features as GeoJSON.Feature[])]
  const lecturas = r.lecturas.features
  if (lecturas.length >= 2)
    features.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: lecturas.map(f => f.geometry.coordinates) }, properties: { tipo: 'lecturas-linea' } })
  for (const f of lecturas)
    features.push({ ...f, properties: { ...f.properties, tipo: 'lectura' } } as GeoJSON.Feature)

  return { type: 'FeatureCollection' as const, features }
}

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
  popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 10, className: 'mapa-monitoreo__popup' })

  mapa.on('load', () => {
    if (!mapa)
      return
    const primeraEtiqueta = mapa.getStyle().layers?.find(l => l.type === 'symbol')?.id

    mapa.addSource('satelite', { type: 'raster', tiles: [SATELITE], tileSize: 256, attribution: 'Imágenes: Esri, Maxar, Earthstar Geographics' })
    mapa.addLayer({ id: 'satelite', type: 'raster', source: 'satelite', layout: { visibility: 'none' } }, primeraEtiqueta)

    mapa.addSource('sectores', { type: 'geojson', data: datos.sectores.value })
    mapa.addLayer({ id: 'sectores-relleno', type: 'fill', source: 'sectores', paint: { 'fill-color': colorSector(), 'fill-opacity': 0.08 } }, primeraEtiqueta)
    mapa.addLayer({ id: 'sectores-linea', type: 'line', source: 'sectores', paint: { 'line-color': colorSector(), 'line-width': 1.5, 'line-opacity': 0.9 } }, primeraEtiqueta)
    mapa.addLayer({ id: 'sectores-seleccion', type: 'line', source: 'sectores', filter: ['==', ['get', 's'], -1], paint: { 'line-color': tk('primary'), 'line-width': 3 } }, primeraEtiqueta)
    mapa.addLayer({
      id: 'sectores-etiqueta',
      type: 'symbol',
      source: 'sectores',
      minzoom: 13,
      layout: { 'text-field': ['concat', ['get', 'n'], ' · ', ['coalesce', ['to-string', ['get', 'p']], '—'], ' %'], 'text-size': 12, 'text-anchor': 'center' },
      paint: { 'text-color': tk('on-surface'), 'text-halo-color': tk('surface'), 'text-halo-width': 1.2 },
    })

    mapa.addSource('tomas', { type: 'geojson', data: datos.tomas.value, promoteId: 'i' })
    mapa.addLayer({
      id: 'tomas-circulos',
      type: 'circle',
      source: 'tomas',
      paint: {
        'circle-color': colorPorEstado(),
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 1.2, 13, 3, 16, 6, 19, 10],
        'circle-opacity': ['interpolate', ['linear'], ['zoom'], 10, 0.6, 14, 0.9],
        'circle-stroke-color': tk('toma-lejos'),

        // El borde rojo marca "lejos de la toma" (bit 1 de las marcas); el zoom solo puede ir en el nivel superior de la expresión
        'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 12, ['case', ['==', ['%', expresionMarcas, 2], 1], 0.5, 0], 16, ['case', ['==', ['%', expresionMarcas, 2], 1], 2, 0]],
      },
    })

    // Recorrido del lecturista elegido (encima de las tomas, debajo de los lecturistas)
    mapa.addSource('recorrido', { type: 'geojson', data: recorridoGeoJson() })
    mapa.addLayer({ id: 'recorrido-lecturas-linea', type: 'line', source: 'recorrido', filter: ['==', ['get', 'tipo'], 'lecturas-linea'], paint: { 'line-color': tk('toma-tarifa-fija'), 'line-width': 2, 'line-dasharray': [1.5, 1.5], 'line-opacity': 0.9 } })
    mapa.addLayer({
      id: 'recorrido-linea',
      type: 'line',
      source: 'recorrido',
      filter: ['==', ['get', 'tipo'], 'recorrido'],
      layout: { 'line-join': 'round', 'line-cap': 'round' },

      // Ajustado a calles: azul continuo; aproximado (punto a punto): azul punteado
      paint: { 'line-color': tk('primary'), 'line-width': ['case', ['coalesce', ['get', 'ajustado'], false], 4, 3], 'line-opacity': 0.9, 'line-dasharray': ['case', ['coalesce', ['get', 'ajustado'], false], ['literal', [1, 0]], ['literal', [2, 1.5]]] },
    })

    // Flechas de dirección sobre la línea (visibles desde zoom de calle)
    mapa.addLayer({
      id: 'recorrido-flechas',
      type: 'symbol',
      source: 'recorrido',
      filter: ['==', ['get', 'tipo'], 'recorrido'],
      minzoom: 13,
      layout: { 'symbol-placement': 'line', 'symbol-spacing': 60, 'text-field': '▶', 'text-size': 12, 'text-font': ['Noto Sans Bold'], 'text-keep-upright': false, 'text-rotation-alignment': 'map', 'text-pitch-alignment': 'map', 'text-allow-overlap': true, 'text-ignore-placement': true },
      paint: { 'text-color': tk('primary-darken-1'), 'text-halo-color': tk('surface'), 'text-halo-width': 1 },
    })
    mapa.addLayer({
      id: 'recorrido-lecturas',
      type: 'circle',
      source: 'recorrido',
      filter: ['==', ['get', 'tipo'], 'lectura'],
      paint: { 'circle-color': ['case', ['get', 'a'], tk('toma-anomalia'), tk('toma-tarifa-fija')], 'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 2.5, 16, 5], 'circle-stroke-color': tk('surface'), 'circle-stroke-width': 1 },
    })

    // Paradas largas (> pausa_min sin moverse)
    mapa.addLayer({
      id: 'recorrido-paradas',
      type: 'circle',
      source: 'recorrido',
      filter: ['==', ['get', 'tipo'], 'parada'],
      paint: { 'circle-color': tk('sector-iniciado'), 'circle-radius': 8, 'circle-stroke-color': tk('surface'), 'circle-stroke-width': 2 },
    })
    mapa.addLayer({
      id: 'recorrido-paradas-texto',
      type: 'symbol',
      source: 'recorrido',
      filter: ['==', ['get', 'tipo'], 'parada'],
      layout: { 'text-field': ['concat', ['to-string', ['get', 'minutos']], '′'], 'text-size': 10, 'text-font': ['Noto Sans Bold'], 'text-allow-overlap': true },
      paint: { 'text-color': tk('on-sector-iniciado') },
    })
    mapa.addLayer({
      id: 'recorrido-extremos',
      type: 'circle',
      source: 'recorrido',
      filter: ['in', ['get', 'tipo'], ['literal', ['inicio', 'fin']]],
      paint: { 'circle-color': ['case', ['==', ['get', 'tipo'], 'inicio'], tk('toma-leida'), tk('toma-lejos')], 'circle-radius': 9, 'circle-stroke-color': tk('surface'), 'circle-stroke-width': 2 },
    })
    mapa.addLayer({
      id: 'recorrido-extremos-texto',
      type: 'symbol',
      source: 'recorrido',
      filter: ['in', ['get', 'tipo'], ['literal', ['inicio', 'fin']]],
      layout: { 'text-field': ['case', ['==', ['get', 'tipo'], 'inicio'], 'I', 'F'], 'text-size': 11, 'text-font': ['Noto Sans Bold'], 'text-allow-overlap': true },
      paint: { 'text-color': tk('on-toma-leida') },
    })

    // Lecturistas: punto con halo blanco (contraste sobre satélite) y nombre + "hace X"
    mapa.addSource('lecturistas', { type: 'geojson', data: posicionesEtiquetadas() })
    mapa.addLayer({ id: 'lecturistas-halo', type: 'circle', source: 'lecturistas', paint: { 'circle-color': tk('surface'), 'circle-radius': ['case', ['get', 'elegido'], 13, 10], 'circle-opacity': 0.95 } })
    mapa.addLayer({
      id: 'lecturistas-puntos',
      type: 'circle',
      source: 'lecturistas',
      paint: { 'circle-color': ['get', 'color'], 'circle-radius': ['case', ['get', 'elegido'], 9, 7], 'circle-stroke-color': ['case', ['get', 'elegido'], tk('primary'), tk('on-surface')], 'circle-stroke-width': ['case', ['get', 'elegido'], 3, 1] },
    })
    mapa.addLayer({
      id: 'lecturistas-etiqueta',
      type: 'symbol',
      source: 'lecturistas',
      layout: {
        'text-field': ['format', ['get', 'nombre'], {}, '\n', {}, ['get', 'hace'], { 'font-scale': 0.85 }],
        'text-size': 12,
        'text-font': ['Noto Sans Bold'],
        'text-anchor': 'top',
        'text-offset': [0, 1],
        'text-max-width': 12,
        'text-optional': true,
      },
      paint: { 'text-color': tk('on-surface'), 'text-halo-color': tk('surface'), 'text-halo-width': 1.6 },
    })

    for (const capa of ['tomas-circulos', 'sectores-relleno', 'lecturistas-puntos']) {
      mapa.on('mouseenter', capa, () => {
        if (mapa)
          mapa.getCanvas().style.cursor = 'pointer'
      })
      mapa.on('mouseleave', capa, () => {
        if (mapa)
          mapa.getCanvas().style.cursor = ''
        popup?.remove()
      })
    }
    mapa.on('mousemove', 'tomas-circulos', (evento: MapMouseEvent) => {
      const f = (mapa?.queryRenderedFeatures(evento.point, { layers: ['tomas-circulos'] }) ?? [])[0] as MapGeoJSONFeature | undefined
      if (!f || !mapa)
        return
      const estado = (mapa.getFeatureState({ source: 'tomas', id: f.id as number }) ?? {}) as Partial<TomaProps>
      const p = { ...(f.properties as TomaProps), ...estado }

      const sector = p.s !== null ? (nombresSector.value.get(p.s) ?? t('monitoreo.mapa.sectorN', { n: p.s })) : ''

      mostrarPopup((f.geometry as GeoJSON.Point).coordinates as [number, number], `<strong>${escapar(p.c)}</strong> · ${t(`monitoreo.mapa.estados.${CLAVES_ESTADO[p.e]}`)}${sector ? ` · ${escapar(sector)}` : ''}`)
    })
    mapa.on('mousemove', 'lecturistas-puntos', (evento: MapMouseEvent) => {
      const f = (mapa?.queryRenderedFeatures(evento.point, { layers: ['lecturistas-puntos'] }) ?? [])[0] as MapGeoJSONFeature | undefined
      if (!f)
        return
      const p = f.properties as LecturistaMapaProps & { hace: string }

      mostrarPopup((f.geometry as GeoJSON.Point).coordinates as [number, number], `<strong>${escapar(p.nombre)}</strong> · ${t(`monitoreo.estadoLecturista.${p.estado}`)}<br>${escapar(p.hace)} · ${t('monitoreo.mapa.lecturasHoy', { n: p.lecturas })}${p.sin_rastreo ? ` · <em>${t('monitoreo.mapa.sinRastreo')}</em>` : ''}`)
    })
    mapa.on('click', (evento: MapMouseEvent) => {
      if (!mapa)
        return
      const gente = mapa.queryRenderedFeatures(evento.point, { layers: ['lecturistas-puntos'] }) as MapGeoJSONFeature[]
      if (gente.length) {
        const f = gente[0]

        emit('lecturista', f.properties as LecturistaMapaProps, (f.geometry as GeoJSON.Point).coordinates as [number, number])

        return
      }
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
    aplicarFiltroSectores()
    aplicarSeleccion()
    aplicarCapas()
    aplicarLecturistas()
  })
}

function escapar(texto: unknown): string {
  return String(texto ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c] as string))
}

function mostrarPopup(lngLat: [number, number], html: string) {
  if (!mapa || !popup)
    return
  popup.setLngLat(lngLat).setHTML(html).addTo(mapa)
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

function aplicarLecturistas() {
  if (!mapa || !listo.value)
    return
  const fuente = mapa.getSource('lecturistas') as maplibregl.GeoJSONSource | undefined

  fuente?.setData(posicionesEtiquetadas())
}

/** Caja [oeste, sur, este, norte] de una lista de coordenadas. */
function cajaCoordenadas(puntos: [number, number][]): [number, number, number, number] | null {
  if (!puntos.length)
    return null
  let w = Number.POSITIVE_INFINITY
  let s = Number.POSITIVE_INFINITY
  let e = Number.NEGATIVE_INFINITY
  let n = Number.NEGATIVE_INFINITY
  for (const [x, y] of puntos) {
    w = Math.min(w, x)
    e = Math.max(e, x)
    s = Math.min(s, y)
    n = Math.max(n, y)
  }

  return [w, s, e, n]
}

function aplicarRecorrido(encuadrar: boolean) {
  if (!mapa || !listo.value)
    return
  const geo = recorridoGeoJson()
  const fuente = mapa.getSource('recorrido') as maplibregl.GeoJSONSource | undefined

  fuente?.setData(geo)
  if (!encuadrar || !geo.features.length)
    return
  const puntos: [number, number][] = []
  for (const f of geo.features) {
    if (f.geometry.type === 'Point')
      puntos.push(f.geometry.coordinates as [number, number])
    else if (f.geometry.type === 'LineString')
      puntos.push(...(f.geometry.coordinates as [number, number][]))
  }
  const caja = cajaCoordenadas(puntos)
  if (caja)
    mapa.fitBounds(caja as LngLatBoundsLike, { padding: 60, duration: 700, maxZoom: 16 })
}

/** Deja visibles solo las tomas y contornos de los sectores filtrados (sin volver a pedir datos). */
function aplicarFiltroSectores() {
  if (!mapa || !listo.value)
    return
  const ids = props.sectoresFiltro
  const filtro: FilterSpecification | null = ids ? ['in', ['get', 's'], ['literal', ids]] : null
  for (const capa of ['tomas-circulos', ...CAPAS_SECTORES])
    mapa.setFilter(capa, filtro)
}

function aplicarSeleccion() {
  if (!mapa || !listo.value)
    return
  mapa.setFilter('sectores-seleccion', ['==', ['get', 's'], props.sectorSeleccionado ?? -1])
}

function aplicarCapas() {
  if (!mapa || !listo.value)
    return
  const visibilidad = (visible: boolean) => (visible ? 'visible' : 'none')

  mapa.setLayoutProperty('tomas-circulos', 'visibility', visibilidad(capas.value.tomas))
  for (const capa of [...CAPAS_SECTORES, 'sectores-seleccion'])
    mapa.setLayoutProperty(capa, 'visibility', visibilidad(capas.value.sectores))
  for (const capa of CAPAS_LECTURISTAS)
    mapa.setLayoutProperty(capa, 'visibility', visibilidad(capas.value.lecturistas))
  for (const capa of CAPAS_RECORRIDO)
    mapa.setLayoutProperty(capa, 'visibility', visibilidad(capas.value.recorrido))
}

/** Caja [oeste, sur, este, norte] de una geometría GeoJSON (polígono o multipolígono). */
function cajaGeometria(coordenadas: unknown): [number, number, number, number] | null {
  const puntos: [number, number][] = []

  const visitar = (c: unknown) => {
    if (!Array.isArray(c))
      return
    if (c.length >= 2 && typeof c[0] === 'number' && typeof c[1] === 'number') {
      puntos.push([c[0], c[1]])

      return
    }
    for (const hijo of c)
      visitar(hijo)
  }

  visitar(coordenadas)

  return cajaCoordenadas(puntos)
}

async function cargar() {
  controlador?.abort()
  controlador = new AbortController()
  ajustado = false
  await Promise.all([
    datos.cargar(props.periodo, props.gerencia, controlador.signal),
    lecturistas.cargar(props.parametrosLecturistas, controlador.signal),
  ])
  aplicarDatos()
  aplicarLecturistas()
}

/** Cambio de periodo o gerencia: tomas y contornos; los lecturistas los recarga el watcher de sus parámetros. */
async function cargarTomas() {
  controlador?.abort()
  controlador = new AbortController()
  ajustado = false
  await datos.cargar(props.periodo, props.gerencia, controlador.signal)
  aplicarDatos()
}

async function cargarLecturistas() {
  await lecturistas.cargar(props.parametrosLecturistas, controlador?.signal)
  aplicarLecturistas()
}

async function refrescar() {
  const [cambios] = await Promise.all([datos.refrescar(controlador?.signal), lecturistas.refrescar(controlador?.signal)])
  if (!mapa || !listo.value)
    return
  for (const c of cambios)
    mapa.setFeatureState({ source: 'tomas', id: c.i }, { e: c.e as EstadoToma, m: c.m })
  aplicarLecturistas()
  if (props.lecturistaSeleccionado !== null) {
    await lecturistas.cargarRecorrido(props.lecturistaSeleccionado, controlador?.signal)
    aplicarRecorrido(false)
  }
}

async function mostrarRecorrido(lecturista: number | null) {
  if (lecturista === null) {
    lecturistas.limpiarRecorrido()
    aplicarRecorrido(false)
    aplicarLecturistas()

    return
  }
  await lecturistas.cargarRecorrido(lecturista, controlador?.signal)
  aplicarRecorrido(true)
  aplicarLecturistas()
}

function alternarSatelite() {
  satelite.value = !satelite.value
  mapa?.setLayoutProperty('satelite', 'visibility', satelite.value ? 'visible' : 'none')
}

function alternarCapa(capa: keyof typeof capas.value) {
  capas.value[capa] = !capas.value[capa]
  aplicarCapas()
}

function teclado(evento: KeyboardEvent) {
  if (evento.key === 'Escape') {
    popup?.remove()
    emit('escape')
  }
}

watch(() => [props.periodo, props.gerencia], cargarTomas)
watch(() => props.parametrosLecturistas, cargarLecturistas, { deep: true })
watch(() => props.sectoresFiltro, aplicarFiltroSectores, { deep: true })
watch(() => props.sectorSeleccionado, aplicarSeleccion)
watch(() => props.lecturistaSeleccionado, mostrarRecorrido)

onMounted(() => {
  crearMapa()
  cargar()
  window.addEventListener('keydown', teclado)
  temporizador = setInterval(() => {
    if (document.visibilityState === 'visible')
      refrescar()
  }, props.refrescoMs)
})

onBeforeUnmount(() => {
  controlador?.abort()
  window.removeEventListener('keydown', teclado)
  if (temporizador)
    clearInterval(temporizador)
  popup?.remove()
  mapa?.remove()
  mapa = null
})

/** Centra el mapa (p. ej. al elegir un sector en una lista). */
function irA(centro: [number, number], zoom = 15) {
  mapa?.flyTo({ center: centro, zoom, duration: 600 })
}

/** Encuadra un sector por su contorno o, si no lo tiene, por sus tomas. Devuelve false si no hay nada que encuadrar. */
function irASector(sectorId: number): boolean {
  if (!mapa)
    return false
  const contorno = datos.sectores.value.features.find(f => f.properties.s === sectorId)
  const caja = contorno ? cajaGeometria(contorno.geometry.coordinates) : cajaDe(datos.tomas.value.features.filter(f => f.properties.s === sectorId))
  if (!caja)
    return false
  mapa.fitBounds(caja as LngLatBoundsLike, { padding: 48, duration: 700, maxZoom: 16 })

  return true
}

/** Encuadra la última posición de un lecturista. */
function irALecturista(lecturistaId: number): boolean {
  const f = lecturistas.posiciones.value.features.find(x => x.properties.id === lecturistaId)
  if (!f || !mapa)
    return false
  mapa.flyTo({ center: f.geometry.coordinates, zoom: Math.max(mapa.getZoom(), 15), duration: 600 })

  return true
}

/** Instancia de MapLibre (para pruebas en el navegador y componentes que extienden el mapa). */
function instancia(): MapLibreMap | null {
  return mapa
}

defineExpose({ recargar: cargar, irA, irASector, irALecturista, instancia })
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
      <VMenu :close-on-content-click="false">
        <template #activator="{ props: activador }">
          <VBtn
            v-bind="activador"
            size="small"
            variant="elevated"
            color="surface"
            prepend-icon="tabler-stack-2"
          >
            {{ t('monitoreo.mapa.capas') }}
          </VBtn>
        </template>
        <VList
          density="compact"
          class="py-1"
        >
          <VListItem
            v-for="capa in (['tomas', 'sectores', 'lecturistas', 'recorrido'] as const)"
            :key="capa"
            @click="alternarCapa(capa)"
          >
            <template #prepend>
              <VCheckboxBtn
                :model-value="capas[capa]"
                density="compact"
                class="me-1"
              />
            </template>
            <VListItemTitle>{{ t(`monitoreo.mapa.capa.${capa}`) }}</VListItemTitle>
          </VListItem>
        </VList>
      </VMenu>
    </div>

    <VCard
      class="mapa-monitoreo__leyenda"
      density="compact"
    >
      <VCardText class="py-2 px-3">
        <div class="text-caption text-medium-emphasis mb-1">
          {{ t('monitoreo.mapa.tomas', { n: entero(totalLeyenda) }) }}
          <span v-if="resumenLeyenda.sinCoordenada"> · {{ t('monitoreo.mapa.sinCoordenada', { n: entero(resumenLeyenda.sinCoordenada) }) }}</span>
          <span v-if="lecturistas.total.value"> · {{ t('monitoreo.mapa.lecturistasN', { n: lecturistas.total.value }) }}<span v-if="lecturistas.sinRastreo.value"> ({{ t('monitoreo.mapa.sinRastreoN', { n: lecturistas.sinRastreo.value }) }})</span></span>
          <span v-if="datos.actualizado.value"> · {{ t('monitoreo.mapa.actualizado', { hora: hora(datos.actualizado.value) }) }}</span>
        </div>
        <div
          v-if="lecturistas.recorrido.value?.meta"
          class="text-caption mb-1"
          :class="lecturistas.recorrido.value.meta.ajustado ? 'text-medium-emphasis' : 'text-warning'"
        >
          <VIcon
            :icon="lecturistas.recorrido.value.meta.ajustado ? 'tabler-route' : 'tabler-route-off'"
            size="14"
            class="me-1"
          />
          <template v-if="lecturistas.recorrido.value.meta.ajustado">
            {{ t('monitoreo.mapa.recorridoCalle', { n: lecturistas.recorrido.value.meta.puntos, p: lecturistas.recorrido.value.meta.paradas ?? 0 }) }}
          </template>
          <template v-else>
            {{ lecturistas.recorrido.value.meta.aviso ?? t('monitoreo.mapa.recorridoAproximado') }}
          </template>
        </div>
        <div class="d-flex flex-wrap gap-x-3 gap-y-1">
          <span
            v-for="item in leyenda"
            :key="item.estado"
            class="d-inline-flex align-center text-caption"
          >
            <span
              class="as-punto me-1"
              :class="`bg-${item.token}`"
            />
            {{ item.etiqueta }} <strong class="ms-1 as-num">{{ entero(item.n) }}</strong>
          </span>
          <span class="d-inline-flex align-center text-caption">
            <span class="as-punto mapa-monitoreo__punto--lejos me-1" />
            {{ t('monitoreo.mapa.estados.lejos') }}
          </span>
        </div>
        <div
          v-if="capas.lecturistas"
          class="d-flex flex-wrap gap-x-3 gap-y-1 mt-1"
        >
          <span
            v-for="s in leyendaSenal"
            :key="s.token"
            class="d-inline-flex align-center text-caption"
          >
            <span
              class="as-punto mapa-monitoreo__punto--lecturista me-1"
              :class="`bg-${s.token}`"
            />{{ s.clave === 'media' ? t('monitoreo.mapa.senal.media', { n: silencioMin }) : t(`monitoreo.mapa.senal.${s.clave}`) }}
          </span>
        </div>
      </VCardText>
    </VCard>

    <VProgressLinear
      v-if="datos.cargando.value || lecturistas.cargandoRecorrido.value"
      indeterminate
      class="mapa-monitoreo__progreso"
    />
    <VAlert
      v-if="datos.error.value || lecturistas.error.value"
      type="error"
      variant="tonal"
      density="compact"
      class="mapa-monitoreo__error"
    >
      {{ (datos.error.value ?? lecturistas.error.value)?.mensaje || t('monitoreo.mapa.error') }}
    </VAlert>
  </div>
</template>

<style scoped>
.mapa-monitoreo {
  position: relative;
  overflow: hidden;
  border-radius: var(--as-radio-md);
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
  max-inline-size: 560px;
}

.mapa-monitoreo__punto--lejos {
  border: 2px solid rgb(var(--v-theme-toma-lejos));
  background: transparent;
}

.mapa-monitoreo__punto--lecturista {
  border: 2px solid rgb(var(--v-theme-on-surface));
  box-shadow: 0 0 0 2px rgb(var(--v-theme-surface));
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

.mapa-monitoreo :deep(.mapa-monitoreo__popup .maplibregl-popup-content) {
  border-radius: var(--as-radio-md);
  font-size: var(--as-fs-xs);
  line-height: 1.35;
  padding-block: 6px;
  padding-inline: 10px;
}
</style>
