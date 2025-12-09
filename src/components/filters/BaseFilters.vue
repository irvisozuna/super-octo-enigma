<script setup lang="ts" generic="T extends Record<string, any>">

/**
 * BaseFilters - Componente genérico reutilizable para filtros
 *
 * Uso:
 * <BaseFilters
 *   v-model="filters"
 *   :fields="filterFields"
 *   @search="handleSearch"
 *   @change="handleFilterChange"
 * />
 */

export interface FilterField {
  key: string
  label: string
  type: 'text' | 'select' | 'date' | 'number'
  icon?: string
  items?: Array<{ title: string; value: any }>
  multiple?: boolean
  clearable?: boolean
  placeholder?: string
  cols?: number // Columnas en el grid (1-12)
}

interface Props {
  modelValue: T
  fields: FilterField[]
  loading?: boolean
  variant?: 'outlined' | 'flat' | 'elevated'
  density?: 'default' | 'comfortable' | 'compact'
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  variant: 'outlined',
  density: 'compact',
})

const emit = defineEmits<{
  'update:modelValue': [value: T]
  'search': []
  'change': [field: string, value: any]
}>()

const updateField = (key: string, value: any) => {
  const newValue = { ...props.modelValue, [key]: value }

  emit('update:modelValue', newValue)
  emit('change', key, value)
}

const handleSearch = (key: string) => {
  emit('search')
}

const getFieldCols = (field: FilterField) => {
  return field.cols || 3 // Default 3 columnas (4 filtros por fila)
}
</script>

<template>
  <VCard
    :variant="variant"
    class="base-filters"
  >
    <VCardText>
      <VRow>
        <VCol
          v-for="field in fields"
          :key="field.key"
          cols="12"
          :md="getFieldCols(field)"
        >
          <!-- Text/Search Field -->
          <VTextField
            v-if="field.type === 'text'"
            :model-value="modelValue[field.key]"
            :label="field.label"
            :prepend-inner-icon="field.icon"
            :placeholder="field.placeholder"
            :clearable="field.clearable !== false"
            :density="density"
            :loading="loading"
            hide-details
            @update:model-value="updateField(field.key, $event)"
            @input="handleSearch(field.key)"
          />

          <!-- Select Field -->
          <VSelect
            v-else-if="field.type === 'select'"
            :model-value="modelValue[field.key]"
            :items="field.items || []"
            :label="field.label"
            :prepend-inner-icon="field.icon"
            :multiple="field.multiple"
            :chips="field.multiple"
            :closable-chips="field.multiple"
            :clearable="field.clearable !== false"
            :density="density"
            :loading="loading"
            hide-details
            @update:model-value="updateField(field.key, $event)"
          />

          <!-- Date Field -->
          <VTextField
            v-else-if="field.type === 'date'"
            :model-value="modelValue[field.key]"
            :label="field.label"
            :prepend-inner-icon="field.icon || 'tabler-calendar'"
            :clearable="field.clearable !== false"
            :density="density"
            :loading="loading"
            type="date"
            hide-details
            @update:model-value="updateField(field.key, $event)"
          />

          <!-- Number Field -->
          <VTextField
            v-else-if="field.type === 'number'"
            :model-value="modelValue[field.key]"
            :label="field.label"
            :prepend-inner-icon="field.icon"
            :placeholder="field.placeholder"
            :clearable="field.clearable !== false"
            :density="density"
            :loading="loading"
            type="number"
            hide-details
            @update:model-value="updateField(field.key, $event)"
          />
        </VCol>
      </VRow>
    </VCardText>
  </VCard>
</template>

<style scoped lang="scss">
.base-filters {
  margin-block-end: 1rem;
}
</style>
