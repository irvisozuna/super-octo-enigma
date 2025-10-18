/**
 * Wells Composable
 * Provides reactive state and methods for wells management
 */

import { computed } from 'vue'
import { useWellsStore } from '../stores/wellsStore'

export const useWells = () => {
  const store = useWellsStore()

  // State
  const wells = computed(() => store.wells)
  const currentWell = computed(() => store.currentWell)
  const loading = computed(() => store.loading)
  const error = computed(() => store.error)
  const pagination = computed(() => store.pagination)

  // Actions
  const fetchWells = async (params: any = {}) => {
    await store.fetchWells(params)
  }

  const fetchWellsByProject = async (projectId: string, params: any = {}) => {
    await store.fetchWellsByProject(projectId, params)
  }

  const fetchWell = async (id: string) => {
    return await store.fetchWell(id)
  }

  const createWell = async (wellData: any) => {
    return await store.createWell(wellData)
  }

  const updateWell = async (id: string, wellData: any) => {
    return await store.updateWell(id, wellData)
  }

  const deleteWell = async (id: string) => {
    await store.deleteWell(id)
  }

  const clearError = () => {
    store.clearError()
  }

  const reset = () => {
    store.reset()
  }

  return {
    // State
    wells,
    currentWell,
    loading,
    error,
    pagination,

    // Store (for direct access)
    wellsStore: store,

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
}
