<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { LMap, LMarker, LPopup, LPolyline, LTileLayer } from '@vue-leaflet/vue-leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import BaseListHeader from '@/components/layout/BaseListHeader.vue'
import { ReadingApiService } from '../../infrastructure/api/services/ReadingApiService'

const apiService = new ReadingApiService()
const route = useRoute()

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
const routeLoading = ref(false)
const routeLatLngs = ref<Array<[number, number]>>([])

const selectedPeriodId = ref<string | null>(null)
const selectedReaderId = ref<string | null>(null)
const selectedRouteId = ref<string | null>(null)
const isApplyingQuery = ref(false)
const appliedPeriodId = ref<string | null>(null)
const appliedReaderId = ref<string | null>(null)
const appliedRouteId = ref<string | null>(null)
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
    value: period.id || period.period_id || period.uuid || period.code || period.external_id || period.externalId,
    is_active: period.is_active ?? period.isActive ?? false,
  }))
})

const getDownloadedRoute = (item: any) => {
  return item?.downloaded_route ?? item?.downloadedRoute ?? item?.route_downloaded ?? item?.routeDownloaded ?? item
}

const getDownloadedPeriodId = (item: any) => {
  const downloadedRoute = getDownloadedRoute(item)
  const periodId = downloadedRoute?.period_id ?? downloadedRoute?.period?.id ?? item?.period_id ?? item?.periodId

  return periodId ? String(periodId) : null
}

const normalizeKey = (value: any) => {
  if (value === null || value === undefined)
    return null

  return String(value).trim().toLowerCase()
}

const getPeriodKeys = (period: any) => {
  return [
    period?.id,
    period?.period_id,
    period?.uuid,
    period?.code,
    period?.external_id ?? period?.externalId,
    period?.name,
  ].map(normalizeKey).filter(Boolean) as string[]
}

const getDownloadedPeriodKeys = (item: any) => {
  const downloadedRoute = getDownloadedRoute(item)
  const period = downloadedRoute?.period ?? item?.period
  const keys = [
    downloadedRoute?.period_id,
    period?.id,
    period?.code,
    period?.external_id ?? period?.externalId,
    period?.name,
    item?.period_id,
    item?.periodId,
  ]

  return keys.map(normalizeKey).filter(Boolean) as string[]
}

const resolvedPeriodId = computed(() => {
  const selectedKey = normalizeKey(appliedPeriodId.value)
  if (!selectedKey)
    return null

  const period = periods.value.find(item => getPeriodKeys(item).includes(selectedKey))
  const resolved = period?.id || period?.period_id || period?.uuid || period?.code || period?.external_id || period?.externalId

  return resolved ? String(resolved) : String(selectedPeriodId.value)
})

const selectedPeriodKeys = computed(() => {
  const selectedKey = normalizeKey(appliedPeriodId.value)
  const resolvedKey = normalizeKey(resolvedPeriodId.value)
  const period = periods.value.find(item => selectedKey && getPeriodKeys(item).includes(selectedKey))
  const keys = [
    selectedKey,
    resolvedKey,
    ...(period ? getPeriodKeys(period) : []),
  ].filter(Boolean) as string[]

  return Array.from(new Set(keys))
})

const getDownloadedReaderId = (item: any) => {
  const downloadedRoute = getDownloadedRoute(item)
  const reader = downloadedRoute?.reader ?? item?.reader
  const id = downloadedRoute?.reader_id ?? reader?.id ?? item?.reader_id ?? item?.readerId

  return id ? String(id) : null
}

const filteredDownloadedRoutes = computed(() => {
  const periodKeys = selectedPeriodKeys.value
  const readerId = appliedReaderId.value

  return downloadedRoutes.value.filter(item => {
    const keys = getDownloadedPeriodKeys(item)
    const periodMatch = !periodKeys.length || !keys.length || keys.some(key => periodKeys.includes(key))

    if (!periodMatch)
      return false

    if (!readerId)
      return true

    const currentReaderId = getDownloadedReaderId(item)
    return !!currentReaderId && String(currentReaderId) === String(readerId)
  })
})

