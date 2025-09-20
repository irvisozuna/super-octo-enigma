/**
 * Concession Holder Domain Entity
 *
 * Core business entity representing a concession holder in the transport system
 */

import type { BaseEntity, ConcessionType, EntityStatus } from '../../../shared/types'

export interface ConcessionHolderEntity extends BaseEntity {

  // Basic Information
  local_id: number
  company_id: string
  full_name: string
  holder_type: 'NATURAL' | 'LEGAL' | 'NATURAL' | 'INDIVIDUAL' | 'COMPANY' | 'COOPERATIVE'
  holder_type_label: string

  // Document Information
  curp?: string
  rfc?: string

  // Contact Information
  phone?: string
  email?: string

  // Legal Representative
  legal_representative?: string

  // Metadata
  metadata: any[]

  // Concession Management
  max_concessions_allowed: number
  current_concessions_count: number
  can_add_more_concessions: boolean

  // Verification
  verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED'
  verification_status_label: string
  verified_at?: string
  verified_by?: string
  is_verified: boolean
  has_valid_documents: boolean

  // Legacy compatibility fields
  holderNumber?: string // mapped from local_id
  fullName?: string // mapped from full_name
  holderType?: string // mapped from holder_type
  firstName?: string
  lastName?: string
  companyName?: string
  cooperativeName?: string
  businessRegistration?: string
  identificationNumber?: string // mapped from curp or rfc
  identificationType?: string
  address?: string
  city?: string
  postalCode?: string
  birthDate?: string
  registrationDate?: string
  lastActivityDate?: string
  emergencyContact?: string
  emergencyPhone?: string
  notes?: string
  legalRepresentative?: string
  verificationStatus?: string // mapped from verification_status
  hasValidDocuments?: boolean
  isVerified?: boolean
  verifiedAt?: string
  activeConcessions?: number // mapped from current_concessions_count
  totalConcessions?: number
  currentConcessions?: number
  maxAllowed?: number
  createdAt?: string
  updatedAt?: string
  status?: EntityStatus // mapped from verification_status

}

export interface CreateConcessionHolderRequest {
  full_name: string
  holder_type: 'NATURAL' | 'LEGAL' | 'NATURAL'
  curp?: string
  rfc?: string
  phone?: string
  email?: string
  legal_representative?: string
  metadata?: Record<string, any>
}

export interface UpdateConcessionHolderRequest extends Partial<CreateConcessionHolderRequest> {
  id: string
}

export interface ConcessionHolderSearchCriteria {
  type?: ConcessionType
  full_name?: string
  commercial_name?: string
  document_number?: string
  tax_id?: string
  status?: EntityStatus
  city?: string
  state?: string
}

/**
 * Concession Holder business rules and validations
 */
export class ConcessionHolderDomain {
  /**
   * Validate concession holder data before creation/update
   */
  static validate(data: Partial<CreateConcessionHolderRequest>): string[] {
    const errors: string[] = []

    // Required fields validation
    if (!data.type)
      errors.push('El tipo de titular es requerido')

    if (!data.full_name?.trim())
      errors.push('El nombre completo es requerido')

    if (!data.document_type?.trim())
      errors.push('El tipo de documento es requerido')

    if (!data.document_number?.trim())
      errors.push('El número de documento es requerido')

    // Business rules validation by type
    if (data.type === 'COMPANY' || data.type === 'COOPERATIVE') {
      if (!data.commercial_name?.trim())
        errors.push('El nombre comercial es requerido para empresas y cooperativas')

      if (!data.tax_id?.trim())
        errors.push('El RFC/RUC es requerido para empresas y cooperativas')

      if (!data.legal_representative_name?.trim())
        errors.push('El representante legal es requerido para empresas y cooperativas')
    }

    // Field length validations
    if (data.full_name && data.full_name.length < 2)
      errors.push('El nombre debe tener al menos 2 caracteres')

    if (data.document_number && data.document_number.length < 5)
      errors.push('El número de documento debe tener al menos 5 caracteres')

    if (data.tax_id && data.tax_id.length < 5)
      errors.push('El RFC/RUC debe tener al menos 5 caracteres')

    // Email validation
    if (data.email && !/^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(data.email))
      errors.push('El formato del email no es válido')

    // Phone validation
    if (data.phone && !/^\+?[\d\s()-]{10,15}$/.test(data.phone))
      errors.push('El formato del teléfono no es válido')

    // Postal code validation
    if (data.postal_code && !/^\d{5}$/.test(data.postal_code))
      errors.push('El código postal debe tener 5 dígitos')

    return errors
  }

