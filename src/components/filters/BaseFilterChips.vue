<script setup lang="ts">
/**
 * BaseFilterChips - Componente para mostrar filtros activos como chips
 *
 * Uso:
 * <BaseFilterChips
 *   :filters="activeFilters"
 *   @remove="handleRemoveFilter"
 *   @clear="handleClearFilters"
 * />
 */

export interface ActiveFilter {
  key: string
  label: string
  value: any
  color?: string
}

interface Props {
  filters: ActiveFilter[]
  clearText?: string
  emptyText?: string
  showEmpty?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  clearText: 'Limpiar todo',
  emptyText: 'Sin filtros activos',
  showEmpty: false,
})

const emit = defineEmits<{
  'remove': [filter: ActiveFilter]
  'clear': []
}>()

const removeFilter = (filter: ActiveFilter) => {
  emit('remove', filter)
}

const clearAll = () => {
  emit('clear')
}
</script>

<template>
  <div
    v-if="filters.length > 0 || showEmpty"
    class="base-filter-chips"
  >
    <template v-if="filters.length > 0">
      <div class="d-flex align-center gap-2 flex-wrap">
        <span class="text-body-2 text-medium-emphasis">
          <VIcon
            icon="tabler-filter"
            size="18"
            class="me-1"
          />
          Filtros activos:
        </span>

        <VChip
          v-for="filter in filters"
          :key="`${filter.key}-${filter.value}`"
          :color="filter.color"
          size="small"
          closable
          @click:close="removeFilter(filter)"
        >
          {{ filter.label }}
        </VChip>

        <VSpacer />

        <VBtn
          size="small"
          variant="text"
          color="error"
          prepend-icon="tabler-x"
          @click="clearAll"
        >
          {{ clearText }}
        </VBtn>
      </div>
    </template>

    <template v-else-if="showEmpty">
      <div class="text-body-2 text-medium-emphasis">
        <VIcon
          icon="tabler-filter-off"
          size="18"
          class="me-1"
        />
        {{ emptyText }}
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.base-filter-chips {
  margin-block-end: 1rem;
  padding: 0.75rem 1rem;
  background-color: rgb(var(--v-theme-surface));
  border-radius: 4px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
