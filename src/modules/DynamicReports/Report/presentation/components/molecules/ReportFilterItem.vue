<script setup lang="ts">
import { onMounted } from 'vue'

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
  mode?: 'single' | 'range'
  min?: number
  max?: number
  step?: number
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
  // Si es un filtro de fecha y operador between, y el valor es string, conviértelo a array
  if (
    props.filter.fieldType === 'date'
    && props.filter.operator === 'between'
    && typeof value === 'string'
    && value.includes(' to ')
  ) {
    const [start, end] = value.split(' to ')

    emit('updateValue', props.filter, [start, end])

    return
  }

  if (props.filter.fieldType === 'select' && props.filter.multiple) {
    // Siempre array si es multiple
    emit('updateValue', props.filter, value ? (Array.isArray(value) ? value : [value]) : [])
  }
  else {
    emit('updateValue', props.filter, value)
  }
}

const updateRangeValue = (index: number, value: any) => {
  if (!props.filter.value)
    props.filter.value = ['', '']
  props.filter.value[index] = value
  emit('update-value', props.filter, props.filter.value)
}

// Inicializar el valor por defecto correctamente al montar
onMounted(() => {
  if (props.filter.value == null && props.filter.defaultValue != null) {
    if (props.filter.fieldType === 'select' && props.filter.multiple) {
      props.filter.value = Array.isArray(props.filter.defaultValue)
        ? props.filter.defaultValue
        : [props.filter.defaultValue]
    }
    else {
      props.filter.value = props.filter.defaultValue
    }
    emit('update-value', props.filter, props.filter.value)
  }
})
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

    <!-- Rango de fechas -->
    <AppDateTimePicker
      v-else-if="filter.fieldType === 'date' && filter.operator === 'between'"
      v-model="filter.value"
      :label="filter.alias || filter.field"
      placeholder="Seleccione rango de fechas"
      :config="{ mode: 'range' }"
      :readonly="readonly"
      @update:model-value="updateValue"
    />

    <!-- fechas -->
    <AppDateTimePicker
      v-else-if="filter.fieldType === 'date'"
      v-model="filter.value"
      placeholder="Seleccione fecha"
      :config="{ mode: 'single' }"
      :readonly="readonly"
      @update:model-value="updateValue"
    />

    <!-- Fecha simple -->
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

    <!-- Select múltiple -->
    <VAutocomplete
      v-else-if="filter.fieldType === 'select' && filter.multiple"
      v-model="filter.value"
      :label="filter.alias || filter.field"
      :items="filter.options || []"
      item-title="label"
      item-value="value"
      placeholder="Seleccione una o varias opciones"
      multiple
      chips
      clearable
      eager
      :readonly="readonly"
      @update:model-value="updateValue"
    />

    <!-- Select simple -->
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
      clearable
      prepend-inner-icon="tabler-list"
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
