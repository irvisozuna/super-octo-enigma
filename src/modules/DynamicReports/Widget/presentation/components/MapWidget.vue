<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useWidgetRefresh } from '../composables/useWidgetRefresh'
import type { WidgetInstanceConfig } from '../../domain/types/WidgetTypes'

interface Props {
  widget: WidgetInstanceConfig
  autoRefresh?: boolean
  refreshInterval?: number
  accessToken?: string
}

const props = withDefaults(defineProps<Props>(), {
  autoRefresh: false,
  refreshInterval: 60,
  accessToken: '',
})

const emit = defineEmits<{
  refresh: []
}>()

const {
  widgetData,
  loading,
  error,
  manualRefresh,
} = useWidgetRefresh(props.widget.id, {
  autoRefresh: props.autoRefresh,
  interval: props.refreshInterval,
  refreshOnMount: true,
})

const mapContainer = ref<HTMLDivElement | null>(null)
let map: mapboxgl.Map | null = null
const markers: mapboxgl.Marker[] = []

// Config de display
const displayConfig = computed(() => props.widget.widget?.props.displayConfig)

// Inicializar mapa
onMounted(() => {
  if (!props.accessToken) {
    console.error('Mapbox access token is required')

    return
  }

  mapboxgl.accessToken = props.accessToken

  if (mapContainer.value) {
    map = new mapboxgl.Map({
      container: mapContainer.value,
      style: displayConfig.value?.mapStyle || 'mapbox://styles/mapbox/streets-v12',
      center: displayConfig.value?.center || [0, 0],
      zoom: displayConfig.value?.zoom || 10,
    })

    // Agregar controles
    if (displayConfig.value?.showControls !== false)
      map.addControl(new mapboxgl.NavigationControl(), 'top-right')

    if (displayConfig.value?.showFullscreen)
      map.addControl(new mapboxgl.FullscreenControl(), 'top-right')

    // Cargar markers cuando el mapa esté listo
    map.on('load', () => {
      updateMarkers()
    })
  }
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
})

// Watch para actualizar markers cuando cambien los datos
watch(widgetData, () => {
  if (map)
    updateMarkers()
})

function updateMarkers() {
  if (!map || !widgetData.value)
    return

  // Limpiar markers existentes
  markers.forEach(marker => marker.remove())
  markers.length = 0

  const config = displayConfig.value
  const latField = config?.latitudeField || 'latitude'
  const lngField = config?.longitudeField || 'longitude'
  const labelField = config?.labelField
  const colorField = config?.colorField

  // Agregar nuevos markers
  widgetData.value.rows.forEach(row => {
    const lat = Number(row[latField])
    const lng = Number(row[lngField])

    if (!isNaN(lat) && !isNaN(lng)) {
      const color = colorField ? row[colorField] : config?.markerColor || '#3FB1CE'

      // Crear elemento del marker
      const el = document.createElement('div')

      el.className = 'custom-marker'
      el.style.backgroundColor = color
      el.style.width = '20px'
      el.style.height = '20px'
      el.style.borderRadius = '50%'
      el.style.border = '2px solid white'
      el.style.cursor = 'pointer'

      const marker = new mapboxgl.Marker(el)
        .setLngLat([lng, lat])

      // Agregar popup si hay labelField
      if (labelField && row[labelField]) {
        const popupContent = `
          <div style="padding: 8px;">
            <strong>${row[labelField]}</strong>
            ${config?.descriptionField ? `<p style="margin: 4px 0 0;">${row[config.descriptionField]}</p>` : ''}
          </div>
        `

        marker.setPopup(new mapboxgl.Popup().setHTML(popupContent))
      }

      marker.addTo(map!)
      markers.push(marker)
    }
  })

  // Ajustar bounds si hay markers
  if (markers.length > 0 && config?.fitBounds) {
    const bounds = new mapboxgl.LngLatBounds()

    markers.forEach(marker => bounds.extend(marker.getLngLat()))
    map!.fitBounds(bounds, { padding: 50 })
  }
}

async function handleRefresh() {
  await manualRefresh()
  emit('refresh')
}
</script>

<template>
  <VCard
    flat
    :loading="loading"
    class="map-widget"
  >
    <VCardText>
      <div class="d-flex align-center justify-space-between mb-4">
        <div>
          <h3 class="text-h6">
            {{ widget.title || widget.widget?.props.name }}
          </h3>
          <p
            v-if="widget.description"
            class="text-caption text-disabled"
          >
            {{ widget.description }}
          </p>
        </div>

        <VBtn
          icon
          variant="text"
          size="small"
          @click="handleRefresh"
        >
          <VIcon icon="tabler-refresh" />
        </VBtn>
      </div>

      <!-- Error State -->
      <VAlert
        v-if="error"
        type="error"
        variant="tonal"
        density="compact"
        class="mb-4"
      >
        {{ error }}
      </VAlert>

      <!-- Map Container -->
      <div
        ref="mapContainer"
        class="map-container"
        :style="{ height: `${displayConfig?.height || 400}px` }"
      />

      <!-- Info -->
      <div
        v-if="widgetData && widgetData.rows.length > 0"
        class="text-caption text-disabled mt-2"
      >
        {{ widgetData.rows.length }} ubicaciones
      </div>
    </VCardText>
  </VCard>
</template>

<style scoped lang="scss">
.map-widget {
  block-size: 100%;
}

.map-container {
  inline-size: 100%;
  border-radius: 8px;
  overflow: hidden;
}
</style>
