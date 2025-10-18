import axios from 'axios'
import type { Project, ProjectCreateRequest, ProjectListResponse, ProjectUpdateRequest } from '../../../domain/entities/ProjectEntity'

export class ProjectApiService {
  private baseUrl = '/api/projects'

  async getProjects(params?: any): Promise<ProjectListResponse> {
    const response = await axios.get(this.baseUrl, { params })

    return response.data
  }

  async getProjectById(id: string): Promise<Project> {
    const response = await axios.get(`${this.baseUrl}/${id}`)

    return response.data
  }

  async createProject(project: ProjectCreateRequest): Promise<Project> {
    const response = await axios.post(this.baseUrl, project)

    return response.data
  }

  async updateProject(id: string, project: ProjectUpdateRequest): Promise<Project> {
    const response = await axios.put(`${this.baseUrl}/${id}`, project)

    return response.data
  }

  async deleteProject(id: string): Promise<void> {
    await axios.delete(`${this.baseUrl}/${id}`)
  }

  async getProjectsByClient(clientId: string, params?: any): Promise<ProjectListResponse> {
    const response = await axios.get(`${this.baseUrl}/client/${clientId}`, { params })

    return response.data
  }
}
