<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

interface ExportFormat {
  id: string
  name: string
  enabled: boolean
  icon: string
  color: string

  // Configuración específica por formato
  config: {

    // Excel
    includeCharts?: boolean
    autoFilter?: boolean
    freezePanes?: boolean
    protectSheet?: boolean
    password?: string
    includeFormulas?: boolean
    sheetName?: string
    headerColor?: string
    alternateRows?: boolean

    // PDF
    orientation?: 'portrait' | 'landscape'
    pageSize?: 'A4' | 'A3' | 'Letter' | 'Legal' | 'Tabloid'
    margins?: {
      top: number
      right: number
      bottom: number
      left: number
    }
    headerFooter?: boolean
    pageNumbers?: boolean
    watermark?: string
    watermarkOpacity?: number
    compression?: boolean

    // CSV
    delimiter?: ',' | ';' | '\t' | '|' | 'custom'
    customDelimiter?: string
    encoding?: 'UTF-8' | 'ISO-8859-1' | 'Windows-1252'
    lineEnding?: 'CRLF' | 'LF'
    quoteStrings?: boolean
    escapeFormulas?: boolean

    // HTML
    includeStyles?: boolean
    responsive?: boolean
    printable?: boolean
    interactive?: boolean

    // JSON
    pretty?: boolean
    includeMetadata?: boolean
    dateFormat?: 'ISO' | 'timestamp' | 'custom'
    customDateFormat?: string

    // XML
    rootElement?: string
    rowElement?: string
    prettyPrint?: boolean
    includeSchema?: boolean
  }

  // Configuración común
  includeHeaders: boolean
  includeTotals: boolean
  includeFilters: boolean
  includeTimestamp: boolean
  maxRows?: number
}

interface ExportSchedule {
  enabled: boolean
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom'
  time?: string
  dayOfWeek?: number
  dayOfMonth?: number
  customCron?: string
  recipients?: string[]
  formats?: string[]
}

interface ExportConfig {
  formats: ExportFormat[]
  general: {
    filenameTemplate: string
    compression: boolean
    compressionLevel: 'low' | 'medium' | 'high'
    splitLargeFiles: boolean
    maxFileSize: number
    includeMetadata: boolean
  }
  delivery: {
    method: 'download' | 'email' | 'cloud' | 'api'
    emailRecipients?: string[]
    cloudProvider?: 'drive' | 'dropbox' | 's3' | 'azure'
    cloudPath?: string
    apiEndpoint?: string
    apiHeaders?: Record<string, string>
  }
  schedule?: ExportSchedule
}

interface Props {
  modelValue: ExportConfig
  loading?: boolean
  error?: string | null
}

interface Emits {
  (e: 'update:modelValue', value: ExportConfig): void
  (e: 'validate', isValid: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
})

const emit = defineEmits<Emits>()

// Estado
const exportConfig = ref<ExportConfig>({
  formats: [],
  general: {
    filenameTemplate: 'report_{name}_{date}_{time}',
    compression: false,
    compressionLevel: 'medium',
    splitLargeFiles: false,
    maxFileSize: 100,
    includeMetadata: true,
  },
  delivery: {
    method: 'download',
  },
  schedule: {
    enabled: false,
    frequency: 'daily',
    time: '09:00',
  },
})

const activeTab = ref('formats')
const expandedFormats = ref<Record<string, boolean>>({})
const showAdvancedDialog = ref(false)
const editingFormat = ref<ExportFormat | null>(null)
const configTab = ref('basic')
const isUpdatingFromProps = ref(false) // Flag to prevent circular updates

// Computed properties for v-model bindings to prevent circular updates
const deliveryMethod = computed({
  get: () => exportConfig.value.delivery.method,
  set: (value: string) => {
    exportConfig.value.delivery.method = value as any
    emitUpdate()
  },
})

const cloudProvider = computed({
  get: () => exportConfig.value.delivery.cloudProvider,
  set: (value: string) => {
    exportConfig.value.delivery.cloudProvider = value as any
    emitUpdate()
  },
})

const cloudPath = computed({
  get: () => exportConfig.value.delivery.cloudPath,
  set: (value: string) => {
    exportConfig.value.delivery.cloudPath = value
    emitUpdate()
  },
})

const apiEndpoint = computed({
  get: () => exportConfig.value.delivery.apiEndpoint,
  set: (value: string) => {
    exportConfig.value.delivery.apiEndpoint = value
    emitUpdate()
  },
})

const scheduleFrequency = computed({
  get: () => exportConfig.value.schedule?.frequency || 'daily',
  set: (value: string) => {
    if (exportConfig.value.schedule) {
      exportConfig.value.schedule.frequency = value as any
      emitUpdate()
    }
  },
})

const scheduleTime = computed({
  get: () => exportConfig.value.schedule?.time || '09:00',
  set: (value: string) => {
    if (exportConfig.value.schedule) {
      exportConfig.value.schedule.time = value
      emitUpdate()
    }
  },
})

const scheduleDayOfWeek = computed({
  get: () => exportConfig.value.schedule?.dayOfWeek,
  set: (value: number) => {
    if (exportConfig.value.schedule) {
      exportConfig.value.schedule.dayOfWeek = value
      emitUpdate()
    }
  },
})

const scheduleDayOfMonth = computed({
  get: () => exportConfig.value.schedule?.dayOfMonth,
  set: (value: number) => {
    if (exportConfig.value.schedule) {
      exportConfig.value.schedule.dayOfMonth = value
      emitUpdate()
    }
  },
})

const scheduleCustomCron = computed({
  get: () => exportConfig.value.schedule?.customCron,
  set: (value: string) => {
    if (exportConfig.value.schedule) {
      exportConfig.value.schedule.customCron = value
      emitUpdate()
    }
  },
})

const filenameTemplate = computed({
  get: () => exportConfig.value.general.filenameTemplate,
  set: (value: string) => {
    exportConfig.value.general.filenameTemplate = value
    emitUpdate()
  },
})

const compression = computed({
  get: () => exportConfig.value.general.compression,
  set: (value: boolean) => {
    exportConfig.value.general.compression = value
    emitUpdate()
  },
})

