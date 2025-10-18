import type { Equipment, EquipmentCreateRequest, EquipmentListResponse, EquipmentUpdateRequest } from '../entities/EquipmentEntity'

export interface EquipmentRepository {
  getAll(params?: any): Promise<EquipmentListResponse>
  getById(id: string): Promise<Equipment>
  create(equipment: EquipmentCreateRequest): Promise<Equipment>
  update(id: string, equipment: EquipmentUpdateRequest): Promise<Equipment>
  delete(id: string): Promise<void>
  getByType(equipmentType: string, params?: any): Promise<EquipmentListResponse>
  getAvailable(params?: any): Promise<EquipmentListResponse>
}
