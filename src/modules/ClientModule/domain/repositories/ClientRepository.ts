/**
 * Client Repository Interface
 *
 * Domain contract for client data access operations
 * This is a pure interface with no implementation dependencies
 */

import type {
  ClientContactEntity,
  ClientEntity,
  ClientStatusHistoryEntity,
  CreateClientRequest,
  UpdateClientRequest,
} from '../entities/ClientEntity'

import type {
  ApiResponse,
  ClientFilter,
  ClientStatistics,
  PaginatedResponse,
} from '../../shared/types'

export interface ClientRepository {

  /**
   * Get paginated list of clients
   */
  findAll(filter?: ClientFilter): Promise<PaginatedResponse<ClientEntity>>

  /**
   * Find client by ID
   */
  findById(id: string): Promise<ApiResponse<ClientEntity>>

  /**
   * Find client by client code
   */
  findByClientCode(clientCode: string): Promise<ApiResponse<ClientEntity | null>>

  /**
   * Create new client
   */
  create(data: CreateClientRequest): Promise<ApiResponse<ClientEntity>>

  /**
   * Update existing client
   */
  update(id: string, data: Partial<UpdateClientRequest>): Promise<ApiResponse<ClientEntity>>

  /**
   * Delete client (soft delete)
   */
  delete(id: string): Promise<void>

  /**
   * Get client statistics
   */
  getStatistics(): Promise<ApiResponse<ClientStatistics>>

  /**
   * Check if client code is available
   */
  isClientCodeAvailable(clientCode: string, excludeId?: string): Promise<boolean>

  /**
   * Export clients data
   */
  export(filter?: ClientFilter, format?: 'csv' | 'excel' | 'pdf'): Promise<Blob>

  // Status Management
  /**
   * Activate client
   */
  activate(id: string, reason?: string, notes?: string, effective_date?: string): Promise<ApiResponse<ClientEntity>>

  /**
   * Suspend client
   */
  suspend(id: string, reason?: string, notes?: string, effective_date?: string): Promise<ApiResponse<ClientEntity>>

  /**
   * Deactivate client
   */
  deactivate(id: string, reason?: string, notes?: string, effective_date?: string): Promise<ApiResponse<ClientEntity>>

  /**
   * Blacklist client
   */
  blacklist(id: string, reason?: string, notes?: string, effective_date?: string): Promise<ApiResponse<ClientEntity>>

  // Contact Management
  /**
   * Get client contacts
   */
  getContacts(clientId: string): Promise<ApiResponse<ClientContactEntity[]>>

  /**
   * Add contact to client
   */
  addContact(clientId: string, contact: Omit<ClientContactEntity, 'id' | 'client_id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<ClientContactEntity>>

  /**
   * Update client contact
   */
  updateContact(clientId: string, contactId: string, contact: Partial<ClientContactEntity>): Promise<ApiResponse<ClientContactEntity>>

  /**
   * Delete client contact
   */
  deleteContact(clientId: string, contactId: string): Promise<void>

  /**
   * Set primary contact
   */
  setPrimaryContact(clientId: string, contactId: string): Promise<ApiResponse<ClientContactEntity>>

  // Status History
  /**
   * Get client status history
   */
  getStatusHistory(clientId: string): Promise<ApiResponse<ClientStatusHistoryEntity[]>>

  // Credit Management
  /**
   * Update credit limit
   */
  updateCreditLimit(id: string, creditLimit: number, notes?: string): Promise<ApiResponse<ClientEntity>>
}
