/**
 * Client Application Service
 *
 * Orchestrates business operations and coordinates between layers
 * Implements use cases and handles cross-cutting concerns
 */

import type { ClientRepository } from '../../domain/repositories/ClientRepository'
import type { ClientEntity, CreateClientRequest, UpdateClientRequest } from '../../domain/entities/ClientEntity'
import { ClientDomain } from '../../domain/entities/ClientEntity'
import type { INotificationService } from '../../shared/contracts/INotificationService'
import type { ClientFilter, PaginatedResponse } from '../../shared/types'

export class ClientApplicationService {
  constructor(
    private clientRepository: ClientRepository,
    private notificationService?: INotificationService,
  ) {}

  /**
   * Get clients with filtering and pagination
   */
  async getClients(filter?: ClientFilter): Promise<PaginatedResponse<ClientEntity>> {
    try {
      return await this.clientRepository.findAll(filter)
    }
    catch (error) {
      this.handleError('Error al obtener la lista de clientes', error)
      throw error
    }
  }

  /**
   * Get client by ID
   */
  async getClientById(id: string): Promise<ClientEntity> {
    try {
      const response = await this.clientRepository.findById(id)

      return response.data
    }
    catch (error) {
      this.handleError('Error al obtener el cliente', error)
      throw error
    }
  }

  /**
   * Create new client with validation
   */
  async createClient(data: CreateClientRequest): Promise<ClientEntity> {
    try {
      // Validate RFC if provided
      if (data.rfc && !ClientDomain.validateRFC(data.rfc))
        throw new Error('RFC inválido')

      const response = await this.clientRepository.create(data)

      this.showSuccess('Cliente creado correctamente')

      return response.data
    }
    catch (error) {
      this.handleError('Error al crear el cliente', error)
      throw error
    }
  }

  /**
   * Update client with validation
   */
  async updateClient(id: string, data: Partial<UpdateClientRequest>): Promise<ClientEntity> {
    try {
      // Get current client for comparison
      const currentClient = await this.getClientById(id)

      // Validate RFC if provided and changed
      if (data.rfc && data.rfc !== currentClient.rfc && !ClientDomain.validateRFC(data.rfc))
        throw new Error('RFC inválido')

      const response = await this.clientRepository.update(id, data)

      this.showSuccess('Cliente actualizado correctamente')

      return response.data
    }
    catch (error) {
      this.handleError('Error al actualizar el cliente', error)
      throw error
    }
  }

  /**
   * Delete client with business rules validation
   */
  async deleteClient(id: string): Promise<void> {
    try {
      // Get client to check business rules
      const client = await this.getClientById(id)

      // Check if can be deleted
      const { canDelete, reason } = ClientDomain.canDelete(client)
      if (!canDelete)
        throw new Error(reason)

      await this.clientRepository.delete(id)

      this.showSuccess('Cliente eliminado correctamente')
    }
    catch (error) {
      this.handleError('Error al eliminar el cliente', error)
      throw error
    }
  }

  /**
   * Search clients by client code
   */
  async searchByClientCode(clientCode: string): Promise<ClientEntity | null> {
    try {
      const response = await this.clientRepository.findByClientCode(clientCode)

      return response.data
    }
    catch (error) {
      if ((error as any).status === 404)
        return null

      this.handleError('Error al buscar el cliente', error)
      throw error
    }
  }

  /**
   * Activate client
   */
  async activateClient(id: string, reason?: string, notes?: string, effective_date?: string): Promise<ClientEntity> {
    try {
      const client = await this.getClientById(id)

      // Check if can be activated
      const { canActivate, reason: validationReason } = ClientDomain.canActivate(client)
      if (!canActivate)
        throw new Error(validationReason)

      const response = await this.clientRepository.activate(id, reason, notes, effective_date)

      this.showSuccess('Cliente activado correctamente')

      return response.data
    }
    catch (error) {
      this.handleError('Error al activar el cliente', error)
      throw error
    }
  }

  /**
   * Suspend client
   */
  async suspendClient(id: string, reason?: string, notes?: string, effective_date?: string): Promise<ClientEntity> {
    try {
      const client = await this.getClientById(id)

      // Check if can be suspended
      const { canSuspend, reason: validationReason } = ClientDomain.canSuspend(client)
      if (!canSuspend)
        throw new Error(validationReason)

      const response = await this.clientRepository.suspend(id, reason, notes, effective_date)

      this.showSuccess('Cliente suspendido correctamente')

      return response.data
    }
    catch (error) {
      this.handleError('Error al suspender el cliente', error)
      throw error
    }
  }

  /**
   * Deactivate client
   */
  async deactivateClient(id: string, reason?: string, notes?: string, effective_date?: string): Promise<ClientEntity> {
    try {
      const response = await this.clientRepository.deactivate(id, reason, notes, effective_date)

      this.showSuccess('Cliente desactivado correctamente')

      return response.data
    }
    catch (error) {
      this.handleError('Error al desactivar el cliente', error)
      throw error
    }
  }

