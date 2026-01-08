<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import BaseDataTable from '@/components/BaseDataTable.vue'
import { ReadingApiService } from '../../infrastructure/api/services/ReadingApiService'

const apiService = new ReadingApiService()

const search = ref('')
const itemsPerPage = ref(10)
const perPageOptions = [10, 25, 50, 100]
const currentPage = ref(1)

const periods = ref<any[]>([])
const selectedPeriodId = ref<string | null>(null)
const downloadedRoutes = ref<any[]>([])
const loading = ref(false)

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

const statCards = [
  {
    title: 'Anomalias',
    subtitle: 'Cuentas',
    value: '22,874',
    delta: '-12.2%',
    color: 'error',
    icon: 'tabler-file-alert',
  },
  {
    title: 'Avisos',
    subtitle: 'Cuentas',
    value: '91',
    delta: '-12.2%',
    color: 'warning',
    icon: 'tabler-bell',
  },
  {
    title: 'Estimacion',
    subtitle: 'Porcentaje',
    value: '17%',
    delta: '-12.2%',
    color: 'info',
    icon: 'tabler-percentage',
  },
  {
    title: 'Consumo Real',
    subtitle: 'Porcentaje',
    value: '83%',
    delta: '+24.5%',
    color: 'success',
    icon: 'tabler-droplet',
  },
]

const globalProgress = computed(() => {
  const period = periods.value.find(item => item.id === selectedPeriodId.value)

  return {
    period: period?.name || period?.code || '2025 NOV',
    completed: 72486,
    total: 124878,
    volume: '3,121,950 m3',
    delta: '+24.5%',
  }
})

const progressPercent = computed(() => {
  if (!globalProgress.value.total)
    return 0

  return Math.round((globalProgress.value.completed / globalProgress.value.total) * 100)
})

const headers = [
  { title: 'Sector', key: 'sector', sortable: true },
  { title: 'Ruta', key: 'ruta', sortable: true },
  { title: 'Lecturista', key: 'lecturista', sortable: true },
  { title: 'Avance', key: 'avance', sortable: true },
  { title: 'Cuentas', key: 'cuentas', sortable: true },
  { title: 'Descarga', key: 'descarga', sortable: true },
  { title: 'TPL / TTR', key: 'tpl', sortable: true },
  { title: 'Cierre', key: 'cierre', sortable: true },
  { title: 'Estatus', key: 'estatus', sortable: true },
  { title: 'Acciones', key: 'actions', sortable: false, align: 'end' },
]

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

const mappedItems = computed(() => downloadedRoutes.value.map(item => ({
  sector: item.downloaded_route?.route?.sector?.name ?? '-',
  ruta: item.downloaded_route?.route?.name ?? item.downloaded_route?.route?.code ?? item.downloaded_route?.external_route_id ?? '-',
  lecturista: item.downloaded_route?.reader?.name ?? item.downloaded_route?.reader_id ?? '-',
  avance: item.downloaded_route?.contracts_downloaded
    ? Math.round((Number(item.downloaded_route?.readings_count || item.readings_count || 0) / Number(item.downloaded_route?.contracts_downloaded || 0)) * 100)
    : 0,
  cuentas: item.downloaded_route?.contracts_downloaded
    ? `${item.downloaded_route?.readings_count || item.readings_count || 0}/${item.downloaded_route?.contracts_downloaded || 0}`
    : (item.readings_count?.toString() ?? '0'),
  descarga: formatDate(item.downloaded_route?.download_date ?? item.downloaded_route?.created_at),
  tpl: '2min / 4hr',
  cierre: '-',
  estatus: item.downloaded_route?.status ?? (item.downloaded_route?.contracts_downloaded ? 'EN CURSO' : '-'),
  avatar: 'tabler-user',
})))

const filteredItems = computed(() => {
  if (!search.value)
    return mappedItems.value

  const query = search.value.toLowerCase()

  return mappedItems.value.filter(item =>
    `${item.sector} ${item.ruta} ${item.lecturista}`.toLowerCase().includes(query),
  )
})

const pagedItems = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value

  return filteredItems.value.slice(start, end)
})

const pagination = computed(() => ({
  current_page: currentPage.value,
  last_page: Math.max(1, Math.ceil(filteredItems.value.length / itemsPerPage.value)),
  per_page: itemsPerPage.value,
  total: filteredItems.value.length,
}))

