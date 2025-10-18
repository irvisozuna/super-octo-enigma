import axios from 'axios'
import type { Tool, ToolCreateRequest, ToolListResponse, ToolUpdateRequest } from '../../../domain/entities/ToolEntity'

export class ToolApiService {
  private baseUrl = '/api/tools'

  async getTools(params?: any): Promise<ToolListResponse> {
    const response = await axios.get(this.baseUrl, { params })

    return response.data
  }

  async getToolById(id: string): Promise<Tool> {
    const response = await axios.get(`${this.baseUrl}/${id}`)

    return response.data
  }

  async createTool(tool: ToolCreateRequest): Promise<Tool> {
    const response = await axios.post(this.baseUrl, tool)

    return response.data
  }

  async updateTool(id: string, tool: ToolUpdateRequest): Promise<Tool> {
    const response = await axios.put(`${this.baseUrl}/${id}`, tool)

    return response.data
  }

  async deleteTool(id: string): Promise<void> {
    await axios.delete(`${this.baseUrl}/${id}`)
  }

  async getToolsByType(toolType: string, params?: any): Promise<ToolListResponse> {
    const response = await axios.get(`${this.baseUrl}/type/${toolType}`, { params })

    return response.data
  }

  async getAvailableTools(params?: any): Promise<ToolListResponse> {
    const response = await axios.get(`${this.baseUrl}/available`, { params })

    return response.data
  }
}
