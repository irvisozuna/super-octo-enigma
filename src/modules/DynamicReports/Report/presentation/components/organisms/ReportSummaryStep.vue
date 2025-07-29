<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = withDefaults(defineProps<Props>(), {
  basicInfo: () => ({ name: '', description: '', dataSourceId: '', isActive: true, isPublic: false }),
  selectedFields: () => [],
  filters: () => [],
  dataSources: () => [],
  sorting: () => ({ primary: { field: '', direction: 'ASC' }, secondary: undefined, tertiary: undefined, nullsHandling: 'LAST', caseSensitive: false }),
  exportOptions: () => ({
    excel: { enabled: true, includeCharts: false, autoFilter: true, includeHeaders: true, includeTotals: true },
    pdf: { enabled: true, orientation: 'portrait', pageSize: 'A4', margins: 10, includeHeaders: true, includeTotals: true },
    csv: { enabled: true, delimiter: ',', encoding: 'UTF-8', includeHeaders: true },
    general: { filenameTemplate: 'report_{date}_{time}', compressionLevel: 'medium' },
  }),
  advanced: () => ({
    columns: [],
    footer: { enabled: true, showTotals: true, showSubtotals: false, showCount: true, showAverage: false, showMin: false, showMax: false, customText: '' },
    display: { showGridLines: true, showAlternateRows: true, alternateRowColor: '#f5f5f5', headerStyle: 'default', rowHeight: 40, maxRowsPerPage: 50, enablePagination: true },
    grouping: { enabled: false, showGroupHeaders: true, showGroupFooters: true, collapseGroups: false, groupByFields: [] },
    styling: { theme: 'default', primaryColor: '#1976d2', secondaryColor: '#424242', fontFamily: 'Arial', fontSize: 12 },
    templates: { selected: 'default', custom: [] },
    calculatedFields: [],
    conditionalFormats: [],
    interactive: {
      filters: { enabled: true, showFilterBar: true, quickFilters: [], allowCustomFilters: true },
      actions: { enabled: true, allowExport: true, allowPrint: true, allowShare: true, customActions: [] },
      drillDown: { enabled: false, levels: [] },
    },
    performance: {
      enableCache: true,
      cacheTimeout: 300,
      enableLazyLoading: true,
      enableVirtualScrolling: false,
      maxRowsToRender: 1000,
    },
    security: {
      enableFieldLevelSecurity: false,
      hiddenFields: [],
      restrictedFields: [],
      enableRowLevelSecurity: false,
      securityFilters: [],
    },
  }),
  loading: false,
  error: null,
})

const emit = defineEmits<Emits>()

