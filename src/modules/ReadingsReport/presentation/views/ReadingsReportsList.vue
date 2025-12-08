<!-- src/modules/ReadingsReport/pages/ReadingsReportPage.vue -->
<script setup lang="ts">
import debounce from 'lodash/debounce'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ReadingsReportFilter from '../components/ReadinsReportFilter.vue'
import ReadingsReportTable from '../components/ReadingsReportTable.vue'
import { READINGS_REPORT_HEADERS } from '../../config/readingsReport.config'
import { useReadingsReportStore } from '../stores/ReadingsReportStore'
import { useAppManager } from '@/composables/useAppManager'
import { rawApi } from '@/services/api'
import { ENDPOINTS } from '@/services/endpoints'

// Props para personalizar el título y descripción
const props = defineProps({
  title: {
    type: String,
    default: 'Reporte de lecturas',
  },
  description: {
    type: String,
    default: 'Consulta y exporta el avance de lecturas del periodo.',
  },
})

const { t } = useI18n()
const { openDialog, navigateTo } = useAppManager()

// Store
const ReadingsReportstore = useReadingsReportStore()

// =======================
//  MÉTRICAS SUPERIORES
// =======================

const periodLabel = ref<string>('—')
const periodSubtitle = ref<string>('Periodo actual')

const readingsKpis = ref([
  {
    label: 'Contratos del periodo',
    value: '—',
  },
  {
    label: 'Lecturas realizadas',
    value: '—',
  },
  {
    label: 'Avance global',
    value: '—',
  },
  {
    label: 'Consumo del periodo',
    value: '—',
  },
])

const currentPeriodId = ref<number | null>(null)

// Headers para la tabla (desde config)
const headers = READINGS_REPORT_HEADERS

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

// =======================
//  LÓGICA PARA PERIODOS + KPIs
// =======================

async function fetchPeriodConsumption(periodId: number) {
  try {
    const response = await rawApi(ENDPOINTS.READINGS_PERIOD_CONSUMPTION || '/readings/report/period-consumption', {
      method: 'GET',
      params: {
        period_id: periodId,
      },
    })

    const totalContracts = Number(response?.total_downloaded ?? 0)
    const totalReadings = Number(response?.total_readings ?? 0)
    const totalConsumption = Number(response?.total_consumption ?? 0)

    const avance = totalContracts > 0
      ? (totalReadings / totalContracts) * 100
      : 0

    readingsKpis.value = [
      {
        label: 'Contratos del periodo',
        value: totalContracts.toLocaleString('es-MX'),
      },
      {
        label: 'Lecturas realizadas',
        value: totalReadings.toLocaleString('es-MX'),
      },
      {
        label: 'Avance global',
        value: `${avance.toFixed(2)}%`,
      },
      {
        label: 'Consumo del periodo',
        value: `${totalConsumption.toLocaleString('es-MX')} m³`,
      },
    ]
  }
  catch (error) {
    console.error('Error cargando KPIs de consumo del periodo:', error)
    readingsKpis.value = [
      { label: 'Contratos del periodo', value: '—' },
      { label: 'Lecturas realizadas', value: '—' },
      { label: 'Avance global', value: '—' },
      { label: 'Consumo del periodo', value: '—' },
    ]
  }
}

async function fetchCurrentPeriodAndInit() {
  try {
    // Traemos periodos (ejemplo: último abierto, ordenado por id desc)
    const response = await rawApi('/periods', {
      method: 'GET',
      params: {
        per_page: 1,
        sort_by: 'id',
        sort_desc: 1,
        status: 'open', // si quieres solo periodos abiertos
      },
    })

    const period = response?.data?.[0]

    if (period) {
      currentPeriodId.value = period.id
      periodLabel.value = period.code ?? period.name ?? `Periodo #${period.id}`
      periodSubtitle.value = period.name ?? 'Periodo actual'

      // Ajustamos filtro del store para que reporte siempre ese periodo por default
      ReadingsReportstore.filters.period_id = period.id

      // Traemos KPIs y lista de lecturas en paralelo
      await Promise.all([
        fetchPeriodConsumption(period.id),
        ReadingsReportstore.fetchList(),
      ])
    }
    else {
      // Si no hay periodos, al menos lista lecturas normales
      await ReadingsReportstore.fetchList()
    }
  }
  catch (error) {
    console.error('Error cargando periodo actual:', error)
    await ReadingsReportstore.fetchList()
  }
}

