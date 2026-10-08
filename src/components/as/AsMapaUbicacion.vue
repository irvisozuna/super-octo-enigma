<script setup lang="ts">
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AsEstado from './AsEstado.vue'
import { ATRIBUCION_SATELITE, ESTILO_CALLES, SATELITE, coordenadaValida } from './mapa'
import { useTokensTema } from '@/composables/useTokensTema'

/*
 * Mapa de un solo punto (la ubicación de una toma) sobre MapLibre con las mismas fuentes que el monitor: calles y
 * satélite, sin llave de pago. Si la coordenada no sirve, muestra el estado vacío en vez de un mapa en otra ciudad.
 * Se redimensiona solo (ResizeObserver), así funciona dentro de un diálogo que se abre después de montarlo.
 */
const props = withDefaults(defineProps<{
  lat: number | null | undefined
  lng: number | null | undefined
  altura?: number | string
  zoom?: number

  /** Texto del marcador (título accesible y tooltip). */
  etiqueta?: string
}>(), { altura: 420, zoom: 16 })

const { t } = useI18n()
const tokens = useTokensTema()
const contenedor = ref<HTMLElement | null>(null)
const satelite = ref(false)
let mapa: maplibregl.Map | null = null
let marcador: maplibregl.Marker | null = null
let observador: ResizeObserver | null = null
let detenerTema: (() => void) | null = null

const valida = computed(() => coordenadaValida(props.lat, props.lng))
const centro = computed<[number, number]>(() => [props.lng as number, props.lat as number])
const alturaCss = computed(() => (typeof props.altura === 'number' ? `${props.altura}px` : props.altura))

function ponerMarcador() {
  if (!mapa)
    return
  marcador?.remove()
  marcador = new maplibregl.Marker({ color: tokens.hex('primary') }).setLngLat(centro.value).addTo(mapa)
  if (props.etiqueta)
    marcador.getElement().setAttribute('title', props.etiqueta)
}

function iniciar() {
  if (mapa || !contenedor.value || !valida.value)
    return

  mapa = new maplibregl.Map({
    container: contenedor.value,
    style: ESTILO_CALLES,
    center: centro.value,
    zoom: props.zoom,
    attributionControl: { compact: true },
  })
  mapa.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
  mapa.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-left')

  mapa.on('load', () => {
    if (!mapa)
      return

    // Satélite debajo de las etiquetas de calles, oculto hasta que se pida
    const primeraEtiqueta = mapa.getStyle().layers.find(c => c.type === 'symbol')?.id

    mapa.addSource('satelite', { type: 'raster', tiles: [SATELITE], tileSize: 256, attribution: ATRIBUCION_SATELITE })
    mapa.addLayer({ id: 'satelite', type: 'raster', source: 'satelite', layout: { visibility: satelite.value ? 'visible' : 'none' } }, primeraEtiqueta)
    ponerMarcador()
  })

  observador = new ResizeObserver(() => mapa?.resize())
  observador.observe(contenedor.value)
  detenerTema = tokens.alCambiar(ponerMarcador)
}

function destruir() {
  observador?.disconnect()
  observador = null
  detenerTema?.()
  detenerTema = null
  marcador?.remove()
  marcador = null
  mapa?.remove()
  mapa = null
}

function alternarSatelite() {
  satelite.value = !satelite.value
  if (mapa?.getLayer('satelite'))
    mapa.setLayoutProperty('satelite', 'visibility', satelite.value ? 'visible' : 'none')
}

watch(valida, async v => {
  if (v) {
    await nextTick()
    iniciar()
  }
  else {
    destruir()
  }
}, { immediate: true })

watch(centro, c => {
  if (!mapa || !valida.value)
    return
  mapa.setCenter(c)
  marcador?.setLngLat(c)
})

onBeforeUnmount(destruir)
</script>

<template>
  <div
    class="as-mapa"
    :style="{ '--as-mapa-altura': alturaCss }"
  >
    <AsEstado
      v-if="!valida"
      tipo="vacio"
      :titulo="t('as.mapa.sinCoordenada')"
      :detalle="t('as.mapa.sinCoordenadaDetalle')"
      icono="tabler-map-pin-off"
      compacto
      class="as-mapa__vacio"
    />
    <template v-else>
      <div
        ref="contenedor"
        class="as-mapa__lienzo"
        role="img"
        :aria-label="etiqueta ?? t('as.mapa.etiqueta')"
      />
      <VBtn
        class="as-mapa__capa"
        size="small"
        variant="elevated"
        color="surface"
        :prepend-icon="satelite ? 'tabler-map' : 'tabler-world'"
        @click="alternarSatelite"
      >
        {{ satelite ? t('as.mapa.calles') : t('as.mapa.satelite') }}
      </VBtn>
    </template>
  </div>
</template>

<style scoped>
.as-mapa {
  position: relative;
  overflow: hidden;
  border: var(--as-borde);
  border-radius: var(--as-radio-lg);
  background: rgb(var(--v-theme-surface-variant));
  block-size: var(--as-mapa-altura);
}

.as-mapa__lienzo {
  block-size: 100%;
  inline-size: 100%;
}

.as-mapa__vacio {
  display: flex;
  align-items: center;
  justify-content: center;
  block-size: 100%;
}

.as-mapa__capa {
  position: absolute;
  z-index: 1;
  inset-block-start: var(--as-sp-2);
  inset-inline-start: var(--as-sp-2);
}
</style>
