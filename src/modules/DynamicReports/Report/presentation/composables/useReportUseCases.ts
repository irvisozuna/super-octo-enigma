/**
 * Vue Composable for Report Use Cases
 * Provides access to all report-related use cases with dependency injection
 */

import { inject, provide } from 'vue'
import type {
  ExportReportUseCase,
  GetReportDataUseCase,
  ShareReportUseCase,
} from '../../../application/useCases'

import type {
  CacheServiceInterface,
  ExportServiceInterface,
  NotificationServiceInterface,
  ReportDataServiceInterface,
  ReportRepositoryInterface,
  ShareServiceInterface,
} from '../../../domain/contracts/services'

// Injection keys for type safety
export const REPORT_REPOSITORY_KEY = Symbol('ReportRepository')
export const REPORT_DATA_SERVICE_KEY = Symbol('ReportDataService')
export const CACHE_SERVICE_KEY = Symbol('CacheService')
export const EXPORT_SERVICE_KEY = Symbol('ExportService')
export const SHARE_SERVICE_KEY = Symbol('ShareService')
export const NOTIFICATION_SERVICE_KEY = Symbol('NotificationService')

// Use case injection keys
export const GET_REPORT_DATA_USECASE_KEY = Symbol('GetReportDataUseCase')
export const EXPORT_REPORT_USECASE_KEY = Symbol('ExportReportUseCase')
export const SHARE_REPORT_USECASE_KEY = Symbol('ShareReportUseCase')

/**
 * Composable for accessing report use cases
 *
 * @example
 * ```vue
 * <script setup>
 * import { useReportUseCases } from '@/composables/useReportUseCases'
 *
 * const { getReportDataUseCase, exportReportUseCase, shareReportUseCase } = useReportUseCases()
 *
 * const loadData = async () => {
 *   const result = await getReportDataUseCase.execute({
 *     reportId: 'report-123',
 *     pagination: { currentPage: 1, itemsPerPage: 50 },
 *     filters: [],
 *     sorting: []
 *   })
 * }
 * </script>
 * ```
 */
export const useReportUseCases = () => {
  // Try to inject use cases first (if already provided)
  const getReportDataUseCase = inject<GetReportDataUseCase>(GET_REPORT_DATA_USECASE_KEY)
  const exportReportUseCase = inject<ExportReportUseCase>(EXPORT_REPORT_USECASE_KEY)
  const shareReportUseCase = inject<ShareReportUseCase>(SHARE_REPORT_USECASE_KEY)

  if (getReportDataUseCase && exportReportUseCase && shareReportUseCase) {
    return {
      getReportDataUseCase,
      exportReportUseCase,
      shareReportUseCase,
    }
  }

  // If not available, create them using injected services
  const reportRepository = inject<ReportRepositoryInterface>(REPORT_REPOSITORY_KEY)
  const reportDataService = inject<ReportDataServiceInterface>(REPORT_DATA_SERVICE_KEY)
  const cacheService = inject<CacheServiceInterface>(CACHE_SERVICE_KEY)
  const exportService = inject<ExportServiceInterface>(EXPORT_SERVICE_KEY)
  const shareService = inject<ShareServiceInterface>(SHARE_SERVICE_KEY)
  const notificationService = inject<NotificationServiceInterface>(NOTIFICATION_SERVICE_KEY)

  if (!reportRepository || !reportDataService || !cacheService
      || !exportService || !shareService || !notificationService)
    throw new Error('Required services not provided. Make sure to call setupReportServices() in your app setup.')

  // Create use cases with injected dependencies
  const createdGetReportDataUseCase = new (await import('../Application/UseCases/GetReportDataUseCase')).GetReportDataUseCase(
    reportRepository,
    reportDataService,
    cacheService,
  )

  const createdExportReportUseCase = new (await import('../Application/UseCases/ExportReportUseCase')).ExportReportUseCase(
    reportRepository,
    exportService,
    notificationService,
  )

  const createdShareReportUseCase = new (await import('../Application/UseCases/ShareReportUseCase')).ShareReportUseCase(
    reportRepository,
    shareService,
    notificationService,
  )

  return {
    getReportDataUseCase: createdGetReportDataUseCase,
    exportReportUseCase: createdExportReportUseCase,
    shareReportUseCase: createdShareReportUseCase,
  }
}

