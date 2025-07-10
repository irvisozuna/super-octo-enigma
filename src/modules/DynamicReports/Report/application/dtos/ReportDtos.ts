/**
 * Report DTOs - Data Transfer Objects for Report Module
 * Following Clean Architecture principles and DDD patterns
 */

// Base Types
export type ViewModeType = 'table' | 'card' | 'chart'
export type DensityType = 'comfortable' | 'compact' | 'default'
export type SortDirection = 'ASC' | 'DESC'
export type FieldType = 'varchar' | 'text' | 'number' | 'double' | 'integer' | 'date' | 'datetime' | 'boolean'
export type FieldFormat = 'text' | 'number' | 'currency' | 'percentage' | 'date' | 'datetime' | 'boolean'
export type FilterOperator = 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with' |
'greater_than' | 'less_than' | 'greater_equal' | 'less_equal' | 'between' | 'in' | 'not_in' |
'is_null' | 'is_not_null'
export type AggregationType = 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX'

// Field Configuration DTO
export interface FieldConfigDTO {
  field: string
  alias: string
  type: FieldType
  format?: FieldFormat
  width?: number
  align?: 'left' | 'center' | 'right'
  visible?: boolean
  sortable?: boolean
  aggregation?: AggregationType
  decimals?: number
  thousandsSeparator?: boolean

  // Advanced formatting options
  prefix?: string
  suffix?: string
  customFormat?: string

  // Display options
  truncate?: boolean
  maxLength?: number
  showTooltip?: boolean
  highlightNegative?: boolean

  // Conditional formatting
  conditionalFormatting?: ConditionalFormat[]

  // Data validation
  validation?: FieldValidation

  // UI behavior
  resizable?: boolean
  draggable?: boolean
  pinnable?: boolean

  // Grouping and categorization
  category?: string
  group?: string
  order?: number

  // Security and permissions
  requiresPermission?: string[]
  maskSensitiveData?: boolean

  // Export options
  exportable?: boolean
  exportFormat?: FieldFormat

  // Chart/visualization options
  chartType?: 'bar' | 'line' | 'pie' | 'scatter' | 'area'
  chartColor?: string

  // Database metadata
  sourceTable?: string
  sourceColumn?: string
  isCalculated?: boolean
  calculationFormula?: string

  // Caching and performance
  cacheable?: boolean
  cacheTTL?: number

  // Internationalization
  localized?: boolean
  localizedFormats?: Record<string, FieldFormat>
}

// Conditional formatting configuration
export interface ConditionalFormat {
  id: string
  name: string
  condition: {
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'between' | 'contains'
    value: any
    secondValue?: any // for 'between' operator
  }
  style: {
    backgroundColor?: string
    textColor?: string
    fontWeight?: 'normal' | 'bold'
    fontStyle?: 'normal' | 'italic'
    textDecoration?: 'none' | 'underline' | 'line-through'
    icon?: string
    iconColor?: string
  }
  priority: number
  enabled: boolean
}

// Field validation configuration
export interface FieldValidation {
  required?: boolean
  minLength?: number
  maxLength?: number
  minValue?: number
  maxValue?: number
  pattern?: string
  customValidator?: string
  errorMessage?: string
}

// Extended field metadata
export interface FieldMetadata {
  description?: string
  documentation?: string
  examples?: string[]
  tags?: string[]
  businessRules?: string[]
  dataSource?: {
    database: string
    schema: string
    table: string
    column: string
  }
  statistics?: {
    uniqueValues: number
    nullCount: number
    minValue: any
    maxValue: any
    avgValue?: number
    medianValue?: any
    mostCommonValue: any
  }
  lastUpdated?: Date
  version?: string
}

// Filter validation configuration
export interface FilterValidation {

  /** Minimum value for numeric filters */
  minValue?: number

  /** Maximum value for numeric filters */
  maxValue?: number

  /** Minimum length for string filters */
  minLength?: number

  /** Maximum length for string filters */
  maxLength?: number

  /** Regular expression pattern for validation */
  pattern?: string

  /** Custom validation function name */
  customValidator?: string

  /** Error message for validation failure */
  errorMessage?: string

  /** Whether empty values are allowed */
  allowEmpty?: boolean

  /** List of allowed values */
  allowedValues?: any[]

  /** List of disallowed values */
  disallowedValues?: any[]

