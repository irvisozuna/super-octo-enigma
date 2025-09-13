/**
 * Vehicle Application Service
 *
 * Orchestrates business operations and coordinates between layers
 */

import type { VehicleRepository } from '../../domain/repositories/VehicleRepository'
import type { CreateVehicleRequest, UpdateVehicleRequest, VehicleEntity } from '../../domain/entities/VehicleEntity'
import { VehicleDomain } from '../../domain/entities/VehicleEntity'
import { VehicleMapper } from '../mappers/VehicleMapper'
import type { VehicleFilterDto, VehicleStatsDto, VehicleValidationDto, VehicleValidationResponseDto } from '../dtos/VehicleDtos'
import type { NotificationOptions, PaginatedResponse } from '../../../shared/types'

export class VehicleApplicationService {
  constructor(
    private vehicleRepository: VehicleRepository,
    private notificationService?: (options: NotificationOptions) => void,
  ) {}

  /**
   * Get vehicles with filtering and pagination
   */
  async getVehicles(filter?: VehicleFilterDto): Promise<PaginatedResponse<VehicleEntity>> {
    try {
      const response = await this.vehicleRepository.findAll(filter)

      // Map API response to domain entities
      const vehicles = response.data.map(item => VehicleMapper.mapApiResponse(item))

      return {
        ...response,
        data: vehicles,
      }
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

      return VehicleMapper.mapApiResponse(response.data)
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
      const isPlateAvailable = await this.vehicleRepository.isPlateNumberAvailable(data.plate_number)
      if (!isPlateAvailable)
        throw new Error('El número de placa ya está en uso')

      // Check VIN availability if provided
      if (data.vin) {
        const isVinAvailable = await this.vehicleRepository.isVinAvailable(data.vin)
        if (!isVinAvailable)
          throw new Error('El número VIN ya está en uso')
      }

      const createDto = VehicleMapper.createRequestToDto(data)
      const response = await this.vehicleRepository.create(createDto)

      this.showSuccess('Vehículo creado correctamente')

      return VehicleMapper.mapApiResponse(response.data)
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

      // Check VIN availability if changed
      if (data.vin && data.vin !== currentVehicle.vin) {
        const isAvailable = await this.vehicleRepository.isVinAvailable(data.vin, id)
        if (!isAvailable)
          throw new Error('El número VIN ya está en uso')
      }

      const updateDto = VehicleMapper.updateRequestToDto({ ...data, id })
      const response = await this.vehicleRepository.update(id, updateDto)

      this.showSuccess('Vehículo actualizado correctamente')

      return VehicleMapper.mapApiResponse(response.data)
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

      return response.data ? VehicleMapper.mapApiResponse(response.data) : null
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
   * Get vehicle statistics and metrics
   */
  async getStatistics(): Promise<VehicleStatsDto> {
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
   * Get vehicles with inspection due
   */
  async getVehiclesWithInspectionDue(days = 30): Promise<VehicleEntity[]> {
    try {
      const response = await this.vehicleRepository.findWithInspectionDue(days)

      return response.data.map(item => VehicleMapper.mapApiResponse(item))
    }
    catch (error) {
      this.handleError('Error al obtener vehículos con inspección por vencer', error)
      throw error
    }
  }

  /**
   * Get vehicles by concession
   */
  async getVehiclesByConcession(concessionId: string): Promise<VehicleEntity[]> {
    try {
      const response = await this.vehicleRepository.findByConcessionId(concessionId)

      return response.data.map(item => VehicleMapper.mapApiResponse(item))
    }
    catch (error) {
      this.handleError('Error al obtener vehículos de la concesión', error)
      throw error
    }
  }

  /**
   * Export vehicles data
   */
  async exportVehicles(filter?: VehicleFilterDto, format = 'excel'): Promise<Blob> {
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
   * Validate plate number and VIN availability
   */
  async validateAvailability(data: VehicleValidationDto): Promise<VehicleValidationResponseDto> {
    try {
      const errors: any = {}
      let hasErrors = false

      // Check plate number
      const isPlateAvailable = await this.vehicleRepository.isPlateNumberAvailable(
        data.plate_number,
        data.exclude_id,
      )

      if (!isPlateAvailable) {
        errors.plate_number = ['El número de placa ya está en uso']
        hasErrors = true
      }

      // Check VIN if provided
      if (data.vin) {
        const isVinAvailable = await this.vehicleRepository.isVinAvailable(
          data.vin,
          data.exclude_id,
        )

        if (!isVinAvailable) {
          errors.vin = ['El número VIN ya está en uso']
          hasErrors = true
        }
      }

      return {
        is_valid: !hasErrors,
        errors,
      }
    }
    catch (error) {
      return {
        is_valid: false,
        errors: {
          general: ['Error al validar disponibilidad'],
        },
      }
    }
  }

  /**
   * Get vehicle display name
   */
  getVehicleDisplayName(vehicle: VehicleEntity): string {
    return VehicleDomain.getDisplayName(vehicle)
  }

  /**
   * Check if inspection is due
   */
  isInspectionDue(vehicle: VehicleEntity, days = 30): boolean {
    return VehicleDomain.isInspectionDue(vehicle.next_inspection_date, days)
  }

  /**
   * Calculate vehicle age
   */
  calculateVehicleAge(vehicle: VehicleEntity): number {
    return VehicleDomain.calculateAge(vehicle.year)
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
