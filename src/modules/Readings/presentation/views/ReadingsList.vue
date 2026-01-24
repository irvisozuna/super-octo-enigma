<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useReadingsStore } from '../stores/readingsStore'
import BaseDataTable from '@/components/BaseDataTable.vue'
import BaseListHeader from '@/components/layout/BaseListHeader.vue'
import ReadingsFilterDrawer from '../../share/ReadingsFilterDrawer.vue'
import { ReadingApiService } from '../../infrastructure/api/services/ReadingApiService'

const { t } = useI18n()
const router = useRouter()
const readingsStore = useReadingsStore()
const apiService = new ReadingApiService()

const search = ref('')
const itemsPerPage = ref(readingsStore.pagination.per_page)
const perPageOptions = [10, 25, 50, 100]
const filterOpen = ref(false)
const periods = ref<any[]>([])
const periodsLoading = ref(false)
const metrics = ref<any | null>(null)
const filters = ref({
  status: '',
  anomaly: '',
  type: '',
  sector: '',
  route: '',
})

const headers = [
  { title: 'Folio', key: 'folio', sortable: true },
  { title: 'Contrato', key: 'contrato', sortable: true },
  { title: 'Usuario', key: 'usuario', sortable: true },
  { title: 'Tipo contrato', key: 'tipo_contrato', sortable: true },
  { title: 'Sector', key: 'sector', sortable: true },
  { title: 'Ruta', key: 'ruta', sortable: true },
  { title: 'Anterior', key: 'anterior', sortable: true },
  { title: 'Actual', key: 'actual', sortable: true },
  { title: 'Consumo', key: 'consumo', sortable: true },
  { title: 'Anomalia', key: 'anomalia', sortable: true },
  { title: 'Estatus', key: 'estatus', sortable: true },
  { title: 'Acciones', key: 'actions', sortable: false, align: 'end' },
]

const normalizeValue = (value: any) => {
  if (value === null || value === undefined)
    return ''

  if (typeof value === 'object')
    return JSON.stringify(value)

  return value
}

const getPeriodKey = (value?: string) => {
  if (!value)
    return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime()))
    return null

  const month = String(date.getMonth() + 1).padStart(2, '0')

  return `${date.getFullYear()}-${month}`
}

const getPeriodLabel = (periodKey: string) => {
  const [year, month] = periodKey.split('-').map(Number)
  const date = new Date(year, month - 1, 1)
  const monthLabel = date.toLocaleString('es-MX', { month: 'short' }).toUpperCase()

  return `${monthLabel} ${String(year).slice(-2)}`
}

const periodOptions = computed(() => {
  return periods.value.map(period => ({
    title: period.name || period.code || period.external_id || period.externalId || period.id,
    value: period.id || period.period_id || period.uuid,
    is_active: period.is_active ?? period.isActive ?? false,
  }))
})

const selectedPeriodId = ref<string | null>(null)

watch(periodOptions, options => {
  if (!options.length) {
    selectedPeriodId.value = null

    return
  }

  const active = options.find(option => option.is_active)
  const candidate = active?.value || options[0].value
  const exists = options.some(option => option.value === selectedPeriodId.value)
  if (!exists)
    selectedPeriodId.value = candidate
}, { immediate: true })

const filteredItems = computed(() => {
  if (!selectedPeriodId.value)
    return readingsStore.items

  const selectedPeriod = periods.value.find(period => String(period.id) === String(selectedPeriodId.value))
  const selectedPeriodKey = getPeriodKey(selectedPeriod?.start_date)

  return readingsStore.items.filter(item => {
    if (item.period_id || item.period?.id)
      return String(item.period_id ?? item.period?.id) === String(selectedPeriodId.value)

    if (selectedPeriodKey)
      return getPeriodKey(item.reading_date) === selectedPeriodKey

    return true
  })
})

const normalizedFilters = computed(() => ({
  status: filters.value.status ? String(filters.value.status).toLowerCase() : '',
  anomaly: filters.value.anomaly ? String(filters.value.anomaly).toLowerCase() : '',
  type: filters.value.type ? String(filters.value.type).toLowerCase() : '',
  sector: filters.value.sector ? String(filters.value.sector).toLowerCase() : '',
  route: filters.value.route ? String(filters.value.route).toLowerCase() : '',
}))

