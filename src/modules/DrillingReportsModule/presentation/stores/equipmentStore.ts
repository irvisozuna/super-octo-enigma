/**
 * Equipment Store for Drilling Reports Module
 * Manages equipment data and operations
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { type CreateEquipmentDto, type Equipment, EquipmentApiService, type UpdateEquipmentDto } from '../../infrastructure/api/services/EquipmentApiService'

export interface EquipmentPagination {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export type { Equipment, CreateEquipmentDto, UpdateEquipmentDto }

export const useEquipmentStore = defineStore('drillingEquipment', () => {
  // State
  const equipment = ref<Equipment[]>([])
  const currentEquipment = ref<Equipment | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const pagination = ref<EquipmentPagination>({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  })

  // Getters
  const equipmentList = computed(() => equipment.value)
  const isLoading = computed(() => loading.value)
  const hasError = computed(() => !!error.value)
  const currentEquipmentData = computed(() => currentEquipment.value)

  // Actions
  const fetchEquipment = async (params: {
    search?: string
    equipment_type?: string
    status?: string
    page?: number
    per_page?: number
  } = {}) => {
    loading.value = true
    error.value = null
    try {
      const response = await EquipmentApiService.getEquipment(params)

      equipment.value = response.data || []

      // Handle pagination from meta
      if (response.meta) {
        pagination.value = {
          current_page: response.meta.current_page || 1,
          last_page: response.meta.last_page || 1,
          per_page: response.meta.per_page || 15,
          total: response.meta.total || 0,
        }
      }
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error fetching equipment'
      console.error('Error fetching equipment:', err)
    }
    finally {
      loading.value = false
    }
  }

  const fetchEquipmentItem = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      const response = await EquipmentApiService.getEquipmentById(id)

      currentEquipment.value = response.data

      return response.data
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error fetching equipment'
      console.error('Error fetching equipment:', err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const createEquipment = async (equipmentData: CreateEquipmentDto) => {
    loading.value = true
    error.value = null
    try {
      const response = await EquipmentApiService.createEquipment(equipmentData)

      equipment.value.unshift(response.data)

      return response.data
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error creating equipment'
      console.error('Error creating equipment:', err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const updateEquipment = async (id: string, equipmentData: UpdateEquipmentDto) => {
    loading.value = true
    error.value = null
    try {
      const response = await EquipmentApiService.updateEquipment(id, equipmentData)
      const index = equipment.value.findIndex(e => e.id === id)
      if (index !== -1)
        equipment.value[index] = response.data

      if (currentEquipment.value?.id === id)
        currentEquipment.value = response.data

      return response.data
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error updating equipment'
      console.error('Error updating equipment:', err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const deleteEquipment = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      await EquipmentApiService.deleteEquipment(id)
      equipment.value = equipment.value.filter(e => e.id !== id)
      if (currentEquipment.value?.id === id)
        currentEquipment.value = null
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error deleting equipment'
      console.error('Error deleting equipment:', err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const setPage = (page: number) => {
    pagination.value.current_page = page
  }

  const setItemsPerPage = (itemsPerPage: number) => {
    pagination.value.per_page = itemsPerPage
  }

  const clearError = () => {
    error.value = null
  }

  const reset = () => {
    equipment.value = []
    currentEquipment.value = null
    loading.value = false
    error.value = null
    pagination.value = {
      current_page: 1,
      last_page: 1,
      per_page: 10,
      total: 0,
    }
  }

  return {
    // State
    equipment,
    currentEquipment,
    loading,
    error,
    pagination,

    // Getters
    equipmentList,
    isLoading,
    hasError,
    currentEquipmentData,

    // Actions
    fetchEquipment,
    fetchEquipmentItem,
    createEquipment,
    updateEquipment,
    deleteEquipment,
    setPage,
    setItemsPerPage,
    clearError,
    reset,
  }
})
