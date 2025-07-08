<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({
    primary: { field: '', direction: 'ASC' },
    secondary: undefined,
    tertiary: undefined,
    nullsHandling: 'LAST',
    caseSensitive: false,
  }),
  availableFields: () => [],
  loading: false,
  error: null,
})

const emit = defineEmits<Emits>()

console.log('Montando Paso: ReportSortingStep')

interface SortingConfig {
  primary: { field: string; direction: 'ASC' | 'DESC' }
  secondary?: { field: string; direction: 'ASC' | 'DESC' }
  tertiary?: { field: string; direction: 'ASC' | 'DESC' }
  nullsHandling: 'FIRST' | 'LAST' | 'IGNORE'
  caseSensitive: boolean
}

interface Props {
  modelValue: SortingConfig
  availableFields: Array<{
    field: string
    alias: string
    format: string
    sortable: boolean
  }>
  loading?: boolean
  error?: string | null
}

interface Emits {
  (e: 'update:modelValue', value: SortingConfig): void
  (e: 'next'): void
  (e: 'prev'): void
  (e: 'validate', isValid: boolean): void
}

const { t } = useI18n()

// Validation schema
const schema = toTypedSchema(z.object({
  primary: z.object({
    field: z.string().min(1, t('validation.required', { field: t('DynamicReports.report.sorting.primary_field') })),
    direction: z.enum(['ASC', 'DESC']),
  }),
  secondary: z.object({
    field: z.string(),
    direction: z.enum(['ASC', 'DESC']),
  }).optional(),
  tertiary: z.object({
    field: z.string(),
    direction: z.enum(['ASC', 'DESC']),
  }).optional(),
  nullsHandling: z.enum(['FIRST', 'LAST', 'IGNORE']),
  caseSensitive: z.boolean(),
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
  const isValid = !errors.value.primary?.field && values.value.primary.field

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
const sortableFields = computed(() => {
  return props.availableFields.filter(field => field.sortable)
})

const availableSecondaryFields = computed(() => {
  if (!values.value?.primary)
    return []

  return sortableFields.value.filter(field =>
    field.field !== values.value.primary.field
    && field.field !== values.value.tertiary?.field,
  )
})

const availableTertiaryFields = computed(() => {
  if (!values.value?.primary || !values.value?.secondary)
    return []

  return sortableFields.value.filter(field =>
    field.field !== values.value.primary.field
    && field.field !== values.value.secondary?.field,
  )
})

const directionOptions = [
  { title: t('DynamicReports.report.sorting.ascending'), value: 'ASC' },
  { title: t('DynamicReports.report.sorting.descending'), value: 'DESC' },
]

const nullsHandlingOptions = [
  { title: t('DynamicReports.report.sorting.nulls_first'), value: 'FIRST' },
  { title: t('DynamicReports.report.sorting.nulls_last'), value: 'LAST' },
  { title: t('DynamicReports.report.sorting.nulls_ignore'), value: 'IGNORE' },
]

// Methods
const updateSecondarySort = (field: string) => {
  if (field)
    setFieldValue('secondary', { field, direction: 'ASC' })
  else
    setFieldValue('secondary', undefined)
}

const updateTertiarySort = (field: string) => {
  if (field)
    setFieldValue('tertiary', { field, direction: 'ASC' })
  else
    setFieldValue('tertiary', undefined)
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

      <!-- Ordenamiento Primario -->
      <VCol cols="12">
        <VCard variant="outlined">
          <VCardTitle class="text-h6">
            <VIcon
              icon="tabler-sort-1"
              class="me-2"
            />
            {{ $t('DynamicReports.report.sorting.primary_sort') }}
            <VChip
              color="primary"
              size="small"
              class="ms-2"
            >
              {{ $t('DynamicReports.report.sorting.required') }}
            </VChip>
          </VCardTitle>
          <VCardText>
            <VRow>
              <VCol
                cols="12"
                md="8"
              >
                <AppSelect
                  :model-value="values.primary?.field ?? ''"
                  :error-messages="errors.primary?.field"
                  :label="$t('DynamicReports.report.sorting.field')"
                  :items="sortableFields"
                  item-title="alias"
                  item-value="field"
                  required
                  @update:model-value="val => setFieldValue('primary.field', val)"
                />
              </VCol>
              <VCol
                cols="12"
                md="4"
              >
                <AppSelect
                  :model-value="values.primary?.direction ?? 'ASC'"
                  :label="$t('DynamicReports.report.sorting.direction')"
                  :items="directionOptions"
                  required
                  @update:model-value="val => setFieldValue('primary.direction', val)"
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Ordenamiento Secundario -->
      <VCol cols="12">
        <VCard variant="outlined">
          <VCardTitle class="text-h6">
            <VIcon
              icon="tabler-sort-2"
              class="me-2"
            />
            {{ $t('DynamicReports.report.sorting.secondary_sort') }}
            <VChip
              color="secondary"
              size="small"
              class="ms-2"
            >
              {{ $t('DynamicReports.report.sorting.optional') }}
            </VChip>
          </VCardTitle>
          <VCardText>
            <VRow>
              <VCol
                cols="12"
                md="8"
              >
                <AppSelect
                  :model-value="values.secondary?.field ?? ''"
                  :label="$t('DynamicReports.report.sorting.field')"
                  :items="availableSecondaryFields"
                  item-title="alias"
                  item-value="field"
                  clearable
                  :placeholder="$t('DynamicReports.report.sorting.select_secondary')"
                  @update:model-value="updateSecondarySort"
                />
              </VCol>
              <VCol
                cols="12"
                md="4"
              >
                <AppSelect
                  :model-value="values.secondary?.direction ?? 'ASC'"
                  :label="$t('DynamicReports.report.sorting.direction')"
                  :items="directionOptions"
                  :disabled="!values.secondary?.field"
                  @update:model-value="val => setFieldValue('secondary.direction', val)"
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Ordenamiento Terciario -->
      <VCol cols="12">
        <VCard variant="outlined">
          <VCardTitle class="text-h6">
            <VIcon
              icon="tabler-sort-3"
              class="me-2"
            />
            {{ $t('DynamicReports.report.sorting.tertiary_sort') }}
            <VChip
              color="secondary"
              size="small"
              class="ms-2"
            >
              {{ $t('DynamicReports.report.sorting.optional') }}
            </VChip>
          </VCardTitle>
          <VCardText>
            <VRow>
              <VCol
                cols="12"
                md="8"
              >
                <AppSelect
                  :model-value="values.tertiary?.field ?? ''"
                  :label="$t('DynamicReports.report.sorting.field')"
                  :items="availableTertiaryFields"
                  item-title="alias"
                  item-value="field"
                  clearable
                  :placeholder="$t('DynamicReports.report.sorting.select_tertiary')"
                  @update:model-value="updateTertiarySort"
                />
              </VCol>
              <VCol
                cols="12"
                md="4"
              >
                <AppSelect
                  :model-value="values.tertiary?.direction ?? 'ASC'"
                  :label="$t('DynamicReports.report.sorting.direction')"
                  :items="directionOptions"
                  :disabled="!values.tertiary?.field"
                  @update:model-value="val => setFieldValue('tertiary.direction', val)"
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Configuración Avanzada -->
      <VCol cols="12">
        <VCard variant="outlined">
          <VCardTitle class="text-h6">
            <VIcon
              icon="tabler-settings"
              class="me-2"
            />
            {{ $t('DynamicReports.report.sorting.advanced_settings') }}
          </VCardTitle>
          <VCardText>
            <VRow>
              <VCol
                cols="12"
                md="6"
              >
                <AppSelect
                  :model-value="values.nullsHandling"
                  :label="$t('DynamicReports.report.sorting.nulls_handling')"
                  :items="nullsHandlingOptions"
                  @update:model-value="val => setFieldValue('nullsHandling', val)"
                />
              </VCol>
              <VCol
                cols="12"
                md="6"
              >
                <VSwitch
                  :model-value="values.caseSensitive"
                  :label="$t('DynamicReports.report.sorting.case_sensitive')"
                  color="primary"
                  @update:model-value="val => setFieldValue('caseSensitive', val)"
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
