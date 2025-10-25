import { computed, ref, watch } from 'vue'
import { useProjectDetailStore } from '../../stores/projectDetailStore'
import { useLoadingState } from '@/composables/useLoadingState'

/**
 * Composable para gestionar tabs del proyecto
 * Centraliza la lógica de tabs, lazy loading y permisos
 */

export type ProjectTab =
  | 'overview'
  | 'reports'
  | 'budget'
  | 'equipment'
  | 'documents'
  | 'statistics'
  | 'history'

export interface TabConfig {
  name: ProjectTab
  label: string
  icon: string
  badge?: number
  disabled?: boolean
  requiresStatus?: string[]
  lazyLoad?: boolean
}

export function useTabManager(projectId?: string) {
  const store = useProjectDetailStore()

  const { withLoading, loadingStates } = useLoadingState([
    'reports',
    'budget',
    'equipment',
    'documents',
    'statistics',
    'history',
  ])

  // Tab activo
  const activeTab = ref<ProjectTab>('overview')

  // Tabs que ya han sido cargados
  const loadedTabs = ref<Set<ProjectTab>>(new Set(['overview']))

  // Configuración de tabs
  const tabConfigs: TabConfig[] = [
    {
      name: 'overview',
      label: 'Resumen',
      icon: 'tabler-layout-dashboard',
      lazyLoad: false,
    },
    {
      name: 'reports',
      label: 'Reportes',
      icon: 'tabler-file-text',
      requiresStatus: ['active', 'suspended', 'completed'],
      lazyLoad: true,
    },
    {
      name: 'budget',
      label: 'Presupuesto',
      icon: 'tabler-currency-dollar',
      requiresStatus: [], // Disponible en todos los estados
      lazyLoad: true,
    },
    {
      name: 'equipment',
      label: 'Equipos',
      icon: 'tabler-tool',
      lazyLoad: true,
    },

    // {
    //   name: 'documents',
    //   label: 'Documentos',
    //   icon: 'tabler-folder-open',
    //   lazyLoad: true
    // },
    {
      name: 'statistics',
      label: 'Estadísticas',
      icon: 'tabler-chart-line',
      requiresStatus: ['active', 'suspended', 'completed'],
      lazyLoad: true,
    },

    // {
    //   name: 'history',
    //   label: 'Historial',
    //   icon: 'tabler-history',
    //   lazyLoad: true,
    // },
  ]

  /**
   * Tabs disponibles según el estado del proyecto
   */
  const availableTabs = computed(() => {
    const projectStatus = store.projectStatus

    return tabConfigs.filter(tab => {
      // Si el tab requiere un estado específico, verificar
      if (tab.requiresStatus && tab.requiresStatus.length > 0)
        return tab.requiresStatus.includes(projectStatus || '')

      // Para proyectos planificados, incluir budget también
      if (projectStatus === 'planned')
        return ['overview', 'budget', 'equipment', 'documents'].includes(tab.name)

      return true
    })
  })

  /**
   * Verificar si un tab está disponible
   */
  const isTabAvailable = computed(() => (tabName: ProjectTab) => {
    return availableTabs.value.some(tab => tab.name === tabName)
  })

  /**
   * Badges con contadores para tabs
   */
  const tabBadges = computed(() => {
    const project = store.currentProject

    return {
      reports: store.tabDataCache.reports?.length
               || project?.statistics?.reports_count || 0,

      equipment: store.tabDataCache.equipment?.length
                 || project?.statistics?.equipment_count || 0,

      documents: store.projectDocuments.length
                 || project?.statistics?.documents_count || 0,

      budget: store.tabDataCache.costs?.length || 0,

      history: store.statusHistory.length || 0,
    }
  })

  /**
   * Obtener configuración de un tab
   */
  function getTabConfig(tabName: ProjectTab): TabConfig | undefined {
    const config = tabConfigs.find(t => t.name === tabName)

    if (config) {
      return {
        ...config,
        badge: tabBadges.value[tabName] || undefined,
        disabled: !isTabAvailable.value(tabName),
      }
    }

    return undefined
  }

  /**
   * Cargar datos de un tab con lazy loading
   */
  async function loadTabData(tabName: ProjectTab, forceReload = false) {
    // No cargar si no está disponible
    if (!isTabAvailable.value(tabName)) {
      console.warn(`Tab ${tabName} is not available`)

      return
    }

    // No cargar overview, no tiene datos lazy
    if (tabName === 'overview')
      return

    // No recargar si ya está cargado (a menos que se fuerce)
    if (!forceReload && loadedTabs.value.has(tabName))
      return store.tabDataCache[tabName]

    // Cargar datos con loading state
    return await withLoading(
      tabName,
      async () => {
        if (!projectId)
          throw new Error('Project ID is required')

        const result = await store.loadTabData(tabName, projectId, forceReload)

        // Marcar como cargado
        loadedTabs.value.add(tabName)

        return result
      },
      {
        timeout: 30000, // 30 segundos timeout
        onTimeout: () => {
          console.error(`Timeout loading tab: ${tabName}`)
        },
      },
    )
  }

  /**
   * Cambiar tab activo y cargar datos si es necesario
   */
  async function switchTab(tabName: ProjectTab) {
    // Validar que el tab esté disponible
    if (!isTabAvailable.value(tabName)) {
      console.warn(`Cannot switch to unavailable tab: ${tabName}`)

      return false
    }

    // Cambiar tab
    activeTab.value = tabName
    console.log('✅ Tab switched to:', tabName)

    // Lazy load si es necesario
    const config = getTabConfig(tabName)
    if (config?.lazyLoad) {
      console.log('🔄 Loading data for tab:', tabName)
      await loadTabData(tabName)
    }

    return true
  }

  /**
   * Recargar datos del tab actual
   */
  async function refreshCurrentTab() {
    if (activeTab.value !== 'overview')
      await loadTabData(activeTab.value, true)
  }

  /**
   * Recargar datos de un tab específico
   */
  async function refreshTab(tabName: ProjectTab) {
    // Invalidar cache
    store.invalidateTabCache(tabName)

    // Si es el tab activo, recargar
    if (activeTab.value === tabName) {
      await loadTabData(tabName, true)
    }
    else {
      // Marcar como no cargado para lazy load posterior
      loadedTabs.value.delete(tabName)
    }
  }

  /**
   * Limpiar datos de tabs al cambiar de proyecto
   */
  function resetTabs() {
    activeTab.value = 'overview'
    loadedTabs.value.clear()
    loadedTabs.value.add('overview')
  }

  /**
   * Watch para lazy loading automático con reload forzado
   */
  watch(activeTab, async newTab => {
    const config = getTabConfig(newTab)
    if (config?.lazyLoad) {
      // Siempre recargar datos cuando se cambia de tab (forceReload = true)
      await loadTabData(newTab, true)
    }
  })

  /**
   * Watch para resetear tabs si el proyecto cambia
   */
  watch(() => store.currentProject?.id, (newId, oldId) => {
    if (newId !== oldId && newId)
      resetTabs()
  })

  return {
    // Estado
    activeTab,
    loadedTabs: readonly(loadedTabs),
    loadingStates: readonly(loadingStates),
    tabDataCache: computed(() => store.tabDataCache),

    // Computed
    availableTabs,
    isTabAvailable,
    tabBadges,

    // Methods
    getTabConfig,
    loadTabData,
    switchTab,
    refreshCurrentTab,
    refreshTab,
    resetTabs,
  }
}
