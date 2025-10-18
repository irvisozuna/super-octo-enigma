/**
 * Accessory Entity
 *
 * Entity for drilling accessories information
 */

export interface AccessoryEntity {
  id: string
  accessory_type: string
  quantity: number
  unit: 'units' | 'kg' | 'meters' | 'pieces'
  supplier?: string
  observations?: string
  serial_number?: string
  model?: string
  manufacturer?: string
  created_at: string
  updated_at: string
}

export class AccessoryDomain {
  /**
   * Validate accessory data
   */
  static validateAccessory(accessory: Partial<AccessoryEntity>): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!accessory.accessory_type || accessory.accessory_type.trim().length === 0)
      errors.push('El tipo de accesorio es requerido')

    if (!accessory.quantity || accessory.quantity <= 0)
      errors.push('La cantidad debe ser mayor a 0')

    if (!accessory.unit)
      errors.push('La unidad es requerida')

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Get accessory display name
   */
  static getDisplayName(accessory: AccessoryEntity): string {
    return `${accessory.accessory_type} - ${accessory.quantity} ${accessory.unit}`
  }
}
