/**
 * Vehicle Store - Presentation Layer
 *
 * Pinia store for vehicle state management
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { VehicleRepositoryImpl } from '../../infrastructure/persistence/repositories/VehicleRepositoryImpl'
import { VehicleApplicationService } from '../../application/services/VehicleApplicationService'
import type { CreateVehicleRequest, UpdateVehicleRequest, VehicleEntity } from '../../domain/entities/VehicleEntity'
import type { VehicleFilter } from '../../../shared/types'

export const useVehicleStore = defineStore('transport-vehicle', () => {
  // State
  const items = ref<VehicleEntity[]>([])
  const currentItem = ref<VehicleEntity | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Pagination
  const page = ref(1)
  const itemsPerPage = ref(20)
  const total = ref(0)
  const totalPages = ref(0)

  // Filters
  const filters = ref<VehicleFilter>({})

  // Selection
  const selectedItems = ref<VehicleEntity[]>([])

  // Statistics
  const statistics = ref<any>(null)
  const statisticsLoading = ref(false)

  // Computed
  const currentPage = computed(() => page.value)
  const perPage = computed(() => itemsPerPage.value)
  const hasItems = computed(() => items.value.length > 0)
  const hasSelection = computed(() => selectedItems.value.length > 0)

  // Services
  const repository = new VehicleRepositoryImpl()
  const applicationService = new VehicleApplicationService(repository)

  // Actions
  const fetchList = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await applicationService.getVehicles({
        page: page.value,
        per_page: itemsPerPage.value,
        ...filters.value,
      })

      items.value = response.data
      total.value = response.pagination.total
      totalPages.value = Math.ceil(response.pagination.total / itemsPerPage.value)
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch vehicles'
      items.value = []
    }
    finally {
      loading.value = false
    }
  }

  const fetchById = async (id: string, include?: string) => {
    loading.value = true
    error.value = null

    try {
      const vehicle = await applicationService.getVehicleById(id, include)

      currentItem.value = vehicle

      return vehicle
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch vehicle'
      currentItem.value = null
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const createItem = async (data: CreateVehicleRequest) => {
    loading.value = true
    error.value = null

    try {
      const vehicle = await applicationService.createVehicle(data)

      await fetchList()

      return vehicle
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create vehicle'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const updateItem = async (id: string, data: Partial<UpdateVehicleRequest>) => {
    loading.value = true
    error.value = null

    try {
      const vehicle = await applicationService.updateVehicle(id, data)

      if (currentItem.value?.id === id)
        currentItem.value = vehicle

      const index = items.value.findIndex(item => item.id === id)
      if (index !== -1)
        items.value[index] = vehicle

      return vehicle
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update vehicle'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const deleteItem = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      await applicationService.deleteVehicle(id)

      if (currentItem.value?.id === id)
        currentItem.value = null

      items.value = items.value.filter(item => item.id !== id)
      selectedItems.value = selectedItems.value.filter(item => item.id !== id)
      total.value = Math.max(0, total.value - 1)
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete vehicle'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const setPage = (newPage: number) => {
    page.value = newPage
  }

  const clearError = () => {
    error.value = null
  }

  const exportItems = (type: string) => {
    console.log('Exporting vehicles as', type)
  }

  return {
    // State
    items,
    currentItem,
    loading,
    error,

    // Pagination
    page,
    itemsPerPage,
    total,
    totalPages,
    currentPage,
    perPage,

    // Filters
    filters,

    // Selection
    selectedItems,

    // Actions
    fetchList,
    fetchById,
    createItem,
    updateItem,
    deleteItem,
    setPage,
    clearError,
    exportItems,
  }
})
