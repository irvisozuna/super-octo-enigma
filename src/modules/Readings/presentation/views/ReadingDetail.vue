<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ReadingApiService } from '../../infrastructure/api/services/ReadingApiService'
import { useReadingsStore } from '../stores/readingsStore'
import BaseDataTable from '@/components/BaseDataTable.vue'

const route = useRoute()
const router = useRouter()
const readingsStore = useReadingsStore()
const apiService = new ReadingApiService()

const details = ref<any[]>([])
const detailsLoading = ref(false)
const readingData = ref<any | null>(null)
const readingLoading = ref(false)
const photos = ref<any[]>([])
const photosLoading = ref(false)
const photosDialog = ref(false)
const pageLoading = computed(() => detailsLoading.value || readingLoading.value)

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

const detailsRows = computed(() => {
  return details.value.map(item => ({
    concept_code: item.external_concept_id ?? item.concept?.code ?? item.concept_code ?? item.concept_id ?? '-',
    concept_name: item.concept?.name ?? item.concept_name ?? item.notes ?? item.description ?? '-',
    quantity: item.quantity ?? 0,
    unit_price: item.unit_price ?? item.unitPrice ?? 0,
    subtotal: item.subtotal ?? 0,
    iva_amount: item.iva_amount ?? item.iva ?? 0,
    total: item.total ?? 0,
  }))
})

const readingId = computed(() => route.params.id as string)

