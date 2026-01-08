<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import BaseDataTable from '@/components/BaseDataTable.vue'
import BaseListHeader from '@/components/layout/BaseListHeader.vue'
import { useReadingsStore } from '../stores/readingsStore'

const { t } = useI18n()
const router = useRouter()
const readingsStore = useReadingsStore()

const search = ref('')
const itemsPerPage = ref(readingsStore.pagination.per_page)
const perPageOptions = [10, 25, 50, 100]

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
  const map = new Map<string, { title: string; value: string }>()

  readingsStore.items.forEach(item => {
    const key = getPeriodKey(item.reading_date)

    if (key && !map.has(key))
      map.set(key, { title: getPeriodLabel(key), value: key })
  })

  return Array.from(map.values()).sort((a, b) => b.value.localeCompare(a.value))
})

const selectedPeriod = ref<string | null>(null)

watch(periodOptions, options => {
  if (!options.length) {
    selectedPeriod.value = null
    return
  }

  const exists = options.some(option => option.value === selectedPeriod.value)
  if (!exists)
    selectedPeriod.value = options[0].value
}, { immediate: true })

const filteredItems = computed(() => {
  if (!selectedPeriod.value)
    return readingsStore.items

  return readingsStore.items.filter(item => getPeriodKey(item.reading_date) === selectedPeriod.value)
})

const tableItems = computed(() => filteredItems.value.map(item => ({
  folio: normalizeValue(item.external_contract_id ?? item.folio ?? item.FOLIO ?? item.id),
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
}))

const currentPeriodLabel = computed(() => {
  if (!selectedPeriod.value)
    return '--'

  return getPeriodLabel(selectedPeriod.value)
})

const totalReadings = computed(() => filteredItems.value.length)

const totalContracts = computed(() => {
  const unique = new Set(
    filteredItems.value.map(item => item.contract_id ?? item.contrato ?? item.CONTRATO ?? item.account_id ?? item.id),
  )

  return unique.size
})

const totalConsumption = computed(() => filteredItems.value.reduce((acc, item) => {
  const raw = item.consumo ?? item.Consumo ?? item.consumption ?? item.usage ?? 0
  const numeric = Number(raw)

  return acc + (Number.isFinite(numeric) ? numeric : 0)
}, 0))

const progressPercent = computed(() => {
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

const getAnomalyLabel = (value: string) => {
  if (!value)
    return 'LECTURA REAL'

  return String(value).toUpperCase()
}

const handleExport = () => {
  // Placeholder for export logic
}

watch(() => readingsStore.pagination.per_page, value => {
  itemsPerPage.value = value
})

watch(search, () => {
  const params = readingsStore.buildParams(1, readingsStore.pagination.per_page, { search: search.value })
  readingsStore.fetchReadings(params)
})

watch(selectedPeriod, () => {
  readingsStore.setPage(1)
})

const handlePerPageChange = (value: number) => {
  readingsStore.setItemsPerPage(value)
  const params = readingsStore.buildParams(1, value, { search: search.value })
  readingsStore.fetchReadings(params)
}

onMounted(() => {
  const params = readingsStore.buildParams(1, readingsStore.pagination.per_page, { search: search.value })
  readingsStore.fetchReadings(params)
})
</script>

<template>
  <div class="readings-page">
    <BaseListHeader
      :title="t('ReadingsModule.title')"
      icon="tabler-gauge"
      :total="readingsStore.pagination.total"
      item-label="lectura"
      item-label-plural="lecturas"
      :description="t('ReadingsModule.description')"
      :show-create-button="false"
      class="readings-header"
    />

    <VCard class="readings-kpis">
      <VCardText>
        <VRow class="readings-kpis__row" dense>
          <VCol cols="12" md="2" class="readings-kpis__item">
            <div class="kpi">
              <div>
                <div class="kpi__value">{{ currentPeriodLabel }}</div>
                <div class="kpi__label">Periodo actual</div>
              </div>
              <div class="kpi__icon">
                <VIcon icon="tabler-calendar" />
              </div>
            </div>
          </VCol>
          <VCol cols="12" md="2" class="readings-kpis__item">
            <div class="kpi">
              <div>
                <div class="kpi__value">{{ formatNumber(totalContracts) }}</div>
                <div class="kpi__label">Contratos del periodo</div>
              </div>
              <div class="kpi__icon">
                <VIcon icon="tabler-file-text" />
              </div>
            </div>
          </VCol>
          <VCol cols="12" md="2" class="readings-kpis__item">
            <div class="kpi">
              <div>
                <div class="kpi__value">{{ formatNumber(totalReadings) }}</div>
                <div class="kpi__label">Lecturas realizadas</div>
              </div>
              <div class="kpi__icon">
                <VIcon icon="tabler-check" />
              </div>
            </div>
          </VCol>
          <VCol cols="12" md="2" class="readings-kpis__item">
            <div class="kpi">
              <div>
                <div class="kpi__value">{{ formatNumber(progressPercent) }}%</div>
                <div class="kpi__label">Avance global</div>
              </div>
              <div class="kpi__icon">
                <VIcon icon="tabler-speedometer" />
              </div>
            </div>
          </VCol>
          <VCol cols="12" md="2" class="readings-kpis__item">
            <div class="kpi">
              <div>
                <div class="kpi__value">{{ formatNumber(totalConsumption) }} m3</div>
                <div class="kpi__label">Consumo del periodo</div>
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
              v-model="selectedPeriod"
              :items="periodOptions"
              item-title="title"
              item-value="value"
              density="compact"
              variant="outlined"
              hide-details
              class="readings-toolbar__period"
              :disabled="!periodOptions.length"
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
          </div>
        </div>

        <BaseDataTable
          :headers="headers"
          :items="tableItems"
          :meta="readingsStore.pagination"
          :loading="readingsStore.loading"
          :additional-params="additionalParams"
          :items-per-page-options="perPageOptions"
          :empty-state-title="t('ReadingsModule.empty.title')"
          :empty-state-description="t('ReadingsModule.empty.description')"
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
  margin-block-end: 20px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(34, 41, 47, 0.08);
}

.readings-kpis__row {
  display: flex;
  gap: 12px;
}

.readings-kpis__item {
  display: flex;
}

.kpi {
  inline-size: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.kpi__value {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

.kpi__label {
  font-size: 12px;
  color: #64748b;
}

.kpi__icon {
  inline-size: 36px;
  block-size: 36px;
  border-radius: 10px;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #475569;
}

.readings-table {
  border-radius: 12px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
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

.readings-link {
  color: #2563eb;
  font-weight: 600;
}

.status-dot {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}

.status-dot__bullet {
  inline-size: 6px;
  block-size: 6px;
  border-radius: 50%;
  background: #10b981;
}

.status-dot__bullet--warning {
  background: #f59e0b;
}

.status-dot__bullet--success {
  background: #10b981;
}
</style>