const splitLargeFiles = computed({
  get: () => exportConfig.value.general.splitLargeFiles,
  set: (value: boolean) => {
    exportConfig.value.general.splitLargeFiles = value
    emitUpdate()
  },
})

const maxFileSize = computed({
  get: () => exportConfig.value.general.maxFileSize,
  set: (value: number) => {
    exportConfig.value.general.maxFileSize = value
    emitUpdate()
  },
})

const compressionLevel = computed({
  get: () => exportConfig.value.general.compressionLevel,
  set: (value: string) => {
    exportConfig.value.general.compressionLevel = value as any
    emitUpdate()
  },
})

const scheduleEnabled = computed({
  get: () => exportConfig.value.schedule?.enabled || false,
  set: (value: boolean) => {
    if (!exportConfig.value.schedule) {
      exportConfig.value.schedule = {
        enabled: false,
        frequency: 'daily',
        time: '09:00',
      }
    }
    exportConfig.value.schedule.enabled = value
    emitUpdate()
  },
})

// Formatos disponibles
const availableFormats = [
  {
    id: 'excel',
    name: 'Excel',
    icon: 'tabler-file-spreadsheet',
    color: 'success',
    description: 'Archivo de hoja de cálculo con formato y fórmulas',
  },
  {
    id: 'pdf',
    name: 'PDF',
    icon: 'tabler-file-type-pdf',
    color: 'error',
    description: 'Documento portable con formato fijo',
  },
  {
    id: 'csv',
    name: 'CSV',
    icon: 'tabler-file-text',
    color: 'info',
    description: 'Valores separados por comas, compatible universalmente',
  },
  // {
  //   id: 'html',
  //   name: 'HTML',
  //   icon: 'tabler-file-code',
  //   color: 'warning',
  //   description: 'Página web con estilos e interactividad',
  // },
  // {
  //   id: 'json',
  //   name: 'JSON',
  //   icon: 'tabler-json',
  //   color: 'primary',
  //   description: 'Formato de intercambio de datos estructurados',
  // },
  // {
  //   id: 'xml',
  //   name: 'XML',
  //   icon: 'tabler-file-type-xml',
  //   color: 'secondary',
  //   description: 'Lenguaje de marcado extensible',
  // },
]

// Variables de plantilla
const templateVariables = [
  { value: '{name}', label: 'Nombre del reporte' },
  { value: '{date}', label: 'Fecha (YYYY-MM-DD)' },
  { value: '{time}', label: 'Hora (HH-mm-ss)' },
  { value: '{timestamp}', label: 'Timestamp UNIX' },
  { value: '{user}', label: 'Usuario actual' },
  { value: '{format}', label: 'Formato de archivo' },
  { value: '{filters}', label: 'Filtros aplicados' },
]

// Frecuencias de programación
const scheduleFrequencies = [
  { value: 'daily', label: 'Diario' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'custom', label: 'Personalizado (Cron)' },
]

// Días de la semana
const weekDays = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' },
]

// Métodos
const validateConfig = () => {
  const hasEnabledFormat = exportConfig.value.formats?.some(f => f.enabled) || false

  emit('validate', hasEnabledFormat)
}

const emitUpdate = () => {
  if (!isUpdatingFromProps.value) {
    emit('update:modelValue', exportConfig.value)
    validateConfig()
  }
}

const createFormat = (formatId: string): ExportFormat => {
  const formatInfo = availableFormats.find(f => f.id === formatId)
  if (!formatInfo)
    throw new Error(`Unknown format: ${formatId}`)

  const baseFormat: ExportFormat = {
    id: formatId,
    name: formatInfo.name,
    enabled: ['excel', 'pdf', 'csv'].includes(formatId),
    icon: formatInfo.icon,
    color: formatInfo.color,
    config: {},
    includeHeaders: true,
    includeTotals: true,
    includeFilters: true,
    includeTimestamp: false,
  }

  // Configuración por defecto según formato
  switch (formatId) {
    case 'excel':
      baseFormat.config = {
        includeCharts: false,
        autoFilter: true,
        freezePanes: true,
        alternateRows: true,
        sheetName: 'Reporte',
        headerColor: '#4CAF50',
      }
      break
    case 'pdf':
      baseFormat.config = {
        orientation: 'portrait',
        pageSize: 'A4',
        margins: { top: 20, right: 20, bottom: 20, left: 20 },
        headerFooter: true,
        pageNumbers: true,
        compression: true,
      }
      break
    case 'csv':
      baseFormat.config = {
        delimiter: ',',
        encoding: 'UTF-8',
        lineEnding: 'CRLF',
        quoteStrings: true,
        escapeFormulas: true,
      }
      break
    case 'html':
      baseFormat.config = {
        includeStyles: true,
        responsive: true,
        printable: true,
        interactive: false,
      }
      break
    case 'json':
      baseFormat.config = {
        pretty: true,
        includeMetadata: true,
        dateFormat: 'ISO',
      }
      break
    case 'xml':
      baseFormat.config = {
        rootElement: 'report',
        rowElement: 'row',
        prettyPrint: true,
        includeSchema: false,
      }
      break
  }

  return baseFormat
}

const initializeDefaultFormats = () => {
  exportConfig.value.formats = [
    createFormat('excel'),
    createFormat('pdf'),
    createFormat('csv'),
  ]
}

// Inicializar
onMounted(() => {
  if (props.modelValue) {
    isUpdatingFromProps.value = true
    exportConfig.value = {
      ...exportConfig.value, // Keep default values
      ...props.modelValue,
      formats: props.modelValue.formats || [], // Ensure formats is always an array
    }
    isUpdatingFromProps.value = false
  }
  else {
    // Inicializar con formatos por defecto
    initializeDefaultFormats()
  }
  validateConfig()
})

// Watch
watch(() => props.modelValue, (newVal, oldVal) => {
  // Only update if the values are actually different to prevent circular updates
  if (newVal && newVal !== oldVal) {
    isUpdatingFromProps.value = true
    exportConfig.value = {
      ...exportConfig.value, // Keep default values
      ...newVal,
      formats: newVal.formats || [], // Ensure formats is always an array
    }
    isUpdatingFromProps.value = false
  }
}, { deep: true })

