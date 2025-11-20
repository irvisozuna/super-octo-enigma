import { rawApi } from '@/services/api'
import type {
  AddGlobalFilterDto,
  AddWidgetToDashboardDto,
  CloneDashboardDto,
  DashboardCreateDto,
  DashboardListFiltersDto,
  DashboardListResponseDto,
  DashboardResponseDto,
  DashboardUpdateDto,
  ExportDashboardDto,
  ExportDashboardResponseDto,
  IncrementViewCountDto,
  RemoveGlobalFilterDto,
  RemoveWidgetFromDashboardDto,
  ShareDashboardDto,
  ToggleFavoriteDto,
  UpdateWidgetPositionDto,
} from '../../../application/dtos/DashboardDtos'

/**
 * Servicio de API para gestionar dashboards
 */
export class DashboardApiService {
  private readonly baseUrl = '/dynamic-reports/dashboards'

  /**
   * Crea un nuevo dashboard
   */
  async create(data: DashboardCreateDto): Promise<{ data: DashboardResponseDto }> {
    return await rawApi(this.baseUrl, {
      method: 'POST',
      body: data,
    })
  }

  /**
   * Actualiza un dashboard existente
   */
  async update(id: string, data: DashboardUpdateDto): Promise<{ data: DashboardResponseDto }> {
    return await rawApi(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      body: data,
    })
  }

  /**
   * Elimina un dashboard
   */
  async delete(id: string): Promise<void> {
    return await rawApi(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    })
  }

  /**
   * Obtiene un dashboard por ID
   */
  async getById(id: string): Promise<DashboardResponseDto> {
    return await rawApi(`${this.baseUrl}/${id}`, {
      method: 'GET',
    })
  }

  /**
   * Obtiene un dashboard por slug
   */
  async getBySlug(slug: string): Promise<DashboardResponseDto> {
    return await rawApi(`${this.baseUrl}/slug/${slug}`, {
      method: 'GET',
    })
  }

  /**
   * Obtiene todos los dashboards (sin paginación)
   */
  async getAll(): Promise<{ data: DashboardResponseDto[] }> {
    return await rawApi(this.baseUrl, {
      method: 'GET',
    })
  }

  /**
   * Obtiene lista paginada de dashboards con filtros
   */
  async getList(filters: DashboardListFiltersDto): Promise<DashboardListResponseDto> {
    return await rawApi(this.baseUrl, {
      method: 'GET',
      params: filters,
    })
  }

  /**
   * Agrega un widget al dashboard
   */
  async addWidget(data: AddWidgetToDashboardDto): Promise<{ data: DashboardResponseDto }> {
    return await rawApi(`${this.baseUrl}/${data.dashboard_id}/widgets`, {
      method: 'POST',
      body: { widget_config: data.widget_config },
    })
  }

  /**
   * Remueve un widget del dashboard
   */
  async removeWidget(data: RemoveWidgetFromDashboardDto): Promise<{ data: DashboardResponseDto }> {
    return await rawApi(
      `${this.baseUrl}/${data.dashboard_id}/widgets/${data.widget_instance_id}`,
      {
        method: 'DELETE',
      },
    )
  }

  /**
   * Actualiza la posición de un widget
   */
  async updateWidgetPosition(data: UpdateWidgetPositionDto): Promise<{ data: DashboardResponseDto }> {
    return await rawApi(
      `${this.baseUrl}/${data.dashboard_id}/widgets/${data.widget_instance_id}/position`,
      {
        method: 'PATCH',
        body: { position: data.position },
      },
    )
  }

  /**
   * Actualiza múltiples posiciones de widgets (para drag & drop)
   */
  async updateWidgetsLayout(
    dashboardId: string,
    widgets: Array<{ id: string; position: any }>,
  ): Promise<{ data: DashboardResponseDto }> {
    return await rawApi(`${this.baseUrl}/${dashboardId}/widgets/layout`, {
      method: 'PATCH',
      body: { widgets },
    })
  }

  /**
   * Clona un dashboard
   */
  async clone(data: CloneDashboardDto): Promise<{ data: DashboardResponseDto }> {
    return await rawApi(`${this.baseUrl}/${data.dashboard_id}/clone`, {
      method: 'POST',
      body: {
        new_name: data.new_name,
        include_widgets: data.include_widgets,
        include_permissions: data.include_permissions,
      },
    })
  }

  /**
   * Comparte un dashboard
   */
  async share(data: ShareDashboardDto): Promise<{ data: DashboardResponseDto }> {
    return await rawApi(`${this.baseUrl}/${data.dashboard_id}/share`, {
      method: 'POST',
      body: {
        share_config: data.share_config,
        notify_users: data.notify_users,
        message: data.message,
      },
    })
  }

  /**
   * Deja de compartir un dashboard
   */
  async unshare(dashboardId: string): Promise<{ data: DashboardResponseDto }> {
    return await rawApi(`${this.baseUrl}/${dashboardId}/unshare`, {
      method: 'POST',
    })
  }

  /**
   * Exporta un dashboard
   */
  async export(data: ExportDashboardDto): Promise<ExportDashboardResponseDto> {
    return await rawApi(`${this.baseUrl}/${data.dashboard_id}/export`, {
      method: 'POST',
      body: {
        format: data.format,
        include_data: data.include_data,
        include_filters: data.include_filters,
        options: data.options,
      },
    })
  }

  /**
   * Incrementa el contador de vistas
   */
  async incrementViewCount(data: IncrementViewCountDto): Promise<void> {
    return await rawApi(`${this.baseUrl}/${data.dashboard_id}/view`, {
      method: 'POST',
    })
  }

  /**
   * Toggle favorito
   */
  async toggleFavorite(data: ToggleFavoriteDto): Promise<{ data: DashboardResponseDto }> {
    return await rawApi(`${this.baseUrl}/${data.dashboard_id}/favorite`, {
      method: 'PATCH',
    })
  }

  /**
   * Agrega un filtro global
   */
  async addGlobalFilter(data: AddGlobalFilterDto): Promise<{ data: DashboardResponseDto }> {
    return await rawApi(`${this.baseUrl}/${data.dashboard_id}/filters`, {
      method: 'POST',
      body: { filter: data.filter },
    })
  }

  /**
   * Remueve un filtro global
   */
  async removeGlobalFilter(data: RemoveGlobalFilterDto): Promise<{ data: DashboardResponseDto }> {
    return await rawApi(
      `${this.baseUrl}/${data.dashboard_id}/filters/${data.filter_id}`,
      {
        method: 'DELETE',
      },
    )
  }

  /**
   * Obtiene dashboards favoritos del usuario
   */
  async getFavorites(): Promise<{ data: DashboardResponseDto[] }> {
    return await rawApi(`${this.baseUrl}/favorites`, {
      method: 'GET',
    })
  }

  /**
   * Obtiene dashboards recientes del usuario
   */
  async getRecent(limit = 10): Promise<{ data: DashboardResponseDto[] }> {
    return await rawApi(`${this.baseUrl}/recent`, {
      method: 'GET',
      params: { limit },
    })
  }

  /**
   * Obtiene dashboards compartidos con el usuario
   */
  async getShared(): Promise<{ data: DashboardResponseDto[] }> {
    return await rawApi(`${this.baseUrl}/shared`, {
      method: 'GET',
    })
  }

  /**
   * Obtiene dashboards por categoría
   */
  async getByCategory(categoryId: string): Promise<{ data: DashboardResponseDto[] }> {
    return await rawApi(`${this.baseUrl}/category/${categoryId}`, {
      method: 'GET',
    })
  }

  /**
   * Obtiene dashboards públicos
   */
  async getPublic(): Promise<{ data: DashboardResponseDto[] }> {
    return await rawApi(`${this.baseUrl}/public`, {
      method: 'GET',
    })
  }

  /**
   * Duplica un dashboard como template
   */
  async saveAsTemplate(
    dashboardId: string,
    templateData: { name: string; description?: string },
  ): Promise<{ data: any }> {
    return await rawApi(`${this.baseUrl}/${dashboardId}/save-as-template`, {
      method: 'POST',
      body: templateData,
    })
  }

  /**
   * Crea dashboard desde template
   */
  async createFromTemplate(
    templateId: string,
    data: { name: string; description?: string },
  ): Promise<{ data: DashboardResponseDto }> {
    return await rawApi(`${this.baseUrl}/from-template/${templateId}`, {
      method: 'POST',
      body: data,
    })
  }

  /**
   * Obtiene estadísticas del dashboard
   */
  async getStats(dashboardId: string): Promise<{
    view_count: number
    unique_viewers: number
    avg_session_duration: number
    last_viewed_at: string
    widget_execution_stats: any[]
  }> {
    return await rawApi(`${this.baseUrl}/${dashboardId}/stats`, {
      method: 'GET',
    })
  }

  /**
   * Refresca todos los widgets del dashboard
   */
  async refreshAllWidgets(dashboardId: string): Promise<{
    success: boolean
    results: any[]
  }> {
    return await rawApi(`${this.baseUrl}/${dashboardId}/refresh`, {
      method: 'POST',
    })
  }

  /**
   * Obtiene el historial de cambios del dashboard
   */
  async getHistory(dashboardId: string): Promise<{
    data: any[]
  }> {
    return await rawApi(`${this.baseUrl}/${dashboardId}/history`, {
      method: 'GET',
    })
  }

  /**
   * Restaura una versión anterior del dashboard
   */
  async restoreVersion(
    dashboardId: string,
    versionId: string,
  ): Promise<{ data: DashboardResponseDto }> {
    return await rawApi(`${this.baseUrl}/${dashboardId}/restore/${versionId}`, {
      method: 'POST',
    })
  }
}
