/**
 * Vehicle Repository Implementation - Infrastructure Layer
 *
 * Implements the domain repository interface using API services
 */

import type { VehicleRepository } from '../../../domain/repositories/VehicleRepository'
import type { VehicleEntity, VehicleSearchCriteria } from '../../../domain/entities/VehicleEntity'

import { VehicleMapper } from '../../../application/mappers/VehicleMapper'
import { VehicleApiService } from '../../api/services/VehicleApiService'
import type { ApiResponse, EntityStatistics, PaginatedResponse, VehicleFilter } from '../../../../shared/types'

export class VehicleRepositoryImpl implements VehicleRepository {
  private apiService: VehicleApiService

  constructor() {
    this.apiService = new VehicleApiService()
  }

  async findAll(filter?: VehicleFilter): Promise<PaginatedResponse<VehicleEntity>> {
    const response = await this.apiService.getList(filter)

    return {
      data: response.data.map(dto => VehicleMapper.mapApiResponse(dto)),
      pagination: response.pagination,
      meta: response.meta,
    }
  }

  async findById(id: string, include?: string): Promise<ApiResponse<VehicleEntity>> {
    const response = await this.apiService.getById(id, include)

    return {
      data: VehicleMapper.mapApiResponse(response.data),
      meta: response.meta,
    }
  }

  async findByPlateNumber(plateNumber: string): Promise<ApiResponse<VehicleEntity>> {
    const response = await this.apiService.findByPlateNumber(plateNumber)

    return {
      data: VehicleMapper.mapApiResponse(response.data),
      meta: response.meta,
    }
  }

  async create(data: any): Promise<ApiResponse<VehicleEntity>> {
    const response = await this.apiService.create(data)

    return {
      data: VehicleMapper.mapApiResponse(response.data),
      meta: response.meta,
    }
  }

  async update(id: string, data: any): Promise<ApiResponse<VehicleEntity>> {
    const response = await this.apiService.update(id, data)

    return {
      data: VehicleMapper.mapApiResponse(response.data),
      meta: response.meta,
    }
  }

  async delete(id: string): Promise<void> {
    await this.apiService.delete(id)
  }

  async search(criteria: VehicleSearchCriteria): Promise<PaginatedResponse<VehicleEntity>> {
    const response = await this.apiService.getList(criteria as any)

    return {
      data: response.data.map(dto => VehicleMapper.mapApiResponse(dto)),
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

  async isPlateNumberAvailable(plateNumber: string, excludeId?: string): Promise<boolean> {
    return await this.apiService.isPlateNumberAvailable(plateNumber, excludeId)
  }

  async isVinAvailable(vin: string, excludeId?: string): Promise<boolean> {
    return await this.apiService.isVinAvailable(vin, excludeId)
  }

  async findWithInspectionDue(days?: number): Promise<PaginatedResponse<VehicleEntity>> {
    const response = await this.apiService.findWithInspectionDue(days)

    return {
      data: response.data.map(dto => VehicleMapper.mapApiResponse(dto)),
      pagination: response.pagination,
      meta: response.meta,
    }
  }

  async findByConcessionId(concessionId: string): Promise<PaginatedResponse<VehicleEntity>> {
    const response = await this.apiService.findByConcessionId(concessionId)

    return {
      data: response.data.map(dto => VehicleMapper.mapApiResponse(dto)),
      pagination: response.pagination,
      meta: response.meta,
    }
  }

  async export(filter?: VehicleFilter, format?: 'csv' | 'excel' | 'pdf'): Promise<Blob> {
    return await this.apiService.export(filter as any, format)
  }
}