const readerOptions = computed(() => {
  const map = new Map<string, string>()
  const periodKeys = selectedPeriodKeys.value

  downloadedRoutes.value.forEach(item => {
    const keys = getDownloadedPeriodKeys(item)
    if (periodKeys.length && keys.length && !keys.some(key => periodKeys.includes(key)))
      return

    const downloadedRoute = getDownloadedRoute(item)
    const reader = downloadedRoute?.reader ?? item?.reader
    const id = getDownloadedReaderId(item)
    const name = reader?.name || id

    if (id)
      map.set(String(id), String(name))
  })

  return Array.from(map.entries()).map(([value, title]) => ({ title, value }))
})

const routeOptions = computed(() => {
  const map = new Map<string, string>()
  filteredDownloadedRoutes.value.forEach(item => {
    const downloadedRoute = getDownloadedRoute(item)
    const route = downloadedRoute?.route ?? item?.route
    const routeId = downloadedRoute?.external_route_id
      ?? route?.external_id
      ?? route?.code
    const routeLabel = route?.name ?? route?.code ?? routeId

    if (routeId)
      map.set(String(routeId), String(routeLabel ?? routeId))
  })

  return Array.from(map.entries()).map(([value, title]) => ({ title, value }))
})

const selectedReaderLabel = computed(() => {
  if (!appliedReaderId.value)
    return '-'

  const option = readerOptions.value.find(item => String(item.value) === String(appliedReaderId.value))
  return option?.title ?? String(appliedReaderId.value)
})

const selectedRouteLabel = computed(() => {
  if (!appliedRouteId.value)
    return '-'

  const option = routeOptions.value.find(item => String(item.value) === String(appliedRouteId.value))
  return option?.title ?? String(appliedRouteId.value)
})

watch(periodOptions, options => {
  if (!options.length)
    return

  const active = options.find(option => option.is_active)
  selectedPeriodId.value = active?.value || options[0].value
}, { immediate: true })

watch(readerOptions, options => {
  if (isApplyingQuery.value)
    return

  if (!options.length) {
    selectedReaderId.value = null
    return
  }

  if (selectedReaderId.value && !options.some(option => String(option.value) === String(selectedReaderId.value)))
    selectedReaderId.value = null
})

watch(routeOptions, options => {
  if (isApplyingQuery.value)
    return

  if (!options.length) {
    selectedRouteId.value = null
    return
  }

  if (selectedRouteId.value && !options.some(option => String(option.value) === String(selectedRouteId.value)))
    selectedRouteId.value = null
})

