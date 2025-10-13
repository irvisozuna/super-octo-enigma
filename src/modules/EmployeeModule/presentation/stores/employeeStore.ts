/**
 * Employee Store - Presentation Layer
 *
 * Manages employee state using Pinia
 * Coordinates with Application Service for business logic
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { EmployeeApplicationService } from '../../application/services/EmployeeApplicationService'
import { EmployeeRepositoryImpl } from '../../infrastructure/persistence/repositories/EmployeeRepositoryImpl'
import type { CreateEmployeeRequest, EmployeeEntity, UpdateEmployeeRequest } from '../../domain/entities/EmployeeEntity'
import type { EmployeeFilter } from '../../shared/types'

export const useEmployeeStore = defineStore('employee', () => {
  // State
  const items = ref<EmployeeEntity[]>([])
  const currentItem = ref<EmployeeEntity | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const pagination = ref({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  })

  // Filters
  const filters = ref<EmployeeFilter>({
    first_name: '',
    last_name: '',
    position: undefined,
    status: undefined,
    department: '',
    employment_type: undefined,
    page: 1,
    per_page: 20,
    sort_by: 'created_at',
    sort_order: 'desc',
    search: '',
  })

  // Application Service
  const repository = new EmployeeRepositoryImpl()
  const applicationService = new EmployeeApplicationService(repository)

  // Getters
  const hasItems = computed(() => items.value.length > 0)
  const totalPages = computed(() => pagination.value.last_page)
  const currentPage = computed(() => pagination.value.current_page)
  const totalItems = computed(() => pagination.value.total)
  const activeEmployees = computed(() => items.value.filter(e => e.status === 'active'))
  const inactiveEmployees = computed(() => items.value.filter(e => e.status !== 'active'))

  // Actions

  /**
   * Fetch list of employees
   */
  const fetchList = async (customFilters?: Partial<EmployeeFilter>) => {
    loading.value = true
    error.value = null

    try {
      const mergedFilters = { ...filters.value, ...customFilters }
      const response = await applicationService.getEmployees(mergedFilters)

      items.value = response.data
      pagination.value = {
        current_page: response.meta?.current_page || 1,
        last_page: response.meta?.last_page || 1,
        per_page: response.meta?.per_page || 20,
        total: response.meta?.total || 0,
      }
    }
    catch (err: any) {
      error.value = err.message || 'Error al cargar empleados'
      items.value = []
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Fetch employee by ID
   */
  const fetchById = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      currentItem.value = await applicationService.getEmployeeById(id)
    }
    catch (err: any) {
      error.value = err.message || 'Error al cargar empleado'
      currentItem.value = null
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Create new employee
   */
  const createItem = async (data: CreateEmployeeRequest) => {
    loading.value = true
    error.value = null

    try {
      const newItem = await applicationService.createEmployee(data)
      items.value.unshift(newItem)

      return newItem
    }
    catch (err: any) {
      error.value = err.message || 'Error al crear empleado'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Update employee
   */
  const updateItem = async (id: string, data: Partial<UpdateEmployeeRequest>) => {
    loading.value = true
    error.value = null

    try {
      const updatedItem = await applicationService.updateEmployee(id, data)
      const index = items.value.findIndex(item => item.id === id)

      if (index !== -1)
        items.value[index] = updatedItem

      if (currentItem.value?.id === id)
        currentItem.value = updatedItem

      return updatedItem
    }
    catch (err: any) {
      error.value = err.message || 'Error al actualizar empleado'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Delete employee
   */
  const deleteItem = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      await applicationService.deleteEmployee(id)
      items.value = items.value.filter(item => item.id !== id)

      if (currentItem.value?.id === id)
        currentItem.value = null
    }
    catch (err: any) {
      error.value = err.message || 'Error al eliminar empleado'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Search by employee code
   */
  const searchByCode = async (employeeCode: string) => {
    try {
      return await applicationService.searchByEmployeeCode(employeeCode)
    }
    catch (err: any) {
      error.value = err.message || 'Error al buscar empleado'
      return null
    }
  }

  /**
   * Suspend employee
   */
  const suspendEmployee = async (id: string) => {
    loading.value = true

    try {
      const updated = await applicationService.suspendEmployee(id)
      const index = items.value.findIndex(item => item.id === id)

      if (index !== -1)
        items.value[index] = updated

      if (currentItem.value?.id === id)
        currentItem.value = updated

      return updated
    }
    catch (err: any) {
      error.value = err.message || 'Error al suspender empleado'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Reactivate employee
   */
  const reactivateEmployee = async (id: string) => {
    loading.value = true

    try {
      const updated = await applicationService.reactivateEmployee(id)
      const index = items.value.findIndex(item => item.id === id)

      if (index !== -1)
        items.value[index] = updated

      if (currentItem.value?.id === id)
        currentItem.value = updated

      return updated
    }
    catch (err: any) {
      error.value = err.message || 'Error al reactivar empleado'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Terminate employee
   */
  const terminateEmployee = async (id: string) => {
    loading.value = true

    try {
      const updated = await applicationService.terminateEmployee(id)
      const index = items.value.findIndex(item => item.id === id)

      if (index !== -1)
        items.value[index] = updated

      if (currentItem.value?.id === id)
        currentItem.value = updated

      return updated
    }
    catch (err: any) {
      error.value = err.message || 'Error al terminar empleado'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Get operators
   */
  const getOperators = async () => {
    try {
      return await applicationService.getOperators()
    }
    catch (err: any) {
      error.value = err.message || 'Error al cargar operadores'
      return []
    }
  }

  /**
   * Get helpers
   */
  const getHelpers = async () => {
    try {
      return await applicationService.getHelpers()
    }
    catch (err: any) {
      error.value = err.message || 'Error al cargar ayudantes'
      return []
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
   * Export employees
   */
  const exportData = async (format: 'csv' | 'excel' | 'pdf' = 'excel') => {
    try {
      const blob = await applicationService.exportEmployees(filters.value, format)

      // Download file
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `employees_${new Date().toISOString()}.${format === 'excel' ? 'xlsx' : format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    }
    catch (err: any) {
      error.value = err.message || 'Error al exportar empleados'
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
   * Update filters
   */
  const updateFilters = (newFilters: Partial<EmployeeFilter>) => {
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
    activeEmployees,
    inactiveEmployees,

    // Actions
    fetchList,
    fetchById,
    createItem,
    updateItem,
    deleteItem,
    searchByCode,
    suspendEmployee,
    reactivateEmployee,
    terminateEmployee,
    getOperators,
    getHelpers,
    getStatistics,
    exportData,
    clearError,
    reset,
    updateFilters,

    // Application Service for direct access
    applicationService,
  }
})
