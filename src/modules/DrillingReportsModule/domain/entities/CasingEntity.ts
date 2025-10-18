/**
 * Casing Entity
 *
 * Entity for well casing information
 */

export interface CasingEntity {
  id: string
  diameter_inches: number
  depth_range: {
    start_meters: number
    end_meters: number
  }
  quantity: number
  description: string
  material?: string
  thickness?: number
  grade?: string
  created_at: string
  updated_at: string
}

export class CasingDomain {
  /**
   * Validate casing data
   */
  static validateCasing(casing: Partial<CasingEntity>): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!casing.diameter_inches || casing.diameter_inches <= 0)
      errors.push('El diámetro debe ser mayor a 0')

    if (!casing.depth_range || casing.depth_range.start_meters < 0)
      errors.push('La profundidad inicial debe ser mayor o igual a 0')

    if (!casing.depth_range || casing.depth_range.end_meters <= casing.depth_range.start_meters)
      errors.push('La profundidad final debe ser mayor que la inicial')

    if (!casing.quantity || casing.quantity <= 0)
      errors.push('La cantidad debe ser mayor a 0')

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Calculate casing length
   */
  static calculateLength(casing: CasingEntity): number {
    return casing.depth_range.end_meters - casing.depth_range.start_meters
  }

  /**
   * Get casing display name
   */
  static getDisplayName(casing: CasingEntity): string {
    return `${casing.diameter_inches}" - ${casing.description}`
  }
}