/**
 * Provide services for dependency injection
 * Call this in your app setup or main component
 *
 * @example
 * ```typescript
 * // main.ts or App.vue
 * import { setupReportServices } from '@/composables/useReportUseCases'
 * import { createServices } from '@/infrastructure/services'
 *
 * const app = createApp(App)
 *
 * app.use((app) => {
 *   const services = createServices()
 *   setupReportServices(app, services)
 * })
 * ```
 */
export const setupReportServices = (
  app: any,
  services: {
    reportRepository: ReportRepositoryInterface
    reportDataService: ReportDataServiceInterface
    cacheService: CacheServiceInterface
    exportService: ExportServiceInterface
    shareService: ShareServiceInterface
    notificationService: NotificationServiceInterface
  },
) => {
  // Provide base services
  app.provide(REPORT_REPOSITORY_KEY, services.reportRepository)
  app.provide(REPORT_DATA_SERVICE_KEY, services.reportDataService)
  app.provide(CACHE_SERVICE_KEY, services.cacheService)
  app.provide(EXPORT_SERVICE_KEY, services.exportService)
  app.provide(SHARE_SERVICE_KEY, services.shareService)
  app.provide(NOTIFICATION_SERVICE_KEY, services.notificationService)
}

/**
 * Advanced composable for managing report state
 * Includes caching, error handling, and loading states
 *
 * @example
 * ```vue
 * <script setup>
 * import { useReportManager } from '@/composables/useReportUseCases'
 *
 * const {
 *   reportData,
 *   loading,
 *   error,
 *   loadReport,
 *   exportReport,
 *   shareReport,
 *   refreshData
 * } = useReportManager('report-123')
 *
 * onMounted(() => loadReport())
 * </script>
 * ```
 */
export const useReportManager = (reportId: string) => {
  const { getReportDataUseCase, exportReportUseCase, shareReportUseCase } = useReportUseCases()

  const state = reactive({
    reportData: null as any,
    loading: false,
    error: null as string | null,
    lastUpdated: null as Date | null,
  })

  const loadReport = async (params?: any) => {
    state.loading = true
    state.error = null

    try {
      const result = await getReportDataUseCase.execute({
        reportId,
        pagination: { currentPage: 1, itemsPerPage: 50 },
        filters: [],
        sorting: [],
        ...params,
      })

      if (result.isSuccess()) {
        state.reportData = result.getValue()
        state.lastUpdated = new Date()
      }
      else {
        state.error = result.getError().message
      }
    }
    catch (error) {
      state.error = error instanceof Error ? error.message : 'Unknown error occurred'
    }
    finally {
      state.loading = false
    }
  }

  const exportReport = async (format: string, options?: any) => {
    try {
      const result = await exportReportUseCase.execute({
        reportId,
        format,
        filters: [],
        sorting: [],
        visibleColumns: [],
        ...options,
      })

      if (result.isSuccess())
        return result.getValue()
      else
        throw new Error(result.getError().message)
    }
    catch (error) {
      state.error = error instanceof Error ? error.message : 'Export failed'
      throw error
    }
  }

  const shareReport = async (options?: any) => {
    try {
      const result = await shareReportUseCase.execute({
        reportId,
        filters: [],
        sorting: [],
        ...options,
      })

      if (result.isSuccess())
        return result.getValue()
      else
        throw new Error(result.getError().message)
    }
    catch (error) {
      state.error = error instanceof Error ? error.message : 'Share failed'
      throw error
    }
  }

  const refreshData = () => loadReport()

  return {
    // State
    reportData: readonly(toRef(state, 'reportData')),
    loading: readonly(toRef(state, 'loading')),
    error: readonly(toRef(state, 'error')),
    lastUpdated: readonly(toRef(state, 'lastUpdated')),

    // Actions
    loadReport,
    exportReport,
    shareReport,
    refreshData,

    // Utilities
    clearError: () => { state.error = null },
    isLoading: computed(() => state.loading),
    hasError: computed(() => !!state.error),
    hasData: computed(() => !!state.reportData),
  }
}

