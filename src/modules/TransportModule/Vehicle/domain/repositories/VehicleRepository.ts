/**
 * Vehicle Repository Interface
 *
 * Domain contract for vehicle data access operations
 */

import type {
  CreateVehicleRequest,
  UpdateVehicleRequest,
  VehicleEntity,
  VehicleSearchCriteria,
} from '../entities/VehicleEntity'
import type {
  ApiResponse,
  PaginatedResponse,
  VehicleFilter,
  VehicleStatistics,
} from '../../../shared/types'

export interface VehicleRepository {

  /**
   * Get paginated list of vehicles
   */
  findAll(filter?: VehicleFilter): Promise<PaginatedResponse<VehicleEntity>>

  /**
   * Find vehicle by ID
   */
  findById(id: string, include?: string): Promise<ApiResponse<VehicleEntity>>

  /**
   * Search vehicles by plate number
   */
  findByPlateNumber(plateNumber: string): Promise<ApiResponse<VehicleEntity>>

  /**
   * Create new vehicle
   */
  create(data: CreateVehicleRequest): Promise<ApiResponse<VehicleEntity>>

  /**
   * Update existing vehicle
   */
  update(id: string, data: Partial<UpdateVehicleRequest>): Promise<ApiResponse<VehicleEntity>>

  /**
   * Delete vehicle (soft delete)
   */
  delete(id: string): Promise<void>

  /**
   * Search vehicles with criteria
   */
  search(criteria: VehicleSearchCriteria): Promise<PaginatedResponse<VehicleEntity>>

  /**
   * Get vehicle statistics
   */
  getStatistics(): Promise<ApiResponse<VehicleStatistics>>

  /**
   * Check if plate number is available
   */
  isPlateNumberAvailable(plateNumber: string, excludeId?: string): Promise<boolean>

  /**
   * Get vehicles by concession
   */
  findByConcessionId(concessionId: string): Promise<PaginatedResponse<VehicleEntity>>

  /**
   * Get vehicles requiring inspection
   */
  findRequiringInspection(): Promise<PaginatedResponse<VehicleEntity>>

  /**
   * Export vehicles data
   */
  export(filter?: VehicleFilter, format?: 'csv' | 'excel' | 'pdf'): Promise<Blob>
}
