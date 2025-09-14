/**
 * Concession Repository Interface - Domain Layer
 *
 * Defines the contract for concession data access operations
 */

import type { ConcessionEntity, ConcessionSearchCriteria } from '../entities/ConcessionEntity'
import type { ApiResponse, ConcessionFilter, EntityStatistics, PaginatedResponse } from '../../../shared/types'

export interface ConcessionRepository {

  // Basic CRUD operations
  findAll(filter?: ConcessionFilter): Promise<PaginatedResponse<ConcessionEntity>>
  findById(id: string, include?: string): Promise<ApiResponse<ConcessionEntity>>
  create(data: any): Promise<ApiResponse<ConcessionEntity>>
  update(id: string, data: any): Promise<ApiResponse<ConcessionEntity>>
  delete(id: string): Promise<void>

  // Search and filter operations
  search(criteria: ConcessionSearchCriteria): Promise<PaginatedResponse<ConcessionEntity>>

  // Business-specific operations
  findByConcessionNumber(concessionNumber: string): Promise<ApiResponse<ConcessionEntity>>
  findByHolderId(holderId: string): Promise<PaginatedResponse<ConcessionEntity>>
  findExpiringConcessions(days?: number): Promise<PaginatedResponse<ConcessionEntity>>
  findByServiceArea(serviceArea: string): Promise<PaginatedResponse<ConcessionEntity>>

  // Validation operations
  isConcessionNumberAvailable(concessionNumber: string, excludeId?: string): Promise<boolean>

  // Statistics and reporting
  getStatistics(): Promise<ApiResponse<EntityStatistics>>

  // Export operations
  export(filter?: ConcessionFilter, format?: 'csv' | 'excel' | 'pdf'): Promise<Blob>

  // Configuration operations
  getValidValues(): Promise<ApiResponse<any>>
}
