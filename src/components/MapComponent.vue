<script setup lang="ts">
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { onMounted, onUnmounted, ref, watch } from 'vue'

interface Props {
  latitude: number
  longitude: number
  accessToken: string
  zoom?: number
  height?: string
  mapType?: 'fine_location' | 'vehicle_tracking' | 'concession_overview'
}

const props = withDefaults(defineProps<Props>(), {
  zoom: 18,
  height: '500px',
  mapType: 'fine_location',
})

// Referencia al contenedor del mapa
const mapContainer = ref<HTMLElement | null>(null)
let map: mapboxgl.Map | null = null
let marker: mapboxgl.Marker | null = null
const mapError = ref<string | null>(null)
const hasMapError = ref(false)

// Configuración específica según el tipo de mapa
const getMapConfig = () => {
  const configs = {
    fine_location: {
      zoom: 18,
      style: 'mapbox://styles/mapbox/streets-v11',
      pitch: 45,
      bearing: 0,
      height: '500px',
    },
    vehicle_tracking: {
      zoom: 15,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      pitch: 30,
      bearing: 0,
      height: '400px',
    },
    concession_overview: {
      zoom: 12,
      style: 'mapbox://styles/mapbox/light-v11',
      pitch: 0,
      bearing: 0,
      height: '300px',
    },
  }

  return {
    ...configs[props.mapType],
    zoom: props.zoom || configs[props.mapType].zoom,
    height: props.height || configs[props.mapType].height,
  }
}

onMounted(() => {
  if (mapContainer.value) {
    try {
      // Asignación del token de acceso de Mapbox
      mapboxgl.accessToken = props.accessToken

      // Configuración específica según el tipo de mapa
      const mapConfig = getMapConfig()

      console.log('🗺️ Initializing map with coordinates:', {
        lat: props.latitude,
        lng: props.longitude,
        zoom: mapConfig.zoom,
        type: props.mapType,
      })

      // Inicialización del mapa
      map = new mapboxgl.Map({
        container: mapContainer.value,
        style: mapConfig.style,
        center: [props.longitude, props.latitude],
        zoom: mapConfig.zoom,
        pitch: mapConfig.pitch,
        bearing: mapConfig.bearing,
        antialias: true, // Suaviza los bordes
      })

      map.addControl(new mapboxgl.AttributionControl({
        compact: true,
        customAttribution: 'Mapa diseñado por Aquasoft',
      }), 'bottom-right')

      // Agregar controles de navegación (zoom y rotación)
      const nav = new mapboxgl.NavigationControl({ showCompass: true, showZoom: true })

      map.addControl(nav, 'top-right') // Posición del control

      // Agregar control de escala
      const scale = new mapboxgl.ScaleControl({
        maxWidth: 100,
        unit: 'metric', // Puede ser 'imperial' o 'metric'
      })

      map.addControl(scale, 'bottom-left')

      // Crear un elemento HTML personalizado para el marcador
      const markerElement = document.createElement('div')

      markerElement.style.backgroundImage = 'url(https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png)'
      markerElement.style.width = '30px'
      markerElement.style.height = '38px'
      markerElement.style.backgroundSize = '100%'

      // Agregar el marcador al mapa con el elemento personalizado
      marker = new mapboxgl.Marker({ element: markerElement })
        .setLngLat([props.longitude, props.latitude])
        .addTo(map)

      console.log('✅ Map and marker initialized successfully')
    }
    catch (error) {
      hasMapError.value = true
      mapError.value = error instanceof Error ? error.message : 'Error al inicializar el mapa'
      console.error('❌ Error al inicializar el mapa de Mapbox:', error)
      console.warn('⚠️ La aplicación continuará funcionando sin el mapa')
    }
  }
})

onUnmounted(() => {
  // Eliminación del mapa al desmontar el componente
  if (map)
    map.remove()
})

// Observador para detectar cambios en las coordenadas y actualizar el mapa y el marcador
watch(
  () => [props.latitude, props.longitude],
  ([newLat, newLng]) => {
    if (map)
      map.setCenter([newLng, newLat])

    if (marker)
      marker.setLngLat([newLng, newLat])
  },
)
</script>

<template>
  <div
    v-if="!hasMapError"
    ref="mapContainer"
    :style="{ height: getMapConfig().height }"
    class="map-container"
  />
  <div
    v-else
    :style="{ height: getMapConfig().height }"
    class="map-error-container"
  >
    <div class="map-error-content">
      <v-icon
        icon="mdi-map-marker-off"
        size="48"
        color="warning"
      />
      <h3 class="text-h6 mt-4 mb-2">
        Mapa no disponible
      </h3>
      <p class="text-body-2 text-medium-emphasis">
        {{ mapError }}
      </p>
      <p class="text-caption mt-2 text-medium-emphasis">
        La aplicación continuará funcionando normalmente
      </p>
    </div>
  </div>
</template>

<style scoped>
/* Estilos para el contenedor del mapa */
.map-container {
  overflow: hidden;
  border-radius: 8px;
  block-size: 500px; /* Aumentado para mejor visualización */
  inline-size: 100%;
}

.map-error-container {
  display: flex;
  overflow: hidden;
  align-items: center;
  justify-content: center;
  border: 2px dashed rgb(var(--v-theme-warning));
  border-radius: 8px;
  background-color: rgb(var(--v-theme-surface));
  inline-size: 100%;
}

.map-error-content {
  padding: 24px;
  max-inline-size: 400px;
  text-align: center;
}
</style>