interface Props {
  basicInfo: {
    name: string
    description: string
    dataSourceId: string
    isActive: boolean
    isPublic: boolean
  }
  selectedFields: Array<{
    field: string
    alias: string
    format: string
    width: number
    aggregation?: string
    sortable: boolean
    filterable: boolean
  }>
  filters: Array<{
    field: string
    type: string
    operator: string
    required: boolean
    placeholder: string
  }>
  dataSources: Array<{ id: string; name: string }>
  sorting?: {
    primary: { field: string; direction: 'ASC' | 'DESC' }
    secondary?: { field: string; direction: 'ASC' | 'DESC' }
    tertiary?: { field: string; direction: 'ASC' | 'DESC' }
    nullsHandling: 'FIRST' | 'LAST' | 'IGNORE'
    caseSensitive: boolean
  }
  exportOptions?: {
    excel: {
      enabled: boolean
      includeCharts: boolean
      autoFilter: boolean
      includeHeaders: boolean
      includeTotals: boolean
    }
    pdf: {
      enabled: boolean
      orientation: 'portrait' | 'landscape'
      pageSize: 'A4' | 'A3' | 'Letter'
      margins: number
      includeHeaders: boolean
      includeTotals: boolean
    }
    csv: {
      enabled: boolean
      delimiter: string
      encoding: 'UTF-8' | 'ISO-8859-1'
      includeHeaders: boolean
    }
    general: {
      filenameTemplate: string
      compressionLevel: 'none' | 'low' | 'medium' | 'high'
    }
  }
  advanced?: {
    columns: Array<{
      field: string
      alias: string
      format: string
      alignment: string
      bold: boolean
      italic: boolean
      underline: boolean
      color: string
      backgroundColor: string
      width: number
      wrapText: boolean
      numberFormat: string
      dateFormat: string
      currencySymbol: string
      decimalPlaces: number
      showThousandsSeparator: boolean
    }>
    footer: {
      enabled: boolean
      showTotals: boolean
      showSubtotals: boolean
      showCount: boolean
      showAverage: boolean
      showMin: boolean
      showMax: boolean
      customText: string
    }
    display: {
      showGridLines: boolean
      showAlternateRows: boolean
      alternateRowColor: string
      headerStyle: string
      rowHeight: number
      maxRowsPerPage: number
      enablePagination: boolean
    }
    grouping: {
      enabled: boolean
      showGroupHeaders: boolean
      showGroupFooters: boolean
      collapseGroups: boolean
      groupByFields: string[]
    }
    styling: {
      theme: string
      primaryColor: string
      secondaryColor: string
      fontFamily: string
      fontSize: number
    }
    templates?: {
      selected: string
      custom: any[]
    }
    calculatedFields?: Array<{
      id: string
      name: string
      formula: string
      format: string
      description: string
      enabled: boolean
    }>
    conditionalFormats?: Array<{
      id: string
      name: string
      field: string
      conditions: Array<{
        operator: string
        value: string
        color: string
        backgroundColor: string
        bold: boolean
        italic: boolean
      }>
      enabled: boolean
    }>
    interactive?: {
      filters: {
        enabled: boolean
        showFilterBar: boolean
        quickFilters: string[]
        allowCustomFilters: boolean
      }
      actions: {
        enabled: boolean
        allowExport: boolean
        allowPrint: boolean
        allowShare: boolean
        customActions: any[]
      }
      drillDown: {
        enabled: boolean
        levels: any[]
      }
    }
    performance?: {
      enableCache: boolean
      cacheTimeout: number
      enableLazyLoading: boolean
      enableVirtualScrolling: boolean
      maxRowsToRender: number
    }
    security?: {
      enableFieldLevelSecurity: boolean
      hiddenFields: string[]
      restrictedFields: string[]
      enableRowLevelSecurity: boolean
      securityFilters: any[]
    }
  }
  loading?: boolean
  error?: string | null
}

interface Emits {
  (e: 'submit'): void
  (e: 'prev'): void
}

const { t } = useI18n()

const _handleSubmit = () => {
  emit('submit')
}

const _handlePrev = () => {
  emit('prev')
}

// Computed
const selectedDataSource = computed(() => {
  return props.dataSources.find(ds => ds.id === props.basicInfo.dataSourceId)
})

const fieldsCount = computed(() => props.selectedFields.length)
const filtersCount = computed(() => props.filters.length)

const enabledExportFormats = computed(() => {
  const formats = []
  if (props.exportOptions?.excel.enabled)
    formats.push('Excel')
  if (props.exportOptions?.pdf.enabled)
    formats.push('PDF')
  if (props.exportOptions?.csv.enabled)
    formats.push('CSV')

  return formats
})

const isReportReady = computed(() => {
  return props.basicInfo.name
         && props.basicInfo.dataSourceId
         && props.selectedFields.length > 0
})
</script>

