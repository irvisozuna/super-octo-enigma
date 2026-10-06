import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

export interface ExecutionResult {
  data: any[]
  total: number
  page: number
  limit: number
  totalPages: number
  executionTime: number
  timestamp: Date
}

export interface ExportConfig {
  format: 'excel' | 'pdf' | 'csv'
  filename?: string
  includeHeaders?: boolean
  includeTotals?: boolean
  orientation?: 'portrait' | 'landscape'
  pageSize?: 'A4' | 'A3' | 'Letter'
  margins?: number
  delimiter?: string
  encoding?: 'UTF-8' | 'ISO-8859-1'
}

export interface ExecutionParams {
  reportId: string
  filters?: Record<string, any>
  sorting?: Record<string, any>
  pagination?: {
    page: number
    limit: number
  }
}

export const useReportExecution = () => {
  const { t } = useI18n()

  // Estado de ejecución
  const isExecuting = ref(false)
  const isExporting = ref(false)
  const executionResult = ref<ExecutionResult | null>(null)
  const executionError = ref<string | null>(null)
  const executionProgress = ref(0)

  // Estado de exportación
  const exportProgress = ref(0)
  const exportError = ref<string | null>(null)

  // Parámetros de ejecución
  const executionParams = ref<ExecutionParams>({
    reportId: '',
    filters: {},
    sorting: {},
    pagination: {
      page: 1,
      limit: 50,
    },
  })

  // Computed
  const hasResults = computed(() => executionResult.value !== null)
  const hasError = computed(() => executionError.value !== null)
  const isExecutingOrExporting = computed(() => isExecuting.value || isExporting.value)
  const totalRecords = computed(() => executionResult.value?.total || 0)
  const currentPage = computed(() => executionResult.value?.page || 1)
  const totalPages = computed(() => executionResult.value?.totalPages || 0)
  const executionTime = computed(() => executionResult.value?.executionTime || 0)

  // Métodos de ejecución
  const executeReport = async (params: Partial<ExecutionParams> = {}) => {
    isExecuting.value = true
    executionError.value = null
    executionProgress.value = 0

    try {
      // Simular progreso
      const progressInterval = setInterval(() => {
        if (executionProgress.value < 90)
          executionProgress.value += 10
      }, 100)

      // Aquí se haría la llamada real a la API
      const response = await fetch(`/api/dynamic-reports/reports/${params.reportId || executionParams.value.reportId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filters: params.filters || executionParams.value.filters,
          sorting: params.sorting || executionParams.value.sorting,
          pagination: params.pagination || executionParams.value.pagination,
        }),
      })

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`)

      const data = await response.json()

      clearInterval(progressInterval)
      executionProgress.value = 100

      executionResult.value = {
        data: data.data || [],
        total: data.meta?.total || 0,
        page: data.meta?.page || 1,
        limit: data.meta?.limit || 50,
        totalPages: data.meta?.total_pages || 1,
        executionTime: data.meta?.execution_time || 0,
        timestamp: new Date(),
      }

      // Actualizar parámetros
      Object.assign(executionParams.value, params)
    }
    catch (error) {
      executionError.value = error instanceof Error ? error.message : t('DynamicReports.report.execution.error')
    }
    finally {
      isExecuting.value = false
      setTimeout(() => {
        executionProgress.value = 0
      }, 1000)
    }
  }

  const refreshExecution = async () => {
    if (executionParams.value.reportId)
      await executeReport()
  }

  const clearResults = () => {
    executionResult.value = null
    executionError.value = null
  }

  // Métodos de exportación
  const exportReport = async (config: ExportConfig) => {
    isExporting.value = true
    exportError.value = null
    exportProgress.value = 0

    try {
      // Simular progreso de exportación
      const progressInterval = setInterval(() => {
        if (exportProgress.value < 90)
          exportProgress.value += 15
      }, 200)

      const response = await fetch(`/api/dynamic-reports/reports/${executionParams.value.reportId}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format: config.format,
          filters: executionParams.value.filters,
          sorting: executionParams.value.sorting,
          options: {
            includeHeaders: config.includeHeaders ?? true,
            includeTotals: config.includeTotals ?? false,
            orientation: config.orientation,
            pageSize: config.pageSize,
            margins: config.margins,
            delimiter: config.delimiter,
            encoding: config.encoding,
          },
        }),
      })

      if (!response.ok)
        throw new Error(`Export failed! status: ${response.status}`)

      const blob = await response.blob()

      clearInterval(progressInterval)
      exportProgress.value = 100

      // Descargar archivo
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.download = config.filename || `report_${Date.now()}.${config.format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    }
    catch (error) {
      exportError.value = error instanceof Error ? error.message : t('DynamicReports.report.export.error')
    }
    finally {
      isExporting.value = false
      setTimeout(() => {
        exportProgress.value = 0
      }, 1000)
    }
  }

  // Métodos de paginación
  const goToPage = async (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      await executeReport({
        pagination: {
          ...executionParams.value.pagination,
          page,
        },
      })
    }
  }

  const changePageSize = async (limit: number) => {
    await executeReport({
      pagination: {
        page: 1,
        limit,
      },
    })
  }

  // Métodos de filtrado
  const applyFilters = async (filters: Record<string, any>) => {
    await executeReport({
      filters,
      pagination: {
        page: 1,
        limit: executionParams.value.pagination?.limit || 50,
      },
    })
  }

  const clearFilters = async () => {
    await executeReport({
      filters: {},
      pagination: {
        page: 1,
        limit: executionParams.value.pagination?.limit || 50,
      },
    })
  }

  // Métodos de ordenamiento
  const applySorting = async (sorting: Record<string, any>) => {
    await executeReport({
      sorting,
      pagination: {
        page: 1,
        limit: executionParams.value.pagination?.limit || 50,
      },
    })
  }

  // Métodos de utilidad
  const getExecutionStatus = computed(() => {
    if (isExecuting.value)
      return 'executing'
    if (hasError.value)
      return 'error'
    if (hasResults.value)
      return 'success'

    return 'idle'
  })

  const getExportStatus = computed(() => {
    if (isExporting.value)
      return 'exporting'
    if (exportError.value)
      return 'error'

    return 'idle'
  })

  const formatExecutionTime = (time: number) => {
    if (time < 1000)
      return `${time}ms`

    return `${(time / 1000).toFixed(2)}s`
  }

  const getDataSlice = (start: number, end: number) => {
    if (!executionResult.value)
      return []

    return executionResult.value.data.slice(start, end)
  }

  return {
    // State
    isExecuting: readonly(isExecuting),
    isExporting: readonly(isExporting),
    executionResult: readonly(executionResult),
    executionError: readonly(executionError),
    executionProgress: readonly(executionProgress),
    exportProgress: readonly(exportProgress),
    exportError: readonly(exportError),
    executionParams: readonly(executionParams),

    // Computed
    hasResults,
    hasError,
    isExecutingOrExporting,
    totalRecords,
    currentPage,
    totalPages,
    executionTime,
    getExecutionStatus,
    getExportStatus,

    // Methods
    executeReport,
    refreshExecution,
    clearResults,
    exportReport,
    goToPage,
    changePageSize,
    applyFilters,
    clearFilters,
    applySorting,
    formatExecutionTime,
    getDataSlice,
  }
}
