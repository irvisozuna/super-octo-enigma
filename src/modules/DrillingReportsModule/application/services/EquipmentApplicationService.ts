import type { EquipmentRepository } from '../../domain/repositories/EquipmentRepository'
import type { EquipmentCreateRequest, EquipmentUpdateRequest } from '../../domain/entities/EquipmentEntity'
import { Equipment, EquipmentListResponse } from '../../domain/entities/EquipmentEntity'
import type { EquipmentCreateDto, EquipmentDto, EquipmentListDto, EquipmentUpdateDto } from '../dtos/EquipmentDtos'
import { EquipmentMapper } from '../mappers/EquipmentMapper'

export class EquipmentApplicationService {
  constructor(private equipmentRepository: EquipmentRepository) {}

  async getAllEquipment(params?: any): Promise<EquipmentListDto> {
    const response = await this.equipmentRepository.getAll(params)

    return {
      data: response.data.map(equipment => EquipmentMapper.toDto(equipment)),
      total: response.total,
      page: response.page,
      per_page: response.per_page,
      last_page: response.last_page,
    }
  }

  async getEquipmentById(id: string): Promise<EquipmentDto> {
    const equipment = await this.equipmentRepository.getById(id)

    return EquipmentMapper.toDto(equipment)
  }

  async createEquipment(equipmentData: EquipmentCreateDto): Promise<EquipmentDto> {
    const entityData = EquipmentMapper.createDtoToEntity(equipmentData)
    const equipment = await this.equipmentRepository.create(entityData as EquipmentCreateRequest)

    return EquipmentMapper.toDto(equipment)
  }

  async updateEquipment(id: string, equipmentData: EquipmentUpdateDto): Promise<EquipmentDto> {
    const entityData = EquipmentMapper.updateDtoToEntity(equipmentData)
    const equipment = await this.equipmentRepository.update(id, entityData as EquipmentUpdateRequest)

    return EquipmentMapper.toDto(equipment)
  }

  async deleteEquipment(id: string): Promise<void> {
    await this.equipmentRepository.delete(id)
  }

  async getEquipmentByType(equipmentType: string, params?: any): Promise<EquipmentListDto> {
    const response = await this.equipmentRepository.getByType(equipmentType, params)

    return {
      data: response.data.map(equipment => EquipmentMapper.toDto(equipment)),
      total: response.total,
      page: response.page,
      per_page: response.per_page,
      last_page: response.last_page,
    }
  }

  async getAvailableEquipment(params?: any): Promise<EquipmentListDto> {
    const response = await this.equipmentRepository.getAvailable(params)

    return {
      data: response.data.map(equipment => EquipmentMapper.toDto(equipment)),
      total: response.total,
      page: response.page,
      per_page: response.per_page,
      last_page: response.last_page,
    }
  }
}
