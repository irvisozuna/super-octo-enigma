<!-- ReportViewerPage.vue -->
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

// Organisms
import ReportHeaderOrganism from '../organisms/ReportHeaderOrganism.vue'
import ReportFiltersOrganism from '../organisms/ReportFiltersOrganism.vue'
import ReportDataTableOrganism from '../organisms/ReportDataTableOrganism.vue'
import ReportToolbarOrganism from '../organisms/ReportToolbarOrganism.vue'

// Templates
import DefaultTemplate from '../templates/DefaultTemplate.vue'

// Types & DTOs
import type {
  DensityType,
  ExportFormatDTO,
  FilterValueDTO,
  PaginationDTO,
  ReportConfigDTO,
  SortingRuleDTO,
  ViewModeType,
} from '../../../application/dtos/ReportDtos'

// Use Cases
import { useReportUseCases } from '../../composables/useReportUseCases'

interface Props {
  reportId?: string
}

interface Emits {
  refresh: []
  export: [format: ExportFormatDTO]
  share: []
}

const props = withDefaults(defineProps<Props>(), {
  reportId: () => '',
})

const emit = defineEmits<Emits>()

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

// Use Cases - Dependency Injection
const {
  getReportDataUseCase,
  exportReportUseCase,
  shareReportUseCase,
} = useReportUseCases()

// Reactive State
const state = ref({
  loading: false,
  error: null as string | null,
  reportData: [] as any[],
  totalRecords: 0,
  lastUpdated: new Date(),
  isFullscreen: false,
})

const reportConfig = ref<ReportConfigDTO | null>(null)

// Pagination State
const pagination = ref<PaginationDTO>({
  currentPage: 1,
  itemsPerPage: 50,
})

// Filter State
const filters = ref({
  applied: [] as FilterValueDTO[],
  quickSearch: '',
  showPanel: true,
})

// Sorting State
const sorting = ref({
  active: [] as SortingRuleDTO[],
})

// View State
const view = ref({
  mode: 'table' as ViewModeType,
  density: 'default' as DensityType,
  visibleColumns: [] as string[],
  columnWidths: {} as Record<string, number>,
  frozenColumns: [] as string[],
  showTotals: true,
})

// Export State
const exportState = ref({
  showDialog: false,
  loading: false,
})

// Share State
const shareState = ref({
  showDialog: false,
  link: '',
})

// Auto-refresh timer
let refreshTimer: NodeJS.Timeout | null = null

// Computed Properties
const reportTitle = computed(() =>
  reportConfig.value?.name || t('reports.untitled'),
)

const reportDescription = computed(() =>
  reportConfig.value?.description || reportConfig.value?.basicInfo?.description,
)

const paginatedData = computed(() => {
  let data = [...state.value.reportData]

  // Apply quick search
  if (filters.value.quickSearch) {
    const query = filters.value.quickSearch.toLowerCase()

    data = data.filter(row =>
      view.value.visibleColumns.some(col => {
        const value = row[col]

        return value && value.toString().toLowerCase().includes(query)
      }),
    )
  }

  // Apply pagination
  const start = (pagination.value.currentPage - 1) * pagination.value.itemsPerPage
  const end = start + pagination.value.itemsPerPage

  return data.slice(start, end)
})

const totalPages = computed(() =>
  Math.ceil(state.value.totalRecords / pagination.value.itemsPerPage),
)

const availableExportFormats = computed((): ExportFormatDTO[] => {
  if (!reportConfig.value?.exportOptions)
    return []

  if (reportConfig.value.exportOptions.formats)
    return reportConfig.value.exportOptions.formats.filter((f: any) => f.enabled)

  // Legacy format support
  const formats: ExportFormatDTO[] = []

  if (reportConfig.value.exportOptions.excel?.enabled) {
    formats.push({
      id: 'excel',
      name: 'Excel',
      icon: 'tabler-file-spreadsheet',
      color: 'success',
    })
  }

  if (reportConfig.value.exportOptions.pdf?.enabled) {
    formats.push({
      id: 'pdf',
      name: 'PDF',
      icon: 'tabler-file-type-pdf',
      color: 'error',
    })
  }

  if (reportConfig.value.exportOptions.csv?.enabled) {
    formats.push({
      id: 'csv',
      name: 'CSV',
      icon: 'tabler-file-text',
      color: 'info',
    })
  }

  return formats
})

