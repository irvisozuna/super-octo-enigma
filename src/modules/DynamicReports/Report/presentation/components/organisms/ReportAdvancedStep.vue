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
  availableFields: () => [],
  loading: false,
  error: null,
})

const emit = defineEmits<Emits>()

console.log('Montando Paso: ReportAdvancedStep')

// Estado para tabs y diálogos
const activeTab = ref('templates')
const showTemplateDialog = ref(false)
const showCalculatedFieldDialog = ref(false)
const showConditionalFormatDialog = ref(false)
const editingTemplate = ref<any>(null)
const editingCalculatedField = ref<any>(null)
const editingConditionalFormat = ref<any>(null)
const isUpdatingFromProps = ref(false)

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

interface CalculatedField {
  id: string
  name: string
  formula: string
  format: 'number' | 'currency' | 'percentage' | 'text'
  description: string
  enabled: boolean
}

interface ConditionalFormat {
  id: string
  name: string
  field: string
  conditions: Array<{
    operator: '>' | '<' | '>=' | '<=' | '==' | '!=' | 'contains' | 'startsWith' | 'endsWith'
    value: string
    color: string
    backgroundColor: string
    bold: boolean
    italic: boolean
  }>
  enabled: boolean
}

interface ReportTemplate {
  id: string
  name: string
  description: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    surface: string
  }
  fonts: {
    header: string
    body: string
    caption: string
  }
  layout: {
    headerHeight: number
    footerHeight: number
    margins: { top: number; right: number; bottom: number; left: number }
  }
  logo?: {
    url: string
    width: number
    height: number
    position: 'left' | 'center' | 'right'
  }
  watermark?: {
    text: string
    opacity: number
    rotation: number
    position: 'center' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'
  }
}

interface InteractiveConfig {
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
    customActions: Array<{
      name: string
      icon: string
      url: string
      target: '_blank' | '_self'
    }>
  }
  drillDown: {
    enabled: boolean
    levels: Array<{
      field: string
      label: string
      targetReport?: string
    }>
  }
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

  // Nuevas configuraciones avanzadas
  templates: {
    selected: string
    custom: ReportTemplate[]
  }
  calculatedFields: CalculatedField[]
  conditionalFormats: ConditionalFormat[]
  interactive: InteractiveConfig
  performance: {
    enableCache: boolean
    cacheTimeout: number
    enableLazyLoading: boolean
    enableVirtualScrolling: boolean
    maxRowsToRender: number
  }
  security: {
    enableFieldLevelSecurity: boolean
    hiddenFields: string[]
    restrictedFields: string[]
    enableRowLevelSecurity: boolean
    securityFilters: Array<{
      field: string
      operator: string
      value: string
      userRole: string
    }>
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
  templates: z.object({
    selected: z.string(),
    custom: z.array(z.any()),
  }).optional(),
  calculatedFields: z.array(z.any()).optional(),
  conditionalFormats: z.array(z.any()).optional(),
  interactive: z.object({
    filters: z.object({
      enabled: z.boolean(),
      showFilterBar: z.boolean(),
      quickFilters: z.array(z.string()),
      allowCustomFilters: z.boolean(),
    }),
    actions: z.object({
      enabled: z.boolean(),
      allowExport: z.boolean(),
      allowPrint: z.boolean(),
      allowShare: z.boolean(),
      customActions: z.array(z.any()),
    }),
    drillDown: z.object({
      enabled: z.boolean(),
      levels: z.array(z.any()),
    }),
  }).optional(),
  performance: z.object({
    enableCache: z.boolean(),
    cacheTimeout: z.number(),
    enableLazyLoading: z.boolean(),
    enableVirtualScrolling: z.boolean(),
    maxRowsToRender: z.number(),
  }).optional(),
  security: z.object({
    enableFieldLevelSecurity: z.boolean(),
    hiddenFields: z.array(z.string()),
    restrictedFields: z.array(z.string()),
    enableRowLevelSecurity: z.boolean(),
    securityFilters: z.array(z.any()),
  }).optional(),
}))

const { handleSubmit, errors, values, setFieldValue } = useForm({
  validationSchema: schema,
  initialValues: props.modelValue,
})

// Use computed properties for safe access to form values
const safeValues = computed(() => ({
  columns: values.columns || [],
  footer: values.footer || props.modelValue.footer,
  display: values.display || props.modelValue.display,
  grouping: values.grouping || props.modelValue.grouping,
  styling: values.styling || props.modelValue.styling,
  templates: values.templates || props.modelValue.templates || { selected: 'default', custom: [] },
  calculatedFields: values.calculatedFields || props.modelValue.calculatedFields || [],
  conditionalFormats: values.conditionalFormats || props.modelValue.conditionalFormats || [],
  interactive: values.interactive || props.modelValue.interactive || {
    filters: { enabled: true, showFilterBar: true, quickFilters: [], allowCustomFilters: true },
    actions: { enabled: true, allowExport: true, allowPrint: true, allowShare: true, customActions: [] },
    drillDown: { enabled: false, levels: [] },
  },
  performance: values.performance || props.modelValue.performance || {
    enableCache: true,
    cacheTimeout: 300,
    enableLazyLoading: true,
    enableVirtualScrolling: false,
    maxRowsToRender: 1000,
  },
  security: values.security || props.modelValue.security || {
    enableFieldLevelSecurity: false,
    hiddenFields: [],
    restrictedFields: [],
    enableRowLevelSecurity: false,
    securityFilters: [],
  },
}))

