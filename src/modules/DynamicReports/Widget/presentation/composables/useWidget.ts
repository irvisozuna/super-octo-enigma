import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useWidgetStore } from '../stores/widgetStore'
import type { WidgetCreateDto, WidgetListFiltersDto, WidgetUpdateDto } from '../../application/dtos/WidgetDtos'
import type { WidgetTypeEnum } from '../../domain/types'

/**
 * Composable para operaciones CRUD de widgets
 */
export function useWidget() {
  const widgetStore = useWidgetStore()

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
  } = storeToRefs(widgetStore)

  /**
   * Obtiene lista de widgets con filtros
   */
  async function fetchWidgets(customFilters?: WidgetListFiltersDto) {
    if (customFilters)
      widgetStore.setFilters(customFilters)

    await widgetStore.fetchList()
  }

  /**
   * Obtiene todos los widgets sin paginación
   */
  async function fetchAllWidgets() {
    await widgetStore.fetchAll()
  }

  /**
   * Obtiene un widget por ID
   */
  async function fetchWidget(id: string) {
    await widgetStore.fetchById(id)

    return currentItem.value
  }

  /**
   * Crea un nuevo widget
   */
  async function createWidget(data: WidgetCreateDto) {
    return await widgetStore.createItem(data)
  }

  /**
   * Crea un widget desde un tipo predefinido
   */
  async function createWidgetFromType(
    type: WidgetTypeEnum,
    data: Partial<WidgetCreateDto>,
  ) {
    return await widgetStore.createFromType(type, data)
  }

  /**
   * Actualiza un widget
   */
  async function updateWidget(id: string, data: WidgetUpdateDto) {
    return await widgetStore.updateItem(id, data)
  }

  /**
   * Elimina un widget
   */
  async function deleteWidget(id: string) {
    await widgetStore.deleteItem(id)
  }

  /**
   * Clona un widget
   */
  async function cloneWidget(id: string, newName: string, copyData = false) {
    return await widgetStore.cloneItem(id, newName, copyData)
  }

  /**
   * Cambia la página actual
   */
  function setPage(newPage: number) {
    widgetStore.setPage(newPage)
  }

  /**
   * Cambia items por página
   */
  function setItemsPerPage(count: number) {
    widgetStore.setItemsPerPage(count)
  }

  /**
   * Actualiza filtros
   */
  function setFilters(newFilters: WidgetListFiltersDto) {
    widgetStore.setFilters(newFilters)
  }

  /**
   * Limpia filtros
   */
  function clearFilters() {
    widgetStore.clearFilters()
  }

  /**
   * Limpia errores
   */
  function clearError() {
    widgetStore.clearError()
  }

  /**
   * Resetea el estado
   */
  function reset() {
    widgetStore.reset()
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

    // Computed
    currentPage,
    perPage,

    // Methods
    fetchWidgets,
    fetchAllWidgets,
    fetchWidget,
    createWidget,
    createWidgetFromType,
    updateWidget,
    deleteWidget,
    cloneWidget,
    setPage,
    setItemsPerPage,
    setFilters,
    clearFilters,
    clearError,
    reset,
  }
}