const hasActiveFilters = computed(() =>
  filters.value.applied.length > 0 || filters.value.quickSearch !== '',
)

const autoRefreshInterval = computed(() =>
  reportConfig.value?.basicInfo?.performance?.refreshInterval || 0,
)

// Methods - Following Clean Architecture
const loadReportData = async (): Promise<void> => {
  state.value.loading = true
  state.value.error = null

  try {
    const reportId = props.reportId || route.params.id as string

    if (!reportId)
      throw new Error(t('reports.errors.missingId'))

    const result = await getReportDataUseCase.execute({
      reportId,
      pagination: pagination.value,
      filters: filters.value.applied,
      sorting: sorting.value.active,
      quickSearch: filters.value.quickSearch,
    })

    if (result.isSuccess()) {
      const data = result.getValue()

      reportConfig.value = data.config
      state.value.reportData = data.records
      state.value.totalRecords = data.totalRecords
      state.value.lastUpdated = new Date()

      initializeViewConfig()
    }
    else {
      state.value.error = result.getError().message
    }
  }
  catch (error) {
    state.value.error = t('reports.errors.loadFailed')
    console.error('Failed to load report data:', error)
  }
  finally {
    state.value.loading = false
  }
}

const initializeViewConfig = (): void => {
  if (!reportConfig.value)
    return

  // Initialize visible columns
  view.value.visibleColumns = reportConfig.value.selectedFields
    .filter(f => f.visible !== false)
    .map(f => f.field)

  // Initialize column widths
  reportConfig.value.selectedFields.forEach(field => {
    view.value.columnWidths[field.field] = field.width || 150
  })

  // Initialize sorting
  if (reportConfig.value.sorting) {
    const sortingRules: SortingRuleDTO[] = []

    if (reportConfig.value.sorting.primary?.field) {
      sortingRules.push({
        field: reportConfig.value.sorting.primary.field,
        direction: reportConfig.value.sorting.primary.direction || 'ASC',
      })
    }

    if (reportConfig.value.sorting.secondary?.field) {
      sortingRules.push({
        field: reportConfig.value.sorting.secondary.field,
        direction: reportConfig.value.sorting.secondary.direction || 'ASC',
      })
    }

    sorting.value.active = sortingRules
  }
}

const handleFiltersUpdate = (updatedFilters: FilterValueDTO[]): void => {
  filters.value.applied = updatedFilters
  pagination.value.currentPage = 1 // Reset to first page
  loadReportData()
}

const handleSortingUpdate = (sortingRules: SortingRuleDTO[]): void => {
  sorting.value.active = sortingRules
  loadReportData()
}

const handleColumnVisibilityUpdate = (visibleColumns: string[]): void => {
  view.value.visibleColumns = visibleColumns
}

const handleViewModeChange = (mode: ViewModeType): void => {
  view.value.mode = mode
}

const handleDensityChange = (density: DensityType): void => {
  view.value.density = density
}

const handleQuickSearchUpdate = (query: string): void => {
  filters.value.quickSearch = query
  pagination.value.currentPage = 1

  // Debounce search to avoid excessive API calls
  debounceSearch()
}

const handlePaginationUpdate = (page: number): void => {
  pagination.value.currentPage = page
  loadReportData()
}

const handleExport = async (format: ExportFormatDTO): Promise<void> => {
  exportState.value.loading = true

  try {
    const result = await exportReportUseCase.execute({
      reportId: props.reportId || route.params.id as string,
      format: format.id,
      filters: filters.value.applied,
      sorting: sorting.value.active,
      visibleColumns: view.value.visibleColumns,
    })

    if (result.isSuccess()) {
      emit('export', format)
      exportState.value.showDialog = false
    }
    else {
      state.value.error = result.getError().message
    }
  }
  catch (error) {
    state.value.error = t('reports.errors.exportFailed')
    console.error('Export failed:', error)
  }
  finally {
    exportState.value.loading = false
  }
}

