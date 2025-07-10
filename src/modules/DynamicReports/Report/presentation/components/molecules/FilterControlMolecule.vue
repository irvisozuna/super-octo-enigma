<!-- FilterControlMolecule.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface FilterConfig {
  field: string
  alias: string
  type: 'text' | 'number' | 'date' | 'select' | 'boolean'
  options?: Array<{ value: any; label: string }>
  placeholder?: string
  min?: number
  max?: number
  step?: number
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

const handleInput = (value: any): void => {
  emit('update:modelValue', value)
}

const isBoolean = computed(() => props.filter.type === 'boolean')
const isSelect = computed(() => props.filter.type === 'select')
const isNumber = computed(() => props.filter.type === 'number')
const isDate = computed(() => props.filter.type === 'date')
const isText = computed(() => props.filter.type === 'text')
</script>

<template>
  <div class="filter-control">
    <label class="filter-label text-body-2 font-weight-medium">
      {{ filter.alias }}
    </label>

    <!-- Boolean Filter -->
    <VSwitch
      v-if="isBoolean"
      :model-value="modelValue"
      :disabled="loading"
      color="primary"
      hide-details
      @update:model-value="handleInput"
    />

    <!-- Select Filter -->
    <VSelect
      v-else-if="isSelect"
      :model-value="modelValue"
      :items="filter.options || []"
      item-title="label"
      item-value="value"
      :placeholder="filter.placeholder || t('reports.filters.selectPlaceholder')"
      :disabled="loading"
      variant="outlined"
      density="compact"
      hide-details
      clearable
      @update:model-value="handleInput"
    />

    <!-- Number Filter -->
    <VTextField
      v-else-if="isNumber"
      :model-value="modelValue"
      type="number"
      :placeholder="filter.placeholder || t('reports.filters.numberPlaceholder')"
      :disabled="loading"
      :min="filter.min"
      :max="filter.max"
      :step="filter.step"
      variant="outlined"
      density="compact"
      hide-details
      clearable
      @update:model-value="handleInput"
    />

    <!-- Date Filter -->
    <VTextField
      v-else-if="isDate"
      :model-value="modelValue"
      type="date"
      :placeholder="filter.placeholder || t('reports.filters.datePlaceholder')"
      :disabled="loading"
      variant="outlined"
      density="compact"
      hide-details
      clearable
      @update:model-value="handleInput"
    />

    <!-- Text Filter -->
    <VTextField
      v-else
      :model-value="modelValue"
      :placeholder="filter.placeholder || t('reports.filters.textPlaceholder')"
      :disabled="loading"
      variant="outlined"
      density="compact"
      hide-details
      clearable
      @update:model-value="handleInput"
    />
  </div>
</template>

<style scoped>
.filter-control {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-label {
  color: rgb(var(--v-theme-on-surface));
  margin-block-end: 4px;
}
</style>
