<script setup lang="ts">
import type { FileFormat } from '../../../domain/entities/Connection'

interface Props {
  modelValue: {
    file_path: string
    file_config: {
      format: FileFormat
      delimiter?: string
      has_header?: boolean
      encoding?: string
      date_format?: string
    }
  }
  errors?: Record<string, string>
  disabled?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: Props['modelValue']): void
}

const props = withDefaults(defineProps<Props>(), {
  errors: () => ({}),
  disabled: false,
})

const emit = defineEmits<Emits>()

const formatOptions = [
  { title: 'CSV', value: 'csv' },
  { title: 'Excel (.xlsx, .xls)', value: 'excel' },
  { title: 'JSON', value: 'json' },
  { title: 'XML', value: 'xml' },
]

const encodingOptions = [
  { title: 'UTF-8', value: 'utf-8' },
  { title: 'UTF-16', value: 'utf-16' },
  { title: 'ISO-8859-1', value: 'iso-8859-1' },
  { title: 'Windows-1252', value: 'windows-1252' },
]

const delimiterOptions = [
  { title: 'Comma (,)', value: ',' },
  { title: 'Semicolon (;)', value: ';' },
  { title: 'Tab', value: '\t' },
  { title: 'Pipe (|)', value: '|' },
]

// Update individual field
function updateField(field: keyof Props['modelValue'], value: any) {
  const updated = { ...props.modelValue, [field]: value }

  emit('update:modelValue', updated)
}

// Update file config field
function updateFileConfig(field: string, value: any) {
  const updated = {
    ...props.modelValue,
    file_config: {
      ...props.modelValue.file_config,
      [field]: value,
    },
  }

  emit('update:modelValue', updated)
}

// Set default delimiter based on format
watch(() => props.modelValue.file_config.format, newFormat => {
  if (newFormat === 'csv' && !props.modelValue.file_config.delimiter)
    updateFileConfig('delimiter', ',')
}, { immediate: true })
</script>

<template>
  <div class="file-config">
    <VCard
      variant="outlined"
      class="pa-4"
    >
      <VCardTitle class="text-h6 mb-4">
        <VIcon
          icon="mdi-file"
          class="me-2"
        />
        File Configuration
      </VCardTitle>

      <div class="d-flex flex-column gap-4">
        <!-- File Format -->
        <VSelect
          :model-value="modelValue.file_config?.format"
          label="File Format"
          :items="formatOptions"
          :error-messages="errors?.['file_config.format']"
          density="comfortable"
          hide-details="auto"
          @update:model-value="val => updateFileConfig('format', val)"
        />

        <!-- Delimiter -->
        <VSelect
          v-if="modelValue.file_config?.format === 'csv'"
          :model-value="modelValue.file_config?.delimiter"
          label="Delimiter"
          :items="delimiterOptions"
          :error-messages="errors?.['file_config.delimiter']"
          density="comfortable"
          hide-details="auto"
          @update:model-value="val => updateFileConfig('delimiter', val)"
        />

        <!-- Encoding -->
        <VSelect
          :model-value="modelValue.file_config?.encoding"
          label="File Encoding"
          :items="encodingOptions"
          :error-messages="errors?.['file_config.encoding']"
          density="comfortable"
          hide-details="auto"
          @update:model-value="val => updateFileConfig('encoding', val)"
        />

        <!-- Has Header -->
        <VSwitch
          :model-value="modelValue.file_config?.has_header"
          label="File has header row"
          :error-messages="errors?.['file_config.has_header']"
          density="comfortable"
          hide-details="auto"
          @update:model-value="val => updateFileConfig('has_header', val)"
        />

        <!-- Date Format -->
        <VTextField
          :model-value="modelValue.file_config?.date_format"
          label="Date Format"
          :error-messages="errors?.['file_config.date_format']"
          density="comfortable"
          hide-details="auto"
          placeholder="Y-m-d H:i:s"
          @update:model-value="val => updateFileConfig('date_format', val)"
        />

        <div class="text-caption text-medium-emphasis">
          PHP date format (e.g., Y-m-d, d/m/Y, Y-m-d H:i:s)
        </div>

        <!-- File Preview Info -->
        <VAlert
          v-if="modelValue.file_path"
          type="info"
          variant="tonal"
          border="start"
          class="mt-2"
        >
          <template #prepend>
            <VIcon icon="mdi-information" />
          </template>
          <div class="text-body-2">
            <strong>File Path:</strong> {{ modelValue.file_path }}<br>
            <strong>Format:</strong> {{ modelValue.file_config.format.toUpperCase() }}<br>
            <strong>Encoding:</strong> {{ modelValue.file_config.encoding || 'UTF-8' }}<br>
            <strong>Has Header:</strong> {{ modelValue.file_config.has_header ? 'Yes' : 'No' }}
            <span v-if="modelValue.file_config.format === 'csv'">
              <br><strong>Delimiter:</strong> {{ modelValue.file_config.delimiter || ',' }}
            </span>
          </div>
        </VAlert>
      </div>
    </VCard>
  </div>
</template>

<style scoped>
.file-config {
  inline-size: 100%;
}
</style>