const applyLocalFilters = (items: any[]) => {
  const filterValues = normalizedFilters.value

  return items.filter(item => {
    const status = String(item.status ?? item.estatus ?? '').toLowerCase()
    const anomaly = String(item.anomaly?.name ?? item.anomalia ?? '').toLowerCase()
    const type = String(item.contract?.type?.name ?? item.tipo_contrato ?? '').toLowerCase()
    const sector = String(item.contract?.sector?.name ?? item.sector ?? '').toLowerCase()
    const route = String(item.contract?.route?.name ?? item.contract?.route?.code ?? item.ruta ?? '').toLowerCase()

    if (filterValues.status && !status.includes(filterValues.status))
      return false
    if (filterValues.anomaly && !anomaly.includes(filterValues.anomaly))
      return false
    if (filterValues.type && !type.includes(filterValues.type))
      return false
    if (filterValues.sector && !sector.includes(filterValues.sector))
      return false
    if (filterValues.route && !route.includes(filterValues.route))
      return false

    return true
  })
}

const filteredTableItems = computed(() => applyLocalFilters(filteredItems.value))

const tableItems = computed(() => filteredTableItems.value.map(item => ({
  folio: normalizeValue(item.local_id ?? item.external_contract_id ?? item.folio ?? item.FOLIO ?? item.id),
  contrato: normalizeValue(item.contract?.contract_number ?? item.contract_number ?? item.contract_id ?? item.contrato ?? item.CONTRATO ?? item.account_id),
  usuario: normalizeValue(item.contract?.user_name ?? item.user_name ?? item.usuario ?? item.USUARIO ?? item.user ?? item.name),
  tipo_contrato: normalizeValue(
    item.contract?.type?.name
    ?? item.contract?.contract_type_name
    ?? item.contract?.external_contract_type_id
    ?? item.contract?.contract_type_id
    ?? item.tipo_contrato
    ?? item.TIPO_CONTRATO
    ?? item.contract_type
    ?? item.type,
  ),
  sector: normalizeValue(
    item.contract?.sector?.name
    ?? item.contract?.sector_id
    ?? item.sector
    ?? item.SECTOR
    ?? item.zone
    ?? item.sector_id,
  ),
  ruta: normalizeValue(
    item.contract?.route?.name
    ?? item.contract?.route?.code
    ?? item.contract?.external_route_id
    ?? item.ruta
    ?? item.RUTA
    ?? item.route
    ?? item.route_id,
  ),
  anterior: normalizeValue(item.previous_reading ?? item.anterior ?? item.ANTERIOR ?? item.previous),
  actual: normalizeValue(item.current_reading ?? item.actual ?? item.ACTUAL ?? item.reading),
  consumo: normalizeValue(item.consumption ?? item.consumo ?? item.Consumo ?? item.usage),
  anomalia: normalizeValue(item.anomaly?.name ?? item.anomalia ?? item.Anomalia),
  estatus: normalizeValue(item.status ?? item.estatus ?? item.ESTATUS),
  _raw: item,
})))

const handleOptionsUpdate = (params: Record<string, any>) => {
  readingsStore.fetchReadings(params)
}

const handleRowClick = (item: any) => {
  const readingId = item?._raw?.id ?? item?.id
  if (!readingId)
    return

  router.push({
    name: 'ReadingsDetail',
    params: { id: readingId },
  })
}

const additionalParams = computed(() => ({
  search: search.value,
  period_id: selectedPeriodId.value || undefined,
}))

const currentPeriodLabel = computed(() => {
  if (!selectedPeriodId.value)
    return '--'

  const selectedPeriod = periods.value.find(period => String(period.id) === String(selectedPeriodId.value))
  if (selectedPeriod?.name)
    return String(selectedPeriod.name).toUpperCase()

  if (selectedPeriod?.code)
    return String(selectedPeriod.code)

  const fallbackKey = getPeriodKey(selectedPeriod?.start_date)
  return fallbackKey ? getPeriodLabel(fallbackKey) : '--'
})

