/**
 * Client Repository Implementation - Infrastructure Layer
 *
 * Implements the domain repository interface using API services
 * This is the only place where we know about HTTP, API endpoints, etc.
 */

import type { ClientRepository } from '../../../domain/repositories/ClientRepository'
import type {
  ClientContactEntity,
  ClientEntity,
  ClientStatusHistoryEntity,
  CreateClientRequest,
  UpdateClientRequest,
} from '../../../domain/entities/ClientEntity'
import type {
  ApiResponse,
  ClientFilter,
  ClientStatistics,
  PaginatedResponse,
} from '../../../shared/types'
import { ClientMapper } from '../../../application/mappers/ClientMapper'
import { ClientApiService } from '../../api/services/ClientApiService'

export class ClientRepositoryImpl implements ClientRepository {
  private apiService: ClientApiService

  constructor() {
    this.apiService = new ClientApiService()
  }

  async findAll(filter?: ClientFilter): Promise<PaginatedResponse<ClientEntity>> {
    const response = await this.apiService.getList(filter)

    return {
      data: response.data.map(dto => ClientMapper.apiListToDomain(dto)),
      total: response.total,
      per_page: response.per_page,
      current_page: response.current_page,
      last_page: response.last_page,
      from: response.from,
      to: response.to,
    }
  }

  async findById(id: string): Promise<ApiResponse<ClientEntity>> {
    const response = await this.apiService.getById(id)

    return {
      data: ClientMapper.apiDetailToDomain(response.data),
    }
  }

  async findByClientCode(clientCode: string): Promise<ApiResponse<ClientEntity | null>> {
    const response = await this.apiService.findByClientCode(clientCode)

    return {
      data: response.data ? ClientMapper.apiDetailToDomain(response.data) : null,
    }
  }

  async create(data: CreateClientRequest): Promise<ApiResponse<ClientEntity>> {
    const dto = ClientMapper.domainCreateToApi(data)
    const response = await this.apiService.create(dto)

    return {
      data: ClientMapper.apiDetailToDomain(response.data),
    }
  }

  async update(id: string, data: Partial<UpdateClientRequest>): Promise<ApiResponse<ClientEntity>> {
    const dto = ClientMapper.domainUpdateToApi(data)
    const response = await this.apiService.update(id, dto)

    return {
      data: ClientMapper.apiDetailToDomain(response.data),
    }
  }

  async delete(id: string): Promise<void> {
    await this.apiService.delete(id)
  }

  async getStatistics(): Promise<ApiResponse<ClientStatistics>> {
    const response = await this.apiService.getStatistics()

    return {
      data: {
        total_clients: response.data.total_clients,
        active_clients: response.data.active_clients,
        inactive_clients: response.data.inactive_clients,
        suspended_clients: response.data.suspended_clients,
        blacklisted_clients: response.data.blacklisted_clients,
        total_companies: response.data.total_companies,
        total_individuals: response.data.total_individuals,
        total_credit_limit: response.data.total_credit_limit,
        average_credit_days: response.data.average_credit_days,
      },
    }
  }

  async isClientCodeAvailable(clientCode: string, excludeId?: string): Promise<boolean> {
    return await this.apiService.isClientCodeAvailable(clientCode, excludeId)
  }

  async export(filter?: ClientFilter, format?: 'csv' | 'excel' | 'pdf'): Promise<Blob> {
    return await this.apiService.export(filter as any, format)
  }

  // Status Management

  async activate(id: string, reason?: string, notes?: string, effective_date?: string): Promise<ApiResponse<ClientEntity>> {
    const response = await this.apiService.activate(id, reason, notes, effective_date)

    return {
      data: ClientMapper.apiDetailToDomain(response.data),
    }
  }

  async suspend(id: string, reason?: string, notes?: string, effective_date?: string): Promise<ApiResponse<ClientEntity>> {
    const response = await this.apiService.suspend(id, reason, notes, effective_date)

    return {
      data: ClientMapper.apiDetailToDomain(response.data),
    }
  }

  async deactivate(id: string, reason?: string, notes?: string, effective_date?: string): Promise<ApiResponse<ClientEntity>> {
    const response = await this.apiService.deactivate(id, reason, notes, effective_date)

    return {
      data: ClientMapper.apiDetailToDomain(response.data),
    }
  }

  async blacklist(id: string, reason?: string, notes?: string, effective_date?: string): Promise<ApiResponse<ClientEntity>> {
    const response = await this.apiService.blacklist(id, reason, notes, effective_date)

    return {
      data: ClientMapper.apiDetailToDomain(response.data),
    }
  }

  // Contact Management

  async getContacts(clientId: string): Promise<ApiResponse<ClientContactEntity[]>> {
    const response = await this.apiService.getContacts(clientId)

    return {
      data: response.data.map(contact => ClientMapper.apiContactToDomain(contact)),
    }
  }

  async addContact(clientId: string, contact: Omit<ClientContactEntity, 'id' | 'client_id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<ClientContactEntity>> {
    const response = await this.apiService.addContact(clientId, contact as any)

    return {
      data: ClientMapper.apiContactToDomain(response.data),
    }
  }

  async updateContact(clientId: string, contactId: string, contact: Partial<ClientContactEntity>): Promise<ApiResponse<ClientContactEntity>> {
    const response = await this.apiService.updateContact(clientId, contactId, contact as any)

    return {
      data: ClientMapper.apiContactToDomain(response.data),
    }
  }

  async deleteContact(clientId: string, contactId: string): Promise<void> {
    await this.apiService.deleteContact(clientId, contactId)
  }

  async setPrimaryContact(clientId: string, contactId: string): Promise<ApiResponse<ClientContactEntity>> {
    const response = await this.apiService.setPrimaryContact(clientId, contactId)

    return {
      data: ClientMapper.apiContactToDomain(response.data),
    }
  }

  // Status History

  async getStatusHistory(clientId: string): Promise<ApiResponse<ClientStatusHistoryEntity[]>> {
    const response = await this.apiService.getStatusHistory(clientId)

    return {
      data: response.data.map(dto => ClientMapper.apiStatusHistoryToDomain(dto)),
    }
  }

  // Credit Management

  async updateCreditLimit(id: string, creditLimit: number, notes?: string): Promise<ApiResponse<ClientEntity>> {
    const response = await this.apiService.updateCreditLimit(id, creditLimit, notes)

    return {
      data: ClientMapper.apiDetailToDomain(response.data),
    }
  }
}
