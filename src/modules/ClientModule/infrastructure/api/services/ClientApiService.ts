/**
 * Client API Service
 *
 * Handles HTTP requests to the Client API endpoints
 * Maps between application DTOs and HTTP requests/responses
 */

import type {
  ClientContactCreateDto,
  ClientContactDto,
  ClientContactUpdateDto,
  ClientCreateDto,
  ClientDetailDto,
  ClientFilterDto,
  ClientListDto,
  ClientStatisticsDto,
  ClientStatusHistoryDto,
  ClientUpdateDto,
  PaginatedResponseDto,
} from '../../../application/dtos/ClientDtos'
import { rawApi } from '@/services/api'

export class ClientApiService {
  private readonly baseUrl = '/clients'

  /**
   * Get paginated list of clients
   */
  async getList(filters: ClientFilterDto = {}): Promise<PaginatedResponseDto<ClientListDto>> {
    const params = new URLSearchParams()

    if (filters.search)
      params.append('search', filters.search)
    if (filters.business_type)
      params.append('business_type', filters.business_type)
    if (filters.status)
      params.append('status', filters.status)
    if (filters.city)
      params.append('city', filters.city)
    if (filters.state)
      params.append('state', filters.state)
    if (filters.payment_terms)
      params.append('payment_terms', filters.payment_terms)
    if (filters.has_credit_limit !== undefined)
      params.append('has_credit_limit', filters.has_credit_limit.toString())
    if (filters.page)
      params.append('page', filters.page.toString())
    if (filters.per_page)
      params.append('per_page', filters.per_page.toString())
    if (filters.sort_by)
      params.append('sort_by', filters.sort_by)
    if (filters.sort_order)
      params.append('sort_order', filters.sort_order)

    const url = params.toString() ? `${this.baseUrl}?${params.toString()}` : this.baseUrl

    return await rawApi(url, {
      method: 'GET',
    })
  }

  /**
   * Get client by ID
   */
  async getById(id: string): Promise<{ data: ClientDetailDto }> {
    return await rawApi(`${this.baseUrl}/${id}`, {
      method: 'GET',
    })
  }

  /**
   * Search by client code
   */
  async findByClientCode(clientCode: string): Promise<{ data: ClientDetailDto | null }> {
    return await rawApi(`${this.baseUrl}/search?client_code=${clientCode}`, {
      method: 'GET',
    })
  }

  /**
   * Create new client
   */
  async create(data: ClientCreateDto): Promise<{ data: ClientDetailDto }> {
    return await rawApi(this.baseUrl, {
      method: 'POST',
      body: data,
    })
  }

