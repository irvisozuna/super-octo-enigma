/**
 * Wells Store for Drilling Reports Module
 * Manages wells data and operations
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { DrillingReportApiService } from '../../infrastructure/api/services/DrillingReportApiService'

export interface Well {
  id: string
  name: string
  project_id: string
  project_name?: string
  depth: number
  status: string
  location: {
    latitude: number
    longitude: number
    address?: string
  }
  created_at: string
  updated_at: string
}

export interface WellsPagination {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export const useWellsStore = defineStore('drillingWells', () => {
  // State
  const wells = ref<Well[]>([])
  const currentWell = ref<Well | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const pagination = ref<WellsPagination>({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  })

  // Getters
  const wellsList = computed(() => wells.value)
  const isLoading = computed(() => loading.value)
  const hasError = computed(() => !!error.value)
  const currentWellData = computed(() => currentWell.value)

  // Actions
  const fetchWells = async (params: any = {}) => {
    loading.value = true
    error.value = null
    try {
      const response = await DrillingReportApiService.getWells(params)

      wells.value = response.data || response
      if (response.current_page) {
        pagination.value = {
          current_page: response.current_page,
          last_page: response.last_page,
          per_page: response.per_page,
          total: response.total,
        }
      }
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error fetching wells'
      console.error('Error fetching wells:', err)
    }
    finally {
      loading.value = false
    }
  }

  const fetchWellsByProject = async (projectId: string, params: any = {}) => {
    loading.value = true
    error.value = null
    try {
      const response = await DrillingReportApiService.getWellsByProject(projectId, params)

      // console.log('🏪 Store - Full response:', response)
      // console.log('🏪 Store - response.data:', response.data)

      wells.value = response.data || response

      // console.log('🏪 Store - wells.value assigned:', wells.value)

      if (response.current_page) {
        pagination.value = {
          current_page: response.current_page,
          last_page: response.last_page,
          per_page: response.per_page,
          total: response.total,
        }
      }

      // Return the response for direct use in components
      return response
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error fetching wells by project'
      console.error('Error fetching wells by project:', err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const fetchWell = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      const well = await DrillingReportApiService.getWell(id)

      currentWell.value = well

      return well
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error fetching well'
      console.error('Error fetching well:', err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const createWell = async (wellData: Partial<Well>) => {
    loading.value = true
    error.value = null
    try {
      const newWell = await DrillingReportApiService.createWell(wellData)

      wells.value.unshift(newWell)

      return newWell
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error creating well'
      console.error('Error creating well:', err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const updateWell = async (id: string, wellData: Partial<Well>) => {
    loading.value = true
    error.value = null
    try {
      const updatedWell = await DrillingReportApiService.updateWell(id, wellData)
      const index = wells.value.findIndex(w => w.id === id)
      if (index !== -1)
        wells.value[index] = updatedWell

      if (currentWell.value?.id === id)
        currentWell.value = updatedWell

      return updatedWell
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error updating well'
      console.error('Error updating well:', err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const deleteWell = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      await DrillingReportApiService.deleteWell(id)
      wells.value = wells.value.filter(w => w.id !== id)
      if (currentWell.value?.id === id)
        currentWell.value = null
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error deleting well'
      console.error('Error deleting well:', err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  const reset = () => {
    wells.value = []
    currentWell.value = null
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
    wells,
    currentWell,
    loading,
    error,
    pagination,

    // Getters
    wellsList,
    isLoading,
    hasError,
    currentWellData,

    // Actions
    fetchWells,
    fetchWellsByProject,
    fetchWell,
    createWell,
    updateWell,
    deleteWell,
    clearError,
    reset,
  }
})
