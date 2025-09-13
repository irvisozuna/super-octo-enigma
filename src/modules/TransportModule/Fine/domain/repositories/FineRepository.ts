/**
 * Fine Repository Interface - Domain Layer
 *
 * Defines the contract for fine data access operations
 */

import type { FineEntity, FineSearchCriteria } from '../entities/FineEntity'
import type { ApiResponse, EntityStatistics, FineFilter, PaginatedResponse } from '../../../shared/types'

export interface FineRepository {

  // Basic CRUD operations
  findAll(filter?: FineFilter): Promise<PaginatedResponse<FineEntity>>
  findById(id: string, include?: string): Promise<ApiResponse<FineEntity>>
  create(data: any): Promise<ApiResponse<FineEntity>>
  update(id: string, data: any): Promise<ApiResponse<FineEntity>>
  delete(id: string): Promise<void>

  // Search and filter operations
  search(criteria: FineSearchCriteria): Promise<PaginatedResponse<FineEntity>>

  // Business-specific operations
  findByFineNumber(fineNumber: string): Promise<ApiResponse<FineEntity>>
  findByVehiclePlate(vehiclePlate: string): Promise<PaginatedResponse<FineEntity>>
  findByDriverLicense(driverLicense: string): Promise<PaginatedResponse<FineEntity>>
  findByViolationType(violationType: string): Promise<PaginatedResponse<FineEntity>>
  findByStatus(status: string): Promise<PaginatedResponse<FineEntity>>
  findOverdueFines(days?: number): Promise<PaginatedResponse<FineEntity>>

  // Payment operations
  processFinePayment(id: string, paymentData: any): Promise<ApiResponse<FineEntity>>
  getFinePaymentHistory(id: string): Promise<ApiResponse<any[]>>

  // Validation operations
  isFineNumberAvailable(fineNumber: string, excludeId?: string): Promise<boolean>

  // Statistics and reporting
  getStatistics(): Promise<ApiResponse<EntityStatistics>>

  // Export operations
  export(filter?: FineFilter, format?: 'csv' | 'excel' | 'pdf'): Promise<Blob>
}
