import axios from 'axios'
import type { Well, WellCreateRequest, WellListResponse, WellUpdateRequest } from '../../../domain/entities/WellEntity'

export class WellApiService {
  private baseUrl = '/api/wells'

  async getWells(params?: any): Promise<WellListResponse> {
    const response = await axios.get(this.baseUrl, { params })

    return response.data
  }

  async getWellById(id: string): Promise<Well> {
    const response = await axios.get(`${this.baseUrl}/${id}`)

    return response.data
  }

  async createWell(well: WellCreateRequest): Promise<Well> {
    const response = await axios.post(this.baseUrl, well)

    return response.data
  }

  async updateWell(id: string, well: WellUpdateRequest): Promise<Well> {
    const response = await axios.put(`${this.baseUrl}/${id}`, well)

    return response.data
  }

  async deleteWell(id: string): Promise<void> {
    await axios.delete(`${this.baseUrl}/${id}`)
  }

  async getWellsByProject(projectId: string, params?: any): Promise<WellListResponse> {
    const response = await axios.get(`${this.baseUrl}/project/${projectId}`, { params })

    return response.data
  }
}