// Remove automatic watcher to prevent circular updates
// Instead, we'll emit updates manually when user actions occur

const toggleFormat = (formatId: string) => {
  // Ensure formats array exists
  if (!exportConfig.value.formats)
    exportConfig.value.formats = []

  const format = exportConfig.value.formats.find(f => f.id === formatId)
  if (format) {
    format.enabled = !format.enabled
  }
  else {
    // Agregar nuevo formato
    const newFormat = createFormat(formatId)

    exportConfig.value.formats.push(newFormat)
  }
  emitUpdate()
}

const isFormatEnabled = (formatId: string) => {
  const format = exportConfig.value.formats?.find(f => f.id === formatId)

  return format?.enabled || false
}

const toggleFormatExpanded = (formatId: string) => {
  expandedFormats.value[formatId] = !expandedFormats.value[formatId]
}

const openAdvancedConfig = (format: ExportFormat) => {
  editingFormat.value = { ...format }
  showAdvancedDialog.value = true
  configTab.value = 'basic'
}

const _saveAdvancedConfig = () => {
  if (editingFormat.value) {
    const index = exportConfig.value.formats?.findIndex(f => f.id === editingFormat.value!.id) || -1
    if (index >= 0 && exportConfig.value.formats)
      exportConfig.value.formats[index] = { ...editingFormat.value }
  }
  showAdvancedDialog.value = false
  editingFormat.value = null
  emitUpdate()
}

const addTemplateVariable = (variable: string) => {
  exportConfig.value.general.filenameTemplate += variable
  emitUpdate()
}

const enabledFormatsCount = computed(() => {
  return exportConfig.value.formats?.filter(f => f.enabled).length || 0
})

const deliveryMethodIcon = computed(() => {
  const icons: Record<string, string> = {
    download: 'tabler-download',
    email: 'tabler-mail',
    cloud: 'tabler-cloud',
    api: 'tabler-api',
  }

  return icons[exportConfig.value.delivery.method] || 'tabler-download'
})

// Validar email
const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(email)
}

// Agregar destinatario de email
const addEmailRecipient = (email: string) => {
  if (!exportConfig.value.delivery.emailRecipients)
    exportConfig.value.delivery.emailRecipients = []

  if (isValidEmail(email) && !exportConfig.value.delivery.emailRecipients.includes(email))
    exportConfig.value.delivery.emailRecipients.push(email)
  emitUpdate()
}

// Eliminar destinatario
const removeEmailRecipient = (index: number) => {
  if (exportConfig.value.delivery.emailRecipients)
    exportConfig.value.delivery.emailRecipients.splice(index, 1)
  emitUpdate()
}

// Funcionalidades adicionales
const emailInput = ref('')

const addEmailFromInput = () => {
  if (emailInput.value.trim()) {
    addEmailRecipient(emailInput.value.trim())
    emailInput.value = ''
  }
}

// Helper function for updating general configuration
const updateGeneralConfig = (field: string, value: any) => {
  // Direct update since we're not using vee-validate here
  exportConfig.value.general = {
    ...exportConfig.value.general,
    [field]: value
  }
  emitUpdate()
}

const validateSchedule = () => {
  if (!exportConfig.value.schedule?.enabled)
    return true

  const schedule = exportConfig.value.schedule
  if (!schedule.time)
    return false

  if (schedule.frequency === 'weekly' && schedule.dayOfWeek === undefined)
    return false
  if (schedule.frequency === 'monthly' && (!schedule.dayOfMonth || schedule.dayOfMonth < 1 || schedule.dayOfMonth > 31))
    return false

  return !(schedule.frequency === 'custom' && !schedule.customCron)
}

const getScheduleDescription = () => {
  if (!exportConfig.value.schedule?.enabled)
    return 'Programación deshabilitada'

  const schedule = exportConfig.value.schedule
  let description = ''

  switch (schedule.frequency) {
    case 'daily':
      description = `Diario a las ${schedule.time}`
      break
    case 'weekly': {
      const dayName = weekDays.find(d => d.value === schedule.dayOfWeek)?.label || 'Día'

      description = `${dayName}s a las ${schedule.time}`
      break
    }
    case 'monthly':
      description = `Día ${schedule.dayOfMonth} de cada mes a las ${schedule.time}`
      break
    case 'custom':
      description = `Cron: ${schedule.customCron}`
      break
  }

  return description
}

const getDeliveryDescription = () => {
  const method = exportConfig.value.delivery.method
  switch (method) {
    case 'download':
      return 'Descarga directa desde el navegador'
    case 'email': {
      const count = exportConfig.value.delivery.emailRecipients?.length || 0

      return `Envío por email a ${count} destinatario${count !== 1 ? 's' : ''}`
    }
    case 'cloud': {
      const provider = exportConfig.value.delivery.cloudProvider || 'Nube'

      return `Almacenamiento en ${provider}`
    }
    case 'api':
      return 'Envío por API'
    default:
      return 'Método no configurado'
  }
}

const previewFilename = computed(() => {
  let filename = exportConfig.value.general.filenameTemplate
  const now = new Date()

  filename = filename.replace('{name}', 'Reporte de Ventas')
  filename = filename.replace('{date}', now.toISOString().split('T')[0])
  filename = filename.replace('{time}', now.toTimeString().split(' ')[0].replace(/:/g, '-'))
  filename = filename.replace('{timestamp}', Math.floor(now.getTime() / 1000).toString())
  filename = filename.replace('{user}', 'usuario@ejemplo.com')
  filename = filename.replace('{format}', 'excel')
  filename = filename.replace('{filters}', 'filtros_aplicados')

  return filename
})

const isConfigValid = computed(() => {
  const hasEnabledFormat = exportConfig.value.formats?.some(f => f.enabled) || false
  const hasValidSchedule = validateSchedule()

  const hasValidDelivery = exportConfig.value.delivery.method !== 'email'
    || (exportConfig.value.delivery.emailRecipients && exportConfig.value.delivery.emailRecipients.length > 0)

  return hasEnabledFormat && hasValidSchedule && hasValidDelivery
})

