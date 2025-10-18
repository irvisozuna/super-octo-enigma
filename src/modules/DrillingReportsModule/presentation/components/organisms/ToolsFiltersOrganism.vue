<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToolDisplay } from '../../composables/useToolDisplay'
import type { ToolFilters } from '../../composables/useToolFilters'

interface Props {
  filters: ToolFilters
  activeFilters?: Array<{ key: string; label: string; value: string }>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:filters': [filters: ToolFilters]
  'search': []
  'filter-change': []
  'remove-filter': [filterKey: string, value: string]
  'clear-all': []
}>()

const { t } = useI18n()
const { toolTypeOptions, statusOptions, wearLevelOptions } = useToolDisplay()

const hasActiveFilters = computed(() => (props.activeFilters?.length || 0) > 0)

const updateSearch = (value: string) => {
  emit('update:filters', { ...props.filters, search: value })
  emit('search')
}

const updateTypes = (value: string[]) => {
  emit('update:filters', { ...props.filters, types: value })
  emit('filter-change')
}

const updateStatuses = (value: string[]) => {
  emit('update:filters', { ...props.filters, statuses: value })
  emit('filter-change')
}

const updateWearLevels = (value: string[]) => {
  emit('update:filters', { ...props.filters, wearLevels: value })
  emit('filter-change')
}

const removeFilter = (key: string, value: string) => {
  emit('remove-filter', key, value)
}

const clearAll = () => {
  emit('clear-all')
}
</script>

<template>
  <div class="tools-filters">
    <!-- Filtros principales -->
    <VCard
      variant="outlined"
      class="mb-4"
    >
      <VCardText>
        <VRow>
          <VCol
            cols="12"
            md="3"
          >
            <VTextField
              :model-value="filters.search"
              :label="t('DrillingReportsModule.common.search')"
              prepend-inner-icon="tabler-search"
              clearable
              density="compact"
              hide-details
              @update:model-value="updateSearch"
            />
          </VCol>
          <VCol
            cols="12"
            md="3"
          >
            <VSelect
              :model-value="filters.types"
              :items="toolTypeOptions"
              :label="t('DrillingReportsModule.tools.type')"
              multiple
              chips
              closable-chips
              clearable
              density="compact"
              hide-details
              @update:model-value="updateTypes"
            />
          </VCol>
          <VCol
            cols="12"
            md="3"
          >
            <VSelect
              :model-value="filters.statuses"
              :items="statusOptions"
              :label="t('DrillingReportsModule.common.status')"
              multiple
              chips
              closable-chips
              clearable
              density="compact"
              hide-details
              @update:model-value="updateStatuses"
            />
          </VCol>
          <VCol
            cols="12"
            md="3"
          >
            <VSelect
              :model-value="filters.wearLevels"
              :items="wearLevelOptions"
              :label="t('DrillingReportsModule.tools.wearlevel')"
              multiple
              chips
              closable-chips
              clearable
              density="compact"
              hide-details
              @update:model-value="updateWearLevels"
            />
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Chips de filtros activos -->
    <div
      v-if="hasActiveFilters"
      class="d-flex align-center gap-2 mb-4 flex-wrap"
    >
      <span class="text-body-2 text-medium-emphasis">Filtros activos:</span>
      <VChip
        v-for="filter in activeFilters"
        :key="`${filter.key}-${filter.value}`"
        size="small"
        closable
        @click:close="removeFilter(filter.key, filter.value)"
      >
        {{ filter.label }}
      </VChip>
      <VBtn
        size="small"
        variant="text"
        color="error"
        @click="clearAll"
      >
        Limpiar todo
      </VBtn>
    </div>
  </div>
</template>