  /**
   * Get holder type label
   */
  static getTypeLabel(type: ConcessionType): string {
    const labels = {
      INDIVIDUAL: 'Persona Física',
      COMPANY: 'Empresa',
      COOPERATIVE: 'Cooperativa',
    }

    return labels[type] || type
  }

  /**
   * Get display name (commercial name for companies, full name for individuals)
   */
  static getDisplayName(holder: ConcessionHolderEntity): string {
    if (holder.type === 'INDIVIDUAL')
      return holder.full_name

    return holder.commercial_name || holder.full_name
  }

  /**
   * Get complete address
   */
  static getFullAddress(holder: ConcessionHolderEntity): string {
    const parts = [
      holder.address,
      holder.city,
      holder.state,
      holder.postal_code,
    ].filter(Boolean)

    return parts.join(', ')
  }

  /**
   * Check if holder can be deleted (business rules)
   */
  static canDelete(holder: ConcessionHolderEntity): { canDelete: boolean; reason?: string } {
    // Cannot delete if has active concessions
    if (holder.active_concessions_count && holder.active_concessions_count > 0) {
      return {
        canDelete: false,
        reason: 'No se puede eliminar un titular con concesiones activas',
      }
    }

    return { canDelete: true }
  }

  /**
   * Check if holder data has changed
   */
  static hasChanges(original: ConcessionHolderEntity, updated: Partial<ConcessionHolderEntity>): boolean {
    const fieldsToCompare = [
      'type',
      'full_name',
      'commercial_name',
      'document_type',
      'document_number',
      'tax_id',
      'phone',
      'email',
      'address',
      'city',
      'state',
      'postal_code',
      'legal_representative_name',
      'legal_representative_document',
      'legal_representative_phone',
      'bank_name',
      'bank_account',
      'bank_account_type',
      'status',
    ]

    return fieldsToCompare.some(field => {
      const originalValue = original[field as keyof ConcessionHolderEntity]
      const updatedValue = updated[field as keyof ConcessionHolderEntity]

      return originalValue !== updatedValue
    })
  }

  /**
   * Validate if holder can hold more concessions
   */
  static canHoldMoreConcessions(holder: ConcessionHolderEntity, maxConcessions = 10): boolean {
    return (holder.active_concessions_count || 0) < maxConcessions
  }

  /**
   * Get holder risk level based on business rules
   */
  static getRiskLevel(holder: ConcessionHolderEntity): 'LOW' | 'MEDIUM' | 'HIGH' {
    // Business logic for risk assessment
    const concessionCount = holder.active_concessions_count || 0
    const yearsAsHolder = holder.years_as_holder || 0

    if (concessionCount > 5 || yearsAsHolder < 1)
      return 'HIGH'
    else if (concessionCount > 2 || yearsAsHolder < 3)
      return 'MEDIUM'

    return 'LOW'
  }

  /**
   * Calculate years as holder
   */
  static calculateYearsAsHolder(registrationDate?: string): number {
    if (!registrationDate)
      return 0

    const regDate = new Date(registrationDate)
    const now = new Date()
    const diffTime = now.getTime() - regDate.getTime()

    return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365))
  }

  /**
   * Format holder for display
   */
  static formatForDisplay(holder: ConcessionHolderEntity): string {
    const name = this.getDisplayName(holder)
    const type = this.getTypeLabel(holder.type)

    return `${name} (${type})`
  }
}