const handleShare = async (): Promise<void> => {
  try {
    const result = await shareReportUseCase.execute({
      reportId: props.reportId || route.params.id as string,
      filters: filters.value.applied,
      sorting: sorting.value.active,
    })

    if (result.isSuccess()) {
      shareState.value.link = result.getValue().shareUrl
      shareState.value.showDialog = true
      emit('share')
    }
    else {
      state.value.error = result.getError().message
    }
  }
  catch (error) {
    state.value.error = t('reports.errors.shareFailed')
    console.error('Share failed:', error)
  }
}

const handleFullscreenToggle = (): void => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
    state.value.isFullscreen = true
  }
  else {
    document.exitFullscreen()
    state.value.isFullscreen = false
  }
}

const handleRefresh = (): void => {
  emit('refresh')
  loadReportData()
}

const goToReportsList = (): void => {
  router.push('/reports')
}

const editReport = (): void => {
  const reportId = props.reportId || route.params.id as string

  router.push(`/reports/edit/${reportId}`)
}

// Debounced search
let searchTimeout: NodeJS.Timeout | null = null

const debounceSearch = (): void => {
  if (searchTimeout)
    clearTimeout(searchTimeout)

  searchTimeout = setTimeout(() => {
    loadReportData()
  }, 300)
}

// Auto-refresh setup
const setupAutoRefresh = (): void => {
  if (refreshTimer)
    clearInterval(refreshTimer)

  const interval = autoRefreshInterval.value

  if (interval > 0 && reportConfig.value?.basicInfo?.performance?.autoRefresh) {
    refreshTimer = setInterval(() => {
      loadReportData()
    }, interval * 1000)
  }
}

// Copy to clipboard utility
const copyToClipboard = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text)

    // You could show a success toast here
  }
  catch (error) {
    console.error('Failed to copy to clipboard:', error)
  }
}

// Watchers
watch(autoRefreshInterval, setupAutoRefresh)

// Lifecycle
onMounted(async () => {
  await loadReportData()
  setupAutoRefresh()
})

onUnmounted(() => {
  if (refreshTimer)
    clearInterval(refreshTimer)

  if (searchTimeout)
    clearTimeout(searchTimeout)
})
</script>

