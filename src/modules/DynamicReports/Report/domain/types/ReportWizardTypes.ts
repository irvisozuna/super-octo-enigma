// Shared types for Report Wizard - Frontend & Backend compatibility

export interface ReportWizardData {

  // Paso 1: Información Básica
  basicInfo: {
    name: string
    description: string
    dataSourceId: string
    isActive: boolean
    isPublic: boolean
    categoryId?: string
    tags?: string[]
    priority?: string
    departmentId?: string
    search?: {
      enabled: boolean
      fields: string[]
    }
    permissions?: {
      type: string
      users: string[]
      roles: string[]
      departments: string[]
      allowGuests: boolean
      requireAuth: boolean
      inheritFromCategory: boolean
    }
    performance?: {
      refreshInterval: number
      autoRefresh: boolean
      cacheEnabled: boolean
      cacheTtl: number
      maxExecutionTime: number
      maxRows: number
      timeout: number
    }
    notifications?: {
      enabled: boolean
      onError: boolean
      onSuccess: boolean
      onSchedule: boolean
      channels: string[]
      recipients: string[]
    }
    audit?: {
      enabled: boolean
      retentionDays: number
      trackViews: boolean
      trackExports: boolean
      trackModifications: boolean
      anonymizeData: boolean
    }
    advanced?: {
      locale: string
      version: string
      timezone: string
    }
  }

  // Paso 2: Selección de Campos
  selectedFields: Array<{
    field: string
    alias: string
    format: 'text' | 'number' | 'currency' | 'date' | 'datetime'
    width: number
    aggregation?: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX'
    sortable: boolean
    filterable: boolean
    order: number
  }>

  // Paso 3: Configuración de Filtros
  filters: Array<{
    id: string
    field: string
    type: 'text' | 'number' | 'date' | 'select' | 'range'
    operator: string
    defaultValue: any
    required: boolean
    placeholder: string
    options?: Array<{ value: any; label: string }>
  }>

  // Paso 4: Ordenamiento
  sorting: {
    primary: { field: string; direction: 'ASC' | 'DESC' }
    secondary?: { field: string; direction: 'ASC' | 'DESC' }
    tertiary?: { field: string; direction: 'ASC' | 'DESC' }
    nullsHandling: 'FIRST' | 'LAST' | 'IGNORE'
    caseSensitive: boolean
  }

  // Paso 5: Opciones de Exportación
  exportOptions: {
    excel: {
      enabled: boolean
      includeCharts: boolean
      autoFilter: boolean
      includeHeaders: boolean
      includeTotals: boolean
    }
    pdf: {
      enabled: boolean
      orientation: 'portrait' | 'landscape'
      pageSize: 'A4' | 'A3' | 'Letter'
      margins: number
      includeHeaders: boolean
      includeTotals: boolean
    }
    csv: {
      enabled: boolean
      delimiter: string
      encoding: 'UTF-8' | 'ISO-8859-1'
      includeHeaders: boolean
    }
    general: {
      filenameTemplate: string
      compressionLevel: 'none' | 'low' | 'medium' | 'high'
    }
  }

  // Paso 6: Configuración Avanzada
  advanced: {
    columns: any[]
    footer: {
      enabled: boolean
      showTotals: boolean
      showSubtotals: boolean
      showCount: boolean
      showAverage: boolean
      showMin: boolean
      showMax: boolean
      customText: string
    }
    display: {
      showGridLines: boolean
      showAlternateRows: boolean
      alternateRowColor: string
      headerStyle: 'default' | 'bold' | 'colored'
      rowHeight: number
      maxRowsPerPage: number
      enablePagination: boolean
    }
    grouping: {
      enabled: boolean
      showGroupHeaders: boolean
      showGroupFooters: boolean
      collapseGroups: boolean
      groupByFields: any[]
    }
    styling: {
      theme: 'default' | 'dark' | 'light' | 'custom'
      primaryColor: string
      secondaryColor: string
      fontFamily: string
      fontSize: number
    }
    templates?: {
      selected: string
      custom: any[]
    }
    calculatedFields?: Array<{
      id: string
      name: string
      formula: string
      format: string
      description: string
      enabled: boolean
    }>
    conditionalFormats?: Array<{
      id: string
      name: string
      field: string
      conditions: Array<{
        operator: string
        value: string
        color: string
        backgroundColor: string
        bold: boolean
        italic: boolean
      }>
      enabled: boolean
    }>
    interactive?: {
      filters: {
        enabled: boolean
        showFilterBar: boolean
        quickFilters: string[]
        allowCustomFilters: boolean
      }
      actions: {
        enabled: boolean
        allowExport: boolean
        allowPrint: boolean
        allowShare: boolean
        customActions: any[]
      }
      drillDown: {
        enabled: boolean
        levels: any[]
      }
    }
    performance?: {
      enableCache: boolean
      cacheTimeout: number
      enableLazyLoading: boolean
      enableVirtualScrolling: boolean
      maxRowsToRender: number
    }
    security?: {
      enableFieldLevelSecurity: boolean
      hiddenFields: string[]
      restrictedFields: string[]
      enableRowLevelSecurity: boolean
      securityFilters: any[]
    }
  }

  /**
   * Configuración del buscador global
   */
  search?: {
    enabled: boolean
    fields: string[]
  }
}

// Type for backend response that matches wizard structure
export type ReportBackendResponse = ReportWizardData

// Type for creating/updating reports
export type ReportCreateRequest = ReportWizardData
export type ReportUpdateRequest = Partial<ReportWizardData>

// Type for the store wizard data (extends the base type)
export interface WizardStoreData extends ReportWizardData {

  // Additional store-specific properties can be added here
  _id?: string
  _createdAt?: string
  _updatedAt?: string
}
