import type { ToolRepository } from '../../domain/repositories/ToolRepository'
import type { ToolCreateRequest, ToolUpdateRequest } from '../../domain/entities/ToolEntity'
import type { ToolCreateDto, ToolDto, ToolListDto, ToolUpdateDto } from '../dtos/ToolDtos'
import { ToolMapper } from '../mappers/ToolMapper'

export class ToolApplicationService {
  constructor(private toolRepository: ToolRepository) {}

  async getAllTools(params?: any): Promise<ToolListDto> {
    const response = await this.toolRepository.getAll(params)

    return {
      data: response.data.map(tool => ToolMapper.toDto(tool)),
      total: response.total,
      page: response.page,
      per_page: response.per_page,
      last_page: response.last_page,
    }
  }

  async getToolById(id: string): Promise<ToolDto> {
    const tool = await this.toolRepository.getById(id)

    return ToolMapper.toDto(tool)
  }

  async createTool(toolData: ToolCreateDto): Promise<ToolDto> {
    const entityData = ToolMapper.createDtoToEntity(toolData)
    const tool = await this.toolRepository.create(entityData as ToolCreateRequest)

    return ToolMapper.toDto(tool)
  }

  async updateTool(id: string, toolData: ToolUpdateDto): Promise<ToolDto> {
    const entityData = ToolMapper.updateDtoToEntity(toolData)
    const tool = await this.toolRepository.update(id, entityData as ToolUpdateRequest)

    return ToolMapper.toDto(tool)
  }

  async deleteTool(id: string): Promise<void> {
    await this.toolRepository.delete(id)
  }

  async getToolsByType(toolType: string, params?: any): Promise<ToolListDto> {
    const response = await this.toolRepository.getByType(toolType, params)

    return {
      data: response.data.map(tool => ToolMapper.toDto(tool)),
      total: response.total,
      page: response.page,
      per_page: response.per_page,
      last_page: response.last_page,
    }
  }

  async getAvailableTools(params?: any): Promise<ToolListDto> {
    const response = await this.toolRepository.getAvailable(params)

    return {
      data: response.data.map(tool => ToolMapper.toDto(tool)),
      total: response.total,
      page: response.page,
      per_page: response.per_page,
      last_page: response.last_page,
    }
  }
}