/**
 * Composable for report filtering and searching
 *
 * @example
 * ```vue
 * <script setup>
 * import { useReportFilters } from '@/composables/useReportUseCases'
 *
 * const {
 *   filters,
 *   addFilter,
 *   removeFilter,
 *   clearFilters,
 *   applyFilters
 * } = useReportFilters()
 * </script>
 * ```
 */
export const useReportFilters = () => {
  const filters = ref<any[]>([])
  const quickSearch = ref('')

  const addFilter = (filter: any) => {
    const existingIndex = filters.value.findIndex(f => f.field === filter.field)
    if (existingIndex >= 0)
      filters.value[existingIndex] = filter
    else
      filters.value.push(filter)
  }

  const removeFilter = (field: string) => {
    filters.value = filters.value.filter(f => f.field !== field)
  }

  const clearFilters = () => {
    filters.value = []
    quickSearch.value = ''
  }

  const applyFilters = (callback: (filters: any[], search: string) => void) => {
    callback(filters.value, quickSearch.value)
  }

  const hasActiveFilters = computed(() =>
    filters.value.length > 0 || quickSearch.value.trim() !== '',
  )

  return {
    filters: readonly(filters),
    quickSearch,
    addFilter,
    removeFilter,
    clearFilters,
    applyFilters,
    hasActiveFilters,
  }
}

/**
 * Composable for report pagination
 */
export const useReportPagination = (initialPage = 1, initialPageSize = 50) => {
  const currentPage = ref(initialPage)
  const pageSize = ref(initialPageSize)
  const totalItems = ref(0)

  const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value))
  const startItem = computed(() => (currentPage.value - 1) * pageSize.value + 1)
  const endItem = computed(() => Math.min(currentPage.value * pageSize.value, totalItems.value))

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages.value)
      currentPage.value = page
  }

  const nextPage = () => goToPage(currentPage.value + 1)
  const prevPage = () => goToPage(currentPage.value - 1)
  const firstPage = () => goToPage(1)
  const lastPage = () => goToPage(totalPages.value)

  const setPageSize = (size: number) => {
    pageSize.value = size
    currentPage.value = 1 // Reset to first page
  }

  return {
    currentPage: readonly(currentPage),
    pageSize: readonly(pageSize),
    totalItems,
    totalPages,
    startItem,
    endItem,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    setPageSize,
    canGoNext: computed(() => currentPage.value < totalPages.value),
    canGoPrev: computed(() => currentPage.value > 1),
  }
}

/**
 * Composable for report sorting
 */
export const useReportSorting = () => {
  const sortingRules = ref<Array<{ field: string; direction: 'ASC' | 'DESC' }>>([])

  const addSort = (field: string, direction: 'ASC' | 'DESC' = 'ASC') => {
    const existingIndex = sortingRules.value.findIndex(rule => rule.field === field)

    if (existingIndex >= 0) {
      // Update existing sort
      if (sortingRules.value[existingIndex].direction === 'ASC' && direction === 'ASC') {
        sortingRules.value[existingIndex].direction = 'DESC'
      }
      else if (sortingRules.value[existingIndex].direction === 'DESC') {
        // Remove sort
        sortingRules.value.splice(existingIndex, 1)
      }
      else {
        sortingRules.value[existingIndex].direction = direction
      }
    }
    else {
      // Add new sort
      sortingRules.value.push({ field, direction })
    }
  }

  const removeSort = (field: string) => {
    sortingRules.value = sortingRules.value.filter(rule => rule.field !== field)
  }

  const clearSorting = () => {
    sortingRules.value = []
  }

  const getSortDirection = (field: string): 'ASC' | 'DESC' | null => {
    const rule = sortingRules.value.find(rule => rule.field === field)

    return rule?.direction || null
  }

  const getSortIndex = (field: string): number => {
    return sortingRules.value.findIndex(rule => rule.field === field)
  }

  return {
    sortingRules: readonly(sortingRules),
    addSort,
    removeSort,
    clearSorting,
    getSortDirection,
    getSortIndex,
    hasSorting: computed(() => sortingRules.value.length > 0),
  }
}

// Re-export common dependencies
export { reactive, ref, computed, readonly, toRef } from 'vue'
