<!-- FilterControlMolecule.vue -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

interface FilterOption {
  value: any
  label: string
}

interface FilterConfig {
  field: string
  alias: string
  operator: string
  dataType: string
  required?: boolean
  defaultValue?: any
  options?: FilterOption[]
}

interface Props {
  filter: FilterConfig
  modelValue: any
  loading?: boolean
}

interface Emits {
  'update:modelValue': [value: any]
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<Emits>()

const { t } = useI18n()

const internalValue = ref(props.modelValue || props.filter.defaultValue)

// Watch for external changes
watch(() => props.modelValue, newValue => {
  internalValue.value = newValue
})

// Watch for internal changes
watch(internalValue, newValue => {
  emit('update:modelValue', newValue)
}, { deep: true })

const inputType = computed(() => {
  switch (props.filter.dataType) {
    case 'number':
    case 'integer':
    case 'double':
      return 'number'
    case 'date':
      return 'date'
    case 'datetime':
      return 'datetime-local'
    case 'boolean':
      return 'boolean'
    default:
      return 'text'
  }
})

const showRangeInputs = computed(() => {
  return props.filter.operator === 'between'
})

const showMultiSelect = computed(() => {
  return ['in', 'not_in'].includes(props.filter.operator)
})

const showSingleSelect = computed(() => {
  return props.filter.options && props.filter.options.length > 0 && !showMultiSelect.value
})

const showDatePicker = computed(() => {
  return ['date', 'datetime'].includes(props.filter.dataType)
})

const showBooleanSwitch = computed(() => {
  return props.filter.dataType === 'boolean'
})

const requiresNoInput = computed(() => {
  return ['is_null', 'is_not_null'].includes(props.filter.operator)
})

const placeholder = computed(() => {
  switch (props.filter.operator) {
    case 'equals':
      return t('filters.operators.equals.placeholder')
    case 'contains':
      return t('filters.operators.contains.placeholder')
    case 'starts_with':
      return t('filters.operators.startsWith.placeholder')
    case 'greater_than':
      return t('filters.operators.greaterThan.placeholder')
    case 'less_than':
      return t('filters.operators.lessThan.placeholder')
    default:
      return t('filters.enterValue')
  }
})

const getOperatorLabel = (operator: string): string => {
  const operatorLabels: Record<string, string> = {
    equals: t('filters.operators.equals.label'),
    not_equals: t('filters.operators.notEquals.label'),
    contains: t('filters.operators.contains.label'),
    not_contains: t('filters.operators.notContains.label'),
    starts_with: t('filters.operators.startsWith.label'),
    ends_with: t('filters.operators.endsWith.label'),
    greater_than: t('filters.operators.greaterThan.label'),
    less_than: t('filters.operators.lessThan.label'),
    greater_equal: t('filters.operators.greaterEqual.label'),
    less_equal: t('filters.operators.lessEqual.label'),
    between: t('filters.operators.between.label'),
    in: t('filters.operators.in.label'),
    not_in: t('filters.operators.notIn.label'),
    is_null: t('filters.operators.isNull.label'),
    is_not_null: t('filters.operators.isNotNull.label'),
  }

  return operatorLabels[operator] || operator
}

const clearValue = (): void => {
  if (showRangeInputs.value)
    internalValue.value = [null, null]
  else if (showMultiSelect.value)
    internalValue.value = []
  else
    internalValue.value = null
}

const hasValue = computed(() => {
  if (requiresNoInput.value)
    return true
  if (showRangeInputs.value) {
    return Array.isArray(internalValue.value)
           && internalValue.value.some(val => val !== null && val !== undefined && val !== '')
  }
  if (showMultiSelect.value)
    return Array.isArray(internalValue.value) && internalValue.value.length > 0

  return internalValue.value !== null && internalValue.value !== undefined && internalValue.value !== ''
})
</script>

<template>
  <div class="filter-control-molecule">
    <!-- Filter Label -->
    <div class="filter-control__header d-flex align-center justify-space-between mb-2">
      <div class="filter-control__label">
        <span class="text-body-2 font-weight-medium">{{ filter.alias }}</span>
        <VChip
          v-if="filter.required"
          label
          size="x-small"
          color="error"
          variant="text"
          class="ms-1"
        >
          {{ t('common.required') }}
        </VChip>
      </div>

      <div class="filter-control__actions">
        <VChip
          size="x-small"
          variant="tonal"
          class="me-1"
        >
          {{ getOperatorLabel(filter.operator) }}
        </VChip>