  /**
   * Update client
   */
  async update(id: string, data: ClientUpdateDto): Promise<{ data: ClientDetailDto }> {
    return await rawApi(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      body: data,
    })
  }

  /**
   * Delete client
   */
  async delete(id: string): Promise<void> {
    await rawApi(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    })
  }

  /**
   * Get clients by business type
   */
  async getByBusinessType(businessType: string): Promise<{ data: ClientListDto[] }> {
    return await rawApi(`${this.baseUrl}/by-business-type/${businessType}`, {
      method: 'GET',
    })
  }

  /**
   * Get statistics
   */
  async getStatistics(): Promise<{ data: ClientStatisticsDto }> {
    return await rawApi(`${this.baseUrl}/statistics`, {
      method: 'GET',
    })
  }

  /**
   * Check if client code is available
   */
  async isClientCodeAvailable(clientCode: string, excludeId?: string): Promise<boolean> {
    try {
      const params = new URLSearchParams({ client_code: clientCode })
      if (excludeId)
        params.append('exclude_id', excludeId)

      const response = await rawApi(`${this.baseUrl}/check-code?${params.toString()}`, {
        method: 'GET',
      })

      return response.available ?? false
    }
    catch {
      return false
    }
  }

  /**
   * Export clients
   */
  async export(filters: ClientFilterDto = {}, format: 'csv' | 'excel' | 'pdf' = 'excel'): Promise<Blob> {
    const params = new URLSearchParams()

    if (filters.search)
      params.append('search', filters.search)
    if (filters.business_type)
      params.append('business_type', filters.business_type)
    if (filters.status)
      params.append('status', filters.status)
    if (filters.city)
      params.append('city', filters.city)
    if (filters.state)
      params.append('state', filters.state)
    if (filters.payment_terms)
      params.append('payment_terms', filters.payment_terms)

    params.append('format', format)

    return await rawApi(`${this.baseUrl}/export?${params.toString()}`, {
      method: 'GET',
      responseType: 'blob',
    })
  }

  // Status Management

  /**
   * Activate client
   */
  async activate(id: string, reason?: string, notes?: string, effective_date?: string): Promise<{ data: ClientDetailDto }> {
    const body: Record<string, any> = {}

    if (reason)
      body.reason = reason

    if (notes)
      body.notes = notes

    if (effective_date)
      body.effective_date = effective_date

    return await rawApi(`${this.baseUrl}/${id}/activate`, {
      method: 'POST',
      body,
    })
  }

  /**
   * Suspend client
   */
  async suspend(id: string, reason?: string, notes?: string, effective_date?: string): Promise<{ data: ClientDetailDto }> {
    const body: Record<string, any> = {}

    if (reason)
      body.reason = reason

    if (notes)
      body.notes = notes

    if (effective_date)
      body.effective_date = effective_date

    return await rawApi(`${this.baseUrl}/${id}/suspend`, {
      method: 'POST',
      body,
    })
  }

  /**
   * Deactivate client
   */
  async deactivate(id: string, reason?: string, notes?: string, effective_date?: string): Promise<{ data: ClientDetailDto }> {
    const body: Record<string, any> = {}

    if (reason)
      body.reason = reason

    if (notes)
      body.notes = notes

    if (effective_date)
      body.effective_date = effective_date

    return await rawApi(`${this.baseUrl}/${id}/deactivate`, {
      method: 'POST',
      body,
    })
  }

  /**
   * Blacklist client
   */
  async blacklist(id: string, reason?: string, notes?: string, effective_date?: string): Promise<{ data: ClientDetailDto }> {
    const body: Record<string, any> = {}

    if (reason)
      body.reason = reason

    if (notes)
      body.notes = notes

    if (effective_date)
      body.effective_date = effective_date

    return await rawApi(`${this.baseUrl}/${id}/blacklist`, {
      method: 'POST',
      body,
    })
  }

  // Contact Management

  /**
   * Get client contacts
   */
  async getContacts(clientId: string): Promise<{ data: ClientContactDto[] }> {
    return await rawApi(`${this.baseUrl}/${clientId}/contacts`, {
      method: 'GET',
    })
  }

  /**
   * Add contact to client
   */
  async addContact(clientId: string, data: ClientContactCreateDto): Promise<{ data: ClientContactDto }> {
    return await rawApi(`${this.baseUrl}/${clientId}/contacts`, {
      method: 'POST',
      body: data,
    })
  }

  /**
   * Update client contact
   */
  async updateContact(clientId: string, contactId: string, data: ClientContactUpdateDto): Promise<{ data: ClientContactDto }> {
    return await rawApi(`${this.baseUrl}/${clientId}/contacts/${contactId}`, {
      method: 'PUT',
      body: data,
    })
  }

  /**
   * Delete client contact
   */
  async deleteContact(clientId: string, contactId: string): Promise<void> {
    await rawApi(`${this.baseUrl}/${clientId}/contacts/${contactId}`, {
      method: 'DELETE',
    })
  }

  /**
   * Set primary contact
   */
  async setPrimaryContact(clientId: string, contactId: string): Promise<{ data: ClientContactDto }> {
    return await rawApi(`${this.baseUrl}/${clientId}/contacts/${contactId}/set-primary`, {
      method: 'POST',
    })
  }

  // Status History

  /**
   * Get client status history
   */
  async getStatusHistory(clientId: string): Promise<{ data: ClientStatusHistoryDto[] }> {
    return await rawApi(`${this.baseUrl}/${clientId}/status-history`, {
      method: 'GET',
    })
  }

  // Credit Management

  /**
   * Update credit limit
   */
  async updateCreditLimit(id: string, creditLimit: number, notes?: string): Promise<{ data: ClientDetailDto }> {
    const body: Record<string, any> = {
      credit_limit_amount: creditLimit,
    }

    if (notes)
      body.notes = notes

    return await rawApi(`${this.baseUrl}/${id}/credit-limit`, {
      method: 'PATCH',
      body,
    })
  }
}