// Watch for changes and emit updates
watch(() => safeValues.value, newValues => {
  emit('update:modelValue', newValues as AdvancedConfig)
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

// Computed options
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
  const updatedColumns = [...safeValues.value.columns]

  updatedColumns[index] = { ...updatedColumns[index], ...field }
  setFieldValue('columns', updatedColumns)
}

const addGroupByField = (field: string) => {
  const updatedFields = [...safeValues.value.grouping.groupByFields, field]

  setFieldValue('grouping.groupByFields', updatedFields)
}

const removeGroupByField = (field: string) => {
  const updatedFields = safeValues.value.grouping.groupByFields.filter((f: string) => f !== field)

  setFieldValue('grouping.groupByFields', updatedFields)
}

// Helper methods for safe field updates
const updateFooterField = (field: string, value: any) => {
  setFieldValue(`footer.${field}`, value)
}

const updateDisplayField = (field: string, value: any) => {
  setFieldValue(`display.${field}`, value)
}

const updateGroupingField = (field: string, value: any) => {
  setFieldValue(`grouping.${field}`, value)
}

const updateStylingField = (field: string, value: any) => {
  setFieldValue(`styling.${field}`, value)
}

// Plantillas predefinidas
const predefinedTemplates: ReportTemplate[] = [
  {
    id: 'default',
    name: 'Predeterminado',
    description: 'Plantilla básica con diseño limpio',
    colors: {
      primary: '#1976d2',
      secondary: '#424242',
      accent: '#4caf50',
      background: '#ffffff',
      surface: '#f5f5f5',
    },
    fonts: {
      header: 'Arial',
      body: 'Arial',
      caption: 'Arial',
    },
    layout: {
      headerHeight: 60,
      footerHeight: 40,
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
    },
  },
  {
    id: 'corporate',
    name: 'Corporativo',
    description: 'Diseño profesional para empresas',
    colors: {
      primary: '#2c3e50',
      secondary: '#34495e',
      accent: '#3498db',
      background: '#ffffff',
      surface: '#ecf0f1',
    },
    fonts: {
      header: 'Times New Roman',
      body: 'Arial',
      caption: 'Arial',
    },
    layout: {
      headerHeight: 80,
      footerHeight: 50,
      margins: { top: 25, right: 25, bottom: 25, left: 25 },
    },
  },
  {
    id: 'modern',
    name: 'Moderno',
    description: 'Diseño contemporáneo con colores vibrantes',
    colors: {
      primary: '#9c27b0',
      secondary: '#673ab7',
      accent: '#ff5722',
      background: '#fafafa',
      surface: '#f3e5f5',
    },
    fonts: {
      header: 'Helvetica',
      body: 'Helvetica',
      caption: 'Helvetica',
    },
    layout: {
      headerHeight: 70,
      footerHeight: 45,
      margins: { top: 15, right: 15, bottom: 15, left: 15 },
    },
  },
]

// Métodos para manejar plantillas
const applyTemplate = (templateId: string) => {
  const template = predefinedTemplates.find(t => t.id === templateId)
  if (template) {
    setFieldValue('templates.selected', templateId)
    setFieldValue('styling.theme', 'custom')
    setFieldValue('styling.primaryColor', template.colors.primary)
    setFieldValue('styling.secondaryColor', template.colors.secondary)
    setFieldValue('styling.fontFamily', template.fonts.header)
  }
}

// Métodos para campos calculados
const addCalculatedField = () => {
  const newField: CalculatedField = {
    id: `calc_${Date.now()}`,
    name: 'Nuevo Campo Calculado',
    formula: '',
    format: 'number',
    description: '',
    enabled: true,
  }

  editingCalculatedField.value = newField
  showCalculatedFieldDialog.value = true
}

const saveCalculatedField = () => {
  if (editingCalculatedField.value) {
    // Validar que tenga nombre y fórmula
    if (!editingCalculatedField.value.name || !editingCalculatedField.value.formula)
      return

    const fields = [...safeCalculatedFields.value]
    const existingIndex = fields.findIndex(f => f.id === editingCalculatedField.value!.id)

    if (existingIndex >= 0) {
      // Editar existente
      fields[existingIndex] = { ...editingCalculatedField.value }
    }
    else {
      // Agregar nuevo
      fields.push({ ...editingCalculatedField.value })
    }

    setFieldValue('calculatedFields', fields)
  }
  showCalculatedFieldDialog.value = false
  editingCalculatedField.value = null
}

const removeCalculatedField = (id: string) => {
  const fields = safeCalculatedFields.value.filter(f => f.id !== id)

  setFieldValue('calculatedFields', fields)
}

// Función para agregar campo a la fórmula
const addFieldToFormula = (fieldName: string) => {
  if (editingCalculatedField.value) {
    const currentFormula = editingCalculatedField.value.formula || ''
    const newFormula = `${currentFormula + (currentFormula ? ' + ' : '')}[${fieldName}]`

    editingCalculatedField.value.formula = newFormula
  }
}

// Función para editar campo calculado existente
const editCalculatedField = (field: CalculatedField) => {
  editingCalculatedField.value = { ...field }
  showCalculatedFieldDialog.value = true
}

// Métodos para formato condicional
const addConditionalFormat = () => {
  const newFormat: ConditionalFormat = {
    id: `cond_${Date.now()}`,
    name: 'Nuevo Formato Condicional',
    field: '',
    conditions: [{
      operator: '>',
      value: '',
      color: '#000000',
      backgroundColor: '#ffffff',
      bold: false,
      italic: false,
    }],
    enabled: true,
  }

  editingConditionalFormat.value = newFormat
  showConditionalFormatDialog.value = true
}

const saveConditionalFormat = () => {
  if (editingConditionalFormat.value) {
    // Validar que tenga nombre, campo y al menos una condición
    if (!editingConditionalFormat.value.name || !editingConditionalFormat.value.field || !editingConditionalFormat.value.conditions.length)
      return

    const formats = [...safeConditionalFormats.value]
    const existingIndex = formats.findIndex(f => f.id === editingConditionalFormat.value!.id)

    if (existingIndex >= 0) {
      // Editar existente
      formats[existingIndex] = { ...editingConditionalFormat.value }
    }
    else {
      // Agregar nuevo
      formats.push({ ...editingConditionalFormat.value })
    }

    setFieldValue('conditionalFormats', formats)
  }
  showConditionalFormatDialog.value = false
  editingConditionalFormat.value = null
}

const removeConditionalFormat = (id: string) => {
  const formats = safeConditionalFormats.value.filter(f => f.id !== id)

  setFieldValue('conditionalFormats', formats)
}

// Función para agregar condición
const addCondition = () => {
  if (editingConditionalFormat.value) {
    editingConditionalFormat.value.conditions.push({
      operator: '>',
      value: '',
      color: '#000000',
      backgroundColor: '#ffffff',
      bold: false,
      italic: false,
    })
  }
}

// Función para eliminar condición
const removeCondition = (index: number) => {
  if (editingConditionalFormat.value)
    editingConditionalFormat.value.conditions.splice(index, 1)
}

// Función para editar formato condicional existente
const editConditionalFormat = (format: ConditionalFormat) => {
  editingConditionalFormat.value = { ...format }
  showConditionalFormatDialog.value = true
}

// Métodos para configuración interactiva
const updateInteractiveField = (section: string, field: string, value: any) => {
  setFieldValue(`interactive.${section}.${field}`, value)
}

// Métodos para configuración de rendimiento
const updatePerformanceField = (field: string, value: any) => {
  setFieldValue(`performance.${field}`, value)
}

// Métodos para configuración de seguridad
const updateSecurityField = (field: string, value: any) => {
  setFieldValue(`security.${field}`, value)
}

// Computed properties para las nuevas secciones
const safeInteractive = computed(() => safeValues.value.interactive)
const safePerformance = computed(() => safeValues.value.performance)
const safeSecurity = computed(() => safeValues.value.security)
const safeTemplates = computed(() => safeValues.value.templates)
const safeCalculatedFields = computed(() => safeValues.value.calculatedFields)
const safeConditionalFormats = computed(() => safeValues.value.conditionalFormats)

// Función de inicialización
const initializeAdvancedConfig = () => {
  // Asegurar que todas las propiedades nuevas estén inicializadas
  const currentValues = { ...props.modelValue }

  if (!currentValues.templates)
    setFieldValue('templates', { selected: 'default', custom: [] })

  if (!currentValues.calculatedFields)
    setFieldValue('calculatedFields', [])

  if (!currentValues.conditionalFormats)
    setFieldValue('conditionalFormats', [])

  if (!currentValues.interactive) {
    setFieldValue('interactive', {
      filters: { enabled: true, showFilterBar: true, quickFilters: [], allowCustomFilters: true },
      actions: { enabled: true, allowExport: true, allowPrint: true, allowShare: true, customActions: [] },
      drillDown: { enabled: false, levels: [] },
    })
  }

  if (!currentValues.performance) {
    setFieldValue('performance', {
      enableCache: true,
      cacheTimeout: 300,
      enableLazyLoading: true,
      enableVirtualScrolling: false,
      maxRowsToRender: 1000,
    })
  }

  if (!currentValues.security) {
    setFieldValue('security', {
      enableFieldLevelSecurity: false,
      hiddenFields: [],
      restrictedFields: [],
      enableRowLevelSecurity: false,
      securityFilters: [],
    })
  }
}

// Ejecutar inicialización al montar el componente
onMounted(() => {
  initializeAdvancedConfig()
})
</script>

<template>
  <div class="report-advanced-config">
    <VRow>
      <VCol cols="12">
        <div class="d-flex align-center justify-space-between mb-2">
          <h6 class="text-h6 font-weight-medium mb-0">
            {{ $t('DynamicReports.report.wizard.step6.title') }}
          </h6>
          <VChip
            color="primary"
            size="small"
            variant="tonal"
          >
            <VIcon
              icon="tabler-settings"
              size="16"
              start
            />
            Configuración Avanzada
          </VChip>
        </div>
        <p class="text-body-2 text-medium-emphasis mb-4">
          {{ $t('DynamicReports.report.wizard.step6.description') }}
        </p>
      </VCol>
    </VRow>

    <!-- Tabs principales -->
    <VTabs
      v-model="activeTab"
      class="mb-4"
    >
      <!--
        <VTab value="templates">
        <VIcon
        icon="tabler-palette"
        start
        />
        Plantillas
        </VTab>
      -->
      <VTab value="calculated">
        <VIcon
          icon="tabler-calculator"
          start
        />
        Campos Calculados
      </VTab>
      <VTab value="conditional">
        <VIcon
          icon="tabler-color-filter"
          start
        />
        Formato Condicional
      </VTab>
      <VTab value="interactive">
        <VIcon
          icon="tabler-click"
          start
        />
        Interactividad
      </VTab>
      <VTab value="performance">
        <VIcon
          icon="tabler-brand-speedtest"
          start
        />
        Rendimiento
      </VTab>
      <VTab value="security">
        <VIcon
          icon="tabler-shield"
          start
        />
        Seguridad
      </VTab>
    </VTabs>

    <VWindow v-model="activeTab">
      <!-- Tab Plantillas -->
      <VWindowItem value="templates">
        <VRow>
          <VCol cols="12">
            <VCard variant="outlined">
              <VCardTitle class="d-flex align-center justify-space-between pa-4">
                <div class="d-flex align-center">
                  <VIcon
                    icon="tabler-palette"
                    class="me-2"
                  />
                  <span>Plantillas de Diseño</span>
                </div>
              </VCardTitle>
              <VCardText>
                <VRow>
                  <VCol
                    v-for="template in predefinedTemplates"
                    :key="template.id"
                    cols="12"
                    md="4"
                  >
                    <VCard
                      variant="outlined"
                      :class="{ 'border-primary': safeTemplates.selected === template.id }"
                      class="template-card cursor-pointer"
                      @click="applyTemplate(template.id)"
                    >
                      <VCardText class="pa-4">
                        <div class="d-flex align-center justify-space-between mb-3">
                          <div class="d-flex align-center">
                            <div
                              class="color-preview me-2"
                              :style="{ backgroundColor: template.colors.primary }"
                            />
                            <h6 class="text-subtitle-1 font-weight-medium">
                              {{ template.name }}
                            </h6>
                          </div>
                          <VIcon
                            v-if="safeTemplates.selected === template.id"
                            icon="tabler-check"
                            color="primary"
                          />
                        </div>
                        <p class="text-caption text-medium-emphasis mb-3">
                          {{ template.description }}
                        </p>

                        <!-- Preview de la plantilla -->
                        <div class="template-preview mb-3">
                          <div
                            class="preview-header pa-2 text-center text-caption font-weight-medium text-white rounded-t"
                            :style="{
                              backgroundColor: template.colors.primary,
                              fontFamily: template.fonts.header,
                            }"
                          >
                            Encabezado
                          </div>
                          <div class="preview-content">
                            <div
                              class="preview-row pa-1 text-caption d-flex"
                              :style="{
                                backgroundColor: template.colors.surface,
                                fontFamily: template.fonts.body,
                              }"
                            >
                              <div class="flex-1 text-center">
                                Campo 1
                              </div>
                              <div class="flex-1 text-center">
                                Campo 2
                              </div>
                              <div class="flex-1 text-center">
                                Campo 3
                              </div>
                            </div>
                            <div
                              class="preview-row pa-1 text-caption d-flex"
                              :style="{
                                backgroundColor: template.colors.background,
                                fontFamily: template.fonts.body,
                              }"
                            >
                              <div class="flex-1 text-center">
                                Dato 1
                              </div>
                              <div class="flex-1 text-center">
                                Dato 2
                              </div>
                              <div class="flex-1 text-center">
                                Dato 3
                              </div>
                            </div>
                          </div>
                        </div>

                        <!-- Detalles de la plantilla -->
                        <div class="template-details">
                          <div class="d-flex align-center mb-1">
                            <VIcon
                              icon="tabler-palette"
                              size="12"
                              class="me-1"
                            />
                            <span class="text-caption">Colores: {{ template.colors.primary }}</span>
                          </div>
                          <div class="d-flex align-center mb-1">
                            <VIcon
                              icon="tabler-typography"
                              size="12"
                              class="me-1"
                            />
                            <span class="text-caption">Fuente: {{ template.fonts.header }}</span>
                          </div>
                          <div class="d-flex align-center">
                            <VIcon
                              icon="tabler-layout"
                              size="12"
                              class="me-1"
                            />
                            <span class="text-caption">Márgenes: {{ template.layout.margins.top }}px</span>
                          </div>
                        </div>
                      </VCardText>
                    </VCard>
                  </VCol>
                </VRow>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
      </VWindowItem>

      <!-- Tab Campos Calculados -->
      <VWindowItem value="calculated">
        <VCard variant="outlined">
          <VCardTitle class="d-flex align-center justify-space-between pa-4">
            <div class="d-flex align-center">
              <VIcon
                icon="tabler-calculator"
                class="me-2"
              />
              <span>Campos Calculados</span>
              <VChip
                size="small"
                class="ms-2"
                :color="safeCalculatedFields.length > 0 ? 'primary' : 'default'"
              >
                {{ safeCalculatedFields.length }} campos
              </VChip>
            </div>
            <VBtn
              color="primary"
              prepend-icon="tabler-plus"
              @click="addCalculatedField"
            >
              Agregar Campo
            </VBtn>
          </VCardTitle>
          <VCardText>
            <div
              v-if="safeCalculatedFields.length === 0"
              class="text-center py-8"
            >
              <VIcon
                icon="tabler-calculator"
                size="48"
                class="text-medium-emphasis mb-4"
              />
              <p class="text-body-1 text-medium-emphasis">
                No hay campos calculados definidos
              </p>
              <p class="text-body-2 text-medium-emphasis">
                Los campos calculados te permiten crear nuevas columnas basadas en fórmulas
              </p>
            </div>
            <VRow v-else>
              <VCol
                v-for="field in safeCalculatedFields"
                :key="field.id"
                cols="12"
                md="6"
              >
                <VCard
                  variant="tonal"
                  class="mb-3"
                >
                  <VCardText class="pa-4">
                    <div class="d-flex align-center justify-space-between mb-2">
                      <div class="d-flex align-center">
                        <VIcon
                          icon="tabler-calculator"
                          class="me-2"
                        />
                        <span class="text-subtitle-2 font-weight-medium">{{ field.name }}</span>
                      </div>
                      <div class="d-flex gap-1">
                        <VSwitch
                          v-model="field.enabled"
                          color="primary"
                          density="compact"
                          hide-details
                        />
                        <VBtn
                          icon="tabler-edit"
                          variant="text"
                          size="small"
                          @click="editCalculatedField(field)"
                        />
                        <VBtn
                          icon="tabler-x"
                          variant="text"
                          size="small"
                          color="error"
                          @click="removeCalculatedField(field.id)"
                        />
                      </div>
                    </div>
                    <p class="text-caption text-medium-emphasis mb-2">
                      {{ field.description || 'Sin descripción' }}
                    </p>
                    <div class="text-caption font-mono bg-surface pa-2 rounded">
                      {{ field.formula || 'Sin fórmula' }}
                    </div>
                  </VCardText>
                </VCard>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VWindowItem>

      <!-- Tab Formato Condicional -->
      <VWindowItem value="conditional">
        <VCard variant="outlined">
          <VCardTitle class="d-flex align-center justify-space-between pa-4">
            <div class="d-flex align-center">
              <VIcon
                icon="tabler-color-filter"
                class="me-2"
              />
              <span>Formato Condicional</span>
              <VChip
                size="small"
                class="ms-2"
                :color="safeConditionalFormats.length > 0 ? 'primary' : 'default'"
              >
                {{ safeConditionalFormats.length }} reglas
              </VChip>
            </div>
            <VBtn
              color="primary"
              prepend-icon="tabler-plus"
              @click="addConditionalFormat"
            >
              Agregar Regla
            </VBtn>
          </VCardTitle>
          <VCardText>
            <div
              v-if="safeConditionalFormats.length === 0"
              class="text-center py-8"
            >
              <VIcon
                icon="tabler-color-filter"
                size="48"
                class="text-medium-emphasis mb-4"
              />
              <p class="text-body-1 text-medium-emphasis">
                No hay reglas de formato condicional definidas
              </p>
              <p class="text-body-2 text-medium-emphasis">
                El formato condicional cambia la apariencia de las celdas según sus valores
              </p>
            </div>
            <VRow v-else>
              <VCol
                v-for="format in safeConditionalFormats"
                :key="format.id"
                cols="12"
                md="6"
              >
                <VCard
                  variant="tonal"
                  class="mb-3"
                >
                  <VCardText class="pa-4">
                    <div class="d-flex align-center justify-space-between mb-2">
                      <div class="d-flex align-center">
                        <VIcon
                          icon="tabler-color-filter"
                          class="me-2"
                        />
                        <span class="text-subtitle-2 font-weight-medium">{{ format.name }}</span>
                      </div>
                      <div class="d-flex gap-1">
                        <VSwitch
                          v-model="format.enabled"
                          color="primary"
                          density="compact"
                          hide-details
                        />
                        <VBtn
                          icon="tabler-edit"
                          variant="text"
                          size="small"
                          @click="editConditionalFormat(format)"
                        />
                        <VBtn
                          icon="tabler-x"
                          variant="text"
                          size="small"
                          color="error"
                          @click="removeConditionalFormat(format.id)"
                        />
                      </div>
                    </div>
                    <p class="text-caption text-medium-emphasis mb-2">
                      Campo: {{ format.field }}
                    </p>
                    <div class="text-caption">
                      {{ format.conditions.length }} condición{{ format.conditions.length !== 1 ? 'es' : '' }}
                    </div>
                  </VCardText>
                </VCard>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VWindowItem>

      <!-- Tab Interactividad -->
      <VWindowItem value="interactive">
        <VRow>
          <VCol cols="12">
            <VCard variant="outlined">
              <VCardTitle class="pa-4">
                <VIcon
                  icon="tabler-click"
                  class="me-2"
                />
                Configuración Interactiva
              </VCardTitle>
              <VCardText>
                <VRow>
                  <!-- Filtros -->
                  <VCol cols="12">
                    <h6 class="text-subtitle-1 mb-3">
                      <VIcon
                        icon="tabler-filter"
                        class="me-2"
                      />
                      Filtros Interactivos
                    </h6>
                    <VRow>
                      <VCol
                        cols="12"
                        md="6"
                      >
                        <VSwitch
                          :model-value="safeInteractive.filters.enabled"
                          label="Habilitar filtros interactivos"
                          color="primary"
                          @update:model-value="(val: boolean) => updateInteractiveField('filters', 'enabled', val)"
                        />
                      </VCol>
                      <VCol
                        cols="12"
                        md="6"
                      >
                        <VSwitch
                          :model-value="safeInteractive.filters.showFilterBar"
                          label="Mostrar barra de filtros"
                          color="primary"
                          @update:model-value="(val: boolean) => updateInteractiveField('filters', 'showFilterBar', val)"
                        />
                      </VCol>
                    </VRow>
                  </VCol>

                  <!-- Acciones -->
                  <VCol cols="12">
                    <VDivider class="my-4" />
                    <h6 class="text-subtitle-1 mb-3">
                      <VIcon
                        icon="tabler-mouse"
                        class="me-2"
                      />
                      Acciones de Usuario
                    </h6>
                    <VRow>
                      <VCol
                        cols="12"
                        md="6"
                      >
                        <VSwitch
                          :model-value="safeInteractive.actions.allowExport"
                          label="Permitir exportación"
                          color="primary"
                          @update:model-value="(val: boolean) => updateInteractiveField('actions', 'allowExport', val)"
                        />
                      </VCol>
                      <VCol
                        cols="12"
                        md="6"
                      >
                        <VSwitch
                          :model-value="safeInteractive.actions.allowPrint"
                          label="Permitir impresión"
                          color="primary"
                          @update:model-value="(val: boolean) => updateInteractiveField('actions', 'allowPrint', val)"
                        />
                      </VCol>
                    </VRow>
                  </VCol>

                  <!-- Drill-down -->
                  <!--
                    <VCol cols="12">
                    <VDivider class="my-4" />
                    <h6 class="text-subtitle-1 mb-3">
                    <VIcon
                    icon="tabler-zoom-in"
                    class="me-2"
                    />
                    Drill-down
                    </h6>
                    <VRow>
                    <VCol
                    cols="12"
                    md="6"
                    >
                    <VSwitch
                    :model-value="safeInteractive.drillDown.enabled"
                    label="Habilitar drill-down"
                    color="primary"
                    @update:model-value="(val: boolean) => updateInteractiveField('drillDown', 'enabled', val)"
                    />
                    </VCol>
                    </VRow>
                    </VCol>
                  -->
                </VRow>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
      </VWindowItem>

      <!-- Tab Rendimiento -->
      <VWindowItem value="performance">
        <VCard variant="outlined">
          <VCardTitle class="pa-4">
            <VIcon
              icon="tabler-brand-speedtest"
              class="me-2"
            />
            Configuración de Rendimiento
          </VCardTitle>
          <VCardText>
            <VRow>
              <VCol
                cols="12"
                md="6"
              >
                <VSwitch
                  :model-value="safePerformance.enableCache"
                  label="Habilitar caché"
                  color="primary"
                  @update:model-value="(val: boolean) => updatePerformanceField('enableCache', val)"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <VSwitch
                  :model-value="safePerformance.enableLazyLoading"
                  label="Carga perezosa"
                  color="primary"
                  @update:model-value="(val: boolean) => updatePerformanceField('enableLazyLoading', val)"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  :model-value="safePerformance.cacheTimeout"
                  label="Tiempo de caché (segundos)"
                  type="number"
                  min="60"
                  max="3600"
                  variant="outlined"
                  density="compact"
                  @update:model-value="(val: string) => updatePerformanceField('cacheTimeout', parseInt(val))"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  :model-value="safePerformance.maxRowsToRender"
                  label="Máximo filas a renderizar"
                  type="number"
                  min="100"
                  max="10000"
                  variant="outlined"
                  density="compact"
                  @update:model-value="(val: string) => updatePerformanceField('maxRowsToRender', parseInt(val))"
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VWindowItem>

      <!-- Tab Seguridad -->
      <VWindowItem value="security">
        <VCard variant="outlined">
          <VCardTitle class="pa-4">
            <VIcon
              icon="tabler-shield"
              class="me-2"
            />
            Configuración de Seguridad
          </VCardTitle>
          <VCardText>
            <VRow>
              <VCol
                cols="12"
                md="6"
              >
                <VSwitch
                  :model-value="safeSecurity.enableFieldLevelSecurity"
                  label="Seguridad por campo"
                  color="primary"
                  @update:model-value="(val: boolean) => updateSecurityField('enableFieldLevelSecurity', val)"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <VSwitch
                  :model-value="safeSecurity.enableRowLevelSecurity"
                  label="Seguridad por fila"
                  color="primary"
                  @update:model-value="(val: boolean) => updateSecurityField('enableRowLevelSecurity', val)"
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VWindowItem>
    </VWindow>

    <VAlert
      v-if="error"
      type="error"
      variant="tonal"
      class="mt-4"
    >
      {{ error }}
    </VAlert>

    <!-- Diálogo Campo Calculado -->
    <VDialog
      v-model="showCalculatedFieldDialog"
      max-width="800px"
      persistent
    >
      <VCard>
        <VCardTitle class="d-flex align-center justify-space-between pa-4">
          <div class="d-flex align-center">
            <VIcon
              icon="tabler-calculator"
              class="me-2"
            />
            <span>{{ editingCalculatedField?.id?.startsWith('calc_') ? 'Editar' : 'Nuevo' }} Campo Calculado</span>
          </div>
          <VBtn
            icon="tabler-x"
            variant="text"
            size="small"
            @click="showCalculatedFieldDialog = false"
          />
        </VCardTitle>

        <VCardText v-if="editingCalculatedField">
          <VRow>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="editingCalculatedField.name"
                label="Nombre del campo"
                variant="outlined"
                density="compact"
                :rules="[v => !!v || 'El nombre es requerido']"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="editingCalculatedField.format"
                label="Formato"
                :items="[
                  { title: 'Número', value: 'number' },
                  { title: 'Moneda', value: 'currency' },
                  { title: 'Porcentaje', value: 'percentage' },
                  { title: 'Texto', value: 'text' },
                ]"
                variant="outlined"
                density="compact"
              />
            </VCol>
            <VCol cols="12">
              <VTextField
                v-model="editingCalculatedField.description"
                label="Descripción"
                variant="outlined"
                density="compact"
              />
            </VCol>
            <VCol cols="12">
              <VTextField
                v-model="editingCalculatedField.formula"
                label="Fórmula"
                variant="outlined"
                type="textarea"
                rows="3"
                hint="Usa los nombres de las columnas disponibles. Ej: [Ventas] * [Cantidad]"
                persistent-hint
                :rules="[v => !!v || 'La fórmula es requerida']"
              />
            </VCol>
            <VCol cols="12">
              <div class="mb-2">
                <span class="text-subtitle-2">Columnas disponibles:</span>
              </div>
              <div class="d-flex flex-wrap gap-2">
                <VChip
                  v-for="field in availableFields"
                  :key="field.field"
                  size="small"
                  class="cursor-pointer"
                  color="primary"
                  variant="outlined"
                  @click="addFieldToFormula(field.alias)"
                >
                  {{ field.alias }}
                  <VTooltip activator="parent">
                    Click para agregar a la fórmula
                  </VTooltip>
                </VChip>
              </div>
            </VCol>
            <VCol cols="12">
              <VAlert
                type="info"
                variant="tonal"
                class="mb-0"
              >
                <template #prepend>
                  <VIcon icon="tabler-info-circle" />
                </template>
                <div>
                  <strong>Operadores disponibles:</strong><br>
                  + (suma), - (resta), * (multiplicación), / (división)<br>
                  <strong>Funciones:</strong> SUM(), AVG(), COUNT(), MIN(), MAX()
                </div>
              </VAlert>
            </VCol>
          </VRow>
        </VCardText>

        <VCardActions class="pa-4">
          <VSpacer />
          <VBtn
            variant="text"
            @click="showCalculatedFieldDialog = false"
          >
            Cancelar
          </VBtn>
          <VBtn
            color="primary"
            @click="saveCalculatedField"
          >
            Guardar
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Diálogo Formato Condicional -->
    <VDialog
      v-model="showConditionalFormatDialog"
      max-width="900px"
      persistent
    >
      <VCard>
        <VCardTitle class="d-flex align-center justify-space-between pa-4">
          <div class="d-flex align-center">
            <VIcon
              icon="tabler-color-filter"
              class="me-2"
            />
            <span>{{ editingConditionalFormat?.id?.startsWith('cond_') ? 'Editar' : 'Nueva' }} Regla de Formato</span>
          </div>
          <VBtn
            icon="tabler-x"
            variant="text"
            size="small"
            @click="showConditionalFormatDialog = false"
          />
        </VCardTitle>

        <VCardText v-if="editingConditionalFormat">
          <VRow>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="editingConditionalFormat.name"
                label="Nombre de la regla"
                variant="outlined"
                density="compact"
                :rules="[v => !!v || 'El nombre es requerido']"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="editingConditionalFormat.field"
                label="Campo a evaluar"
                :items="availableFields.map(f => ({ title: f.alias, value: f.field }))"
                variant="outlined"
                density="compact"
                :rules="[v => !!v || 'Selecciona un campo']"
              />
            </VCol>
          </VRow>

          <!-- Condiciones -->
          <div class="mt-4">
            <div class="d-flex align-center justify-space-between mb-3">
              <h6 class="text-subtitle-1">
                Condiciones
              </h6>
              <VBtn
                size="small"
                color="primary"
                prepend-icon="tabler-plus"
                @click="addCondition"
              >
                Agregar Condición
              </VBtn>
            </div>

            <div
              v-for="(condition, index) in editingConditionalFormat.conditions"
              :key="index"
              class="mb-4 pa-4 border rounded"
            >
              <VRow>
                <VCol
                  cols="12"
                  md="3"
                >
                  <VSelect
                    v-model="condition.operator"
                    label="Operador"
                    :items="[
                      { title: 'Mayor que', value: '>' },
                      { title: 'Menor que', value: '<' },
                      { title: 'Mayor o igual', value: '>=' },
                      { title: 'Menor o igual', value: '<=' },
                      { title: 'Igual a', value: '==' },
                      { title: 'Diferente de', value: '!=' },
                      { title: 'Contiene', value: 'contains' },
                      { title: 'Comienza con', value: 'startsWith' },
                      { title: 'Termina con', value: 'endsWith' },
                    ]"
                    variant="outlined"
                    density="compact"
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="2"
                >
                  <VTextField
                    v-model="condition.value"
                    label="Valor"
                    variant="outlined"
                    density="compact"
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="2"
                >
                  <VTextField
                    v-model="condition.color"
                    label="Color texto"
                    type="color"
                    variant="outlined"
                    density="compact"
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="2"
                >
                  <VTextField
                    v-model="condition.backgroundColor"
                    label="Color fondo"
                    type="color"
                    variant="outlined"
                    density="compact"
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="2"
                >
                  <div class="d-flex flex-column gap-1">
                    <VSwitch
                      v-model="condition.bold"
                      label="Negrita"
                      color="primary"
                      density="compact"
                      hide-details
                    />
                    <VSwitch
                      v-model="condition.italic"
                      label="Cursiva"
                      color="primary"
                      density="compact"
                      hide-details
                    />
                  </div>
                </VCol>
                <VCol
                  cols="12"
                  md="1"
                >
                  <div class="d-flex justify-center align-center h-100">
                    <VBtn
                      icon="tabler-trash"
                      variant="text"
                      size="small"
                      color="error"
                      @click="removeCondition(index)"
                    />
                  </div>
                </VCol>
              </VRow>
            </div>
          </div>
        </VCardText>

        <VCardActions class="pa-4">
          <VSpacer />
          <VBtn
            variant="text"
            @click="showConditionalFormatDialog = false"
          >
            Cancelar
          </VBtn>
          <VBtn
            color="primary"
            @click="saveConditionalFormat"
          >
            Guardar
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
.report-advanced-config {
  .template-card {
    border: 2px solid transparent;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 10%);
      transform: translateY(-2px);
    }

    &.border-primary {
      border-color: rgb(var(--v-theme-primary));
      background-color: rgb(var(--v-theme-primary) / 5%);
    }
  }

  .color-preview {
    border: 1px solid rgba(0, 0, 0, 10%);
    border-radius: 4px;
    block-size: 20px;
    inline-size: 20px;
  }

  .cursor-pointer {
    cursor: pointer;
  }

  .v-tabs {
    .v-tab {
      font-weight: 500;
      text-transform: none;
    }
  }

  /* Estilos para el preview de plantillas */
  .template-preview {
    overflow: hidden;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 10%);
  }

  .preview-header {
    border-block-end: 1px solid rgba(255, 255, 255, 20%);
    font-size: 0.75rem;
    font-weight: 500;
  }

  .preview-content {
    background-color: #fff;
  }

  .preview-row {
    align-items: center;
    border-block-end: 1px solid #e0e0e0;
    font-size: 0.7rem;
    min-block-size: 24px;
  }

  .preview-row:last-child {
    border-block-end: none;
  }

  .preview-row .flex-1 {
    border-inline-end: 1px solid #e0e0e0;
    padding-block: 0;
    padding-inline: 4px;
  }

  .preview-row .flex-1:last-child {
    border-inline-end: none;
  }

  .template-details {
    border-block-start: 1px solid #e0e0e0;
    padding-block-start: 8px;
  }

  .template-details .text-caption {
    color: #666;
    font-size: 0.7rem;
  }
}
</style>
