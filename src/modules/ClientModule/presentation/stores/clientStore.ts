/**
 * Client Store - Presentation Layer
 *
 * Manages client state using Pinia
 * Coordinates with Application Service for business logic
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { ClientApplicationService } from '../../application/services/ClientApplicationService'
import { ClientRepositoryImpl } from '../../infrastructure/persistence/repositories/ClientRepositoryImpl'
import { useClientCacheV2 } from '../../infrastructure/cache/composables/useClientCacheV2'
import type { ClientEntity, CreateClientRequest, UpdateClientRequest } from '../../domain/entities/ClientEntity'
import type { ClientFilter } from '../../shared/types/index'

export const useClientStore = defineStore('client', () => {
  // State
  const items = ref<ClientEntity[]>([])
  const currentItem = ref<ClientEntity | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const pagination = ref({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  })

  // Filters
  const filters = ref<ClientFilter>({
    search: '',
    business_type: undefined,
    status: undefined,
    city: undefined,
    state: undefined,
    payment_terms: undefined,
    has_credit_limit: undefined,
    page: 1,
    per_page: 20,
    sort_by: 'created_at',
    sort_order: 'desc',
  })

  // Application Service
  const repository = new ClientRepositoryImpl()
  const applicationService = new ClientApplicationService(repository)

  // Getters
  const hasItems = computed(() => items.value.length > 0)
  const totalPages = computed(() => pagination.value.last_page)
  const currentPage = computed(() => pagination.value.current_page)
  const totalItems = computed(() => pagination.value.total)
  const activeClients = computed(() => items.value.filter(c => c.status === 'active'))
  const inactiveClients = computed(() => items.value.filter(c => c.status === 'inactive'))
  const suspendedClients = computed(() => items.value.filter(c => c.status === 'suspended'))
  const blacklistedClients = computed(() => items.value.filter(c => c.status === 'blacklisted'))

  // Actions

  /**
   * Fetch list of clients with cache integration
   */
  const fetchList = async (customFilters?: Partial<ClientFilter>) => {
    loading.value = true
    error.value = null

    try {
      const mergedFilters = { ...filters.value, ...customFilters }
      
      // Intentar obtener del cache primero si no hay filtros complejos
      const hasSimpleFilters = !mergedFilters.search && 
                              !mergedFilters.status && 
                              !mergedFilters.business_type && 
                              !mergedFilters.city
      
      if (hasSimpleFilters) {
        try {
          const cache = useClientCacheV2()
          const cachedClients = await cache.getCachedClientsList()
          
          if (cachedClients && cachedClients.length > 0) {
            console.log('📖 Usando datos del cache')
            items.value = cachedClients
            pagination.value = {
              current_page: 1,
              last_page: 1,
              per_page: cachedClients.length,
              total: cachedClients.length,
            }
            return
          }
        } catch (cacheError) {
          console.warn('⚠️ Error accediendo al cache, continuando con servidor:', cacheError)
        }
      }

      console.log('🌐 Cargando datos del servidor')
      const response = await applicationService.getClients(mergedFilters)

      items.value = response.data
      pagination.value = {
        current_page: response.current_page || 1,
        last_page: response.last_page || 1,
        per_page: response.per_page || 20,
        total: response.total || 0,
      }

      // Cachear los datos obtenidos si no hay filtros complejos
      if (hasSimpleFilters && response.data.length > 0) {
        try {
          const cache = useClientCacheV2()
          await cache.cacheClientsList(response.data)
          console.log('💾 Datos cacheados correctamente')
        } catch (cacheError) {
          console.warn('⚠️ Error cacheando datos:', cacheError)
        }
      }
    }
    catch (err: any) {
      error.value = err.message || 'Error al cargar clientes'
      items.value = []
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Fetch client by ID
   */
  const fetchById = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      const client = await applicationService.getClientById(id)

      // Load related data in parallel
      const [contactsResult, historyResult] = await Promise.allSettled([
        repository.getContacts(id).then(res => res.data).catch(() => []),
        applicationService.getStatusHistory(id).catch(() => []),
      ])

      // Assign loaded data
      client.contacts = contactsResult.status === 'fulfilled' ? contactsResult.value : []
      client.status_history = historyResult.status === 'fulfilled' ? historyResult.value : []

      currentItem.value = client
    }
    catch (err: any) {
      error.value = err.message || 'Error al cargar cliente'
      currentItem.value = null
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Create new client
   */
  const createItem = async (data: CreateClientRequest) => {
    loading.value = true
    error.value = null

    try {
      const newItem = await applicationService.createClient(data)

      items.value.unshift(newItem)

      return newItem
    }
    catch (err: any) {
      error.value = err.message || 'Error al crear cliente'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Update client
   */
  const updateItem = async (id: string, data: Partial<UpdateClientRequest>) => {
    loading.value = true
    error.value = null

    try {
      const updatedItem = await applicationService.updateClient(id, data)
      const index = items.value.findIndex(item => item.id === id)

      if (index !== -1)
        items.value[index] = updatedItem

      if (currentItem.value?.id === id)
        currentItem.value = updatedItem

      return updatedItem
    }
    catch (err: any) {
      error.value = err.message || 'Error al actualizar cliente'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Delete client
   */
  const deleteItem = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      await applicationService.deleteClient(id)
      items.value = items.value.filter(item => item.id !== id)

      if (currentItem.value?.id === id)
        currentItem.value = null
    }
    catch (err: any) {
      error.value = err.message || 'Error al eliminar cliente'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Search by client code
   */
  const searchByCode = async (clientCode: string) => {
    try {
      return await applicationService.searchByClientCode(clientCode)
    }
    catch (err: any) {
      error.value = err.message || 'Error al buscar cliente'

      return null
    }
  }

  /**
   * Activate client
   */
  const activateClient = async (id: string, reason?: string, notes?: string, effective_date?: string) => {
    loading.value = true

    try {
      const updated = await applicationService.activateClient(id, reason, notes, effective_date)
      const index = items.value.findIndex(item => item.id === id)

      if (index !== -1)
        items.value[index] = updated

      if (currentItem.value?.id === id)
        currentItem.value = updated

      return updated
    }
    catch (err: any) {
      error.value = err.message || 'Error al activar cliente'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Suspend client
   */
  const suspendClient = async (id: string, reason?: string, notes?: string, effective_date?: string) => {
    loading.value = true

    try {
      const updated = await applicationService.suspendClient(id, reason, notes, effective_date)
      const index = items.value.findIndex(item => item.id === id)

      if (index !== -1)
        items.value[index] = updated

      if (currentItem.value?.id === id)
        currentItem.value = updated

      return updated
    }
    catch (err: any) {
      error.value = err.message || 'Error al suspender cliente'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Deactivate client
   */
  const deactivateClient = async (id: string, reason?: string, notes?: string, effective_date?: string) => {
    loading.value = true

    try {
      const updated = await applicationService.deactivateClient(id, reason, notes, effective_date)
      const index = items.value.findIndex(item => item.id === id)

      if (index !== -1)
        items.value[index] = updated

      if (currentItem.value?.id === id)
        currentItem.value = updated

      return updated
    }
    catch (err: any) {
      error.value = err.message || 'Error al desactivar cliente'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Blacklist client
   */
  const blacklistClient = async (id: string, reason?: string, notes?: string, effective_date?: string) => {
    loading.value = true

    try {
      const updated = await applicationService.blacklistClient(id, reason, notes, effective_date)
      const index = items.value.findIndex(item => item.id === id)

      if (index !== -1)
        items.value[index] = updated

      if (currentItem.value?.id === id)
        currentItem.value = updated

      return updated
    }
    catch (err: any) {
      error.value = err.message || 'Error al agregar cliente a lista negra'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Get statistics
   */
  const getStatistics = async () => {
    try {
      return await applicationService.getStatistics()
    }
    catch (err: any) {
      error.value = err.message || 'Error al cargar estadísticas'
      throw err
    }
  }

  /**
   * Export clients
   */
  const exportData = async (format: 'csv' | 'excel' | 'pdf' = 'excel') => {
    try {
      const blob = await applicationService.exportClients(filters.value, format)

      // Download file
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.download = `clients_${new Date().toISOString()}.${format === 'excel' ? 'xlsx' : format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    }
    catch (err: any) {
      error.value = err.message || 'Error al exportar clientes'
      throw err
    }
  }

  /**
   * Update credit limit
   */
  const updateCreditLimit = async (id: string, creditLimit: number, notes?: string) => {
    loading.value = true

    try {
      const updated = await applicationService.updateCreditLimit(id, creditLimit, notes)
      const index = items.value.findIndex(item => item.id === id)

      if (index !== -1)
        items.value[index] = updated

      if (currentItem.value?.id === id)
        currentItem.value = updated

      return updated
    }
    catch (err: any) {
      error.value = err.message || 'Error al actualizar límite de crédito'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Add contact to client
   */
  const addContact = async (clientId: string, contactData: any) => {
    loading.value = true
    try {
      const newContact = await applicationService.addContact(clientId, contactData)

      // Update currentItem with new contact (create new array to trigger reactivity)
      if (currentItem.value?.id === clientId) {
        const contacts = currentItem.value.contacts || []

        currentItem.value = {
          ...currentItem.value,
          contacts: [...contacts, newContact],
        }
      }

      return newContact
    }
    catch (err: any) {
      error.value = err.message || 'Error al agregar contacto'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Update client contact
   */
  const updateContact = async (clientId: string, contactId: string, contactData: any) => {
    loading.value = true
    try {
      const updatedContact = await applicationService.updateContact(clientId, contactId, contactData)

      // Update currentItem with updated contact (create new array to trigger reactivity)
      if (currentItem.value?.id === clientId && currentItem.value.contacts) {
        const contacts = currentItem.value.contacts.map(c =>
          c.id === contactId ? updatedContact : c,
        )

        currentItem.value = {
          ...currentItem.value,
          contacts,
        }
      }

      return updatedContact
    }
    catch (err: any) {
      error.value = err.message || 'Error al actualizar contacto'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Delete client contact
   */
  const deleteContact = async (clientId: string, contactId: string) => {
    loading.value = true
    try {
      await applicationService.deleteContact(clientId, contactId)

      // Remove contact from currentItem (create new array to trigger reactivity)
      if (currentItem.value?.id === clientId && currentItem.value.contacts) {
        const contacts = currentItem.value.contacts.filter(c => c.id !== contactId)

        currentItem.value = {
          ...currentItem.value,
          contacts,
        }
      }
    }
    catch (err: any) {
      error.value = err.message || 'Error al eliminar contacto'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Set primary contact
   */
  const setPrimaryContact = async (clientId: string, contactId: string) => {
    loading.value = true
    try {
      await applicationService.setPrimaryContact(clientId, contactId)
    }
    catch (err: any) {
      error.value = err.message || 'Error al actualizar contacto principal'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Get status history
   */
  const getStatusHistory = async (clientId: string) => {
    try {
      return await applicationService.getStatusHistory(clientId)
    }
    catch (err: any) {
      error.value = err.message || 'Error al cargar historial de estados'
      throw err
    }
  }

  /**
   * Clear error
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Reset store
   */
  const reset = () => {
    items.value = []
    currentItem.value = null
    loading.value = false
    error.value = null
    pagination.value = {
      current_page: 1,
      last_page: 1,
      per_page: 20,
      total: 0,
    }
  }

  /**
   * Initialize cache
   */
  const initializeCache = async () => {
    try {
      const cache = useClientCacheV2()
      await cache.initializeClientCache()
      console.log('✅ Cache de clientes inicializado')
    } catch (error) {
      console.error('❌ Error inicializando cache:', error)
    }
  }

  /**
   * Force sync cache
   */
  const forceSyncCache = async () => {
    try {
      const cache = useClientCacheV2()
      await cache.forceSync()
      console.log('🔄 Cache sincronizado')
    } catch (error) {
      console.error('❌ Error sincronizando cache:', error)
    }
  }

  /**
   * Clear cache
   */
  const clearCache = async () => {
    try {
      const cache = useClientCacheV2()
      await cache.clearCache()
      console.log('🧹 Cache limpiado')
    } catch (error) {
      console.error('❌ Error limpiando cache:', error)
    }
  }

  /**
   * Update filters
   */
  const updateFilters = (newFilters: Partial<ClientFilter>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  return {
    // State
    items,
    currentItem,
    loading,
    error,
    pagination,
    filters,

    // Getters
    hasItems,
    totalPages,
    currentPage,
    totalItems,
    activeClients,
    inactiveClients,
    suspendedClients,
    blacklistedClients,

    // Actions
    fetchList,
    fetchById,
    createItem,
    updateItem,
    deleteItem,
    searchByCode,
    activateClient,
    suspendClient,
    deactivateClient,
    blacklistClient,
    getStatistics,
    exportData,
    updateCreditLimit,
    addContact,
    updateContact,
    deleteContact,
    setPrimaryContact,
    getStatusHistory,
    clearError,
    reset,
    updateFilters,
    
    // Cache methods
    initializeCache,
    forceSyncCache,
    clearCache,

    // Application Service for direct access
    applicationService,
  }
})