const totalReadings = computed(() => filteredTableItems.value.length)

const totalContracts = computed(() => {
  const unique = new Set(
    filteredTableItems.value.map(item => item.contract_id ?? item.contrato ?? item.CONTRATO ?? item.account_id ?? item.id),
  )

  return unique.size
})

const totalConsumption = computed(() => filteredTableItems.value.reduce((acc, item) => {
  const raw = item.consumo ?? item.Consumo ?? item.consumption ?? item.usage ?? 0
  const numeric = Number(raw)

  return acc + (Number.isFinite(numeric) ? numeric : 0)
}, 0))

const totalReadingsDisplay = computed(() => {
  if (metrics.value?.readings_taken !== null && metrics.value?.readings_taken !== undefined)
    return Number(metrics.value.readings_taken)

  return totalReadings.value
})

const totalContractsDisplay = computed(() => {
  if (metrics.value?.readings_expected !== null && metrics.value?.readings_expected !== undefined)
    return Number(metrics.value.readings_expected)

  return totalContracts.value
})

const totalConsumptionDisplay = computed(() => {
  if (metrics.value?.consumption_real !== null && metrics.value?.consumption_real !== undefined)
    return Number(metrics.value.consumption_real)

  return totalConsumption.value
})

const progressPercent = computed(() => {
  if (metrics.value?.avance_global_percentage !== null && metrics.value?.avance_global_percentage !== undefined)
    return Number(metrics.value.avance_global_percentage)

  const base = totalContracts.value || 1

  return (totalReadings.value / base) * 100
})

const formatNumber = (value: number) => {
  return value.toLocaleString('es-MX', { maximumFractionDigits: 2 })
}

const getContractTypeColor = (value: string) => {
  const normalized = String(value || '').toLowerCase()

  if (normalized.includes('comercial'))
    return 'warning'

  return 'info'
}

const getAnomalyColor = (value: string) => {
  const normalized = String(value || '').toLowerCase()

  if (!normalized || normalized.includes('lectura real'))
    return 'success'

  return 'warning'
}

const getStatusColor = (value: string) => {
  const normalized = String(value || '').toLowerCase()

  if (normalized.includes('pendiente'))
    return 'warning'

  return 'success'
}

const getStatusLabel = (value: string) => {
  const normalized = String(value || '').toLowerCase()

  if (normalized === 'pending')
    return 'PENDIENTE'
  if (normalized === 'synced')
    return 'ENVIADO'
  if (normalized === 'processed')
    return 'ENVIADO'

  return value || '-'
}

const statusOptions = [
  { title: 'Enviado', value: 'synced' },
  { title: 'Enviado', value: 'processed' },
  { title: 'Pendiente', value: 'pending' },
]

const anomalyOptions = computed(() => {
  const map = new Map<string, string>()

  filteredItems.value.forEach(item => {
    const value = item.anomaly?.name ?? item.anomalia ?? item.Anomalia
    if (value)
      map.set(String(value), String(value))
  })

  return Array.from(map.entries()).map(([value, title]) => ({ value, title }))
})

const typeOptions = computed(() => {
  const map = new Map<string, string>()

  filteredItems.value.forEach(item => {
    const value = item.contract?.type?.name ?? item.tipo_contrato
    if (value)
      map.set(String(value), String(value))
  })

  return Array.from(map.entries()).map(([value, title]) => ({ value, title }))
})

const sectorOptions = computed(() => {
  const map = new Map<string, string>()

  filteredItems.value.forEach(item => {
    const value = item.contract?.sector?.name ?? item.sector
    if (value)
      map.set(String(value), String(value))
  })

  return Array.from(map.entries()).map(([value, title]) => ({ value, title }))
})

const routeOptions = computed(() => {
  const map = new Map<string, string>()

  filteredItems.value.forEach(item => {
    const value = item.contract?.route?.name ?? item.contract?.route?.code ?? item.ruta
    if (value)
      map.set(String(value), String(value))
  })

  return Array.from(map.entries()).map(([value, title]) => ({ value, title }))
})

