/**
 * Tools Store for Drilling Reports Module
 * Manages tools data and operations using standardized data table pattern
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { type Tool, ToolApiService } from '../../infrastructure/api/services/ToolApiService'
import { useDataTable } from '@/composables/useDataTable'

export const useToolsStore = defineStore('drillingTools', () => {
  // Use standardized data table composable
  const {
    items: tools,
    pagination,
    loading,
    error,
    hasItems,
    isEmpty,
    totalItems,
    setPage,
    setItemsPerPage,
    resetPagination,
    updateState,
    buildParams,
  } = useDataTable<Tool>(15)

  const currentTool = ref<Tool | null>(null)

  // Actions
  const fetchTools = async (params: any = {}) => {
    loading.value = true
    error.value = null
    try {
      const response = await ToolApiService.getTools(params)

      updateState(response)
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error fetching tools'
      console.error('Error fetching tools:', err)
    }
    finally {
      loading.value = false
    }
  }

  const fetchAvailableTools = async (params: any = {}) => {
    loading.value = true
    error.value = null
    try {
      const response = await ToolApiService.getAvailableTools(params)

      updateState(response)
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error fetching available tools'
      console.error('Error fetching available tools:', err)
    }
    finally {
      loading.value = false
    }
  }

  const fetchTool = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      const response = await ToolApiService.getToolById(id)

      currentTool.value = response.data

      return response.data
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error fetching tool'
      console.error('Error fetching tool:', err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const createTool = async (toolData: any) => {
    loading.value = true
    error.value = null
    try {
      const response = await ToolApiService.createTool(toolData)
      const newTool = response.data

      tools.value.unshift(newTool)

      return newTool
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error creating tool'
      console.error('Error creating tool:', err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const updateTool = async (id: string, toolData: any) => {
    loading.value = true
    error.value = null
    try {
      const response = await ToolApiService.updateTool(id, toolData)
      const updatedTool = response.data
      const index = tools.value.findIndex(t => t.id === id)
      if (index !== -1)
        tools.value[index] = updatedTool

      if (currentTool.value?.id === id)
        currentTool.value = updatedTool

      return updatedTool
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error updating tool'
      console.error('Error updating tool:', err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const deleteTool = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      await ToolApiService.deleteTool(id)
      tools.value = tools.value.filter(t => t.id !== id)
      if (currentTool.value?.id === id)
        currentTool.value = null
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error deleting tool'
      console.error('Error deleting tool:', err)
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
    tools.value = []
    currentTool.value = null
    loading.value = false
    error.value = null
    pagination.value = {
      current_page: 1,
      last_page: 1,
      per_page: 15,
      total: 0,
    }
  }

  return {
    // State
    tools,
    currentTool,
    loading,
    error,
    pagination,

    // Computed
    hasItems,
    isEmpty,
    totalItems,

    // Actions
    fetchTools,
    fetchAvailableTools,
    fetchTool,
    createTool,
    updateTool,
    deleteTool,
    clearError,
    reset,
    setPage,
    setItemsPerPage,
    resetPagination,
    buildParams,
  }
})
