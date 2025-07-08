<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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
  }),
  loading: false,
  error: null,
})

const emit = defineEmits<Emits>()

console.log('Montando Paso: ReportSummaryStep')

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
  }
  loading?: boolean
  error?: string | null
}

interface Emits {
  (e: 'submit'): void
  (e: 'prev'): void
}

const { t } = useI18n()

const handleSubmit = () => {
  emit('submit')
}

const handlePrev = () => {
  emit('prev')
}

// Computed
const selectedDataSource = computed(() => {
  return props.dataSources.find(ds => ds.id === props.basicInfo.dataSourceId)
})

const fieldsCount = computed(() => props.selectedFields.length)
const filtersCount = computed(() => props.filters.length)
const activeFiltersCount = computed(() => props.filters.filter(f => f.required).length)

const getFormatIcon = (format: string) => {
  const icons = {
    text: 'tabler-text',
    number: 'tabler-number',
    currency: 'tabler-currency-dollar',
    date: 'tabler-calendar',
    datetime: 'tabler-calendar-time',
  }

  return icons[format] || 'tabler-help'
}

const getFilterIcon = (type: string) => {
  const icons = {
    text: 'tabler-text',
    number: 'tabler-number',
    date: 'tabler-calendar',
    select: 'tabler-list',
    range: 'tabler-arrows-horizontal',
  }

  return icons[type] || 'tabler-help'
}
</script>

