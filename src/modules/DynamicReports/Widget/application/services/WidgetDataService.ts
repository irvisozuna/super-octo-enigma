import type { Widget } from '../../domain/entities/Widget'
import type { WidgetData, WidgetFilter } from '../../domain/types/WidgetTypes'
import { DataSourceApiService } from '../../../DataSource/infrastructure/api/services/DataSourceApiService'

/**
 * Servicio para cargar y gestionar datos de widgets
 */
export class WidgetDataService {
  private dataSourceApi: DataSourceApiService

  constructor() {
    this.dataSourceApi = new DataSourceApiService()
  }

  /**
   * Ejecuta la consulta del widget y retorna los datos
   */
  async executeWidgetQuery(
    widget: Widget,
    additionalFilters?: WidgetFilter[],
    limit?: number,
    offset?: number,
  ): Promise<WidgetData> {
    try {
      // Combinar filtros del widget con filtros adicionales
      const allFilters = [
        ...(widget.filters || []),
        ...(additionalFilters || []),
      ]

      // Construir payload de consulta
      const queryPayload = {
        fields: widget.query_config.fields,
        filters: allFilters,
        sorting: widget.query_config.sorting,
        aggregations: widget.query_config.aggregations,
        groupBy: widget.query_config.groupBy,
        limit: limit || widget.query_config.limit,
        offset: offset || 0,
      }

      // Ejecutar consulta en el DataSource
      const response = await this.dataSourceApi.testQuery(
        widget.data_source_id,
        queryPayload,
      )

      // Procesar respuesta
      const widgetData: WidgetData = {
        rows: response.data || [],
        columns: response.columns || [],
        total: response.total || response.data?.length || 0,
        aggregations: response.aggregations || {},
        metadata: response.metadata || {},
      }

      return widgetData
    }
    catch (error) {
      console.error('Error executing widget query:', error)
      throw new Error(`Failed to execute widget query: ${error.message}`)
    }
  }

  /**
   * Ejecuta consulta con cache
   */
  async executeWithCache(
    widget: Widget,
    additionalFilters?: WidgetFilter[],
  ): Promise<{ data: WidgetData; cached: boolean; executionTime: number }> {
    const startTime = performance.now()

    // Generar clave de cache
    const cacheKey = this.generateCacheKey(widget, additionalFilters)

    // Si cache está habilitado, intentar obtener datos cacheados
    if (widget.cache_enabled) {
      const cachedData = this.getCachedData(cacheKey, widget.cache_ttl)
      if (cachedData) {
        const executionTime = performance.now() - startTime

        return {
          data: cachedData,
          cached: true,
          executionTime,
        }
      }
    }

    // Ejecutar query
    const data = await this.executeWidgetQuery(widget, additionalFilters)

    // Cachear resultado si está habilitado
    if (widget.cache_enabled)
      this.setCachedData(cacheKey, data)

    const executionTime = performance.now() - startTime

    return {
      data,
      cached: false,
      executionTime,
    }
  }

  /**
   * Refresca los datos del widget (ignora cache)
   */
  async refreshWidgetData(
    widget: Widget,
    additionalFilters?: WidgetFilter[],
  ): Promise<WidgetData> {
    const cacheKey = this.generateCacheKey(widget, additionalFilters)

    // Limpiar cache
    this.clearCachedData(cacheKey)

    // Ejecutar query fresca
    return this.executeWidgetQuery(widget, additionalFilters)
  }

  /**
   * Ejecuta consulta con paginación
   */
  async executeWithPagination(
    widget: Widget,
    page: number,
    pageSize: number,
    additionalFilters?: WidgetFilter[],
  ): Promise<{ data: WidgetData; pagination: any }> {
    const offset = (page - 1) * pageSize

    const data = await this.executeWidgetQuery(
      widget,
      additionalFilters,
      pageSize,
      offset,
    )

    const pagination = {
      page,
      pageSize,
      total: data.total,
      totalPages: Math.ceil(data.total / pageSize),
    }

    return { data, pagination }
  }

  /**
   * Valida que los campos requeridos existan en el DataSource
   */
  async validateWidgetFields(widget: Widget): Promise<{ valid: boolean; errors: string[] }> {
    try {
      // Obtener campos disponibles del DataSource
      const availableFields = await this.dataSourceApi.getFields(widget.data_source_id)

      const errors: string[] = []

      // Validar campos de query_config
      for (const field of widget.query_config.fields) {
        if (!availableFields.includes(field))
          errors.push(`Field '${field}' not found in DataSource`)
      }

      // Validar campos de display_config según el tipo de widget
      // (esto se puede expandir según necesidades)

      return {
        valid: errors.length === 0,
        errors,
      }
    }
    catch (error) {
      return {
        valid: false,
        errors: [error.message],
      }
    }
  }

  // Helper methods para cache

  private generateCacheKey(widget: Widget, filters?: WidgetFilter[]): string {
    const filterKey = filters ? JSON.stringify(filters) : ''

    return `widget_${widget.id}_${filterKey}`
  }

  private getCachedData(key: string, ttl: number): WidgetData | null {
    try {
      const cached = localStorage.getItem(key)
      if (!cached)
        return null

      const { data, timestamp } = JSON.parse(cached)
      const now = Date.now()

      // Verificar si el cache expiró
      if (now - timestamp > ttl * 1000) {
        localStorage.removeItem(key)

        return null
      }

      return data
    }
    catch (error) {
      console.error('Error reading cache:', error)

      return null
    }
  }

  private setCachedData(key: string, data: WidgetData): void {
    try {
      const cacheEntry = {
        data,
        timestamp: Date.now(),
      }

      localStorage.setItem(key, JSON.stringify(cacheEntry))
    }
    catch (error) {
      console.error('Error setting cache:', error)
    }
  }

  private clearCachedData(key: string): void {
    try {
      localStorage.removeItem(key)
    }
    catch (error) {
      console.error('Error clearing cache:', error)
    }
  }

  /**
   * Limpia todo el cache de widgets
   */
  clearAllCache(): void {
    try {
      const keys = Object.keys(localStorage)
      for (const key of keys) {
        if (key.startsWith('widget_'))
          localStorage.removeItem(key)
      }
    }
    catch (error) {
      console.error('Error clearing all cache:', error)
    }
  }
}
