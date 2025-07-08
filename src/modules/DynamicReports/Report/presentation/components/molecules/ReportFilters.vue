<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useReportValidation } from '@/modules/DynamicReports/Report/presentation/composables/useReportValidation'

// Props
interface Props {
  modelValue: Array<{
    id: string
    field: string
    type: 'text' | 'number' | 'date' | 'select' | 'range' | 'boolean'
    operator: string
    defaultValue: any
    required: boolean
    placeholder: string
    options?: Array<{ value: any; label: string }>
    min?: number
    max?: number
    step?: number
  }>
  availableFields: Array<{
    field: string
    alias: string
    format: string
  }>
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: Props['modelValue']]
  validation: [isValid: boolean]
}>()

// Composables
const { t } = useI18n()
const { validateFilters, validationErrors } = useReportValidation()

// Estado local
const filterTypes = [
  { value: 'text', title: t('DynamicReports.report.filters.types.text') },
  { value: 'number', title: t('DynamicReports.report.filters.types.number') },
  { value: 'date', title: t('DynamicReports.report.filters.types.date') },
  { value: 'select', title: t('DynamicReports.report.filters.types.select') },
  { value: 'range', title: t('DynamicReports.report.filters.types.range') },
  { value: 'boolean', title: t('DynamicReports.report.filters.types.boolean') },
]

// Operadores por tipo
const operatorsByType = {
  text: [
    { value: '=', label: t('filter.operators.equals') },
    { value: '!=', label: t('filter.operators.not_equals') },
    { value: 'LIKE', label: t('filter.operators.contains') },
    { value: 'NOT_LIKE', label: t('filter.operators.not_contains') },
    { value: 'STARTS_WITH', label: t('filter.operators.starts_with') },
    { value: 'ENDS_WITH', label: t('filter.operators.ends_with') },
  ],
  number: [
    { value: '=', label: t('filter.operators.equals') },
    { value: '!=', label: t('filter.operators.not_equals') },
    { value: '>', label: t('filter.operators.greater_than') },
    { value: '>=', label: t('filter.operators.greater_equal') },
    { value: '<', label: t('filter.operators.less_than') },
    { value: '<=', label: t('filter.operators.less_equal') },
    { value: 'BETWEEN', label: t('filter.operators.between') },
  ],
  date: [
    { value: '=', label: t('filter.operators.equals') },
    { value: '!=', label: t('filter.operators.not_equals') },
    { value: '>', label: t('filter.operators.after') },
    { value: '>=', label: t('filter.operators.after_equal') },
    { value: '<', label: t('filter.operators.before') },
    { value: '<=', label: t('filter.operators.before_equal') },
    { value: 'BETWEEN', label: t('filter.operators.between') },
  ],
  select: [
    { value: '=', label: t('filter.operators.equals') },
    { value: '!=', label: t('filter.operators.not_equals') },
    { value: 'IN', label: t('filter.operators.in') },
    { value: 'NOT_IN', label: t('filter.operators.not_in') },
  ],
  boolean: [
    { value: '=', label: t('filter.operators.equals') },
    { value: '!=', label: t('filter.operators.not_equals') },
  ],
}

// Métodos
const getFilterIcon = (type: string) => {
  const icons = {
    text: 'tabler-text',
    number: 'tabler-number',
    date: 'tabler-calendar',
    select: 'tabler-list',
    range: 'tabler-slider',
    boolean: 'tabler-toggle-right',
  }

  return icons[type as keyof typeof icons] || 'tabler-question'
}

const getFilterColor = (type: string) => {
  const colors = {
    text: 'primary',
    number: 'success',
    date: 'info',
    select: 'secondary',
    range: 'warning',
    boolean: 'error',
  }

  return colors[type as keyof typeof colors] || 'grey'
}

const getOperatorsForType = (type: string) => {
  return operatorsByType[type as keyof typeof operatorsByType] || []
}

const getValueComponent = (type: string) => {
  switch (type) {
  case 'text':
    return 'VTextField'
  case 'number':
    return 'VTextField'
  case 'date':
    return 'VTextField'
  case 'select':
    return 'VSelect'
  case 'range':
    return 'VRangeSlider'
  case 'boolean':
    return 'VSelect'
  default:
    return 'VTextField'
  }
}

