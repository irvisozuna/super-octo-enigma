/**
 * Vehicle Service - Application Layer
 *
 * Orchestrates vehicle business operations
 */

import type { VehicleRepository } from '../../domain/repositories/VehicleRepository'
import type {
  CreateVehicleRequest,
  UpdateVehicleRequest,
  VehicleEntity,
  VehicleSearchCriteria,
} from '../../domain/entities/VehicleEntity'
import type {
  NotificationOptions,
  PaginatedResponse,
  VehicleFilter,
  VehicleStatistics,
} from '../../../shared/types'
import { VehicleDomain } from '../../domain/entities/VehicleEntity'

export class VehicleService {
  constructor(
    private vehicleRepository: VehicleRepository,
    private notificationService?: (options: NotificationOptions) => void,
  ) {}

  /**
   * Get vehicles with filtering and pagination
   */
  async getVehicles(filter?: VehicleFilter): Promise<PaginatedResponse<VehicleEntity>> {
    try {
      return await this.vehicleRepository.findAll(filter)
    }
    catch (error) {
      this.handleError('Error al obtener la lista de vehículos', error)
      throw error
    }
  }

  /**
   * Get vehicle by ID with relationships
   */
  async getVehicleById(id: string, include?: string): Promise<VehicleEntity> {
    try {
      const response = await this.vehicleRepository.findById(id, include)

      return response.data
    }
    catch (error) {
      this.handleError('Error al obtener el vehículo', error)
      throw error
    }
  }

  /**
   * Create new vehicle with validation
   */
  async createVehicle(data: CreateVehicleRequest): Promise<VehicleEntity> {
    try {
      // Domain validation
      const validationErrors = VehicleDomain.validate(data)
      if (validationErrors.length > 0)
        throw new Error(validationErrors.join(', '))

      // Check plate number availability
      const isAvailable = await this.vehicleRepository.isPlateNumberAvailable(data.plate_number)
      if (!isAvailable)
        throw new Error('El número de placa ya está en uso')

      const response = await this.vehicleRepository.create(data)

      this.showSuccess('Vehículo creado correctamente')

      return response.data
    }
    catch (error) {
      this.handleError('Error al crear el vehículo', error)
      throw error
    }
  }

  /**
   * Update vehicle with validation
   */
  async updateVehicle(id: string, data: Partial<UpdateVehicleRequest>): Promise<VehicleEntity> {
    try {
      // Get current vehicle for comparison
      const currentVehicle = await this.getVehicleById(id)

      // Check if there are actual changes
      if (!VehicleDomain.hasChanges(currentVehicle, data)) {
        this.showInfo('No hay cambios para guardar')

        return currentVehicle
      }

      // Domain validation for updated fields
      const validationErrors = VehicleDomain.validate(data)
      if (validationErrors.length > 0)
        throw new Error(validationErrors.join(', '))

      // Check plate number availability if changed
      if (data.plate_number && data.plate_number !== currentVehicle.plate_number) {
        const isAvailable = await this.vehicleRepository.isPlateNumberAvailable(data.plate_number, id)
        if (!isAvailable)
          throw new Error('El número de placa ya está en uso')
      }

      const response = await this.vehicleRepository.update(id, data)

      this.showSuccess('Vehículo actualizado correctamente')

      return response.data
    }
    catch (error) {
      this.handleError('Error al actualizar el vehículo', error)
      throw error
    }
  }

  /**
   * Delete vehicle with business rules validation
   */
  async deleteVehicle(id: string): Promise<void> {
    try {
      // Get vehicle to check business rules
      const vehicle = await this.getVehicleById(id)

      // Check if can be deleted
      const { canDelete, reason } = VehicleDomain.canDelete(vehicle)
      if (!canDelete)
        throw new Error(reason)

      await this.vehicleRepository.delete(id)

      this.showSuccess('Vehículo eliminado correctamente')
    }
    catch (error) {
      this.handleError('Error al eliminar el vehículo', error)
      throw error
    }
  }

  /**
   * Search vehicles by plate number
   */
  async searchByPlateNumber(plateNumber: string): Promise<VehicleEntity | null> {
    try {
      const response = await this.vehicleRepository.findByPlateNumber(plateNumber)

      return response.data
    }
    catch (error) {
      // Return null for not found, throw for other errors
      if (error.status === 404)
        return null

      this.handleError('Error al buscar el vehículo', error)
      throw error
    }
  }

  /**
   * Advanced search with multiple criteria
   */
  async searchVehicles(criteria: VehicleSearchCriteria): Promise<PaginatedResponse<VehicleEntity>> {
    try {
      return await this.vehicleRepository.search(criteria)
    }
    catch (error) {
      this.handleError('Error al buscar vehículos', error)
      throw error
    }
  }

  /**
   * Get vehicle statistics and metrics
   */
  async getStatistics(): Promise<VehicleStatistics> {
    try {
      const response = await this.vehicleRepository.getStatistics()

      return response.data
    }
    catch (error) {
      this.handleError('Error al obtener estadísticas', error)
      throw error
    }
  }

  /**
   * Get vehicles by concession
   */
  async getVehiclesByConcession(concessionId: string): Promise<VehicleEntity[]> {
    try {
      const response = await this.vehicleRepository.findByConcessionId(concessionId)

      return response.data
    }
    catch (error) {
      this.handleError('Error al obtener vehículos de la concesión', error)
      throw error
    }
  }

  /**
   * Get vehicles requiring inspection
   */
  async getVehiclesRequiringInspection(): Promise<VehicleEntity[]> {
    try {
      const response = await this.vehicleRepository.findRequiringInspection()

      return response.data
    }
    catch (error) {
      this.handleError('Error al obtener vehículos que requieren inspección', error)
      throw error
    }
  }

  /**
   * Export vehicles data
   */
  async exportVehicles(filter?: VehicleFilter, format = 'excel'): Promise<Blob> {
    try {
      const blob = await this.vehicleRepository.export(filter, format as 'csv' | 'excel' | 'pdf')

      this.showSuccess('Exportación completada')

      return blob
    }
    catch (error) {
      this.handleError('Error al exportar datos', error)
      throw error
    }
  }

  /**
   * Validate vehicle data without saving
   */
  validateVehicleData(data: Partial<CreateVehicleRequest>): string[] {
    return VehicleDomain.validate(data)
  }

  /**
   * Get vehicle display name
   */
  getVehicleDisplayName(vehicle: VehicleEntity): string {
    return VehicleDomain.getDisplayName(vehicle)
  }

  /**
   * Check if vehicle needs inspection
   */
  vehicleNeedsInspection(vehicle: VehicleEntity): boolean {
    return VehicleDomain.needsInspection(
      vehicle.last_inspection_date,
      vehicle.next_inspection_date,
    )
  }

  /**
   * Calculate vehicle age
   */
  calculateVehicleAge(year: number): number {
    return VehicleDomain.calculateAge(year)
  }

  // Private helper methods

  private showSuccess(message: string): void {
    this.notificationService?.({
      type: 'success',
      title: 'Éxito',
      message,
    })
  }

  private showInfo(message: string): void {
    this.notificationService?.({
      type: 'info',
      title: 'Información',
      message,
    })
  }

  private handleError(title: string, error: any): void {
    console.error(title, error)

    let message = 'Ha ocurrido un error inesperado'

    if (error?.response?.data?.message)
      message = error.response.data.message
    else if (error?.message)
      message = error.message

    this.notificationService?.({
      type: 'error',
      title,
      message,
    })
  }
}
