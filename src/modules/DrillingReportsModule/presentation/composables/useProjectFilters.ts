/**
 * useProjectFilters - Composable para manejar filtros de proyectos
 * Centraliza la lógica de filtrado y construcción de parámetros
 */

import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProjectDisplay } from './useProjectDisplay'
import type { FilterField } from '@/components/filters/BaseFilters.vue'
import type { ActiveFilter } from '@/components/filters/BaseFilterChips.vue'

export interface ProjectFilters {
  search: string
  statuses: string[]
  clients: string[]
}

export interface ClientOption {
  title: string
  value: string
}

export function useProjectFilters(clientOptions: { value: ClientOption[] }) {
  const { t } = useI18n()
  const { statusOptions } = useProjectDisplay()

  const filters = ref<ProjectFilters>({
    search: '',
    statuses: [],
    clients: [],
  })

  // Filter fields configuration for BaseFilters component
  const filterFields = computed<FilterField[]>(() => [
    {
      key: 'search',
      label: t('DrillingReportsModule.common.search'),
      type: 'text',
      icon: 'tabler-search',
      cols: 4,
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
      key: 'clients',
      label: t('DrillingReportsModule.projects.client'),
      type: 'select',
      items: clientOptions.value,
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

    filters.value.clients.forEach(clientId => {
      const option = clientOptions.value.find(opt => opt.value === clientId)
      if (option) {
        active.push({
          key: 'clients',
          label: `Cliente: ${option.title}`,
          value: clientId,
          color: 'primary',
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

    if (filters.value.statuses.length > 0)
      params.status = filters.value.statuses.join(',')

    if (filters.value.clients.length > 0)
      params.client = filters.value.clients.join(',')

    return params
  }

  // Check if any filter is active
  const hasActiveFilters = computed(() => activeFilters.value.length > 0)

  // Clear all filters
  const clearFilters = () => {
    filters.value = {
      search: '',
      statuses: [],
      clients: [],
    }
  }

  // Remove specific filter (updated to accept ActiveFilter)
  const removeFilter = (filter: ActiveFilter) => {
    if (filter.key === 'search')
      filters.value.search = ''

    else if (filter.key === 'statuses')
      filters.value.statuses = filters.value.statuses.filter(v => v !== filter.value)

    else if (filter.key === 'clients')
      filters.value.clients = filters.value.clients.filter(v => v !== filter.value)
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
