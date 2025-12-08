<script setup lang="ts">
import debounce from 'lodash/debounce'
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import ReadingsReportFilter from '../components/ReadinsReportFilter.vue'
import ReadingsReportTable from '../components/ReadingsReportTable.vue'
import { useReadingsReportStore } from '../stores/ReadingsReportStore'
import { ROUTE_STATUS_STYLES } from '../../config/readingsReport.config'
import type { newOptions } from '@/types/types'
import { useAppManager } from '@/composables/useAppManager'

const props = defineProps({
  title: { type: String, default: 'Avance de Lecturistas' },
  description: { type: String, default: 'Numero de lecturas realizadas en el mes actual por los lecturistas.' },
})

const { t } = useI18n()
const { navigateTo } = useAppManager()
const ReadingsReportstore = useReadingsReportStore()

const fallbackCards = [
  {
    title: 'Anomalías',
    subtitle: 'Cuentas',
    value: '--',
    trend: '--',
    trendColor: '#ef4444',
    icon: 'tabler-alert-octagon',
    badgeColor: '#fee2e2',
  },
  {
    title: 'Avisos',
    subtitle: 'Cuentas',
    value: '--',
    trend: '--',
    trendColor: '#eab308',
    icon: 'tabler-bell',
    badgeColor: '#fef9c3',
  },
  {
    title: 'Estimación',
    subtitle: 'Porcentaje',
    value: '--',
    trend: '--',
    trendColor: '#06b6d4',
    icon: 'tabler-percentage',
    badgeColor: '#e0f2fe',
  },
  {
    title: 'Consumo Real',
    subtitle: 'Porcentaje',
    value: '--',
    trend: '--',
    trendColor: '#16a34a',
    icon: 'tabler-droplet-half',
    badgeColor: '#dcfce7',
  },
]

const advanceCards = computed(() => ReadingsReportstore.advanceCards?.length
  ? ReadingsReportstore.advanceCards
  : fallbackCards)

const advanceGlobal = computed(() => ReadingsReportstore.advanceGlobal)
const isAdvanceLoading = computed(() => ReadingsReportstore.isAdvanceLoading)
const routeStatusStyles = ROUTE_STATUS_STYLES

const advanceGlobalDisplay = computed(() => {
  const progress = Number(advanceGlobal.value?.progress ?? 0)
  const readsSummary = advanceGlobal.value?.readsSummary || '0 / 0'
  const volumeSummary = advanceGlobal.value?.volumeSummary
    ? `${advanceGlobal.value.volumeSummary} m³`
    : '0 m³'

  return {
    title: advanceGlobal.value?.title || 'Avance global',
    subtitle: advanceGlobal.value?.subtitle || '',
    readsSummary,
    volumeSummary,
    progress: Number.isFinite(progress) ? progress : 0,
  }
})

const headers = [
  { title: 'Ruta', key: 'route_name' },
  { title: 'Sector', key: 'sector_name' },
  { title: 'Lecturista', key: 'lecturist_name' },
  { title: 'Lecturas', key: 'taken_readings' }, // tomadas / total
  { title: 'Avance', key: 'progress_percent' }, // %
  { title: 'Estatus', key: 'status' },
  { title: 'Descarga', key: 'downloaded_at' },
]

const menuOptions = [
  { text: `${t('export_to')} ${t('excel')}`, icon: 'tabler-file-spreadsheet', action: () => exportItems('excel') },
  { text: `${t('export_to')} ${t('pdf')}`, icon: 'tabler-file-type-pdf', action: () => exportItems('pdf') },
]

const debouncedFetchList = debounce(() => {
  ReadingsReportstore.fetchRoutesProgress()
}, 500)

const debouncedFetchAdvance = debounce(() => {
  ReadingsReportstore.fetchAdvance()
}, 500)

function applyFilters(newFilters: any) {
  Object.assign(ReadingsReportstore.filters, newFilters)
  debouncedFetchAdvance()
  debouncedFetchList()
}

function onPageChange(newPage: number) {
  ReadingsReportstore.page = newPage
  ReadingsReportstore.fetchRoutesProgress()
}

function onItemsPerPageChange(newItemsPerPage: number) {
  ReadingsReportstore.itemsPerPage = newItemsPerPage
  ReadingsReportstore.fetchRoutesProgress()
}

function onItemsSortChange(newOptions: newOptions) {
  ReadingsReportstore.sortBy = newOptions.sortBy.map(option => option.key)
  ReadingsReportstore.sortDesc = newOptions.sortBy.map(option => option.order === 'desc')
  ReadingsReportstore.fetchRoutesProgress()
}

function exportItems(type: string) {
  ReadingsReportstore.exportItems(type as 'excel' | 'pdf')
}

function deleteSelected() {
  console.log('Eliminar seleccionados', ReadingsReportstore.selectedItems)
}

function openViewDialog(item: any) {
  navigateTo(`/templates/${item.id}`)
}

function openEditDialog(item: any) {
  console.log('Editar', item)
}

function openDeleteDialog(item: any) {
  console.log('Eliminar item', item)
}

onMounted(async () => {
  await ReadingsReportstore.ensureActivePeriod()
  ReadingsReportstore.fetchAdvance()
  ReadingsReportstore.fetchRoutesProgress()
})
</script>

