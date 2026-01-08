<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { LMap, LMarker, LPopup, LPolyline, LTileLayer } from '@vue-leaflet/vue-leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import BaseListHeader from '@/components/layout/BaseListHeader.vue'
import { ReadingApiService } from '../../infrastructure/api/services/ReadingApiService'

const apiService = new ReadingApiService()

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const periods = ref<any[]>([])
const downloadedRoutes = ref<any[]>([])
const readings = ref<any[]>([])
const loading = ref(false)
const readingsLoading = ref(false)

const selectedPeriodId = ref<string | null>(null)
const selectedReaderId = ref<string | null>(null)
const selectedRouteId = ref<string | null>(null)
const mapRef = ref<any>(null)
const mapCenter = ref<[number, number]>([29.081, -110.963])
const mapZoom = ref(12)

const normalizeArray = (response: any) => {
  if (Array.isArray(response))
    return response
  if (Array.isArray(response?.data))
    return response.data
  if (Array.isArray(response?.data?.data))
    return response.data.data

  return []
}

const periodOptions = computed(() => {
  return periods.value.map(period => ({
    title: period.name || period.code || period.external_id || period.externalId || period.id,
    value: period.id || period.period_id || period.uuid,
    is_active: period.is_active ?? period.isActive ?? false,
  }))
})

const readerOptions = computed(() => {
  const map = new Map<string, string>()

  downloadedRoutes.value.forEach(item => {
    const reader = item.downloaded_route?.reader
    const id = item.downloaded_route?.reader_id || reader?.id
    const name = reader?.name || id

    if (id)
      map.set(String(id), String(name))
  })

  return Array.from(map.entries()).map(([value, title]) => ({ title, value }))
})

const routeOptions = computed(() => {
  const map = new Map<string, string>()

  downloadedRoutes.value.forEach(item => {
    const routeId = item.downloaded_route?.external_route_id

    if (routeId)
      map.set(String(routeId), String(routeId))
  })

  return Array.from(map.entries()).map(([value, title]) => ({ title, value }))
})

watch(periodOptions, options => {
  if (!options.length)
    return

  const active = options.find(option => option.is_active)
  selectedPeriodId.value = active?.value || options[0].value
}, { immediate: true })

watch(readerOptions, options => {
  if (!selectedReaderId.value && options.length)
    selectedReaderId.value = options[0].value
})

watch(routeOptions, options => {
  if (!selectedRouteId.value && options.length)
    selectedRouteId.value = options[0].value
})

const filteredReadings = computed(() => {
  if (!selectedRouteId.value)
    return readings.value

  return readings.value.filter(item => {
    const routeId = item.contract?.external_route_id
      ?? item.contract?.route?.external_id
      ?? item.contract?.route?.code
      ?? item.external_route_id

    return String(routeId || '') === String(selectedRouteId.value)
  })
})

const orderedReadings = computed(() => {
  return [...filteredReadings.value].sort((a, b) => {
    const dateA = new Date(a.reading_date || 0).getTime()
    const dateB = new Date(b.reading_date || 0).getTime()

    return dateA - dateB
  })
})

const parseCoord = (value: any) => {
  if (value === null || value === undefined || value === '')
    return null

  if (typeof value === 'string')
    return Number(value.replace(',', '.'))

  const numeric = Number(value)

  return Number.isFinite(numeric) ? numeric : null
}

const mapPoints = computed(() => {
  const points = orderedReadings.value
    .map((item, index) => {
      const lat = parseCoord(item.latitude ?? item.latitud ?? item.lat ?? item.gps_lat)
      const lng = parseCoord(item.longitude ?? item.longitud ?? item.lng ?? item.gps_lng)

      if (lat === null || lng === null)
        return null

      return {
        id: item.id ?? `${index}`,
        index: index + 1,
        lat,
        lng,
        contract: item.external_contract_id ?? item.contract_id ?? item.id,
      }
    })
    .filter(Boolean) as Array<{
      id: string | number
      index: number
      lat: number
      lng: number
      contract: string | number
    }>

  if (!points.length)
    return []

  const lats = points.map(point => point.lat)
  const lngs = points.map(point => point.lng)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)

  return points.map(point => ({
    ...point,
    x: ((point.lng - minLng) / Math.max(maxLng - minLng, 0.0001)) * 100,
    y: (1 - (point.lat - minLat) / Math.max(maxLat - minLat, 0.0001)) * 100,
  }))
})

const missingCoordsCount = computed(() => {
  return orderedReadings.value.filter(item => {
    const lat = parseCoord(item.latitude ?? item.latitud ?? item.lat ?? item.gps_lat)
    const lng = parseCoord(item.longitude ?? item.longitud ?? item.lng ?? item.gps_lng)

    return lat === null || lng === null
  }).length
})

const mapLatLngs = computed(() => mapPoints.value.map(point => [point.lat, point.lng] as [number, number]))

const loadPeriods = async () => {
  loading.value = true
  try {
    const response = await apiService.getPeriods()
    periods.value = normalizeArray(response)
  }
  finally {
    loading.value = false
  }
}

const loadDownloadedRoutes = async () => {
  if (!selectedPeriodId.value)
    return

  loading.value = true
  try {
    const response = await apiService.getDownloadedRoutes(selectedPeriodId.value)
    downloadedRoutes.value = normalizeArray(response)
  }
  finally {
    loading.value = false
  }
}