const addFilter = () => {
  const newFilter = {
    id: `filter_${Date.now()}`,
    field: '',
    type: 'text' as const,
    operator: '=',
    defaultValue: '',
    required: false,
    placeholder: '',
  }

  const updatedFilters = [...props.modelValue, newFilter]

  emit('update:modelValue', updatedFilters)
  validateFiltersLocal(updatedFilters)
}

const removeFilter = (index: number) => {
  const updatedFilters = props.modelValue.filter((_, i) => i !== index)

  emit('update:modelValue', updatedFilters)
  validateFiltersLocal(updatedFilters)
}

const updateFilter = (index: number, updates: Partial<Props['modelValue'][0]>) => {
  const updatedFilters = [...props.modelValue]

  Object.assign(updatedFilters[index], updates)

  // Reset operator when type changes
  if (updates.type && updates.type !== updatedFilters[index].type) {
    const operators = getOperatorsForType(updates.type)

    updatedFilters[index].operator = operators?.[0]?.value || '='
  }

  emit('update:modelValue', updatedFilters)
  validateFiltersLocal(updatedFilters)
}

const updateOptionsFromText = (index: number, text: string) => {
  const options = text
    .split('\n')
    .filter(line => line.trim())
    .map(line => {
      const [value, label] = line.split('|').map(s => s.trim())

      return { value: value || label, label: label || value }
    })

  updateFilter(index, { options })
}

const getFilterPreview = (filter: Props['modelValue'][0]) => {
  const field = props.availableFields.find(f => f.field === filter.field)
  const fieldName = field?.alias || filter.field
  const operator = getOperatorsForType(filter.type).find(op => op.value === filter.operator)?.label || filter.operator

  return `${fieldName} ${operator} ${filter.defaultValue || '...'}`
}

const validateFiltersLocal = async (filters = props.modelValue) => {
  const errors = await validateFilters(filters)
  const isValid = errors.length === 0

  emit('validation', isValid)
}

// Observar cambios en el modelo
watch(() => props.modelValue, validateFiltersLocal, { deep: true })

// Validación inicial
onMounted(() => {
  validateFiltersLocal()
})
</script>

