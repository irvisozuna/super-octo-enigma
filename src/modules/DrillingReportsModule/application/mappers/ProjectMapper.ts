import type { Project } from '../../domain/entities/ProjectEntity'
import type { ProjectCreateDto, ProjectDto, ProjectUpdateDto } from '../dtos/ProjectDtos'

export class ProjectMapper {
  static toDto(project: Project): ProjectDto {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      start_date: project.start_date,
      end_date: project.end_date,
      status: project.status,
      client_id: project.client_id,
      client_name: project.client_name,
      location: project.location,
      coordinates: project.coordinates,
      created_at: project.created_at,
      updated_at: project.updated_at,
    }
  }

  static toEntity(projectDto: ProjectDto): Project {
    return {
      id: projectDto.id,
      name: projectDto.name,
      description: projectDto.description,
      start_date: projectDto.start_date,
      end_date: projectDto.end_date,
      status: projectDto.status,
      client_id: projectDto.client_id,
      client_name: projectDto.client_name,
      location: projectDto.location,
      coordinates: projectDto.coordinates,
      created_at: projectDto.created_at,
      updated_at: projectDto.updated_at,
    }
  }

  static createDtoToEntity(createDto: ProjectCreateDto): Omit<Project, 'id' | 'created_at' | 'updated_at' | 'client_name'> {
    return {
      name: createDto.name,
      description: createDto.description,
      start_date: createDto.start_date,
      end_date: createDto.end_date,
      client_id: createDto.client_id,
      location: createDto.location,
      coordinates: createDto.coordinates,
      status: 'active', // Default status
    }
  }

  static updateDtoToEntity(updateDto: ProjectUpdateDto): Partial<Project> {
    return {
      ...(updateDto.name && { name: updateDto.name }),
      ...(updateDto.description && { description: updateDto.description }),
      ...(updateDto.start_date && { start_date: updateDto.start_date }),
      ...(updateDto.end_date && { end_date: updateDto.end_date }),
      ...(updateDto.status && { status: updateDto.status }),
      ...(updateDto.location && { location: updateDto.location }),
      ...(updateDto.coordinates && { coordinates: updateDto.coordinates }),
    }
  }
}
