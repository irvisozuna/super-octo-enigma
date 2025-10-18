import type { Tool, ToolCreateRequest, ToolListResponse, ToolUpdateRequest } from '../entities/ToolEntity'

export interface ToolRepository {
  getAll(params?: any): Promise<ToolListResponse>
  getById(id: string): Promise<Tool>
  create(tool: ToolCreateRequest): Promise<Tool>
  update(id: string, tool: ToolUpdateRequest): Promise<Tool>
  delete(id: string): Promise<void>
  getByType(toolType: string, params?: any): Promise<ToolListResponse>
  getAvailable(params?: any): Promise<ToolListResponse>
}
