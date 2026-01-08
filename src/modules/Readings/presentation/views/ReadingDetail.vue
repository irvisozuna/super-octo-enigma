<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseDataTable from '@/components/BaseDataTable.vue'
import { ReadingApiService } from '../../infrastructure/api/services/ReadingApiService'
import { useReadingsStore } from '../stores/readingsStore'

const route = useRoute()
const router = useRouter()
const readingsStore = useReadingsStore()
const apiService = new ReadingApiService()

const details = ref<any[]>([])
const detailsLoading = ref(false)
const photos = ref<any[]>([])
const photosLoading = ref(false)
const photosDialog = ref(false)
const detailsPagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 0,
})

const detailsHeaders = [
  { title: 'Codigo', key: 'concept_code', sortable: true },
  { title: 'Concepto', key: 'concept_name', sortable: true },
  { title: 'Cantidad', key: 'quantity', sortable: true },
  { title: 'Precio unitario', key: 'unit_price', sortable: true },
  { title: 'Subtotal', key: 'subtotal', sortable: true },
  { title: 'IVA', key: 'iva_amount', sortable: true },
  { title: 'Total', key: 'total', sortable: true },
]

const totalCost = computed(() => {
  return details.value.reduce((acc, item) => acc + Number(item.total || 0), 0)
})

const readingId = computed(() => route.params.id as string)
const reading = computed(() =>
  readingsStore.items.find(item => String(item.id) === String(readingId.value)),
)

const normalizeArray = (response: any) => {
  if (Array.isArray(response))
    return response
  if (Array.isArray(response?.data))
    return response.data
  if (Array.isArray(response?.data?.data))
    return response.data.data

  return []
}

const resolvePhotoUrl = (value?: string) => {
  if (!value)
    return ''

  if (value.startsWith('http') || value.startsWith('data:'))
    return value

  const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL
  const prefix = baseUrl ? baseUrl.replace(/\/$/, '') : ''

  if (value.startsWith('/'))
    return `${prefix}${value}`

  return `${prefix}/${value}`
}

const photoItems = computed(() => {
  return photos.value
    .map(item => ({
      id: item.id ?? item.uuid ?? item.path ?? item.url,
      src: resolvePhotoUrl(
        item.url
        ?? item.photo_url
        ?? item.path
        ?? item.photo_path
        ?? item.file_path,
      ),
      title: item.title ?? item.name ?? 'Foto de lectura',
    }))
    .filter(item => item.src)
})

const formatDate = (value?: string) => {
  if (!value)
    return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime()))
    return value

  return date.toLocaleString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const goBack = () => {
  router.back()
}

const loadDetails = async (params: Record<string, any> = {}) => {
  if (!readingId.value)
    return

  detailsLoading.value = true
  try {
    const requestParams = { ...params }

    if (requestParams.page && requestParams.per_page && !requestParams.limit) {
      requestParams.limit = requestParams.per_page
      requestParams.offset = (Number(requestParams.page) - 1) * Number(requestParams.per_page)
    }

    const response = await apiService.getDetails(readingId.value, requestParams)
    const pagination = response?.pagination || response?.data?.pagination

    details.value = response?.data?.data || response?.data || response || []

    if (pagination) {
      const limit = Number(pagination.limit || pagination.per_page || 15)
      const offset = Number(pagination.offset || 0)
      const total = Number(pagination.total || 0)
      const currentPage = Math.floor(offset / Math.max(limit, 1)) + 1
      const lastPage = Math.max(1, Math.ceil(total / Math.max(limit, 1)))

      detailsPagination.value = {
        current_page: currentPage,
        last_page: lastPage,
        per_page: limit,
        total,
      }
    }
  }
  finally {
    detailsLoading.value = false
  }
}

const handleDetailsOptions = (params: Record<string, any>) => {
  loadDetails(params)
}

const openPhotos = async () => {
  if (!readingId.value)
    return

  photosDialog.value = true
  if (photos.value.length)
    return

  photosLoading.value = true
  try {
    const response = await apiService.getPhotos(readingId.value)
    photos.value = normalizeArray(response)
  }
  finally {
    photosLoading.value = false
  }
}

onMounted(() => {
  loadDetails({
    page: detailsPagination.value.current_page,
    per_page: detailsPagination.value.per_page,
  })
})
</script>