const handleOptionsUpdate = (params: Record<string, any>) => {
  if (params.page)
    currentPage.value = params.page
  if (params.per_page)
    itemsPerPage.value = params.per_page
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

watch(periodOptions, options => {
  if (!options.length)
    return

  const active = options.find(option => option.is_active)
  selectedPeriodId.value = active?.value || options[0].value
}, { immediate: true })

watch(selectedPeriodId, async () => {
  await loadDownloadedRoutes()
  currentPage.value = 1
})

watch(search, () => {
  currentPage.value = 1
})

const handlePerPageChange = (value: number) => {
  itemsPerPage.value = value
  currentPage.value = 1
}

onMounted(async () => {
  await loadPeriods()
  await loadDownloadedRoutes()
})
</script>

<template>
  <div class="advance-page">
    <div class="advance-stats">
      <VCard
        v-for="card in statCards"
        :key="card.title"
        class="advance-stats__card"
      >
        <VCardText>
          <div class="stat-card">
            <div
              class="stat-card__icon"
              :class="`stat-card__icon--${card.color}`"
            >
              <VIcon :icon="card.icon" size="20" />
            </div>
            <div>
              <div class="stat-card__title">{{ card.title }}</div>
              <div class="stat-card__subtitle">{{ card.subtitle }}</div>
              <div class="stat-card__value">{{ card.value }}</div>
              <div
                v-if="card.delta"
                class="stat-card__delta"
                :class="`stat-card__delta--${card.color}`"
              >
                {{ card.delta }}
              </div>
            </div>
          </div>
        </VCardText>
      </VCard>

      <VCard class="advance-global">
        <VCardText>
          <div class="global-card">
            <div class="global-card__info">
              <div class="global-card__title">Avance global</div>
              <div class="global-card__period">{{ globalProgress.period }}</div>
              <div class="global-card__value">
                {{ globalProgress.completed.toLocaleString('es-MX') }} /
                {{ globalProgress.total.toLocaleString('es-MX') }}
              </div>
              <div class="global-card__volume">{{ globalProgress.volume }}</div>
              <div class="global-card__delta">{{ globalProgress.delta }}</div>
            </div>
            <div class="global-card__chart">
              <VProgressCircular
                :model-value="progressPercent"
                :size="120"
                :width="12"
                color="success"
              >
                <span class="global-card__percent">{{ progressPercent }}%</span>
              </VProgressCircular>
            </div>
          </div>
        </VCardText>
      </VCard>
    </div>

    <VCard class="advance-table">
      <VCardText>
        <div class="advance-toolbar">
          <VTextField
            v-model="search"
            variant="outlined"
            density="compact"
            placeholder="Buscar"
            prepend-inner-icon="tabler-search"
            hide-details
            class="advance-toolbar__search"
          />
          <div class="advance-toolbar__actions">
            <VSelect
              v-model="selectedPeriodId"
              :items="periodOptions"
              item-title="title"
              item-value="value"
              density="compact"
              variant="outlined"
              hide-details
              class="advance-toolbar__period"
            />
            <VBtn variant="tonal" color="secondary" prepend-icon="tabler-adjustments">
              Filtros
            </VBtn>
            <VBtn variant="tonal" color="secondary" prepend-icon="tabler-upload">
              Exportar
            </VBtn>
          </div>
        </div>

        <BaseDataTable
          :headers="headers"
          :items="pagedItems"
          :meta="pagination"
          :loading="loading"
          :items-per-page-options="perPageOptions"
          @update:options="handleOptionsUpdate"
        >
          <template #item.lecturista="{ item }">
            <div class="lecturista-cell">
              <VAvatar size="26" color="primary" variant="tonal">
                <VIcon :icon="item.avatar" size="16" />
              </VAvatar>
              <span class="lecturista-cell__name">{{ item.lecturista }}</span>
            </div>
          </template>
          <template #item.avance="{ item }">
            <div class="avance-cell">
              <span class="avance-cell__value">{{ item.avance }}%</span>
              <VProgressLinear
                :model-value="item.avance"
                height="6"
                rounded
                color="primary"
                class="avance-cell__bar"
              />
            </div>
          </template>
          <template #item.estatus="{ item }">
            <VChip size="small" variant="tonal" color="info">
              {{ item.estatus }}
            </VChip>
          </template>
          <template #actions>
            <VBtn icon="tabler-dots-vertical" variant="text" size="small" color="secondary" />
          </template>
        </BaseDataTable>
      </VCardText>
    </VCard>
  </div>
</template>

<style scoped lang="scss">
.advance-page {
  inline-size: 100%;
  padding-block: 12px 32px;
}

.advance-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(180px, 1fr)) minmax(320px, 2.2fr);
  gap: 16px;
  margin-block-end: 20px;
}

.advance-stats__card {
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(34, 41, 47, 0.08);
}

.stat-card {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.stat-card__icon {
  inline-size: 36px;
  block-size: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  color: #475569;
}

.stat-card__icon--info {
  background: #dbeafe;
  color: #2563eb;
}

.stat-card__icon--warning {
  background: #ffedd5;
  color: #f97316;
}

.stat-card__icon--error {
  background: #fee2e2;
  color: #ef4444;
}

.stat-card__icon--success {
  background: #dcfce7;
  color: #16a34a;
}

.stat-card__title {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
}

.stat-card__subtitle {
  font-size: 12px;
  color: #64748b;
}

.stat-card__value {
  margin-block-start: 6px;
  font-size: 18px;
  font-weight: 700;
}

.stat-card__delta {
  margin-block-start: 6px;
  display: inline-flex;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
}

.stat-card__delta--error {
  background: #fee2e2;
  color: #ef4444;
}

.stat-card__delta--warning {
  background: #ffedd5;
  color: #f97316;
}

.stat-card__delta--info {
  background: #dbeafe;
  color: #2563eb;
}

.stat-card__delta--success {
  background: #dcfce7;
  color: #16a34a;
}

.advance-global {
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(34, 41, 47, 0.08);
}

.global-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.global-card__title {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
}

.global-card__period {
  font-size: 12px;
  color: #94a3b8;
  margin-block: 4px 12px;
}

.global-card__value {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

.global-card__volume {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-block-start: 8px;
}

.global-card__delta {
  margin-block-start: 8px;
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #16a34a;
  background: #dcfce7;
}

.global-card__percent {
  font-weight: 700;
  color: #1f2937;
}

.advance-table {
  border-radius: 12px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
}

.advance-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-block-end: 12px;
}

.advance-toolbar__search {
  max-inline-size: 280px;
}

.advance-toolbar__actions {
  display: flex;
  gap: 12px;
}

.advance-toolbar__period {
  min-inline-size: 140px;
}

.lecturista-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #2563eb;
}

.avance-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avance-cell__value {
  min-inline-size: 36px;
  font-weight: 600;
}

.avance-cell__bar {
  inline-size: 110px;
}

@media (max-width: 1200px) {
  .advance-stats {
    grid-template-columns: repeat(2, minmax(180px, 1fr));
  }
}

@media (max-width: 900px) {
  .advance-stats {
    grid-template-columns: 1fr;
  }

  .global-card {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
