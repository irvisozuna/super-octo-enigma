import type { Well } from '../../domain/entities/WellEntity'
import type { WellCreateDto, WellDto, WellUpdateDto } from '../dtos/WellDtos'

export class WellMapper {
  static toDto(well: Well): WellDto {
    return {
      id: well.id,
      name: well.name,
      project_id: well.project_id,
      project_name: well.project_name,
      well_type: well.well_type,
      depth_planned: well.depth_planned,
      depth_actual: well.depth_actual,
      diameter: well.diameter,
      coordinates: well.coordinates,
      status: well.status,
      start_date: well.start_date,
      completion_date: well.completion_date,
      created_at: well.created_at,
      updated_at: well.updated_at,
    }
  }

  static toEntity(wellDto: WellDto): Well {
    return {
      id: wellDto.id,
      name: wellDto.name,
      project_id: wellDto.project_id,
      project_name: wellDto.project_name,
      well_type: wellDto.well_type,
      depth_planned: wellDto.depth_planned,
      depth_actual: wellDto.depth_actual,
      diameter: wellDto.diameter,
      coordinates: wellDto.coordinates,
      status: wellDto.status,
      start_date: wellDto.start_date,
      completion_date: wellDto.completion_date,
      created_at: wellDto.created_at,
      updated_at: wellDto.updated_at,
    }
  }

  static createDtoToEntity(createDto: WellCreateDto): Omit<Well, 'id' | 'created_at' | 'updated_at' | 'project_name' | 'depth_actual' | 'completion_date'> {
    return {
      name: createDto.name,
      project_id: createDto.project_id,
      well_type: createDto.well_type,
      depth_planned: createDto.depth_planned,
      diameter: createDto.diameter,
      coordinates: createDto.coordinates,
      status: 'planned', // Default status
      start_date: createDto.start_date,
    }
  }

  static updateDtoToEntity(updateDto: WellUpdateDto): Partial<Well> {
    return {
      ...(updateDto.name && { name: updateDto.name }),
      ...(updateDto.well_type && { well_type: updateDto.well_type }),
      ...(updateDto.depth_planned && { depth_planned: updateDto.depth_planned }),
      ...(updateDto.depth_actual && { depth_actual: updateDto.depth_actual }),
      ...(updateDto.diameter && { diameter: updateDto.diameter }),
      ...(updateDto.coordinates && { coordinates: updateDto.coordinates }),
      ...(updateDto.status && { status: updateDto.status }),
      ...(updateDto.start_date && { start_date: updateDto.start_date }),
      ...(updateDto.completion_date && { completion_date: updateDto.completion_date }),
    }
  }
}
