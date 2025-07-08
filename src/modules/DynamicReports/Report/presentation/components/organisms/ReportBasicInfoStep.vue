<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'

interface Props {
  modelValue: {
    name: string
    description: string
    dataSourceId: string
    isActive: boolean
    isPublic: boolean
  }
  dataSources: Array<{ id: string; name: string }>
  loading?: boolean
  error?: string | null
}

interface Emits {
  (e: 'update:modelValue', value: any): void
  (e: 'next'): void
  (e: 'validate', isValid: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
})

const emit = defineEmits<Emits>()
const { t } = useI18n()

console.log('Montando Paso: ReportBasicInfoStep')

// Validation schema
const schema = toTypedSchema(z.object({
  name: z.string().min(1, t('validations.required', { field: t('DynamicReports.report.fields.name') })),
  description: z.string().optional(),
  dataSourceId: z.string().min(1, t('validations.required', { field: t('DynamicReports.report.fields.dataSource') })),
  isActive: z.boolean(),
  isPublic: z.boolean(),
}))

const { handleSubmit, errors, values, setFieldValue, setValues } = useForm({
  validationSchema: schema,
  initialValues: props.modelValue,
})

// Watch for changes and emit updates
watch(values, newValues => {
  emit('update:modelValue', newValues)
}, { deep: true })

// Sync form values with modelValue when it changes (for store reactivity)
watch(() => props.modelValue, newVal => {
  setValues(newVal)
}, { deep: true })

// Validate step
const validateStep = () => {
  const isValid = !errors.value.name && !errors.value.dataSourceId && values.value.name && values.value.dataSourceId

  emit('validate', isValid)

  return isValid
}

const handleNext = () => {
  if (validateStep())
    emit('next')
}

// Computed
const dataSourceOptions = computed(() => {
  return props.dataSources.map(ds => ({
    title: ds.name,
    value: ds.id,
  }))
})
</script>

<template>
  <div>
    <VRow>
      <VCol cols="12">
        <h6 class="text-h6 font-weight-medium">
          {{ $t('DynamicReports.report.wizard.step1.title') }}
        </h6>
        <p class="mb-0">
          {{ $t('DynamicReports.report.wizard.step1.description') }}
        </p>
      </VCol>

      <VCol
        cols="12"
        md="6"
      >
        <AppTextField
          :model-value="values.name"
          :error-messages="errors.name"
          :label="$t('DynamicReports.report.fields.name')"
          :placeholder="$t('DynamicReports.report.placeholders.name')"
          required
          prepend-inner-icon="tabler-file-text"
          @update:model-value="val => setFieldValue('name', val)"
        />
      </VCol>

      <VCol
        cols="12"
        md="6"
      >
        <AppSelect
          :model-value="values.dataSourceId"
          :error-messages="errors.dataSourceId"
          :label="$t('DynamicReports.report.fields.dataSource')"
          :placeholder="$t('DynamicReports.report.placeholders.dataSource')"
          :items="dataSourceOptions"
          :loading="loading"
          required
          prepend-inner-icon="tabler-database"
          @update:model-value="val => setFieldValue('dataSourceId', val)"
        />
      </VCol>

      <VCol cols="12">
        <AppTextarea
          :model-value="values.description"
          :label="$t('DynamicReports.report.fields.description')"
          :placeholder="$t('DynamicReports.report.placeholders.description')"
          type="textarea"
          rows="3"
          prepend-inner-icon="tabler-align-left"
          @update:model-value="val => setFieldValue('description', val)"
        />
      </VCol>

      <VCol
        cols="12"
        md="6"
      >
        <VSwitch
          :model-value="values.isActive"
          :label="$t('DynamicReports.report.fields.isActive')"
          color="primary"
          @update:model-value="val => setFieldValue('isActive', val)"
        />
      </VCol>

      <VCol
        cols="12"
        md="6"
      >
        <VSwitch
          :model-value="values.isPublic"
          :label="$t('DynamicReports.report.fields.isPublic')"
          color="primary"
          @update:model-value="val => setFieldValue('isPublic', val)"
        />
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
