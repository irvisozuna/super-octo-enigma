/**
 * Simple Client Service
 *
 * Versión simplificada que no depende del composable
 * Usa directamente la API para cargar clientes
 */

import { rawApi } from '@/services/api'

export interface ClientOption {
  title: string
  value: string
}

export class SimpleClientService {
  /**
   * Get initial clients (first 20) for autocomplete
   */
  async getInitialClients(): Promise<ClientOption[]> {
    try {
      console.log('🔍 Cargando clientes iniciales...')

      const response = await rawApi('/clients?status=active&per_page=20&sort_by=company_name&sort_order=asc', {
        method: 'GET',
      })

      console.log('✅ Respuesta inicial:', response)

      if (response && response.data && response.data.length > 0) {
        const clients = response.data.map(client => ({
          title: this.formatClientName(client),
          value: client.id,
        }))

        console.log('📋 Clientes iniciales:', clients)

        return clients
      }

      console.warn('⚠️ No hay clientes en la respuesta inicial')

      return this.getFallbackClients()
    }
    catch (error) {
      console.error('❌ Error cargando clientes iniciales:', error)

      return this.getFallbackClients()
    }
  }

  /**
   * Search clients by term
   */
  async searchClients(searchTerm: string): Promise<ClientOption[]> {
    try {
      console.log('🔍 Buscando clientes con término:', searchTerm)

      const response = await rawApi(`/clients?status=active&search=${encodeURIComponent(searchTerm)}&per_page=50&sort_by=company_name&sort_order=asc`, {
        method: 'GET',
      })

      console.log('✅ Respuesta de búsqueda:', response)

      if (response && response.data && response.data.length > 0) {
        const clients = response.data.map(client => ({
          title: this.formatClientName(client),
          value: client.id,
        }))

        console.log('📋 Resultados de búsqueda:', clients)

        return clients
      }

      console.warn('⚠️ No hay resultados para la búsqueda:', searchTerm)

      return []
    }
    catch (error) {
      console.error('❌ Error en búsqueda de clientes:', error)

      return []
    }
  }

  /**
   * Get active clients using direct API call (legacy method)
   */
  async getActiveClients(): Promise<ClientOption[]> {
    return this.getInitialClients()
  }

  /**
   * Get all clients using direct API call
   */
  async getAllClients(): Promise<ClientOption[]> {
    try {
      console.log('🔍 Cargando todos los clientes con API directa...')

      const response = await rawApi('/clients?per_page=100', {
        method: 'GET',
      })

      console.log('✅ Respuesta de la API:', response)

      if (response && response.data && response.data.length > 0) {
        const clients = response.data.map(client => ({
          title: this.formatClientName(client),
          value: client.id,
        }))

        console.log('📋 Clientes cargados:', clients)

        return clients
      }

      console.warn('⚠️ No hay clientes en la respuesta')

      return this.getFallbackClients()
    }
    catch (error) {
      console.error('❌ Error cargando clientes:', error)

      return this.getFallbackClients()
    }
  }

  /**
   * Format client name for display
   */
  private formatClientName(client: any): string {
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
    console.log('🔄 Usando clientes de fallback...')

    return [
      { title: 'Cliente A', value: 'client_a' },
      { title: 'Cliente B', value: 'client_b' },
      { title: 'Cliente C', value: 'client_c' },
    ]
  }
}

// Export singleton instance
export const simpleClientService = new SimpleClientService()
