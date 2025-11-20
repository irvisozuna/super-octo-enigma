import type { WidgetInstanceConfig } from '../../../Widget/domain/types/WidgetTypes'

/**
 * Layout del dashboard (grid configuration)
 */
export interface DashboardLayout {
  columns: number // Número de columnas (default: 12)
  rows?: number // Número de filas (auto si no se especifica)
  gap: number // Espacio entre widgets en px
  padding: number // Padding del contenedor
  responsive?: ResponsiveConfig
}

export interface ResponsiveConfig {
  breakpoints?: {
    xs?: number // < 600px
    sm?: number // 600-960px
    md?: number // 960-1264px
    lg?: number // 1264-1904px
    xl?: number // > 1904px
  }
  columnsByBreakpoint?: {
    xs?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
}

/**
 * Tema del dashboard
 */
export interface DashboardTheme {
  mode?: 'light' | 'dark' | 'auto'
  primary_color?: string
  secondary_color?: string
  background_color?: string
  card_background?: string
  text_color?: string
  border_color?: string
  font_family?: string
  custom_css?: string
}

/**
 * Permiso de dashboard
 */
export interface DashboardPermission {
  type: 'user' | 'role' | 'department'
  id: string
  name: string
  actions: ('read' | 'write' | 'delete' | 'share')[]
}

/**
 * Filtro global del dashboard
 */
export interface DashboardGlobalFilter {
  id: string
  field: string
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect'
  label: string
  operator?: string
  default_value?: any
  options?: Array<{ value: any; label: string }>
  apply_to_widgets?: string[] // IDs de widgets, si está vacío aplica a todos
}

/**
 * Acción personalizada del dashboard
 */
export interface DashboardAction {
  id: string
  label: string
  icon?: string
  color?: string
  type: 'export' | 'refresh' | 'share' | 'print' | 'custom'
  config?: Record<string, any>
  requires_permission?: string
}

/**
 * Template de dashboard
 */
export interface DashboardTemplate {
  id: string
  name: string
  description?: string
  thumbnail?: string
  layout: DashboardLayout
  widgets: WidgetInstanceConfig[]
  theme?: DashboardTheme
  category?: string
  tags?: string[]
}

/**
 * Configuración de auto-refresh
 */
export interface AutoRefreshConfig {
  enabled: boolean
  interval: number // En segundos
  notify_on_refresh?: boolean
  refresh_on_focus?: boolean
  widgets?: string[] // IDs de widgets específicos, si está vacío refresca todos
}

/**
 * Configuración de exportación
 */
export interface DashboardExportConfig {
  formats: ('pdf' | 'png' | 'jpg' | 'json')[]
  include_filters?: boolean
  include_data?: boolean
  page_size?: 'A4' | 'A3' | 'Letter'
  orientation?: 'portrait' | 'landscape'
}

/**
 * Categoría de dashboard
 */
export interface DashboardCategory {
  id: string
  name: string
  icon?: string
  color?: string
  description?: string
  parent_id?: string
  order?: number
}

/**
 * Snapshot del dashboard (para versionado)
 */
export interface DashboardSnapshot {
  id: string
  dashboard_id: string
  name?: string
  data: any
  created_by: string
  created_at: Date
}

/**
 * Audit log del dashboard
 */
export interface DashboardAuditLog {
  id: string
  dashboard_id: string
  action: 'created' | 'updated' | 'deleted' | 'viewed' | 'shared' | 'exported'
  user_id: string
  user_name: string
  metadata?: Record<string, any>
  ip_address?: string
  user_agent?: string
  created_at: Date
}

/**
 * Configuración de compartir dashboard
 */
export interface DashboardShareConfig {
  is_public: boolean
  public_link?: string
  expiration_date?: Date
  allowed_domains?: string[]
  require_authentication?: boolean
  password_protected?: boolean
  password?: string
}
