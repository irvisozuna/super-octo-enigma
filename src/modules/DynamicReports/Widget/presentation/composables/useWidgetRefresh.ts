import { onMounted, onUnmounted, ref } from 'vue'
import { useWidgetData } from './useWidgetData'

export interface WidgetRefreshOptions {
  autoRefresh?: boolean
  interval?: number // seconds
  refreshOnMount?: boolean
  refreshOnFocus?: boolean
}

/**
 * Composable para auto-refresh de widgets
 */
export function useWidgetRefresh(
  widgetId: string,
  options: WidgetRefreshOptions = {},
) {
  const {
    autoRefresh = false,
    interval = 60, // 60 seconds default
    refreshOnMount = true,
    refreshOnFocus = true,
  } = options

  const widgetData = useWidgetData(widgetId)

  const isAutoRefreshing = ref(false)
  const refreshTimer = ref<NodeJS.Timeout | null>(null)
  const nextRefresh = ref<Date | null>(null)

  /**
   * Inicia el auto-refresh
   */
  function startAutoRefresh() {
    if (isAutoRefreshing.value || !interval)
      return

    isAutoRefreshing.value = true

    refreshTimer.value = setInterval(() => {
      widgetData.refresh(false)
      updateNextRefresh()
    }, interval * 1000)

    updateNextRefresh()
  }

  /**
   * Detiene el auto-refresh
   */
  function stopAutoRefresh() {
    if (refreshTimer.value) {
      clearInterval(refreshTimer.value)
      refreshTimer.value = null
    }
    isAutoRefreshing.value = false
    nextRefresh.value = null
  }

  /**
   * Actualiza la fecha del próximo refresh
   */
  function updateNextRefresh() {
    if (!interval)
      return
    const next = new Date()

    next.setSeconds(next.getSeconds() + interval)
    nextRefresh.value = next
  }

  /**
   * Refresca manualmente
   */
  async function manualRefresh(force = true) {
    await widgetData.refresh(force)
    if (isAutoRefreshing.value)
      updateNextRefresh()
  }

  /**
   * Handler para focus
   */
  function handleFocus() {
    if (refreshOnFocus && !document.hidden)
      widgetData.refresh(false)
  }

  // Lifecycle
  onMounted(() => {
    if (refreshOnMount)
      widgetData.executeWithCache()

    if (autoRefresh)
      startAutoRefresh()

    if (refreshOnFocus) {
      document.addEventListener('visibilitychange', handleFocus)
      window.addEventListener('focus', handleFocus)
    }
  })

  onUnmounted(() => {
    stopAutoRefresh()

    if (refreshOnFocus) {
      document.removeEventListener('visibilitychange', handleFocus)
      window.removeEventListener('focus', handleFocus)
    }
  })

  return {
    // State from useWidgetData
    ...widgetData,

    // Auto-refresh state
    isAutoRefreshing,
    nextRefresh,

    // Methods
    startAutoRefresh,
    stopAutoRefresh,
    manualRefresh,
  }
}
