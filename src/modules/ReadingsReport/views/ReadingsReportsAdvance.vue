<script setup lang="ts">
import debounce from 'lodash/debounce'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

// Componentes internos
import ReadinsReportFilter from '../components/ReadinsReportFilter.vue'
import ReadingsReportTable from '../components/ReadingsReportTable.vue'
import type { newOptions } from '@/types/types'
import { useReadingsReportStore } from '@/modules/ReadingsReport/stores/ReadingsReportStore'

// Props para personalizar el título y descripción
const props = defineProps({
  title: {
    type: String,
    default: 'Avance de Lecturas',
  },
  description: {
    type: String,
    default: 'avance de lecturas registradas con la app.',
  },
})

const { t } = useI18n()
const moduleName = 'readingsReport'

// Composable para manejar diálogos
const { openDialog, navigateTo } = useAppManager()

// Store
const ReadingsReportstore = useReadingsReportStore()

// =======================
//  MÉTRICAS SUPERIORES (Avance)
// =======================

const advanceCards = ref([
  {
    title: 'Anomalías',
    subtitle: 'Cuentas',
    value: '22,874',
    trend: '-12.2%',
    trendColor: '#ef4444', // rojo
    icon: 'tabler-alert-octagon',
    badgeColor: '#fee2e2',
  },
  {
    title: 'Avisos',
    subtitle: 'Cuentas',
    value: '91',
    trend: '-12.2%',
    trendColor: '#ef4444',
    icon: 'tabler-bell',
    badgeColor: '#e0f2fe',
  },
  {
    title: 'Estimación',
    subtitle: 'Porcentaje',
    value: '17%',
    trend: '-12.2%',
    trendColor: '#ef4444',
    icon: 'tabler-percentage',
    badgeColor: '#e0f2fe',
  },
  {
    title: 'Consumo Real',
    subtitle: 'Porcentaje',
    value: '83%',
    trend: '+24.5%',
    trendColor: '#16a34a',
    icon: 'tabler-percentage',
    badgeColor: '#dcfce7',
  },
])

const advanceGlobal = ref({
  title: 'Avance global',
  subtitle: '2025 NOV',
  readsSummary: '72,486 / 124,878',
  volumeSummary: '3,121,950 m³',
  progress: 58, // porcentaje para el círculo
})

// Headers para la tabla
const headers = [
  { title: 'ID', key: 'id' },
  { title: 'Sector', key: 'period_id' },
  { title: 'Ruta', key: 'period_id' },
  { title: 'Lecturista', key: 'created_by' },
  { title: 'Avance', key: 'contract_id' },
  { title: 'Descarga', key: 'date_create' },
  { title: 'Fecha Lectura', key: 'reading_date' },

  // { title: 'Acciones', key: 'actions', sortable: false },
]

// Opciones del menú de exportación
const menuOptions = [
  {
    text: `${t('export_to')} ${t('excel')}`,
    icon: 'tabler-file-spreadsheet',
    action: () => exportItems('excel'),
  },
  {
    text: `${t('export_to')} ${t('pdf')}`,
    icon: 'tabler-file-type-pdf',
    action: () => exportItems('pdf'),
  },
]

// Métodos
const debouncedFetchList = debounce(() => {
  ReadingsReportstore.fetchList()
}, 500)

function applyFilters(newFilters: any) {
  Object.assign(ReadingsReportstore.filters, newFilters)
  debouncedFetchList()
}

function onPageChange(newPage: number) {
  ReadingsReportstore.page = newPage
  ReadingsReportstore.fetchList()
}

function onItemsPerPageChange(newItemsPerPage: number) {
  ReadingsReportstore.itemsPerPage = newItemsPerPage
  ReadingsReportstore.fetchList()
}

function onItemsSortChange(newOptions: newOptions) {
  ReadingsReportstore.sortBy = newOptions.sortBy.map(option => option.key)
  ReadingsReportstore.sortDesc = newOptions.sortBy.map(option => option.order === 'desc')
  ReadingsReportstore.fetchList()
}

function exportItems(type: string) {
  ReadingsReportstore.exportItems(type)
}

