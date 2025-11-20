import type { WidgetTypeEnum } from '../enums/WidgetTypeEnum'

// Re-export WidgetTypeEnum for convenience
export { WidgetTypeEnum } from '../enums/WidgetTypeEnum'

/**
 * Configuración de consulta del widget
 */
export interface QueryConfig {
  fields: string[] // Campos a consultar
  aggregations?: Aggregation[] // SUM, COUNT, AVG, etc.
  filters?: FilterConfig[]
  sorting?: SortConfig[]
  limit?: number
  groupBy?: string[]
}

export interface Aggregation {
  field: string
  function: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX' | 'DISTINCT'
  alias?: string
}

export interface FilterConfig {
  field: string
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in' | 'between'
  value: any
  logical?: 'AND' | 'OR'
}

export interface SortConfig {
  field: string
  direction: 'ASC' | 'DESC'
}

/**
 * Configuración de visualización del widget
 */
export interface DisplayConfig {
  // Para STAT widgets
  stat?: StatDisplayConfig

  // Para CHART widgets
  chart?: ChartDisplayConfig

  // Para TABLE widgets
  table?: TableDisplayConfig

  // Para MAP widgets
  map?: MapDisplayConfig

  // Para GAUGE widgets
  gauge?: GaugeDisplayConfig

  // Para PROGRESS widgets
  progress?: ProgressDisplayConfig

  // Para LIST widgets
  list?: ListDisplayConfig

  // Para TIMELINE widgets
  timeline?: TimelineDisplayConfig

  // Para CALENDAR widgets
  calendar?: CalendarDisplayConfig

  // Para CUSTOM_HTML widgets
  customHtml?: CustomHtmlDisplayConfig

  // Configuración común
  theme?: 'light' | 'dark' | 'auto'
  height?: number
  responsive?: boolean
  showHeader?: boolean
  headerColor?: string
}

/**
 * Configuración específica de STAT widget
 */
export interface StatDisplayConfig {
  value_field: string
  label: string
  icon?: string
  color?: string
  format?: 'number' | 'currency' | 'percentage' | 'decimal'
  decimals?: number
  prefix?: string
  suffix?: string
  show_trend?: boolean
  trend_field?: string
  trend_icon?: string
}

/**
 * Configuración específica de CHART widget
 */
export interface ChartDisplayConfig {
  x_axis_field: string
  y_axis_field: string | string[] // Soporta múltiples series
  series_field?: string // Para agrupar series
  colors?: string[]
  legend_position?: 'top' | 'bottom' | 'left' | 'right' | 'none'
  data_labels?: boolean
  animations?: boolean
  stacked?: boolean
  horizontal?: boolean
  curve?: 'smooth' | 'straight' | 'stepline'
  toolbar?: boolean
  zoom?: boolean
  export_enabled?: boolean
}

/**
 * Configuración específica de TABLE widget
 */
export interface TableDisplayConfig {
  columns: TableColumn[]
  pagination?: boolean
  rows_per_page?: number
  sortable?: boolean
  filterable?: boolean
  searchable?: boolean
  dense?: boolean
  striped?: boolean
  bordered?: boolean
  hoverable?: boolean
  selection?: 'single' | 'multiple' | 'none'
}

export interface TableColumn {
  field: string
  title: string
  type?: 'text' | 'number' | 'date' | 'currency' | 'badge' | 'chip' | 'link'
  align?: 'left' | 'center' | 'right'
  width?: number | string
  sortable?: boolean
  filterable?: boolean
  format?: string
}

/**
 * Configuración específica de MAP widget
 */
export interface MapDisplayConfig {
  lat_field: string
  lng_field: string
  marker_config?: MarkerConfig
  zoom_level?: number
  center?: [number, number]
  cluster_markers?: boolean
  show_popup?: boolean
  popup_template?: string
  map_style?: 'streets' | 'satellite' | 'dark' | 'light'
}

export interface MarkerConfig {
  color_field?: string
  size_field?: string
  icon_field?: string
  default_color?: string
  default_icon?: string
}

/**
 * Configuración específica de GAUGE widget
 */
export interface GaugeDisplayConfig {
  value_field: string
  min_value?: number
  max_value: number
  label?: string
  unit?: string
  format?: 'number' | 'percentage'
  color_ranges?: Array<{
    from: number
    to: number
    color: string
  }>
  show_value?: boolean
  arc_length?: number // 180 para semicírculo, 360 para círculo completo
}

/**
 * Configuración específica de PROGRESS widget
 */
export interface ProgressDisplayConfig {
  value_field: string
  max_value?: number
  label?: string
  show_value?: boolean
  show_percentage?: boolean
  color?: string
  size?: 'small' | 'medium' | 'large'
  variant?: 'linear' | 'circular'
}

/**
 * Configuración específica de LIST widget
 */
export interface ListDisplayConfig {
  title_field: string
  subtitle_field?: string
  description_field?: string
  icon_field?: string
  avatar_field?: string
  badge_field?: string
  link_field?: string
  max_items?: number
  show_dividers?: boolean
  show_avatars?: boolean
}

/**
 * Configuración específica de TIMELINE widget
 */
export interface TimelineDisplayConfig {
  date_field: string
  title_field: string
  description_field?: string
  icon_field?: string
  color_field?: string
  sort_direction?: 'ASC' | 'DESC'
  max_items?: number
  compact?: boolean
}

/**
 * Configuración específica de CALENDAR widget
 */
export interface CalendarDisplayConfig {
  date_field: string
  title_field: string
  start_field?: string
  end_field?: string
  color_field?: string
  description_field?: string
  view?: 'month' | 'week' | 'day' | 'list'
  editable?: boolean
}

/**
 * Configuración específica de CUSTOM_HTML widget
 */
export interface CustomHtmlDisplayConfig {
  content: string
  use_template?: boolean
  template_fields?: string[]
  allow_scripts?: boolean
  style?: string
}

/**
 * Transformaciones de datos
 */
export interface DataTransformation {
  type: 'map' | 'filter' | 'reduce' | 'sort' | 'group' | 'aggregate'
  config: Record<string, any>
}

/**
 * Filtro de widget
 */
export interface WidgetFilter {
  id: string
  field: string
  operator: string
  value: any
  label?: string
}

/**
 * Posición del widget en el grid
 */
export interface WidgetPosition {
  x: number // Columna (0-11)
  y: number // Fila
  w: number // Ancho en columnas
  h: number // Alto en filas
}

/**
 * Configuración completa de widget en dashboard
 */
export interface WidgetInstanceConfig {
  id: string
  widget_id: string // Referencia a Widget entity
  position: WidgetPosition
  config: Record<string, any> // Configuración específica sobrescrita
  filters?: WidgetFilter[] // Filtros específicos del widget
  title?: string // Título personalizado
  description?: string // Descripción personalizada
}

/**
 * Datos cargados del widget
 */
export interface WidgetData {
  rows: any[]
  columns?: string[]
  total?: number
  aggregations?: Record<string, any>
  metadata?: Record<string, any>
}
