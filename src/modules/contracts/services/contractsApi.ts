import type { Contract, ContractDebtSummary, ContractDetail, ContractValidation } from '../types/Contract'
import type { CatalogResponse, ContractsFilters, ContractsResponse } from '../types/ContractResponses'
import { ApiService } from '@/services/apiService'

export const ContractsApi = {
  /**
   * ENDPOINT 1: Listar contratos con paginación y filtros
   * GET /api/contracts
   */
  async getContracts(params: ContractsFilters = {}): Promise<ContractsResponse> {
    try {
      return await ApiService.get('/contracts', { params })
    }
    catch (error) {
      console.error('Error fetching contracts:', error)
      throw error
    }
  },

  /**
   * ENDPOINT 2: Obtener detalle completo de un contrato
   * GET /api/contracts/{contratid}
   */
  async getContractById(contratid: string): Promise<ContractDetail> {
    try {
      const response = await ApiService.get(`/contracts/${contratid}`)

      console.log('Raw API response for contract detail:', response)

      return response.data || response
    }
    catch (error) {
      console.error(`Error fetching contract ${contratid}:`, error)
      throw error
    }
  },

  /**
   * ENDPOINT 3: Obtener resumen de deuda de un contrato
   * GET /api/contracts/{contratid}/debt-summary
   */
  async getDebtSummary(contratid: string): Promise<ContractDebtSummary> {
    try {
      const response = await ApiService.get(`/contracts/${contratid}/debt-summary`)

      console.log('Raw API response for debt summary:', response)

      return response.data || response
    }
    catch (error) {
      console.error(`Error fetching debt summary for contract ${contratid}:`, error)
      throw error
    }
  },

  /**
   * ENDPOINT 4: Validar existencia de un contrato
   * GET /api/contracts/validate?account={account} o ?contratid={contratid}
   */
  async validateContract(params: { account?: string; contratid?: string }): Promise<ContractValidation> {
    try {
      if (!params.account && !params.contratid)
        throw new Error('Se requiere account o contratid para validar')

      const response = await ApiService.get('/contracts/validate', { params })

      return response.data
    }
    catch (error) {
      console.error('Error validating contract:', error)
      throw error
    }
  },

  /**
   * ENDPOINTS Obtener catálogos
   * GET /api/contracts/catalog/{type}
   */
  async getCatalog(type: 'status' | 'systems' | 'sectors' | 'type_contracts'): Promise<string[]> {
    try {
      const response: CatalogResponse = await ApiService.get(`/contracts/catalog/${type}`)

      // La respuesta puede ser el array directamente o estar en response.data
      return Array.isArray(response) ? response : (response.data || [])
    }
    catch (error) {
      console.error(`Error fetching ${type} catalog:`, error)

      return []
    }
  },

  /**
   * Método auxiliar: Obtener todos los catálogos de una vez
   */
  async getAllCatalogs(): Promise<{
    status: string[]
    systems: string[]
    sectors: string[]
    type_contracts: string[]
  }> {
    try {
      const [status, systems, sectors, type_contracts] = await Promise.all([
        this.getCatalog('status'),
        this.getCatalog('systems'),
        this.getCatalog('sectors'),
        this.getCatalog('type_contracts'),
      ])

      return { status, systems, sectors, type_contracts }
    }
    catch (error) {
      console.error('Error fetching all catalogs:', error)

      return {
        status: [],
        systems: [],
        sectors: [],
        type_contracts: [],
      }
    }
  },
}