const loadReadings = async () => {
  if (!selectedPeriodId.value || !selectedReaderId.value)
    return

  readingsLoading.value = true
  try {
    const response = await apiService.getList({
      period_id: selectedPeriodId.value,
      reader_id: selectedReaderId.value,
      itemsPerPage: 500,
      page: 1,
      sortBy: 'reading_date',
      sortDesc: true,
    })

    readings.value = normalizeArray(response)
  }
  finally {
    readingsLoading.value = false
  }
}

watch(selectedPeriodId, async () => {
  await loadDownloadedRoutes()
  await loadReadings()
})

watch(selectedReaderId, async () => {
  await loadReadings()
})

watch(mapLatLngs, latlngs => {
  if (!latlngs.length)
    return

  const bounds = L.latLngBounds(latlngs)
  const map = mapRef.value?.leafletObject

  if (map)
    map.fitBounds(bounds, { padding: [30, 30] })
  else
    mapCenter.value = latlngs[0]
}, { immediate: true })

onMounted(async () => {
  await loadPeriods()
  await loadDownloadedRoutes()
  await loadReadings()
})
</script>

<template>
  <div class="readings-map">
    <BaseListHeader
      title="Mapa de lecturas"
      icon="tabler-map-2"
      :total="orderedReadings.length"
      item-label="toma"
      item-label-plural="tomas"
      description="Selecciona lecturista y ruta para ver el orden de las lecturas."
      :show-create-button="false"
    />

    <VCard class="map-toolbar">
      <VCardText>
        <div class="map-toolbar__filters">
          <VSelect
            v-model="selectedPeriodId"
            :items="periodOptions"
            item-title="title"
            item-value="value"
            label="Periodo"
            density="compact"
            variant="outlined"
            hide-details
            class="map-toolbar__select"
          />
          <VSelect
            v-model="selectedReaderId"
            :items="readerOptions"
            item-title="title"
            item-value="value"
            label="Lecturista"
            density="compact"
            variant="outlined"
            hide-details
            class="map-toolbar__select"
          />
          <VSelect
            v-model="selectedRouteId"
            :items="routeOptions"
            item-title="title"
            item-value="value"
            label="Ruta"
            density="compact"
            variant="outlined"
            hide-details
            class="map-toolbar__select"
          />
        </div>
      </VCardText>
    </VCard>

    <VCard class="map-content">
      <VCardText>
        <div class="map-layout">
          <div class="map-canvas">
            <LMap
              ref="mapRef"
              v-model:zoom="mapZoom"
              :center="mapCenter"
              :use-global-leaflet="false"
              class="leaflet-map"
            >
              <LTileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              <LPolyline
                v-if="mapLatLngs.length"
                :lat-lngs="mapLatLngs"
                color="#60a5fa"
                :weight="4"
              />
              <LMarker
                v-for="point in mapPoints"
                :key="point.id"
                :lat-lng="[point.lat, point.lng]"
              >
                <LPopup>
                  <div><strong>#{{ point.index }}</strong></div>
                  <div>{{ point.contract }}</div>
                </LPopup>
              </LMarker>
            </LMap>
            <div v-if="!mapPoints.length && !readingsLoading" class="map-empty">
              No hay coordenadas para mostrar en el mapa.
            </div>
            <div v-if="readingsLoading" class="map-empty">
              Cargando lecturas...
            </div>
          </div>
          <div class="map-list">
            <div class="map-list__title">Orden de lecturas</div>
            <div
              v-if="missingCoordsCount"
              class="map-list__warning"
            >
              {{ missingCoordsCount }} lecturas sin coordenadas (latitud/longitud).
            </div>
            <div
              v-for="point in mapPoints"
              :key="`list-${point.id}`"
              class="map-list__item"
            >
              <div class="map-list__index">{{ point.index }}</div>
              <div>
                <div class="map-list__contract">{{ point.contract }}</div>
                <div class="map-list__coords">{{ point.lat.toFixed(5) }}, {{ point.lng.toFixed(5) }}</div>
              </div>
            </div>
            <div v-if="!mapPoints.length && !readingsLoading" class="map-empty-list">
              Sin lecturas para esta seleccion.
            </div>
          </div>
        </div>
      </VCardText>
    </VCard>
  </div>
</template>

<style scoped lang="scss">
.readings-map {
  inline-size: 100%;
  padding-block: 12px 32px;
}

.map-toolbar {
  margin-block-end: 16px;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
}

.map-toolbar__filters {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.map-toolbar__select {
  min-inline-size: 180px;
}

.map-content {
  border-radius: 12px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
}

.map-layout {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.map-canvas {
  position: relative;
  min-block-size: 420px;
  border-radius: 14px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  overflow: hidden;
}

.leaflet-map {
  inline-size: 100%;
  block-size: 100%;
}

.map-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 14px;
  font-weight: 600;
}

.map-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.map-list__title {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
}

.map-list__warning {
  font-size: 12px;
  color: #f97316;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  padding: 8px 10px;
  border-radius: 8px;
}

.map-list__item {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 10px 12px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.map-list__index {
  inline-size: 28px;
  block-size: 28px;
  border-radius: 8px;
  background: #dbeafe;
  color: #2563eb;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.map-list__contract {
  font-weight: 600;
  color: #1f2937;
}

.map-list__coords {
  font-size: 12px;
  color: #64748b;
}

.map-empty-list {
  font-size: 14px;
  color: #94a3b8;
}

@media (max-width: 1100px) {
  .map-layout {
    grid-template-columns: 1fr;
  }
}
</style>
