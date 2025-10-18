import type { Equipment } from '../../domain/entities/EquipmentEntity'
import type { EquipmentCreateDto, EquipmentDto, EquipmentUpdateDto } from '../dtos/EquipmentDtos'

export class EquipmentMapper {
  static toDto(equipment: Equipment): EquipmentDto {
    return {
      id: equipment.id,
      name: equipment.name,
      equipment_type: equipment.equipment_type,
      manufacturer: equipment.manufacturer,
      model: equipment.model,
      serial_number: equipment.serial_number,
      specifications: equipment.specifications,
      status: equipment.status,
      location: equipment.location,
      purchase_date: equipment.purchase_date,
      warranty_expiry: equipment.warranty_expiry,
      created_at: equipment.created_at,
      updated_at: equipment.updated_at,
    }
  }

  static toEntity(equipmentDto: EquipmentDto): Equipment {
    return {
      id: equipmentDto.id,
      name: equipmentDto.name,
      equipment_type: equipmentDto.equipment_type,
      manufacturer: equipmentDto.manufacturer,
      model: equipmentDto.model,
      serial_number: equipmentDto.serial_number,
      specifications: equipmentDto.specifications,
      status: equipmentDto.status,
      location: equipmentDto.location,
      purchase_date: equipmentDto.purchase_date,
      warranty_expiry: equipmentDto.warranty_expiry,
      created_at: equipmentDto.created_at,
      updated_at: equipmentDto.updated_at,
    }
  }

  static createDtoToEntity(createDto: EquipmentCreateDto): Omit<Equipment, 'id' | 'created_at' | 'updated_at'> {
    return {
      name: createDto.name,
      equipment_type: createDto.equipment_type,
      manufacturer: createDto.manufacturer,
      model: createDto.model,
      serial_number: createDto.serial_number,
      specifications: createDto.specifications,
      status: 'available', // Default status
      location: createDto.location,
      purchase_date: createDto.purchase_date,
      warranty_expiry: createDto.warranty_expiry,
    }
  }

  static updateDtoToEntity(updateDto: EquipmentUpdateDto): Partial<Equipment> {
    return {
      ...(updateDto.name && { name: updateDto.name }),
      ...(updateDto.equipment_type && { equipment_type: updateDto.equipment_type }),
      ...(updateDto.manufacturer && { manufacturer: updateDto.manufacturer }),
      ...(updateDto.model && { model: updateDto.model }),
      ...(updateDto.serial_number && { serial_number: updateDto.serial_number }),
      ...(updateDto.specifications && { specifications: updateDto.specifications }),
      ...(updateDto.status && { status: updateDto.status }),
      ...(updateDto.location && { location: updateDto.location }),
      ...(updateDto.purchase_date && { purchase_date: updateDto.purchase_date }),
      ...(updateDto.warranty_expiry && { warranty_expiry: updateDto.warranty_expiry }),
    }
  }
}
