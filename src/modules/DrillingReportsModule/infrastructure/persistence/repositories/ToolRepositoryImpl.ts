import type { ToolRepository } from '../../../domain/repositories/ToolRepository'
import type { Tool, ToolCreateRequest, ToolListResponse, ToolUpdateRequest } from '../../../domain/entities/ToolEntity'
import type { ToolApiService } from '../../api/services/ToolApiService'

export class ToolRepositoryImpl implements ToolRepository {
  constructor(private toolApiService: ToolApiService) {}

  async getAll(params?: any): Promise<ToolListResponse> {
    return await this.toolApiService.getTools(params)
  }

  async getById(id: string): Promise<Tool> {
    return await this.toolApiService.getToolById(id)
  }

  async create(tool: ToolCreateRequest): Promise<Tool> {
    return await this.toolApiService.createTool(tool)
  }

  async update(id: string, tool: ToolUpdateRequest): Promise<Tool> {
    return await this.toolApiService.updateTool(id, tool)
  }

  async delete(id: string): Promise<void> {
    return await this.toolApiService.deleteTool(id)
  }

  async getByType(toolType: string, params?: any): Promise<ToolListResponse> {
    return await this.toolApiService.getToolsByType(toolType, params)
  }

  async getAvailable(params?: any): Promise<ToolListResponse> {
    return await this.toolApiService.getAvailableTools(params)
  }
}
