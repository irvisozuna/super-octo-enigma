import { computed, ref } from 'vue'
import type { WidgetInstanceConfig, WidgetPosition } from '../../../Widget/domain/types/WidgetTypes'

export interface GridItem {
  id: string
  widgetId: string
  position: WidgetPosition
  config: WidgetInstanceConfig
}

export interface DashboardLayoutOptions {
  columns?: number
  rowHeight?: number
  margin?: number
  containerPadding?: number
  isDraggable?: boolean
  isResizable?: boolean
  autoSize?: boolean
}

/**
 * Composable para manejo del layout del dashboard (drag & drop)
 */
export function useDashboardLayout(
  initialWidgets: WidgetInstanceConfig[] = [],
  options: DashboardLayoutOptions = {},
) {
  const {
    columns = 12,
    rowHeight = 60,
    margin = 10,
    containerPadding = 10,
    isDraggable = true,
    isResizable = true,
    autoSize = true,
  } = options

  const gridItems = ref<GridItem[]>([])
  const selectedWidget = ref<string | null>(null)
  const isDragging = ref(false)
  const isResizingWidget = ref(false)
  const hasChanges = ref(false)

  /**
   * Inicializa los widgets en el grid
   */
  function initializeGrid(widgets: WidgetInstanceConfig[]) {
    gridItems.value = widgets.map(widget => ({
      id: widget.id,
      widgetId: widget.widget_id,
      position: widget.position,
      config: widget,
    }))
    hasChanges.value = false
  }

  /**
   * Agrega un widget al grid
   */
  function addWidget(widget: WidgetInstanceConfig) {
    // Buscar posición disponible
    const position = findAvailablePosition(widget.position.w, widget.position.h)

    const gridItem: GridItem = {
      id: widget.id,
      widgetId: widget.widget_id,
      position: position || widget.position,
      config: widget,
    }

    gridItems.value.push(gridItem)
    hasChanges.value = true

    return gridItem
  }

  /**
   * Remueve un widget del grid
   */
  function removeWidget(widgetInstanceId: string) {
    const index = gridItems.value.findIndex(item => item.id === widgetInstanceId)
    if (index !== -1) {
      gridItems.value.splice(index, 1)
      hasChanges.value = true

      if (selectedWidget.value === widgetInstanceId)
        selectedWidget.value = null
    }
  }

  /**
   * Actualiza la posición de un widget
   */
  function updateWidgetPosition(widgetInstanceId: string, position: WidgetPosition) {
    const item = gridItems.value.find(item => item.id === widgetInstanceId)
    if (item) {
      item.position = { ...position }
      item.config.position = { ...position }
      hasChanges.value = true
    }
  }

  /**
   * Selecciona un widget
   */
  function selectWidget(widgetInstanceId: string | null) {
    selectedWidget.value = widgetInstanceId
  }

  /**
   * Busca una posición disponible en el grid
   */
  function findAvailablePosition(width: number, height: number): WidgetPosition | null {
    // Crear matriz de ocupación
    const maxRows = Math.max(...gridItems.value.map(item => item.position.y + item.position.h), 10)
    const occupied: boolean[][] = Array.from({ length: maxRows }, () => Array(columns).fill(false))

    // Marcar espacios ocupados
    for (const item of gridItems.value) {
      for (let y = item.position.y; y < item.position.y + item.position.h; y++) {
        for (let x = item.position.x; x < item.position.x + item.position.w; x++) {
          if (y < maxRows && x < columns)
            occupied[y][x] = true
        }
      }
    }

    // Buscar espacio disponible
    for (let y = 0; y < maxRows; y++) {
      for (let x = 0; x <= columns - width; x++) {
        if (isSpaceAvailable(occupied, x, y, width, height))
          return { x, y, w: width, h: height }
      }
    }

    // Si no hay espacio, agregar al final
    return {
      x: 0,
      y: maxRows,
      w: width,
      h: height,
    }
  }

  /**
   * Verifica si un espacio está disponible
   */
  function isSpaceAvailable(
    occupied: boolean[][],
    x: number,
    y: number,
    width: number,
    height: number,
  ): boolean {
    for (let row = y; row < y + height && row < occupied.length; row++) {
      for (let col = x; col < x + width && col < columns; col++) {
        if (occupied[row][col])
          return false
      }
    }

    return true
  }

  /**
   * Valida que la posición esté dentro de los límites
   */
  function validatePosition(position: WidgetPosition): boolean {
    return (
      position.x >= 0
      && position.y >= 0
      && position.x + position.w <= columns
      && position.w > 0
      && position.h > 0
    )
  }

  /**
   * Detecta colisiones entre widgets
   */
  function detectCollision(position: WidgetPosition, excludeId?: string): boolean {
    return gridItems.value.some(item => {
      if (excludeId && item.id === excludeId)
        return false

      const itemPos = item.position

      return !(
        position.x + position.w <= itemPos.x
        || position.x >= itemPos.x + itemPos.w
        || position.y + position.h <= itemPos.y
        || position.y >= itemPos.y + itemPos.h
      )
    })
  }

  /**
   * Compacta el layout verticalmente
   */
  function compactLayout() {
    // Ordenar por posición Y
    const sorted = [...gridItems.value].sort((a, b) => a.position.y - b.position.y)

    for (const item of sorted) {
      let newY = 0

      // Buscar la posición Y más baja posible
      while (newY < item.position.y) {
        const testPosition = { ...item.position, y: newY }
        if (!detectCollision(testPosition, item.id)) {
          item.position.y = newY
          item.config.position.y = newY
          break
        }
        newY++
      }
    }

    hasChanges.value = true
  }

  /**
   * Obtiene el layout como array de posiciones
   */
  function getLayout(): Array<{ id: string; position: WidgetPosition }> {
    return gridItems.value.map(item => ({
      id: item.id,
      position: item.position,
    }))
  }

  /**
   * Resetea los cambios
   */
  function resetChanges() {
    hasChanges.value = false
  }

  // Computed
  const widgetCount = computed(() => gridItems.value.length)
  const isEmpty = computed(() => gridItems.value.length === 0)

  const selectedItem = computed(() =>
    gridItems.value.find(item => item.id === selectedWidget.value) || null,
  )

  const gridHeight = computed(() => {
    if (gridItems.value.length === 0)
      return rowHeight

    const maxY = Math.max(...gridItems.value.map(item => item.position.y + item.position.h))

    return maxY * rowHeight + (maxY - 1) * margin + 2 * containerPadding
  })

  // Initialize
  if (initialWidgets.length > 0)
    initializeGrid(initialWidgets)

  return {
    // State
    gridItems,
    selectedWidget,
    isDragging,
    isResizingWidget,
    hasChanges,

    // Options
    columns,
    rowHeight,
    margin,
    containerPadding,
    isDraggable,
    isResizable,

    // Computed
    widgetCount,
    isEmpty,
    selectedItem,
    gridHeight,

    // Methods
    initializeGrid,
    addWidget,
    removeWidget,
    updateWidgetPosition,
    selectWidget,
    findAvailablePosition,
    validatePosition,
    detectCollision,
    compactLayout,
    getLayout,
    resetChanges,
  }
}
