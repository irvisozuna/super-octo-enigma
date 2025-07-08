<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({
    columns: [],
    footer: { enabled: true, showTotals: true, showSubtotals: false, showCount: true, showAverage: false, showMin: false, showMax: false, customText: '' },
    display: { showGridLines: true, showAlternateRows: true, alternateRowColor: '#f5f5f5', headerStyle: 'default', rowHeight: 40, maxRowsPerPage: 50, enablePagination: true },
    grouping: { enabled: false, showGroupHeaders: true, showGroupFooters: true, collapseGroups: false, groupByFields: [] },
    styling: { theme: 'default', primaryColor: '#1976d2', secondaryColor: '#424242', fontFamily: 'Arial', fontSize: 12 },
  }),
  availableFields: () => [],
  loading: false,
  error: null,
})

const emit = defineEmits<Emits>()

console.log('Montando Paso: ReportAdvancedStep')

interface ColumnFormat {
  field: string
  alias: string
  format: 'text' | 'number' | 'currency' | 'date' | 'datetime' | 'percentage' | 'boolean'
  alignment: 'left' | 'center' | 'right'
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
}

interface AdvancedConfig {
  columns: ColumnFormat[]
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
    headerStyle: 'default' | 'bold' | 'colored'
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
    theme: 'default' | 'dark' | 'light' | 'custom'
    primaryColor: string
    secondaryColor: string
    fontFamily: string
    fontSize: number
  }
}

interface Props {
  modelValue: AdvancedConfig
  availableFields: Array<{
    field: string
    alias: string
    format: string
  }>
  loading?: boolean
  error?: string | null
}

interface Emits {
  (e: 'update:modelValue', value: AdvancedConfig): void
  (e: 'next'): void
  (e: 'prev'): void
  (e: 'validate', isValid: boolean): void
}

const { t } = useI18n()

// Validation schema
const schema = toTypedSchema(z.object({
  columns: z.array(z.object({
    field: z.string(),
    alias: z.string(),
    format: z.enum(['text', 'number', 'currency', 'date', 'datetime', 'percentage', 'boolean']),
    alignment: z.enum(['left', 'center', 'right']),
    bold: z.boolean(),
    italic: z.boolean(),
    underline: z.boolean(),
    color: z.string(),
    backgroundColor: z.string(),
    width: z.number().min(50).max(500),
    wrapText: z.boolean(),
    numberFormat: z.string(),
    dateFormat: z.string(),
    currencySymbol: z.string(),
    decimalPlaces: z.number().min(0).max(10),
    showThousandsSeparator: z.boolean(),
  })),
  footer: z.object({
    enabled: z.boolean(),
    showTotals: z.boolean(),
    showSubtotals: z.boolean(),
    showCount: z.boolean(),
    showAverage: z.boolean(),
    showMin: z.boolean(),
    showMax: z.boolean(),
    customText: z.string(),
  }),
  display: z.object({
    showGridLines: z.boolean(),
    showAlternateRows: z.boolean(),
    alternateRowColor: z.string(),
    headerStyle: z.enum(['default', 'bold', 'colored']),
    rowHeight: z.number().min(20).max(100),
    maxRowsPerPage: z.number().min(10).max(1000),
    enablePagination: z.boolean(),
  }),
  grouping: z.object({
    enabled: z.boolean(),
    showGroupHeaders: z.boolean(),
    showGroupFooters: z.boolean(),
    collapseGroups: z.boolean(),
    groupByFields: z.array(z.string()),
  }),
  styling: z.object({
    theme: z.enum(['default', 'dark', 'light', 'custom']),
    primaryColor: z.string(),
    secondaryColor: z.string(),
    fontFamily: z.string(),
    fontSize: z.number().min(8).max(24),
  }),
}))

const { handleSubmit, errors, values, setFieldValue } = useForm({
  validationSchema: schema,
  initialValues: props.modelValue,
})

// Watch for changes and emit updates
watch(values, newValues => {
  emit('update:modelValue', newValues)
}, { deep: true })

// Validate step
const validateStep = () => {
  emit('validate', true)

  return true
}

const handleNext = () => {
  if (validateStep())
    emit('next')
}

const handlePrev = () => {
  emit('prev')
}

// Computed
const formatOptions = [
  { title: t('DynamicReports.report.format.text'), value: 'text' },
  { title: t('DynamicReports.report.format.number'), value: 'number' },
  { title: t('DynamicReports.report.format.currency'), value: 'currency' },
  { title: t('DynamicReports.report.format.date'), value: 'date' },
  { title: t('DynamicReports.report.format.datetime'), value: 'datetime' },
  { title: t('DynamicReports.report.format.percentage'), value: 'percentage' },
  { title: t('DynamicReports.report.format.boolean'), value: 'boolean' },
]

