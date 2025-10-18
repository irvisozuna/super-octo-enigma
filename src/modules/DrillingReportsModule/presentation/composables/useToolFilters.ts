/**
 * useToolFilters - Composable para manejar filtros de herramientas
 * Centraliza la lógica de filtrado y construcción de parámetros
 */

import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToolDisplay } from './useToolDisplay'
import type { FilterField } from '@/components/filters/BaseFilters.vue'
import type { ActiveFilter } from '@/components/filters/BaseFilterChips.vue'

export interface ToolFilters {
  search: string
  types: string[]
  statuses: string[]
  wearLevels: string[]
}

export function useToolFilters() {
  const { t } = useI18n()
  const { toolTypeOptions, statusOptions, wearLevelOptions } = useToolDisplay()

  const filters = ref<ToolFilters>({
    search: '',
    types: [],
    statuses: [],
    wearLevels: [],
  })

  // Filter fields configuration for BaseFilters component
  const filterFields = computed<FilterField[]>(() => [
    {
      key: 'search',
      label: t('DrillingReportsModule.common.search'),
      type: 'text',
      icon: 'tabler-search',
      cols: 3,
    },
    {
      key: 'types',
      label: t('DrillingReportsModule.tools.type'),
      type: 'select',
      items: toolTypeOptions.value,
      multiple: true,
      cols: 3,
    },
    {
      key: 'statuses',
      label: t('DrillingReportsModule.common.status'),
      type: 'select',
      items: statusOptions.value,
      multiple: true,
      cols: 3,
    },
    {
      key: 'wearLevels',
      label: t('DrillingReportsModule.tools.wearlevel'),
      type: 'select',
      items: wearLevelOptions.value,
      multiple: true,
      cols: 3,
    },
  ])

  // Active filters for chips display
  const activeFilters = computed<ActiveFilter[]>(() => {
    const active: ActiveFilter[] = []

    if (filters.value.search) {
      active.push({
        key: 'search',
        label: `Búsqueda: ${filters.value.search}`,
        value: filters.value.search,
      })
    }

    filters.value.types.forEach(type => {
      const option = toolTypeOptions.value.find(opt => opt.value === type)
      if (option) {
        active.push({
          key: 'types',
          label: `Tipo: ${option.title}`,
          value: type,
          color: 'primary',
        })
      }
    })

    filters.value.statuses.forEach(status => {
      const option = statusOptions.value.find(opt => opt.value === status)
      if (option) {
        active.push({
          key: 'statuses',
          label: `Estado: ${option.title}`,
          value: status,
          color: option.color,
        })
      }
    })

    filters.value.wearLevels.forEach(wearLevel => {
      const option = wearLevelOptions.value.find(opt => opt.value === wearLevel)
      if (option) {
        active.push({
          key: 'wearLevels',
          label: `Desgaste: ${option.title}`,
          value: wearLevel,
          color: option.color,
        })
      }
    })

    return active
  })

  // Build query params from filters
  const buildFilterParams = () => {
    const params: Record<string, any> = {}

    if (filters.value.search)
      params.search = filters.value.search

    if (filters.value.types.length > 0)
      params.type = filters.value.types.join(',')

    if (filters.value.statuses.length > 0)
      params.status = filters.value.statuses.join(',')

    if (filters.value.wearLevels.length > 0)
      params.wear_level = filters.value.wearLevels.join(',')

    return params
  }

  // Check if any filter is active
  const hasActiveFilters = computed(() => activeFilters.value.length > 0)

  // Clear all filters
  const clearFilters = () => {
    filters.value = {
      search: '',
      types: [],
      statuses: [],
      wearLevels: [],
    }
  }

  // Remove specific filter (updated to accept ActiveFilter)
  const removeFilter = (filter: ActiveFilter) => {
    if (filter.key === 'search')
      filters.value.search = ''

    else if (filter.key === 'types')
      filters.value.types = filters.value.types.filter(v => v !== filter.value)

    else if (filter.key === 'statuses')
      filters.value.statuses = filters.value.statuses.filter(v => v !== filter.value)

    else if (filter.key === 'wearLevels')
      filters.value.wearLevels = filters.value.wearLevels.filter(v => v !== filter.value)
  }

  return {
    filters,
    filterFields,
    activeFilters,
    buildFilterParams,
    hasActiveFilters,
    clearFilters,
    removeFilter,
  }
}
