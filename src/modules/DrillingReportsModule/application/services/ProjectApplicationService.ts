import type { ProjectRepository } from '../../domain/repositories/ProjectRepository'
import type { ProjectCreateRequest, ProjectUpdateRequest } from '../../domain/entities/ProjectEntity'
import { Project, ProjectListResponse } from '../../domain/entities/ProjectEntity'
import type { ProjectCreateDto, ProjectDto, ProjectListDto, ProjectUpdateDto } from '../dtos/ProjectDtos'
import { ProjectMapper } from '../mappers/ProjectMapper'

export class ProjectApplicationService {
  constructor(private projectRepository: ProjectRepository) {}

  async getAllProjects(params?: any): Promise<ProjectListDto> {
    const response = await this.projectRepository.getAll(params)

    return {
      data: response.data.map(project => ProjectMapper.toDto(project)),
      total: response.total,
      page: response.page,
      per_page: response.per_page,
      last_page: response.last_page,
    }
  }

  async getProjectById(id: string): Promise<ProjectDto> {
    const project = await this.projectRepository.getById(id)

    return ProjectMapper.toDto(project)
  }

  async createProject(projectData: ProjectCreateDto): Promise<ProjectDto> {
    const entityData = ProjectMapper.createDtoToEntity(projectData)
    const project = await this.projectRepository.create(entityData as ProjectCreateRequest)

    return ProjectMapper.toDto(project)
  }

  async updateProject(id: string, projectData: ProjectUpdateDto): Promise<ProjectDto> {
    const entityData = ProjectMapper.updateDtoToEntity(projectData)
    const project = await this.projectRepository.update(id, entityData as ProjectUpdateRequest)

    return ProjectMapper.toDto(project)
  }

  async deleteProject(id: string): Promise<void> {
    await this.projectRepository.delete(id)
  }

  async getProjectsByClient(clientId: string, params?: any): Promise<ProjectListDto> {
    const response = await this.projectRepository.getByClient(clientId, params)

    return {
      data: response.data.map(project => ProjectMapper.toDto(project)),
      total: response.total,
      page: response.page,
      per_page: response.per_page,
      last_page: response.last_page,
    }
  }
}
