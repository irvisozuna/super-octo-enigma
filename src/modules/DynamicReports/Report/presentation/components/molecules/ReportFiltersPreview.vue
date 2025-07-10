<script setup lang="ts">
import ReportFilterItem from './ReportFilterItem.vue'

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
  filters: Filter[]
  readonly?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  filters: () => [],
  readonly: true,
  loading: false,
})

const emit = defineEmits<{
  'update:filters': [value: Filter[]]
  'apply-filters': [filters: Filter[]]
  'clear-filters': []
}>()

// Métodos para manejar cambios de filtros
const updateFilterValue = (filter: Filter, value: any) => {
  filter.value = value
  emit('update:filters', props.filters)
}

const applyFilters = () => {
  emit('apply-filters', props.filters)
}

const clearFilters = () => {
  // Resetear todos los valores de filtros
  const resetFilters = (items: Filter[]) => {
    items.forEach(item => {
      if (item.type === 'filter')
        item.value = item.defaultValue || ''
      else if (item.type === 'group' && item.children)
        resetFilters(item.children)
    })
  }

  resetFilters(props.filters)
  emit('clear-filters')
  emit('update:filters', props.filters)
}
</script>

<template>
  <div class="report-filters-preview">
    <!-- Header con título y acciones -->
    <div class="d-flex align-center justify-space-between mb-4">
      <div class="d-flex gap-2">
        <VBtn
          variant="tonal"
          size="small"
          :disabled="loading"
          @click="clearFilters"
        >
          <VIcon
            icon="tabler-refresh"
            size="16"
            start
          />
          Limpiar filtros
        </VBtn>
        <VBtn
          color="primary"
          size="small"
          :disabled="loading"
          @click="applyFilters"
        >
          <VIcon
            icon="tabler-check"
            size="16"
            start
          />
          Aplicar filtros
        </VBtn>
      </div>
    </div>

    <!-- Contenido de filtros -->
    <div v-if="filters.length > 0">
      <!-- Renderizado recursivo de filtros -->
      <div class="filters-container">
        <template
          v-for="filter in filters"
          :key="filter.id"
        >
          <!-- Componente recursivo para renderizar filtros -->
          <ReportFilterItem
            :filter="filter"
            :readonly="readonly"
            @update-value="updateFilterValue"
          />
        </template>
      </div>
    </div>

    <!-- Mensaje cuando no hay filtros -->
    <VAlert
      v-else
      type="info"
      variant="tonal"
      density="compact"
    >
      <template #prepend>
        <VIcon icon="tabler-info-circle" />
      </template>
      <div>
        <strong>Sin filtros disponibles</strong>
        <p class="mb-0 mt-1">
          Este reporte no tiene filtros configurados. Se mostrarán todos los datos disponibles.
        </p>
      </div>
    </VAlert>

    <!-- Loading state -->
    <VOverlay
      v-if="loading"
      contained
      persistent
      class="align-center justify-center"
    >
      <VProgressCircular
        indeterminate
        color="primary"
      />
    </VOverlay>
  </div>
</template>

<style scoped>
.report-filters-preview {
  position: relative;
}

.filter-preview-item {
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.filter-preview-item:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
}

.filters-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

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