const alignmentOptions = [
  { title: t('DynamicReports.report.alignment.left'), value: 'left' },
  { title: t('DynamicReports.report.alignment.center'), value: 'center' },
  { title: t('DynamicReports.report.alignment.right'), value: 'right' },
]

const headerStyleOptions = [
  { title: t('DynamicReports.report.header_style.default'), value: 'default' },
  { title: t('DynamicReports.report.header_style.bold'), value: 'bold' },
  { title: t('DynamicReports.report.header_style.colored'), value: 'colored' },
]

const themeOptions = [
  { title: t('DynamicReports.report.theme.default'), value: 'default' },
  { title: t('DynamicReports.report.theme.dark'), value: 'dark' },
  { title: t('DynamicReports.report.theme.light'), value: 'light' },
  { title: t('DynamicReports.report.theme.custom'), value: 'custom' },
]

const fontFamilyOptions = [
  { title: 'Arial', value: 'Arial' },
  { title: 'Helvetica', value: 'Helvetica' },
  { title: 'Times New Roman', value: 'Times New Roman' },
  { title: 'Courier New', value: 'Courier New' },
  { title: 'Verdana', value: 'Verdana' },
]

const colorOptions = [
  { title: t('DynamicReports.report.colors.default'), value: '#000000' },
  { title: t('DynamicReports.report.colors.primary'), value: '#1976d2' },
  { title: t('DynamicReports.report.colors.secondary'), value: '#424242' },
  { title: t('DynamicReports.report.colors.success'), value: '#4caf50' },
  { title: t('DynamicReports.report.colors.warning'), value: '#ff9800' },
  { title: t('DynamicReports.report.colors.error'), value: '#f44336' },
]

// Methods
const updateColumnFormat = (index: number, field: Partial<ColumnFormat>) => {
  const updatedColumns = [...values.value.columns]

  updatedColumns[index] = { ...updatedColumns[index], ...field }
  setFieldValue('columns', updatedColumns)
}

const addGroupByField = (field: string) => {
  const updatedFields = [...values.value.grouping.groupByFields, field]

  setFieldValue('grouping.groupByFields', updatedFields)
}

const removeGroupByField = (field: string) => {
  const updatedFields = values.value.grouping.groupByFields.filter(f => f !== field)

  setFieldValue('grouping.groupByFields', updatedFields)
}
</script>

