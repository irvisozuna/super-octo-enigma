import type { Dashboard } from '../../entities/Dashboard'
import type { Result } from '../../../../shared/domain/base/Result'

/**
 * Contrato del repositorio de Dashboards
 * Define las operaciones de persistencia para dashboards
 */
export interface DashboardRepository {

  /**
   * Busca un dashboard por su ID
   */
  findById(id: string): Promise<Result<Dashboard>>

  /**
   * Busca un dashboard por su slug
   */
  findBySlug(slug: string): Promise<Result<Dashboard>>

  /**
   * Busca todos los dashboards
   */
  findAll(): Promise<Result<Dashboard[]>>

  /**
   * Busca dashboards con filtros y paginación
   */
  findWithFilters(filters: any): Promise<Result<{
    dashboards: Dashboard[]
    total: number
    page: number
    totalPages: number
  }>>

  /**
   * Busca dashboards favoritos
   */
  findFavorites(): Promise<Result<Dashboard[]>>

  /**
   * Busca dashboards recientes
   */
  findRecent(limit: number): Promise<Result<Dashboard[]>>

  /**
   * Busca dashboards compartidos
   */
  findShared(): Promise<Result<Dashboard[]>>

  /**
   * Busca dashboards públicos
   */
  findPublic(): Promise<Result<Dashboard[]>>

  /**
   * Busca dashboards por categoría
   */
  findByCategory(categoryId: string): Promise<Result<Dashboard[]>>

  /**
   * Guarda un nuevo dashboard
   */
  save(dashboard: Dashboard): Promise<Result<Dashboard>>

  /**
   * Actualiza un dashboard existente
   */
  update(dashboard: Dashboard): Promise<Result<Dashboard>>

  /**
   * Elimina un dashboard
   */
  delete(id: string): Promise<Result<void>>

  /**
   * Verifica si existe un dashboard
   */
  exists(id: string): Promise<boolean>

  /**
   * Verifica si existe un slug
   */
  slugExists(slug: string): Promise<boolean>

  /**
   * Cuenta el número de dashboards
   */
  count(): Promise<number>

  /**
   * Cuenta dashboards por categoría
   */
  countByCategory(categoryId: string): Promise<number>
}
