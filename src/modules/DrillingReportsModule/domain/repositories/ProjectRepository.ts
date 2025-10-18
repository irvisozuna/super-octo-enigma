import type { Project, ProjectCreateRequest, ProjectListResponse, ProjectUpdateRequest } from '../entities/ProjectEntity'

export interface ProjectRepository {
  getAll(params?: any): Promise<ProjectListResponse>
  getById(id: string): Promise<Project>
  create(project: ProjectCreateRequest): Promise<Project>
  update(id: string, project: ProjectUpdateRequest): Promise<Project>
  delete(id: string): Promise<void>
  getByClient(clientId: string, params?: any): Promise<ProjectListResponse>
}