<template>
  <div>
    <VRow>
      <VCol cols="12">
        <h6 class="text-h6 font-weight-medium">
          {{ $t('DynamicReports.report.wizard.step6.title') }}
        </h6>
        <p class="mb-0">
          {{ $t('DynamicReports.report.wizard.step6.description') }}
        </p>
      </VCol>

      <!-- Formato de Columnas -->
      <VCol cols="12">
        <VCard variant="outlined">
          <VCardTitle class="text-h6">
            <VIcon
              icon="tabler-columns"
              class="me-2"
            />
            {{ $t('DynamicReports.report.advanced.column_formatting') }}
          </VCardTitle>
          <VCardText>
            <div
              v-for="(column, index) in values.columns"
              :key="column.field"
              class="mb-4 pa-4 border rounded"
            >
              <VRow>
                <VCol
                  cols="12"
                  md="3"
                >
                  <div class="text-subtitle-2 font-weight-medium mb-2">
                    {{ column.alias }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ column.field }}
                  </div>
                </VCol>

                <VCol
                  cols="12"
                  md="3"
                >
                  <AppSelect
                    :model-value="column.format"
                    :label="$t('DynamicReports.report.format.title')"
                    :items="formatOptions"
                    @update:model-value="val => updateColumnFormat(index, { format: val })"
                  />
                </VCol>

                <VCol
                  cols="12"
                  md="3"
                >
                  <AppSelect
                    :model-value="column.alignment"
                    :label="$t('DynamicReports.report.alignment.title')"
                    :items="alignmentOptions"
                    @update:model-value="val => updateColumnFormat(index, { alignment: val })"
                  />
                </VCol>

                <VCol
                  cols="12"
                  md="3"
                >
                  <AppTextField
                    :model-value="column.width"
                    :label="$t('DynamicReports.report.width')"
                    type="number"
                    min="50"
                    max="500"
                    suffix="px"
                    @update:model-value="val => updateColumnFormat(index, { width: parseInt(val) })"
                  />
                </VCol>

                <!-- Estilos de Texto -->
                <VCol
                  cols="12"
                  md="4"
                >
                  <div class="d-flex gap-2">
                    <VSwitch
                      :model-value="column.bold"
                      :label="$t('DynamicReports.report.style.bold')"
                      color="primary"
                      density="compact"
                      @update:model-value="val => updateColumnFormat(index, { bold: val })"
                    />
                    <VSwitch
                      :model-value="column.italic"
                      :label="$t('DynamicReports.report.style.italic')"
                      color="primary"
                      density="compact"
                      @update:model-value="val => updateColumnFormat(index, { italic: val })"
                    />
                    <VSwitch
                      :model-value="column.underline"
                      :label="$t('DynamicReports.report.style.underline')"
                      color="primary"
                      density="compact"
                      @update:model-value="val => updateColumnFormat(index, { underline: val })"
                    />
                  </div>
                </VCol>

                <!-- Colores -->
                <VCol
                  cols="12"
                  md="4"
                >
                  <AppSelect
                    :model-value="column.color"
                    :label="$t('DynamicReports.report.color.text')"
                    :items="colorOptions"
                    @update:model-value="val => updateColumnFormat(index, { color: val })"
                  />
                </VCol>

                <VCol
                  cols="12"
                  md="4"
                >
                  <AppSelect
                    :model-value="column.backgroundColor"
                    :label="$t('DynamicReports.report.color.background')"
                    :items="colorOptions"
                    @update:model-value="val => updateColumnFormat(index, { backgroundColor: val })"
                  />
                </VCol>

                <!-- Configuración específica por formato -->
                <VCol
                  v-if="column.format === 'number' || column.format === 'currency'"
                  cols="12"
                  md="6"
                >
                  <AppTextField
                    :model-value="column.decimalPlaces"
                    :label="$t('DynamicReports.report.format.decimal_places')"
                    type="number"
                    min="0"
                    max="10"
                    @update:model-value="val => updateColumnFormat(index, { decimalPlaces: parseInt(val) })"
                  />
                </VCol>

                <VCol
                  v-if="column.format === 'currency'"
                  cols="12"
                  md="6"
                >
                  <AppTextField
                    :model-value="column.currencySymbol"
                    :label="$t('DynamicReports.report.format.currency_symbol')"
                    placeholder="$"
                    @update:model-value="val => updateColumnFormat(index, { currencySymbol: val })"
                  />
                </VCol>

                <VCol
                  v-if="column.format === 'date' || column.format === 'datetime'"
                  cols="12"
                  md="6"
                >
                  <AppTextField
                    :model-value="column.dateFormat"
                    :label="$t('DynamicReports.report.format.date_format')"
                    placeholder="YYYY-MM-DD"
                    @update:model-value="val => updateColumnFormat(index, { dateFormat: val })"
                  />
                </VCol>
              </VRow>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Configuración del Footer -->
      <VCol cols="12">
        <VCard variant="outlined">
          <VCardTitle class="text-h6">
            <VIcon
              icon="tabler-layout-footer"
              class="me-2"
            />
            {{ $t('DynamicReports.report.advanced.footer_settings') }}
          </VCardTitle>
          <VCardText>
            <VRow>
              <VCol
                cols="12"
                md="6"
              >
                <VSwitch
                  :model-value="values.footer.enabled"
                  :label="$t('DynamicReports.report.footer.enabled')"
                  color="primary"
                  @update:model-value="val => setFieldValue('footer.enabled', val)"
                />
              </VCol>

              <VCol
                v-if="values.footer.enabled"
                cols="12"
              >
                <VRow>
                  <VCol
                    cols="12"
                    md="3"
                  >
                    <VSwitch
                      :model-value="values.footer.showTotals"
                      :label="$t('DynamicReports.report.footer.show_totals')"
                      color="primary"
                      @update:model-value="val => setFieldValue('footer.showTotals', val)"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="3"
                  >
                    <VSwitch
                      :model-value="values.footer.showSubtotals"
                      :label="$t('DynamicReports.report.footer.show_subtotals')"
                      color="primary"
                      @update:model-value="val => setFieldValue('footer.showSubtotals', val)"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="3"
                  >
                    <VSwitch
                      :model-value="values.footer.showCount"
                      :label="$t('DynamicReports.report.footer.show_count')"
                      color="primary"
                      @update:model-value="val => setFieldValue('footer.showCount', val)"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="3"
                  >
                    <VSwitch
                      :model-value="values.footer.showAverage"
                      :label="$t('DynamicReports.report.footer.show_average')"
                      color="primary"
                      @update:model-value="val => setFieldValue('footer.showAverage', val)"
                    />
                  </VCol>
                </VRow>
              </VCol>

              <VCol
                v-if="values.footer.enabled"
                cols="12"
              >
                <AppTextField
                  :model-value="values.footer.customText"
                  :label="$t('DynamicReports.report.footer.custom_text')"
                  :placeholder="$t('DynamicReports.report.footer.custom_text_placeholder')"
                  type="textarea"
                  rows="2"
                  @update:model-value="val => setFieldValue('footer.customText', val)"
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Configuración de Visualización -->
      <VCol cols="12">
        <VCard variant="outlined">
          <VCardTitle class="text-h6">
            <VIcon
              icon="tabler-eye"
              class="me-2"
            />
            {{ $t('DynamicReports.report.advanced.display_settings') }}
          </VCardTitle>
          <VCardText>
            <VRow>
              <VCol
                cols="12"
                md="6"
              >
                <VSwitch
                  :model-value="values.display.showGridLines"
                  :label="$t('DynamicReports.report.display.show_grid_lines')"
                  color="primary"
                  @update:model-value="val => setFieldValue('display.showGridLines', val)"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <VSwitch
                  :model-value="values.display.showAlternateRows"
                  :label="$t('DynamicReports.report.display.show_alternate_rows')"
                  color="primary"
                  @update:model-value="val => setFieldValue('display.showAlternateRows', val)"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <AppSelect
                  :model-value="values.display.headerStyle"
                  :label="$t('DynamicReports.report.display.header_style')"
                  :items="headerStyleOptions"
                  @update:model-value="val => setFieldValue('display.headerStyle', val)"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  :model-value="values.display.rowHeight"
                  :label="$t('DynamicReports.report.display.row_height')"
                  type="number"
                  min="20"
                  max="100"
                  suffix="px"
                  @update:model-value="val => setFieldValue('display.rowHeight', parseInt(val))"
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Configuración de Agrupación -->
      <VCol cols="12">
        <VCard variant="outlined">
          <VCardTitle class="text-h6">
            <VIcon
              icon="tabler-group"
              class="me-2"
            />
            {{ $t('DynamicReports.report.advanced.grouping_settings') }}
          </VCardTitle>
          <VCardText>
            <VRow>
              <VCol
                cols="12"
                md="6"
              >
                <VSwitch
                  :model-value="values.grouping.enabled"
                  :label="$t('DynamicReports.report.grouping.enabled')"
                  color="primary"
                  @update:model-value="val => setFieldValue('grouping.enabled', val)"
                />
              </VCol>
              <VCol
                v-if="values.grouping.enabled"
                cols="12"
              >
                <VRow>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VSwitch
                      :model-value="values.grouping.showGroupHeaders"
                      :label="$t('DynamicReports.report.grouping.show_headers')"
                      color="primary"
                      @update:model-value="val => setFieldValue('grouping.showGroupHeaders', val)"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VSwitch
                      :model-value="values.grouping.showGroupFooters"
                      :label="$t('DynamicReports.report.grouping.show_footers')"
                      color="primary"
                      @update:model-value="val => setFieldValue('grouping.showGroupFooters', val)"
                    />
                  </VCol>
                </VRow>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Configuración de Estilos -->
      <VCol cols="12">
        <VCard variant="outlined">
          <VCardTitle class="text-h6">
            <VIcon
              icon="tabler-palette"
              class="me-2"
            />
            {{ $t('DynamicReports.report.advanced.styling_settings') }}
          </VCardTitle>
          <VCardText>
            <VRow>
              <VCol
                cols="12"
                md="6"
              >
                <AppSelect
                  :model-value="values.styling.theme"
                  :label="$t('DynamicReports.report.styling.theme')"
                  :items="themeOptions"
                  @update:model-value="val => setFieldValue('styling.theme', val)"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <AppSelect
                  :model-value="values.styling.fontFamily"
                  :label="$t('DynamicReports.report.styling.font_family')"
                  :items="fontFamilyOptions"
                  @update:model-value="val => setFieldValue('styling.fontFamily', val)"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  :model-value="values.styling.fontSize"
                  :label="$t('DynamicReports.report.styling.font_size')"
                  type="number"
                  min="8"
                  max="24"
                  suffix="px"
                  @update:model-value="val => setFieldValue('styling.fontSize', parseInt(val))"
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
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
