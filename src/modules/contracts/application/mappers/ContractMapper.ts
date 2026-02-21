/**
 * Contract Mapper - Application Layer
 */

import type { ContractEntity } from '../../domain/entities/ContractEntity'
import type { ContractDto } from '../dtos/ContractDtos'

export class ContractMapper {
  static toEntity(dto: ContractDto): ContractEntity {
    return {
      ...dto,

      // Ensure specific mappings if necessary
    }
  }

  static toDto(entity: ContractEntity): ContractDto {
    return {
      ...entity,
    }
  }

  static toEntityList(dtos: ContractDto[]): ContractEntity[] {
    return dtos.map(dto => this.toEntity(dto))
  }
}
