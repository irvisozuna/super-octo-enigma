/**
 * Client Usage Examples
 *
 * Ejemplos de cómo usar el ProjectClientService para diferentes casos
 */

import { projectClientService } from '../services/ProjectClientService'

// ========================================
// EJEMPLO 1: Cargar TODOS los clientes registrados
// ========================================
export async function loadAllRegisteredClients() {
  try {
    // Carga TODOS los clientes (activos, inactivos, suspendidos, etc.)
    const allClients = await projectClientService.getActiveClientsForProjects()

    console.log('Todos los clientes registrados:', allClients)

    return allClients
  }
  catch (error) {
    console.error('Error loading all clients:', error)

    return []
  }
}

// ========================================
// EJEMPLO 2: Cargar SOLO clientes activos
// ========================================
export async function loadActiveClientsOnly() {
  try {
    // Carga solo clientes con status 'active'
    const activeClients = await projectClientService.getActiveClientsOnly()

    console.log('Solo clientes activos:', activeClients)

    return activeClients
  }
  catch (error) {
    console.error('Error loading active clients:', error)

    return []
  }
}

// ========================================
// EJEMPLO 3: Cargar clientes con filtros específicos
// ========================================
export async function loadClientsWithCustomFilters() {
  try {
    // Ejemplo 1: Solo empresas activas
    const companies = await projectClientService.getClientsWithFilters({
      status: 'active',
      business_type: 'company',
    })

    // Ejemplo 2: Buscar por nombre
    const searchResults = await projectClientService.getClientsWithFilters({
      search: 'Acme',
      per_page: 50,
    })

    // Ejemplo 3: Clientes suspendidos
    const suspendedClients = await projectClientService.getClientsWithFilters({
      status: 'suspended',
    })

    console.log('Empresas activas:', companies)
    console.log('Resultados de búsqueda:', searchResults)
    console.log('Clientes suspendidos:', suspendedClients)

    return { companies, searchResults, suspendedClients }
  }
  catch (error) {
    console.error('Error loading clients with filters:', error)

    return { companies: [], searchResults: [], suspendedClients: [] }
  }
}

// ========================================
// EJEMPLO 4: Uso en un componente Vue
// ========================================
export function useClientLoading() {
  const loading = ref(false)
  const clients = ref([])
  const error = ref(null)

  const loadClients = async (type: 'all' | 'active' | 'filtered' = 'all', filters = {}) => {
    loading.value = true
    error.value = null

    try {
      switch (type) {
        case 'all':
          clients.value = await projectClientService.getActiveClientsForProjects()
          break
        case 'active':
          clients.value = await projectClientService.getActiveClientsOnly()
          break
        case 'filtered':
          clients.value = await projectClientService.getClientsWithFilters(filters)
          break
      }
    }
    catch (err) {
      error.value = err
      console.error('Error loading clients:', err)
    }
    finally {
      loading.value = false
    }
  }

  return {
    loading: readonly(loading),
    clients: readonly(clients),
    error: readonly(error),
    loadClients,
  }
}

// ========================================
// EJEMPLO 5: Uso en ProjectForm.vue
// ========================================
export const projectFormClientExamples = {
  // Para formulario de proyecto - todos los clientes
  async loadForProjectForm() {
    return await projectClientService.getActiveClientsForProjects()
  },

  // Para formulario de proyecto - solo activos
  async loadActiveForProjectForm() {
    return await projectClientService.getActiveClientsOnly()
  },

  // Para formulario de proyecto - con búsqueda
  async loadWithSearch(searchTerm: string) {
    return await projectClientService.getClientsWithFilters({
      search: searchTerm,
      status: 'active',
    })
  },
}
