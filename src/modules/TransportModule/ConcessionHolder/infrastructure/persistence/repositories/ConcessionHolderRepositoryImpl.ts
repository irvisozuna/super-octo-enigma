/**
 * ConcessionHolder Repository Implementation - Infrastructure Layer
 *
 * Implements the domain repository interface using API services
 */

import type { ConcessionHolderRepository } from '../../../domain/repositories/ConcessionHolderRepository'
import type { ConcessionHolderEntity, ConcessionHolderSearchCriteria } from '../../../domain/entities/ConcessionHolderEntity'
import { ConcessionHolderMapper } from '../../../application/mappers/ConcessionHolderMapper'
import { ConcessionHolderApiService } from '../../api/services/ConcessionHolderApiService'
import type { ApiResponse, ConcessionHolderFilter, EntityStatistics, PaginatedResponse } from '../../../../shared/types'

export class ConcessionHolderRepositoryImpl implements ConcessionHolderRepository {
  private apiService: ConcessionHolderApiService

  constructor() {
    this.apiService = new ConcessionHolderApiService()
  }

  async findAll(filter?: ConcessionHolderFilter): Promise<PaginatedResponse<ConcessionHolderEntity>> {
    const response = await this.apiService.getList(filter)

    return {
      data: response.data.map(dto => ConcessionHolderMapper.mapApiResponse(dto)),
      pagination: response.pagination,
      meta: response.meta,
    }
  }

  async findById(id: string, include?: string): Promise<ApiResponse<ConcessionHolderEntity>> {
    const response = await this.apiService.getById(id, include)

    return {
      data: ConcessionHolderMapper.mapApiResponse(response.data),
      meta: response.meta,
    }
  }

  async findByIdentificationNumber(identificationNumber: string): Promise<ApiResponse<ConcessionHolderEntity>> {
    const response = await this.apiService.findByIdentificationNumber(identificationNumber)

    return {
      data: ConcessionHolderMapper.mapApiResponse(response.data),
      meta: response.meta,
    }
  }

  async create(data: any): Promise<ApiResponse<ConcessionHolderEntity>> {
    const response = await this.apiService.create(data)

    return {
      data: ConcessionHolderMapper.mapApiResponse(response.data),
      meta: response.meta,
    }
  }

  async update(id: string, data: any): Promise<ApiResponse<ConcessionHolderEntity>> {
    const response = await this.apiService.update(id, data)

    return {
      data: ConcessionHolderMapper.mapApiResponse(response.data),
      meta: response.meta,
    }
  }

  async delete(id: string): Promise<void> {
    await this.apiService.delete(id)
  }

  async search(criteria: ConcessionHolderSearchCriteria): Promise<PaginatedResponse<ConcessionHolderEntity>> {
    const response = await this.apiService.getList(criteria as any)

    return {
      data: response.data.map(dto => ConcessionHolderMapper.mapApiResponse(dto)),
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

  async isIdentificationNumberAvailable(identificationNumber: string, excludeId?: string): Promise<boolean> {
    return await this.apiService.isIdentificationNumberAvailable(identificationNumber, excludeId)
  }

  async isEmailAvailable(email: string, excludeId?: string): Promise<boolean> {
    return await this.apiService.isEmailAvailable(email, excludeId)
  }

  async findByHolderType(holderType: string): Promise<PaginatedResponse<ConcessionHolderEntity>> {
    const response = await this.apiService.findByHolderType(holderType)

    return {
      data: response.data.map(dto => ConcessionHolderMapper.mapApiResponse(dto)),
      pagination: response.pagination,
      meta: response.meta,
    }
  }

  async findByEmail(email: string): Promise<ApiResponse<ConcessionHolderEntity>> {
    const response = await this.apiService.findByEmail(email)

    return {
      data: ConcessionHolderMapper.mapApiResponse(response.data),
      meta: response.meta,
    }
  }

  async findByPhone(phone: string): Promise<PaginatedResponse<ConcessionHolderEntity>> {
    const response = await this.apiService.findByPhone(phone)

    return {
      data: response.data.map(dto => ConcessionHolderMapper.mapApiResponse(dto)),
      pagination: response.pagination,
      meta: response.meta,
    }
  }

  async export(filter?: ConcessionHolderFilter, format?: 'csv' | 'excel' | 'pdf'): Promise<Blob> {
    return await this.apiService.export(filter as any, format)
  }
}