        <VBtn
          v-if="hasValue && !requiresNoInput"
          icon
          size="x-small"
          variant="text"
          @click="clearValue"
        >
          <VIcon
            icon="tabler-x"
            size="14"
          />
          <VTooltip activator="parent">
            {{ t('common.clear') }}
          </VTooltip>
        </VBtn>
      </div>
    </div>

    <!-- No Input Required -->
    <div
      v-if="requiresNoInput"
      class="filter-control__no-input"
    >
      <VAlert
        type="info"
        variant="tonal"
        density="compact"
        class="text-caption"
      >
        {{ t('filters.noValueRequired') }}
      </VAlert>
    </div>

    <!-- Boolean Switch -->
    <VSwitch
      v-else-if="showBooleanSwitch"
      v-model="internalValue"
      :label="internalValue ? t('common.yes') : t('common.no')"
      :loading="loading"
      density="compact"
      color="primary"
      hide-details
    />

    <!-- Range Inputs (Between) -->
    <div
      v-else-if="showRangeInputs"
      class="filter-control__range"
    >
      <VRow no-gutters>
        <VCol cols="5">
          <VTextField
            v-model="internalValue[0]"
            :type="inputType"
            :placeholder="t('filters.from')"
            :loading="loading"
            density="compact"
            variant="outlined"
            hide-details
          />
        </VCol>
        <VCol
          cols="2"
          class="d-flex align-center justify-center"
        >
          <span class="text-caption text-medium-emphasis">{{ t('filters.to') }}</span>
        </VCol>
        <VCol cols="5">
          <VTextField
            v-model="internalValue[1]"
            :type="inputType"
            :placeholder="t('filters.to')"
            :loading="loading"
            density="compact"
            variant="outlined"
            hide-details
          />
        </VCol>
      </VRow>
    </div>

    <!-- Multi Select -->
    <VSelect
      v-else-if="showMultiSelect"
      v-model="internalValue"
      :items="filter.options"
      item-title="label"
      item-value="value"
      :placeholder="placeholder"
      :loading="loading"
      multiple
      chips
      closable-chips
      density="compact"
      variant="outlined"
      hide-details
    />

    <!-- Single Select -->
    <VSelect
      v-else-if="showSingleSelect"
      v-model="internalValue"
      :items="filter.options"
      item-title="label"
      item-value="value"
      :placeholder="placeholder"
      :loading="loading"
      clearable
      density="compact"
      variant="outlined"
      hide-details
    />

    <!-- Date Picker -->
    <VTextField
      v-else-if="showDatePicker"
      v-model="internalValue"
      :type="inputType"
      :placeholder="placeholder"
      :loading="loading"
      density="compact"
      variant="outlined"
      hide-details
    />

    <!-- Text Input -->
    <VTextField
      v-else
      v-model="internalValue"
      :type="inputType"
      :placeholder="placeholder"
      :loading="loading"
      density="compact"
      variant="outlined"
      hide-details
      clearable
    />

    <!-- Helper Text -->
    <div
      v-if="filter.operator === 'between'"
      class="text-caption text-medium-emphasis mt-1"
    >
      {{ t('filters.betweenHelper') }}
    </div>
    <div
      v-else-if="showMultiSelect"
      class="text-caption text-medium-emphasis mt-1"
    >
      {{ t('filters.multiSelectHelper') }}
    </div>
  </div>
</template>

<style scoped>
.filter-control-molecule {
  margin-block-end: 16px;
}

.filter-control__header {
  min-block-size: 24px;
}

.filter-control__label {
  display: flex;
  flex: 1;
  align-items: center;
}

.filter-control__actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.filter-control__no-input {
  padding-block: 8px;
  padding-inline: 0;
}

.filter-control__range .v-col {
  padding-block: 0;
  padding-inline: 4px;
}

.filter-control__range .v-col:first-child {
  padding-inline-start: 0;
}

.filter-control__range .v-col:last-child {
  padding-inline-end: 0;
}

/* Custom styling for chips in multi-select */
:deep(.v-select--chips .v-select__selection) {
  max-inline-size: 100px;
}

/* Loading state */
:deep(.v-field--loading) {
  opacity: 0.7;
}

/* Focus management */
:deep(.v-field--focused) {
  z-index: 1;
}

/* Transition animations */
.filter-control-molecule * {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .filter-control__header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .filter-control__actions {
    align-self: flex-end;
  }
}
</style>