<template>
  <div class="reading-detail">
    <VCard class="detail-card">
      <VCardText>
        <div class="detail-header">
          <div>
            <div class="detail-title">Detalle de lectura</div>
            <div class="detail-subtitle">ID: {{ readingId }}</div>
          </div>
          <div class="detail-actions">
            <VBtn variant="tonal" color="primary" prepend-icon="tabler-camera" @click="openPhotos">
              Ver fotos
            </VBtn>
            <VBtn variant="tonal" color="secondary" prepend-icon="tabler-arrow-left" @click="goBack">
              Regresar
            </VBtn>
          </div>
        </div>

        <VDivider class="my-4" />

        <div class="detail-layout">
          <div class="detail-main">
            <div v-if="reading" class="detail-summary">
              <div class="summary-card">
                <div class="summary-label">Lectura anterior</div>
                <div class="summary-value">{{ reading.previous_reading ?? '-' }}</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">Lectura actual</div>
                <div class="summary-value">{{ reading.current_reading ?? '-' }}</div>
              </div>
              <div class="summary-card">
                <div class="summary-label">Consumo</div>
                <div class="summary-value">{{ reading.consumption ?? '-' }}</div>
              </div>
              <div class="summary-card summary-card--highlight">
                <div class="summary-label">Total lectura</div>
                <div class="summary-value">$ {{ totalCost.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</div>
              </div>
            </div>

            <div v-if="reading" class="detail-grid detail-grid--spaced">
              <div class="detail-item">
                <span class="detail-label">Contrato</span>
                <span class="detail-value">
                  {{ reading.external_contract_id || reading.contract?.external_contract_id || reading.contract_id || '-' }}
                </span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Usuario</span>
                <span class="detail-value">
                  {{ reading.contract?.user_name || '-' }}
                </span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Lecturista</span>
                <span class="detail-value">
                  {{ reading.reader?.name || reading.reader_name || reading.reader_id || '-' }}
                </span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Sector</span>
                <span class="detail-value">
                  {{ reading.contract?.sector?.name || reading.contract?.sector_id || '-' }}
                </span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Ruta</span>
                <span class="detail-value">
                  {{ reading.contract?.route?.name || reading.contract?.route?.code || reading.contract?.external_route_id || '-' }}
                </span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Anomalia</span>
                <span class="detail-value">
                  {{ reading.anomaly?.name || '-' }}
                </span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Fecha lectura</span>
                <span class="detail-value">{{ formatDate(reading.reading_date) }}</span>
              </div>
            </div>

            <div v-else class="detail-empty">
              No se encontro la lectura en memoria. Regresa y vuelve a cargar la lista.
            </div>

            <div class="detail-section">
              <div class="detail-section__title">Conceptos de la lectura</div>
              <BaseDataTable
                :headers="detailsHeaders"
                :items="details"
                :meta="detailsPagination"
                :loading="detailsLoading"
                :items-per-page-options="[10, 15, 25, 50]"
                empty-state-title="Sin conceptos"
                empty-state-description="No hay conceptos para esta lectura."
                empty-state-icon="tabler-list-details"
                @update:options="handleDetailsOptions"
              />
            </div>
          </div>

          <aside class="detail-ticket">
            <div class="ticket">
              <div class="ticket__brand">acs Metrics</div>
              <div class="ticket__subtitle">Recibo de lectura</div>

              <div class="ticket__block">
                <div class="ticket__row">
                  <span class="ticket__label">Cuenta</span>
                  <span class="ticket__value">
                    {{ reading?.contract?.contract_number || reading?.contract_id || '-' }}
                  </span>
                </div>
                <div class="ticket__row">
                  <span class="ticket__label">Usuario</span>
                  <span class="ticket__value">
                    {{ reading?.contract?.user_name || '-' }}
                  </span>
                </div>
                <div class="ticket__row">
                  <span class="ticket__label">Contrato</span>
                  <span class="ticket__value">
                    {{ reading?.external_contract_id || reading?.contract?.external_contract_id || '-' }}
                  </span>
                </div>
              </div>

              <div class="ticket__block">
                <div class="ticket__row">
                  <span class="ticket__label">Periodo</span>
                  <span class="ticket__value">
                    {{ reading?.period?.name || '-' }}
                  </span>
                </div>
                <div class="ticket__row">
                  <span class="ticket__label">Fecha lectura</span>
                  <span class="ticket__value">
                    {{ formatDate(reading?.reading_date) }}
                  </span>
                </div>
                <div class="ticket__row">
                  <span class="ticket__label">Ruta</span>
                  <span class="ticket__value">
                    {{ reading?.contract?.route?.name || reading?.contract?.route?.code || reading?.contract?.external_route_id || '-' }}
                  </span>
                </div>
                <div class="ticket__row">
                  <span class="ticket__label">Sector</span>
                  <span class="ticket__value">
                    {{ reading?.contract?.sector?.name || reading?.contract?.sector_id || '-' }}
                  </span>
                </div>
                <div class="ticket__row">
                  <span class="ticket__label">Anomalia</span>
                  <span class="ticket__value">
                    {{ reading?.anomaly?.name || 'Lectura real' }}
                  </span>
                </div>
              </div>

              <div class="ticket__block">
                <div class="ticket__section-title">Lecturas</div>
                <div class="ticket__row">
                  <span class="ticket__label">Anterior</span>
                  <span class="ticket__value">{{ reading?.previous_reading ?? '-' }}</span>
                </div>
                <div class="ticket__row">
                  <span class="ticket__label">Actual</span>
                  <span class="ticket__value">{{ reading?.current_reading ?? '-' }}</span>
                </div>
                <div class="ticket__row">
                  <span class="ticket__label">Consumo</span>
                  <span class="ticket__value">{{ reading?.consumption ?? '-' }}</span>
                </div>
              </div>

              <div class="ticket__block">
                <div class="ticket__section-title">Conceptos</div>
                <div v-if="details.length" class="ticket__concepts">
                  <div v-for="item in details" :key="item.id" class="ticket__concept">
                    <span class="ticket__concept-name">{{ item.concept_name || item.concept_code }}</span>
                    <span class="ticket__concept-value">
                      $ {{ Number(item.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                    </span>
                  </div>
                </div>
                <div v-else class="ticket__empty">Sin conceptos</div>
              </div>

              <div class="ticket__total">
                <span>Total a pagar</span>
                <span>$ {{ totalCost.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
              </div>
            </div>
          </aside>
        </div>
      </VCardText>
    </VCard>

    <VDialog v-model="photosDialog" max-width="720">
      <VCard>
        <VCardTitle class="photo-modal__title">
          Fotos de la lectura
          <VSpacer />
          <VBtn icon="tabler-x" variant="text" @click="photosDialog = false" />
        </VCardTitle>
        <VCardText>
          <div v-if="photosLoading" class="photo-modal__empty">Cargando fotos...</div>
          <div v-else-if="!photoItems.length" class="photo-modal__empty">Sin fotos disponibles.</div>
          <VCarousel
            v-else
            hide-delimiter-background
            show-arrows="hover"
            height="420"
          >
            <VCarouselItem
              v-for="item in photoItems"
              :key="item.id"
            >
              <div class="photo-slide">
                <VImg :src="item.src" :alt="item.title" cover />
              </div>
            </VCarouselItem>
          </VCarousel>
        </VCardText>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped lang="scss">
.reading-detail {
  inline-size: 100%;
  padding-block: 12px 32px;
}

.detail-card {
  border-radius: 16px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.12);
}

.detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 24px;
  align-items: start;
}

.detail-main {
  min-width: 0;
}

.detail-ticket {
  position: sticky;
  top: 20px;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.detail-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.detail-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

.detail-subtitle {
  font-size: 13px;
  color: #94a3b8;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.detail-grid--spaced {
  margin-block-start: 16px;
}

.detail-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-block-end: 8px;
}

.summary-card {
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #ffffff;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08);
  text-align: center;
}

.summary-card--highlight {
  background: linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%);
  border-color: #93c5fd;
  box-shadow: 0 10px 22px rgba(59, 130, 246, 0.18);
}

.summary-label {
  font-size: 12px;
  color: #64748b;
}

.summary-value {
  margin-block-start: 6px;
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #ffffff;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.08);
}

.detail-label {
  font-size: 12px;
  color: #64748b;
}

.detail-value {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.detail-empty {
  font-size: 14px;
  color: #94a3b8;
}

.detail-section {
  margin-block-start: 20px;
}

.detail-section__title {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  margin-block-end: 12px;
}

.ticket {
  background: #fdfcf9;
  border: 1px dashed rgba(15, 23, 42, 0.2);
  border-radius: 18px;
  padding: 18px 16px;
  font-family: "Courier New", Courier, monospace;
  color: #1f2937;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
}

.ticket__brand {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.ticket__subtitle {
  font-size: 12px;
  color: #64748b;
  margin-block: 4px 12px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.ticket__block {
  border-top: 1px dashed rgba(15, 23, 42, 0.2);
  padding-block: 12px;
}

.ticket__row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
  padding-block: 3px;
}

.ticket__label {
  color: #475569;
  text-transform: uppercase;
}

.ticket__value {
  font-weight: 700;
  text-align: right;
}

.ticket__section-title {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-block-end: 6px;
  color: #334155;
}

.ticket__concepts {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ticket__concept {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
}

.ticket__concept-name {
  max-width: 160px;
}

.ticket__concept-value {
  font-weight: 700;
}

.ticket__empty {
  font-size: 12px;
  color: #94a3b8;
}

.ticket__total {
  margin-block-start: 12px;
  padding-block: 10px;
  border-top: 2px dashed rgba(15, 23, 42, 0.25);
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 700;
}

.photo-modal__title {
  display: flex;
  align-items: center;
  font-weight: 700;
}

.photo-modal__empty {
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
  padding-block: 24px;
}

.photo-slide {
  display: flex;
  align-items: center;
  justify-content: center;
  block-size: 100%;
  border-radius: 12px;
  overflow: hidden;
  background: #f8fafc;
}

@media (max-width: 1100px) {
  .detail-layout {
    grid-template-columns: 1fr;
  }

  .detail-ticket {
    position: static;
  }
}
</style>
