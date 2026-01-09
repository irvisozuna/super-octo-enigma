/**
 * Contract Store - Presentation Layer
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { contractContainer } from '../../config/container'
import type { ContractEntity } from '../../domain/entities/ContractEntity'

export const useContractsStore = defineStore('contracts', () => {
  // State
  const items = ref<ContractEntity[]>([])
  const currentItem = ref<ContractEntity | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const pagination = ref({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  })

  // Application Service
  const applicationService = contractContainer.contractApplicationService

  // Actions
  const fetchList = async (filters?: any) => {
    loading.value = true
    error.value = null
    try {
      const response = await applicationService.getContracts(filters)
      items.value = response.data
      pagination.value = {
        current_page: response.meta.current_page,
        last_page: response.meta.last_page,
        per_page: response.meta.per_page,
        total: response.meta.total,
      }
    }
    catch (err: any) {
      error.value = err.message || 'Error loading contracts'
    }
    finally {
      loading.value = false
    }
  }

  const fetchById = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      currentItem.value = await applicationService.getContractById(id)
    }
    catch (err: any) {
      error.value = err.message || 'Error loading contract detail'
    }
    finally {
      loading.value = false
    }
  }

  const updateItem = async (id: string, data: Partial<ContractEntity>) => {
    loading.value = true
    error.value = null
    try {
      const updated = await applicationService.updateContract(id, data)
      if (currentItem.value?.id === id)
        currentItem.value = updated
      
      const index = items.value.findIndex(i => i.id === id)
      if (index !== -1)
        items.value[index] = updated
        
      return updated
    }
    catch (err: any) {
      error.value = err.message || 'Error updating contract'
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
      await applicationService.deleteContract(id)
      items.value = items.value.filter(i => i.id !== id)
      if (currentItem.value?.id === id)
        currentItem.value = null
    }
    catch (err: any) {
      error.value = err.message || 'Error deleting contract'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const fetchCatalogs = async () => {
    try {
      return await applicationService.getCatalogs()
    }
    catch (err: any) {
      error.value = err.message || 'Error loading catalogs'
      return { status: [], systems: [], sectors: [], type_contracts: [] }
    }
  }

  return {
    items,
    currentItem,
    loading,
    error,
    pagination,
    fetchList,
    fetchById,
    updateItem,
    deleteItem,
    fetchCatalogs,
  }
})

export default useContractsStore
