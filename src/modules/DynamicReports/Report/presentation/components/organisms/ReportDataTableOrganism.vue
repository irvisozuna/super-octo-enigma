<!-- ReportDataTableOrganism.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

// Molecules
import DataTableHeaderMolecule from '../molecules/DataTableHeaderMolecule.vue'
import DataTableRowMolecule from '../molecules/DataTableRowMolecule.vue'
import PaginationMolecule from '../molecules/PaginationMolecule.vue'
import EmptyStateMolecule from '../molecules/EmptyStateMolecule.vue'

// Atoms
import AlertAtom from '../atoms/AlertAtom.vue'
import LoadingAtom from '../atoms/LoadingAtom.vue'

import type {
  DensityType,
  FieldConfigDTO,
  ReportConfigDTO,
  SortingRuleDTO,
  ViewModeType,
} from '../../../application/dtos/ReportDtos'

interface Props {
  data: any[]
  config: ReportConfigDTO | null
  loading?: boolean
  error?: string | null
  viewMode: ViewModeType
  density: DensityType
  visibleColumns: string[]
  columnWidths: Record<string, number>
  frozenColumns: string[]
  sorting: SortingRuleDTO[]
  showTotals?: boolean
  currentPage: number
  totalPages: number
  totalRecords: number
  itemsPerPage: number
  isFullscreen?: boolean
}

interface Emits {
  sortingUpdate: [sorting: SortingRuleDTO[]]
  paginationUpdate: [page: number]
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
  showTotals: true,
  isFullscreen: false,
})

const emit = defineEmits<Emits>()

const { t } = useI18n()

const hasData = computed(() => props.data.length > 0)

const hasConfig = computed(() => !!props.config)

const visibleFields = computed((): FieldConfigDTO[] => {
  if (!props.config)
    return []

  return props.config.selectedFields.filter(field =>
    props.visibleColumns.includes(field.field),
  )
})

const tableHeight = computed(() => {
  if (props.isFullscreen)
    return 'calc(100vh - 300px)'

  switch (props.density) {
    case 'compact':
      return '500px'
    case 'comfortable':
      return '700px'
    default:
      return '600px'
  }
})

const tableDensity = computed(() => {
  switch (props.density) {
    case 'compact':
      return 'compact'
    case 'comfortable':
      return 'comfortable'
    default:
      return 'default'
  }
})

const formatCellValue = (value: any, field: FieldConfigDTO): string => {
  if (value === null || value === undefined)
    return '-'

  switch (field.format) {
    case 'number': {
      const num = Number.parseFloat(value)
      if (isNaN(num))
      return value

      return field.thousandsSeparator
        ? num.toLocaleString('es-MX', {
          minimumFractionDigits: field.decimals || 0,
          maximumFractionDigits: field.decimals || 0,
      })
        : num.toFixed(field.decimals || 0)
    }

    case 'currency': {
      const curr = Number.parseFloat(value)
      if (isNaN(curr))
      return value

      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: field.decimals || 2,
        maximumFractionDigits: field.decimals || 2,
    }).format(curr)
    }

    case 'percentage': {
      const perc = Number.parseFloat(value)
      if (isNaN(perc))
      return value

      return `${(perc * 100).toFixed(field.decimals || 0)}%`
    }

    case 'date':
      try {
        return new Date(value).toLocaleDateString('es-MX')
      }
    catch {
        return value
      }

    case 'datetime':
      try {
        return new Date(value).toLocaleString('es-MX')
      }
    catch {
        return value
      }

    case 'boolean':
      return value ? t('common.yes') : t('common.no')

    default:
      return value
  }
}

const calculateTotal = (field: FieldConfigDTO): string | null => {
  if (!props.showTotals || !['number', 'double', 'integer', 'currency'].includes(field.type))
    return null

  const values = props.data.map(row => Number.parseFloat(row[field.field]) || 0)

  let result: number

  switch (field.aggregation) {
    case 'SUM':
      result = values.reduce((a, b) => a + b, 0)
      break
    case 'AVG':
      result = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
      break
    case 'COUNT':
      return values.length.toString()
    case 'MIN':
      result = Math.min(...values)
      break
    case 'MAX':
      result = Math.max(...values)
      break
    default:
      result = values.reduce((a, b) => a + b, 0)
  }

  return formatCellValue(result, field)
}

const handleSort = (field: string): void => {
  const existingSort = props.sorting.find(s => s.field === field)
  let newSorting: SortingRuleDTO[]

  if (existingSort) {
    if (existingSort.direction === 'ASC') {
      // Change to DESC
      newSorting = props.sorting.map(s =>
        s.field === field ? { ...s, direction: 'DESC' as const } : s,
      )
    }
    else {
      // Remove sorting
      newSorting = props.sorting.filter(s => s.field !== field)
    }
  }
  else {
    // Add new sorting
    newSorting = [...props.sorting, { field, direction: 'ASC' as const }]
  }

  emit('sortingUpdate', newSorting)
}

const getSortState = (field: string): { direction: 'ASC' | 'DESC' | null; index: number | null } => {
  const index = props.sorting.findIndex(s => s.field === field)

  if (index >= 0) {
    return {
      direction: props.sorting[index].direction,
      index: index + 1,
    }
  }

  return { direction: null, index: null }
}

const handlePageChange = (page: number): void => {
  emit('paginationUpdate', page)
}

