/**
 * Driver Domain Entity
 *
 * Core business entity representing a driver in the transport system
 */

import type { BaseEntity, EntityStatus, LicenseType } from '../../../shared/types'

export interface DriverEntity extends BaseEntity {

  // Personal Information
  full_name: string
  document_type: string
  document_number: string
  phone?: string
  email?: string
  address?: string
  emergency_contact?: string
  emergency_phone?: string

  // License Information
  license_number: string
  license_type: LicenseType
  license_expiration_date: string
  license_status?: EntityStatus

  // Relationship IDs
  company_id: string

  // Status
  status: EntityStatus

  // Computed Fields (from API)
  age?: number
  license_days_until_expiration?: number
  license_expired?: boolean

  // Relationships (when included)
  vehicles?: any[]
  vehicles_count?: number
  fines?: any[]
  fines_count?: number
  active_fines_count?: number
}

export interface CreateDriverRequest {
  full_name: string
  document_type: string
  document_number: string
  license_number: string
  license_type: LicenseType
  license_expiration_date: string
  phone?: string
  email?: string
  address?: string
  emergency_contact?: string
  emergency_phone?: string
  status: EntityStatus
}

export interface UpdateDriverRequest extends Partial<CreateDriverRequest> {
  id: string
}

export interface DriverSearchCriteria {
  full_name?: string
  license_number?: string
  license_type?: LicenseType
  license_status?: EntityStatus
  document_number?: string
  status?: EntityStatus
}

/**
 * Driver business rules and validations
 */
export class DriverDomain {
  /**
   * Validate driver data before creation/update
   */
  static validate(data: Partial<CreateDriverRequest>): string[] {
    const errors: string[] = []

    // Required fields validation
    if (!data.full_name?.trim())
      errors.push('El nombre completo es requerido')

    if (!data.document_type?.trim())
      errors.push('El tipo de documento es requerido')

    if (!data.document_number?.trim())
      errors.push('El número de documento es requerido')

    if (!data.license_number?.trim())
      errors.push('El número de licencia es requerido')

    if (!data.license_type)
      errors.push('El tipo de licencia es requerido')

    if (!data.license_expiration_date)
      errors.push('La fecha de expiración de licencia es requerida')

    // Business rules validation
    if (data.full_name && data.full_name.length < 2)
      errors.push('El nombre debe tener al menos 2 caracteres')

    if (data.document_number && data.document_number.length < 5)
      errors.push('El número de documento debe tener al menos 5 caracteres')

    if (data.license_number && data.license_number.length < 5)
      errors.push('El número de licencia debe tener al menos 5 caracteres')

    // Email validation
    if (data.email && !/^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(data.email))
      errors.push('El formato del email no es válido')

    // Phone validation
    if (data.phone && !/^\+?[\d\s()-]{10,15}$/.test(data.phone))
      errors.push('El formato del teléfono no es válido')

    // License expiration validation
    if (data.license_expiration_date) {
      const expirationDate = new Date(data.license_expiration_date)
      const today = new Date()
      if (expirationDate <= today)
        errors.push('La fecha de expiración de licencia debe ser futura')
    }

    return errors
  }

  /**
   * Calculate days until license expiration
   */
  static daysUntilLicenseExpiration(expirationDate?: string): number {
    if (!expirationDate)
      return 0

    const expDate = new Date(expirationDate)
    const now = new Date()
    const diffTime = expDate.getTime() - now.getTime()

    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Check if license is expired
   */
  static isLicenseExpired(expirationDate?: string): boolean {
    if (!expirationDate)
      return false

    const expDate = new Date(expirationDate)
    const now = new Date()

    return expDate <= now
  }

  /**
   * Check if license is expiring soon (within days)
   */
  static isLicenseExpiringSoon(expirationDate?: string, days = 30): boolean {
    const daysUntil = this.daysUntilLicenseExpiration(expirationDate)

    return daysUntil <= days && daysUntil >= 0
  }

  /**
   * Check if driver can be deleted (business rules)
   */
  static canDelete(driver: DriverEntity): { canDelete: boolean; reason?: string } {
    // Cannot delete if has active fines
    if (driver.active_fines_count && driver.active_fines_count > 0) {
      return {
        canDelete: false,
        reason: 'No se puede eliminar un conductor con multas activas',
      }
    }

    // Cannot delete if assigned to vehicles
    if (driver.vehicles_count && driver.vehicles_count > 0) {
      return {
        canDelete: false,
        reason: 'No se puede eliminar un conductor asignado a vehículos',
      }
    }

    return { canDelete: true }
  }

  /**
   * Get license type label
   */
  static getLicenseTypeLabel(licenseType: LicenseType): string {
    const labels = {
      A: 'Tipo A - Motocicletas',
      B: 'Tipo B - Automóviles',
      C: 'Tipo C - Camiones',
      D: 'Tipo D - Transporte Público',
      E: 'Tipo E - Vehículos Especiales',
    }

    return labels[licenseType] || licenseType
  }

  /**
   * Get license status color
   */
  static getLicenseStatusColor(driver: DriverEntity): string {
    if (driver.license_expired)
      return '#DC2626' // Red
    if (driver.license_days_until_expiration && driver.license_days_until_expiration <= 30)
      return '#EAB308' // Yellow

    return '#16A34A' // Green
  }

  /**
   * Format driver display name
   */
  static getDisplayName(driver: DriverEntity): string {
    return `${driver.full_name} (${driver.license_number})`
  }

  /**
   * Check if driver data has changed
   */
  static hasChanges(original: DriverEntity, updated: Partial<DriverEntity>): boolean {
    const fieldsToCompare = [
      'full_name',
      'document_type',
      'document_number',
      'phone',
      'email',
      'address',
      'emergency_contact',
      'emergency_phone',
      'license_number',
      'license_type',
      'license_expiration_date',
      'status',
    ]

    return fieldsToCompare.some(field => {
      const originalValue = original[field as keyof DriverEntity]
      const updatedValue = updated[field as keyof DriverEntity]

      return originalValue !== updatedValue
    })
  }

  /**
   * Validate license compatibility with vehicle type
   */
  static canDriveVehicleType(licenseType: LicenseType, vehicleType: string): boolean {
    const compatibility = {
      A: ['MOTORCYCLE'],
      B: ['TAXI', 'CAR'],
      C: ['TRUCK'],
      D: ['MICROBUS', 'BUS'],
      E: ['MICROBUS', 'BUS', 'TRUCK', 'TAXI'],
    }

    return compatibility[licenseType]?.includes(vehicleType) || false
  }
}
