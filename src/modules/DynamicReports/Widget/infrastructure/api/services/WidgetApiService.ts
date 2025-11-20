import { rawApi } from '@/services/api'
import type {
  WidgetCreateDto,
  WidgetExecuteQueryDto,
  WidgetExecuteQueryResponseDto,
  WidgetListFiltersDto,
  WidgetListResponseDto,
  WidgetRefreshDto,
  WidgetResponseDto,
  WidgetUpdateDto,
} from '../../../application/dtos/WidgetDtos'

/**
 * Servicio de API para gestionar widgets
 */
export class WidgetApiService {
  private readonly baseUrl = '/dynamic-reports/widgets'

  /**
   * Crea un nuevo widget
   */
  async create(data: WidgetCreateDto): Promise<{ data: WidgetResponseDto }> {
    return await rawApi(this.baseUrl, {
      method: 'POST',
      body: data,
    })
  }

  /**
   * Actualiza un widget existente
   */
  async update(id: string, data: WidgetUpdateDto): Promise<{ data: WidgetResponseDto }> {
    return await rawApi(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      body: data,
    })
  }

  /**
   * Elimina un widget
   */
  async delete(id: string): Promise<void> {
    return await rawApi(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    })
  }

  /**
   * Obtiene un widget por ID
   */
  async getById(id: string): Promise<WidgetResponseDto> {
    return await rawApi(`${this.baseUrl}/${id}`, {
      method: 'GET',
    })
  }

  /**
   * Obtiene todos los widgets (sin paginación)
   */
  async getAll(): Promise<{ data: WidgetResponseDto[] }> {
    return await rawApi(this.baseUrl, {
      method: 'GET',
    })
  }

  /**
   * Obtiene lista paginada de widgets con filtros
   */
  async getList(filters: WidgetListFiltersDto): Promise<WidgetListResponseDto> {
    return await rawApi(this.baseUrl, {
      method: 'GET',
      params: filters,
    })
  }

  /**
   * Ejecuta la consulta de un widget y retorna los datos
   */
  async executeQuery(
    id: string,
    params?: WidgetExecuteQueryDto,
  ): Promise<WidgetExecuteQueryResponseDto> {
    return await rawApi(`${this.baseUrl}/${id}/execute`, {
      method: 'POST',
      body: params || {},
    })
  }

  /**
   * Refresca los datos de un widget (ignora cache)
   */
  async refresh(id: string, params?: WidgetRefreshDto): Promise<WidgetExecuteQueryResponseDto> {
    return await rawApi(`${this.baseUrl}/${id}/refresh`, {
      method: 'POST',
      body: params || {},
    })
  }

  /**
   * Valida la configuración de un widget
   */
  async validate(data: WidgetCreateDto | WidgetUpdateDto): Promise<{
    valid: boolean
    errors: string[]
  }> {
    return await rawApi(`${this.baseUrl}/validate`, {
      method: 'POST',
      body: data,
    })
  }

  /**
   * Clona un widget existente
   */
  async clone(id: string, newName: string): Promise<{ data: WidgetResponseDto }> {
    return await rawApi(`${this.baseUrl}/${id}/clone`, {
      method: 'POST',
      body: { new_name: newName },
    })
  }

  /**
   * Activa/Desactiva un widget
   */
  async toggleActive(id: string): Promise<{ data: WidgetResponseDto }> {
    return await rawApi(`${this.baseUrl}/${id}/toggle-active`, {
      method: 'PATCH',
    })
  }

  /**
   * Obtiene widgets por data source
   */
  async getByDataSource(dataSourceId: string): Promise<{ data: WidgetResponseDto[] }> {
    return await rawApi(`${this.baseUrl}/by-datasource/${dataSourceId}`, {
      method: 'GET',
    })
  }

  /**
   * Obtiene widgets por tipo
   */
  async getByType(type: string): Promise<{ data: WidgetResponseDto[] }> {
    return await rawApi(`${this.baseUrl}/by-type/${type}`, {
      method: 'GET',
    })
  }

  /**
   * Exporta la configuración de un widget
   */
  async exportConfig(id: string): Promise<{ data: any }> {
    return await rawApi(`${this.baseUrl}/${id}/export`, {
      method: 'GET',
    })
  }

  /**
   * Importa la configuración de un widget
   */
  async importConfig(config: any): Promise<{ data: WidgetResponseDto }> {
    return await rawApi(`${this.baseUrl}/import`, {
      method: 'POST',
      body: config,
    })
  }

  /**
   * Obtiene estadísticas de uso de un widget
   */
  async getStats(id: string): Promise<{
    execution_count: number
    avg_execution_time: number
    last_executed_at: string
    cache_hit_rate: number
  }> {
    return await rawApi(`${this.baseUrl}/${id}/stats`, {
      method: 'GET',
    })
  }

  /**
   * Limpia el cache de un widget específico
   */
  async clearCache(id: string): Promise<void> {
    return await rawApi(`${this.baseUrl}/${id}/clear-cache`, {
      method: 'POST',
    })
  }

  /**
   * Limpia el cache de todos los widgets
   */
  async clearAllCache(): Promise<void> {
    return await rawApi(`${this.baseUrl}/clear-all-cache`, {
      method: 'POST',
    })
  }
}