  /** Date range validation for date filters */
  dateRange?: {
    min?: Date
    max?: Date
    excludeWeekends?: boolean
    excludeHolidays?: boolean
  }
}

// Filter metadata
export interface FilterMetadata {

  /** When the filter was created */
  createdAt?: Date

  /** Who created the filter */
  createdBy?: string

  /** When the filter was last modified */
  modifiedAt?: Date

  /** Who last modified the filter */
  modifiedBy?: string

  /** Filter description */
  description?: string

  /** Filter category */
  category?: string

  /** Filter tags */
  tags?: string[]

  /** Usage statistics */
  usage?: {
    timesUsed: number
    lastUsed?: Date
    averageExecutionTime?: number
  }

  /** Dependencies on other filters */
  dependencies?: string[]

  /** Filter version */
  version?: string
}

// Filter localization
export interface FilterLocalization {

  /** Localized display labels */
  labels?: Record<string, string>

  /** Localized operator names */
  operators?: Record<string, string>

  /** Localized validation messages */
  validationMessages?: Record<string, string>

  /** Localized placeholder text */
  placeholders?: Record<string, string>

  /** Date/time format for the current locale */
  dateFormat?: string

  /** Number format for the current locale */
  numberFormat?: Intl.NumberFormatOptions
}

// Sorting metadata
export interface SortingMetadata {

  /** When the sorting rule was created */
  createdAt?: Date

  /** Who created the sorting rule */
  createdBy?: string

  /** When the sorting rule was last modified */
  modifiedAt?: Date

  /** Who last modified the sorting rule */
  modifiedBy?: string

  /** Sorting rule description */
  description?: string

  /** Performance statistics */
  performance?: {
    averageExecutionTime: number
    lastExecutionTime?: number
    complexityScore: number
  }

  /** Usage statistics */
  usage?: {
    timesUsed: number
    lastUsed?: Date
  }

  /** Sorting rule version */
  version?: string
}

// Advanced filter operators with descriptions
export interface FilterOperatorDefinition {

  /** Operator identifier */
  id: FilterOperator

  /** Display name */
  name: string

  /** Operator description */
  description: string

  /** Supported data types */
  supportedTypes: FieldType[]

  /** Number of required values */
  valueCount: number

  /** Whether operator supports multiple values */
  supportsMultipleValues: boolean

  /** Icon for UI display */
  icon?: string

  /** Category for grouping */
  category: 'comparison' | 'text' | 'logical' | 'date' | 'numeric' | 'collection'

  /** SQL template if applicable */
  sqlTemplate?: string

  /** JavaScript function for client-side filtering */
  clientFunction?: string

  /** Performance complexity score */
  complexityScore: number
}

// Filter group configuration
export interface FilterGroupDTO {

  /** Group identifier */
  id: string

  /** Group name */
  name: string

  /** Group description */
  description?: string

  /** Logical operator between filters in group */
  operator: 'AND' | 'OR'

  /** Filters in this group */
  filters: FilterValueDTO[]

  /** Nested groups */
  groups?: FilterGroupDTO[]

  /** Whether group is collapsible in UI */
  collapsible?: boolean

  /** Whether group is expanded by default */
  expanded?: boolean

  /** Group color/theme */
  color?: string

  /** Group icon */
  icon?: string

  /** Group order/priority */
  order?: number
}

// Sorting configuration with advanced options
export interface SortingConfigurationDTO {

  /** Primary sorting rules */
  rules: SortingRuleDTO[]

  /** Default sorting when no user sorting is applied */
  defaultSort?: SortingRuleDTO[]

  /** Maximum number of sorting rules allowed */
  maxRules?: number

  /** Whether user can modify sorting */
  userModifiable?: boolean

  /** Available fields for sorting */
  availableFields?: string[]

  /** Restricted fields that cannot be sorted */
  restrictedFields?: string[]

  /** Global sorting preferences */
  preferences?: {
    caseSensitive: boolean
    nullHandling: 'first' | 'last' | 'ignore'
    localeAware: boolean
    defaultLocale: string
    naturalSort: boolean
    stable: boolean
  }

  /** Performance settings */
  performance?: {
    maxRecordsForClientSort: number
    preferredAlgorithm: 'quicksort' | 'mergesort' | 'heapsort' | 'default'
    enableIndexHints: boolean
  }
}

