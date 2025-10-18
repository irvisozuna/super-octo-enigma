/**
 * Equipment Composable
 * Provides reactive state and methods for equipment management
 */

import { computed } from 'vue'
import { useEquipmentStore } from '../stores/equipmentStore'

export const useEquipment = () => {
  const store = useEquipmentStore()

  // State
  const equipment = computed(() => store.equipment)
  const currentEquipment = computed(() => store.currentEquipment)
  const loading = computed(() => store.loading)
  const error = computed(() => store.error)
  const pagination = computed(() => store.pagination)

  // Actions
  const fetchEquipment = async (params: any = {}) => {
    await store.fetchEquipment(params)
  }

  const fetchEquipmentItem = async (id: string) => {
    return await store.fetchEquipmentItem(id)
  }

  const createEquipment = async (equipmentData: any) => {
    return await store.createEquipment(equipmentData)
  }

  const updateEquipment = async (id: string, equipmentData: any) => {
    return await store.updateEquipment(id, equipmentData)
  }

  const deleteEquipment = async (id: string) => {
    await store.deleteEquipment(id)
  }

  const clearError = () => {
    store.clearError()
  }

  const reset = () => {
    store.reset()
  }

  return {
    // State
    equipment,
    currentEquipment,
    loading,
    error,
    pagination,

    // Store (for direct access)
    equipmentStore: store,

    // Actions
    fetchEquipment,
    fetchEquipmentItem,
    createEquipment,
    updateEquipment,
    deleteEquipment,
    clearError,
    reset,
  }
}
