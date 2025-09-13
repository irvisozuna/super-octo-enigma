import { computed, ref, watch } from 'vue'
import { ConcessionHolderApiService } from '../../infrastructure/api/services/ConcessionHolderApiService'
import type {
  ConcessionHolderFilterDto,
  ConcessionHolderListDto,
  PaginatedResponseDto,
} from '../../application/dtos/ConcessionHolderDtos'

export function useConcessionHolderPagination() {
  const apiService = new ConcessionHolderApiService()

  // Estado de la paginación
  const data = ref<ConcessionHolderListDto[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const currentPage = ref(1)
  const perPage = ref(20)
  const total = ref(0)
  const lastPage = ref(1)
  const from = ref(0)
  const to = ref(0)

  // Filtros
  const filters = ref<ConcessionHolderFilterDto>({})

  // Computed para información de paginación
  const paginationInfo = computed(() => ({
    currentPage: currentPage.value,
    lastPage: lastPage.value,
    perPage: perPage.value,
    total: total.value,
    from: from.value,
    to: to.value,
    hasNextPage: currentPage.value < lastPage.value,
    hasPrevPage: currentPage.value > 1,
    totalPages: lastPage.value,
  }))

  // Función para cargar datos
  const loadData = async (options?: any) => {
    try {
      loading.value = true
      error.value = null

      // Manejar parámetros de VDataTableServer
      let targetPage = currentPage.value
      let targetPerPage = perPage.value
      const targetFilters = { ...filters.value }

      if (options) {
        console.log('🔍 Options recibidas:', JSON.stringify(options, null, 2))

        // Si viene de VDataTableServer, extraer los parámetros
        if (typeof options === 'object') {
          targetPage = options.page || currentPage.value
          targetPerPage = options.itemsPerPage || perPage.value

          // Manejar ordenamiento
          if (options.sortBy && options.sortBy.length > 0) {
            // sortBy puede ser un array de strings o de objetos
            const sortByValue = options.sortBy[0]

            if (typeof sortByValue === 'string') {
              targetFilters.sort_by = sortByValue
            }
            else if (sortByValue && typeof sortByValue === 'object' && sortByValue.key) {
              targetFilters.sort_by = sortByValue.key
            }
            else {
              // Si es un objeto sin key, intentar usar el valor directamente
              targetFilters.sort_by = String(sortByValue)
            }

            // sortDesc puede ser un array de booleans
            const sortDescValue = options.sortDesc && options.sortDesc[0]

            // Determinar el orden basado en sortDesc
            if (sortDescValue !== undefined && sortDescValue !== null) {
              // sortDesc true = descendente (↓), false = ascendente (↑)
              targetFilters.sort_order = sortDescValue ? 'desc' : 'asc'
              console.log('✅ Usando sortDesc del VDataTableServer:', sortDescValue, '→', targetFilters.sort_order)
            }
            else {
              // Si sortDesc no está definido, alternar basado en el estado actual
              if (targetFilters.sort_by && filters.value.sort_by === targetFilters.sort_by) {
                targetFilters.sort_order = filters.value.sort_order === 'asc' ? 'desc' : 'asc'
                console.log('🔄 Alternando orden basado en estado anterior:', targetFilters.sort_order)
              }
              else {
                targetFilters.sort_order = 'asc'
                console.log('🆕 Nuevo ordenamiento, empezando con asc')
              }
            }

            console.log('🔍 Parámetros de ordenamiento finales:', {
              sort_by: targetFilters.sort_by,
              sort_order: targetFilters.sort_order,
            })
          }
        }
        else if (typeof options === 'number') {
          // Si es solo un número, es la página
          targetPage = options
        }
      }

      const response: PaginatedResponseDto<ConcessionHolderListDto> = await apiService.getList({
        ...targetFilters,
        page: targetPage,
        per_page: targetPerPage,
      })

      // Actualizar datos
      data.value = response.data
      currentPage.value = response.meta.current_page
      perPage.value = response.meta.per_page
      lastPage.value = response.meta.last_page
      total.value = response.meta.total
      from.value = response.meta.from
      to.value = response.meta.to

      // Actualizar filtros si se proporcionaron nuevos
      if (options && typeof options === 'object')
        filters.value = { ...targetFilters }
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar los datos'
      console.error('Error loading concession holders:', err)
    }
    finally {
      loading.value = false
    }
  }

  // Función para cambiar página
  const goToPage = (page: number) => {
    if (page >= 1 && page <= lastPage.value)
      loadData({ page, itemsPerPage: perPage.value })
  }

  // Función para cambiar elementos por página
  const changePerPage = (newPerPage: number) => {
    perPage.value = newPerPage
    currentPage.value = 1 // Reset a la primera página
    loadData({ page: 1, itemsPerPage: newPerPage })
  }

  // Función para aplicar filtros
  const applyFilters = (newFilters: ConcessionHolderFilterDto) => {
    filters.value = { ...newFilters }
    currentPage.value = 1 // Reset a la primera página
    loadData({ page: 1, itemsPerPage: perPage.value })
  }

  // Función para limpiar filtros
  const clearFilters = () => {
    filters.value = {}
    currentPage.value = 1
    loadData({ page: 1, itemsPerPage: perPage.value })
  }

  // Función para búsqueda
  const search = (query: string) => {
    filters.value = { ...filters.value, search: query }
    currentPage.value = 1
    loadData({ page: 1, itemsPerPage: perPage.value })
  }

  // Función para ordenar
  const sort = (sortBy: string, sortOrder: 'asc' | 'desc' = 'asc') => {
    filters.value = {
      ...filters.value,
      sort_by: sortBy,
      sort_order: sortOrder,
    }
    loadData({ page: currentPage.value, itemsPerPage: perPage.value })
  }

  // Función para refrescar datos actuales
  const refresh = () => {
    loadData({ page: currentPage.value, itemsPerPage: perPage.value })
  }

  // Watcher para cambios en perPage
  watch(perPage, () => {
    if (data.value.length > 0)
      loadData({ page: 1, itemsPerPage: perPage.value })
  })

  return {
    // Estado
    data,
    loading,
    error,
    currentPage,
    perPage,
    total,
    lastPage,
    from,
    to,
    filters,

    // Computed
    paginationInfo,

    // Métodos
    loadData,
    goToPage,
    changePerPage,
    applyFilters,
    clearFilters,
    search,
    sort,
    refresh,
  }
}