// Método para exportar configuración
const exportConfiguration = () => {
  return {
    ...exportConfig.value,
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
  }
}

// Método para importar configuración
const importConfiguration = (config: any) => {
  try {
    exportConfig.value = {
      ...config,
      exportedAt: undefined,
      version: undefined,
    }

    return true
  }
  catch (error) {
    console.error('Error importing configuration:', error)

    return false
  }
}

// Funciones para exportar/importar
const handleExportConfig = () => {
  const config = exportConfiguration()
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')

  a.href = url
  a.download = 'export-config.json'
  a.click()
  URL.revokeObjectURL(url)
}

const handleImportConfig = () => {
  const input = document.createElement('input')

  input.type = 'file'
  input.accept = '.json'
  input.onchange = (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (file) {
      const reader = new FileReader()

      reader.onload = (loadEvent: Event) => {
        try {
          const config = JSON.parse((loadEvent.target as FileReader).result as string)
          if (importConfiguration(config)) {
            // Mostrar notificación de éxito
            console.log('Configuración importada correctamente')
          }
        }
        catch (error) {
          console.error('Error al importar configuración:', error)
        }
      }
      reader.readAsText(file)
    }
  }
  input.click()
}
</script>

<template>
  <div class="report-export-advanced">
    <VRow>
      <VCol cols="12">
        <div class="d-flex align-center justify-space-between mb-2">
          <h6 class="text-h6 font-weight-medium mb-0">
            Configuración de Exportación
          </h6>
          <VChip
            :color="isConfigValid ? 'success' : 'error'"
            size="small"
            variant="tonal"
          >
            <VIcon
              :icon="isConfigValid ? 'tabler-check' : 'tabler-alert-circle'"
              size="16"
              start
            />
            {{ isConfigValid ? 'Configuración válida' : 'Configuración incompleta' }}
          </VChip>
        </div>
        <p class="text-body-2 text-medium-emphasis mb-4">
          Define los formatos de exportación disponibles y cómo se entregarán los reportes a los usuarios.
        </p>
      </VCol>
    </VRow>

    <!-- Tabs principales -->
    <VTabs
      v-model="activeTab"
      class="mb-4"
    >
      <VTab value="formats">
        <VIcon
          icon="tabler-file-export"
          start
        />
        Formatos
      </VTab>
      <VTab value="delivery">
        <VIcon
          icon="tabler-send"
          start
        />
        Entrega
      </VTab>
      <VTab value="schedule">
        <VIcon
          icon="tabler-calendar-event"
          start
        />
        Programación
      </VTab>
      <VTab value="advanced">
        <VIcon
          icon="tabler-settings"
          start
        />
        Avanzado
      </VTab>
    </VTabs>

    <VWindow v-model="activeTab">
      <!-- Tab Formatos -->
      <VWindowItem value="formats">
        <VRow>
          <!-- Selector de formatos -->
          <VCol cols="12">
            <VCard variant="outlined">
              <VCardTitle class="d-flex align-center justify-space-between pa-4">
                <div class="d-flex align-center">
                  <VIcon
                    icon="tabler-file-export"
                    class="me-2"
                  />
                  <span>Formatos de exportación disponibles</span>
                  <VChip
                    size="small"
                    class="ms-2"
                    :color="enabledFormatsCount > 0 ? 'primary' : 'default'"
                  >
                    {{ enabledFormatsCount }} activos
                  </VChip>
                </div>
              </VCardTitle>

              <VCardText>
                <VRow>
                  <VCol
                    v-for="format in availableFormats"
                    :key="format.id"
                    cols="12"
                    sm="6"
                    md="4"
                  >
                    <VCard
                      variant="outlined"
                      :class="{ 'border-primary': isFormatEnabled(format.id) }"
                      class="format-card cursor-pointer"
                      @click="toggleFormat(format.id)"
                    >
                      <VCardText class="pa-4">
                        <div class="d-flex align-center justify-space-between mb-2">
                          <VIcon
                            :icon="format.icon"
                            :color="format.color"
                            size="32"
                          />
                          <VSwitch
                            :model-value="isFormatEnabled(format.id)"
                            :color="format.color"
                            hide-details
                            density="compact"
                            @click.stop
                            @update:model-value="toggleFormat(format.id)"
                          />
                        </div>
                        <h6 class="text-subtitle-1 font-weight-medium mb-1">
                          {{ format.name }}
                        </h6>
                        <p class="text-caption text-medium-emphasis mb-0">
                          {{ format.description }}
                        </p>
                      </VCardText>
                    </VCard>
                  </VCol>
                </VRow>
              </VCardText>
            </VCard>
          </VCol>

          <!-- Configuración por formato -->
          <VCol cols="12">
            <TransitionGroup name="list">
              <VCard
                v-for="format in (exportConfig.formats || []).filter(f => f.enabled)"
                :key="format.id"
                variant="outlined"
                class="mb-3"
              >
                <VCardTitle class="d-flex align-center justify-space-between pa-4">
                  <div class="d-flex align-center">
                    <VIcon
                      :icon="format.icon"
                      :color="format.color"
                      class="me-2"
                    />
                    <span>{{ format.name }}</span>
                  </div>
                  <div class="d-flex gap-1">
                    <VBtn
                      icon
                      size="small"
                      variant="text"
                      @click="toggleFormatExpanded(format.id)"
                    >
                      <VIcon :icon="expandedFormats[format.id] ? 'tabler-chevron-up' : 'tabler-chevron-down'" />
                    </VBtn>
                    <VBtn
                      icon
                      size="small"
                      variant="text"
                      @click="openAdvancedConfig(format)"
                    >
                      <VIcon icon="tabler-settings" />
                      <VTooltip
                        activator="parent"
                        location="top"
                      >
                        Configuración avanzada
                      </VTooltip>
                    </VBtn>
                  </div>
                </VCardTitle>

                <VExpandTransition>
                  <VCardText
                    v-show="expandedFormats[format.id]"
                    class="pt-0"
                  >
                    <VRow>
                      <!-- Configuración básica común -->
                      <VCol
                        cols="12"
                        md="6"
                      >
                        <VSwitch
                          v-model="format.includeHeaders"
                          label="Incluir encabezados"
                          :color="format.color"
                          density="compact"
                        />
                      </VCol>
                      <VCol
                        cols="12"
                        md="6"
                      >
                        <VSwitch
                          v-model="format.includeTotals"
                          label="Incluir totales"
                          :color="format.color"
                          density="compact"
                        />
                      </VCol>
                      <VCol
                        cols="12"
                        md="6"
                      >
                        <VSwitch
                          v-model="format.includeFilters"
                          label="Incluir filtros aplicados"
                          :color="format.color"
                          density="compact"
                        />
                      </VCol>
                      <VCol
                        cols="12"
                        md="6"
                      >
                        <VSwitch
                          v-model="format.includeTimestamp"
                          label="Incluir fecha/hora de generación"
                          :color="format.color"
                          density="compact"
                        />
                      </VCol>

                      <!-- Configuración específica por formato -->
                      <VCol cols="12">
                        <VDivider class="my-2" />
                      </VCol>

                      <!-- Excel -->
                      <template v-if="format.id === 'excel'">
                        <VCol
                          cols="12"
                          md="6"
                        >
                          <VSwitch
                            v-model="format.config.autoFilter"
                            label="Autofiltros"
                            :color="format.color"
                            density="compact"
                          />
                        </VCol>
                        <VCol
                          cols="12"
                          md="6"
                        >
                          <VSwitch
                            v-model="format.config.freezePanes"
                            label="Inmovilizar paneles"
                            :color="format.color"
                            density="compact"
                          />
                        </VCol>
                      </template>

                      <!-- PDF -->
                      <template v-if="format.id === 'pdf'">
                        <VCol
                          cols="12"
                          md="6"
                        >
                          <VSelect
                            v-model="format.config.orientation"
                            label="Orientación"
                            :items="[
                              { value: 'portrait', title: 'Vertical' },
                              { value: 'landscape', title: 'Horizontal' },
                            ]"
                            density="compact"
                            variant="outlined"
                            hide-details
                          />
                        </VCol>
                        <VCol
                          cols="12"
                          md="6"
                        >
                          <VSelect
                            v-model="format.config.pageSize"
                            label="Tamaño de página"
                            :items="[
                              { value: 'A4', title: 'A4' },
                              { value: 'A3', title: 'A3' },
                              { value: 'Letter', title: 'Carta' },
                              { value: 'Legal', title: 'Legal' },
                            ]"
                            density="compact"
                            variant="outlined"
                            hide-details
                          />
                        </VCol>
                      </template>

                      <!-- CSV -->
                      <template v-if="format.id === 'csv'">
                        <VCol
                          cols="12"
                          md="6"
                        >
                          <VSelect
                            v-model="format.config.delimiter"
                            label="Delimitador"
                            :items="[
                              { value: ',', title: 'Coma (,)' },
                              { value: ';', title: 'Punto y coma (;)' },
                              { value: '\t', title: 'Tabulador' },
                              { value: '|', title: 'Pipe (|)' },
                            ]"
                            density="compact"
                            variant="outlined"
                            hide-details
                          />
                        </VCol>
                        <VCol
                          cols="12"
                          md="6"
                        >
                          <VSelect
                            v-model="format.config.encoding"
                            label="Codificación"
                            :items="[
                              { value: 'UTF-8', title: 'UTF-8' },
                              { value: 'ISO-8859-1', title: 'ISO-8859-1' },
                              { value: 'Windows-1252', title: 'Windows-1252' },
                            ]"
                            density="compact"
                            variant="outlined"
                            hide-details
                          />
                        </VCol>
                      </template>
                    </VRow>
                  </VCardText>
                </VExpandTransition>
              </VCard>
            </TransitionGroup>
          </VCol>
        </VRow>
      </VWindowItem>

      <!-- Tab Entrega -->
      <VWindowItem value="delivery">
        <VCard variant="outlined">
          <VCardTitle class="pa-4">
            <VIcon
              :icon="deliveryMethodIcon"
              class="me-2"
            />
            Método de entrega
          </VCardTitle>
          <VCardText>
            <VRow>
              <VCol cols="12">
                <div class="mb-3">
                  <p class="text-body-2 text-medium-emphasis">
                    {{ getDeliveryDescription() }}
                  </p>
                </div>
                <VRadioGroup
                  v-model="deliveryMethod"
                  inline
                >
                  <VRadio
                    value="download"
                    label="Descarga directa"
                  />
                  <!-- <VRadio
                    value="email"
                    label="Envío por email"
                  />
                  <VRadio
                    value="cloud"
                    label="Almacenamiento en la nube"
                  />
                  <VRadio
                    value="api"
                    label="Envío por API"
                  /> -->
                </VRadioGroup>
              </VCol>

              <!-- Configuración por email -->
              <template v-if="exportConfig.delivery.method === 'email'">
                <VCol cols="12">
                  <VCard variant="tonal">
                    <VCardText>
                      <h6 class="text-subtitle-1 mb-3">
                        Destinatarios de email
                      </h6>
                      <VTextField
                        v-model="emailInput"
                        label="Agregar destinatario"
                        placeholder="email@ejemplo.com"
                        density="compact"
                        variant="outlined"
                        @keydown.enter="addEmailFromInput"
                      >
                        <template #append>
                          <VBtn
                            icon="tabler-plus"
                            variant="tonal"
                            size="small"
                            @click="addEmailFromInput"
                          />
                        </template>
                      </VTextField>

                      <div class="mt-3">
                        <VChip
                          v-for="(email, index) in exportConfig.delivery.emailRecipients"
                          :key="email"
                          closable
                          class="ma-1"
                          @click:close="removeEmailRecipient(index)"
                        >
                          <VIcon
                            icon="tabler-mail"
                            size="16"
                            start
                          />
                          {{ email }}
                        </VChip>
                      </div>
                    </VCardText>
                  </VCard>
                </VCol>
              </template>

              <!-- Configuración cloud -->
              <template v-if="exportConfig.delivery.method === 'cloud'">
                <VCol
                  cols="12"
                  md="6"
                >
                  <VSelect
                    v-model="cloudProvider"
                    label="Proveedor de almacenamiento"
                    :items="[
                      { value: 'drive', title: 'Google Drive' },
                      { value: 'dropbox', title: 'Dropbox' },
                      { value: 's3', title: 'Amazon S3' },
                      { value: 'azure', title: 'Azure Blob' },
                    ]"
                    variant="outlined"
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="6"
                >
                  <VTextField
                    v-model="cloudPath"
                    label="Ruta de destino"
                    placeholder="/reportes/ventas/"
                    variant="outlined"
                  />
                </VCol>
              </template>

              <!-- Configuración API -->
              <template v-if="exportConfig.delivery.method === 'api'">
                <VCol cols="12">
                  <VTextField
                    v-model="apiEndpoint"
                    label="URL del endpoint"
                    placeholder="https://api.ejemplo.com/reportes"
                    variant="outlined"
                  />
                </VCol>
              </template>
            </VRow>
          </VCardText>
        </VCard>
      </VWindowItem>

      <!-- Tab Programación -->
      <VWindowItem value="schedule">
        <VCard variant="outlined">
          <VCardTitle class="d-flex align-center justify-space-between pa-4">
            <div class="d-flex align-center">
              <VIcon
                icon="tabler-calendar-event"
                class="me-2"
              />
              <span>Programación automática</span>
            </div>
            <VSwitch
              v-model="scheduleEnabled"
              color="primary"
              hide-details
            />
          </VCardTitle>

          <VCardText v-if="exportConfig.schedule?.enabled">
            <div class="mb-3">
              <p class="text-body-2 text-medium-emphasis">
                {{ getScheduleDescription() }}
              </p>
            </div>
            <VRow>
              <VCol
                cols="12"
                md="6"
              >
                <VSelect
                  v-model="scheduleFrequency"
                  label="Frecuencia"
                  :items="scheduleFrequencies"
                  item-title="label"
                  item-value="value"
                  variant="outlined"
                />
              </VCol>

              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="scheduleTime"
                  label="Hora de ejecución"
                  type="time"
                  variant="outlined"
                />
              </VCol>

              <VCol
                v-if="scheduleFrequency === 'weekly'"
                cols="12"
                md="6"
              >
                <VSelect
                  v-model="scheduleDayOfWeek"
                  label="Día de la semana"
                  :items="weekDays"
                  variant="outlined"
                />
              </VCol>

              <VCol
                v-if="scheduleFrequency === 'monthly'"
                cols="12"
                md="6"
              >
                <VTextField
                  v-model.number="scheduleDayOfMonth"
                  label="Día del mes"
                  type="number"
                  min="1"
                  max="31"
                  variant="outlined"
                />
              </VCol>

              <VCol
                v-if="scheduleFrequency === 'custom'"
                cols="12"
              >
                <VTextField
                  v-model="scheduleCustomCron"
                  label="Expresión Cron"
                  placeholder="0 0 * * *"
                  variant="outlined"
                  hint="Formato: minuto hora día mes día-semana"
                  persistent-hint
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VWindowItem>

      <!-- Tab Avanzado -->
      <VWindowItem value="advanced">
        <VCard variant="outlined">
          <VCardTitle class="pa-4">
            <VIcon
              icon="tabler-settings"
              class="me-2"
            />
            Configuración avanzada
          </VCardTitle>
          <VCardText>
            <VRow>
              <!-- Plantilla de nombre -->
              <VCol cols="12">
                <VTextField
                  v-model="filenameTemplate"
                  label="Plantilla de nombre de archivo"
                  variant="outlined"
                  hint="Variables disponibles abajo"
                  persistent-hint
                />

                <!-- Configuración general -->
                <VRow class="mt-4">
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VSwitch
                      v-model="compression"
                      label="Comprimir archivos"
                      color="primary"
                      density="compact"
                      @update:model-value="(val: boolean) => updateGeneralConfig('compression', val)"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VSwitch
                      v-model="splitLargeFiles"
                      label="Dividir archivos grandes"
                      color="primary"
                      density="compact"
                      @update:model-value="(val: boolean) => updateGeneralConfig('splitLargeFiles', val)"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model.number="maxFileSize"
                      label="Tamaño máximo (MB)"
                      type="number"
                      min="1"
                      max="1000"
                      variant="outlined"
                      density="compact"
                      @update:model-value="(val: string) => updateGeneralConfig('maxFileSize', parseInt(val))"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VSelect
                      v-model="compressionLevel"
                      label="Nivel de compresión"
                      :items="[
                        { value: 'low', title: 'Baja' },
                        { value: 'medium', title: 'Media' },
                        { value: 'high', title: 'Alta' },
                      ]"
                      variant="outlined"
                      density="compact"
                      @update:model-value="(val: string) => updateGeneralConfig('compressionLevel', val)"
                    />
                  </VCol>
                </VRow>

                <!-- Exportar/Importar configuración -->
                <VDivider class="my-4" />
                <div class="d-flex gap-2">
                  <VBtn
                    variant="outlined"
                    prepend-icon="tabler-download"
                    @click="handleExportConfig"
                  >
                    Exportar configuración
                  </VBtn>
                  <VBtn
                    variant="outlined"
                    prepend-icon="tabler-upload"
                    @click="handleImportConfig"
                  >
                    Importar configuración
                  </VBtn>
                </div>
                <div class="mt-2">
                  <VChip
                    v-for="variable in templateVariables"
                    :key="variable.value"
                    size="small"
                    class="ma-1 cursor-pointer"
                    @click="addTemplateVariable(variable.value)"
                  >
                    {{ variable.value }}
                    <VTooltip
                      activator="parent"
                      location="top"
                    >
                      {{ variable.label }}
                    </VTooltip>
                  </VChip>
                </div>

                <!-- Vista previa del nombre -->
                <VCard
                  variant="tonal"
                  class="mt-3"
                >
                  <VCardText class="pa-3">
                    <div class="d-flex align-center justify-space-between">
                      <span class="text-caption text-medium-emphasis">
                        Vista previa:
                      </span>
                      <VIcon
                        icon="tabler-eye"
                        size="16"
                      />
                    </div>
                    <div class="text-body-2 font-mono mt-1">
                      {{ previewFilename }}
                    </div>
                  </VCardText>
                </VCard>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VWindowItem>
    </VWindow>

    <!-- Diálogo de configuración avanzada -->
    <VDialog
      v-model="showAdvancedDialog"
      max-width="800px"
      persistent
    >
      <VCard>
        <VCardTitle class="d-flex align-center justify-space-between pa-4">
          <div class="d-flex align-center">
            <VIcon
              :icon="editingFormat?.icon"
              :color="editingFormat?.color"
              class="me-2"
            />
            <span>Configuración avanzada - {{ editingFormat?.name }}</span>
          </div>
          <VBtn
            icon="tabler-x"
            variant="text"
            size="small"
            @click="showAdvancedDialog = false"
          />
        </VCardTitle>

        <VCardText v-if="editingFormat">
          <!-- Tabs de configuración -->
          <VTabs v-model="configTab">
            <VTab value="basic">
              <VIcon
                icon="tabler-settings"
                start
              />
              Básico
            </VTab>
            <VTab value="format">
              <VIcon
                icon="tabler-file-type"
                start
              />
              Formato
            </VTab>
            <VTab value="advanced">
              <VIcon
                icon="tabler-tools"
                start
              />
              Avanzado
            </VTab>
          </VTabs>

          <VWindow v-model="configTab">
            <!-- Tab Básico -->
            <VWindowItem value="basic">
              <VRow class="mt-4">
                <VCol cols="12">
                  <h6 class="text-subtitle-1 mb-3">
                    Configuración básica
                  </h6>
                </VCol>
                <VCol
                  cols="12"
                  md="6"
                >
                  <VSwitch
                    v-model="editingFormat.includeHeaders"
                    label="Incluir encabezados"
                    :color="editingFormat.color"
                    density="compact"
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="6"
                >
                  <VSwitch
                    v-model="editingFormat.includeTotals"
                    label="Incluir totales"
                    :color="editingFormat.color"
                    density="compact"
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="6"
                >
                  <VSwitch
                    v-model="editingFormat.includeFilters"
                    label="Incluir filtros aplicados"
                    :color="editingFormat.color"
                    density="compact"
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="6"
                >
                  <VSwitch
                    v-model="editingFormat.includeTimestamp"
                    label="Incluir fecha/hora de generación"
                    :color="editingFormat.color"
                    density="compact"
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="6"
                >
                  <VTextField
                    v-model.number="editingFormat.maxRows"
                    label="Máximo de filas"
                    type="number"
                    min="0"
                    variant="outlined"
                    density="compact"
                    hint="0 = sin límite"
                    persistent-hint
                  />
                </VCol>
              </VRow>
            </VWindowItem>

            <!-- Tab Formato -->
            <VWindowItem value="format">
              <VRow class="mt-4">
                <VCol cols="12">
                  <h6 class="text-subtitle-1 mb-3">
                    Configuración específica del formato
                  </h6>
                </VCol>

                <!-- Excel -->
                <template v-if="editingFormat.id === 'excel'">
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VSwitch
                      v-model="editingFormat.config.includeCharts"
                      label="Incluir gráficos"
                      :color="editingFormat.color"
                      density="compact"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VSwitch
                      v-model="editingFormat.config.autoFilter"
                      label="Autofiltros"
                      :color="editingFormat.color"
                      density="compact"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VSwitch
                      v-model="editingFormat.config.freezePanes"
                      label="Inmovilizar paneles"
                      :color="editingFormat.color"
                      density="compact"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VSwitch
                      v-model="editingFormat.config.alternateRows"
                      label="Filas alternadas"
                      :color="editingFormat.color"
                      density="compact"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model="editingFormat.config.sheetName"
                      label="Nombre de hoja"
                      variant="outlined"
                      density="compact"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model="editingFormat.config.headerColor"
                      label="Color de encabezados"
                      type="color"
                      variant="outlined"
                      density="compact"
                    />
                  </VCol>
                </template>

                <!-- PDF -->
                <template v-if="editingFormat.id === 'pdf'">
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VSelect
                      v-model="editingFormat.config.orientation"
                      label="Orientación"
                      :items="[
                        { value: 'portrait', title: 'Vertical' },
                        { value: 'landscape', title: 'Horizontal' },
                      ]"
                      variant="outlined"
                      density="compact"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VSelect
                      v-model="editingFormat.config.pageSize"
                      label="Tamaño de página"
                      :items="[
                        { value: 'A4', title: 'A4' },
                        { value: 'A3', title: 'A3' },
                        { value: 'Letter', title: 'Carta' },
                        { value: 'Legal', title: 'Legal' },
                        { value: 'Tabloid', title: 'Tabloid' },
                      ]"
                      variant="outlined"
                      density="compact"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VSwitch
                      v-model="editingFormat.config.headerFooter"
                      label="Encabezado y pie de página"
                      :color="editingFormat.color"
                      density="compact"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VSwitch
                      v-model="editingFormat.config.pageNumbers"
                      label="Números de página"
                      :color="editingFormat.color"
                      density="compact"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model="editingFormat.config.watermark"
                      label="Marca de agua"
                      variant="outlined"
                      density="compact"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VSlider
                      v-model="editingFormat.config.watermarkOpacity"
                      label="Opacidad marca de agua"
                      min="0"
                      max="100"
                      step="10"
                      thumb-label
                    />
                  </VCol>
                </template>

                <!-- CSV -->
                <template v-if="editingFormat.id === 'csv'">
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VSelect
                      v-model="editingFormat.config.delimiter"
                      label="Delimitador"
                      :items="[
                        { value: ',', title: 'Coma (,)' },
                        { value: ';', title: 'Punto y coma (;)' },
                        { value: '\t', title: 'Tabulador' },
                        { value: '|', title: 'Pipe (|)' },
                        { value: 'custom', title: 'Personalizado' },
                      ]"
                      variant="outlined"
                      density="compact"
                    />
                  </VCol>
                  <VCol
                    v-if="editingFormat.config.delimiter === 'custom'"
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model="editingFormat.config.customDelimiter"
                      label="Delimitador personalizado"
                      variant="outlined"
                      density="compact"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VSelect
                      v-model="editingFormat.config.encoding"
                      label="Codificación"
                      :items="[
                        { value: 'UTF-8', title: 'UTF-8' },
                        { value: 'ISO-8859-1', title: 'ISO-8859-1' },
                        { value: 'Windows-1252', title: 'Windows-1252' },
                      ]"
                      variant="outlined"
                      density="compact"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VSelect
                      v-model="editingFormat.config.lineEnding"
                      label="Fin de línea"
                      :items="[
                        { value: 'CRLF', title: 'CRLF (Windows)' },
                        { value: 'LF', title: 'LF (Unix)' },
                      ]"
                      variant="outlined"
                      density="compact"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VSwitch
                      v-model="editingFormat.config.quoteStrings"
                      label="Entrecomillar strings"
                      :color="editingFormat.color"
                      density="compact"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VSwitch
                      v-model="editingFormat.config.escapeFormulas"
                      label="Escapar fórmulas"
                      :color="editingFormat.color"
                      density="compact"
                    />
                  </VCol>
                </template>

                <!-- HTML -->
                <template v-if="editingFormat.id === 'html'">
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VSwitch
                      v-model="editingFormat.config.includeStyles"
                      label="Incluir estilos CSS"
                      :color="editingFormat.color"
                      density="compact"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VSwitch
                      v-model="editingFormat.config.responsive"
                      label="Responsive design"
                      :color="editingFormat.color"
                      density="compact"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VSwitch
                      v-model="editingFormat.config.printable"
                      label="Optimizado para impresión"
                      :color="editingFormat.color"
                      density="compact"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VSwitch
                      v-model="editingFormat.config.interactive"
                      label="Elementos interactivos"
                      :color="editingFormat.color"
                      density="compact"
                    />
                  </VCol>
                </template>

                <!-- JSON -->
                <template v-if="editingFormat.id === 'json'">
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VSwitch
                      v-model="editingFormat.config.pretty"
                      label="Formato legible"
                      :color="editingFormat.color"
                      density="compact"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VSwitch
                      v-model="editingFormat.config.includeMetadata"
                      label="Incluir metadatos"
                      :color="editingFormat.color"
                      density="compact"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VSelect
                      v-model="editingFormat.config.dateFormat"
                      label="Formato de fecha"
                      :items="[
                        { value: 'ISO', title: 'ISO 8601' },
                        { value: 'timestamp', title: 'Timestamp UNIX' },
                        { value: 'custom', title: 'Personalizado' },
                      ]"
                      variant="outlined"
                      density="compact"
                    />
                  </VCol>
                  <VCol
                    v-if="editingFormat.config.dateFormat === 'custom'"
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model="editingFormat.config.customDateFormat"
                      label="Formato personalizado"
                      variant="outlined"
                      density="compact"
                      hint="Ej: YYYY-MM-DD HH:mm:ss"
                      persistent-hint
                    />
                  </VCol>
                </template>

                <!-- XML -->
                <template v-if="editingFormat.id === 'xml'">
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model="editingFormat.config.rootElement"
                      label="Elemento raíz"
                      variant="outlined"
                      density="compact"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model="editingFormat.config.rowElement"
                      label="Elemento de fila"
                      variant="outlined"
                      density="compact"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VSwitch
                      v-model="editingFormat.config.prettyPrint"
                      label="Formato legible"
                      :color="editingFormat.color"
                      density="compact"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VSwitch
                      v-model="editingFormat.config.includeSchema"
                      label="Incluir esquema XSD"
                      :color="editingFormat.color"
                      density="compact"
                    />
                  </VCol>
                </template>
              </VRow>
            </VWindowItem>

            <!-- Tab Avanzado -->
            <VWindowItem value="advanced">
              <VRow class="mt-4">
                <VCol cols="12">
                  <h6 class="text-subtitle-1 mb-3">
                    Configuración avanzada
                  </h6>
                </VCol>
                <VCol cols="12">
                  <VAlert
                    type="info"
                    variant="tonal"
                    class="mb-4"
                  >
                    <template #prepend>
                      <VIcon icon="tabler-info-circle" />
                    </template>
                    <div>
                      <strong>Configuración avanzada</strong><br>
                      Estas opciones permiten un control granular sobre el formato de exportación.
                      Se recomienda mantener los valores por defecto a menos que se requiera una configuración específica.
                    </div>
                  </VAlert>
                </VCol>
              </VRow>
            </VWindowItem>
          </VWindow>
        </VCardText>

        <VCardActions class="pa-4">
          <VSpacer />
          <VBtn
            variant="text"
            @click="showAdvancedDialog = false"
          >
            Cancelar
          </VBtn>
          <VBtn
            color="primary"
            @click="_saveAdvancedConfig"
          >
            Guardar
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
.report-export-advanced {
  .format-card {
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

  .list-enter-active,
  .list-leave-active {
    transition: all 0.3s ease;
  }

  .list-enter-from {
    opacity: 0;
    transform: translateY(30px);
  }

  .list-leave-to {
    opacity: 0;
    transform: translateY(-30px);
  }

  .cursor-pointer {
    cursor: pointer;
  }

  .v-card {
    transition: all 0.3s ease;
  }

  .v-tabs {
    .v-tab {
      font-weight: 500;
      text-transform: none;
    }
  }

  .v-switch {
    .v-label {
      font-size: 0.875rem;
    }
  }

  .v-text-field,
  .v-select {
    .v-field__input {
      font-size: 0.875rem;
    }
  }

  .v-chip {
    transition: all 0.2s ease;

    &:hover {
      transform: scale(1.05);
    }
  }

  .v-alert {
    border-radius: 8px;
  }

  .v-slider {
    .v-slider-track__fill {
      background-color: rgb(var(--v-theme-primary));
    }
  }
}
</style>
