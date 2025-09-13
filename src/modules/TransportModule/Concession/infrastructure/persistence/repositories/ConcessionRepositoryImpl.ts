/**
 * Concession Repository Implementation - Infrastructure Layer
 *
 * Implements the domain repository interface using API services
 */

import type { ConcessionRepository } from '../../../domain/repositories/ConcessionRepository'
import type { ConcessionEntity, ConcessionSearchCriteria } from '../../../domain/entities/ConcessionEntity'
import { ConcessionMapper } from '../../../application/mappers/ConcessionMapper'
import { ConcessionApiService } from '../../api/services/ConcessionApiService'
import type { ApiResponse, ConcessionFilter, EntityStatistics, PaginatedResponse } from '../../../../shared/types'

export class ConcessionRepositoryImpl implements ConcessionRepository {
  private apiService: ConcessionApiService

  constructor() {
    this.apiService = new ConcessionApiService()
  }

  async findAll(filter?: ConcessionFilter): Promise<PaginatedResponse<ConcessionEntity>> {
    const response = await this.apiService.getList(filter)

    return {
      data: response.data.map(dto => ConcessionMapper.mapApiResponse(dto)),
      pagination: response.pagination,
      meta: response.meta,
    }
  }

  async findById(id: string, include?: string): Promise<ApiResponse<ConcessionEntity>> {
    const response = await this.apiService.getById(id, include)

    return {
      data: ConcessionMapper.mapApiResponse(response.data),
      meta: response.meta,
    }
  }

  async findByConcessionNumber(concessionNumber: string): Promise<ApiResponse<ConcessionEntity>> {
    const response = await this.apiService.findByConcessionNumber(concessionNumber)

    return {
      data: ConcessionMapper.mapApiResponse(response.data),
      meta: response.meta,
    }
  }

  async create(data: any): Promise<ApiResponse<ConcessionEntity>> {
    const response = await this.apiService.create(data)

    return {
      data: ConcessionMapper.mapApiResponse(response.data),
      meta: response.meta,
    }
  }

  async update(id: string, data: any): Promise<ApiResponse<ConcessionEntity>> {
    const response = await this.apiService.update(id, data)

    return {
      data: ConcessionMapper.mapApiResponse(response.data),
      meta: response.meta,
    }
  }

  async delete(id: string): Promise<void> {
    await this.apiService.delete(id)
  }

  async search(criteria: ConcessionSearchCriteria): Promise<PaginatedResponse<ConcessionEntity>> {
    const response = await this.apiService.getList(criteria as any)

    return {
      data: response.data.map(dto => ConcessionMapper.mapApiResponse(dto)),
      pagination: response.pagination,
      meta: response.meta,
    }
  }

  async getStatistics(): Promise<ApiResponse<EntityStatistics>> {
    const response = await this.apiService.getStatistics()

    const stats: EntityStatistics = {
      total: response.data.total,
      by_status: response.data.by_status,
      recent_count: response.data.recent_count,
      trends: { daily: [], monthly: [] },
    }

    return { data: stats, meta: response.meta }
  }

  async isConcessionNumberAvailable(concessionNumber: string, excludeId?: string): Promise<boolean> {
    return await this.apiService.isConcessionNumberAvailable(concessionNumber, excludeId)
  }

  async findByHolderId(holderId: string): Promise<PaginatedResponse<ConcessionEntity>> {
    const response = await this.apiService.findByHolderId(holderId)

    return {
      data: response.data.map(dto => ConcessionMapper.mapApiResponse(dto)),
      pagination: response.pagination,
      meta: response.meta,
    }
  }

  async findExpiringConcessions(days?: number): Promise<PaginatedResponse<ConcessionEntity>> {
    const response = await this.apiService.findExpiringConcessions(days)

    return {
      data: response.data.map(dto => ConcessionMapper.mapApiResponse(dto)),
      pagination: response.pagination,
      meta: response.meta,
    }
  }

  async findByServiceArea(serviceArea: string): Promise<PaginatedResponse<ConcessionEntity>> {
    const response = await this.apiService.findByServiceArea(serviceArea)

    return {
      data: response.data.map(dto => ConcessionMapper.mapApiResponse(dto)),
      pagination: response.pagination,
      meta: response.meta,
    }
  }

  async export(filter?: ConcessionFilter, format?: 'csv' | 'excel' | 'pdf'): Promise<Blob> {
    return await this.apiService.export(filter as any, format)
  }
}
