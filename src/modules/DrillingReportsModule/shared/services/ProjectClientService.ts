/**
 * Project Client Service
 *
 * Service layer for handling client-related operations in projects
 * This provides a clean interface between DrillingReportsModule and ClientModule
 */

import { useClient } from '@/modules/ClientModule'
import type { ClientEntity } from '@/modules/ClientModule'
import { rawApi } from '@/services/api'

export interface ClientOption {
  title: string
  value: string
}

export class ProjectClientService {
  private clientComposable = useClient()

  /**
   * Get all registered clients formatted for project forms
   */
  async getActiveClientsForProjects(): Promise<ClientOption[]> {
    try {
      const response = await this.clientComposable.fetchClients({
        // Sin filtro de status para obtener TODOS los clientes registrados
        per_page: 100,
      })

      return response.data.map(client => ({
        title: this.formatClientName(client),
        value: client.id,
      }))
    }
    catch (error) {
      console.error('Error loading clients for projects:', error)

      return this.getFallbackClients()
    }
  }

  /**
   * Get only active clients for project forms
   */
  async getActiveClientsOnly(): Promise<ClientOption[]> {
    try {
      console.log('🔍 Intentando cargar clientes activos...')

      // Intentar con el composable primero
      try {
        const response = await this.clientComposable.fetchClients({
          status: 'active',
          per_page: 100,
        })

        console.log('✅ Respuesta del composable:', response)

        if (response && response.data && response.data.length > 0) {
          const clients = response.data.map(client => ({
            title: this.formatClientName(client),
            value: client.id,
          }))

          console.log('📋 Clientes del composable:', clients)

          return clients
        }
      }
      catch (composableError) {
        console.warn('⚠️ Composable falló, intentando API directa:', composableError)
      }

      // Si el composable falla, usar API directa
      console.log('🔄 Intentando API directa...')

      const directResponse = await rawApi('/clients?status=active&per_page=100', {
        method: 'GET',
      })

      console.log('✅ Respuesta API directa:', directResponse)

      if (directResponse && directResponse.data && directResponse.data.length > 0) {
        const clients = directResponse.data.map(client => ({
          title: this.formatClientName(client),
          value: client.id,
        }))

        console.log('📋 Clientes de API directa:', clients)

        return clients
      }

      console.warn('⚠️ No hay datos en ninguna respuesta')

      return this.getFallbackClients()
    }
    catch (error) {
      console.error('❌ Error loading active clients:', error)
      console.log('🔄 Usando clientes de fallback...')

      return this.getFallbackClients()
    }
  }

  /**
   * Get clients with custom filters
   */
  async getClientsWithFilters(filters: {
    status?: string
    business_type?: string
    search?: string
    per_page?: number
  }): Promise<ClientOption[]> {
    try {
      const response = await this.clientComposable.fetchClients({
        ...filters,
        per_page: filters.per_page || 100,
      })

      return response.data.map(client => ({
        title: this.formatClientName(client),
        value: client.id,
      }))
    }
    catch (error) {
      console.error('Error loading clients with filters:', error)

      return this.getFallbackClients()
    }
  }

  /**
   * Format client name for display
   */
  private formatClientName(client: ClientEntity): string {
    if (client.company_name)
      return client.company_name

    if (client.business_name)
      return client.business_name

    if (client.first_name && client.last_name)
      return `${client.first_name} ${client.last_name}`

    return client.email || 'Cliente sin nombre'
  }

  /**
   * Get fallback clients when API fails
   */
  private getFallbackClients(): ClientOption[] {
    return [
      { title: 'Cliente A', value: 'client_a' },
      { title: 'Cliente B', value: 'client_b' },
      { title: 'Cliente C', value: 'client_c' },
    ]
  }

  /**
   * Get client by ID for project details
   */
  async getClientById(clientId: string): Promise<ClientEntity | null> {
    try {
      const response = await this.clientComposable.fetchClientById(clientId)

      return response.data
    }
    catch (error) {
      console.error('Error loading client:', error)

      return null
    }
  }
}

// Export singleton instance
export const projectClientService = new ProjectClientService()
