/**
 * Driver Service - Application Layer
 *
 * Orchestrates driver business operations
 */

import type { DriverRepository } from '../../domain/repositories/DriverRepository'
import type {
  CreateDriverRequest,
  DriverEntity,
  DriverSearchCriteria,
  UpdateDriverRequest,
} from '../../domain/entities/DriverEntity'
import type {
  DriverFilter,
  EntityStatistics,
  NotificationOptions,
  PaginatedResponse,
} from '../../../shared/types'
import { DriverDomain } from '../../domain/entities/DriverEntity'

export class DriverService {
  constructor(
    private driverRepository: DriverRepository,
    private notificationService?: (options: NotificationOptions) => void,
  ) {}

  /**
   * Get drivers with filtering and pagination
   */
  async getDrivers(filter?: DriverFilter): Promise<PaginatedResponse<DriverEntity>> {
    try {
      return await this.driverRepository.findAll(filter)
    }
    catch (error) {
      this.handleError('Error al obtener la lista de conductores', error)
      throw error
    }
  }

  /**
   * Get driver by ID with relationships
   */
  async getDriverById(id: string, include?: string): Promise<DriverEntity> {
    try {
      const response = await this.driverRepository.findById(id, include)

      return response.data
    }
    catch (error) {
      this.handleError('Error al obtener el conductor', error)
      throw error
    }
  }

  /**
   * Create new driver with validation
   */
  async createDriver(data: CreateDriverRequest): Promise<DriverEntity> {
    try {
      // Domain validation
      const validationErrors = DriverDomain.validate(data)
      if (validationErrors.length > 0)
        throw new Error(validationErrors.join(', '))

      // Check license number availability
      const isLicenseAvailable = await this.driverRepository.isLicenseNumberAvailable(data.license_number)
      if (!isLicenseAvailable)
        throw new Error('El número de licencia ya está en uso')

      // Check document number availability
      const isDocumentAvailable = await this.driverRepository.isDocumentNumberAvailable(data.document_number)
      if (!isDocumentAvailable)
        throw new Error('El número de documento ya está en uso')

      const response = await this.driverRepository.create(data)

      this.showSuccess('Conductor creado correctamente')

      return response.data
    }
    catch (error) {
      this.handleError('Error al crear el conductor', error)
      throw error
    }
  }

  /**
   * Update driver with validation
   */
  async updateDriver(id: string, data: Partial<UpdateDriverRequest>): Promise<DriverEntity> {
    try {
      // Get current driver for comparison
      const currentDriver = await this.getDriverById(id)

      // Check if there are actual changes
      if (!DriverDomain.hasChanges(currentDriver, data)) {
        this.showInfo('No hay cambios para guardar')

        return currentDriver
      }

      // Domain validation for updated fields
      const validationErrors = DriverDomain.validate(data)
      if (validationErrors.length > 0)
        throw new Error(validationErrors.join(', '))

      // Check license number availability if changed
      if (data.license_number && data.license_number !== currentDriver.license_number) {
        const isAvailable = await this.driverRepository.isLicenseNumberAvailable(data.license_number, id)
        if (!isAvailable)
          throw new Error('El número de licencia ya está en uso')
      }

      // Check document number availability if changed
      if (data.document_number && data.document_number !== currentDriver.document_number) {
        const isAvailable = await this.driverRepository.isDocumentNumberAvailable(data.document_number, id)
        if (!isAvailable)
          throw new Error('El número de documento ya está en uso')
      }

      const response = await this.driverRepository.update(id, data)

      this.showSuccess('Conductor actualizado correctamente')

      return response.data
    }
    catch (error) {
      this.handleError('Error al actualizar el conductor', error)
      throw error
    }
  }

  /**
   * Delete driver with business rules validation
   */
  async deleteDriver(id: string): Promise<void> {
    try {
      // Get driver to check business rules
      const driver = await this.getDriverById(id)

      // Check if can be deleted
      const { canDelete, reason } = DriverDomain.canDelete(driver)
      if (!canDelete)
        throw new Error(reason)

      await this.driverRepository.delete(id)

      this.showSuccess('Conductor eliminado correctamente')
    }
    catch (error) {
      this.handleError('Error al eliminar el conductor', error)
      throw error
    }
  }

  /**
   * Search drivers by license number
   */
  async searchByLicenseNumber(licenseNumber: string): Promise<DriverEntity | null> {
    try {
      const response = await this.driverRepository.findByLicenseNumber(licenseNumber)

      return response.data
    }
    catch (error) {
      // Return null for not found, throw for other errors
      if (error.status === 404)
        return null

      this.handleError('Error al buscar el conductor', error)
      throw error
    }
  }

  /**
   * Advanced search with multiple criteria
   */
  async searchDrivers(criteria: DriverSearchCriteria): Promise<PaginatedResponse<DriverEntity>> {
    try {
      return await this.driverRepository.search(criteria)
    }
    catch (error) {
      this.handleError('Error al buscar conductores', error)
      throw error
    }
  }

  /**
   * Get driver statistics and metrics
   */
  async getStatistics(): Promise<EntityStatistics> {
    try {
      const response = await this.driverRepository.getStatistics()

      return response.data
    }
    catch (error) {
      this.handleError('Error al obtener estadísticas', error)
      throw error
    }
  }

  /**
   * Get drivers with expiring licenses
   */
  async getDriversWithExpiringLicenses(days = 30): Promise<DriverEntity[]> {
    try {
      const response = await this.driverRepository.findWithExpiringLicenses(days)

      return response.data
    }
    catch (error) {
      this.handleError('Error al obtener conductores con licencias por vencer', error)
      throw error
    }
  }

  /**
   * Get drivers by vehicle
   */
  async getDriversByVehicle(vehicleId: string): Promise<DriverEntity[]> {
    try {
      const response = await this.driverRepository.findByVehicleId(vehicleId)

      return response.data
    }
    catch (error) {
      this.handleError('Error al obtener conductores del vehículo', error)
      throw error
    }
  }

  /**
   * Export drivers data
   */
  async exportDrivers(filter?: DriverFilter, format = 'excel'): Promise<Blob> {
    try {
      const blob = await this.driverRepository.export(filter, format as 'csv' | 'excel' | 'pdf')

      this.showSuccess('Exportación completada')

      return blob
    }
    catch (error) {
      this.handleError('Error al exportar datos', error)
      throw error
    }
  }

  /**
   * Validate driver data without saving
   */
  validateDriverData(data: Partial<CreateDriverRequest>): string[] {
    return DriverDomain.validate(data)
  }

  /**
   * Get driver display name
   */
  getDriverDisplayName(driver: DriverEntity): string {
    return DriverDomain.getDisplayName(driver)
  }

  /**
   * Check if license is expired
   */
  isLicenseExpired(driver: DriverEntity): boolean {
    return DriverDomain.isLicenseExpired(driver.license_expiration_date)
  }

  /**
   * Check if license is expiring soon
   */
  isLicenseExpiringSoon(driver: DriverEntity, days = 30): boolean {
    return DriverDomain.isLicenseExpiringSoon(driver.license_expiration_date, days)
  }

  /**
   * Check license compatibility with vehicle type
   */
  canDriveVehicleType(licenseType: string, vehicleType: string): boolean {
    return DriverDomain.canDriveVehicleType(licenseType as any, vehicleType)
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
