import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { WidgetApiService } from '../../infrastructure/api/services/WidgetApiService'
import { WidgetMapper } from '../../application/mappers/WidgetMapper'
import { WidgetRepositoryImpl } from '../../infrastructure/persistence/repositories/WidgetRepositoryImpl'
import type { Widget } from '../../domain/entities/Widget'
import type { WidgetCreateDto, WidgetListFiltersDto, WidgetUpdateDto } from '../../application/dtos/WidgetDtos'
import { WidgetFactory } from '../../domain/factories/WidgetFactory'
import type { WidgetTypeEnum } from '../../domain/enums/WidgetTypeEnum'

/**
 * Store de Pinia para gestión de Widgets
 */
export const useWidgetStore = defineStore('widget', () => {
  // State
  const items = ref<Widget[]>([])
  const currentItem = ref<Widget | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Pagination
  const page = ref(1)
  const itemsPerPage = ref(20)
  const total = ref(0)
  const totalPages = ref(0)

  // Filters
  const filters = ref<WidgetListFiltersDto>({})

  // Selection
  const selectedItems = ref<Widget[]>([])

  // Services
  const apiService = new WidgetApiService()
  const repository = new WidgetRepositoryImpl()

  // Computed
  const currentPage = computed(() => page.value)
  const perPage = computed(() => itemsPerPage.value)
  const hasItems = computed(() => items.value.length > 0)
  const isEmpty = computed(() => items.value.length === 0 && !loading.value)

  // Actions

  /**
   * Obtiene lista de widgets con filtros y paginación
   */
  async function fetchList() {
    loading.value = true
    error.value = null

    try {
      const result = await repository.findWithFilters({
        page: page.value,
        limit: itemsPerPage.value,
        ...filters.value,
      })

      if (result.isSuccess) {
        const data = result.getValue()

        items.value = data.widgets
        total.value = data.total
        totalPages.value = data.totalPages
      }
      else {
        error.value = result.error
      }
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch widgets'
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Obtiene todos los widgets sin paginación
   */
  async function fetchAll() {
    loading.value = true
    error.value = null

    try {
      const result = await repository.findAll()

      if (result.isSuccess)
        items.value = result.getValue()

      else
        error.value = result.error
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch all widgets'
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Obtiene un widget por ID
   */
  async function fetchById(id: string) {
    loading.value = true
    error.value = null

    try {
      const result = await repository.findById(id)

      if (result.isSuccess)
        currentItem.value = result.getValue()

      else
        error.value = result.error
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch widget'
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Obtiene widgets por data source
   */
  async function fetchByDataSource(dataSourceId: string) {
    loading.value = true
    error.value = null

    try {
      const result = await repository.findByDataSource(dataSourceId)

      if (result.isSuccess)
        items.value = result.getValue()

      else
        error.value = result.error
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch widgets by data source'
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Obtiene widgets por tipo
   */
  async function fetchByType(type: string) {
    loading.value = true
    error.value = null

    try {
      const result = await repository.findByType(type)

      if (result.isSuccess)
        items.value = result.getValue()

      else
        error.value = result.error
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch widgets by type'
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Crea un nuevo widget
   */
  async function createItem(data: WidgetCreateDto) {
    loading.value = true
    error.value = null

    try {
      const response = await apiService.create(data)
      const widget = WidgetMapper.toDomain(response.data)

      if (widget) {
        items.value.unshift(widget)
        currentItem.value = widget
      }

      await fetchList()

      return response.data
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create widget'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Crea un widget usando el factory
   */
  async function createFromType(type: WidgetTypeEnum, data: Partial<WidgetCreateDto>) {
    const widgetResult = WidgetFactory.createFromType(type, data as any)

    if (widgetResult.isFailure) {
      error.value = widgetResult.error
      throw new Error(widgetResult.error)
    }

    const widget = widgetResult.getValue()
    const dto = WidgetMapper.toPersistence(widget)

    return await createItem(dto)
  }

  /**
   * Actualiza un widget existente
   */
  async function updateItem(id: string, data: WidgetUpdateDto) {
    loading.value = true
    error.value = null

    try {
      const response = await apiService.update(id, data)
      const widget = WidgetMapper.toDomain(response.data)

      if (widget) {
        const index = items.value.findIndex(item => item.id === id)
        if (index !== -1)
          items.value[index] = widget

        if (currentItem.value?.id === id)
          currentItem.value = widget
      }

      await fetchList()

      return response.data
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update widget'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Elimina un widget
   */
  async function deleteItem(id: string) {
    loading.value = true
    error.value = null

    try {
      await apiService.delete(id)

      items.value = items.value.filter(item => item.id !== id)

      if (currentItem.value?.id === id)
        currentItem.value = null

      await fetchList()
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete widget'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Clona un widget
   */
  async function cloneItem(id: string, newName: string) {
    loading.value = true
    error.value = null

    try {
      const response = await apiService.clone(id, newName)
      const widget = WidgetMapper.toDomain(response.data)

      if (widget)
        items.value.unshift(widget)

      await fetchList()

      return response.data
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to clone widget'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Toggle activo/inactivo
   */
  async function toggleActive(id: string) {
    loading.value = true
    error.value = null

    try {
      const response = await apiService.toggleActive(id)
      const widget = WidgetMapper.toDomain(response.data)

      if (widget) {
        const index = items.value.findIndex(item => item.id === id)
        if (index !== -1)
          items.value[index] = widget

        if (currentItem.value?.id === id)
          currentItem.value = widget
      }

      return response.data
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to toggle widget'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Ejecuta la consulta de un widget
   */
  async function executeQuery(id: string, params?: any) {
    loading.value = true
    error.value = null

    try {
      return await apiService.executeQuery(id, params)
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to execute widget query'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Refresca los datos de un widget
   */
  async function refreshWidget(id: string) {
    loading.value = true
    error.value = null

    try {
      return await apiService.refresh(id)
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to refresh widget'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Limpia el cache de un widget
   */
  async function clearCache(id: string) {
    try {
      await apiService.clearCache(id)
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to clear cache'
      throw err
    }
  }

  /**
   * Limpia el cache de todos los widgets
   */
  async function clearAllCache() {
    try {
      await apiService.clearAllCache()
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to clear all cache'
      throw err
    }
  }

  /**
   * Obtiene estadísticas de un widget
   */
  async function getStats(id: string) {
    try {
      return await apiService.getStats(id)
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to get widget stats'
      throw err
    }
  }

  /**
   * Actualiza la página actual
   */
  function setPage(newPage: number) {
    page.value = newPage
  }

  /**
   * Actualiza los items por página
   */
  function setItemsPerPage(count: number) {
    itemsPerPage.value = count
    page.value = 1 // Reset to first page
  }

  /**
   * Actualiza los filtros
   */
  function setFilters(newFilters: WidgetListFiltersDto) {
    filters.value = newFilters
    page.value = 1 // Reset to first page
  }

  /**
   * Limpia los filtros
   */
  function clearFilters() {
    filters.value = {}
    page.value = 1
  }

  /**
   * Limpia los errores
   */
  function clearError() {
    error.value = null
  }

  /**
   * Resetea el estado
   */
  function reset() {
    items.value = []
    currentItem.value = null
    loading.value = false
    error.value = null
    page.value = 1
    total.value = 0
    totalPages.value = 0
    filters.value = {}
    selectedItems.value = []
  }

  return {
    // State
    items,
    currentItem,
    loading,
    error,

    // Pagination
    page,
    itemsPerPage,
    total,
    totalPages,
    currentPage,
    perPage,

    // Computed
    hasItems,
    isEmpty,

    // Filters
    filters,

    // Selection
    selectedItems,

    // Actions
    fetchList,
    fetchAll,
    fetchById,
    fetchByDataSource,
    fetchByType,
    createItem,
    createFromType,
    updateItem,
    deleteItem,
    cloneItem,
    toggleActive,
    executeQuery,
    refreshWidget,
    clearCache,
    clearAllCache,
    getStats,
    setPage,
    setItemsPerPage,
    setFilters,
    clearFilters,
    clearError,
    reset,
  }
})
