import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { DashboardApiService } from '../../infrastructure/api/services/DashboardApiService'
import { DashboardMapper } from '../../application/mappers/DashboardMapper'
import { DashboardRepositoryImpl } from '../../infrastructure/persistence/repositories/DashboardRepositoryImpl'
import type { Dashboard } from '../../domain/entities/Dashboard'
import type {
  DashboardListFiltersDto,
  DashboardCreateDto,
  DashboardUpdateDto,
} from '../../application/dtos/DashboardDtos'
import type { WidgetInstanceConfig } from '../../../Widget/domain/types/WidgetTypes'
import type { DashboardGlobalFilter } from '../../domain/types/DashboardTypes'

/**
 * Store de Pinia para gestión de Dashboards
 */
export const useDashboardStore = defineStore('dashboard', () => {
  // State
  const items = ref<Dashboard[]>([])
  const currentItem = ref<Dashboard | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Pagination
  const page = ref(1)
  const itemsPerPage = ref(20)
  const total = ref(0)
  const totalPages = ref(0)

  // Filters
  const filters = ref<DashboardListFiltersDto>({})

  // Collections
  const favorites = ref<Dashboard[]>([])
  const recent = ref<Dashboard[]>([])
  const shared = ref<Dashboard[]>([])

  // Selection
  const selectedItems = ref<Dashboard[]>([])

  // Services
  const apiService = new DashboardApiService()
  const repository = new DashboardRepositoryImpl()

  // Computed
  const currentPage = computed(() => page.value)
  const perPage = computed(() => itemsPerPage.value)
  const hasItems = computed(() => items.value.length > 0)
  const isEmpty = computed(() => items.value.length === 0 && !loading.value)
  const hasFavorites = computed(() => favorites.value.length > 0)

  // Actions

  /**
   * Obtiene lista de dashboards con filtros y paginación
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
        items.value = data.dashboards
        total.value = data.total
        totalPages.value = data.totalPages
      }
      else {
        error.value = result.error
      }
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch dashboards'
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Obtiene todos los dashboards sin paginación
   */
  async function fetchAll() {
    loading.value = true
    error.value = null

    try {
      const result = await repository.findAll()

      if (result.isSuccess) {
        items.value = result.getValue()
      }
      else {
        error.value = result.error
      }
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch all dashboards'
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Obtiene un dashboard por ID
   */
  async function fetchById(id: string) {
    loading.value = true
    error.value = null

    try {
      const result = await repository.findById(id)

      if (result.isSuccess) {
        currentItem.value = result.getValue()

        // Incrementar contador de vistas
        await apiService.incrementViewCount({ dashboard_id: id })
      }
      else {
        error.value = result.error
      }
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch dashboard'
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Obtiene un dashboard por slug
   */
  async function fetchBySlug(slug: string) {
    loading.value = true
    error.value = null

    try {
      const result = await repository.findBySlug(slug)

      if (result.isSuccess) {
        currentItem.value = result.getValue()
      }
      else {
        error.value = result.error
      }
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch dashboard by slug'
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Obtiene dashboards favoritos
   */
  async function fetchFavorites() {
    loading.value = true
    error.value = null

    try {
      const result = await repository.findFavorites()

      if (result.isSuccess) {
        favorites.value = result.getValue()
      }
      else {
        error.value = result.error
      }
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch favorite dashboards'
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Obtiene dashboards recientes
   */
  async function fetchRecent(limit = 10) {
    loading.value = true
    error.value = null

    try {
      const result = await repository.findRecent(limit)

      if (result.isSuccess) {
        recent.value = result.getValue()
      }
      else {
        error.value = result.error
      }
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch recent dashboards'
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Obtiene dashboards compartidos
   */
  async function fetchShared() {
    loading.value = true
    error.value = null

    try {
      const result = await repository.findShared()

      if (result.isSuccess) {
        shared.value = result.getValue()
      }
      else {
        error.value = result.error
      }
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch shared dashboards'
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Obtiene dashboards por categoría
   */
  async function fetchByCategory(categoryId: string) {
    loading.value = true
    error.value = null

    try {
      const result = await repository.findByCategory(categoryId)

      if (result.isSuccess) {
        items.value = result.getValue()
      }
      else {
        error.value = result.error
      }
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch dashboards by category'
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Crea un nuevo dashboard
   */
  async function createItem(data: DashboardCreateDto) {
    loading.value = true
    error.value = null

    try {
      const response = await apiService.create(data)
      const dashboard = DashboardMapper.toDomain(response.data)

      if (dashboard) {
        items.value.unshift(dashboard)
        currentItem.value = dashboard
      }

      await fetchList()

      return response.data
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create dashboard'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Actualiza un dashboard existente
   */
  async function updateItem(id: string, data: DashboardUpdateDto) {
    loading.value = true
    error.value = null

    try {
      const response = await apiService.update(id, data)
      const dashboard = DashboardMapper.toDomain(response.data)

      if (dashboard) {
        const index = items.value.findIndex(item => item.id === id)
        if (index !== -1) {
          items.value[index] = dashboard
        }

        if (currentItem.value?.id === id) {
          currentItem.value = dashboard
        }
      }

      await fetchList()

      return response.data
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update dashboard'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Elimina un dashboard
   */
  async function deleteItem(id: string) {
    loading.value = true
    error.value = null

    try {
      await apiService.delete(id)

      items.value = items.value.filter(item => item.id !== id)

      if (currentItem.value?.id === id) {
        currentItem.value = null
      }

      await fetchList()
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete dashboard'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Clona un dashboard
   */
  async function cloneItem(id: string, newName: string, includeWidgets = true) {
    loading.value = true
    error.value = null

    try {
      const response = await apiService.clone({
        dashboard_id: id,
        new_name: newName,
        include_widgets: includeWidgets,
      })

      const dashboard = DashboardMapper.toDomain(response.data)

      if (dashboard) {
        items.value.unshift(dashboard)
      }

      await fetchList()

      return response.data
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to clone dashboard'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Toggle favorito
   */
  async function toggleFavorite(id: string) {
    loading.value = true
    error.value = null

    try {
      const response = await apiService.toggleFavorite({ dashboard_id: id })
      const dashboard = DashboardMapper.toDomain(response.data)

      if (dashboard) {
        const index = items.value.findIndex(item => item.id === id)
        if (index !== -1) {
          items.value[index] = dashboard
        }

        if (currentItem.value?.id === id) {
          currentItem.value = dashboard
        }

        // Actualizar lista de favoritos
        await fetchFavorites()
      }

      return response.data
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to toggle favorite'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Agrega un widget al dashboard
   */
  async function addWidget(dashboardId: string, widgetConfig: WidgetInstanceConfig) {
    loading.value = true
    error.value = null

    try {
      const response = await apiService.addWidget({
        dashboard_id: dashboardId,
        widget_config: widgetConfig,
      })

      const dashboard = DashboardMapper.toDomain(response.data)

      if (dashboard && currentItem.value?.id === dashboardId) {
        currentItem.value = dashboard
      }

      return response.data
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add widget'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Remueve un widget del dashboard
   */
  async function removeWidget(dashboardId: string, widgetInstanceId: string) {
    loading.value = true
    error.value = null

    try {
      const response = await apiService.removeWidget({
        dashboard_id: dashboardId,
        widget_instance_id: widgetInstanceId,
      })

      const dashboard = DashboardMapper.toDomain(response.data)

      if (dashboard && currentItem.value?.id === dashboardId) {
        currentItem.value = dashboard
      }

      return response.data
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to remove widget'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Actualiza el layout de widgets (drag & drop)
   */
  async function updateWidgetsLayout(
    dashboardId: string,
    widgets: Array<{ id: string; position: any }>,
  ) {
    loading.value = true
    error.value = null

    try {
      const response = await apiService.updateWidgetsLayout(dashboardId, widgets)

      const dashboard = DashboardMapper.toDomain(response.data)

      if (dashboard && currentItem.value?.id === dashboardId) {
        currentItem.value = dashboard
      }

      return response.data
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update layout'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Agrega un filtro global
   */
  async function addGlobalFilter(dashboardId: string, filter: DashboardGlobalFilter) {
    loading.value = true
    error.value = null

    try {
      const response = await apiService.addGlobalFilter({
        dashboard_id: dashboardId,
        filter,
      })

      const dashboard = DashboardMapper.toDomain(response.data)

      if (dashboard && currentItem.value?.id === dashboardId) {
        currentItem.value = dashboard
      }

      return response.data
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add filter'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Refresca todos los widgets del dashboard
   */
  async function refreshAllWidgets(dashboardId: string) {
    loading.value = true
    error.value = null

    try {
      return await apiService.refreshAllWidgets(dashboardId)
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to refresh widgets'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Exporta el dashboard
   */
  async function exportDashboard(dashboardId: string, format: 'pdf' | 'png' | 'jpg' | 'json') {
    loading.value = true
    error.value = null

    try {
      return await apiService.export({
        dashboard_id: dashboardId,
        format,
      })
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to export dashboard'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Obtiene estadísticas del dashboard
   */
  async function getStats(dashboardId: string) {
    try {
      return await apiService.getStats(dashboardId)
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to get stats'
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
    page.value = 1
  }

  /**
   * Actualiza los filtros
   */
  function setFilters(newFilters: DashboardListFiltersDto) {
    filters.value = newFilters
    page.value = 1
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
    favorites.value = []
    recent.value = []
    shared.value = []
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
    hasFavorites,

    // Filters
    filters,

    // Collections
    favorites,
    recent,
    shared,

    // Selection
    selectedItems,

    // Actions
    fetchList,
    fetchAll,
    fetchById,
    fetchBySlug,
    fetchFavorites,
    fetchRecent,
    fetchShared,
    fetchByCategory,
    createItem,
    updateItem,
    deleteItem,
    cloneItem,
    toggleFavorite,
    addWidget,
    removeWidget,
    updateWidgetsLayout,
    addGlobalFilter,
    refreshAllWidgets,
    exportDashboard,
    getStats,
    setPage,
    setItemsPerPage,
    setFilters,
    clearFilters,
    clearError,
    reset,
  }
})
