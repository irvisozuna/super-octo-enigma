/**
 * Vehicle Domain Entity
 *
 * Core business entity representing a vehicle in the transport system
 */

import type { BaseEntity, EntityStatus, VehicleType } from '../../../shared/types'

export interface VehicleEntity extends BaseEntity {

  // Basic Information
  plate_number: string
  vin?: string
  brand: string
  model: string
  year: number
  color?: string
  vehicle_type: VehicleType
  capacity: number
  status: EntityStatus

  // Relationship IDs
  concession_id?: string
  company_id: string

  // Dates
  registration_date?: string
  last_inspection_date?: string
  next_inspection_date?: string

  // Computed Fields (from API)
  age?: number
  days_until_inspection?: number
  inspection_due?: boolean
  insurance_expiring?: boolean

  // Relationships (when included)
  concession?: any
  fines?: any[]
  fines_count?: number
  payments?: any[]
  insurance_policies?: any[]
  documents?: any[]
}

export interface CreateVehicleRequest {
  plate_number: string
  vin?: string
  brand: string
  model: string
  year: number
  color?: string
  vehicle_type: VehicleType
  capacity: number
  concession_id?: string
  registration_date?: string
  last_inspection_date?: string
  next_inspection_date?: string
  status: EntityStatus
}

export interface UpdateVehicleRequest extends Partial<CreateVehicleRequest> {
  id: string
}

export interface VehicleSearchCriteria {
  plate_number?: string
  brand?: string
  model?: string
  vehicle_type?: VehicleType
  year_from?: number
  year_to?: number
  status?: EntityStatus
  concession_id?: string
}

/**
 * Vehicle business rules and validations
 */
export class VehicleDomain {
  /**
   * Validate vehicle data before creation/update
   */
  static validate(data: Partial<CreateVehicleRequest>): string[] {
    const errors: string[] = []

    // Required fields validation
    if (!data.plate_number?.trim())
      errors.push('El número de placa es requerido')

    if (!data.brand?.trim())
      errors.push('La marca es requerida')

    if (!data.model?.trim())
      errors.push('El modelo es requerido')

    if (!data.year)
      errors.push('El año es requerido')

    if (!data.vehicle_type)
      errors.push('El tipo de vehículo es requerido')

    if (!data.capacity || data.capacity < 1)
      errors.push('La capacidad debe ser mayor a 0')

    // Business rules validation
    if (data.plate_number && data.plate_number.length > 10)
      errors.push('El número de placa no puede exceder 10 caracteres')

    if (data.vin && data.vin.length !== 17)
      errors.push('El VIN debe tener exactamente 17 caracteres')

    if (data.year) {
      const currentYear = new Date().getFullYear()
      if (data.year < 1900 || data.year > currentYear + 1)
        errors.push(`El año debe estar entre 1900 y ${currentYear + 1}`)
    }

    if (data.capacity && data.capacity > 100)
      errors.push('La capacidad no puede exceder 100 pasajeros')

    return errors
  }

  /**
   * Calculate vehicle age
   */
  static calculateAge(year: number): number {
    const currentYear = new Date().getFullYear()

    return currentYear - year
  }

  /**
   * Check if vehicle needs inspection
   */
  static needsInspection(lastInspection?: string, nextInspection?: string): boolean {
    if (!nextInspection)
      return false

    const nextDate = new Date(nextInspection)
    const now = new Date()

    return nextDate <= now
  }

  /**
   * Calculate days until next inspection
   */
  static daysUntilInspection(nextInspection?: string): number {
    if (!nextInspection)
      return 0

    const nextDate = new Date(nextInspection)
    const now = new Date()
    const diffTime = nextDate.getTime() - now.getTime()

    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Check if vehicle can be deleted (business rules)
   */
  static canDelete(vehicle: VehicleEntity): { canDelete: boolean; reason?: string } {
    // Cannot delete if has active fines
    if (vehicle.fines_count && vehicle.fines_count > 0) {
      return {
        canDelete: false,
        reason: 'No se puede eliminar un vehículo con multas pendientes',
      }
    }

    // Cannot delete if has active concession
    if (vehicle.concession_id) {
      return {
        canDelete: false,
        reason: 'No se puede eliminar un vehículo asignado a una concesión',
      }
    }

    return { canDelete: true }
  }

  /**
   * Get vehicle status color
   */
  static getStatusColor(status: EntityStatus): string {
    const colors = {
      ACTIVE: '#16A34A',
      INACTIVE: '#6B7280',
      PENDING: '#EAB308',
      SUSPENDED: '#F97316',
      CANCELLED: '#DC2626',
    }

    return colors[status] || colors.INACTIVE
  }

  /**
   * Get vehicle type icon
   */
  static getTypeIcon(type: VehicleType): string {
    const icons = {
      MICROBUS: 'tabler-bus',
      TAXI: 'tabler-car',
      BUS: 'tabler-bus',
      TRUCK: 'tabler-truck',
      MOTORCYCLE: 'tabler-motorbike',
      OTHER: 'tabler-car',
    }

    return icons[type] || icons.OTHER
  }

  /**
   * Format vehicle display name
   */
  static getDisplayName(vehicle: VehicleEntity): string {
    return `${vehicle.brand} ${vehicle.model} (${vehicle.plate_number})`
  }

  /**
   * Check if vehicle data has changed
   */
  static hasChanges(original: VehicleEntity, updated: Partial<VehicleEntity>): boolean {
    const fieldsToCompare = [
      'plate_number',
      'vin',
      'brand',
      'model',
      'year',
      'color',
      'vehicle_type',
      'capacity',
      'status',
      'concession_id',
      'registration_date',
      'last_inspection_date',
      'next_inspection_date',
    ]

    return fieldsToCompare.some(field => {
      const originalValue = original[field as keyof VehicleEntity]
      const updatedValue = updated[field as keyof VehicleEntity]

      return originalValue !== updatedValue
    })
  }
}