// Filter Configuration DTO
export interface FilterConfigDTO {
  id?: string
  type: 'filter' | 'group'
  field: string
  alias: string
  operator: FilterOperator
  dataType: FieldType
  required?: boolean
  defaultValue?: any
  options?: Array<{ value: any; label: string }>
  children?: FilterConfigDTO[]
}

// Filter Value DTO - Enhanced
export interface FilterValueDTO {

  /** Unique identifier for the filter */
  id?: string

  /** Field name to filter on */
  field: string

  /** Filter operator */
  operator: FilterOperator

  /** Filter value(s) */
  value: any

  /** Secondary value for range operations (between, etc.) */
  secondValue?: any

  /** Data type of the field being filtered */
  dataType: FieldType

  /** Whether this filter is required/cannot be removed */
  required?: boolean

  /** Filter priority/order */
  priority?: number

  /** Whether filter is enabled/active */
  enabled?: boolean

  /** Custom display label for the filter */
  displayLabel?: string

  /** Filter validation rules */
  validation?: FilterValidation

  /** Whether filter should be case sensitive */
  caseSensitive?: boolean

  /** Logical connector with next filter */
  connector?: 'AND' | 'OR'

  /** Filter group ID for grouping related filters */
  groupId?: string

  /** Whether this is a user-defined or system filter */
  isUserDefined?: boolean

  /** Metadata for the filter */
  metadata?: FilterMetadata

  /** Localization settings */
  localization?: FilterLocalization
}

// Sorting Rule DTO - Enhanced
export interface SortingRuleDTO {

  /** Unique identifier for the sorting rule */
  id?: string

  /** Field name to sort by */
  field: string

  /** Sort direction */
  direction: SortDirection

  /** Sort priority (1 = highest priority) */
  priority: number

  /** Data type of the field being sorted */
  dataType?: FieldType

  /** Whether this sort is enabled/active */
  enabled?: boolean

  /** Whether this sort rule can be removed by user */
  removable?: boolean

  /** Custom sort function name for complex sorting */
  customSortFunction?: string

  /** Null value handling */
  nullHandling?: 'first' | 'last' | 'ignore'

  /** Whether to use locale-aware sorting for strings */
  localeAware?: boolean

  /** Locale to use for sorting (if localeAware is true) */
  locale?: string

  /** Case sensitivity for string sorting */
  caseSensitive?: boolean

  /** Whether to use natural sorting (e.g., 'item10' after 'item2') */
  naturalSort?: boolean

  /** Custom sort values mapping */
  customOrder?: { [key: string]: number }

  /** Whether this is a stable sort */
  stable?: boolean

  /** Sorting algorithm preference */
  algorithm?: 'quicksort' | 'mergesort' | 'heapsort' | 'default'

  /** Display label for the sorting rule */
  displayLabel?: string

  /** Whether sorting should be applied on client or server */
  sortLocation?: 'client' | 'server' | 'auto'

  /** Metadata for the sorting rule */
  metadata?: SortingMetadata
}

// Export Format DTO
export interface ExportFormatDTO {
  id: string
  name: string
  icon: string
  color: string
  enabled?: boolean
}

// Pagination DTO
export interface PaginationDTO {
  currentPage: number
  itemsPerPage: number
  totalItems?: number
  totalPages?: number
}

// Performance Configuration DTO
export interface PerformanceConfigDTO {
  autoRefresh?: boolean
  refreshInterval?: number // seconds
  cacheEnabled?: boolean
  cacheTTL?: number // seconds
}

// Basic Info DTO
export interface ReportBasicInfoDTO {
  name: string
  description?: string
  category?: string
  tags?: string[]
  isPublic?: boolean
  performance?: PerformanceConfigDTO
}

// Export Options DTO
export interface ExportOptionsDTO {
  formats?: ExportFormatDTO[]

  // Legacy support
  excel?: { enabled: boolean }
  pdf?: { enabled: boolean }
  csv?: { enabled: boolean }
}

// Sorting Configuration DTO
export interface SortingConfigDTO {
  primary?: {
    field: string
    direction: SortDirection
  }
  secondary?: {
    field: string
    direction: SortDirection
  }
}

// Report Configuration DTO
export interface ReportConfigDTO {
  id?: string
  name: string
  description?: string
  basicInfo?: ReportBasicInfoDTO
  selectedFields: FieldConfigDTO[]
  filters: FilterConfigDTO[]
  sorting?: SortingConfigDTO
  exportOptions?: ExportOptionsDTO
  advanced?: any
  createdAt?: Date
  updatedAt?: Date
  createdBy?: string
}