const getAnomalyLabel = (value: string) => {
  if (!value)
    return 'LECTURA REAL'

  return String(value).toUpperCase()
}

const handleExport = () => {
  const rows = tableItems.value

  if (!rows.length)
    return

  const columns = [
    { key: 'folio', title: 'FOLIO' },
    { key: 'contrato', title: 'CONTRATO' },
    { key: 'usuario', title: 'USUARIO' },
    { key: 'tipo_contrato', title: 'TIPO CONTRATO' },
    { key: 'sector', title: 'SECTOR' },
    { key: 'ruta', title: 'RUTA' },
    { key: 'anterior', title: 'ANTERIOR' },
    { key: 'actual', title: 'ACTUAL' },
    { key: 'consumo', title: 'CONSUMO' },
    { key: 'anomalia', title: 'ANOMALIA' },
    { key: 'estatus', title: 'ESTATUS' },
  ]

  const escapeValue = (value: any) => {
    const text = String(value ?? '')
    const needsEscaping = text.includes(',') || text.includes('"') || text.includes('\n')

    return needsEscaping ? `"${text.replace(/\"/g, '""')}"` : text
  }

  const csvRows = [
    columns.map(column => column.title).join(','),
    ...rows.map(row => columns.map(column => escapeValue((row as any)[column.key])).join(',')),
  ]

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.setAttribute('download', `lecturas_${new Date().toISOString().slice(0, 10)}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const applyFilters = () => {
  filterOpen.value = false
}

const clearFilters = () => {
  filters.value = {
    status: '',
    anomaly: '',
    type: '',
    sector: '',
    route: '',
  }
}

watch(() => readingsStore.pagination.per_page, value => {
  itemsPerPage.value = value
})

watch(search, () => {
  const params = readingsStore.buildParams(1, readingsStore.pagination.per_page, {
    search: search.value,
    period_id: selectedPeriodId.value,
  })

  readingsStore.fetchReadings(params)
})

watch(selectedPeriodId, () => {
  readingsStore.setPage(1)
  const params = readingsStore.buildParams(1, readingsStore.pagination.per_page, {
    search: search.value,
    period_id: selectedPeriodId.value,
  })

  readingsStore.fetchReadings(params)
  loadMetrics()
})

const handlePerPageChange = (value: number) => {
  readingsStore.setItemsPerPage(value)

  const params = readingsStore.buildParams(1, value, {
    search: search.value,
    period_id: selectedPeriodId.value,
  })

  readingsStore.fetchReadings(params)
}

const normalizeArray = (response: any) => {
  if (Array.isArray(response))
    return response
  if (Array.isArray(response?.data))
    return response.data
  if (Array.isArray(response?.data?.data))
    return response.data.data

  return []
}

const loadPeriods = async () => {
  periodsLoading.value = true
  try {
    const response = await apiService.getPeriods()
    periods.value = normalizeArray(response)
  }
  finally {
    periodsLoading.value = false
  }
}

const loadMetrics = async () => {
  if (!selectedPeriodId.value)
    return

  try {
    const response = await apiService.getMetrics(selectedPeriodId.value)
    metrics.value = response?.data?.data ?? response?.data ?? response
  }
  catch {
    metrics.value = null
  }
}

onMounted(async () => {
  await loadPeriods()
  const params = readingsStore.buildParams(1, readingsStore.pagination.per_page, {
    search: search.value,
    period_id: selectedPeriodId.value,
  })

  readingsStore.fetchReadings(params)
  await loadMetrics()
})
</script>

<template>
  <div class="readings-page">
    <BaseListHeader
      :title="t('Readings.ReadingsModule.title')"
      icon="tabler-gauge"
      :total="readingsStore.pagination.total"
      item-label="lectura"
      item-label-plural="lecturas"
      :description="t('Readings.ReadingsModule.description')"
      :show-create-button="false"
      class="readings-header"
    />

    <VCard class="readings-kpis">
      <VCardText>
        <VRow
          class="readings-kpis__row"
          dense
        >
          <VCol
            cols="12"
            md="2"
            class="readings-kpis__item"
          >
            <div class="kpi">
              <div>
                <div class="kpi__value">
                  {{ currentPeriodLabel }}
                </div>
                <div class="kpi__label">
                  Periodo actual
                </div>
              </div>
              <div class="kpi__icon">
                <VIcon icon="tabler-calendar" />
              </div>
            </div>
          </VCol>
          <VCol
            cols="12"
            md="2"
            class="readings-kpis__item"
          >
            <div class="kpi">
              <div>
                <div class="kpi__value">
                  {{ formatNumber(totalContractsDisplay) }}
                </div>
                <div class="kpi__label">
                  Contratos del periodo
                </div>
              </div>
              <div class="kpi__icon">
                <VIcon icon="tabler-file-text" />
              </div>
            </div>
          </VCol>
          <VCol
            cols="12"
            md="2"
            class="readings-kpis__item"
          >
            <div class="kpi">
              <div>
                <div class="kpi__value">
                  {{ formatNumber(totalReadingsDisplay) }}
                </div>
                <div class="kpi__label">
                  Lecturas realizadas
                </div>
              </div>
              <div class="kpi__icon">
                <VIcon icon="tabler-check" />
              </div>
            </div>
          </VCol>
          <VCol
            cols="12"
            md="2"
            class="readings-kpis__item"
          >
            <div class="kpi">
              <div>
                <div class="kpi__value">
                  {{ formatNumber(progressPercent) }}%
                </div>
                <div class="kpi__label">
                  Avance global
                </div>
              </div>
              <div class="kpi__icon">
                <VIcon icon="tabler-speedometer" />
              </div>
            </div>
          </VCol>
          <VCol
            cols="12"
            md="2"
            class="readings-kpis__item"
          >
            <div class="kpi">
              <div>
                <div class="kpi__value">
                  {{ formatNumber(totalConsumptionDisplay) }} m3
                </div>
                <div class="kpi__label">
                  Consumo del periodo
                </div>
              </div>
              <div class="kpi__icon">
                <VIcon icon="tabler-droplet" />
              </div>
            </div>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <VCard class="readings-table">
      <VCardText>
        <div class="readings-toolbar">
          <VTextField
            v-model="search"
            variant="outlined"
            density="compact"
            placeholder="Buscar"
            prepend-inner-icon="tabler-search"
            hide-details
            class="readings-toolbar__search"
          />
          <div class="readings-toolbar__actions">
            <VSelect
              v-model="selectedPeriodId"
              :items="periodOptions"
              item-title="title"
              item-value="value"
              density="compact"
              variant="outlined"
              hide-details
              class="readings-toolbar__period"
              :disabled="!periodOptions.length || periodsLoading"
            />
            <VSelect
              v-model="itemsPerPage"
              :items="perPageOptions"
              density="compact"
              variant="outlined"
              hide-details
              class="readings-toolbar__select"
              @update:model-value="handlePerPageChange"
            />
            <VBtn
              variant="tonal"
              color="secondary"
              prepend-icon="tabler-upload"
              class="readings-toolbar__export"
              @click="handleExport"
            >
              Exportar
            </VBtn>
            <VBtn
              variant="tonal"
              color="secondary"
              prepend-icon="tabler-adjustments"
              class="readings-toolbar__filters"
              @click="filterOpen = true"
            >
              Filtros
            </VBtn>
          </div>
        </div>

        <BaseDataTable
          :headers="headers"
          :items="tableItems"
          :meta="readingsStore.pagination"
          :loading="readingsStore.loading"
          :additional-params="additionalParams"
          :items-per-page-options="perPageOptions"
          :empty-state-title="t('Readings.ReadingsModule.empty.title')"
          :empty-state-description="t('Readings.ReadingsModule.empty.description')"
          empty-state-icon="tabler-database-off"
          @update:options="handleOptionsUpdate"
          @row:click="handleRowClick"
        >
          <template #item.folio="{ item }">
            <span class="readings-link">{{ item.folio }}</span>
          </template>
          <template #item.tipo_contrato="{ item }">
            <VChip
              size="small"
              variant="tonal"
              :color="getContractTypeColor(item.tipo_contrato)"
            >
              {{ item.tipo_contrato || '-' }}
            </VChip>
          </template>
          <template #item.anomalia="{ item }">
            <VChip
              size="small"
              variant="tonal"
              :color="getAnomalyColor(item.anomalia)"
            >
              {{ getAnomalyLabel(item.anomalia) }}
            </VChip>
          </template>
          <template #item.estatus="{ item }">
            <div class="status-dot">
              <span
                class="status-dot__bullet"
                :class="`status-dot__bullet--${getStatusColor(item.estatus)}`"
              />
              <span class="status-dot__text">{{ getStatusLabel(item.estatus) }}</span>
            </div>
          </template>
          <template #actions>
            <VBtn
              icon="tabler-dots-vertical"
              variant="text"
              size="small"
              color="secondary"
            />
          </template>
        </BaseDataTable>
      </VCardText>
    </VCard>

    <ReadingsFilterDrawer
      v-model="filterOpen"
      title="Filtros"
      @apply="applyFilters"
      @clear="clearFilters"
    >
      <VSelect
        v-model="filters.status"
        :items="statusOptions"
        item-title="title"
        item-value="value"
        label="Estatus"
        density="compact"
        variant="outlined"
        hide-details
      />
      <VSelect
        v-model="filters.anomaly"
        :items="anomalyOptions"
        item-title="title"
        item-value="value"
        label="Anomalia"
        density="compact"
        variant="outlined"
        hide-details
      />
      <VSelect
        v-model="filters.type"
        :items="typeOptions"
        item-title="title"
        item-value="value"
        label="Tipo de contrato"
        density="compact"
        variant="outlined"
        hide-details
      />
      <VSelect
        v-model="filters.sector"
        :items="sectorOptions"
        item-title="title"
        item-value="value"
        label="Sector"
        density="compact"
        variant="outlined"
        hide-details
      />
      <VSelect
        v-model="filters.route"
        :items="routeOptions"
        item-title="title"
        item-value="value"
        label="Ruta"
        density="compact"
        variant="outlined"
        hide-details
      />
    </ReadingsFilterDrawer>
  </div>
</template>

<style scoped lang="scss">
.readings-page {
  inline-size: 100%;
  padding-block: 12px 32px;
}

.readings-header {
  margin-block-end: 16px;
}

.readings-kpis {
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(34, 41, 47, 8%);
  margin-block-end: 20px;
}

.readings-kpis__row {
  display: flex;
  gap: 12px;
}

.readings-kpis__item {
  display: flex;
}

.kpi {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid rgba(15, 23, 42, 8%);
  border-radius: 10px;
  background: #fff;
  gap: 12px;
  inline-size: 100%;
  padding-block: 12px;
  padding-inline: 16px;
}

.kpi__value {
  color: #1f2937;
  font-size: 20px;
  font-weight: 700;
}

.kpi__label {
  color: #64748b;
  font-size: 12px;
}

.kpi__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: #f1f5f9;
  block-size: 36px;
  color: #475569;
  inline-size: 36px;
}

.readings-table {
  border-radius: 12px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 8%);
}

.readings-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-block-end: 12px;
}

.readings-toolbar__search {
  max-inline-size: 280px;
}

.readings-toolbar__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.readings-toolbar__period {
  min-inline-size: 140px;
}

.readings-toolbar__select {
  max-inline-size: 88px;
}

.readings-toolbar__export {
  font-weight: 600;
}

.readings-toolbar__filters {
  font-weight: 600;
}

.readings-link {
  color: #2563eb;
  font-weight: 600;
}

.status-dot {
  display: inline-flex;
  align-items: center;
  font-weight: 600;
  gap: 6px;
}

.status-dot__bullet {
  border-radius: 50%;
  background: #10b981;
  block-size: 6px;
  inline-size: 6px;
}

.status-dot__bullet--warning {
  background: #f59e0b;
}

.status-dot__bullet--success {
  background: #10b981;
}
</style>
