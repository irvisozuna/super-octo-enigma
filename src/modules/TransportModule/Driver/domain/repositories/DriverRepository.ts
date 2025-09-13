/**
 * Driver Repository Interface
 *
 * Domain contract for driver data access operations
 */

import type {
  CreateDriverRequest,
  DriverEntity,
  DriverSearchCriteria,
  UpdateDriverRequest,
} from '../entities/DriverEntity'
import type {
  ApiResponse,
  DriverFilter,
  EntityStatistics,
  PaginatedResponse,
} from '../../../shared/types'

export interface DriverRepository {

  /**
   * Get paginated list of drivers
   */
  findAll(filter?: DriverFilter): Promise<PaginatedResponse<DriverEntity>>

  /**
   * Find driver by ID
   */
  findById(id: string, include?: string): Promise<ApiResponse<DriverEntity>>

  /**
   * Search drivers by license number
   */
  findByLicenseNumber(licenseNumber: string): Promise<ApiResponse<DriverEntity>>

  /**
   * Create new driver
   */
  create(data: CreateDriverRequest): Promise<ApiResponse<DriverEntity>>

  /**
   * Update existing driver
   */
  update(id: string, data: Partial<UpdateDriverRequest>): Promise<ApiResponse<DriverEntity>>

  /**
   * Delete driver (soft delete)
   */
  delete(id: string): Promise<void>

  /**
   * Search drivers with criteria
   */
  search(criteria: DriverSearchCriteria): Promise<PaginatedResponse<DriverEntity>>

  /**
   * Get driver statistics
   */
  getStatistics(): Promise<ApiResponse<EntityStatistics>>

  /**
   * Check if license number is available
   */
  isLicenseNumberAvailable(licenseNumber: string, excludeId?: string): Promise<boolean>

  /**
   * Check if document number is available
   */
  isDocumentNumberAvailable(documentNumber: string, excludeId?: string): Promise<boolean>

  /**
   * Get drivers with expiring licenses
   */
  findWithExpiringLicenses(days?: number): Promise<PaginatedResponse<DriverEntity>>

  /**
   * Get drivers by vehicle ID
   */
  findByVehicleId(vehicleId: string): Promise<PaginatedResponse<DriverEntity>>

  /**
   * Export drivers data
   */
  export(filter?: DriverFilter, format?: 'csv' | 'excel' | 'pdf'): Promise<Blob>
}