  /**
   * Blacklist client
   */
  async blacklistClient(id: string, reason?: string, notes?: string, effective_date?: string): Promise<ClientEntity> {
    try {
      const response = await this.clientRepository.blacklist(id, reason, notes, effective_date)

      this.showSuccess('Cliente agregado a lista negra correctamente')

      return response.data
    }
    catch (error) {
      this.handleError('Error al agregar cliente a lista negra', error)
      throw error
    }
  }

  /**
   * Get client statistics
   */
  async getStatistics() {
    try {
      const response = await this.clientRepository.getStatistics()

      return response.data
    }
    catch (error) {
      this.handleError('Error al obtener estadísticas', error)
      throw error
    }
  }

  /**
   * Export clients data
   */
  async exportClients(filter?: ClientFilter, format = 'excel'): Promise<Blob> {
    try {
      const blob = await this.clientRepository.export(filter, format as 'csv' | 'excel' | 'pdf')

      this.showSuccess('Exportación completada')

      return blob
    }
    catch (error) {
      this.handleError('Error al exportar datos', error)
      throw error
    }
  }

  /**
   * Get client display name
   */
  getClientDisplayName(client: ClientEntity): string {
    return ClientDomain.getDisplayName(client)
  }

  /**
   * Check if client has exceeded credit limit
   */
  hasExceededCreditLimit(client: ClientEntity, currentBalance: number): boolean {
    return ClientDomain.hasExceededCreditLimit(client, currentBalance)
  }

  /**
   * Get payment terms label
   */
  getPaymentTermsLabel(client: ClientEntity): string {
    return client.payment_terms ? ClientDomain.getPaymentTermsLabel(client.payment_terms) : 'No definido'
  }

  /**
   * Add contact to client
   */
  async addContact(clientId: string, contactData: any) {
    try {
      // Ensure client_id is included in the payload
      const payload = {
        ...contactData,
        client_id: clientId,
      }

      const response = await this.clientRepository.addContact(clientId, payload)

      this.showSuccess('Contacto agregado correctamente')

      return response.data
    }
    catch (error) {
      this.handleError('Error al agregar contacto', error)
      throw error
    }
  }

  /**
   * Update client contact
   */
  async updateContact(clientId: string, contactId: string, contactData: any) {
    try {
      const response = await this.clientRepository.updateContact(clientId, contactId, contactData)

      this.showSuccess('Contacto actualizado correctamente')

      return response.data
    }
    catch (error) {
      this.handleError('Error al actualizar contacto', error)
      throw error
    }
  }

  /**
   * Delete client contact
   */
  async deleteContact(clientId: string, contactId: string) {
    try {
      await this.clientRepository.deleteContact(clientId, contactId)
      this.showSuccess('Contacto eliminado correctamente')
    }
    catch (error) {
      this.handleError('Error al eliminar contacto', error)
      throw error
    }
  }

  /**
   * Set primary contact
   */
  async setPrimaryContact(clientId: string, contactId: string) {
    try {
      const response = await this.clientRepository.setPrimaryContact(clientId, contactId)

      this.showSuccess('Contacto principal actualizado correctamente')

      return response.data
    }
    catch (error) {
      this.handleError('Error al actualizar contacto principal', error)
      throw error
    }
  }

  /**
   * Get client contacts
   */
  async getContacts(clientId: string) {
    try {
      const response = await this.clientRepository.getContacts(clientId)

      return response.data
    }
    catch (error) {
      this.handleError('Error al obtener contactos', error)
      throw error
    }
  }

  /**
   * Get client status history
   */
  async getStatusHistory(clientId: string) {
    try {
      const response = await this.clientRepository.getStatusHistory(clientId)

      return response.data
    }
    catch (error) {
      this.handleError('Error al obtener historial de estados', error)
      throw error
    }
  }

  /**
   * Update credit limit
   */
  async updateCreditLimit(id: string, creditLimit: number, notes?: string) {
    try {
      const response = await this.clientRepository.updateCreditLimit(id, creditLimit, notes)

      this.showSuccess('Límite de crédito actualizado correctamente')

      return response.data
    }
    catch (error) {
      this.handleError('Error al actualizar límite de crédito', error)
      throw error
    }
  }

  // Private helper methods

  private showSuccess(message: string): void {
    this.notificationService?.success(message)
  }

  private showInfo(message: string): void {
    this.notificationService?.info(message)
  }

  private handleError(title: string, error: any): void {
    console.error(title, error)

    let message = 'Ha ocurrido un error inesperado'

    if (error?.response?.data?.message)
      message = error.response.data.message
    else if (error?.message)
      message = error.message

    this.notificationService?.error(message)
  }
}
