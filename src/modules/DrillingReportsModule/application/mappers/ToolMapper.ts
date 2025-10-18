import type { Tool } from '../../domain/entities/ToolEntity'
import type { ToolCreateDto, ToolDto, ToolUpdateDto } from '../dtos/ToolDtos'

export class ToolMapper {
  static toDto(tool: Tool): ToolDto {
    return {
      id: tool.id,
      name: tool.name,
      tool_type: tool.tool_type,
      manufacturer: tool.manufacturer,
      model: tool.model,
      serial_number: tool.serial_number,
      specifications: tool.specifications,
      status: tool.status,
      location: tool.location,
      purchase_date: tool.purchase_date,
      warranty_expiry: tool.warranty_expiry,
      created_at: tool.created_at,
      updated_at: tool.updated_at,
    }
  }

  static toEntity(toolDto: ToolDto): Tool {
    return {
      id: toolDto.id,
      name: toolDto.name,
      tool_type: toolDto.tool_type,
      manufacturer: toolDto.manufacturer,
      model: toolDto.model,
      serial_number: toolDto.serial_number,
      specifications: toolDto.specifications,
      status: toolDto.status,
      location: toolDto.location,
      purchase_date: toolDto.purchase_date,
      warranty_expiry: toolDto.warranty_expiry,
      created_at: toolDto.created_at,
      updated_at: toolDto.updated_at,
    }
  }

  static createDtoToEntity(createDto: ToolCreateDto): Omit<Tool, 'id' | 'created_at' | 'updated_at'> {
    return {
      name: createDto.name,
      tool_type: createDto.tool_type,
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

  static updateDtoToEntity(updateDto: ToolUpdateDto): Partial<Tool> {
    return {
      ...(updateDto.name && { name: updateDto.name }),
      ...(updateDto.tool_type && { tool_type: updateDto.tool_type }),
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
