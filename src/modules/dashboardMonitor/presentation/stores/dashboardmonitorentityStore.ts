import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DashboardMonitorEntity } from '../../domain/entities/DashboardMonitorEntity'
import type { CreateDashboardMonitorEntityDTO, UpdateDashboardMonitorEntityDTO } from '../dtos'
import { DashboardMonitorEntityApiService } from '../../infrastructure/api/services/DashboardMonitorEntityApiService'

export const useDashboardMonitorEntityStore = defineStore('dashboardmonitorentity', () => {
  const dashboardmonitorentitys = ref<DashboardMonitorEntity[]>([])
  const currentDashboardMonitorEntity = ref<DashboardMonitorEntity | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const apiService = new DashboardMonitorEntityApiService()

  const getAll = async (): Promise<DashboardMonitorEntity[]> => {
    loading.value = true
    error.value = null
    try {
      dashboardmonitorentitys.value = await apiService.getAll()
      return dashboardmonitorentitys.value
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getById = async (id: string): Promise<DashboardMonitorEntity> => {
    loading.value = true
    error.value = null
    try {
      currentDashboardMonitorEntity.value = await apiService.getById(id)
      return currentDashboardMonitorEntity.value
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    } finally {
      loading.value = false
    }
  }

  const create = async (data: CreateDashboardMonitorEntityDTO): Promise<DashboardMonitorEntity> => {
    loading.value = true
    error.value = null
    try {
      const newDashboardMonitorEntity = await apiService.create(data)
      dashboardmonitorentitys.value.push(newDashboardMonitorEntity)
      return newDashboardMonitorEntity
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    } finally {
      loading.value = false
    }
  }

  const update = async (id: string, data: UpdateDashboardMonitorEntityDTO): Promise<DashboardMonitorEntity> => {
    loading.value = true
    error.value = null
    try {
      const updatedDashboardMonitorEntity = await apiService.update(id, data)
      const index = dashboardmonitorentitys.value.findIndex(item => item.id === id)
      if (index !== -1) {
        dashboardmonitorentitys.value[index] = updatedDashboardMonitorEntity
      }
      return updatedDashboardMonitorEntity
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    } finally {
      loading.value = false
    }
  }

  const remove = async (id: string): Promise<void> => {
    loading.value = true
    error.value = null
    try {
      await apiService.delete(id)
      dashboardmonitorentitys.value = dashboardmonitorentitys.value.filter(item => item.id !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    } finally {
      loading.value = false
    }
  }

  const search = async (query: string): Promise<DashboardMonitorEntity[]> => {
    loading.value = true
    error.value = null
    try {
      const results = await apiService.search(query)
      return results
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    dashboardmonitorentitys,
    currentDashboardMonitorEntity,
    loading,
    error,
    
    // Actions
    getAll,
    getById,
    create,
    update,
    remove,
    search
  }
})