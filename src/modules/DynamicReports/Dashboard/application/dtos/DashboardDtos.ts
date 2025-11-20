import type {
  AutoRefreshConfig,
  DashboardAction,
  DashboardCategory,
  DashboardExportConfig,
  DashboardGlobalFilter,
  DashboardLayout,
  DashboardPermission,
  DashboardShareConfig,
  DashboardTheme,
} from '../../domain/types/DashboardTypes'
import type { WidgetInstanceConfig } from '../../../Widget/domain/types/WidgetTypes'

/**
 * DTO para crear un dashboard
 */
export interface DashboardCreateDto {
  name: string
  description?: string
  layout: DashboardLayout
  widgets?: WidgetInstanceConfig[]
  theme?: DashboardTheme
  is_public?: boolean
  category_id?: string
  refresh_config?: AutoRefreshConfig
  permissions?: DashboardPermission[]
  global_filters?: DashboardGlobalFilter[]
  actions?: DashboardAction[]
  export_config?: DashboardExportConfig
  share_config?: DashboardShareConfig
  tags?: string[]
  metadata?: Record<string, any>
}

/**
 * DTO para actualizar un dashboard
 */
export interface DashboardUpdateDto {
  name?: string
  description?: string
  slug?: string
  layout?: Partial<DashboardLayout>
  widgets?: WidgetInstanceConfig[]
  theme?: Partial<DashboardTheme>
  is_public?: boolean
  is_shared?: boolean
  is_favorite?: boolean
  category_id?: string
  refresh_config?: Partial<AutoRefreshConfig>
  permissions?: DashboardPermission[]
  global_filters?: DashboardGlobalFilter[]
  actions?: DashboardAction[]
  export_config?: Partial<DashboardExportConfig>
  share_config?: Partial<DashboardShareConfig>
  tags?: string[]
  metadata?: Record<string, any>
}

/**
 * DTO de respuesta de un dashboard
 */
export interface DashboardResponseDto {
  id: string
  name: string
  description?: string
  slug: string
  layout: DashboardLayout
  widgets: WidgetInstanceConfig[]
  theme: DashboardTheme
  is_public: boolean
  is_shared: boolean
  is_favorite: boolean
  category_id?: string
  category?: DashboardCategory
  refresh_config: AutoRefreshConfig
  permissions: DashboardPermission[]
  global_filters: DashboardGlobalFilter[]
  actions: DashboardAction[]
  export_config?: DashboardExportConfig
  share_config?: DashboardShareConfig
  metadata: Record<string, any>
  tags: string[]
  view_count: number
  last_viewed_at?: string
  created_by?: string
  updated_by?: string
  created_at: string
  updated_at: string
}

/**
 * DTO para listar dashboards
 */
export interface DashboardListDto {
  id: string
  name: string
  description?: string
  slug: string
  is_public: boolean
  is_shared: boolean
  is_favorite: boolean
  category_id?: string
  category?: DashboardCategory
  widget_count: number
  tags: string[]
  view_count: number
  last_viewed_at?: string
  created_by?: string
  created_at: string
  updated_at: string
  thumbnail?: string
}

/**
 * DTO de respuesta de lista paginada
 */
export interface DashboardListResponseDto {
  data: DashboardListDto[]
  pagination: {
    total: number
    page: number
    limit: number
    total_pages: number
  }
}

/**
 * DTO para agregar widget a dashboard
 */
export interface AddWidgetToDashboardDto {
  dashboard_id: string
  widget_config: WidgetInstanceConfig
}

/**
 * DTO para remover widget de dashboard
 */
export interface RemoveWidgetFromDashboardDto {
  dashboard_id: string
  widget_instance_id: string
}

/**
 * DTO para actualizar posición de widget
 */
export interface UpdateWidgetPositionDto {
  dashboard_id: string
  widget_instance_id: string
  position: WidgetInstanceConfig['position']
}

/**
 * DTO para clonar dashboard
 */
export interface CloneDashboardDto {
  dashboard_id: string
  new_name: string
  include_widgets?: boolean
  include_permissions?: boolean
}

/**
 * DTO para compartir dashboard
 */
export interface ShareDashboardDto {
  dashboard_id: string
  share_config: DashboardShareConfig
  notify_users?: boolean
  message?: string
}

/**
 * DTO para exportar dashboard
 */
export interface ExportDashboardDto {
  dashboard_id: string
  format: 'pdf' | 'png' | 'jpg' | 'json'
  include_data?: boolean
  include_filters?: boolean
  options?: Record<string, any>
}

/**
 * DTO de respuesta de exportación
 */
export interface ExportDashboardResponseDto {
  dashboard_id: string
  format: string
  file_url: string
  file_size: number
  expires_at: string
}

/**
 * Filtros para listar dashboards
 */
export interface DashboardListFiltersDto {
  search?: string
  category_id?: string
  is_public?: boolean
  is_favorite?: boolean
  created_by?: string
  tags?: string[]
  created_after?: string
  created_before?: string
  page?: number
  limit?: number
  sort_by?: string
  sort_direction?: 'ASC' | 'DESC'
}

/**
 * DTO para incrementar contador de vistas
 */
export interface IncrementViewCountDto {
  dashboard_id: string
}

/**
 * DTO para toggle favorito
 */
export interface ToggleFavoriteDto {
  dashboard_id: string
}

/**
 * DTO para agregar filtro global
 */
export interface AddGlobalFilterDto {
  dashboard_id: string
  filter: DashboardGlobalFilter
}

/**
 * DTO para remover filtro global
 */
export interface RemoveGlobalFilterDto {
  dashboard_id: string
  filter_id: string
}
