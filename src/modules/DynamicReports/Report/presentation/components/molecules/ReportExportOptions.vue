<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useReportValidation } from '@/modules/DynamicReports/Report/presentation/composables/useReportValidation'

// Props
interface Props {
  modelValue: {
    excel: {
      enabled: boolean
      includeCharts: boolean
      autoFilter: boolean
    }
    pdf: {
      enabled: boolean
      orientation: 'portrait' | 'landscape'
      pageSize: 'A4' | 'A3' | 'Letter'
      margins: number
    }
    csv: {
      enabled: boolean
      delimiter: string
      encoding: 'UTF-8' | 'ISO-8859-1'
    }
  }
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: Props['modelValue']]
  validation: [isValid: boolean]
}>()

// Composables
const { t } = useI18n()
const { validateExportOptions, validationErrors } = useReportValidation()

// Estado local
const includeHeaders = ref(true)
const includeTotals = ref(false)
const filenameTemplate = ref('report_{date}_{time}')
const compressionLevel = ref('medium')

// Computed
const enabledFormats = computed(() => {
  const formats = []

  if (props.modelValue.excel.enabled) {
    formats.push({
      name: 'excel',
      label: t('DynamicReports.report.export.excel.title'),
      color: 'success',
    })
  }

  if (props.modelValue.pdf.enabled) {
    formats.push({
      name: 'pdf',
      label: t('DynamicReports.report.export.pdf.title'),
      color: 'error',
    })
  }

  if (props.modelValue.csv.enabled) {
    formats.push({
      name: 'csv',
      label: t('DynamicReports.report.export.csv.title'),
      color: 'info',
    })
  }

  return formats
})

const orientationOptions = [
  { value: 'portrait', title: t('DynamicReports.report.export.pdf.portrait') },
  { value: 'landscape', title: t('DynamicReports.report.export.pdf.landscape') },
]

const pageSizeOptions = [
  { value: 'A4', title: 'A4 (210 × 297 mm)' },
  { value: 'A3', title: 'A3 (297 × 420 mm)' },
  { value: 'Letter', title: 'Letter (216 × 279 mm)' },
]

const delimiterOptions = [
  { value: ',', title: 'Comma (,)' },
  { value: ';', title: 'Semicolon (;)' },
  { value: '\t', title: 'Tab' },
  { value: '|', title: 'Pipe (|)' },
]

const encodingOptions = [
  { value: 'UTF-8', title: 'UTF-8' },
  { value: 'ISO-8859-1', title: 'ISO-8859-1 (Latin-1)' },
]

const compressionOptions = [
  { value: 'none', title: t('DynamicReports.report.export.compression.none') },
  { value: 'low', title: t('DynamicReports.report.export.compression.low') },
  { value: 'medium', title: t('DynamicReports.report.export.compression.medium') },
  { value: 'high', title: t('DynamicReports.report.export.compression.high') },
]

// Métodos
const getFormatIcon = (format: string) => {
  const icons = {
    excel: 'tabler-file-spreadsheet',
    pdf: 'tabler-file-type-pdf',
    csv: 'tabler-file-text',
  }

  return icons[format as keyof typeof icons] || 'tabler-file'
}

const getFormatColor = (format: string) => {
  const colors = {
    excel: 'success',
    pdf: 'error',
    csv: 'info',
  }

  return colors[format as keyof typeof colors] || 'primary'
}

const toggleFormat = (format: string) => {
  const updatedValue = { ...props.modelValue }

  switch (format) {
  case 'excel':
    updatedValue.excel.enabled = !updatedValue.excel.enabled
    break
  case 'pdf':
    updatedValue.pdf.enabled = !updatedValue.pdf.enabled
    break
  case 'csv':
    updatedValue.csv.enabled = !updatedValue.csv.enabled
    break
  }

  emit('update:modelValue', updatedValue)
  validateExportOptionsLocal()
}

const validateExportOptionsLocal = async () => {
  const errors = await validateExportOptions(props.modelValue)
  const isValid = errors.length === 0

  emit('validation', isValid)
}

// Observar cambios en el modelo
watch(() => props.modelValue, validateExportOptionsLocal, { deep: true })

// Validación inicial
onMounted(() => {
  validateExportOptionsLocal()
})
</script>

