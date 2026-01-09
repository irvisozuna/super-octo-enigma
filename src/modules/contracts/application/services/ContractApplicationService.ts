/**
 * Contract Application Service - Application Layer
 */

import type { ContractRepository } from '../../domain/repositories/ContractRepository'
import type { ContractEntity } from '../../domain/entities/ContractEntity'

export class ContractApplicationService {
  constructor(private repository: ContractRepository) {}

  async getContracts(filters?: any) {
    return await this.repository.getContracts(filters)
  }

  async getContractById(id: string): Promise<ContractEntity> {
    return await this.repository.getContractById(id)
  }

  async updateContract(id: string, data: Partial<ContractEntity>): Promise<ContractEntity> {
    return await this.repository.updateContract(id, data)
  }

  async deleteContract(id: string): Promise<void> {
    return await this.repository.deleteContract(id)
  }

  async getCatalogs() {
    return await this.repository.getCatalogs()
  }
}