<template>
  <div>
    <VRow>
      <VCol cols="12">
        <h6 class="text-h6 font-weight-medium">
          {{ $t('DynamicReports.report.wizard.step4.title') }}
        </h6>
        <p class="mb-0">
          {{ $t('DynamicReports.report.wizard.step4.description') }}
        </p>
      </VCol>

      <!-- Basic Info Summary -->
      <VCol cols="12">
        <VCard variant="outlined">
          <VCardTitle class="text-h6">
            <VIcon
              icon="tabler-info-circle"
              class="me-2"
            />
            {{ $t('DynamicReports.report.summary.basic_info') }}
          </VCardTitle>
          <VCardText>
            <VRow>
              <VCol
                cols="12"
                md="6"
              >
                <div class="d-flex align-center mb-2">
                  <VIcon
                    icon="tabler-file-text"
                    class="me-2"
                    color="primary"
                  />
                  <span class="font-weight-medium">{{ $t('DynamicReports.report.fields.name') }}:</span>
                  <span class="ml-2">{{ basicInfo.name }}</span>
                </div>
              </VCol>

              <VCol
                cols="12"
                md="6"
              >
                <div class="d-flex align-center mb-2">
                  <VIcon
                    icon="tabler-database"
                    class="me-2"
                    color="primary"
                  />
                  <span class="font-weight-medium">{{ $t('DynamicReports.report.fields.dataSource') }}:</span>
                  <span class="ml-2">{{ selectedDataSource?.name || 'N/A' }}</span>
                </div>
              </VCol>

              <VCol cols="12">
                <div class="d-flex align-start mb-2">
                  <VIcon
                    icon="tabler-align-left"
                    class="me-2 mt-1"
                    color="primary"
                  />
                  <div>
                    <span class="font-weight-medium">{{ $t('DynamicReports.report.fields.description') }}:</span>
                    <p class="mb-0 ml-2">
                      {{ basicInfo.description || $t('DynamicReports.report.messages.no_description') }}
                    </p>
                  </div>
                </div>
              </VCol>

              <VCol
                cols="12"
                md="6"
              >
                <div class="d-flex align-center mb-2">
                  <VIcon
                    icon="tabler-toggle-right"
                    class="me-2"
                    :color="basicInfo.isActive ? 'success' : 'error'"
                  />
                  <span class="font-weight-medium">{{ $t('DynamicReports.report.fields.isActive') }}:</span>
                  <VChip
                    :color="basicInfo.isActive ? 'success' : 'error'"
                    size="small"
                    class="ml-2"
                  >
                    {{ basicInfo.isActive ? $t('common.yes') : $t('common.no') }}
                  </VChip>
                </div>
              </VCol>

              <VCol
                cols="12"
                md="6"
              >
                <div class="d-flex align-center mb-2">
                  <VIcon
                    icon="tabler-world"
                    class="me-2"
                    :color="basicInfo.isPublic ? 'info' : 'warning'"
                  />
                  <span class="font-weight-medium">{{ $t('DynamicReports.report.fields.isPublic') }}:</span>
                  <VChip
                    :color="basicInfo.isPublic ? 'info' : 'warning'"
                    size="small"
                    class="ml-2"
                  >
                    {{ basicInfo.isPublic ? $t('common.yes') : $t('common.no') }}
                  </VChip>
                </div>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Fields Summary -->
      <VCol cols="12">
        <VCard variant="outlined">
          <VCardTitle class="text-h6">
            <VIcon
              icon="tabler-columns"
              class="me-2"
            />
            {{ $t('DynamicReports.report.summary.fields') }} ({{ fieldsCount }})
          </VCardTitle>
          <VCardText>
            <div
              v-for="field in selectedFields"
              :key="field.field"
              class="d-flex align-center justify-space-between pa-2 border rounded mb-2"
            >
              <div class="d-flex align-center">
                <VIcon
                  :icon="getFormatIcon(field.format)"
                  class="me-2"
                  color="primary"
                />
                <div>
                  <div class="font-weight-medium">
                    {{ field.alias }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ field.field }}
                  </div>
                </div>
              </div>
              <div class="d-flex align-center">
                <VChip
                  size="small"
                  color="primary"
                  variant="tonal"
                  class="me-2"
                >
                  {{ field.format }}
                </VChip>
                <VChip
                  v-if="field.aggregation"
                  size="small"
                  color="secondary"
                  variant="tonal"
                  class="me-2"
                >
                  {{ field.aggregation }}
                </VChip>
                <VBadge
                  v-if="field.sortable"
                  color="success"
                  dot
                  class="me-1"
                />
                <VBadge
                  v-if="field.filterable"
                  color="info"
                  dot
                />
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Filters Summary -->
      <VCol cols="12">
        <VCard variant="outlined">
          <VCardTitle class="text-h6">
            <VIcon
              icon="tabler-filter"
              class="me-2"
            />
            {{ $t('DynamicReports.report.summary.filters') }} ({{ filtersCount }})
          </VCardTitle>
          <VCardText>
            <div
              v-if="filters.length === 0"
              class="text-center pa-4"
            >
              <VIcon
                icon="tabler-filter-off"
                size="48"
                color="grey"
                class="mb-2"
              />
              <p class="text-medium-emphasis">
                {{ $t('DynamicReports.report.messages.no_filters_configured') }}
              </p>
            </div>
            <div
              v-for="filter in filters"
              v-else
              :key="filter.field"
              class="d-flex align-center justify-space-between pa-2 border rounded mb-2"
            >
              <div class="d-flex align-center">
                <VIcon
                  :icon="getFilterIcon(filter.type)"
                  class="me-2"
                  color="primary"
                />
                <div>
                  <div class="font-weight-medium">
                    {{ filter.placeholder || filter.field }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ filter.field }} - {{ filter.operator }}
                  </div>
                </div>
              </div>
              <div class="d-flex align-center">
                <VChip
                  size="small"
                  color="primary"
                  variant="tonal"
                  class="me-2"
                >
                  {{ filter.type }}
                </VChip>
                <VChip
                  v-if="filter.required"
                  size="small"
                  color="error"
                  variant="tonal"
                >
                  {{ $t('DynamicReports.report.fields.required') }}
                </VChip>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Sorting Summary -->
      <VCol
        v-if="sorting"
        cols="12"
      >
        <VCard variant="outlined">
          <VCardTitle class="text-h6">
            <VIcon
              icon="tabler-sort-ascending"
              class="me-2"
            />
            {{ $t('DynamicReports.report.summary.sorting') }}
          </VCardTitle>
          <VCardText>
            <VRow>
              <VCol
                cols="12"
                md="6"
              >
                <div class="d-flex align-center mb-2">
                  <VIcon
                    icon="tabler-sort-1"
                    class="me-2"
                    color="primary"
                  />
                  <span class="font-weight-medium">{{ $t('DynamicReports.report.sorting.primary_sort') }}:</span>
                  <span class="ml-2">{{ sorting.primary.field }} ({{ sorting.primary.direction }})</span>
                </div>
              </VCol>
              <VCol
                v-if="sorting.secondary"
                cols="12"
                md="6"
              >
                <div class="d-flex align-center mb-2">
                  <VIcon
                    icon="tabler-sort-2"
                    class="me-2"
                    color="secondary"
                  />
                  <span class="font-weight-medium">{{ $t('DynamicReports.report.sorting.secondary_sort') }}:</span>
                  <span class="ml-2">{{ sorting.secondary.field }} ({{ sorting.secondary.direction }})</span>
                </div>
              </VCol>
              <VCol
                v-if="sorting.tertiary"
                cols="12"
                md="6"
              >
                <div class="d-flex align-center mb-2">
                  <VIcon
                    icon="tabler-sort-3"
                    class="me-2"
                    color="info"
                  />
                  <span class="font-weight-medium">{{ $t('DynamicReports.report.sorting.tertiary_sort') }}:</span>
                  <span class="ml-2">{{ sorting.tertiary.field }} ({{ sorting.tertiary.direction }})</span>
                </div>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Export Options Summary -->
      <VCol
        v-if="exportOptions"
        cols="12"
      >
        <VCard variant="outlined">
          <VCardTitle class="text-h6">
            <VIcon
              icon="tabler-download"
              class="me-2"
            />
            {{ $t('DynamicReports.report.summary.export_options') }}
          </VCardTitle>
          <VCardText>
            <VRow>
              <VCol
                v-if="exportOptions.excel.enabled"
                cols="12"
                md="4"
              >
                <div class="d-flex align-center mb-2">
                  <VIcon
                    icon="tabler-file-spreadsheet"
                    class="me-2"
                    color="success"
                  />
                  <span class="font-weight-medium">{{ $t('DynamicReports.report.export.excel.title') }}:</span>
                  <VChip
                    color="success"
                    size="small"
                    class="ml-2"
                  >
                    {{ $t('common.enabled') }}
                  </VChip>
                </div>
              </VCol>
              <VCol
                v-if="exportOptions.pdf.enabled"
                cols="12"
                md="4"
              >
                <div class="d-flex align-center mb-2">
                  <VIcon
                    icon="tabler-file-type-pdf"
                    class="me-2"
                    color="error"
                  />
                  <span class="font-weight-medium">{{ $t('DynamicReports.report.export.pdf.title') }}:</span>
                  <VChip
                    color="error"
                    size="small"
                    class="ml-2"
                  >
                    {{ $t('common.enabled') }}
                  </VChip>
                </div>
              </VCol>
              <VCol
                v-if="exportOptions.csv.enabled"
                cols="12"
                md="4"
              >
                <div class="d-flex align-center mb-2">
                  <VIcon
                    icon="tabler-file-text"
                    class="me-2"
                    color="info"
                  />
                  <span class="font-weight-medium">{{ $t('DynamicReports.report.export.csv.title') }}:</span>
                  <VChip
                    color="info"
                    size="small"
                    class="ml-2"
                  >
                    {{ $t('common.enabled') }}
                  </VChip>
                </div>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Advanced Configuration Summary -->
      <VCol
        v-if="advanced"
        cols="12"
      >
        <VCard variant="outlined">
          <VCardTitle class="text-h6">
            <VIcon
              icon="tabler-settings"
              class="me-2"
            />
            {{ $t('DynamicReports.report.summary.advanced_config') }}
          </VCardTitle>
          <VCardText>
            <VRow>
              <VCol
                cols="12"
                md="6"
              >
                <div class="d-flex align-center mb-2">
                  <VIcon
                    icon="tabler-layout-footer"
                    class="me-2"
                    color="primary"
                  />
                  <span class="font-weight-medium">{{ $t('DynamicReports.report.footer.enabled') }}:</span>
                  <VChip
                    :color="advanced.footer.enabled ? 'success' : 'error'"
                    size="small"
                    class="ml-2"
                  >
                    {{ advanced.footer.enabled ? $t('common.yes') : $t('common.no') }}
                  </VChip>
                </div>
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <div class="d-flex align-center mb-2">
                  <VIcon
                    icon="tabler-group"
                    class="me-2"
                    color="secondary"
                  />
                  <span class="font-weight-medium">{{ $t('DynamicReports.report.grouping.enabled') }}:</span>
                  <VChip
                    :color="advanced.grouping.enabled ? 'success' : 'error'"
                    size="small"
                    class="ml-2"
                  >
                    {{ advanced.grouping.enabled ? $t('common.yes') : $t('common.no') }}
                  </VChip>
                </div>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Statistics -->
      <VCol cols="12">
        <VRow>
          <VCol
            cols="12"
            md="3"
          >
            <VCard
              variant="tonal"
              color="primary"
            >
              <VCardText class="text-center">
                <VIcon
                  icon="tabler-columns"
                  size="32"
                  class="mb-2"
                />
                <div class="text-h4 font-weight-bold">
                  {{ fieldsCount }}
                </div>
                <div class="text-caption">
                  {{ $t('DynamicReports.report.summary.total_fields') }}
                </div>
              </VCardText>
            </VCard>
          </VCol>

          <VCol
            cols="12"
            md="3"
          >
            <VCard
              variant="tonal"
              color="info"
            >
              <VCardText class="text-center">
                <VIcon
                  icon="tabler-filter"
                  size="32"
                  class="mb-2"
                />
                <div class="text-h4 font-weight-bold">
                  {{ filtersCount }}
                </div>
                <div class="text-caption">
                  {{ $t('DynamicReports.report.summary.total_filters') }}
                </div>
              </VCardText>
            </VCard>
          </VCol>

          <VCol
            cols="12"
            md="3"
          >
            <VCard
              variant="tonal"
              color="warning"
            >
              <VCardText class="text-center">
                <VIcon
                  icon="tabler-alert-circle"
                  size="32"
                  class="mb-2"
                />
                <div class="text-h4 font-weight-bold">
                  {{ activeFiltersCount }}
                </div>
                <div class="text-caption">
                  {{ $t('DynamicReports.report.summary.required_filters') }}
                </div>
              </VCardText>
            </VCard>
          </VCol>

          <VCol
            cols="12"
            md="3"
          >
            <VCard
              variant="tonal"
              color="success"
            >
              <VCardText class="text-center">
                <VIcon
                  icon="tabler-download"
                  size="32"
                  class="mb-2"
                />
                <div class="text-h4 font-weight-bold">
                  {{ (exportOptions?.excel.enabled ? 1 : 0) + (exportOptions?.pdf.enabled ? 1 : 0) + (exportOptions?.csv.enabled ? 1 : 0) }}
                </div>
                <div class="text-caption">
                  {{ $t('DynamicReports.report.summary.export_formats') }}
                </div>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
      </VCol>
    </VRow>

    <VAlert
      v-if="error"
      type="error"
      variant="tonal"
      class="mt-4"
    >
      {{ error }}
    </VAlert>
  </div>
</template>
