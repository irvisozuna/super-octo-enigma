<!-- ReportFiltersOrganism.vue -->
<script setup lang="ts">
import { computed, h, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

// Molecules
import HeaderBarMolecule from '../molecules/HeaderBarMolecule.vue'
import FilterControlMolecule from '../molecules/FilterControlMolecule.vue'
import ExpandablePanelMolecule from '../molecules/ExpandablePanelMolecule.vue'

// Atoms
import ChipAtom from '../atoms/ChipAtom.vue'
import AlertAtom from '../atoms/AlertAtom.vue'
import IconButtonAtom from '../atoms/IconButtonAtom.vue'

import type { FilterConfigDTO, FilterValueDTO } from '../../Application/DTOs/ReportDTOs'

interface Props {
  filters: FilterConfigDTO[]
  appliedFilters: FilterValueDTO[]
  loading?: boolean
}

interface Emits {
  filtersUpdate: [filters: FilterValueDTO[]]
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<Emits>()

const { t } = useI18n()

// Reactive state for filter values
const filterValues = reactive<Record<string, any>>({})

const hasFilters = computed(() => props.filters.length > 0)

const activeFiltersCount = computed(() =>
  Object.values(filterValues).filter(value =>
    value !== undefined && value !== null && value !== '',
  ).length,
)

const hasActiveFilters = computed(() => activeFiltersCount.value > 0)

// Initialize filter values from applied filters
const initializeFilterValues = (): void => {
  props.appliedFilters.forEach(filter => {
    filterValues[filter.field] = filter.value
  })
}

const handleFilterChange = (field: string, value: any): void => {
  filterValues[field] = value
  applyFilters()
}

const applyFilters = (): void => {
  const activeFilters = Object.entries(filterValues)
    .filter(([_, value]) => value !== undefined && value !== null && value !== '')
    .map(([field, value]) => {
      const config = findFilterConfig(field)

      return {
        field,
        operator: config?.operator || 'equals',
        value,
      } as FilterValueDTO
    })

  emit('filtersUpdate', activeFilters)
}

const clearAllFilters = (): void => {
  Object.keys(filterValues).forEach(key => {
    filterValues[key] = undefined
  })
  emit('filtersUpdate', [])
}

const removeFilter = (field: string): void => {
  filterValues[field] = undefined
  applyFilters()
}

const findFilterConfig = (field: string): FilterConfigDTO | null => {
  const findInFilters = (filters: FilterConfigDTO[]): FilterConfigDTO | null => {
    for (const filter of filters) {
      if (filter.type === 'filter' && filter.field === field)
        return filter

      if (filter.type === 'group' && filter.children) {
        const found = findInFilters(filter.children)
        if (found)
          return found
      }
    }

    return null
  }

  return findInFilters(props.filters)
}

const getFieldLabel = (field: string): string => {
  const config = findFilterConfig(field)

  return config?.alias || field
}

// Recursive component for nested filter groups
const FilterGroup = {
  props: ['group', 'filterValues', 'onFilterChange'],
  components: {
    FilterControlMolecule,
    ExpandablePanelMolecule,
  },
  setup(props: any) {
    return () => h(ExpandablePanelMolecule, {
      title: props.group.alias || t('reports.filters.group'),
      icon: 'tabler-category',
      defaultExpanded: true,
    }, {
      default: () => h('div', { class: 'filter-group-content' },
        props.group.children.map((child: any) =>
          child.type === 'group'
            ? h(FilterGroup, {
              group: child,
              filterValues: props.filterValues,
              onFilterChange: props.onFilterChange,
            })
            : h(FilterControlMolecule, {
              'filter': child,
              'modelValue': props.filterValues[child.field],
              'onUpdate:modelValue': (val: any) => props.onFilterChange(child.field, val),
            }),
        ),
      ),
    })
  },
}

// Initialize on mount
initializeFilterValues()
</script>

<template>
  <VNavigationDrawer
    permanent
    location="left"
    width="360"
    class="report-filters-panel"
  >
    <VCard
      class="h-100 d-flex flex-column"
      variant="flat"
    >
      <!-- Header -->
      <VCardTitle class="pa-4 pb-2">
        <div class="d-flex align-center justify-space-between">
          <HeaderBarMolecule
            :title="t('reports.filters.title')"
            :subtitle="t('reports.filters.subtitle')"
            variant="h6"
          />

          <ChipAtom
            v-if="hasActiveFilters"
            :label="`${activeFiltersCount} ${t('reports.filters.active')}`"
            icon="tabler-check"
            variant="tonal"
            color="primary"
            size="small"
          />
        </div>
      </VCardTitle>

      <!-- Active Filters Chips -->
      <VCardText
        v-if="hasActiveFilters"
        class="pa-4 pt-0"
      >
        <div class="d-flex flex-wrap gap-2 mb-2">
          <ChipAtom
            v-for="(value, field) in filterValues"
            :key="field"
            :label="`${getFieldLabel(field)}: ${value}`"
            icon="tabler-filter"
            variant="elevated"
            color="primary"
            size="small"
            closable
            @close="removeFilter(field)"
          />
        </div>

        <div class="d-flex justify-end">
          <IconButtonAtom
            icon="tabler-x"
            :tooltip="t('reports.filters.clearAll')"
            variant="text"
            size="small"
            @click="clearAllFilters"
          />
        </div>
      </VCardText>

      <!-- Filters Content -->
      <VCardText class="flex-grow-1 pa-4">
        <div
          v-if="hasFilters"
          class="filters-container"
        >
          <!-- Render filters -->
          <div
            v-for="filter in filters"
            :key="filter.field || filter.id"
            class="mb-4"
          >
            <!-- Simple Filter -->
            <FilterControlMolecule
              v-if="filter.type === 'filter'"
              :filter="filter"
              :model-value="filterValues[filter.field]"
              :loading="loading"
              @update:model-value="handleFilterChange(filter.field, $event)"
            />

            <!-- Filter Group -->
            <FilterGroup
              v-else-if="filter.type === 'group'"
              :group="filter"
              :filter-values="filterValues"
              :on-filter-change="handleFilterChange"
            />
          </div>
        </div>

        <!-- No Filters Available -->
        <AlertAtom
          v-else
          type="info"
          variant="tonal"
          :title="t('reports.filters.noFiltersTitle')"
          :text="t('reports.filters.noFiltersText')"
          icon="tabler-info-circle"
        />
      </VCardText>

      <!-- Loading Overlay -->
      <VOverlay
        :model-value="loading"
        contained
        class="align-center justify-center"
      >
        <VProgressCircular
          indeterminate
          size="32"
          color="primary"
        />
      </VOverlay>
    </VCard>
  </VNavigationDrawer>
</template>

<style scoped>
.report-filters-panel {
  background-color: rgb(var(--v-theme-surface));
  border-inline-end: 1px solid rgb(var(--v-theme-outline-variant));
}

.filters-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-group-content {
  border-inline-start: 2px solid rgb(var(--v-theme-outline-variant));
  margin-inline-start: 8px;
  padding-inline-start: 12px;
}

/* Smooth transitions */
.v-navigation-drawer {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Responsive behavior */
@media (max-width: 1024px) {
  .report-filters-panel {
    position: fixed !important;
    z-index: 1000;
  }
}
</style>