<template>
  <VCard>
    <VCardTitle>
      <h4 class="text-h4 mb-1">
        {{ title }}
      </h4>
      <p class="text-body-1 mb-4">
        {{ description }}
      </p>
    </VCardTitle>

    <VCardText class="pb-0">
      <div class="advance-strip">
        <!-- tarjetas chicas -->
        <div
          v-for="card in advanceCards"
          :key="card.title"
          class="mini-card"
        >
          <div
            class="mini-card-icon"
            :style="{ backgroundColor: card.badgeColor || '#f1f5f9' }"
          >
            <VIcon
              :icon="card.icon"
              size="18"
            />
          </div>
          <div class="mini-card-title">
            {{ card.title }}
          </div>
          <div class="mini-card-subtitle">
            {{ card.subtitle }}
          </div>
          <div class="mini-card-value">
            {{ card.value }}
          </div>
          <div
            class="mini-card-trend"
            :style="{ color: card.trendColor || '#94a3b8' }"
          >
            {{ card.trend }}
          </div>
        </div>

        <!-- tarjeta grande -->
        <div class="global-card">
          <div class="global-card-body">
            <div class="global-card-title">
              {{ advanceGlobalDisplay.title }}
            </div>
            <div class="global-card-subtitle">
              {{ advanceGlobalDisplay.subtitle }}
            </div>
            <div class="global-card-row">
              <span>Lecturas</span>
              <span class="global-card-value">{{ advanceGlobalDisplay.readsSummary }}</span>
            </div>
            <div class="global-card-row">
              <span>Consumo</span>
              <span class="global-card-value">{{ advanceGlobalDisplay.volumeSummary }}</span>
            </div>
          </div>
          <div class="global-card-gauge">
            <VProgressCircular
              :model-value="advanceGlobalDisplay.progress"
              size="96"
              width="12"
              color="#16a34a"
            >
              <span class="global-card-progress">{{ advanceGlobalDisplay.progress }}%</span>
            </VProgressCircular>
          </div>
        </div>
      </div>
    </VCardText>

    <ReadingsReportFilter
      :initial-filters="ReadingsReportstore.filters"
      @update:filters="applyFilters"
    />

    <VCardText>
      <div class="d-flex align-center flex-wrap gap-4 justify-end">
        <VTextField
          v-model="ReadingsReportstore.filters.search"
          :label="$t('Buscaras lecturas')"
          variant="outlined"
          dense
          class="filter-field"
          @input="applyFilters"
        />
        <GlobalMenu
          :label="$t('export')"
          :options="menuOptions"
          color="secondary"
          variant="tonal"
          icon="tabler-chevron-down"
        />
        <VBtn
          v-if="ReadingsReportstore.selectedItems.length > 1"
          color="error"
          @click="deleteSelected"
        >
          {{ $t('delete selected') }}
        </VBtn>
      </div>
    </VCardText>

    <VDivider />

    <ReadingsReportTable
      :headers="headers"
      :items="ReadingsReportstore.list"
      :total="ReadingsReportstore.total"
      :page="ReadingsReportstore.page"
      :items-per-page="ReadingsReportstore.itemsPerPage"
      :loading="ReadingsReportstore.isAdvanceLoading"
      :selection="ReadingsReportstore.selectedItems"
      item-key="route_id"
      :status-styles="routeStatusStyles"
      @update:selection="val => ReadingsReportstore.selectedItems = val"
      @update:page="onPageChange"
      @update:items-per-page="onItemsPerPageChange"
      @update:items-update-option="onItemsSortChange"
      @view="openViewDialog"
      @edit="openEditDialog"
      @delete="openDeleteDialog"
    />
  </VCard>
</template>

<style scoped>
.buttons-container {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
}

.filter-field {
  flex: 1;
  max-inline-size: 300px;
}

.advance-loading {
  color: #94a3b8;
  font-size: 0.9rem;
  padding-block: 1rem;
}

.advance-strip {
  display: grid;
  align-items: stretch;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
}

.mini-card {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 4%);
  padding-block: 0.9rem;
  padding-inline: 1rem;
}

.mini-card-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: 12px;
  margin-block-end: 0.45rem;
}

.mini-card-title {
  color: #0f172a;
  font-weight: 700;
}

.mini-card-subtitle {
  color: #94a3b8;
  font-size: 0.85rem;
  margin-block-end: 0.15rem;
}

.mini-card-value {
  color: #0f172a;
  font-size: 1.2rem;
  font-weight: 800;
}

.mini-card-trend {
  font-size: 0.8rem;
  margin-block-start: 0.1rem;
}

.global-card {
  display: grid;
  align-items: center;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 4%);
  gap: 1rem;
  grid-column: span 2;
  grid-template-columns: 1fr auto;
  padding-block: 1rem;
  padding-inline: 1.2rem;
}

.global-card-title {
  color: #0f172a;
  font-size: 1.05rem;
  font-weight: 800;
}

.global-card-subtitle {
  color: #94a3b8;
  margin-block-end: 0.35rem;
}

.global-card-row {
  display: flex;
  justify-content: space-between;
  color: #475569;
  font-size: 0.95rem;
  margin-block: 0.15rem;
  margin-inline: 0;
}

.global-card-value {
  color: #0f172a;
  font-weight: 700;
}

.global-card-gauge {
  display: flex;
  align-items: center;
  justify-content: center;
}

.global-card-progress {
  color: #0f172a;
  font-weight: 800;
}

@media (max-width: 1024px) {
  .global-card {
    grid-column: span 1;
  }
}
</style>