const filteredReadings = computed(() => {
  if (!appliedRouteId.value)
    return readings.value

  return readings.value.filter(item => {
    const routeId = item.contract?.external_route_id
      ?? item.contract?.route?.external_id
      ?? item.contract?.route?.code
      ?? item.external_route_id

    return String(routeId || '') === String(appliedRouteId.value)
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
const routeKey = computed(() => mapLatLngs.value.map(point => `${point[0]},${point[1]}`).join(';'))
const startPoint = computed(() => mapPoints.value[0] || null)
const endPoint = computed(() => mapPoints.value[mapPoints.value.length - 1] || null)

const startIcon = L.divIcon({
  className: 'route-pin route-pin--start',
  html: '<span></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

const endIcon = L.divIcon({
  className: 'route-pin route-pin--end',
  html: '<span></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

const arrowIcon = (angle: number) => L.divIcon({
  className: 'route-arrow',
  html: `<span style="transform: rotate(${angle}deg)"></span>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

const toRadians = (value: number) => (value * Math.PI) / 180

const getBearing = (from: [number, number], to: [number, number]) => {
  const [lat1, lon1] = from.map(toRadians)
  const [lat2, lon2] = to.map(toRadians)
  const dLon = lon2 - lon1
  const y = Math.sin(dLon) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)
  const bearing = (Math.atan2(y, x) * 180) / Math.PI

  return (bearing + 360) % 360
}

const arrowMarkers = computed(() => {
  const points = routeLatLngs.value
  if (points.length < 2)
    return []

  const step = Math.max(2, Math.floor(points.length / 12))
  const markers: Array<{ latlng: [number, number]; angle: number }> = []

  for (let i = step; i < points.length; i += step) {
    const prev = points[i - 1]
    const curr = points[i]
    if (!prev || !curr)
      continue

    markers.push({
      latlng: curr,
      angle: getBearing(prev, curr),
    })
  }

  return markers
})

const coerceSelectValue = (value: unknown) => {
  if (value === null || value === undefined || value === '')
    return null

  return String(value)
}

const setSelectedReaderId = (value: unknown) => {
  selectedReaderId.value = coerceSelectValue(value)
}

const setSelectedRouteId = (value: unknown) => {
  selectedRouteId.value = coerceSelectValue(value)
}

const selectedReaderModel = computed({
  get: () => selectedReaderId.value,
  set: value => setSelectedReaderId(value),
})

const selectedRouteModel = computed({
  get: () => selectedRouteId.value,
  set: value => setSelectedRouteId(value),
})

const applyPeriod = async () => {
  appliedPeriodId.value = selectedPeriodId.value
  appliedReaderId.value = null
  appliedRouteId.value = null
  selectedReaderId.value = null
  selectedRouteId.value = null
  readings.value = []
  routeLatLngs.value = []
  await loadReadings()
}

const applyReader = async () => {
  appliedReaderId.value = selectedReaderId.value
  appliedRouteId.value = null
  selectedRouteId.value = null
  readings.value = []
  routeLatLngs.value = []
  await loadReadings()
}

const applyRoute = async () => {
  appliedRouteId.value = selectedRouteId.value
  readings.value = []
  routeLatLngs.value = []
  await loadReadings()
}

const applySelectionsFromQuery = async () => {
  const query = route.query
  const periodId = query.period_id ? String(query.period_id) : null
  const readerId = query.reader_id ? String(query.reader_id) : null
  const routeId = query.route_id ? String(query.route_id) : null

  if (!periodId && !readerId && !routeId)
    return false

  isApplyingQuery.value = true

  if (periodId) {
    selectedPeriodId.value = periodId
    await applyPeriod()
  }

  await loadDownloadedRoutes()

  if (readerId) {
    selectedReaderId.value = readerId
    await applyReader()
  }

  if (routeId) {
    selectedRouteId.value = routeId
    await applyRoute()
  }

  isApplyingQuery.value = false
  return true
}

const focusOnPoint = (point: { lat: number; lng: number }) => {
  const map = mapRef.value?.leafletObject
  if (!map)
    return

  const currentZoom = map.getZoom?.()
  map.setView([point.lat, point.lng], currentZoom ?? mapZoom.value, { animate: true })
}

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
  loading.value = true
  try {
    const response = await apiService.getDownloadedRoutes()
    downloadedRoutes.value = normalizeArray(response)
  }
  finally {
    loading.value = false
  }
}

const loadReadings = async () => {
  if (!resolvedPeriodId.value || !appliedReaderId.value)
    return

  readingsLoading.value = true
  try {
    const response = await apiService.getList({
      period_id: resolvedPeriodId.value,
      reader_id: appliedReaderId.value,
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

const buildOsrmCoords = (latlngs: Array<[number, number]>, maxPoints = 100) => {
  if (latlngs.length <= maxPoints)
    return latlngs

  const step = Math.ceil(latlngs.length / maxPoints)

  return latlngs.filter((_, index) => index % step === 0)
}

const fetchOsrmRoute = async (latlngs: Array<[number, number]>) => {
  if (latlngs.length < 2) {
    routeLatLngs.value = latlngs
    return
  }

  const coords = buildOsrmCoords(latlngs)
  const coordString = coords.map(([lat, lng]) => `${lng},${lat}`).join(';')

  const tryFetch = async (profile: 'walking' | 'driving') => {
    const response = await fetch(`https://router.project-osrm.org/route/v1/${profile}/${coordString}?overview=full&geometries=geojson`)
    if (!response.ok)
      throw new Error(`OSRM ${profile} failed`)

    return response.json()
  }

  routeLoading.value = true
  try {
    let data
    try {
      data = await tryFetch('walking')
    }
    catch {
      data = await tryFetch('driving')
    }

    const geometry = data?.routes?.[0]?.geometry?.coordinates || []
    routeLatLngs.value = geometry.map((point: [number, number]) => [point[1], point[0]])
  }
  catch {
    routeLatLngs.value = latlngs
  }
  finally {
    routeLoading.value = false
  }
}

watch(selectedPeriodId, async () => {
  if (selectedPeriodId.value && selectedPeriodId.value !== appliedPeriodId.value)
    await applyPeriod()
  else
    selectedRouteId.value = null
})

watch(selectedReaderId, async () => {
  if (!appliedPeriodId.value)
    return

  if (selectedReaderId.value && selectedReaderId.value !== appliedReaderId.value)
    await applyReader()
  else
    selectedRouteId.value = null
})

watch(selectedRouteId, async () => {
  if (!appliedReaderId.value)
    return

  if (selectedRouteId.value && selectedRouteId.value !== appliedRouteId.value)
    await applyRoute()
})

watch(routeKey, async () => {
  if (!mapLatLngs.value.length) {
    routeLatLngs.value = []
    return
  }

  await fetchOsrmRoute(mapLatLngs.value)
}, { immediate: true })

watch([mapLatLngs, routeLatLngs], ([rawLatlngs, routeLatlngs]) => {
  const latlngs = routeLatlngs.length ? routeLatlngs : rawLatlngs
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
  await applySelectionsFromQuery()
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
            v-model="selectedReaderModel"
            :items="readerOptions"
            item-title="title"
            item-value="value"
            label="Lecturista"
            density="compact"
            variant="outlined"
            hide-details
            :return-object="false"
            :disabled="!appliedPeriodId"
            class="map-toolbar__select"
          />
          <VSelect
            v-model="selectedRouteModel"
            :items="routeOptions"
            item-title="title"
            item-value="value"
            label="Ruta"
            density="compact"
            variant="outlined"
            hide-details
            :return-object="false"
            :disabled="!appliedReaderId"
            class="map-toolbar__select"
          />
        </div>
      </VCardText>
    </VCard>

    <VCard class="map-content">
      <VCardText>
        <div class="map-summary">
          <div class="map-summary__item">
            <span class="map-summary__label">Lecturista:</span>
            <span class="map-summary__value">{{ selectedReaderLabel }}</span>
          </div>
          <div class="map-summary__item">
            <span class="map-summary__label">Ruta:</span>
            <span class="map-summary__value">{{ selectedRouteLabel }}</span>
          </div>
        </div>
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
                v-if="routeLatLngs.length"
                :lat-lngs="routeLatLngs"
                color="#60a5fa"
                :weight="4"
              />
              <LMarker
                v-for="(arrow, index) in arrowMarkers"
                :key="`arrow-${index}`"
                :lat-lng="arrow.latlng"
                :icon="arrowIcon(arrow.angle)"
                :interactive="false"
              />
              <LMarker
                v-if="startPoint"
                :lat-lng="[startPoint.lat, startPoint.lng]"
                :icon="startIcon"
                :z-index-offset="1000"
              />
              <LMarker
                v-if="endPoint && endPoint.id !== startPoint?.id"
                :lat-lng="[endPoint.lat, endPoint.lng]"
                :icon="endIcon"
                :z-index-offset="1000"
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
            <div v-if="routeLoading && mapPoints.length" class="map-empty">
              Trazando ruta por calles...
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
              role="button"
              tabindex="0"
              @click="focusOnPoint(point)"
              @keydown.enter="focusOnPoint(point)"
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

.map-summary {
  display: flex;
  gap: 16px;
  margin-block-end: 16px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.map-summary__item {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 13px;
  color: #334155;
}

.map-summary__label {
  font-weight: 600;
  color: #1f2937;
}

.map-summary__value {
  font-weight: 600;
  color: #2563eb;
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
  max-block-size: 520px;
  overflow-y: auto;
  padding-inline-end: 4px;
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
  cursor: pointer;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.map-list__item:hover {
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.12);
  transform: translateY(-1px);
}

.map-list__item:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
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

:global(.route-pin) {
  inline-size: 18px;
  block-size: 18px;
}

:global(.route-pin span) {
  display: block;
  inline-size: 18px;
  block-size: 18px;
  border-radius: 50%;
  border: 2px solid #ffffff;
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.25);
}

:global(.route-pin--start span) {
  background: #16a34a;
}

:global(.route-pin--end span) {
  background: #dc2626;
}

:global(.route-arrow) {
  inline-size: 16px;
  block-size: 16px;
}

:global(.route-arrow span) {
  display: block;
  inline-size: 0;
  block-size: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 10px solid #2563eb;
  transform-origin: 50% 65%;
  opacity: 0.9;
  filter: drop-shadow(0 2px 4px rgba(15, 23, 42, 0.25));
}
</style>