<template>
  <DefaultTemplate class="report-viewer-page">
    <div
      class="report-viewer-content"
      :class="[
        { 'fullscreen-mode': state.isFullscreen },
      ]"
    >
      <!-- Report Header -->
      <ReportHeaderOrganism
        :title="reportTitle"
        :description="reportDescription"
        :last-updated="state.lastUpdated"
        :loading="state.loading"
        :available-export-formats="availableExportFormats"
        :is-fullscreen="state.isFullscreen"
        @back="goToReportsList"
        @refresh="handleRefresh"
        @export="handleExport"
        @share="handleShare"
        @edit="editReport"
        @fullscreen-toggle="handleFullscreenToggle"
      />

      <!-- Toolbar -->
      <ReportToolbarOrganism
        v-model:view-mode="view.mode"
        v-model:density="view.density"
        v-model:show-filters="filters.showPanel"
        v-model:quick-search="filters.quickSearch"
        :visible-columns="view.visibleColumns"
        :available-columns="reportConfig?.selectedFields || []"
        :frozen-columns="view.frozenColumns"
        @view-mode-change="handleViewModeChange"
        @density-change="handleDensityChange"
        @quick-search-update="handleQuickSearchUpdate"
        @column-visibility-update="handleColumnVisibilityUpdate"
      />

      <!-- Main Content Area -->
      <div class="report-main-content d-flex">
        <!-- Filters Panel -->
        <ReportFiltersOrganism
          v-if="filters.showPanel"
          :filters="reportConfig?.filters || []"
          :applied-filters="filters.applied"
          :loading="state.loading"
          @filters-update="handleFiltersUpdate"
        />

        <!-- Data Table -->
        <ReportDataTableOrganism
          :data="paginatedData"
          :config="reportConfig"
          :loading="state.loading"
          :error="state.error"
          :view-mode="view.mode"
          :density="view.density"
          :visible-columns="view.visibleColumns"
          :column-widths="view.columnWidths"
          :frozen-columns="view.frozenColumns"
          :sorting="sorting.active"
          :show-totals="view.showTotals"
          :current-page="pagination.currentPage"
          :total-pages="totalPages"
          :total-records="state.totalRecords"
          :items-per-page="pagination.itemsPerPage"
          :is-fullscreen="state.isFullscreen"
          @sorting-update="handleSortingUpdate"
          @pagination-update="handlePaginationUpdate"
        />
      </div>

      <!-- Export Dialog -->
      <VDialog
        v-model="exportState.showDialog"
        max-width="400"
        persistent
      >
        <VCard>
          <VCardTitle class="d-flex align-center">
            <VIcon
              icon="tabler-download"
              start
              class="me-2"
            />
            {{ t('reports.export.title') }}
          </VCardTitle>

          <VCardText>
            <VList density="compact">
              <VListItem
                v-for="format in availableExportFormats"
                :key="format.id"
                :disabled="exportState.loading"
                @click="handleExport(format)"
              >
                <template #prepend>
                  <VIcon
                    :icon="format.icon"
                    :color="format.color"
                  />
                </template>

                <VListItemTitle>{{ format.name }}</VListItemTitle>
              </VListItem>
            </VList>
          </VCardText>

          <VCardActions>
            <VSpacer />
            <VBtn
              variant="text"
              :disabled="exportState.loading"
              @click="exportState.showDialog = false"
            >
              {{ t('common.cancel') }}
            </VBtn>
          </VCardActions>
        </VCard>
      </VDialog>

      <!-- Share Dialog -->
      <VDialog
        v-model="shareState.showDialog"
        max-width="500"
        persistent
      >
        <VCard>
          <VCardTitle class="d-flex align-center">
            <VIcon
              icon="tabler-share"
              start
              class="me-2"
            />
            {{ t('reports.share.title') }}
          </VCardTitle>

          <VCardText>
            <VTextField
              v-model="shareState.link"
              :label="t('reports.share.linkLabel')"
              readonly
              variant="outlined"
              density="comfortable"
            >
              <template #append-inner>
                <VBtn
                  icon
                  size="small"
                  variant="text"
                  @click="copyToClipboard(shareState.link)"
                >
                  <VIcon icon="tabler-copy" />
                </VBtn>
              </template>
            </VTextField>
          </VCardText>

          <VCardActions>
            <VSpacer />
            <VBtn
              variant="text"
              @click="shareState.showDialog = false"
            >
              {{ t('common.close') }}
            </VBtn>
          </VCardActions>
        </VCard>
      </VDialog>

      <!-- Error Snackbar -->
      <VSnackbar
        v-model="!!state.error"
        color="error"
        :timeout="5000"
        location="top"
      >
        <VIcon
          icon="tabler-alert-circle"
          start
        />
        {{ state.error }}

        <template #actions>
          <VBtn
            icon
            size="small"
            @click="state.error = null"
          >
            <VIcon icon="tabler-x" />
          </VBtn>
        </template>
      </VSnackbar>
    </div>
  </DefaultTemplate>
</template>

<style scoped>
.report-viewer-page {
  background-color: rgb(var(--v-theme-background));
  min-block-size: 100vh;
}

.report-viewer-content {
  display: flex;
  flex-direction: column;
  min-block-size: 100vh;
}

.report-main-content {
  flex: 1;
  gap: 16px;
  min-block-size: 0;
  padding-block: 0 16px;
  padding-inline: 16px;
}

.fullscreen-mode {
  position: fixed;
  z-index: 9999;
  background: rgb(var(--v-theme-background));
  block-size: 100vh;
  inline-size: 100vw;
  inset-block-start: 0;
  inset-inline-start: 0;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .report-main-content {
    flex-direction: column;
    padding-block: 0 8px;
    padding-inline: 8px;
  }
}

/* Print styles */
@media print {
  .report-viewer-content {
    background: white;
  }

  .fullscreen-mode {
    position: static;
    block-size: auto;
    inline-size: auto;
  }
}

/* Animation for smooth transitions */
.report-viewer-content {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Focus management */
.report-viewer-content:focus-within {
  outline: none;
}

/* Loading state */
.report-viewer-content--loading {
  opacity: 0.7;
  pointer-events: none;
}
</style>
