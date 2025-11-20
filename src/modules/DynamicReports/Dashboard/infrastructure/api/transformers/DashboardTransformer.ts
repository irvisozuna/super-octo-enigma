import { DashboardMapper } from '../../../application/mappers/DashboardMapper'
import type { Dashboard } from '../../../domain/entities/Dashboard'

/**
 * Transformer para convertir datos entre API y dominio
 * Wrapper alrededor del DashboardMapper para mantener separación de capas
 */
export class DashboardTransformer {
  /**
   * Transforma datos del API a entidad de dominio
   */
  static fromApi(apiData: any): Dashboard | null {
    return DashboardMapper.toDomain(apiData)
  }

  /**
   * Transforma entidad de dominio a formato del API
   */
  static toApi(dashboard: Dashboard): any {
    return DashboardMapper.toPersistence(dashboard)
  }

  /**
   * Transforma múltiples datos del API a entidades
   */
  static manyFromApi(apiDataArray: any[]): Dashboard[] {
    return DashboardMapper.toDomainArray(apiDataArray)
  }

  /**
   * Normaliza respuesta del API
   */
  static normalizeApiResponse(response: any): any {
    // Aquí se pueden hacer transformaciones adicionales si el backend
    // tiene un formato diferente al esperado
    return response
  }

  /**
   * Prepara datos para enviar al API
   */
  static prepareForApi(data: any): any {
    // Aquí se pueden hacer transformaciones adicionales antes de enviar
    // Por ejemplo, convertir fechas, limpiar campos null, etc.
    const prepared = { ...data }

    // Remover campos undefined
    Object.keys(prepared).forEach((key) => {
      if (prepared[key] === undefined) {
        delete prepared[key]
      }
    })

    // Asegurar que widgets sea un array
    if (prepared.widgets && !Array.isArray(prepared.widgets)) {
      prepared.widgets = []
    }

    return prepared
  }

  /**
   * Transforma widgets del dashboard para el API
   */
  static prepareWidgetsForApi(widgets: any[]): any[] {
    return widgets.map((widget) => {
      return {
        id: widget.id,
        widget_id: widget.widget_id,
        position: widget.position,
        config: widget.config || {},
        filters: widget.filters || [],
        title: widget.title,
        description: widget.description,
      }
    })
  }
}