const getColumnStyle = (field: FieldConfigDTO) => ({
  width: `${props.columnWidths[field.field] || 150}px`,
  textAlign: field.align || 'left',
  position: props.frozenColumns.includes(field.field) ? 'sticky' : 'relative',
  left: props.frozenColumns.includes(field.field) ? '0' : 'auto',
  zIndex: props.frozenColumns.includes(field.field) ? 10 : 1,
  backgroundColor: 'rgb(var(--v-theme-surface))',
})
</script>

<template>
  <VCard class="report-data-table flex-grow-1">
    <!-- Loading Overlay -->
    <VOverlay
      :model-value="loading"
      contained
      class="align-center justify-center"
    >
      <LoadingAtom size="64" />
    </VOverlay>

    <!-- Error State -->
    <AlertAtom
      v-if="error && !loading"
      type="error"
      variant="tonal"
      :text="error"
      class="ma-4"
    />

    <!-- Data Table Content -->
    <div
      v-else-if="hasConfig && !loading"
      class="data-table-container"
    >
      <!-- Table View -->
      <VTable
        v-if="viewMode === 'table'"
        :density="tableDensity"
        fixed-header
        :height="tableHeight"
        class="report-table"
      >
        <!-- Table Header -->
        <DataTableHeaderMolecule
          :fields="visibleFields"
          :sorting="sorting"
          :get-column-style="getColumnStyle"
          :get-sort-state="getSortState"
          @sort="handleSort"
        />

        <!-- Table Body -->
        <tbody>
          <DataTableRowMolecule
            v-for="(row, index) in data"
            :key="index"
            :row="row"
            :fields="visibleFields"
            :row-index="index"
            :get-column-style="getColumnStyle"
            :format-cell-value="formatCellValue"
          />

          <!-- Totals Row -->
          <tr
            v-if="showTotals && hasData"
            class="totals-row"
          >
            <td
              v-for="field in visibleFields"
              :key="`total-${field.field}`"
              :style="getColumnStyle(field)"
              class="font-weight-bold text-primary"
            >
              {{ calculateTotal(field) || '' }}
            </td>
          </tr>
        </tbody>
      </VTable>

      <!-- Card View -->
      <div
        v-else-if="viewMode === 'card'"
        class="card-view-container pa-4"
      >
        <VRow>
          <VCol
            v-for="(row, index) in data"
            :key="index"
            cols="12"
            sm="6"
            md="4"
            lg="3"
          >
            <VCard
              variant="outlined"
              class="data-card"
            >
              <VCardText>
                <div
                  v-for="field in visibleFields.slice(0, 6)"
                  :key="field.field"
                  class="d-flex justify-space-between mb-2"
                >
                  <span class="text-caption text-medium-emphasis">
                    {{ field.alias }}:
                  </span>
                  <span class="font-weight-medium">
                    {{ formatCellValue(row[field.field], field) }}
                  </span>
                </div>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
      </div>

      <!-- Chart View -->
      <div
        v-else-if="viewMode === 'chart'"
        class="chart-view-container pa-4"
      >
        <AlertAtom
          type="info"
          variant="tonal"
          :title="t('reports.chart.comingSoon')"
          :text="t('reports.chart.comingSoonText')"
          icon="tabler-chart-bar"
        />
      </div>

      <!-- Empty State -->
      <EmptyStateMolecule
        v-if="!hasData && !loading"
        :title="t('reports.emptyState.title')"
        :subtitle="t('reports.emptyState.subtitle')"
        icon="tabler-table"
        :action-label="t('reports.emptyState.action')"
        @action="$emit('refresh')"
      />

      <!-- Pagination -->
      <VCardActions
        v-if="hasData"
        class="justify-space-between pa-4"
      >
        <div class="text-body-2 text-medium-emphasis">
          {{ t('reports.pagination.showing', {
            start: (currentPage - 1) * itemsPerPage + 1,
            end: Math.min(currentPage * itemsPerPage, totalRecords),
            total: totalRecords,
          }) }}
        </div>

        <PaginationMolecule
          :current-page="currentPage"
          :total-pages="totalPages"
          :total-items="totalRecords"
          :items-per-page="itemsPerPage"
          @page-change="handlePageChange"
        />
      </VCardActions>
    </div>

    <!-- No Configuration State -->
    <EmptyStateMolecule
      v-else-if="!hasConfig && !loading"
      :title="t('reports.noConfig.title')"
      :subtitle="t('reports.noConfig.subtitle')"
      icon="tabler-settings"
      :action-label="t('reports.noConfig.action')"
      @action="$router.push('/reports')"
    />
  </VCard>
</template>

<style scoped>
.report-data-table {
  display: flex;
  flex-direction: column;
  min-block-size: 400px;
}

.data-table-container {
  display: flex;
  flex: 1;
  flex-direction: column;
}

.report-table {
  flex: 1;
}

.report-table :deep(.v-table__wrapper) {
  overflow: auto;
}

.report-table :deep(th) {
  cursor: pointer;
  transition: background-color 0.2s ease;
  user-select: none;
}

.report-table :deep(th:hover) {
  background-color: rgb(var(--v-theme-surface-variant));
}

.totals-row td {
  background-color: rgb(var(--v-theme-surface-variant));
  border-block-start: 2px solid rgb(var(--v-theme-primary));
}

.card-view-container {
  flex: 1;
  overflow-y: auto;
}

.data-card {
  block-size: 100%;
  transition: all 0.2s ease;
}

.data-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 10%);
  transform: translateY(-2px);
}

.chart-view-container {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .report-table :deep(th),
  .report-table :deep(td) {
    min-inline-size: 100px;
    padding-block: 8px;
    padding-inline: 4px;
  }

  .card-view-container .v-col {
    padding: 4px;
  }
}
</style>
