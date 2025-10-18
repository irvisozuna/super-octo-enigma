/**
 * Projects Composable
 * Provides reactive state and methods for projects management
 */

import { computed } from 'vue'
import { useProjectsStore } from '../stores/projectsStore'

export const useProjects = () => {
  const store = useProjectsStore()

  // State
  const projects = computed(() => store.projects)
  const currentProject = computed(() => store.currentProject)
  const loading = computed(() => store.loading)
  const error = computed(() => store.error)
  const pagination = computed(() => store.pagination)

  // Actions
  const fetchProjects = async (params: any = {}) => {
    await store.fetchProjects(params)
  }

  const fetchProject = async (id: string) => {
    return await store.fetchProject(id)
  }

  const createProject = async (projectData: any) => {
    return await store.createProject(projectData)
  }

  const updateProject = async (id: string, projectData: any) => {
    return await store.updateProject(id, projectData)
  }

  const deleteProject = async (id: string) => {
    await store.deleteProject(id)
  }

  const clearError = () => {
    store.clearError()
  }

  const reset = () => {
    store.reset()
  }

  return {
    // State
    projects,
    currentProject,
    loading,
    error,
    pagination,

    // Store (for direct access)
    projectsStore: store,

    // Actions
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    deleteProject,
    clearError,
    reset,
  }
}
