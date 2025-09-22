/**
 * Fine Application Service - Application Layer
 *
 * Orchestrates business logic for fine operations
 */

import type { FineEntity } from '../../domain/entities/FineEntity'
import type { FineRepository } from '../../domain/repositories/FineRepository'
import type {
  FineBulkOperationDto,
  FineContestDto,
  FineCreateDto,
  FineFilterDto,
  FinePaymentDto,
  FineStatsDto,
  FineUpdateDto,
} from '../dtos/FineDtos'
import { FineMapper } from '../mappers/FineMapper'

export class FineApplicationService {
  constructor(
    private readonly fineRepository: FineRepository,
  ) {}

  async getFines(filters: FineFilterDto) {
    try {
      // Llamar directamente al API service para evitar transformaciones innecesarias
      const response = await (this.fineRepository as any).apiService.getFines(filters)

      console.log('🔍 FineApplicationService raw response:', response)

      // La respuesta del API ya tiene la estructura correcta
      if (response && response.data && Array.isArray(response.data)) {
        return {
          success: true,
          data: response.data, // Usar directamente los datos del API
          meta: response.meta || {
            total: response.data.length,
            page: filters.page || 1,
            per_page: filters.per_page || 20,
          },
        }
      }

      // Fallback si la estructura es diferente
      return {
        success: true,
        data: Array.isArray(response) ? response : [],
        meta: {
          total: Array.isArray(response) ? response.length : 0,
          page: filters.page || 1,
          per_page: filters.per_page || 20,
        },
      }
    }
    catch (error) {
      console.error('Error fetching fines:', error)
      throw new Error('Failed to fetch fines')
    }
  }

  async getFineById(id: string) {
    try {
      const fine = await this.fineRepository.findById(id)
      if (!fine)
        throw new Error('Fine not found')

      return {
        success: true,
        data: FineMapper.toDetailDto(fine),
      }
    }
    catch (error) {
      console.error('Error fetching fine:', error)
      throw error
    }
  }

  async createFine(dto: FineCreateDto) {
    try {
      // Validate amount
      if (dto.amount <= 0)
        throw new Error('Fine amount must be greater than zero')

      // Validate dates
      if (new Date(dto.due_date) <= new Date(dto.issue_date))
        throw new Error('Due date must be after issue date')

      const fineData = FineMapper.fromCreateDto(dto)
      const fine = await this.fineRepository.create(fineData)

      return {
        success: true,
        data: FineMapper.toDetailDto(fine),
        message: 'Fine created successfully',
      }
    }
    catch (error) {
      console.error('Error creating fine:', error)
      throw error
    }
  }

  async updateFine(id: string, dto: FineUpdateDto) {
    try {
      const existingFine = await this.fineRepository.findById(id)
      if (!existingFine)
        throw new Error('Fine not found')

      // Validate amount if provided
      if (dto.amount !== undefined && dto.amount <= 0)
        throw new Error('Fine amount must be greater than zero')

      // Validate dates if provided
      if (dto.due_date) {
        const issueDate = existingFine.issueDate
        if (new Date(dto.due_date) <= new Date(issueDate))
          throw new Error('Due date must be after issue date')
      }

      // Validate status transitions
      if (dto.status && !this.isValidStatusTransition(existingFine.status, dto.status))
        throw new Error(`Invalid status transition from ${existingFine.status} to ${dto.status}`)

      const updateData = FineMapper.fromUpdateDto(dto)
      const fine = await this.fineRepository.update(id, updateData)

      return {
        success: true,
        data: FineMapper.toDetailDto(fine),
        message: 'Fine updated successfully',
      }
    }
    catch (error) {
      console.error('Error updating fine:', error)
      throw error
    }
  }

  async deleteFine(id: string) {
    try {
      const existingFine = await this.fineRepository.findById(id)
      if (!existingFine)
        throw new Error('Fine not found')

      // Only allow deletion of pending or cancelled fines
      if (!['PENDING', 'CANCELLED'].includes(existingFine.status))
        throw new Error('Cannot delete a fine that has been paid or is overdue')

      await this.fineRepository.delete(id)

      return {
        success: true,
        message: 'Fine deleted successfully',
      }
    }
    catch (error) {
      console.error('Error deleting fine:', error)
      throw error
    }
  }

