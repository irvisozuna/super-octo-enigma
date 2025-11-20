import { WidgetMapper } from '../../../application/mappers/WidgetMapper'
import type { Widget } from '../../../domain/entities/Widget'

/**
 * Transformer para convertir datos entre API y dominio
 * Wrapper alrededor del WidgetMapper para mantener separación de capas
 */
export class WidgetTransformer {
  /**
   * Transforma datos del API a entidad de dominio
   */
  static fromApi(apiData: any): Widget | null {
    return WidgetMapper.toDomain(apiData)
  }

  /**
   * Transforma entidad de dominio a formato del API
   */
  static toApi(widget: Widget): any {
    return WidgetMapper.toPersistence(widget)
  }

  /**
   * Transforma múltiples datos del API a entidades
   */
  static manyFromApi(apiDataArray: any[]): Widget[] {
    return WidgetMapper.toDomainArray(apiDataArray)
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

    return prepared
  }
}
