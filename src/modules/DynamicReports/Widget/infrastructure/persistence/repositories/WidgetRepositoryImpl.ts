import type { WidgetRepository } from '../../../domain/contracts/repositories/WidgetRepository'
import type { Widget } from '../../../domain/entities/Widget'
import { Result } from '../../../../shared/domain/base/Result'
import { WidgetApiService } from '../../api/services/WidgetApiService'
import { WidgetMapper } from '../../../application/mappers/WidgetMapper'

/**
 * Implementación del repositorio de Widgets
 * Se comunica con el backend a través del API Service
 */
export class WidgetRepositoryImpl implements WidgetRepository {
  private apiService: WidgetApiService

  constructor() {
    this.apiService = new WidgetApiService()
  }

  async findById(id: string): Promise<Result<Widget>> {
    try {
      const response = await this.apiService.getById(id)
      const widget = WidgetMapper.toDomain(response)

      if (!widget)
        return Result.fail<Widget>('Widget not found')

      return Result.ok<Widget>(widget)
    }
    catch (error) {
      return Result.fail<Widget>(error.message || 'Failed to fetch widget')
    }
  }

  async findAll(): Promise<Result<Widget[]>> {
    try {
      const response = await this.apiService.getAll()
      const widgets = WidgetMapper.toDomainArray(response.data || [])

      return Result.ok<Widget[]>(widgets)
    }
    catch (error) {
      return Result.fail<Widget[]>(error.message || 'Failed to fetch widgets')
    }
  }

  async findWithFilters(filters: any): Promise<Result<{
    widgets: Widget[]
    total: number
    page: number
    totalPages: number
  }>> {
    try {
      const response = await this.apiService.getList(filters)
      const widgets = WidgetMapper.toDomainArray(response.data || [])

      return Result.ok({
        widgets,
        total: response.pagination.total,
        page: response.pagination.page,
        totalPages: response.pagination.total_pages,
      })
    }
    catch (error) {
      return Result.fail(error.message || 'Failed to fetch widgets with filters')
    }
  }

  async findByDataSource(dataSourceId: string): Promise<Result<Widget[]>> {
    try {
      const response = await this.apiService.getByDataSource(dataSourceId)
      const widgets = WidgetMapper.toDomainArray(response.data || [])

      return Result.ok<Widget[]>(widgets)
    }
    catch (error) {
      return Result.fail<Widget[]>(error.message || 'Failed to fetch widgets by data source')
    }
  }

  async findByType(type: string): Promise<Result<Widget[]>> {
    try {
      const response = await this.apiService.getByType(type)
      const widgets = WidgetMapper.toDomainArray(response.data || [])

      return Result.ok<Widget[]>(widgets)
    }
    catch (error) {
      return Result.fail<Widget[]>(error.message || 'Failed to fetch widgets by type')
    }
  }

  async save(widget: Widget): Promise<Result<Widget>> {
    try {
      const dto = WidgetMapper.toPersistence(widget)
      const response = await this.apiService.create(dto)
      const savedWidget = WidgetMapper.toDomain(response.data)

      if (!savedWidget)
        return Result.fail<Widget>('Failed to create widget')

      return Result.ok<Widget>(savedWidget)
    }
    catch (error) {
      return Result.fail<Widget>(error.message || 'Failed to save widget')
    }
  }

  async update(widget: Widget): Promise<Result<Widget>> {
    try {
      const dto = WidgetMapper.toPersistence(widget)
      const response = await this.apiService.update(widget.id, dto)
      const updatedWidget = WidgetMapper.toDomain(response.data)

      if (!updatedWidget)
        return Result.fail<Widget>('Failed to update widget')

      return Result.ok<Widget>(updatedWidget)
    }
    catch (error) {
      return Result.fail<Widget>(error.message || 'Failed to update widget')
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      await this.apiService.delete(id)

      return Result.ok<void>()
    }
    catch (error) {
      return Result.fail<void>(error.message || 'Failed to delete widget')
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

  async count(): Promise<number> {
    try {
      const result = await this.findAll()
      if (result.isSuccess)
        return result.getValue().length

      return 0
    }
    catch (error) {
      return 0
    }
  }

  async countByDataSource(dataSourceId: string): Promise<number> {
    try {
      const result = await this.findByDataSource(dataSourceId)
      if (result.isSuccess)
        return result.getValue().length

      return 0
    }
    catch (error) {
      return 0
    }
  }
}
