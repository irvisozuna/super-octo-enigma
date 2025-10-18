/**
 * useDataTable - Composable para estandarizar el manejo de tablas con paginación
 *
 * Proporciona utilidades comunes para:
 * - Parsing de respuestas del backend
 * - Manejo de paginación
 * - Manejo de filtros
 * - Construcción de parámetros de consulta
 */

import { type Ref, computed, ref } from 'vue'

export interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface ApiResponse<T> {
  data: T[]
  meta: PaginationMeta
  links?: {
    first: string
    last: string
    prev: string | null
    next: string | null
  }
}

export interface DataTableState<T> {
  items: Ref<T[]>
  pagination: Ref<PaginationMeta>
  loading: Ref<boolean>
  error: Ref<string | null>
}

/**
 * Parse response from backend API
 * Handles both paginated and non-paginated responses
 */
export function parseApiResponse<T>(response: any): { data: T[]; meta: PaginationMeta } {
  // rawApi returns the parsed JSON directly, so response is the actual data
  // Check if response has paginated structure directly (Laravel pagination)
  if (response && typeof response === 'object' && 'data' in response && 'meta' in response) {
    return {
      data: response.data || [],
      meta: {
        current_page: response.meta.current_page || 1,
        last_page: response.meta.last_page || 1,
        per_page: response.meta.per_page || 15,
        total: response.meta.total || 0,
      },
    }
  }

  // Handle old axios-style response (response.data)
  const responseData = response.data

  // Handle paginated response with meta structure
  if (responseData && typeof responseData === 'object' && 'data' in responseData && 'meta' in responseData) {
    return {
      data: responseData.data || [],
      meta: {
        current_page: responseData.meta.current_page || 1,
        last_page: responseData.meta.last_page || 1,
        per_page: responseData.meta.per_page || 15,
        total: responseData.meta.total || 0,
      },
    }
  }

  // Fallback to old structure (data at root with pagination fields)
  if (responseData && typeof responseData === 'object' && 'data' in responseData) {
    return {
      data: responseData.data || [],
      meta: {
        current_page: responseData.current_page || 1,
        last_page: responseData.last_page || 1,
        per_page: responseData.per_page || 15,
        total: responseData.total || 0,
      },
    }
  }

  // Direct array response
  if (Array.isArray(responseData)) {
    return {
      data: responseData,
      meta: {
        current_page: 1,
        last_page: 1,
        per_page: responseData.length,
        total: responseData.length,
      },
    }
  }

  // Fallback
  return {
    data: [],
    meta: {
      current_page: 1,
      last_page: 1,
      per_page: 15,
      total: 0,
    },
  }
}

/**
 * Create a data table state
 */
export function createDataTableState<T>(initialPerPage = 15): DataTableState<T> {
  const items = ref<T[]>([]) as Ref<T[]>

  const pagination = ref<PaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: initialPerPage,
    total: 0,
  })

  const loading = ref(false)
  const error = ref<string | null>(null)

  return {
    items,
    pagination,
    loading,
    error,
  }
}

/**
 * Update data table state from API response
 */
export function updateDataTableState<T>(
  state: DataTableState<T>,
  response: any,
): void {
  const parsed = parseApiResponse<T>(response)

  state.items.value = parsed.data
  state.pagination.value = parsed.meta
}

/**
 * Build query parameters for API request
 */
export function buildQueryParams(
  page: number,
  perPage: number,
  filters: Record<string, any> = {},
  sortBy?: string,
  sortOrder: 'asc' | 'desc' = 'asc',
): Record<string, any> {
  const params: Record<string, any> = {
    page,
    per_page: perPage,
  }

  // Add filters
  Object.keys(filters).forEach(key => {
    const value = filters[key]

    // Skip empty values
    if (value === null || value === undefined || value === '')
      return

    // Handle arrays (for multiple selection)
    if (Array.isArray(value)) {
      if (value.length > 0)
        params[key] = value.join(',')
    }
    else {
      params[key] = value
    }
  })

  // Add sorting
  if (sortBy) {
    params.sort_by = sortBy
    params.sort_order = sortOrder
  }

  return params
}

/**
 * Composable para manejar estado de tabla
 */
export function useDataTable<T>(initialPerPage = 15) {
  const state = createDataTableState<T>(initialPerPage)

  const hasItems = computed(() => state.items.value.length > 0)
  const isEmpty = computed(() => !state.loading.value && state.items.value.length === 0)
  const totalItems = computed(() => state.pagination.value.total)

  const setPage = (page: number) => {
    state.pagination.value.current_page = page
  }

  const setItemsPerPage = (perPage: number) => {
    state.pagination.value.per_page = perPage
  }

  const resetPagination = () => {
    state.pagination.value.current_page = 1
  }

  return {
    // State
    items: state.items,
    pagination: state.pagination,
    loading: state.loading,
    error: state.error,

    // Computed
    hasItems,
    isEmpty,
    totalItems,

    // Methods
    setPage,
    setItemsPerPage,
    resetPagination,
    updateState: (response: any) => updateDataTableState(state, response),
    buildParams: buildQueryParams,
  }
}