<template>
  <div class="report-summary-advanced">
    <!-- Header Section -->
    <VRow>
      <VCol cols="12">
        <div class="d-flex align-center justify-space-between mb-2">
          <h6 class="text-h6 font-weight-medium mb-0">
            {{ $t('DynamicReports.report.wizard.step4.title') }}
          </h6>
          <VChip
            size="small"
            variant="tonal"
            :color="isReportReady ? 'success' : 'warning'"
          >
            <VIcon
              :icon="isReportReady ? 'tabler-check' : 'tabler-alert-triangle'"
              size="16"
              start
            />
            {{ isReportReady ? 'Listo para Guardar' : 'Configuración Incompleta' }}
          </VChip>
        </div>
        <p class="text-body-2 text-medium-emphasis mb-4">
          {{ $t('DynamicReports.report.wizard.step4.description') }}
        </p>
      </VCol>
    </VRow>

    <!-- Success Alert -->
    <VAlert
      v-if="isReportReady"
      type="success"
      variant="tonal"
      class="mb-4"
    >
      <VAlertTitle class="d-flex align-center">
        <VIcon
          icon="tabler-circle-check"
          class="me-2"
        />
        Configuración Completada
      </VAlertTitle>
      <p class="mb-2">
        Tu reporte <strong>"{{ basicInfo.name }}"</strong> está listo para ser guardado.
      </p>
    </VAlert>

    <!-- Report Summary Card -->
    <VCard
      variant="outlined"
      class="mb-4"
    >
      <VCardText>
        <VRow class="align-center">
          <VCol
            cols="12"
            md="8"
          >
            <div class="d-flex align-center mb-3">
              <VAvatar
                color="primary"
                variant="tonal"
                size="48"
                class="me-3"
              >
                <VIcon
                  icon="tabler-file-text"
                  size="24"
                />
              </VAvatar>
              <div>
                <h6 class="text-h6 mb-1">
                  {{ basicInfo.name }}
                </h6>
                <p class="text-body-2 text-medium-emphasis mb-0">
                  {{ selectedDataSource?.name || 'Sin fuente de datos' }}
                </p>
              </div>
            </div>
          </VCol>
          <VCol
            cols="12"
            md="4"
          >
            <div class="d-flex justify-end">
              <VChip
                :color="basicInfo.isActive ? 'success' : 'error'"
                size="small"
                class="me-2"
              >
                {{ basicInfo.isActive ? 'Activo' : 'Inactivo' }}
              </VChip>
              <VChip
                :color="basicInfo.isPublic ? 'info' : 'warning'"
                size="small"
              >
                {{ basicInfo.isPublic ? 'Público' : 'Privado' }}
              </VChip>
            </div>
          </VCol>
        </VRow>

        <!-- Quick Stats -->
        <VDivider class="my-4" />
        <VRow>
          <VCol
            cols="6"
            md="3"
            class="text-center"
          >
            <div class="text-h5 font-weight-bold text-primary">
              {{ fieldsCount }}
            </div>
            <div class="text-caption text-medium-emphasis">
              Campos
            </div>
          </VCol>
          <VCol
            cols="6"
            md="3"
            class="text-center"
          >
            <div class="text-h5 font-weight-bold text-info">
              {{ filtersCount }}
            </div>
            <div class="text-caption text-medium-emphasis">
              Filtros
            </div>
          </VCol>
          <VCol
            cols="6"
            md="3"
            class="text-center"
          >
            <div class="text-h5 font-weight-bold text-success">
              {{ enabledExportFormats.length }}
            </div>
            <div class="text-caption text-medium-emphasis">
              Formatos
            </div>
          </VCol>
          <VCol
            cols="6"
            md="3"
            class="text-center"
          >
            <div class="text-h5 font-weight-bold text-secondary">
              {{ advanced?.templates?.selected || 'Default' }}
            </div>
            <div class="text-caption text-medium-emphasis">
              Plantilla
            </div>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Error Alert -->
    <VAlert
      v-if="error"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      {{ error }}
    </VAlert>

    <!-- Warning for incomplete config -->
    <VAlert
      v-if="!isReportReady"
      type="warning"
      variant="tonal"
      class="mb-4"
    >
      <VAlertTitle class="d-flex align-center">
        <VIcon
          icon="tabler-alert-triangle"
          class="me-2"
        />
        Configuración Incompleta
      </VAlertTitle>
      <p class="mb-0">
        Asegúrate de completar toda la configuración antes de guardar el reporte.
      </p>
    </VAlert>
  </div>
</template>

<style scoped>
.color-preview {
  display: inline-block;
  border: 1px solid #ccc;
  border-radius: 50%;
  block-size: 16px;
  inline-size: 16px;
}
</style>
