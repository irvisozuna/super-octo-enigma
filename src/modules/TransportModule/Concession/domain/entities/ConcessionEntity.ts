/**
 * Concession Domain Entity
 *
 * Core business entity representing a concession in the transport system
 */

import type { BaseEntity, ConcessionType, EntityStatus } from '../../../shared/types'

export interface ConcessionEntity extends BaseEntity {
  // Required fields
  number: string
  modality: 'URBAN' | 'SUBURBAN' | 'RURAL' | 'TOURIST' | 'SCHOLAR' | 'WORKER' | 'TAXI' | 'INTERCITY' | 'CHARTER' | 'SHUTTLE'
  municipality: string
  validFrom: string
  validTo: string
  holderId: string

  // Optional fields
  status?: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED' | 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'
  routeOrSite?: string
  authorizedServices?: string[]
  restrictions?: string[]
  metadata?: Record<string, any>

  // Computed/relationship fields
  holderName?: string
  companyId?: string

  // Computed Fields (from API)
  daysUntilExpiration?: number
  isExpired?: boolean
  isExpiringSoon?: boolean
  days_since_issue?: number
  renewal_status?: string

  // Relationships (when included)
  holder?: any
  vehicles?: any[]
  vehicles_count?: number
  active_vehicles_count?: number
  transfers?: any[]
  transfers_count?: number
}

export interface CreateConcessionRequest {
  concession_number: string
  type: ConcessionType
  holder_id: string
  description?: string
  issue_date: string
  expiration_date: string
  route_origin?: string
  route_destination?: string
  route_description?: string
  authorized_capacity?: number
  annual_fee?: number
  legal_document?: string
  observations?: string
  status: EntityStatus
}

export interface UpdateConcessionRequest extends Partial<CreateConcessionRequest> {
  id: string
}

export interface ConcessionSearchCriteria {
  concession_number?: string
  type?: ConcessionType
  holder_id?: string
  status?: EntityStatus
  route_origin?: string
  route_destination?: string
  issue_date_from?: string
  issue_date_to?: string
  expiration_date_from?: string
  expiration_date_to?: string
  is_expired?: boolean
  is_expiring_soon?: boolean
}

/**
 * Concession business rules and validations
 */
export class ConcessionDomain {
  /**
   * Validate concession data before creation/update
   */
  static validate(data: Partial<CreateConcessionRequest>): string[] {
    const errors: string[] = []

    // Required fields validation
    if (!data.concession_number?.trim())
      errors.push('El número de concesión es requerido')

    if (!data.type)
      errors.push('El tipo de concesión es requerido')

    if (!data.holder_id?.trim())
      errors.push('El titular es requerido')

    if (!data.issue_date)
      errors.push('La fecha de emisión es requerida')

    if (!data.expiration_date)
      errors.push('La fecha de expiración es requerida')

    // Business rules validation
    if (data.concession_number && data.concession_number.length < 3)
      errors.push('El número de concesión debe tener al menos 3 caracteres')

    // Date validations
    if (data.issue_date && data.expiration_date) {
      const issueDate = new Date(data.issue_date)
      const expirationDate = new Date(data.expiration_date)

      if (expirationDate <= issueDate)
        errors.push('La fecha de expiración debe ser posterior a la fecha de emisión')

      // Check minimum concession period (e.g., 1 year)
      const minDuration = 365 * 24 * 60 * 60 * 1000 // 1 year in milliseconds
      if (expirationDate.getTime() - issueDate.getTime() < minDuration)
        errors.push('El período de concesión debe ser de al menos 1 año')
    }

    // Capacity validation
    if (data.authorized_capacity && data.authorized_capacity < 1)
      errors.push('La capacidad autorizada debe ser mayor a 0')

    if (data.authorized_capacity && data.authorized_capacity > 100)
      errors.push('La capacidad autorizada no puede exceder 100 pasajeros')

    // Fee validation
    if (data.annual_fee && data.annual_fee < 0)
      errors.push('La tarifa anual no puede ser negativa')

    return errors
  }

