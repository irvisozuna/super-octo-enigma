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
          <VBtn variant="tonal" color="secondary" prepend-icon="tabler-arrow-left" @click="goBack">
            Regresar
          </VBtn>
        </div>

        <VDivider class="my-4" />

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
      </VCardText>
    </VCard>
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

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
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
</style>
