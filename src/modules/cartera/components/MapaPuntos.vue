<script setup lang="ts">
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { CENTRO_LOS_CABOS, ESTILO_CALLES, coordenadaValida } from '@/components/as/mapa'
import { useTokensTema } from '@/composables/useTokensTema'

/*
 * Puntos de campo sobre MapLibre (XEL1-680, XEL1-681): cada punto con el color de un token del tema, que al tocarlo
 * emite su id. Con `ruta`, una línea que une los puntos en ese orden (el recorrido del día). Encuadra lo que muestra
 * cada vez que cambian los puntos; `autoEncuadre: false` deja la vista donde la puso el usuario (refresco automático).
 */
export interface PuntoMapa {
  id: string
  lat: number
  lng: number

  /** Token de color del tema (`success`, `error`, `warning`…). */
  token: string
  titulo?: string

  /** Más grande, con borde: la última posición de alguien. */
  destacado?: boolean
}

const props = withDefaults(defineProps<{
  puntos: PuntoMapa[]
  ruta?: [number, number][] | null
  altura?: number
  etiqueta: string
  autoEncuadre?: boolean
}>(), { ruta: null, altura: 320, autoEncuadre: true })

const emit = defineEmits<{ ver: [id: string] }>()

const tokens = useTokensTema()
const contenedor = ref<HTMLElement | null>(null)
let mapa: maplibregl.Map | null = null
let observador: ResizeObserver | null = null
let detenerTema: (() => void) | null = null
let cargado = false
let yaEncuadrado = false

const validos = computed(() => props.puntos.filter(p => coordenadaValida(p.lat, p.lng)))

const datos = computed(() => ({
  type: 'FeatureCollection' as const,
  features: validos.value.map(p => ({
    type: 'Feature' as const,
    properties: { id: p.id, color: tokens.hex(p.token), titulo: p.titulo ?? '', radio: p.destacado ? 9 : 6, borde: p.destacado ? 3 : 1.5 },
    geometry: { type: 'Point' as const, coordinates: [p.lng, p.lat] },
  })),
}))

const linea = computed(() => props.ruta && props.ruta.length > 1
  ? { type: 'Feature' as const, properties: {}, geometry: { type: 'LineString' as const, coordinates: props.ruta } }
  : { type: 'FeatureCollection' as const, features: [] })

function encuadrar(forzar = false) {
  if (!mapa || !validos.value.length || (!props.autoEncuadre && yaEncuadrado && !forzar))
    return
  const [primero] = validos.value
  const caja = new maplibregl.LngLatBounds([primero.lng, primero.lat], [primero.lng, primero.lat])

  validos.value.forEach(p => caja.extend([p.lng, p.lat]))
  mapa.fitBounds(caja, { padding: 40, maxZoom: 17, duration: 0 })
  yaEncuadrado = true
}

function pintar() {
  if (!mapa || !cargado)
    return
  const fuente = mapa.getSource('puntos') as maplibregl.GeoJSONSource | undefined
  if (fuente) {
    fuente.setData(datos.value);
    (mapa.getSource('ruta') as maplibregl.GeoJSONSource | undefined)?.setData(linea.value)

    return
  }
  mapa.addSource('ruta', { type: 'geojson', data: linea.value })
  mapa.addLayer({ id: 'ruta', type: 'line', source: 'ruta', paint: { 'line-color': tokens.hex('primary'), 'line-width': 2, 'line-opacity': 0.6 } })
  mapa.addSource('puntos', { type: 'geojson', data: datos.value })
  mapa.addLayer({
    id: 'puntos',
    type: 'circle',
    source: 'puntos',
    paint: { 'circle-radius': ['get', 'radio'], 'circle-color': ['get', 'color'], 'circle-stroke-width': ['get', 'borde'], 'circle-stroke-color': '#ffffff' },
  })
  mapa.on('click', 'puntos', e => {
    const id = e.features?.[0]?.properties?.id
    if (typeof id === 'string')
      emit('ver', id)
  })
  mapa.on('mouseenter', 'puntos', e => {
    if (!mapa)
      return
    mapa.getCanvas().style.cursor = 'pointer'

    const titulo = e.features?.[0]?.properties?.titulo

    mapa.getCanvas().title = typeof titulo === 'string' ? titulo : ''
  })
  mapa.on('mouseleave', 'puntos', () => {
    if (!mapa)
      return
    mapa.getCanvas().style.cursor = ''
    mapa.getCanvas().title = ''
  })
}

onMounted(() => {
  if (!contenedor.value)
    return
  mapa = new maplibregl.Map({ container: contenedor.value, style: ESTILO_CALLES, center: CENTRO_LOS_CABOS, zoom: 11, attributionControl: { compact: true } })
  mapa.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
  mapa.on('load', () => {
    cargado = true
    pintar()
    encuadrar(true)
  })
  observador = new ResizeObserver(() => mapa?.resize())
  observador.observe(contenedor.value)
  detenerTema = tokens.alCambiar(() => {
    pintar()
  })
})

watch([datos, linea], () => {
  pintar()
  encuadrar()
})

onBeforeUnmount(() => {
  observador?.disconnect()
  detenerTema?.()
  mapa?.remove()
  mapa = null
  cargado = false
})

defineExpose({ encuadrar: () => encuadrar(true) })
</script>

<template>
  <div
    ref="contenedor"
    class="mapa-puntos"
    :style="{ blockSize: `${altura}px` }"
    role="img"
    :aria-label="etiqueta"
  />
</template>

<style scoped>
.mapa-puntos {
  inline-size: 100%;
}
</style>
