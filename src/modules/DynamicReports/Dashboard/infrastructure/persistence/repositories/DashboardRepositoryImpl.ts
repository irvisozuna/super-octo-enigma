import type { DashboardRepository } from '../../../domain/contracts/repositories/DashboardRepository'
import type { Dashboard } from '../../../domain/entities/Dashboard'
import { Result } from '../../../../shared/domain/base/Result'
import { DashboardApiService } from '../../api/services/DashboardApiService'
import { DashboardMapper } from '../../../application/mappers/DashboardMapper'

/**
 * Implementación del repositorio de Dashboards
 * Se comunica con el backend a través del API Service
 */
export class DashboardRepositoryImpl implements DashboardRepository {
  private apiService: DashboardApiService

  constructor() {
    this.apiService = new DashboardApiService()
  }

  async findById(id: string): Promise<Result<Dashboard>> {
    try {
      const response = await this.apiService.getById(id)
      const dashboard = DashboardMapper.toDomain(response)

      if (!dashboard) {
        return Result.fail<Dashboard>('Dashboard not found')
      }

      return Result.ok<Dashboard>(dashboard)
    }
    catch (error) {
      return Result.fail<Dashboard>(error.message || 'Failed to fetch dashboard')
    }
  }

  async findBySlug(slug: string): Promise<Result<Dashboard>> {
    try {
      const response = await this.apiService.getBySlug(slug)
      const dashboard = DashboardMapper.toDomain(response)

      if (!dashboard) {
        return Result.fail<Dashboard>('Dashboard not found')
      }

      return Result.ok<Dashboard>(dashboard)
    }
    catch (error) {
      return Result.fail<Dashboard>(error.message || 'Failed to fetch dashboard by slug')
    }
  }

  async findAll(): Promise<Result<Dashboard[]>> {
    try {
      const response = await this.apiService.getAll()
      const dashboards = DashboardMapper.toDomainArray(response.data || [])

      return Result.ok<Dashboard[]>(dashboards)
    }
    catch (error) {
      return Result.fail<Dashboard[]>(error.message || 'Failed to fetch dashboards')
    }
  }

  async findWithFilters(filters: any): Promise<Result<{
    dashboards: Dashboard[]
    total: number
    page: number
    totalPages: number
  }>> {
    try {
      const response = await this.apiService.getList(filters)
      const dashboards = DashboardMapper.toDomainArray(response.data || [])

      return Result.ok({
        dashboards,
        total: response.pagination.total,
        page: response.pagination.page,
        totalPages: response.pagination.total_pages,
      })
    }
    catch (error) {
      return Result.fail(error.message || 'Failed to fetch dashboards with filters')
    }
  }

  async findFavorites(): Promise<Result<Dashboard[]>> {
    try {
      const response = await this.apiService.getFavorites()
      const dashboards = DashboardMapper.toDomainArray(response.data || [])

      return Result.ok<Dashboard[]>(dashboards)
    }
    catch (error) {
      return Result.fail<Dashboard[]>(error.message || 'Failed to fetch favorite dashboards')
    }
  }

  async findRecent(limit: number): Promise<Result<Dashboard[]>> {
    try {
      const response = await this.apiService.getRecent(limit)
      const dashboards = DashboardMapper.toDomainArray(response.data || [])

      return Result.ok<Dashboard[]>(dashboards)
    }
    catch (error) {
      return Result.fail<Dashboard[]>(error.message || 'Failed to fetch recent dashboards')
    }
  }

  async findShared(): Promise<Result<Dashboard[]>> {
    try {
      const response = await this.apiService.getShared()
      const dashboards = DashboardMapper.toDomainArray(response.data || [])

      return Result.ok<Dashboard[]>(dashboards)
    }
    catch (error) {
      return Result.fail<Dashboard[]>(error.message || 'Failed to fetch shared dashboards')
    }
  }

  async findPublic(): Promise<Result<Dashboard[]>> {
    try {
      const response = await this.apiService.getPublic()
      const dashboards = DashboardMapper.toDomainArray(response.data || [])

      return Result.ok<Dashboard[]>(dashboards)
    }
    catch (error) {
      return Result.fail<Dashboard[]>(error.message || 'Failed to fetch public dashboards')
    }
  }

  async findByCategory(categoryId: string): Promise<Result<Dashboard[]>> {
    try {
      const response = await this.apiService.getByCategory(categoryId)
      const dashboards = DashboardMapper.toDomainArray(response.data || [])

      return Result.ok<Dashboard[]>(dashboards)
    }
    catch (error) {
      return Result.fail<Dashboard[]>(error.message || 'Failed to fetch dashboards by category')
    }
  }

  async save(dashboard: Dashboard): Promise<Result<Dashboard>> {
    try {
      const dto = DashboardMapper.toPersistence(dashboard)
      const response = await this.apiService.create(dto)
      const savedDashboard = DashboardMapper.toDomain(response.data)

      if (!savedDashboard) {
        return Result.fail<Dashboard>('Failed to create dashboard')
      }

      return Result.ok<Dashboard>(savedDashboard)
    }
    catch (error) {
      return Result.fail<Dashboard>(error.message || 'Failed to save dashboard')
    }
  }

  async update(dashboard: Dashboard): Promise<Result<Dashboard>> {
    try {
      const dto = DashboardMapper.toPersistence(dashboard)
      const response = await this.apiService.update(dashboard.id, dto)
      const updatedDashboard = DashboardMapper.toDomain(response.data)

      if (!updatedDashboard) {
        return Result.fail<Dashboard>('Failed to update dashboard')
      }

      return Result.ok<Dashboard>(updatedDashboard)
    }
    catch (error) {
      return Result.fail<Dashboard>(error.message || 'Failed to update dashboard')
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      await this.apiService.delete(id)
      return Result.ok<void>()
    }
    catch (error) {
      return Result.fail<void>(error.message || 'Failed to delete dashboard')
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const result = await this.findById(id)
      return result.isSuccess
    }
    catch (error) {
      return false
    }
  }

  async slugExists(slug: string): Promise<boolean> {
    try {
      const result = await this.findBySlug(slug)
      return result.isSuccess
    }
    catch (error) {
      return false
    }
  }

  async count(): Promise<number> {
    try {
      const result = await this.findAll()
      if (result.isSuccess) {
        return result.getValue().length
      }
      return 0
    }
    catch (error) {
      return 0
    }
  }

  async countByCategory(categoryId: string): Promise<number> {
    try {
      const result = await this.findByCategory(categoryId)
      if (result.isSuccess) {
        return result.getValue().length
      }
      return 0
    }
    catch (error) {
      return 0
    }
  }
}