// Report Data Response DTO
export interface ReportDataResponseDTO {
  config: ReportConfigDTO
  records: any[]
  totalRecords: number
  executionTime?: number
  generatedAt: Date
}

// Get Report Data Request DTO
export interface GetReportDataRequestDTO {
  reportId: string
  pagination: PaginationDTO
  filters: FilterValueDTO[]
  sorting: SortingRuleDTO[]
  quickSearch?: string
}

// Export Request DTO
export interface ExportReportRequestDTO {
  reportId: string
  format: string
  filters: FilterValueDTO[]
  sorting: SortingRuleDTO[]
  visibleColumns: string[]
  fileName?: string
}

// Export Response DTO
export interface ExportReportResponseDTO {
  downloadUrl: string
  fileName: string
  fileSize: number
  expiresAt: Date
}

// Share Request DTO
export interface ShareReportRequestDTO {
  reportId: string
  filters: FilterValueDTO[]
  sorting: SortingRuleDTO[]
  expiresIn?: number // hours
  password?: string
}

// Share Response DTO
export interface ShareReportResponseDTO {
  shareUrl: string
  token: string
  expiresAt: Date
}

// Report Statistics DTO
export interface ReportStatisticsDTO {
  totalRecords: number
  uniqueValues: Record<string, number>
  numericSummary: Record<string, {
    min: number
    max: number
    avg: number
    sum: number
    count: number
  }>
  lastExecuted: Date
  averageExecutionTime: number
}

// Report Validation Result DTO
export interface ReportValidationResultDTO {
  isValid: boolean
  errors: Array<{
    field: string
    message: string
    severity: 'error' | 'warning' | 'info'
  }>
  warnings: Array<{
    field: string
    message: string
  }>
}

// Report Preview DTO
export interface ReportPreviewDTO {
  config: ReportConfigDTO
  sampleData: any[]
  statistics: ReportStatisticsDTO
  validation: ReportValidationResultDTO
}

// Report List Item DTO
export interface ReportListItemDTO {
  id: string
  name: string
  description?: string
  category?: string
  tags?: string[]
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
  lastExecuted?: Date
  executionCount: number
  canEdit: boolean
  canDelete: boolean
  canShare: boolean
}

// Report Search Request DTO
export interface ReportSearchRequestDTO {
  query?: string
  category?: string
  tags?: string[]
  createdBy?: string
  isPublic?: boolean
  pagination: PaginationDTO
  sorting?: {
    field: 'name' | 'createdAt' | 'updatedAt' | 'lastExecuted'
    direction: SortDirection
  }
}

// Report Search Response DTO
export interface ReportSearchResponseDTO {
  reports: ReportListItemDTO[]
  totalCount: number
  categories: string[]
  availableTags: string[]
  pagination: PaginationDTO
}

// Error Response DTO
export interface ErrorResponseDTO {
  message: string
  code: string
  details?: any
  timestamp: Date
}

// Success Response DTO
export interface SuccessResponseDTO<T = any> {
  data: T
  message?: string
  timestamp: Date
}

// API Response Wrapper
export type ApiResponseDTO<T = any> = SuccessResponseDTO<T> | ErrorResponseDTO

// Result Pattern Implementation
export class Result<T, E = Error> {
  private constructor(
    private readonly success: boolean,
    private readonly data?: T,
    private readonly error?: E,
  ) {}

  static success<T>(data: T): Result<T> {
    return new Result(true, data)
  }

  static failure<E>(error: E): Result<any, E> {
    return new Result(false, undefined, error)
  }

  isSuccess(): boolean {
    return this.success
  }

  isFailure(): boolean {
    return !this.success
  }

  getValue(): T {
    if (!this.success)
      throw new Error('Cannot get value from failed result')

    return this.data!
  }

  getError(): E {
    if (this.success)
      throw new Error('Cannot get error from successful result')

    return this.error!
  }

  map<U>(fn: (data: T) => U): Result<U, E> {
    if (this.success)
      return Result.success(fn(this.data!))

    return Result.failure(this.error!)
  }

  mapError<F>(fn: (error: E) => F): Result<T, F> {
    if (this.success)
      return Result.success(this.data!)

    return Result.failure(fn(this.error!))
  }
}
