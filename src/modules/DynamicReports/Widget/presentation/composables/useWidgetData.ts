import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useWidgetStore } from '../stores/widgetStore'
import type { WidgetData } from '../../domain/types/WidgetTypes'

/**
 * Composable para manejo de datos de widgets
 */
export function useWidgetData(widgetId: string) {
  const widgetStore = useWidgetStore()
  const { loading, error } = storeToRefs(widgetStore)

  const widgetData = ref<WidgetData | null>(null)
  const cached = ref(false)
  const executionTime = ref(0)
  const lastRefresh = ref<Date | null>(null)

  /**
   * Ejecuta la consulta del widget
   */
  async function executeQuery(params?: any) {
    try {
      const result = await widgetStore.executeQuery(widgetId, params)

      widgetData.value = result.data
      cached.value = result.cached || false
      executionTime.value = result.executionTime || 0
      lastRefresh.value = new Date()

      return result.data
    }
    catch (err) {
      console.error('Error executing widget query:', err)
      throw err
    }
  }

  /**
   * Ejecuta la consulta con cache
   */
  async function executeWithCache() {
    try {
      const result = await widgetStore.executeWidgetWithCache(widgetId)

      widgetData.value = result.data
      cached.value = result.cached
      executionTime.value = result.executionTime
      lastRefresh.value = new Date()

      return result
    }
    catch (err) {
      console.error('Error executing widget with cache:', err)
      throw err
    }
  }

  /**
   * Refresca los datos del widget
   */
  async function refresh(force = false) {
    try {
      const result = force
        ? await widgetStore.refreshWidget(widgetId)
        : await executeWithCache()

      widgetData.value = result.data
      cached.value = false
      lastRefresh.value = new Date()

      return result.data
    }
    catch (err) {
      console.error('Error refreshing widget:', err)
      throw err
    }
  }

  /**
   * Limpia el cache del widget
   */
  async function clearCache() {
    try {
      await widgetStore.clearWidgetCache(widgetId)
      cached.value = false
    }
    catch (err) {
      console.error('Error clearing cache:', err)
      throw err
    }
  }

  /**
   * Exporta los datos del widget
   */
  async function exportData(format: 'csv' | 'xlsx' | 'json' | 'pdf') {
    try {
      return await widgetStore.exportWidget(widgetId, format)
    }
    catch (err) {
      console.error('Error exporting widget:', err)
      throw err
    }
  }

  /**
   * Obtiene estadísticas del widget
   */
  async function getStats() {
    try {
      return await widgetStore.getWidgetStats(widgetId)
    }
    catch (err) {
      console.error('Error getting stats:', err)
      throw err
    }
  }

  // Computed
  const hasData = computed(() => widgetData.value !== null)

  const isEmpty = computed(() => {
    if (!widgetData.value)
      return true

    return widgetData.value.rows.length === 0
  })

  const rowCount = computed(() => widgetData.value?.rows.length || 0)
  const columns = computed(() => widgetData.value?.columns || [])

  const isCached = computed(() => cached.value)

  const isStale = computed(() => {
    if (!lastRefresh.value)
      return true

    const widget = widgetStore.items.find(w => w.id.toString() === widgetId)
    if (!widget || !widget.props.cache?.enabled)
      return false

    const ttl = widget.props.cache.ttl || 3600
    const now = new Date()
    const diff = (now.getTime() - lastRefresh.value.getTime()) / 1000

    return diff > ttl
  })

  return {
    // State
    widgetData,
    loading,
    error,
    cached,
    executionTime,
    lastRefresh,

    // Computed
    hasData,
    isEmpty,
    rowCount,
    columns,
    isCached,
    isStale,

    // Methods
    executeQuery,
    executeWithCache,
    refresh,
    clearCache,
    exportData,
    getStats,
  }
}
