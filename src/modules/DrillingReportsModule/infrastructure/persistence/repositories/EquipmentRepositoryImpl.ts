import type { EquipmentRepository } from '../../../domain/repositories/EquipmentRepository'
import type { Equipment, EquipmentCreateRequest, EquipmentListResponse, EquipmentUpdateRequest } from '../../../domain/entities/EquipmentEntity'
import type { EquipmentApiService } from '../../api/services/EquipmentApiService'

export class EquipmentRepositoryImpl implements EquipmentRepository {
  constructor(private equipmentApiService: EquipmentApiService) {}

  async getAll(params?: any): Promise<EquipmentListResponse> {
    return await this.equipmentApiService.getEquipment(params)
  }

  async getById(id: string): Promise<Equipment> {
    return await this.equipmentApiService.getEquipmentById(id)
  }

  async create(equipment: EquipmentCreateRequest): Promise<Equipment> {
    return await this.equipmentApiService.createEquipment(equipment)
  }

  async update(id: string, equipment: EquipmentUpdateRequest): Promise<Equipment> {
    return await this.equipmentApiService.updateEquipment(id, equipment)
  }

  async delete(id: string): Promise<void> {
    return await this.equipmentApiService.deleteEquipment(id)
  }

  async getByType(equipmentType: string, params?: any): Promise<EquipmentListResponse> {
    return await this.equipmentApiService.getEquipmentByType(equipmentType, params)
  }

  async getAvailable(params?: any): Promise<EquipmentListResponse> {
    return await this.equipmentApiService.getAvailableEquipment(params)
  }
}