<template>
  <div class="report-filters">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <h5 class="text-h6 font-weight-medium">
          {{ t('DynamicReports.report.filters.title') }}
        </h5>
        <p class="text-body-2 text-medium-emphasis">
          {{ t('DynamicReports.report.filters.description') }}
        </p>
      </div>

      <VBtn
        color="primary"
        variant="tonal"
        prepend-icon="tabler-plus"
        @click="addFilter"
      >
        {{ t('DynamicReports.report.filters.add_filter') }}
      </VBtn>
    </div>

    <!-- Filtros Configurados -->
    <div
      v-if="modelValue.length === 0"
      class="text-center py-8"
    >
      <VIcon
        icon="tabler-filter-off"
        size="48"
        color="grey"
        class="mb-3"
      />
      <p class="text-body-2 text-medium-emphasis">
        {{ t('DynamicReports.report.filters.no_filters') }}
      </p>
      <VBtn
        color="primary"
        variant="outlined"
        class="mt-3"
        @click="addFilter"
      >
        {{ t('DynamicReports.report.filters.add_first_filter') }}
      </VBtn>
    </div>

    <div
      v-else
      class="filters-container"
    >
      <VCard
        v-for="(filter, index) in modelValue"
        :key="filter.id"
        class="mb-4"
        variant="outlined"
      >
        <VCardTitle class="d-flex align-center pa-4">
          <VIcon
            :icon="getFilterIcon(filter.type)"
            :color="getFilterColor(filter.type)"
            size="20"
            class="mr-3"
          />
          {{ t('DynamicReports.report.filters.filter') }} #{{ index + 1 }}
          <VSpacer />
          <VBtn
            icon
            variant="text"
            size="small"
            color="error"
            @click="removeFilter(index)"
          >
            <VIcon
              icon="tabler-trash"
              size="16"
            />
          </VBtn>
        </VCardTitle>

        <VCardText>
          <VRow>
            <!-- Campo -->
            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="filter.field"
                :label="t('DynamicReports.report.filters.field')"
                variant="outlined"
                :items="availableFields"
                item-title="alias"
                item-value="field"
                :rules="[v => !!v || t('validation.required', { field: t('DynamicReports.report.filters.field') })]"
                @update:model-value="updateFilter(index, { field: $event })"
              />
            </VCol>

            <!-- Tipo -->
            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="filter.type"
                :label="t('DynamicReports.report.filters.type')"
                variant="outlined"
                :items="filterTypes"
                :rules="[v => !!v || t('validation.required', { field: t('DynamicReports.report.filters.type') })]"
                @update:model-value="updateFilter(index, { type: $event })"
              />
            </VCol>

            <!-- Operador -->
            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="filter.operator"
                :label="t('DynamicReports.report.filters.operator')"
                variant="outlined"
                :items="getOperatorsForType(filter.type)"
                :rules="[v => !!v || t('validation.required', { field: t('DynamicReports.report.filters.operator') })]"
                @update:model-value="updateFilter(index, { operator: $event })"
              />
            </VCol>

            <!-- Valor por defecto -->
            <VCol
              cols="12"
              md="6"
            >
              <component
                :is="getValueComponent(filter.type)"
                v-model="filter.defaultValue"
                :label="t('DynamicReports.report.filters.default_value')"
                variant="outlined"
                :placeholder="filter.placeholder"
                :options="filter.options"
                :min="filter.min"
                :max="filter.max"
                :step="filter.step"
                @update:model-value="updateFilter(index, { defaultValue: $event })"
              />
            </VCol>

            <!-- Placeholder -->
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="filter.placeholder"
                :label="t('DynamicReports.report.filters.placeholder')"
                variant="outlined"
                :maxlength="200"
                @update:model-value="updateFilter(index, { placeholder: $event })"
              />
            </VCol>

            <!-- Requerido -->
            <VCol
              cols="12"
              md="6"
            >
              <VSwitch
                v-model="filter.required"
                :label="t('DynamicReports.report.filters.required')"
                color="warning"
                hide-details
                @update:model-value="updateFilter(index, { required: $event })"
              />
            </VCol>

            <!-- Configuración específica por tipo -->
            <VCol
              v-if="filter.type === 'range'"
              cols="12"
            >
              <VRow>
                <VCol cols="6">
                  <VTextField
                    v-model.number="filter.min"
                    :label="t('DynamicReports.report.filters.min_value')"
                    variant="outlined"
                    type="number"
                    @update:model-value="updateFilter(index, { min: $event })"
                  />
                </VCol>
                <VCol cols="6">
                  <VTextField
                    v-model.number="filter.max"
                    :label="t('DynamicReports.report.filters.max_value')"
                    variant="outlined"
                    type="number"
                    @update:model-value="updateFilter(index, { max: $event })"
                  />
                </VCol>
              </VRow>
            </VCol>

            <VCol
              v-if="filter.type === 'select'"
              cols="12"
            >
              <VTextarea
                v-model="filter.optionsText"
                :label="t('DynamicReports.report.filters.options')"
                variant="outlined"
                :placeholder="t('DynamicReports.report.filters.options_placeholder')"
                rows="3"
                auto-grow
                @update:model-value="updateOptionsFromText(index, $event)"
              />
              <p class="text-caption text-medium-emphasis mt-1">
                {{ t('DynamicReports.report.filters.options_help') }}
              </p>
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
    </div>

    <!-- Preview de Filtros -->
    <VCard
      v-if="modelValue.length > 0"
      class="mt-4"
      variant="tonal"
    >
      <VCardTitle class="d-flex align-center">
        <VIcon
          icon="tabler-eye"
          size="20"
          class="mr-2"
        />
        {{ t('DynamicReports.report.filters.preview') }}
      </VCardTitle>

      <VCardText>
        <div class="filters-preview">
          <VChip
            v-for="filter in modelValue"
            :key="filter.id"
            class="ma-1"
            :color="filter.required ? 'warning' : 'primary'"
            variant="tonal"
          >
            <VIcon
              :icon="getFilterIcon(filter.type)"
              size="16"
              class="mr-1"
            />
            {{ getFilterPreview(filter) }}
            <VBtn
              v-if="filter.required"
              icon
              variant="text"
              size="x-small"
              color="warning"
              class="ml-1"
            >
              <VIcon
                icon="tabler-alert-triangle"
                size="12"
              />
            </VBtn>
          </VChip>
        </div>
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
          {{ t('validation.filters_errors') }}
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
.report-filters {
  inline-size: 100%;
}

.filters-container {
  max-block-size: 600px;
  overflow-y: auto;
}

.filters-preview {
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
</style>
