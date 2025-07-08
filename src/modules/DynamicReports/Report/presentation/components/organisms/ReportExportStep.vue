<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({
    excel: { enabled: true, includeCharts: false, autoFilter: true, includeHeaders: true, includeTotals: true },
    pdf: { enabled: true, orientation: 'portrait', pageSize: 'A4', margins: 10, includeHeaders: true, includeTotals: true },
    csv: { enabled: true, delimiter: ',', encoding: 'UTF-8', includeHeaders: true },
    general: { filenameTemplate: 'report_{date}_{time}', compressionLevel: 'medium' },
  }),
  loading: false,
  error: null,
})

const emit = defineEmits<Emits>()

console.log('Montando Paso: ReportExportStep')

interface ExportConfig {
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

interface Props {
  modelValue: ExportConfig
  loading?: boolean
  error?: string | null
}

interface Emits {
  (e: 'update:modelValue', value: ExportConfig): void
  (e: 'next'): void
  (e: 'prev'): void
  (e: 'validate', isValid: boolean): void
}

const { t } = useI18n()

// Validation schema
const schema = toTypedSchema(z.object({
  excel: z.object({
    enabled: z.boolean(),
    includeCharts: z.boolean(),
    autoFilter: z.boolean(),
    includeHeaders: z.boolean(),
    includeTotals: z.boolean(),
  }),
  pdf: z.object({
    enabled: z.boolean(),
    orientation: z.enum(['portrait', 'landscape']),
    pageSize: z.enum(['A4', 'A3', 'Letter']),
    margins: z.number().min(5).max(50),
    includeHeaders: z.boolean(),
    includeTotals: z.boolean(),
  }),
  csv: z.object({
    enabled: z.boolean(),
    delimiter: z.string(),
    encoding: z.enum(['UTF-8', 'ISO-8859-1']),
    includeHeaders: z.boolean(),
  }),
  general: z.object({
    filenameTemplate: z.string(),
    compressionLevel: z.enum(['none', 'low', 'medium', 'high']),
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
  const isValid = values.value.excel.enabled || values.value.pdf.enabled || values.value.csv.enabled

  emit('validate', isValid)

  return isValid
}

const handleNext = () => {
  if (validateStep())
    emit('next')
}

const handlePrev = () => {
  emit('prev')
}

// Computed
const enabledFormats = computed(() => {
  const formats = []

  if (values.value.excel.enabled) {
    formats.push({
      name: 'excel',
      label: t('DynamicReports.report.export.excel.title'),
      color: 'success',
    })
  }

  if (values.value.pdf.enabled) {
    formats.push({
      name: 'pdf',
      label: t('DynamicReports.report.export.pdf.title'),
      color: 'error',
    })
  }

  if (values.value.csv.enabled) {
    formats.push({
      name: 'csv',
      label: t('DynamicReports.report.export.csv.title'),
      color: 'info',
    })
  }

  return formats
})

const orientationOptions = [
  { title: t('DynamicReports.report.export.pdf.portrait'), value: 'portrait' },
  { title: t('DynamicReports.report.export.pdf.landscape'), value: 'landscape' },
]

const pageSizeOptions = [
  { title: 'A4 (210 × 297 mm)', value: 'A4' },
  { title: 'A3 (297 × 420 mm)', value: 'A3' },
  { title: 'Letter (216 × 279 mm)', value: 'Letter' },
]

const delimiterOptions = [
  { title: 'Comma (,)', value: ',' },
  { title: 'Semicolon (;)', value: ';' },
  { title: 'Tab', value: '\t' },
  { title: 'Pipe (|)', value: '|' },
]

const encodingOptions = [
  { title: 'UTF-8', value: 'UTF-8' },
  { title: 'ISO-8859-1 (Latin-1)', value: 'ISO-8859-1' },
]

const compressionOptions = [
  { title: t('DynamicReports.report.export.compression.none'), value: 'none' },
  { title: t('DynamicReports.report.export.compression.low'), value: 'low' },
  { title: t('DynamicReports.report.export.compression.medium'), value: 'medium' },
  { title: t('DynamicReports.report.export.compression.high'), value: 'high' },
]

// Methods
const toggleFormat = (format: string) => {
  switch (format) {
  case 'excel':
    setFieldValue('excel.enabled', !values.value.excel.enabled)
    break
  case 'pdf':
    setFieldValue('pdf.enabled', !values.value.pdf.enabled)
    break
  case 'csv':
    setFieldValue('csv.enabled', !values.value.csv.enabled)
    break
  }
}

const getFormatIcon = (format: string) => {
  const icons = {
    excel: 'tabler-file-spreadsheet',
    pdf: 'tabler-file-type-pdf',
    csv: 'tabler-file-text',
  }

  return icons[format] || 'tabler-file'
}

const getFormatColor = (format: string) => {
  const colors = {
    excel: 'success',
    pdf: 'error',
    csv: 'info',
  }

  return colors[format] || 'primary'
}
</script>

<template>
  <div>
    <VRow>
      <VCol cols="12">
        <h6 class="text-h6 font-weight-medium">
          {{ $t('DynamicReports.report.wizard.step5.title') }}
        </h6>
        <p class="mb-0">
          {{ $t('DynamicReports.report.wizard.step5.description') }}
        </p>
      </VCol>

      <!-- Formatos Habilitados -->
      <VCol cols="12">
        <VCard variant="outlined">
          <VCardTitle class="text-h6">
            <VIcon
              icon="tabler-download"
              class="me-2"
            />
            {{ $t('DynamicReports.report.export.enabled_formats') }}
          </VCardTitle>
          <VCardText>
            <VRow>
              <VCol
                v-for="format in ['excel', 'pdf', 'csv']"
                :key="format"
                cols="12"
                md="4"
              >
                <VCard
                  variant="outlined"
                  :class="{ 'border-primary': values[format].enabled }"
                  class="pa-4 cursor-pointer"
                  @click="toggleFormat(format)"
                >
                  <div class="d-flex align-center justify-space-between">
                    <div class="d-flex align-center">
                      <VIcon
                        :icon="getFormatIcon(format)"
                        :color="getFormatColor(format)"
                        size="24"
                        class="me-3"
                      />
                      <div>
                        <div class="text-subtitle-1 font-weight-medium">
                          {{ $t(`DynamicReports.report.export.${format}.title`) }}
                        </div>
                        <div class="text-caption text-medium-emphasis">
                          {{ $t(`DynamicReports.report.export.${format}.description`) }}
                        </div>
                      </div>
                    </div>
                    <VSwitch
                      :model-value="values[format].enabled"
                      :color="getFormatColor(format)"
                      @update:model-value="val => setFieldValue(`${format}.enabled`, val)"
                    />
                  </div>
                </VCard>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Configuración Excel -->
      <VCol
        v-if="values.excel.enabled"
        cols="12"
      >
        <VCard variant="outlined">
          <VCardTitle class="text-h6">
            <VIcon
              icon="tabler-file-spreadsheet"
              color="success"
              class="me-2"
            />
            {{ $t('DynamicReports.report.export.excel.title') }}
          </VCardTitle>
          <VCardText>
            <VRow>
              <VCol
                cols="12"
                md="6"
              >
                <VSwitch
                  :model-value="values.excel.includeCharts"
                  :label="$t('DynamicReports.report.export.excel.include_charts')"
                  color="success"
                  @update:model-value="val => setFieldValue('excel.includeCharts', val)"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <VSwitch
                  :model-value="values.excel.autoFilter"
                  :label="$t('DynamicReports.report.export.excel.auto_filter')"
                  color="success"
                  @update:model-value="val => setFieldValue('excel.autoFilter', val)"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <VSwitch
                  :model-value="values.excel.includeHeaders"
                  :label="$t('DynamicReports.report.export.include_headers')"
                  color="success"
                  @update:model-value="val => setFieldValue('excel.includeHeaders', val)"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <VSwitch
                  :model-value="values.excel.includeTotals"
                  :label="$t('DynamicReports.report.export.include_totals')"
                  color="success"
                  @update:model-value="val => setFieldValue('excel.includeTotals', val)"
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Configuración PDF -->
      <VCol
        v-if="values.pdf.enabled"
        cols="12"
      >
        <VCard variant="outlined">
          <VCardTitle class="text-h6">
            <VIcon
              icon="tabler-file-type-pdf"
              color="error"
              class="me-2"
            />
            {{ $t('DynamicReports.report.export.pdf.title') }}
          </VCardTitle>
          <VCardText>
            <VRow>
              <VCol
                cols="12"
                md="6"
              >
                <AppSelect
                  :model-value="values.pdf.orientation"
                  :label="$t('DynamicReports.report.export.pdf.orientation')"
                  :items="orientationOptions"
                  @update:model-value="val => setFieldValue('pdf.orientation', val)"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <AppSelect
                  :model-value="values.pdf.pageSize"
                  :label="$t('DynamicReports.report.export.pdf.page_size')"
                  :items="pageSizeOptions"
                  @update:model-value="val => setFieldValue('pdf.pageSize', val)"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  :model-value="values.pdf.margins"
                  :label="$t('DynamicReports.report.export.pdf.margins')"
                  type="number"
                  min="5"
                  max="50"
                  suffix="mm"
                  @update:model-value="val => setFieldValue('pdf.margins', parseInt(val))"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <VSwitch
                  :model-value="values.pdf.includeHeaders"
                  :label="$t('DynamicReports.report.export.include_headers')"
                  color="error"
                  @update:model-value="val => setFieldValue('pdf.includeHeaders', val)"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <VSwitch
                  :model-value="values.pdf.includeTotals"
                  :label="$t('DynamicReports.report.export.include_totals')"
                  color="error"
                  @update:model-value="val => setFieldValue('pdf.includeTotals', val)"
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Configuración CSV -->
      <VCol
        v-if="values.csv.enabled"
        cols="12"
      >
        <VCard variant="outlined">
          <VCardTitle class="text-h6">
            <VIcon
              icon="tabler-file-text"
              color="info"
              class="me-2"
            />
            {{ $t('DynamicReports.report.export.csv.title') }}
          </VCardTitle>
          <VCardText>
            <VRow>
              <VCol
                cols="12"
                md="6"
              >
                <AppSelect
                  :model-value="values.csv.delimiter"
                  :label="$t('DynamicReports.report.export.csv.delimiter')"
                  :items="delimiterOptions"
                  @update:model-value="val => setFieldValue('csv.delimiter', val)"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <AppSelect
                  :model-value="values.csv.encoding"
                  :label="$t('DynamicReports.report.export.csv.encoding')"
                  :items="encodingOptions"
                  @update:model-value="val => setFieldValue('csv.encoding', val)"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <VSwitch
                  :model-value="values.csv.includeHeaders"
                  :label="$t('DynamicReports.report.export.include_headers')"
                  color="info"
                  @update:model-value="val => setFieldValue('csv.includeHeaders', val)"
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Configuración General -->
      <VCol cols="12">
        <VCard variant="outlined">
          <VCardTitle class="text-h6">
            <VIcon
              icon="tabler-settings"
              class="me-2"
            />
            {{ $t('DynamicReports.report.export.general_settings') }}
          </VCardTitle>
          <VCardText>
            <VRow>
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  :model-value="values.general.filenameTemplate"
                  :label="$t('DynamicReports.report.export.filename_template')"
                  :placeholder="$t('DynamicReports.report.export.filename_template_placeholder')"
                  @update:model-value="val => setFieldValue('general.filenameTemplate', val)"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <AppSelect
                  :model-value="values.general.compressionLevel"
                  :label="$t('DynamicReports.report.export.compression_level')"
                  :items="compressionOptions"
                  @update:model-value="val => setFieldValue('general.compressionLevel', val)"
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

    <VAlert
      v-if="!values.excel.enabled && !values.pdf.enabled && !values.csv.enabled"
      type="warning"
      variant="tonal"
      class="mt-4"
    >
      {{ $t('DynamicReports.report.export.no_formats_enabled') }}
    </VAlert>
  </div>
</template>
