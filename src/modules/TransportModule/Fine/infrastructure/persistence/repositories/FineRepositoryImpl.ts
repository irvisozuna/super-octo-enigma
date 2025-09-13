/**
 * Fine Repository Implementation - Infrastructure Layer
 *
 * Implementation of FineRepository using API service
 */

import type { FineEntity } from '../../../domain/entities/FineEntity'
import type { FineRepository } from '../../../domain/repositories/FineRepository'
import type { FineFilterDto, FineStatsDto } from '../../../application/dtos/FineDtos'
import type { FineApiService } from '../../api/services/FineApiService'
import { FineMapper } from '../../../application/mappers/FineMapper'

export class FineRepositoryImpl implements FineRepository {
  constructor(
    private readonly apiService: FineApiService,
  ) {}

  async findAll(filters: FineFilterDto = {}): Promise<FineEntity[]> {
    try {
      const response = await this.apiService.getFines(filters)

      if (response.success && Array.isArray(response.data))
        return response.data.map(item => FineMapper.fromApiResponse(item))

      return []
    }
    catch (error) {
      console.error('Error in FineRepositoryImpl.findAll:', error)
      throw error
    }
  }

  async findById(id: string): Promise<FineEntity | null> {
    try {
      const response = await this.apiService.getFineById(id)

      if (response.success && response.data)
        return FineMapper.fromApiResponse(response.data)

      return null
    }
    catch (error) {
      if (error instanceof Error && error.message.includes('not found'))
        return null

      console.error('Error in FineRepositoryImpl.findById:', error)
      throw error
    }
  }

  async findByFineNumber(fineNumber: string): Promise<FineEntity | null> {
    try {
      const filters: FineFilterDto = {
        search: fineNumber,
        per_page: 1,
      }

      const fines = await this.findAll(filters)
      const fine = fines.find(f => f.fineNumber === fineNumber)

      return fine || null
    }
    catch (error) {
      console.error('Error in FineRepositoryImpl.findByFineNumber:', error)
      throw error
    }
  }

  async create(data: Omit<FineEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<FineEntity> {
    try {
      const requestData = FineMapper.toApiRequest(data)
      const response = await this.apiService.createFine(requestData)

      if (response.success && response.data)
        return FineMapper.fromApiResponse(response.data)

      throw new Error('Failed to create fine')
    }
    catch (error) {
      console.error('Error in FineRepositoryImpl.create:', error)
      throw error
    }
  }

  async update(id: string, data: Partial<FineEntity>): Promise<FineEntity> {
    try {
      const requestData = FineMapper.toApiRequest(data)
      const response = await this.apiService.updateFine(id, requestData)

      if (response.success && response.data)
        return FineMapper.fromApiResponse(response.data)

      throw new Error('Failed to update fine')
    }
    catch (error) {
      console.error('Error in FineRepositoryImpl.update:', error)
      throw error
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const response = await this.apiService.deleteFine(id)

      if (!response.success)
        throw new Error('Failed to delete fine')
    }
    catch (error) {
      console.error('Error in FineRepositoryImpl.delete:', error)
      throw error
    }
  }

  async count(filters: FineFilterDto = {}): Promise<number> {
    try {
      // Get first page to extract total count from meta
      const filtersWithPagination = { ...filters, page: 1, per_page: 1 }
      const response = await this.apiService.getFines(filtersWithPagination)

      return response.meta?.total || 0
    }
    catch (error) {
      console.error('Error in FineRepositoryImpl.count:', error)

      return 0
    }
  }

  async getStats(): Promise<FineStatsDto> {
    try {
      return await this.apiService.getFineStats()
    }
    catch (error) {
      console.error('Error in FineRepositoryImpl.getStats:', error)
      throw error
    }
  }

  async findByVehicle(vehiclePlate: string): Promise<FineEntity[]> {
    try {
      const response = await this.apiService.getFinesByVehicle(vehiclePlate)

      if (response.success && Array.isArray(response.data))
        return response.data.map(item => FineMapper.fromApiResponse(item))

      return []
    }
    catch (error) {
      console.error('Error in FineRepositoryImpl.findByVehicle:', error)
      throw error
    }
  }

  async findByDriver(driverLicense: string): Promise<FineEntity[]> {
    try {
      const response = await this.apiService.getFinesByDriver(driverLicense)

      if (response.success && Array.isArray(response.data))
        return response.data.map(item => FineMapper.fromApiResponse(item))

      return []
    }
    catch (error) {
      console.error('Error in FineRepositoryImpl.findByDriver:', error)
      throw error
    }
  }

  async findByStatus(status: string): Promise<FineEntity[]> {
    try {
      const filters: FineFilterDto = { status }

      return await this.findAll(filters)
    }
    catch (error) {
      console.error('Error in FineRepositoryImpl.findByStatus:', error)
      throw error
    }
  }

  async findOverdue(daysOverdue?: number): Promise<FineEntity[]> {
    try {
      const response = await this.apiService.getOverdueFines(daysOverdue)

      if (response.success && Array.isArray(response.data))
        return response.data.map(item => FineMapper.fromApiResponse(item))

      return []
    }
    catch (error) {
      console.error('Error in FineRepositoryImpl.findOverdue:', error)
      throw error
    }
  }

  async findByDateRange(startDate: string, endDate: string, dateType: 'issue' | 'due' | 'payment' = 'issue'): Promise<FineEntity[]> {
    try {
      const filters: FineFilterDto = {}

      switch (dateType) {
        case 'issue':
          filters.issue_date_from = startDate
          filters.issue_date_to = endDate
          break
        case 'due':
          filters.due_date_from = startDate
          filters.due_date_to = endDate
          break
        case 'payment':
        // This might need to be handled differently based on API implementation
          break
      }

      return await this.findAll(filters)
    }
    catch (error) {
      console.error('Error in FineRepositoryImpl.findByDateRange:', error)
      throw error
    }
  }

  async findByAuthority(authority: string): Promise<FineEntity[]> {
    try {
      const filters: FineFilterDto = { issuing_authority: authority }

      return await this.findAll(filters)
    }
    catch (error) {
      console.error('Error in FineRepositoryImpl.findByAuthority:', error)
      throw error
    }
  }
}
