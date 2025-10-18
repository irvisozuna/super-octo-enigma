import type { ProjectRepository } from '../../../domain/repositories/ProjectRepository'
import type { Project, ProjectCreateRequest, ProjectListResponse, ProjectUpdateRequest } from '../../../domain/entities/ProjectEntity'
import type { ProjectApiService } from '../../api/services/ProjectApiService'

export class ProjectRepositoryImpl implements ProjectRepository {
  constructor(private projectApiService: ProjectApiService) {}

  async getAll(params?: any): Promise<ProjectListResponse> {
    return await this.projectApiService.getProjects(params)
  }

  async getById(id: string): Promise<Project> {
    return await this.projectApiService.getProjectById(id)
  }

  async create(project: ProjectCreateRequest): Promise<Project> {
    return await this.projectApiService.createProject(project)
  }

  async update(id: string, project: ProjectUpdateRequest): Promise<Project> {
    return await this.projectApiService.updateProject(id, project)
  }

  async delete(id: string): Promise<void> {
    return await this.projectApiService.deleteProject(id)
  }

  async getByClient(clientId: string, params?: any): Promise<ProjectListResponse> {
    return await this.projectApiService.getProjectsByClient(clientId, params)
  }
}
