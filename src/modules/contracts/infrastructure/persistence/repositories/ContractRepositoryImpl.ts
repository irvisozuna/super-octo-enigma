/**
 * Contract Repository Implementation - Infrastructure Layer
 */

import type { ContractRepository } from '../../../domain/repositories/ContractRepository'
import type { ContractEntity } from '../../../domain/entities/ContractEntity'
import type { ContractApiService } from '../../api/services/ContractApiService'
import { ContractMapper } from '../../../application/mappers/ContractMapper'

export class ContractRepositoryImpl implements ContractRepository {
  constructor(private apiService: ContractApiService) {}

  async getContracts(filters?: any) {
    const response = await this.apiService.getContracts(filters)

    return {
      ...response,
      data: ContractMapper.toEntityList(response.data),
    }
  }

  async getContractById(id: string): Promise<ContractEntity> {
    const dto = await this.apiService.getContractById(id)

    return ContractMapper.toEntity(dto)
  }

  async updateContract(id: string, data: Partial<ContractEntity>): Promise<ContractEntity> {
    const dto = await this.apiService.updateContract(id, data)

    return ContractMapper.toEntity(dto)
  }

  async deleteContract(id: string): Promise<void> {
    await this.apiService.deleteContract(id)
  }

  async getCatalogs(): Promise<any> {
    return await this.apiService.getCatalogs()
  }
}
