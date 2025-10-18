/**
 * Tools Composable
 * Provides reactive state and methods for tools management
 */

import { computed } from 'vue'
import { useToolsStore } from '../stores/toolsStore'

export const useTools = () => {
  const store = useToolsStore()

  // State
  const tools = computed(() => store.toolsList)
  const currentTool = computed(() => store.currentToolData)
  const loading = computed(() => store.isLoading)
  const error = computed(() => store.hasError)
  const pagination = computed(() => store.pagination)

  // Actions
  const fetchTools = async (params: any = {}) => {
    await store.fetchTools(params)
  }

  const fetchAvailableTools = async (params: any = {}) => {
    await store.fetchAvailableTools(params)
  }

  const fetchTool = async (id: string) => {
    return await store.fetchTool(id)
  }

  const createTool = async (toolData: any) => {
    return await store.createTool(toolData)
  }

  const updateTool = async (id: string, toolData: any) => {
    return await store.updateTool(id, toolData)
  }

  const deleteTool = async (id: string) => {
    await store.deleteTool(id)
  }

  const clearError = () => {
    store.clearError()
  }

  const reset = () => {
    store.reset()
  }

  return {
    // State
    tools,
    currentTool,
    loading,
    error,
    pagination,

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
}
