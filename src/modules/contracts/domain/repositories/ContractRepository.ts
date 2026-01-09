/**
 * Contract Repository Interface - Domain Layer
 */

import type { ContractEntity } from '../entities/ContractEntity'

export interface ContractRepository {
  getContracts(filters?: any): Promise<{
    data: ContractEntity[]
    meta: {
      current_page: number
      last_page: number
      per_page: number
      total: number
    }
  }>
  getContractById(id: string): Promise<ContractEntity>
  updateContract(id: string, data: Partial<ContractEntity>): Promise<ContractEntity>
  deleteContract(id: string): Promise<void>
  getCatalogs(): Promise<any>
}
