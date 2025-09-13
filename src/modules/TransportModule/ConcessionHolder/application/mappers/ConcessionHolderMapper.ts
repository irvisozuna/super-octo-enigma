import type { ConcessionHolderEntity } from '../../domain/entities/ConcessionHolderEntity'

export class ConcessionHolderMapper {
  /**
   * Transform API response data to domain entity
   */
  static toDomain(apiData: any): ConcessionHolderEntity {
    return {
      id: apiData.id,
      local_id: apiData.local_id,
      company_id: apiData.company_id,
      full_name: apiData.full_name,
      holder_type: apiData.holder_type,
      holder_type_label: apiData.holder_type_label,
      curp: apiData.curp,
      rfc: apiData.rfc,
      phone: apiData.phone,
      email: apiData.email,
      legal_representative: apiData.legal_representative,
      metadata: apiData.metadata || [],
      max_concessions_allowed: apiData.max_concessions_allowed,
      current_concessions_count: apiData.current_concessions_count,
      can_add_more_concessions: apiData.can_add_more_concessions,
      verification_status: apiData.verification_status,
      verification_status_label: apiData.verification_status_label,
      verified_at: apiData.verified_at,
      verified_by: apiData.verified_by,
      is_verified: apiData.is_verified,
      has_valid_documents: apiData.has_valid_documents,
      created_at: apiData.created_at,
      updated_at: apiData.updated_at,

      // Legacy compatibility fields for the UI
      holderNumber: `CH-${apiData.local_id?.toString().padStart(4, '0')}`,
      fullName: apiData.full_name,
      holderType: apiData.holder_type_label,
      identificationNumber: apiData.curp || apiData.rfc || 'N/A',
      activeConcessions: apiData.current_concessions_count,
      status: this.mapVerificationStatusToEntityStatus(apiData.verification_status),
    }
  }

  /**
   * Transform multiple API response items to domain entities
   */
  static manyToDomain(apiDataArray: any[]): ConcessionHolderEntity[] {
    return apiDataArray.map(item => this.toDomain(item))
  }

  /**
   * Transform domain entity to API request format
   */
  static toPersistence(entity: Partial<ConcessionHolderEntity>): any {
    return {
      full_name: entity.full_name,
      holder_type: entity.holder_type,
      curp: entity.curp || null,
      rfc: entity.rfc || null,
      phone: entity.phone || null,
      email: entity.email || null,
      legal_representative: entity.legal_representative || null,
      metadata: entity.metadata || {},
    }
  }

  /**
   * Map verification status to entity status for UI compatibility
   */
  private static mapVerificationStatusToEntityStatus(verificationStatus: string): string {
    const statusMap: Record<string, string> = {
      PENDING: 'pending',
      VERIFIED: 'active',
      REJECTED: 'inactive',
    }

    return statusMap[verificationStatus] || 'pending'
  }

  /**
   * Format holder type for display
   */
  static getHolderTypeDisplayText(holderType: string): string {
    const typeMap: Record<string, string> = {
      NATURAL: 'Natural',
      LEGAL: 'Legal',
      PHYSICAL: 'Physical',
      INDIVIDUAL: 'Individual',
      COMPANY: 'Company',
      COOPERATIVE: 'Cooperative',
    }

    return typeMap[holderType] || holderType
  }

  /**
   * Get identification display value
   */
  static getIdentificationDisplay(entity: ConcessionHolderEntity): string {
    if (entity.curp)
      return entity.curp
    if (entity.rfc)
      return entity.rfc

    return 'N/A'
  }

  /**
   * Format holder number for display
   */
  static formatHolderNumber(localId: number): string {
    return `CH-${localId.toString().padStart(4, '0')}`
  }
}