  /**
   * Calculate days until expiration
   */
  static daysUntilExpiration(expirationDate?: string): number {
    if (!expirationDate)
      return 0

    const expDate = new Date(expirationDate)
    const now = new Date()
    const diffTime = expDate.getTime() - now.getTime()

    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Check if concession is expired
   */
  static isExpired(expirationDate?: string): boolean {
    if (!expirationDate)
      return false

    const expDate = new Date(expirationDate)
    const now = new Date()

    return expDate <= now
  }

  /**
   * Check if concession is expiring soon (within days)
   */
  static isExpiringSoon(expirationDate?: string, days = 90): boolean {
    const daysUntil = this.daysUntilExpiration(expirationDate)

    return daysUntil <= days && daysUntil >= 0
  }

  /**
   * Calculate days since issue
   */
  static daysSinceIssue(issueDate?: string): number {
    if (!issueDate)
      return 0

    const issDate = new Date(issueDate)
    const now = new Date()
    const diffTime = now.getTime() - issDate.getTime()

    return Math.floor(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Get concession type label
   */
  static getTypeLabel(type: ConcessionType): string {
    const labels = {
      INDIVIDUAL: 'Individual',
      COMPANY: 'Empresa',
      COOPERATIVE: 'Cooperativa',
    }

    return labels[type] || type
  }

  /**
   * Get concession status color
   */
  static getStatusColor(concession: ConcessionEntity): string {
    if (concession.is_expired)
      return '#DC2626' // Red
    if (concession.is_expiring_soon)
      return '#EAB308' // Yellow
    if (concession.status === 'ACTIVE')
      return '#16A34A' // Green

    return '#6B7280' // Gray
  }

  /**
   * Get renewal status
   */
  static getRenewalStatus(concession: ConcessionEntity): string {
    if (concession.is_expired)
      return 'EXPIRED'
    if (concession.is_expiring_soon)
      return 'RENEWAL_DUE'
    if (!concession.is_renewable)
      return 'NOT_RENEWABLE'

    return 'VALID'
  }

  /**
   * Format route description
   */
  static getRouteDescription(concession: ConcessionEntity): string {
    if (concession.route_description)
      return concession.route_description

    if (concession.route_origin && concession.route_destination)
      return `${concession.route_origin} - ${concession.route_destination}`

    return 'Ruta no especificada'
  }

  /**
   * Check if concession can be deleted (business rules)
   */
  static canDelete(concession: ConcessionEntity): { canDelete: boolean; reason?: string } {
    // Cannot delete if has active vehicles
    if (concession.active_vehicles_count && concession.active_vehicles_count > 0) {
      return {
        canDelete: false,
        reason: 'No se puede eliminar una concesión con vehículos activos',
      }
    }

    // Cannot delete if has pending transfers
    if (concession.transfers_count && concession.transfers_count > 0) {
      return {
        canDelete: false,
        reason: 'No se puede eliminar una concesión con transferencias pendientes',
      }
    }

    return { canDelete: true }
  }

  /**
   * Check if concession can be renewed
   */
  static canRenew(concession: ConcessionEntity): boolean {
    return concession.is_renewable
           && concession.status === 'ACTIVE'
           && (concession.is_expiring_soon || concession.is_expired)
  }

  /**
   * Calculate renewal date
   */
  static calculateRenewalDate(concession: ConcessionEntity, years = 5): string {
    const currentExpiration = new Date(concession.expiration_date)
    const renewalDate = new Date(currentExpiration)

    renewalDate.setFullYear(renewalDate.getFullYear() + years)

    return renewalDate.toISOString().split('T')[0]
  }

  /**
   * Check if concession data has changed
   */
  static hasChanges(original: ConcessionEntity, updated: Partial<ConcessionEntity>): boolean {
    const fieldsToCompare = [
      'concession_number',
      'type',
      'holder_id',
      'description',
      'issue_date',
      'expiration_date',
      'route_origin',
      'route_destination',
      'route_description',
      'authorized_capacity',
      'annual_fee',
      'legal_document',
      'observations',
      'status',
    ]

    return fieldsToCompare.some(field => {
      const originalValue = original[field as keyof ConcessionEntity]
      const updatedValue = updated[field as keyof ConcessionEntity]

      return originalValue !== updatedValue
    })
  }

  /**
   * Format concession display name
   */
  static getDisplayName(concession: ConcessionEntity): string {
    return `${concession.concession_number} - ${this.getTypeLabel(concession.type)}`
  }

  /**
   * Validate if holder can receive this concession
   */
  static canAssignToHolder(concession: ConcessionEntity, holderType: ConcessionType): boolean {
    // Business rule: concession type should match holder type
    return concession.type === holderType
  }
}