<template>
  <div class="report-export-options">
    <!-- Header -->
    <div class="d-flex align-center mb-4">
      <VIcon
        icon="tabler-download"
        color="primary"
        size="24"
        class="mr-3"
      />
      <div>
        <h5 class="text-h6 font-weight-medium">
          {{ t('DynamicReports.report.export.title') }}
        </h5>
        <p class="text-body-2 text-medium-emphasis">
          {{ t('DynamicReports.report.export.description') }}
        </p>
      </div>
    </div>

    <!-- Excel Export -->
    <VCard class="mb-4">
      <VCardTitle class="d-flex align-center">
        <VIcon
          icon="tabler-file-spreadsheet"
          color="success"
          size="20"
          class="mr-2"
        />
        {{ t('DynamicReports.report.export.excel.title') }}
        <VSpacer />
        <VSwitch
          v-model="modelValue.excel.enabled"
          color="success"
          hide-details
          @update:model-value="validateExportOptionsLocal"
        />
      </VCardTitle>

      <VCardText v-if="modelValue.excel.enabled">
        <VRow>
          <VCol
            cols="12"
            md="6"
          >
            <VSwitch
              v-model="modelValue.excel.includeCharts"
              :label="t('DynamicReports.report.export.excel.include_charts')"
              color="success"
              hide-details
              @update:model-value="validateExportOptionsLocal"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <VSwitch
              v-model="modelValue.excel.autoFilter"
              :label="t('DynamicReports.report.export.excel.auto_filter')"
              color="success"
              hide-details
              @update:model-value="validateExportOptionsLocal"
            />
          </VCol>
        </VRow>

        <VRow class="mt-2">
          <VCol cols="12">
            <VAlert
              type="info"
              variant="tonal"
              class="mb-0"
            >
              <template #prepend>
                <VIcon icon="tabler-info-circle" />
              </template>
              <p class="text-caption mb-0">
                {{ t('DynamicReports.report.export.excel.info') }}
              </p>
            </VAlert>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- PDF Export -->
    <VCard class="mb-4">
      <VCardTitle class="d-flex align-center">
        <VIcon
          icon="tabler-file-type-pdf"
          color="error"
          size="20"
          class="mr-2"
        />
        {{ t('DynamicReports.report.export.pdf.title') }}
        <VSpacer />
        <VSwitch
          v-model="modelValue.pdf.enabled"
          color="error"
          hide-details
          @update:model-value="validateExportOptionsLocal"
        />
      </VCardTitle>

      <VCardText v-if="modelValue.pdf.enabled">
        <VRow>
          <VCol
            cols="12"
            md="6"
          >
            <VSelect
              v-model="modelValue.pdf.orientation"
              :label="t('DynamicReports.report.export.pdf.orientation')"
              variant="outlined"
              :items="orientationOptions"
              @update:model-value="validateExportOptionsLocal"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <VSelect
              v-model="modelValue.pdf.pageSize"
              :label="t('DynamicReports.report.export.pdf.page_size')"
              variant="outlined"
              :items="pageSizeOptions"
              @update:model-value="validateExportOptionsLocal"
            />
          </VCol>
        </VRow>

        <VRow>
          <VCol
            cols="12"
            md="6"
          >
            <VSlider
              v-model="modelValue.pdf.margins"
              :label="t('DynamicReports.report.export.pdf.margins')"
              :min="5"
              :max="50"
              :step="5"
              thumb-label
              @update:model-value="validateExportOptionsLocal"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model.number="modelValue.pdf.margins"
              :label="t('DynamicReports.report.export.pdf.margins_value')"
              variant="outlined"
              type="number"
              :min="5"
              :max="50"
              suffix="mm"
              @update:model-value="validateExportOptionsLocal"
            />
          </VCol>
        </VRow>

        <VRow class="mt-2">
          <VCol cols="12">
            <VAlert
              type="info"
              variant="tonal"
              class="mb-0"
            >
              <template #prepend>
                <VIcon icon="tabler-info-circle" />
              </template>
              <p class="text-caption mb-0">
                {{ t('DynamicReports.report.export.pdf.info') }}
              </p>
            </VAlert>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- CSV Export -->
    <VCard class="mb-4">
      <VCardTitle class="d-flex align-center">
        <VIcon
          icon="tabler-file-text"
          color="info"
          size="20"
          class="mr-2"
        />
        {{ t('DynamicReports.report.export.csv.title') }}
        <VSpacer />
        <VSwitch
          v-model="modelValue.csv.enabled"
          color="info"
          hide-details
          @update:model-value="validateExportOptionsLocal"
        />
      </VCardTitle>

      <VCardText v-if="modelValue.csv.enabled">
        <VRow>
          <VCol
            cols="12"
            md="6"
          >
            <VSelect
              v-model="modelValue.csv.delimiter"
              :label="t('DynamicReports.report.export.csv.delimiter')"
              variant="outlined"
              :items="delimiterOptions"
              @update:model-value="validateExportOptionsLocal"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <VSelect
              v-model="modelValue.csv.encoding"
              :label="t('DynamicReports.report.export.csv.encoding')"
              variant="outlined"
              :items="encodingOptions"
              @update:model-value="validateExportOptionsLocal"
            />
          </VCol>
        </VRow>

        <VRow class="mt-2">
          <VCol cols="12">
            <VAlert
              type="info"
              variant="tonal"
              class="mb-0"
            >
              <template #prepend>
                <VIcon icon="tabler-info-circle" />
              </template>
              <p class="text-caption mb-0">
                {{ t('DynamicReports.report.export.csv.info') }}
              </p>
            </VAlert>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Preview de Exportación -->
    <VCard
      class="mt-4"
      variant="tonal"
    >
      <VCardTitle class="d-flex align-center">
        <VIcon
          icon="tabler-eye"
          size="20"
          class="mr-2"
        />
        {{ t('DynamicReports.report.export.preview') }}
      </VCardTitle>

      <VCardText>
        <div class="export-preview">
          <div
            v-if="enabledFormats.length === 0"
            class="text-center py-4"
          >
            <VIcon
              icon="tabler-download-off"
              size="32"
              color="grey"
              class="mb-2"
            />
            <p class="text-body-2 text-medium-emphasis">
              {{ t('DynamicReports.report.export.no_formats_enabled') }}
            </p>
          </div>

          <div
            v-else
            class="enabled-formats"
          >
            <VChip
              v-for="format in enabledFormats"
              :key="format.name"
              :color="getFormatColor(format.name)"
              variant="tonal"
              class="ma-1"
            >
              <VIcon
                :icon="getFormatIcon(format.name)"
                size="16"
                class="mr-1"
              />
              {{ format.label }}
              <VBtn
                icon
                variant="text"
                size="x-small"
                class="ml-1"
                @click="toggleFormat(format.name)"
              >
                <VIcon
                  icon="tabler-x"
                  size="12"
                />
              </VBtn>
            </VChip>
          </div>
        </div>
      </VCardText>
    </VCard>

    <!-- Opciones Avanzadas -->
    <VCard class="mt-4">
      <VCardTitle class="d-flex align-center">
        <VIcon
          icon="tabler-settings"
          size="20"
          class="mr-2"
        />
        {{ t('DynamicReports.report.export.advanced_options') }}
      </VCardTitle>

      <VCardText>
        <VRow>
          <VCol
            cols="12"
            md="6"
          >
            <VSwitch
              v-model="includeHeaders"
              :label="t('DynamicReports.report.export.include_headers')"
              color="primary"
              hide-details
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <VSwitch
              v-model="includeTotals"
              :label="t('DynamicReports.report.export.include_totals')"
              color="primary"
              hide-details
            />
          </VCol>
        </VRow>

        <VRow>
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="filenameTemplate"
              :label="t('DynamicReports.report.export.filename_template')"
              variant="outlined"
              :placeholder="t('DynamicReports.report.export.filename_placeholder')"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <VSelect
              v-model="compressionLevel"
              :label="t('DynamicReports.report.export.compression_level')"
              variant="outlined"
              :items="compressionOptions"
            />
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Validation Messages -->
    <VAlert
      v-if="validationErrors.length > 0"
      type="warning"
      variant="tonal"
      class="mt-4"
    >
      <template #prepend>
        <VIcon icon="tabler-alert-triangle" />
      </template>
      <div>
        <p class="font-weight-medium mb-2">
          {{ t('validation.export_errors') }}
        </p>
        <ul class="mb-0">
          <li
            v-for="error in validationErrors"
            :key="error.field"
            class="text-caption"
          >
            {{ error.message }}
          </li>
        </ul>
      </div>
    </VAlert>
  </div>
</template>

<style scoped>
.report-export-options {
  inline-size: 100%;
}

.export-preview {
  min-block-size: 100px;
}

.enabled-formats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

:deep(.v-card) {
  transition: all 0.2s ease;
}

:deep(.v-card:hover) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 10%);
}

:deep(.v-slider) {
  margin-block-start: 8px;
}
</style>
