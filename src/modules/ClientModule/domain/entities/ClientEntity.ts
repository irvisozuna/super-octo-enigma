/**
 * Client Domain Entity
 *
 * Represents a client in the system with all business rules and validations
 */

export type ClientStatus = 'active' | 'inactive' | 'suspended' | 'blacklisted'
export type BusinessType = 'individual' | 'company' | 'government' | 'ngo'
export type PaymentTerms = 'immediate' | 'net_15' | 'net_30' | 'net_60' | 'custom'
export type PaymentMethod = 'cash' | 'check' | 'bank_transfer' | 'credit_card' | 'financing'
export type CFDIUse = 'G01' | 'G02' | 'G03' | 'P01'
export type TaxRegime = '601' | '603' | '605' | '606' | '608' | '610' | '611' | '612' | '614' | '616' | '620' | '621' | '622' | '623' | '624' | '625' | '626'

/**
 * Client Contact Entity
 */
export interface ClientContactEntity {
  id: string
  client_id: string
  company_id: string
  full_name: string
  position: string
  department?: string
  primary_phone: string
  secondary_phone?: string
  email: string
  is_primary: boolean
  can_approve_projects?: boolean
  can_sign_documents?: boolean
  notes?: string
  created_at?: string
  updated_at?: string
}

/**
 * Client Status History Entity
 */
export interface ClientStatusHistoryEntity {
  id: string
  client_id: string
  old_status: ClientStatus
  new_status: ClientStatus
  reason?: string
  notes?: string
  changed_by_user_id?: string
  changed_by_user?: {
    id: string
    name: string
    email: string
  }
  effective_date: string
  created_at: string
}

export interface CreditLimitEntity {
  amount: number
  currency: string
}
/**
 * Main Client Entity
 */
export interface ClientEntity {
  id: string
  client_code: string
  business_type: BusinessType
  status: ClientStatus

  // Business info
  business_name: string
  trade_name?: string
  industry: string
  website?: string
  logo_url?: string

  // Contact information
  primary_email: string
  secondary_email?: string
  primary_phone: string
  secondary_phone?: string

  // Address
  address_line_1: string
  address_line_2?: string
  city: string
  state: string
  postal_code: string
  country?: string

  // Billing address
  billing_address_line_1?: string
  billing_address_line_2?: string
  billing_city?: string
  billing_state?: string
  billing_postal_code?: string
  billing_country?: string

  // Tax information (Mexico)
  tax_id: string
  tax_regime: TaxRegime
  cfdi_use: CFDIUse

  // Business terms
  payment_terms?: PaymentTerms
  payment_methods?: PaymentMethod[]
  credit_limit?: CreditLimitEntity
  credit_limit_currency?: string

  // Notes and metadata
  notes?: string
  tags?: string[]

  // Timestamps
  created_at?: string
  updated_at?: string

  // Relations
  contacts?: ClientContactEntity[]
  status_history?: ClientStatusHistoryEntity[]
}

/**
 * Create Client Request
 */
export interface CreateClientRequest {
  business_type: BusinessType
  business_name: string
  trade_name?: string
  industry: string
  website?: string
  logo_url?: string
  primary_email: string
  secondary_email?: string
  primary_phone: string
  secondary_phone?: string
  address_line_1: string
  address_line_2?: string
  city: string
  state: string
  postal_code: string
  country?: string
  billing_address_line_1?: string
  billing_address_line_2?: string
  billing_city?: string
  billing_state?: string
  billing_postal_code?: string
  billing_country?: string
  tax_id: string
  tax_regime: TaxRegime
  cfdi_use: CFDIUse
  payment_terms?: PaymentTerms
  payment_methods?: PaymentMethod[]
  credit_limit?: number
  credit_limit_currency?: string
  notes?: string
  tags?: string[]
}

/**
 * Update Client Request
 */
export interface UpdateClientRequest extends Partial<CreateClientRequest> {
  status?: ClientStatus
}

/**
 * Client Search Criteria
 */
export interface ClientSearchCriteria {
  search?: string
  business_type?: BusinessType
  status?: ClientStatus
  city?: string
  state?: string
  payment_terms?: PaymentTerms
  has_credit_limit?: boolean
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  page?: number
  per_page?: number
}

/**
 * Client Domain Logic
 */
export class ClientDomain {
  /**
   * Get status color for UI
   */
  static getStatusColor(status: ClientStatus): string {
    const colors: Record<ClientStatus, string> = {
      active: 'success',
      inactive: 'secondary',
      suspended: 'warning',
      blacklisted: 'error',
    }

    return colors[status] || 'secondary'
  }

  /**
   * Get status icon
   */
  static getStatusIcon(status: ClientStatus): string {
    const icons: Record<ClientStatus, string> = {
      active: 'tabler-circle-check',
      inactive: 'tabler-circle-x',
      suspended: 'tabler-alert-circle',
      blacklisted: 'tabler-ban',
    }

    return icons[status] || 'tabler-circle'
  }

  /**
   * Validate if client can be deleted
   */
  static canDelete(client: ClientEntity): { canDelete: boolean; reason?: string } {
    // Business rule: Only inactive clients can be deleted
    if (client.status !== 'inactive') {
      return {
        canDelete: false,
        reason: 'Solo se pueden eliminar clientes inactivos',
      }
    }

    return { canDelete: true }
  }

  /**
   * Validate if client can be suspended
   */
  static canSuspend(client: ClientEntity): { canSuspend: boolean; reason?: string } {
    if (client.status !== 'active') {
      return {
        canSuspend: false,
        reason: 'Solo se pueden suspender clientes activos',
      }
    }

    return { canSuspend: true }
  }

  /**
   * Validate if client can be activated
   */
  static canActivate(client: ClientEntity): { canActivate: boolean; reason?: string } {
    if (client.status === 'blacklisted') {
      return {
        canActivate: false,
        reason: 'No se pueden activar clientes en lista negra',
      }
    }

    if (client.status === 'active') {
      return {
        canActivate: false,
        reason: 'El cliente ya está activo',
      }
    }

    return { canActivate: true }
  }

  /**
   * Validate Tax ID (Mexico RFC)
   */
  static validateTaxID(taxId: string): boolean {
    // Basic RFC validation for Mexico
    // Persona Física: 13 characters (AAAA######XXX)
    // Persona Moral: 12 characters (AAA######XXX)
    const rfcPattern = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/

    return rfcPattern.test(taxId.toUpperCase())
  }

  /**
   * Format display name
   */
  static getDisplayName(client: ClientEntity): string {
    return client.business_name || client.trade_name || 'Sin nombre'
  }

  /**
   * Check if client has exceeded credit limit
   */
  static hasExceededCreditLimit(client: ClientEntity, currentBalance: number): boolean {
    if (!client.credit_limit || client.credit_limit <= 0)
      return false

    return currentBalance > client.credit_limit
  }

  /**
   * Get payment terms label
   */
  static getPaymentTermsLabel(terms: PaymentTerms): string {
    const labels: Record<PaymentTerms, string> = {
      immediate: 'Inmediato',
      net_15: 'Neto 15 días',
      net_30: 'Neto 30 días',
      net_60: 'Neto 60 días',
      custom: 'Personalizado',
    }

    return labels[terms] || terms
  }
}
