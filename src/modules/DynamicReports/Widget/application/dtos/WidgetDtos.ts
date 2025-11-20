import type { WidgetTypeEnum } from '../../domain/enums/WidgetTypeEnum'
import type {
  DataTransformation,
  DisplayConfig,
  QueryConfig,
  WidgetData,
  WidgetFilter,
} from '../../domain/types/WidgetTypes'

/**
 * DTO para crear un widget
 */
export interface WidgetCreateDto {
  name: string
  description?: string
  type: WidgetTypeEnum
  data_source_id: string
  query_config: QueryConfig
  display_config: DisplayConfig
  refresh_interval?: number
  cache_enabled?: boolean
  cache_ttl?: number
  filters?: WidgetFilter[]
  transformations?: DataTransformation[]
  is_active?: boolean
}

/**
 * DTO para actualizar un widget
 */
export interface WidgetUpdateDto {
  name?: string
  description?: string
  type?: WidgetTypeEnum
  data_source_id?: string
  query_config?: Partial<QueryConfig>
  display_config?: Partial<DisplayConfig>
  refresh_interval?: number
  cache_enabled?: boolean
  cache_ttl?: number
  filters?: WidgetFilter[]
  transformations?: DataTransformation[]
  is_active?: boolean
}

/**
 * DTO de respuesta de un widget
 */
export interface WidgetResponseDto {
  id: string
  name: string
  description?: string
  type: WidgetTypeEnum
  data_source_id: string
  data_source_name?: string
  query_config: QueryConfig
  display_config: DisplayConfig
  refresh_interval: number
  cache_enabled: boolean
  cache_ttl: number
  filters: WidgetFilter[]
  transformations: DataTransformation[]
  is_active: boolean
  created_by?: string
  updated_by?: string
  created_at: string
  updated_at: string
}

/**
 * DTO para listar widgets
 */
export interface WidgetListDto {
  id: string
  name: string
  description?: string
  type: WidgetTypeEnum
  data_source_id: string
  data_source_name?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * DTO de respuesta de lista paginada
 */
export interface WidgetListResponseDto {
  data: WidgetListDto[]
  pagination: {
    total: number
    page: number
    limit: number
    total_pages: number
  }
}

/**
 * DTO para ejecutar consulta de widget
 */
export interface WidgetExecuteQueryDto {
  widget_id: string
  filters?: WidgetFilter[] // Filtros adicionales/override
  limit?: number // Override del limit
  offset?: number // Para paginación
}

/**
 * DTO de respuesta de ejecución de query
 */
export interface WidgetExecuteQueryResponseDto {
  widget_id: string
  data: WidgetData
  execution_time_ms: number
  cached: boolean
  executed_at: string
}

/**
 * DTO para refrescar datos de widget
 */
export interface WidgetRefreshDto {
  widget_id: string
  force?: boolean // Forzar refresh ignorando cache
}

/**
 * Filtros para listar widgets
 */
export interface WidgetListFiltersDto {
  search?: string
  type?: WidgetTypeEnum
  data_source_id?: string
  is_active?: boolean
  created_by?: string
  created_after?: string
  created_before?: string
  page?: number
  limit?: number
  sort_by?: string
  sort_direction?: 'ASC' | 'DESC'
}
