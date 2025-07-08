<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'

interface Filter {
  id: string
  field: string
  alias: string
  type: 'text' | 'number' | 'date' | 'select' | 'range'
  operator: string
  defaultValue: any
  required: boolean
  placeholder: string
  multiple?: boolean
  options?: Array<{ value: any; label: string }>
}

interface Props {
  modelValue: Filter[]
  availableFields: Array<{ field: string; alias: string; filterable: boolean }>
  loading?: boolean
  error?: string | null
}

interface Emits {
  (e: 'update:modelValue', value: Filter[]): void
  (e: 'next'): void
  (e: 'prev'): void
  (e: 'validate', isValid: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  loading: false,
  error: null,
})

const emit = defineEmits<Emits>()

console.log('Montando Paso: ReportFiltersStep')

const { t } = useI18n()

// Local state for filters
const localFilters = ref<Filter[]>([])

// Initialize local filters
onMounted(() => {
  localFilters.value = props.modelValue ? [...props.modelValue] : []
})

// Watch for external changes
watch(() => props.modelValue, newVal => {
  if (JSON.stringify(newVal) !== JSON.stringify(localFilters.value))
    localFilters.value = newVal ? [...newVal] : []
}, { deep: true })

// Emit changes with debounce
let updateTimeout: NodeJS.Timeout | null = null

const emitUpdate = () => {
  if (updateTimeout)
    clearTimeout(updateTimeout)
  updateTimeout = setTimeout(() => {
    emit('update:modelValue', [...localFilters.value])
  }, 100)
}

// Watch local changes
watch(localFilters, () => {
  emitUpdate()
}, { deep: true })

// Validation schema
const schema = toTypedSchema(z.object({
  filters: z.array(z.object({
    id: z.string(),
    field: z.string().min(1),
    alias: z.string().optional(),
    type: z.enum(['text', 'number', 'date', 'select', 'range']),
    operator: z.string().min(1),
    defaultValue: z.any(),
    required: z.boolean(),
    placeholder: z.string(),
    multiple: z.boolean().optional(),
    options: z.array(z.object({
      value: z.any(),
      label: z.string(),
    })).optional(),
  })),
}))

const { errors } = useForm({
  validationSchema: schema,
  initialValues: {
    filters: localFilters.value,
  },
})

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

// Filter type options
const filterTypeOptions = [
  { title: t('DynamicReports.report.filter_types.text'), value: 'text' },
  { title: t('DynamicReports.report.filter_types.number'), value: 'number' },
  { title: t('DynamicReports.report.filter_types.date'), value: 'date' },
  { title: t('DynamicReports.report.filter_types.select'), value: 'select' },
  { title: t('DynamicReports.report.filter_types.range'), value: 'range' },
]

// Operator options by type
const getOperatorOptions = (type: string) => {
  const operators = {
    text: [
      { title: t('DynamicReports.report.operators.equals'), value: 'equals' },
      { title: t('DynamicReports.report.operators.contains'), value: 'contains' },
      { title: t('DynamicReports.report.operators.starts_with'), value: 'starts_with' },
      { title: t('DynamicReports.report.operators.ends_with'), value: 'ends_with' },
    ],
    number: [
      { title: t('DynamicReports.report.operators.equals'), value: 'equals' },
      { title: t('DynamicReports.report.operators.greater_than'), value: 'greater_than' },
      { title: t('DynamicReports.report.operators.less_than'), value: 'less_than' },
      { title: t('DynamicReports.report.operators.between'), value: 'between' },
    ],
    date: [
      { title: t('DynamicReports.report.operators.equals'), value: 'equals' },
      { title: t('DynamicReports.report.operators.greater_than'), value: 'greater_than' },
      { title: t('DynamicReports.report.operators.less_than'), value: 'less_than' },
      { title: t('DynamicReports.report.operators.between'), value: 'between' },
    ],
    select: [
      { title: t('DynamicReports.report.operators.equals'), value: 'equals' },
      { title: t('DynamicReports.report.operators.in'), value: 'in' },
    ],
    range: [
      { title: t('DynamicReports.report.operators.between'), value: 'between' },
    ],
  }

  return operators[type] || operators.text
}

// Methods
const addFilter = () => {
  const usedFields = localFilters.value.map(f => f.field)
  const firstAvailable = availableFieldOptions.value.find(opt => !usedFields.includes(opt.value))

  if (!firstAvailable)
    return

  const newFilter: Filter = {
    id: `filter_${Date.now()}`,
    field: firstAvailable.value,
    alias: firstAvailable.title,
    type: 'text',
    operator: 'equals',
    defaultValue: '',
    required: false,
    placeholder: '',
    multiple: false,
  }

  localFilters.value = [...localFilters.value, newFilter]
}

const removeFilter = (index: number) => {
  localFilters.value = localFilters.value.filter((_, i) => i !== index)
}

const updateFilter = (index: number, updates: Partial<Filter>) => {
  const newFilters = [...localFilters.value]

  newFilters[index] = { ...newFilters[index], ...updates }
  localFilters.value = newFilters
}

// Computed
const availableFieldOptions = computed(() => {
  const usedFields = localFilters.value.map(f => f.field)

  return (props.availableFields || [])
    .filter(field => field && field.filterable)
    .map(field => ({
      title: field.alias || field.field,
      value: field.field,
      disabled: usedFields.includes(field.field),
    }))
})

const canAddMore = computed(() => {
  return availableFieldOptions.value.some(f => !f.disabled)
})

// Cleanup
onUnmounted(() => {
  if (updateTimeout)
    clearTimeout(updateTimeout)
})
</script>

