<script setup lang="ts">
interface FilterOption {
  value: any
  label: string
}

interface Filter {
  id: string
  type: 'filter' | 'group'
  field?: string
  alias?: string
  fieldType?: 'text' | 'number' | 'date' | 'select' | 'range' | 'boolean'
  operator?: string
  defaultValue?: any
  value?: any
  required?: boolean
  placeholder?: string
  multiple?: boolean
  options?: FilterOption[]
  advanced?: boolean
  children?: Filter[]
  expanded?: boolean
  condition?: 'AND' | 'OR'
}

interface Props {
  filter: Filter
  readonly?: boolean
  level?: number
}

const props = withDefaults(defineProps<Props>(), {
  readonly: true,
  level: 0,
})

const emit = defineEmits<{
  'update-value': [filter: Filter, value: any]
}>()

const updateValue = (value: any) => {
  emit('update-value', props.filter, value)
}

const updateRangeValue = (index: number, value: any) => {
  if (!props.filter.value)
    props.filter.value = ['', '']
  props.filter.value[index] = value
  emit('update-value', props.filter, props.filter.value)
}
</script>

<template>
  <div
    v-if="filter.type === 'group'"
    class="filter-group mb-3"
    :style="{
      marginLeft: level > 0 ? '16px' : '0',
      borderLeft: level > 0 ? '2px solid rgba(var(--v-border-color), var(--v-border-opacity))' : 'none',
      paddingLeft: level > 0 ? '12px' : '0',
    }"
  >
    <!-- Header del grupo -->
    <div class="d-flex align-center mb-2">
      <VIcon
        icon="tabler-folders"
        size="18"
        color="secondary"
        class="me-2"
      />
      <span class="text-subtitle-2 font-weight-medium">
        {{ filter.alias || 'Grupo de filtros' }}
      </span>
      <span class="text-caption text-medium-emphasis ms-2">
        ({{ filter.condition || 'AND' }})
      </span>
    </div>

    <!-- Contenido del grupo (recursivo) -->
    <div class="d-flex flex-column gap-2">
      <ReportFilterItem
        v-for="child in filter.children"
        :key="child.id"
        :filter="child"
        :readonly="readonly"
        :level="level + 1"
        @update-value="updateValue"
      />
    </div>
  </div>

  <!-- Filtro individual -->
  <div
    v-else
    class="filter-item mb-2"
  >
    <label class="text-body-2 d-flex align-center mb-1">
      {{ filter.alias || filter.field }}
      <VIcon
        v-if="filter.required"
        icon="tabler-asterisk"
        size="12"
        color="error"
        class="ms-1"
      />
      <VTooltip
        v-if="filter.advanced"
        location="top"
      >
        <template #activator="{ props }">
          <VIcon
            icon="tabler-settings"
            size="14"
            class="ms-1 text-medium-emphasis"
            v-bind="props"
          />
        </template>
        <span>Filtro avanzado</span>
      </VTooltip>
    </label>

    <!-- Input según el tipo de filtro -->
    <VTextField
      v-if="filter.fieldType === 'text'"
      v-model="filter.value"
      :placeholder="filter.placeholder || `Filtrar por ${filter.alias || filter.field}`"
      density="compact"
      variant="outlined"
      :readonly="readonly"
      prepend-inner-icon="tabler-search"
      @update:model-value="updateValue"
    />

    <VTextField
      v-else-if="filter.fieldType === 'number'"
      v-model.number="filter.value"
      :placeholder="filter.placeholder || 'Ingrese un número'"
      density="compact"
      variant="outlined"
      :readonly="readonly"
      type="number"
      :min="filter.min"
      :max="filter.max"
      :step="filter.step"
      prepend-inner-icon="tabler-number"
      @update:model-value="updateValue"
    />

    <VTextField
      v-else-if="filter.fieldType === 'date'"
      v-model="filter.value"
      placeholder="Seleccione fecha"
      density="compact"
      variant="outlined"
      :readonly="readonly"
      type="date"
      prepend-inner-icon="tabler-calendar"
      @update:model-value="updateValue"
    />

    <VSelect
      v-else-if="filter.fieldType === 'select'"
      v-model="filter.value"
      :placeholder="filter.placeholder || 'Seleccione una opción'"
      density="compact"
      variant="outlined"
      :readonly="readonly"
      :items="filter.options || []"
      item-title="label"
      item-value="value"
      :multiple="filter.multiple"
      :chips="filter.multiple"
      :closable-chips="filter.multiple"
      :prepend-inner-icon="filter.multiple ? 'tabler-list-check' : 'tabler-list'"
      clearable
      @update:model-value="updateValue"
    />

    <div
      v-else-if="filter.fieldType === 'range'"
      class="d-flex gap-2"
    >
      <VTextField
        :model-value="filter.value?.[0] || ''"
        placeholder="Desde"
        density="compact"
        variant="outlined"
        :readonly="readonly"
        type="number"
        :min="filter.min"
        :max="filter.max"
        @update:model-value="val => updateRangeValue(0, val)"
      />
      <VTextField
        :model-value="filter.value?.[1] || ''"
        placeholder="Hasta"
        density="compact"
        variant="outlined"
        :readonly="readonly"
        type="number"
        :min="filter.min"
        :max="filter.max"
        @update:model-value="val => updateRangeValue(1, val)"
      />
    </div>

    <VSwitch
      v-else-if="filter.fieldType === 'boolean'"
      v-model="filter.value"
      :label="filter.alias || filter.field"
      density="compact"
      :readonly="readonly"
      @update:model-value="updateValue"
    />
  </div>
</template>

<style scoped>
.filter-group {
  border-inline-start: 2px solid rgba(var(--v-border-color), var(--v-border-opacity));
  margin-block-end: 12px;
  padding-inline-start: 12px;
}

.filter-item {
  margin-block-end: 8px;
}

/* Mejoras visuales para inputs */
.v-select--density-compact .v-field__input {
  padding-block: 4px;
}

.v-text-field--density-compact .v-field__input {
  padding-block: 4px;
}

/* Estilos para switches */
.v-switch--density-compact {
  margin-block-start: 4px;
}
</style>
