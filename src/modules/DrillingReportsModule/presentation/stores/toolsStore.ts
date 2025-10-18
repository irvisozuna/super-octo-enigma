/**
 * Tools Store for Drilling Reports Module
 * Manages tools data and operations
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { DrillingReportApiService } from '../../infrastructure/api/services/DrillingReportApiService'

export interface Tool {
  id: string
  name: string
  type: string
  model?: string
  serial_number?: string
  status: string
  condition: string
  last_maintenance?: string
  next_maintenance?: string
  created_at: string
  updated_at: string
}

export interface ToolsPagination {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export const useToolsStore = defineStore('drillingTools', () => {
  // State
  const tools = ref<Tool[]>([])
  const currentTool = ref<Tool | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const pagination = ref<ToolsPagination>({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  })

  // Getters
  const toolsList = computed(() => tools.value)
  const isLoading = computed(() => loading.value)
  const hasError = computed(() => !!error.value)
  const currentToolData = computed(() => currentTool.value)

  // Actions
  const fetchTools = async (params: any = {}) => {
    loading.value = true
    error.value = null
    try {
      const response = await DrillingReportApiService.getTools(params)

      tools.value = response.data || response
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
      const response = await DrillingReportApiService.getAvailableTools(params)

      tools.value = response.data || response
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
      const tool = await DrillingReportApiService.getTool(id)

      currentTool.value = tool

      return tool
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

  const createTool = async (toolData: Partial<Tool>) => {
    loading.value = true
    error.value = null
    try {
      const newTool = await DrillingReportApiService.createTool(toolData)

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

  const updateTool = async (id: string, toolData: Partial<Tool>) => {
    loading.value = true
    error.value = null
    try {
      const updatedTool = await DrillingReportApiService.updateTool(id, toolData)
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
      await DrillingReportApiService.deleteTool(id)
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
      per_page: 10,
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

    // Getters
    toolsList,
    isLoading,
    hasError,
    currentToolData,

    // Actions
    fetchTools,
    fetchAvailableTools,
    fetchTool,
    createTool,
    updateTool,
    deleteTool,
    clearError,
    reset,
  }
})