<template>
  <div>
    <VRow>
      <VCol cols="12">
        <h6 class="text-h6 font-weight-medium">
          {{ $t('DynamicReports.report.wizard.step3.title') }}
        </h6>
        <p class="mb-0">
          {{ $t('DynamicReports.report.wizard.step3.description') }}
        </p>
      </VCol>

      <VCol cols="12">
        <VCard variant="outlined">
          <VCardTitle class="text-h6">
            <VIcon
              icon="tabler-filter"
              class="me-2"
            />
            {{ $t('DynamicReports.report.fields.filters') }}
          </VCardTitle>
          <VCardText>
            <TransitionGroup
              name="list"
              tag="div"
            >
              <div
                v-for="(filter, index) in localFilters"
                :key="filter.id"
                class="mb-4 pa-4 border rounded"
              >
                <VRow>
                  <VCol
                    cols="12"
                    md="3"
                  >
                    <AppSelect
                      :model-value="filter.field"
                      :label="$t('DynamicReports.report.fields.field')"
                      :items="availableFieldOptions"
                      :placeholder="$t('DynamicReports.report.placeholders.select_field')"
                      required
                      :disabled="!!filter.field"
                      @update:model-value="val => updateFilter(index, {
                        field: val,
                        alias: availableFieldOptions.find(f => f.value === val)?.title || val,
                      })"
                    />
                  </VCol>

                  <VCol
                    cols="12"
                    md="2"
                  >
                    <AppTextField
                      :model-value="filter.alias"
                      :label="$t('DynamicReports.report.fields.alias')"
                      :placeholder="$t('DynamicReports.report.fields.alias')"
                      @update:model-value="val => updateFilter(index, { alias: val })"
                    />
                  </VCol>

                  <VCol
                    cols="12"
                    md="2"
                  >
                    <AppSelect
                      :model-value="filter.type"
                      :label="$t('DynamicReports.report.fields.type')"
                      :items="filterTypeOptions"
                      required
                      @update:model-value="val => updateFilter(index, {
                        type: val,
                        operator: getOperatorOptions(val)[0]?.value || 'equals',
                      })"
                    />
                  </VCol>

                  <VCol
                    cols="12"
                    md="2"
                  >
                    <AppSelect
                      :model-value="filter.operator"
                      :label="$t('DynamicReports.report.fields.operator')"
                      :items="getOperatorOptions(filter.type)"
                      required
                      @update:model-value="val => updateFilter(index, { operator: val })"
                    />
                  </VCol>

                  <VCol
                    cols="12"
                    md="2"
                  >
                    <AppTextField
                      :model-value="filter.placeholder"
                      :label="$t('DynamicReports.report.fields.placeholder')"
                      :placeholder="$t('DynamicReports.report.placeholders.filter_placeholder')"
                      @update:model-value="val => updateFilter(index, { placeholder: val })"
                    />
                  </VCol>

                  <VCol
                    cols="12"
                    md="1"
                    class="d-flex align-center"
                  >
                    <VBtn
                      icon="tabler-trash"
                      color="error"
                      variant="text"
                      size="small"
                      @click="removeFilter(index)"
                    />
                  </VCol>

                  <VCol cols="12">
                    <VRow>
                      <VCol
                        cols="12"
                        md="3"
                      >
                        <VSwitch
                          :model-value="filter.required"
                          :label="$t('DynamicReports.report.fields.required')"
                          color="primary"
                          density="compact"
                          @update:model-value="val => updateFilter(index, { required: val })"
                        />
                      </VCol>

                      <VCol
                        v-if="filter.type === 'select'"
                        cols="12"
                        md="3"
                      >
                        <VSwitch
                          :model-value="filter.multiple"
                          :label="$t('DynamicReports.report.fields.multiple')"
                          color="primary"
                          density="compact"
                          @update:model-value="val => updateFilter(index, { multiple: val })"
                        />
                      </VCol>
                    </VRow>
                  </VCol>

                  <VCol
                    v-if="filter.type === 'select'"
                    cols="12"
                  >
                    <VCard
                      variant="tonal"
                      class="pa-3"
                    >
                      <VCardTitle class="text-subtitle-2">
                        {{ $t('DynamicReports.report.fields.options') }}
                      </VCardTitle>
                      <VCardText>
                        <VTextarea
                          :model-value="(filter.options || []).map(opt => `${opt.value}:${opt.label}`).join('\n')"
                          :label="$t('DynamicReports.report.placeholders.options_format')"
                          :placeholder="$t('DynamicReports.report.placeholders.options_example')"
                          rows="3"
                          @update:model-value="val => {
                            const options = (val || '').split('\n')
                              .filter(line => line.trim())
                              .map(line => {
                                const [value, label] = line.split(':')
                                return {
                                  value: value?.trim(),
                                  label: label?.trim() || value?.trim(),
                                }
                              })
                            updateFilter(index, { options })
                          }"
                        />
                      </VCardText>
                    </VCard>
                  </VCol>
                </VRow>
              </div>
            </TransitionGroup>

            <VBtn
              variant="outlined"
              class="w-100"
              :disabled="!canAddMore"
              @click="addFilter"
            >
              <VIcon
                icon="tabler-plus"
                class="me-2"
              />
              {{ $t('DynamicReports.report.actions.add_filter') }}
            </VBtn>
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
      v-if="localFilters.length === 0"
      type="info"
      variant="tonal"
      class="mt-4"
    >
      {{ $t('DynamicReports.report.messages.no_filters_configured') }}
    </VAlert>
  </div>
</template>

<style scoped>
/* Smooth transitions for filter list */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.list-move {
  transition: transform 0.3s ease;
}
</style>