  async payFine(dto: FinePaymentDto) {
    try {
      const fine = await this.fineRepository.findById(dto.fine_id)
      if (!fine)
        throw new Error('Fine not found')

      if (fine.status === 'PAID')
        throw new Error('Fine has already been paid')

      if (fine.status === 'CANCELLED')
        throw new Error('Cannot pay a cancelled fine')

      if (dto.payment_amount < fine.amount)
        throw new Error('Payment amount is less than the fine amount')

      const updateData: Partial<FineEntity> = {
        status: 'PAID',
        paymentDate: dto.payment_date,
        paymentMethod: dto.payment_method,
        paymentReference: dto.payment_reference,
      }

      if (dto.notes)
        updateData.notes = dto.notes

      const updatedFine = await this.fineRepository.update(dto.fine_id, updateData)

      return {
        success: true,
        data: FineMapper.toDetailDto(updatedFine),
        message: 'Fine payment recorded successfully',
      }
    }
    catch (error) {
      console.error('Error processing fine payment:', error)
      throw error
    }
  }

  async contestFine(dto: FineContestDto) {
    try {
      const fine = await this.fineRepository.findById(dto.fine_id)
      if (!fine)
        throw new Error('Fine not found')

      if (fine.status === 'PAID')
        throw new Error('Cannot contest a paid fine')

      if (fine.status === 'CANCELLED')
        throw new Error('Cannot contest a cancelled fine')

      if (fine.status === 'CONTESTED')
        throw new Error('Fine is already being contested')

      const updateData: Partial<FineEntity> = {
        status: 'CONTESTED',
        contestReason: dto.contest_reason,
        contestDate: new Date().toISOString(),
        contestStatus: 'PENDING',
      }

      if (dto.notes)
        updateData.notes = dto.notes

      const updatedFine = await this.fineRepository.update(dto.fine_id, updateData)

      return {
        success: true,
        data: FineMapper.toDetailDto(updatedFine),
        message: 'Fine contest submitted successfully',
      }
    }
    catch (error) {
      console.error('Error contesting fine:', error)
      throw error
    }
  }

  async getFineStats(): Promise<FineStatsDto> {
    try {
      return await this.fineRepository.getStats()
    }
    catch (error) {
      console.error('Error fetching fine stats:', error)
      throw new Error('Failed to fetch fine statistics')
    }
  }

  async getOverdueFines(daysOverdue: number = 0) {
    try {
      const filters: FineFilterDto = {
        status: 'OVERDUE',
      }

      const fines = await this.fineRepository.findAll(filters)

      if (daysOverdue > 0) {
        const cutoffDate = new Date()

        cutoffDate.setDate(cutoffDate.getDate() - daysOverdue)

        return fines.filter(fine =>
          new Date(fine.dueDate) < cutoffDate,
        ).map(fine => FineMapper.toListDto(fine))
      }

      return fines.map(fine => FineMapper.toListDto(fine))
    }
    catch (error) {
      console.error('Error fetching overdue fines:', error)
      throw new Error('Failed to fetch overdue fines')
    }
  }

  async bulkOperation(dto: FineBulkOperationDto) {
    try {
      const results = await Promise.allSettled(
        dto.ids.map(async id => {
          switch (dto.operation) {
            case 'delete':
              return this.deleteFine(id)
            case 'mark_paid':
              if (!dto.payment_details)
              throw new Error('Payment details required for mark_paid operation')

              return this.payFine({
                fine_id: id,
                payment_amount: 0, // Will be validated against actual amount
                payment_method: dto.payment_details.payment_method,
                payment_reference: dto.payment_details.payment_reference,
                payment_date: dto.payment_details.payment_date,
            })
            case 'cancel':
              return this.updateFine(id, { status: 'CANCELLED' })
            default:
              throw new Error(`Unsupported operation: ${dto.operation}`)
          }
        }),
      )

      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length

      return {
        success: true,
        message: `Bulk operation completed. ${successful} successful, ${failed} failed.`,
        data: { successful, failed },
      }
    }
    catch (error) {
      console.error('Error in bulk operation:', error)
      throw error
    }
  }

  private isValidStatusTransition(from: string, to: string): boolean {
    const validTransitions: Record<string, string[]> = {
      PENDING: ['PAID', 'OVERDUE', 'CANCELLED', 'CONTESTED'],
      OVERDUE: ['PAID', 'CANCELLED', 'CONTESTED'],
      CONTESTED: ['PAID', 'CANCELLED', 'PENDING'],
      PAID: [], // No transitions from paid
      CANCELLED: [], // No transitions from cancelled
    }

    return validTransitions[from]?.includes(to) || false
  }
}
