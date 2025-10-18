/**
 * Projects Store for Drilling Reports Module
 * Manages projects data and operations using standardized data table pattern
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { DrillingReportApiService } from '../../infrastructure/api/services/DrillingReportApiService'
import { useDataTable } from '@/composables/useDataTable'

export interface Project {
  id: string
  name: string
  description?: string
  status: string
  start_date: string
  end_date?: string
  client_id?: string
  client_name?: string
  created_at: string
  updated_at: string
}

export const useProjectsStore = defineStore('drillingProjects', () => {
  // Use standardized data table composable
  const {
    items: projects,
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
  } = useDataTable<Project>(10)

  const currentProject = ref<Project | null>(null)
  const projectPersonnel = ref<any[]>([])
  const loadingPersonnel = ref(false)

  // Actions
  const fetchProjects = async (params: any = {}) => {
    loading.value = true
    error.value = null
    try {
      const response = await DrillingReportApiService.getProjects(params)

      updateState(response)
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error fetching projects'
      console.error('Error fetching projects:', err)
    }
    finally {
      loading.value = false
    }
  }

  const fetchProject = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      const project = await DrillingReportApiService.getProject(id)

      currentProject.value = project

      return project
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error fetching project'
      console.error('Error fetching project:', err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const createProject = async (projectData: Partial<Project>) => {
    console.log('🏪 Store: createProject llamado con:', projectData)
    loading.value = true
    error.value = null
    try {
      return await DrillingReportApiService.createProject(projectData)
    }
    catch (err: any) {
      console.error('🏪 Store: Error en createProject:', err)
      error.value = err.response?.data?.message || 'Error creating project'
      console.error('Error creating project:', err)
      throw err
    }
    finally {
      loading.value = false
      console.log('🏪 Store: Loading terminado')
    }
  }

  const updateProject = async (id: string, projectData: Partial<Project>) => {
    loading.value = true
    error.value = null
    try {
      const updatedProject = await DrillingReportApiService.updateProject(id, projectData)
      const index = projects.value.findIndex(p => p.id === id)
      if (index !== -1)
        projects.value[index] = updatedProject

      if (currentProject.value?.id === id)
        currentProject.value = updatedProject

      return updatedProject
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error updating project'
      console.error('Error updating project:', err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const deleteProject = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      await DrillingReportApiService.deleteProject(id)
      projects.value = projects.value.filter(p => p.id !== id)
      if (currentProject.value?.id === id)
        currentProject.value = null
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error deleting project'
      console.error('Error deleting project:', err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  const fetchProjectPersonnel = async (projectId: string) => {
    loadingPersonnel.value = true
    error.value = null
    try {
      const response = await DrillingReportApiService.getProjectPersonnel(projectId, { active: true })

      projectPersonnel.value = response?.data || response || []
      console.log('👥 Personnel loaded:', projectPersonnel.value)

      return projectPersonnel.value
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error fetching project personnel'
      console.error('Error fetching project personnel:', err)
      throw err
    }
    finally {
      loadingPersonnel.value = false
    }
  }

  const removePersonnelFromProject = async (projectId: string, employeeId: string) => {
    loadingPersonnel.value = true
    error.value = null
    try {
      await DrillingReportApiService.removePersonnel(projectId, employeeId)
      projectPersonnel.value = projectPersonnel.value.filter(p => p.employee_id !== employeeId)
      console.log('👥 Personnel removed, remaining:', projectPersonnel.value.length)
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error removing personnel from project'
      console.error('Error removing personnel from project:', err)
      throw err
    }
    finally {
      loadingPersonnel.value = false
    }
  }

  const reset = () => {
    projects.value = []
    currentProject.value = null
    projectPersonnel.value = []
    loading.value = false
    loadingPersonnel.value = false
    error.value = null
    resetPagination()
  }

  return {
    // State
    projects,
    currentProject,
    projectPersonnel,
    loading,
    loadingPersonnel,
    error,
    pagination,

    // Computed
    hasItems,
    isEmpty,
    totalItems,

    // Actions
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    deleteProject,
    fetchProjectPersonnel,
    removePersonnelFromProject,
    clearError,
    reset,
    setPage,
    setItemsPerPage,
    resetPagination,
    buildParams,
  }
})
