import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useDashboardStore } from '../stores/dashboardStore'
import type {
  DashboardCreateDto,
  DashboardListFiltersDto,
  DashboardUpdateDto,
} from '../../application/dtos/DashboardDtos'
import type { WidgetInstanceConfig } from '../../../Widget/domain/types/WidgetTypes'
import type { DashboardGlobalFilter } from '../../domain/types/DashboardTypes'

/**
 * Composable para operaciones CRUD de dashboards
 */
export function useDashboard() {
  const dashboardStore = useDashboardStore()

  const {
    items,
    currentItem,
    loading,
    error,
    page,
    itemsPerPage,
    total,
    totalPages,
    hasItems,
    isEmpty,
    filters,
    favorites,
    recent,
    shared,
    hasFavorites,
  } = storeToRefs(dashboardStore)

  /**
   * Obtiene lista de dashboards con filtros
   */
  async function fetchDashboards(customFilters?: DashboardListFiltersDto) {
    if (customFilters)
      dashboardStore.setFilters(customFilters)

    await dashboardStore.fetchList()
  }

  /**
   * Obtiene todos los dashboards sin paginación
   */
  async function fetchAllDashboards() {
    await dashboardStore.fetchAll()
  }

  /**
   * Obtiene un dashboard por ID
   */
  async function fetchDashboard(id: string) {
    await dashboardStore.fetchById(id)

    return currentItem.value
  }

  /**
   * Obtiene un dashboard por slug
   */
  async function fetchDashboardBySlug(slug: string) {
    await dashboardStore.fetchBySlug(slug)

    return currentItem.value
  }

  /**
   * Obtiene dashboards favoritos
   */
  async function fetchFavorites() {
    await dashboardStore.fetchFavorites()

    return favorites.value
  }

  /**
   * Obtiene dashboards recientes
   */
  async function fetchRecent(limit = 10) {
    await dashboardStore.fetchRecent(limit)

    return recent.value
  }

  /**
   * Obtiene dashboards compartidos
   */
  async function fetchShared() {
    await dashboardStore.fetchShared()

    return shared.value
  }

  /**
   * Obtiene dashboards por categoría
   */
  async function fetchByCategory(categoryId: string) {
    await dashboardStore.fetchByCategory(categoryId)
  }

  /**
   * Crea un nuevo dashboard
   */
  async function createDashboard(data: DashboardCreateDto) {
    return await dashboardStore.createItem(data)
  }

  /**
   * Actualiza un dashboard
   */
  async function updateDashboard(id: string, data: DashboardUpdateDto) {
    return await dashboardStore.updateItem(id, data)
  }

  /**
   * Elimina un dashboard
   */
  async function deleteDashboard(id: string) {
    await dashboardStore.deleteItem(id)
  }

  /**
   * Clona un dashboard
   */
  async function cloneDashboard(id: string, newName: string, includeWidgets = true) {
    return await dashboardStore.cloneItem(id, newName, includeWidgets)
  }

  /**
   * Toggle favorito
   */
  async function toggleFavorite(id: string) {
    return await dashboardStore.toggleFavorite(id)
  }

  /**
   * Agrega un widget al dashboard
   */
  async function addWidget(dashboardId: string, widgetConfig: WidgetInstanceConfig) {
    return await dashboardStore.addWidget(dashboardId, widgetConfig)
  }

  /**
   * Remueve un widget del dashboard
   */
  async function removeWidget(dashboardId: string, widgetInstanceId: string) {
    return await dashboardStore.removeWidget(dashboardId, widgetInstanceId)
  }

  /**
   * Actualiza el layout de widgets
   */
  async function updateWidgetsLayout(
    dashboardId: string,
    widgets: Array<{ id: string; position: any }>,
  ) {
    return await dashboardStore.updateWidgetsLayout(dashboardId, widgets)
  }

  /**
   * Agrega un filtro global
   */
  async function addGlobalFilter(dashboardId: string, filter: DashboardGlobalFilter) {
    return await dashboardStore.addGlobalFilter(dashboardId, filter)
  }

  /**
   * Refresca todos los widgets del dashboard
   */
  async function refreshAllWidgets(dashboardId: string) {
    return await dashboardStore.refreshAllWidgets(dashboardId)
  }

  /**
   * Exporta el dashboard
   */
  async function exportDashboard(dashboardId: string, format: 'pdf' | 'png' | 'jpg' | 'json') {
    return await dashboardStore.exportDashboard(dashboardId, format)
  }

  /**
   * Obtiene estadísticas del dashboard
   */
  async function getStats(dashboardId: string) {
    return await dashboardStore.getStats(dashboardId)
  }

  /**
   * Cambia la página actual
   */
  function setPage(newPage: number) {
    dashboardStore.setPage(newPage)
  }

  /**
   * Cambia items por página
   */
  function setItemsPerPage(count: number) {
    dashboardStore.setItemsPerPage(count)
  }

  /**
   * Actualiza filtros
   */
  function setFilters(newFilters: DashboardListFiltersDto) {
    dashboardStore.setFilters(newFilters)
  }

  /**
   * Limpia filtros
   */
  function clearFilters() {
    dashboardStore.clearFilters()
  }

  /**
   * Limpia errores
   */
  function clearError() {
    dashboardStore.clearError()
  }

  /**
   * Resetea el estado
   */
  function reset() {
    dashboardStore.reset()
  }

  // Computed
  const currentPage = computed(() => page.value)
  const perPage = computed(() => itemsPerPage.value)

  return {
    // State
    items,
    currentItem,
    loading,
    error,
    page,
    itemsPerPage,
    total,
    totalPages,
    hasItems,
    isEmpty,
    filters,
    favorites,
    recent,
    shared,
    hasFavorites,

    // Computed
    currentPage,
    perPage,

    // Methods
    fetchDashboards,
    fetchAllDashboards,
    fetchDashboard,
    fetchDashboardBySlug,
    fetchFavorites,
    fetchRecent,
    fetchShared,
    fetchByCategory,
    createDashboard,
    updateDashboard,
    deleteDashboard,
    cloneDashboard,
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
}
