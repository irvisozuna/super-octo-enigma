/**
 * Concession Mapper - Application Layer
 *
 * Maps between domain entities and external data formats
 */

import type { ConcessionEntity } from '../../domain/entities/ConcessionEntity'

export class ConcessionMapper {
  /**
   * Map API response to domain entity
   */
  static mapApiResponse(dto: any): ConcessionEntity {
    return {
      id: dto.id,
      number: dto.number,
      modality: dto.modality,
      municipality: dto.municipality,
      status: dto.status,
      validFrom: dto.valid_from,
      validTo: dto.valid_to,
      routeOrSite: dto.route_or_site,
      authorizedServices: dto.authorized_services || [],
      restrictions: dto.restrictions || [],
      holderId: dto.holder_id,
      holderName: dto.holder_name,
      metadata: dto.metadata || {},
      createdAt: dto.created_at,
      updatedAt: dto.updated_at,
    }
  }

  /**
   * Map domain entity to API request
   */
  static mapToApiRequest(entity: ConcessionEntity): any {
    return {
      id: entity.id,
      number: entity.number,
      modality: entity.modality,
      municipality: entity.municipality,
      status: entity.status,
      valid_from: entity.validFrom,
      valid_to: entity.validTo,
      route_or_site: entity.routeOrSite,
      authorized_services: entity.authorizedServices,
      restrictions: entity.restrictions,
      holder_id: entity.holderId,
      metadata: entity.metadata,
    }
  }

  /**
   * Map create DTO to API request
   */
  static mapCreateDtoToApiRequest(dto: any): any {
    return {
      holder_id: dto.holder_id,
      number: dto.number,
      modality: dto.modality,
      municipality: dto.municipality,
      valid_from: dto.valid_from,
      valid_to: dto.valid_to,
      status: dto.status,
      route_or_site: dto.route_or_site,
      authorized_services: dto.authorized_services,
      restrictions: dto.restrictions,
      metadata: dto.metadata,
    }
  }

  /**
   * Map list of API responses to domain entities
   */
  static mapApiResponseList(dtos: any[]): ConcessionEntity[] {
    return dtos.map(dto => this.mapApiResponse(dto))
  }
}