/**
 * Additive Entity
 *
 * Entity for drilling additives information
 */

export interface AdditiveEntity {
  id: string
  additive_type: string
  quantity: number
  unit: 'kg' | 'bags' | 'liters' | 'gallons' | 'units'
  description?: string
  concentration?: number
  supplier?: string
  batch_number?: string
  expiry_date?: string
  created_at: string
  updated_at: string
}

export class AdditiveDomain {
  /**
   * Validate additive data
   */
  static validateAdditive(additive: Partial<AdditiveEntity>): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!additive.additive_type || additive.additive_type.trim().length === 0)
      errors.push('El tipo de aditivo es requerido')

    if (!additive.quantity || additive.quantity <= 0)
      errors.push('La cantidad debe ser mayor a 0')

    if (!additive.unit)
      errors.push('La unidad es requerida')

    if (additive.concentration && (additive.concentration < 0 || additive.concentration > 100))
      errors.push('La concentración debe estar entre 0 y 100')

    if (additive.expiry_date) {
      const expiryDate = new Date(additive.expiry_date)
      const today = new Date()
      if (expiryDate < today)
        errors.push('La fecha de vencimiento no puede ser pasada')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Check if additive is expired
   */
  static isExpired(additive: AdditiveEntity): boolean {
    if (!additive.expiry_date)
      return false

    return new Date(additive.expiry_date) < new Date()
  }

  /**
   * Get additive display name
   */
  static getDisplayName(additive: AdditiveEntity): string {
    return `${additive.additive_type} - ${additive.quantity} ${additive.unit}`
  }
}