// =======================
//  MÉTODOS DE LISTADO / FILTROS
// =======================

const debouncedFetchList = debounce(() => {
  ReadingsReportstore.fetchList()
}, 500)

function applyFilters(newFilters: any) {
  const previousPeriodId = ReadingsReportstore.filters.period_id

  Object.assign(ReadingsReportstore.filters, newFilters)

  // Si en los filtros viene un period_id distinto, recargamos KPIs
  if (
    newFilters?.period_id
    && newFilters.period_id !== previousPeriodId
  ) {
    currentPeriodId.value = Number(newFilters.period_id)
    fetchPeriodConsumption(currentPeriodId.value)
  }

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
  // newOptions.sortBy: [{ key: 'id', order: 'asc' | 'desc' }, ...]
  ReadingsReportstore.sortBy = newOptions.sortBy.map(option => option.key)
  ReadingsReportstore.sortDesc = newOptions.sortBy.map(option => option.order === 'desc')
  ReadingsReportstore.fetchList()
}

// =======================
//  ACCIONES (placeholder)
// =======================

function deleteSelected() {
  console.log('Eliminar seleccionados', ReadingsReportstore.selectedItems)
}

function openAddDialog() {
  console.log('Abrir diálogo agregar')
}

function openEditDialog(item: any) {
  console.log('Editar', item)
}

function openViewDialog(item: any) {
  navigateTo(`/templates/${item.id}`)
}

function openDeleteDialog(item: any) {
  console.log('Eliminar item', item)
}

function exportItems(type: string) {
  ReadingsReportstore.exportItems(type)
}

// onMounted
onMounted(() => {
  fetchCurrentPeriodAndInit()
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

    <!-- Barra de métricas tipo dashboard -->
    <VCardText class="pb-0">
      <div class="metrics-container">
        <div class="metric-card period-card">
          <div class="metric-period-label">
            {{ periodLabel }}
          </div>
          <div class="metric-period-subtitle">
            {{ periodSubtitle }}
          </div>
        </div>

        <div
          v-for="kpi in readingsKpis"
          :key="kpi.label"
          class="metric-card"
        >
          <div class="metric-value">
            {{ kpi.value }}
          </div>
          <div class="metric-label">
            {{ kpi.label }}
          </div>
        </div>
      </div>
    </VCardText>

    <!-- Filtros reutilizables -->
    <ReadinsReportListFilter
      :initial-filters="ReadingsReportstore.filters"
      @update:filters="applyFilters"
    />

    <VCardText>
      <div class="d-flex align-center flex-wrap gap-4 justify-end">
        <!-- Campo de búsqueda -->
        <VTextField
          v-model="ReadingsReportstore.filters.search"
          :label="$t('Buscar lecturas')"
          variant="outlined"
          density="compact"
          class="filter-field"
          @input="() => applyFilters({})"
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
      @update:selection="val => (ReadingsReportstore.selectedItems = val)"
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

/* Barra de métricas superior */
.metrics-container {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: 1rem;
}

.metric-card {
  display: flex;
  flex: 1 1 180px;
  flex-direction: column;
  justify-content: center;
  border-radius: 12px;
  background-color: #f8fafc;
  padding-block: 0.85rem;
  padding-inline: 1.1rem;
}

.period-card {
  max-inline-size: 220px;
}

.metric-period-label {
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.metric-period-subtitle {
  color: #64748b;
  font-size: 0.9rem;
}

.metric-value {
  font-size: 1.1rem;
  font-weight: 700;
}

.metric-label {
  color: #64748b;
  font-size: 0.85rem;
}
</style>
