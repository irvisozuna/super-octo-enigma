/**
 * Vehicle Mapper - Application Layer
 *
 * Maps between domain entities and DTOs
 */

import type { CreateVehicleRequest, UpdateVehicleRequest, VehicleEntity } from '../../domain/entities/VehicleEntity'
import type { CreateVehicleDto, UpdateVehicleDto, VehicleDto } from '../dtos/VehicleDtos'

export class VehicleMapper {
  /**
   * Maps domain entity to DTO for API responses
   */
  static toDto(entity: VehicleEntity): VehicleDto {
    return {
      id: entity.id,
      plate_number: entity.plate_number,
      vin: entity.vin,
      brand: entity.brand,
      model: entity.model,
      year: entity.year,
      color: entity.color,
      vehicle_type: entity.vehicle_type,
      capacity: entity.capacity,
      concession_id: entity.concession_id,
      registration_date: entity.registration_date,
      last_inspection_date: entity.last_inspection_date,
      next_inspection_date: entity.next_inspection_date,
      status: entity.status,
      company_id: entity.company_id,

      // Computed fields
      age: entity.age,
      days_until_inspection: entity.days_until_inspection,
      is_inspection_due: entity.inspection_due,

      // Relationships
      concession: entity.concession,
      drivers: entity.drivers,
      fines: entity.fines,
      documents: entity.documents,

      // Timestamps
      created_at: entity.created_at,
      updated_at: entity.updated_at,
      deleted_at: entity.deleted_at,
    }
  }

  /**
   * Maps DTO from API to domain entity
   */
  static toDomain(dto: VehicleDto): VehicleEntity {
    return {
      id: dto.id,
      plate_number: dto.plate_number,
      vin: dto.vin,
      brand: dto.brand,
      model: dto.model,
      year: dto.year,
      color: dto.color,
      vehicle_type: dto.vehicle_type,
      capacity: dto.capacity,
      concession_id: dto.concession_id,
      registration_date: dto.registration_date,
      last_inspection_date: dto.last_inspection_date,
      next_inspection_date: dto.next_inspection_date,
      status: dto.status,
      company_id: dto.company_id,

      // Computed fields
      age: dto.age,
      days_until_inspection: dto.days_until_inspection,
      is_inspection_due: dto.is_inspection_due,

      // Relationships
      concession: dto.concession,
      drivers: dto.drivers,
      fines: dto.fines,
      documents: dto.documents,

      // Timestamps
      created_at: dto.created_at,
      updated_at: dto.updated_at,
      deleted_at: dto.deleted_at,
    }
  }

  /**
   * Maps create request to DTO for API
   */
  static createRequestToDto(request: CreateVehicleRequest): CreateVehicleDto {
    return {
      plate_number: request.plate_number,
      vin: request.vin,
      brand: request.brand,
      model: request.model,
      year: request.year,
      color: request.color,
      vehicle_type: request.vehicle_type,
      capacity: request.capacity,
      concession_id: request.concession_id,
      registration_date: request.registration_date,
      last_inspection_date: request.last_inspection_date,
      next_inspection_date: request.next_inspection_date,
      status: request.status,
    }
  }

  /**
   * Maps update request to DTO for API
   */
  static updateRequestToDto(request: UpdateVehicleRequest): UpdateVehicleDto {
    return {
      id: request.id,
      plate_number: request.plate_number,
      vin: request.vin,
      brand: request.brand,
      model: request.model,
      year: request.year,
      color: request.color,
      vehicle_type: request.vehicle_type,
      capacity: request.capacity,
      concession_id: request.concession_id,
      registration_date: request.registration_date,
      last_inspection_date: request.last_inspection_date,
      next_inspection_date: request.next_inspection_date,
      status: request.status,
    }
  }

  /**
   * Maps array of DTOs to domain entities
   */
  static toDomainList(dtos: VehicleDto[]): VehicleEntity[] {
    return dtos.map(dto => this.toDomain(dto))
  }

  /**
   * Maps array of domain entities to DTOs
   */
  static toDtoList(entities: VehicleEntity[]): VehicleDto[] {
    return entities.map(entity => this.toDto(entity))
  }

  /**
   * Maps API response to domain format
   */
  static mapApiResponse(apiData: any): VehicleEntity {
    return {
      id: apiData.id,
      plate_number: apiData.plate_number,
      vin: apiData.vin,
      brand: apiData.brand,
      model: apiData.model,
      year: Number(apiData.year),
      color: apiData.color,
      vehicle_type: apiData.vehicle_type,
      capacity: Number(apiData.capacity),
      concession_id: apiData.concession_id,
      registration_date: apiData.registration_date,
      last_inspection_date: apiData.last_inspection_date,
      next_inspection_date: apiData.next_inspection_date,
      status: apiData.status,
      company_id: apiData.company_id,

      // Computed fields
      age: apiData.age,
      days_until_inspection: apiData.days_until_inspection,
      is_inspection_due: Boolean(apiData.is_inspection_due),

      // Relationships (if included)
      concession: apiData.concession,
      drivers: apiData.drivers || [],
      fines: apiData.fines || [],
      documents: apiData.documents || [],

      // Timestamps
      created_at: apiData.created_at,
      updated_at: apiData.updated_at,
      deleted_at: apiData.deleted_at,
    }
  }

  /**
   * Maps domain entity to API format for requests
   */
  static toApiFormat(entity: VehicleEntity): any {
    return {
      plate_number: entity.plate_number,
      vin: entity.vin,
      brand: entity.brand,
      model: entity.model,
      year: entity.year,
      color: entity.color,
      vehicle_type: entity.vehicle_type,
      capacity: entity.capacity,
      concession_id: entity.concession_id,
      registration_date: entity.registration_date,
      last_inspection_date: entity.last_inspection_date,
      next_inspection_date: entity.next_inspection_date,
      status: entity.status,
    }
  }
}