// onMounted
onMounted(() => {
  ReadingsReportstore.fetchList()
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

    <!-- ⬇️ Barra de tarjetas de avance (como en la imagen) -->
    <VCardText class="pb-0">
      <div class="advance-metrics">
        <!-- Tarjetas pequeñas -->
        <div
          v-for="card in advanceCards"
          :key="card.title"
          class="advance-card"
        >
          <div class="advance-card-header">
            <div
              class="advance-card-icon"
              :style="{ backgroundColor: card.badgeColor }"
            >
              <VIcon
                :icon="card.icon"
                size="18"
              />
            </div>
            <div class="advance-card-title">
              {{ card.title }}
            </div>
          </div>

          <div class="advance-card-body">
            <div class="advance-card-subtitle">
              {{ card.subtitle }}
            </div>
            <div class="advance-card-value">
              {{ card.value }}
            </div>
            <div
              class="advance-card-trend"
              :style="{ color: card.trendColor }"
            >
              {{ card.trend }}
            </div>
          </div>
        </div>

        <!-- Tarjeta grande de Avance global -->
        <div class="advance-card advance-global-card">
          <div class="advance-global-left">
            <div class="advance-global-title">
              {{ advanceGlobal.title }}
            </div>
            <div class="advance-global-subtitle">
              {{ advanceGlobal.subtitle }}
            </div>

            <div class="advance-global-metrics">
              <div class="advance-global-row">
                <span class="advance-global-label">Lecturas</span>
                <span class="advance-global-value">{{ advanceGlobal.readsSummary }}</span>
              </div>
              <div class="advance-global-row">
                <span class="advance-global-label">Consumo</span>
                <span class="advance-global-value">{{ advanceGlobal.volumeSummary }}</span>
              </div>
            </div>
          </div>

          <div class="advance-global-right">
            <VProgressCircular
              :model-value="advanceGlobal.progress"
              size="90"
              width="10"
              color="success"
            >
              <span class="advance-global-progress-text">
                {{ advanceGlobal.progress }}%
              </span>
            </VProgressCircular>
          </div>
        </div>
      </div>
    </VCardText>
    <!-- ⬆️ Fin barra de tarjetas -->

    <ReadinsReportFilter
      :initial-filters="ReadingsReportstore.filters"
      @update:filters="applyFilters"
    />

    <VCardText>
      <div class="d-flex align-center flex-wrap gap-4 justify-end">
        <!-- Campo de búsqueda -->
        <VTextField
          v-model="ReadingsReportstore.filters.search"
          :label="$t('Buscaras lecturas')"
          variant="outlined"
          dense
          class="filter-field"
          @input="applyFilters"
        />

        <!-- Botón para exportar -->
        <GlobalMenu
          :label="$t('export')"
          :options="menuOptions"
          color="secondary"
          variant="tonal"
          icon="tabler-chevron-down"
        />

        <!-- Botones para acciones con seleccionados -->
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

    <!-- Tabla de elementos -->
    <ReadingsReportTable
      :headers="headers"
      :items="ReadingsReportstore.list"
      :total="ReadingsReportstore.total"
      :page="ReadingsReportstore.page"
      :items-per-page="ReadingsReportstore.itemsPerPage"
      :loading="ReadingsReportstore.isLoading"
      :selection="ReadingsReportstore.selectedItems"
      @update:selection="val => ReadingsReportstore.selectedItems = val"
      @update:page="onPageChange"
      @update:items-per-page="onItemsPerPageChange"
      @view="openViewDialog"
      @edit="openEditDialog"
      @delete="openDeleteDialog"
      @update:items-update-option="onItemsSortChange"
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

/* =========================
   Estilos barra de AVANCE
   ========================= */

.advance-metrics {
  display: flex;
  flex-wrap: nowrap;
  align-items: stretch;
  gap: 1rem;
  overflow-x: auto;
}

.advance-card {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  justify-content: space-between;
  border-radius: 12px;
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 6%);
  min-inline-size: 180px;
  padding-block: 0.85rem;
  padding-inline: 1rem;
}

.advance-card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.advance-card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  block-size: 32px;
  inline-size: 32px;
}

.advance-card-title {
  color: #0f172a;
  font-size: 0.9rem;
  font-weight: 600;
}

.advance-card-body {
  margin-block-start: 0.5rem;
}

.advance-card-subtitle {
  color: #94a3b8;
  font-size: 0.8rem;
}

.advance-card-value {
  font-size: 1.2rem;
  font-weight: 700;
  margin-block: 0.1rem 0.25rem;
}

.advance-card-trend {
  font-size: 0.75rem;
}

/* Tarjeta grande de Avance global */

.advance-global-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  max-inline-size: 260px;
}

.advance-global-left {
  flex: 1 1 auto;
}

.advance-global-right {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
}

.advance-global-title {
  color: #0f172a;
  font-size: 0.9rem;
  font-weight: 600;
}

.advance-global-subtitle {
  color: #94a3b8;
  font-size: 0.8rem;
  margin-block-end: 0.3rem;
}

.advance-global-metrics {
  margin-block-start: 0.35rem;
}

.advance-global-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  margin-block: 0.1rem;
}

.advance-global-label {
  color: #94a3b8;
}

.advance-global-value {
  font-weight: 600;
}

.advance-global-progress-text {
  font-size: 0.9rem;
  font-weight: 700;
}
</style>