const reading = computed(() => readingData.value)

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
  const idForDetails = readingData.value?.local_id ?? readingId.value
  if (!idForDetails)
    return

  detailsLoading.value = true
  try {
    const requestParams = { ...params }

    if (requestParams.page && requestParams.per_page && !requestParams.limit) {
      requestParams.limit = requestParams.per_page
      requestParams.offset = (Number(requestParams.page) - 1) * Number(requestParams.per_page)
    }

    const response = await apiService.getDetails(String(idForDetails), requestParams)
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

const loadReading = async () => {
  if (!readingId.value)
    return

  readingLoading.value = true
  try {
    const response = await apiService.getReadingView(readingId.value)
    readingData.value = response?.data?.data ?? response?.data ?? response ?? null
  }
  finally {
    readingLoading.value = false
  }
}

const handleDetailsOptions = (params: Record<string, any>) => {
  loadDetails(params)
}

const openPhotos = async () => {
  const idForPhotos = readingData.value?.local_id ?? readingId.value
  if (!idForPhotos)
    return

  photosDialog.value = true
  if (photos.value.length)
    return

  photosLoading.value = true
  try {
    const response = await apiService.getPhotos(String(idForPhotos))
    const apiPhotos = normalizeArray(response)

    if (apiPhotos.length) {
      photos.value = apiPhotos
      return
    }

    const fallbackPhoto = readingData.value?.photo_path || readingData.value?.photo_url
    if (fallbackPhoto)
      photos.value = [{ path: fallbackPhoto, name: 'Foto de lectura' }]
  }
  finally {
    photosLoading.value = false
  }
}

onMounted(async () => {
  await loadReading()
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
        <div v-if="pageLoading" class="detail-header">
          <VSkeletonLoader type="heading" class="mb-2" />
          <VSkeletonLoader type="text" />
        </div>
        <div v-else class="detail-header">
          <div class="detail-hero">
            <div class="detail-hero__main">
              <div class="detail-hero__eyebrow">Lectura</div>
              <div class="detail-hero__title">
                {{ reading?.external_contract_id || reading?.contract?.external_contract_id || readingId }}
              </div>
              <div class="detail-hero__meta">
                <span>ID: {{ readingId }}</span>
                <span>•</span>
                <span>Fecha: {{ formatDate(reading?.reading_date) }}</span>
              </div>
            </div>
            <div class="detail-hero__actions">
              <VBtn
                variant="flat"
                color="primary"
                prepend-icon="tabler-camera"
                @click="openPhotos"
              >
                Ver fotos
              </VBtn>
              <VBtn
                variant="tonal"
                color="secondary"
                prepend-icon="tabler-arrow-left"
                @click="goBack"
              >
                Regresar
              </VBtn>
            </div>
          </div>
        </div>

        <VDivider class="my-4" />

        <div class="detail-layout">
          <div class="detail-main">
            <div
              v-if="reading"
              class="reading-highlights"
            >
              <div class="reading-highlight">
                <div class="reading-highlight__label">Lectura anterior</div>
                <div class="reading-highlight__value">{{ reading.previous_reading ?? '-' }}</div>
              </div>
              <div class="reading-highlight">
                <div class="reading-highlight__label">Lectura actual</div>
                <div class="reading-highlight__value">{{ reading.current_reading ?? '-' }}</div>
              </div>
              <div class="reading-highlight">
                <div class="reading-highlight__label">Consumo</div>
                <div class="reading-highlight__value">{{ reading.consumption ?? '-' }}</div>
              </div>
              <div class="reading-highlight reading-highlight--total">
                <div class="reading-highlight__label">Total lectura</div>
                <div class="reading-highlight__value">
                  $ {{ totalCost.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                </div>
              </div>
            </div>

            <div
              v-if="reading"
              class="detail-strip detail-strip--single detail-strip--spaced"
            >
              <div class="detail-strip__section">
                <div class="detail-strip__title">Datos del contrato</div>
                <dl class="detail-list">
                  <div class="detail-list__row">
                    <dt>Contrato</dt>
                    <dd>{{ reading.external_contract_id || reading.contract?.external_contract_id || reading.contract_id || '-' }}</dd>
                  </div>
                  <div class="detail-list__row">
                    <dt>Usuario</dt>
                    <dd>{{ reading.contract?.user_name || '-' }}</dd>
                  </div>
                  <div class="detail-list__row">
                    <dt>Lecturista</dt>
                    <dd>{{ reading.worker?.name || reading.reader?.name || reading.reader_name || reading.external_worker_id || '-' }}</dd>
                  </div>
                  <div class="detail-list__row">
                    <dt>Sector</dt>
                    <dd>{{ reading.contract?.route?.sector?.name || reading.contract?.route?.sector_external_id || reading.contract?.sector?.name || reading.contract?.sector_id || '-' }}</dd>
                  </div>
                  <div class="detail-list__row">
                    <dt>Ruta</dt>
                    <dd>{{ reading.contract?.route?.name || reading.contract?.route?.code || reading.contract?.external_route_id || '-' }}</dd>
                  </div>
                  <div class="detail-list__row">
                    <dt>Anomalia</dt>
                    <dd>{{ reading.anomaly?.name || '-' }}</dd>
                  </div>
                  <div class="detail-list__row">
                    <dt>Fecha lectura</dt>
                    <dd>{{ formatDate(reading.reading_date) }}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div
              v-else
              class="detail-empty"
            >
              No se encontro la lectura en memoria. Regresa y vuelve a cargar la lista.
            </div>

            <div class="detail-section">
              <div class="detail-section__title">
                Conceptos de la lectura
              </div>
              <BaseDataTable
                :headers="detailsHeaders"
                :items="detailsRows"
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
              <div class="ticket__brand">
                AQS Metrics
              </div>
              <div class="ticket__subtitle">
                Recibo de lectura
              </div>

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
                  <span class="ticket__label">Lecturista</span>
                  <span class="ticket__value">
                    {{ reading?.worker?.name || reading?.reader?.name || reading?.external_worker_id || '-' }}
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
                    {{ reading?.period?.name || reading?.external_period_id || '-' }}
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
                    {{ reading?.contract?.route?.sector?.name || reading?.contract?.route?.sector_external_id || reading?.contract?.sector?.name || reading?.contract?.sector_id || '-' }}
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
                <div class="ticket__section-title">
                  Lecturas
                </div>
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
                <div class="ticket__section-title">
                  Conceptos
                </div>
                <div
                  v-if="detailsRows.length"
                  class="ticket__concepts"
                >
                  <div
                    v-for="item in detailsRows"
                    :key="item.concept_code"
                    class="ticket__concept"
                  >
                    <span class="ticket__concept-name">{{ item.concept_name || item.concept_code }}</span>
                    <span class="ticket__concept-value">
                      $ {{ Number(item.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                    </span>
                  </div>
                </div>
                <div
                  v-else
                  class="ticket__empty"
                >
                  Sin conceptos
                </div>
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

    <VDialog
      v-model="photosDialog"
      max-width="720"
    >
      <VCard>
        <VCardTitle class="photo-modal__title">
          Fotos de la lectura
          <VSpacer />
          <VBtn
            icon="tabler-x"
            variant="text"
            @click="photosDialog = false"
          />
        </VCardTitle>
        <VCardText>
          <div
            v-if="photosLoading"
            class="photo-modal__empty"
          >
            Cargando fotos...
          </div>
          <div
            v-else-if="!photoItems.length"
            class="photo-modal__empty"
          >
            Sin fotos disponibles.
          </div>
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
                <VImg
                  :src="item.src"
                  :alt="item.title"
                  cover
                />
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
  box-shadow: 0 12px 28px rgba(15, 23, 42, 12%);
}

.detail-layout {
  display: grid;
  align-items: start;
  gap: 24px;
  grid-template-columns: minmax(0, 1fr) 320px;
}

.detail-main {
  min-inline-size: 0;
}

.detail-ticket {
  position: sticky;
  inset-block-start: 20px;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.detail-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  inline-size: 100%;
  padding: 18px 20px;
  border-radius: 16px;
  background: #e8f1ff;
  border: 1px solid rgba(59, 130, 246, 0.25);
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08);
}

.detail-hero__main {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-hero__eyebrow {
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #64748b;
  font-weight: 700;
}

.detail-hero__title {
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
}

.detail-hero__meta {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 12px;
  color: #64748b;
}

.detail-hero__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.detail-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  padding: 16px;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.25);
}

.detail-strip--spaced {
  margin-block-start: 16px;
}

.reading-highlights {
  display: grid;
  grid-template-columns: repeat(4, minmax(180px, 1fr));
  gap: 14px;
  padding: 16px;
  border-radius: 18px;
  background: #eff6ff;
  border: 1px solid rgba(59, 130, 246, 0.25);
  box-shadow: 0 12px 24px rgba(59, 130, 246, 0.12);
}

.reading-highlight {
  border-radius: 14px;
  padding: 14px 16px;
  background: #ffffff;
  border: 1px solid rgba(59, 130, 246, 0.15);
  box-shadow: 0 8px 16px rgba(15, 23, 42, 0.08);
}

.reading-highlight__label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748b;
}

.reading-highlight__value {
  margin-block-start: 6px;
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
}

.reading-highlight--total {
  background: linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%);
  border-color: rgba(37, 99, 235, 0.35);
}

.detail-strip__section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-strip__title {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #64748b;
}

.detail-list {
  display: grid;
  gap: 10px;
  margin: 0;
}

.detail-list__row {
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 12px;
  align-items: baseline;
  padding-block-end: 8px;
  border-bottom: 1px dashed rgba(148, 163, 184, 0.3);
}

.detail-list__row:last-child {
  border-bottom: none;
  padding-block-end: 0;
}

.detail-list__row dt {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
}

.detail-list__row dd {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
}

.detail-empty {
  color: #94a3b8;
  font-size: 14px;
}

.detail-section {
  margin-block-start: 20px;
}

.detail-section__title {
  color: #1f2937;
  font-size: 16px;
  font-weight: 700;
  margin-block-end: 12px;
}

.ticket {
  border: 1px dashed rgba(15, 23, 42, 20%);
  border-radius: 18px;
  background: #fdfcf9;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 8%);
  color: #1f2937;
  font-family: "Courier New", Courier, monospace;
  padding-block: 18px;
  padding-inline: 16px;
}

.ticket__brand {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.ticket__subtitle {
  color: #64748b;
  font-size: 12px;
  letter-spacing: 0.8px;
  margin-block: 4px 12px;
  text-transform: uppercase;
}

.ticket__block {
  border-block-start: 1px dashed rgba(15, 23, 42, 20%);
  padding-block: 12px;
}

.ticket__row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  gap: 8px;
  padding-block: 3px;
}

.ticket__label {
  color: #475569;
  text-transform: uppercase;
}

.ticket__value {
  font-weight: 700;
  text-align: end;
}

.ticket__section-title {
  color: #334155;
  font-size: 11px;
  letter-spacing: 0.6px;
  margin-block-end: 6px;
  text-transform: uppercase;
}

.ticket__concepts {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ticket__concept {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  gap: 8px;
}

.ticket__concept-name {
  max-inline-size: 160px;
}

.ticket__concept-value {
  font-weight: 700;
}

.ticket__empty {
  color: #94a3b8;
  font-size: 12px;
}

.ticket__total {
  display: flex;
  justify-content: space-between;
  border-block-start: 2px dashed rgba(15, 23, 42, 25%);
  font-size: 14px;
  font-weight: 700;
  margin-block-start: 12px;
  padding-block: 10px;
}

.photo-modal__title {
  display: flex;
  align-items: center;
  font-weight: 700;
}

.photo-modal__empty {
  color: #94a3b8;
  font-size: 14px;
  padding-block: 24px;
  text-align: center;
}

.photo-slide {
  display: flex;
  overflow: hidden;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: #f8fafc;
  block-size: 100%;
}

@media (max-width: 1100px) {
  .detail-layout {
    grid-template-columns: 1fr;
  }

  .detail-ticket {
    position: static;
  }

  .detail-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .detail-hero__actions {
    inline-size: 100%;
    justify-content: flex-start;
  }

  .detail-list__row {
    grid-template-columns: 1fr;
    gap: 4px;
  }

  .reading-highlights {
    grid-template-columns: repeat(2, minmax(180px, 1fr));
  }
}
</style>
