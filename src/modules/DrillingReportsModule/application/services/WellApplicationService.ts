import type { WellRepository } from '../../domain/repositories/WellRepository'
import type { WellCreateRequest, WellUpdateRequest } from '../../domain/entities/WellEntity'
import { Well, WellListResponse } from '../../domain/entities/WellEntity'
import type { WellCreateDto, WellDto, WellListDto, WellUpdateDto } from '../dtos/WellDtos'
import { WellMapper } from '../mappers/WellMapper'

export class WellApplicationService {
  constructor(private wellRepository: WellRepository) {}

  async getAllWells(params?: any): Promise<WellListDto> {
    const response = await this.wellRepository.getAll(params)

    return {
      data: response.data.map(well => WellMapper.toDto(well)),
      total: response.total,
      page: response.page,
      per_page: response.per_page,
      last_page: response.last_page,
    }
  }

  async getWellById(id: string): Promise<WellDto> {
    const well = await this.wellRepository.getById(id)

    return WellMapper.toDto(well)
  }

  async createWell(wellData: WellCreateDto): Promise<WellDto> {
    const entityData = WellMapper.createDtoToEntity(wellData)
    const well = await this.wellRepository.create(entityData as WellCreateRequest)

    return WellMapper.toDto(well)
  }

  async updateWell(id: string, wellData: WellUpdateDto): Promise<WellDto> {
    const entityData = WellMapper.updateDtoToEntity(wellData)
    const well = await this.wellRepository.update(id, entityData as WellUpdateRequest)

    return WellMapper.toDto(well)
  }

  async deleteWell(id: string): Promise<void> {
    await this.wellRepository.delete(id)
  }

  async getWellsByProject(projectId: string, params?: any): Promise<WellListDto> {
    const response = await this.wellRepository.getByProject(projectId, params)

    return {
      data: response.data.map(well => WellMapper.toDto(well)),
      total: response.total,
      page: response.page,
      per_page: response.per_page,
      last_page: response.last_page,
    }
  }
}
