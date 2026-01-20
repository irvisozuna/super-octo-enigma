/**
 * Contract API Service - Infrastructure Layer
 */

import { ApiService } from '@/services/apiService'
import type { ContractDto, PaginatedContractsResponseDto } from '../../../application/dtos/ContractDtos'

export class ContractApiService {
  async getContracts(params: any): Promise<PaginatedContractsResponseDto> {
    const response = await ApiService.get('/contracts', { params })

    return response
  }

  async getContractById(id: string): Promise<ContractDto> {
    const response = await ApiService.get(`/contracts/${id}`)

    return response.data || response
  }

  async updateContract(id: string, data: any): Promise<ContractDto> {
    const response = await ApiService.put(`/contracts/${id}`, data)

    return response.data || response
  }

  async deleteContract(id: string): Promise<void> {
    await ApiService.delete(`/contracts/${id}`)
  }

  async getCatalogs(): Promise<any> {
    const [status, systems, sectors, type_contracts] = await Promise.all([
      ApiService.get('/catalogs-readings/contract-statuses').catch(() => ({ data: [] })),
      ApiService.get('/catalogs-readings/systems').catch(() => ({ data: [] })),
      ApiService.get('/catalogs-readings/sectors').catch(() => ({ data: [] })),
      ApiService.get('/catalogs-readings/contracts-types').catch(() => ({ data: [] })),
    ])

    return {
      status: Array.isArray(status) ? status : (status.data || []),
      systems: Array.isArray(systems) ? systems : (systems.data || []),
      sectors: Array.isArray(sectors) ? sectors : (sectors.data || []),
      type_contracts: Array.isArray(type_contracts) ? type_contracts : (type_contracts.data || []),
    }
  }
}
