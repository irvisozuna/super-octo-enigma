import type { Widget } from '../../entities/Widget'
import type { Result } from '../../../../shared/domain/base/Result'

/**
 * Contrato del repositorio de Widgets
 * Define las operaciones de persistencia para widgets
 */
export interface WidgetRepository {

  /**
   * Busca un widget por su ID
   */
  findById(id: string): Promise<Result<Widget>>

  /**
   * Busca todos los widgets
   */
  findAll(): Promise<Result<Widget[]>>

  /**
   * Busca widgets con filtros y paginación
   */
  findWithFilters(filters: any): Promise<Result<{
    widgets: Widget[]
    total: number
    page: number
    totalPages: number
  }>>

  /**
   * Busca widgets por data source
   */
  findByDataSource(dataSourceId: string): Promise<Result<Widget[]>>

  /**
   * Busca widgets por tipo
   */
  findByType(type: string): Promise<Result<Widget[]>>

  /**
   * Guarda un nuevo widget
   */
  save(widget: Widget): Promise<Result<Widget>>

  /**
   * Actualiza un widget existente
   */
  update(widget: Widget): Promise<Result<Widget>>

  /**
   * Elimina un widget
   */
  delete(id: string): Promise<Result<void>>

  /**
   * Verifica si existe un widget
   */
  exists(id: string): Promise<boolean>

  /**
   * Cuenta el número de widgets
   */
  count(): Promise<number>

  /**
   * Cuenta widgets por data source
   */
  countByDataSource(dataSourceId: string): Promise<number>
}
