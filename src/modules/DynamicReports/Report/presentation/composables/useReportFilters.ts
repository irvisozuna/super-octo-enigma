import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

export interface FilterConfig {
  id: string
  field: string
  type: 'text' | 'number' | 'date' | 'select' | 'range' | 'boolean'
  operator: string
  value: any
  label: string
  placeholder?: string
  required?: boolean
  options?: Array<{ value: any; label: string }>
  min?: number
  max?: number
  step?: number
}

export interface AppliedFilter {
  field: string
  operator: string
  value: any
  type: string
}

export const useReportFilters = (availableFields: any[] = []) => {
  const { t } = useI18n()

  // Estado de filtros
  const filters = ref<FilterConfig[]>([])
  const appliedFilters = ref<AppliedFilter[]>([])
  const isFilterPanelOpen = ref(false)

  // Operadores disponibles por tipo
  const operatorsByType = {
    text: [
      { value: '=', label: t('filter.operators.equals') },
      { value: '!=', label: t('filter.operators.not_equals') },
      { value: 'LIKE', label: t('filter.operators.contains') },
      { value: 'NOT_LIKE', label: t('filter.operators.not_contains') },
      { value: 'STARTS_WITH', label: t('filter.operators.starts_with') },
      { value: 'ENDS_WITH', label: t('filter.operators.ends_with') },
    ],
    number: [
      { value: '=', label: t('filter.operators.equals') },
      { value: '!=', label: t('filter.operators.not_equals') },
      { value: '>', label: t('filter.operators.greater_than') },
      { value: '>=', label: t('filter.operators.greater_equal') },
      { value: '<', label: t('filter.operators.less_than') },
      { value: '<=', label: t('filter.operators.less_equal') },
      { value: 'BETWEEN', label: t('filter.operators.between') },
    ],
    date: [
      { value: '=', label: t('filter.operators.equals') },
      { value: '!=', label: t('filter.operators.not_equals') },
      { value: '>', label: t('filter.operators.after') },
      { value: '>=', label: t('filter.operators.after_equal') },
      { value: '<', label: t('filter.operators.before') },
      { value: '<=', label: t('filter.operators.before_equal') },
      { value: 'BETWEEN', label: t('filter.operators.between') },
    ],
    select: [
      { value: '=', label: t('filter.operators.equals') },
      { value: '!=', label: t('filter.operators.not_equals') },
      { value: 'IN', label: t('filter.operators.in') },
      { value: 'NOT_IN', label: t('filter.operators.not_in') },
    ],
    boolean: [
      { value: '=', label: t('filter.operators.equals') },
      { value: '!=', label: t('filter.operators.not_equals') },
    ],
  }

  // Tipos de campo disponibles
  const fieldTypes = [
    { value: 'text', label: t('filter.types.text') },
    { value: 'number', label: t('filter.types.number') },
    { value: 'date', label: t('filter.types.date') },
    { value: 'select', label: t('filter.types.select') },
    { value: 'range', label: t('filter.types.range') },
    { value: 'boolean', label: t('filter.types.boolean') },
  ]

  // Métodos
  const addFilter = () => {
    const newFilter: FilterConfig = {
      id: `filter_${Date.now()}`,
      field: '',
      type: 'text',
      operator: '=',
      value: '',
      label: '',
      placeholder: '',
      required: false,
    }

    filters.value.push(newFilter)
  }

  const removeFilter = (filterId: string) => {
    const index = filters.value.findIndex(f => f.id === filterId)
    if (index > -1)
      filters.value.splice(index, 1)
  }

  const updateFilter = (filterId: string, updates: Partial<FilterConfig>) => {
    const filter = filters.value.find(f => f.id === filterId)
    if (filter) {
      Object.assign(filter, updates)

      // Reset operator when type changes
      if (updates.type && updates.type !== filter.type) {
        const operators = operatorsByType[updates.type as keyof typeof operatorsByType]

        filter.operator = operators?.[0]?.value || '='
      }
    }
  }

  const applyFilters = () => {
    appliedFilters.value = filters.value
      .filter(filter => filter.value !== '' && filter.value !== null && filter.value !== undefined)
      .map(filter => ({
        field: filter.field,
        operator: filter.operator,
        value: filter.value,
        type: filter.type,
      }))
  }

  const clearFilters = () => {
    filters.value.forEach(filter => {
      filter.value = ''
    })
    appliedFilters.value = []
  }

  const getOperatorsForType = (type: string) => {
    return operatorsByType[type as keyof typeof operatorsByType] || []
  }

  const getFieldOptions = computed(() => {
    return availableFields.map(field => ({
      value: field.name,
      label: field.label || field.name,
      type: field.type,
    }))
  })

  const getFilterByField = (fieldName: string) => {
    return filters.value.find(f => f.field === fieldName)
  }

  const isFilterApplied = (fieldName: string) => {
    return appliedFilters.value.some(f => f.field === fieldName)
  }

  const getAppliedFiltersCount = computed(() => {
    return appliedFilters.value.length
  })

  const hasActiveFilters = computed(() => {
    return appliedFilters.value.length > 0
  })

  // Observar cambios en filtros para aplicar automáticamente
  watch(filters, () => {
    applyFilters()
  }, { deep: true })

  // Métodos para filtros específicos
  const addTextFilter = (field: string, label: string) => {
    const filter: FilterConfig = {
      id: `filter_${Date.now()}`,
      field,
      type: 'text',
      operator: '=',
      value: '',
      label,
      placeholder: t('filter.placeholder.enter_text'),
    }

    filters.value.push(filter)
  }

  const addNumberFilter = (field: string, label: string) => {
    const filter: FilterConfig = {
      id: `filter_${Date.now()}`,
      field,
      type: 'number',
      operator: '=',
      value: null,
      label,
      placeholder: t('filter.placeholder.enter_number'),
    }

    filters.value.push(filter)
  }

  const addDateFilter = (field: string, label: string) => {
    const filter: FilterConfig = {
      id: `filter_${Date.now()}`,
      field,
      type: 'date',
      operator: '=',
      value: null,
      label,
      placeholder: t('filter.placeholder.select_date'),
    }

    filters.value.push(filter)
  }

  const addSelectFilter = (field: string, label: string, options: Array<{ value: any; label: string }>) => {
    const filter: FilterConfig = {
      id: `filter_${Date.now()}`,
      field,
      type: 'select',
      operator: '=',
      value: '',
      label,
      options,
    }

    filters.value.push(filter)
  }

  const addRangeFilter = (field: string, label: string, min?: number, max?: number) => {
    const filter: FilterConfig = {
      id: `filter_${Date.now()}`,
      field,
      type: 'range',
      operator: 'BETWEEN',
      value: [min || 0, max || 100],
      label,
      min,
      max,
    }

    filters.value.push(filter)
  }

  return {
    // State
    filters: readonly(filters),
    appliedFilters: readonly(appliedFilters),
    isFilterPanelOpen,

    // Computed
    getFieldOptions,
    getAppliedFiltersCount,
    hasActiveFilters,

    // Methods
    addFilter,
    removeFilter,
    updateFilter,
    applyFilters,
    clearFilters,
    getOperatorsForType,
    getFilterByField,
    isFilterApplied,

    // Specific filter methods
    addTextFilter,
    addNumberFilter,
    addDateFilter,
    addSelectFilter,
    addRangeFilter,

    // Constants
    operatorsByType,
    fieldTypes,
  }
}
