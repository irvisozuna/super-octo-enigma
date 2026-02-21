import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import type { Document, Personnel, Project, StatusHistory, Well } from '../../domain/types'
import { DrillingReportApiService } from '../../infrastructure/api/services/DrillingReportApiService'
import { useWellsStore } from './wellsStore'
import { useDocumentsStore } from './documentsStore'

/**
 * Store centralizado para gestionar el detalle de un proyecto
 * Evita duplicación de estado y centraliza la lógica de negocio
 * Incluye métodos para gestionar costos del proyecto
 */
export const useProjectDetailStore = defineStore('projectDetail', () => {
  // ========== STATE ==========

  // Datos principales
  const currentProject = ref<Project | null>(null)
  const currentWell = ref<Well | null>(null)
  const projectPersonnel = ref<Personnel[]>([])
  const projectDocuments = ref<Document[]>([])
  const statusHistory = ref<StatusHistory[]>([])
  const historySummary = ref<any>(null)

  // Estados de carga centralizados
  const loadingStates = reactive({
    project: false,
    well: false,
    personnel: false,
    documents: false,
    reports: false,
    costs: false,
    equipment: false,
    history: false,
  })

  // Estados de error centralizados
  const errors = reactive<Record<string, Error | null>>({
    project: null,
    well: null,
    personnel: null,
    documents: null,
    reports: null,
    costs: null,
    equipment: null,
    history: null,
  })

  // Cache de datos por tab para evitar recargas innecesarias
  const tabDataCache = reactive<Record<string, any>>({
    reports: null,
    costs: null,
    equipment: null,
    statistics: null,
  })

  // Timestamps de última carga para cache invalidation
  const lastLoadTimestamps = reactive<Record<string, number>>({})

  // ========== GETTERS ==========

  /**
   * Estado del proyecto actual
   */
  const projectStatus = computed(() => currentProject.value?.status || null)

  /**
   * Estados del proyecto computados
   */
  const isPlanned = computed(() => projectStatus.value === 'planned')
  const isActive = computed(() => projectStatus.value === 'active')
  const isCompleted = computed(() => projectStatus.value === 'completed')
  const isCancelled = computed(() => projectStatus.value === 'cancelled')
  const isSuspended = computed(() => projectStatus.value === 'suspended')

  /**
   * Verificar si el proyecto puede ser editado
   */
  const canEdit = computed(() =>
    !isCompleted.value && !isCancelled.value,
  )

  /**
   * Verificar si se pueden crear reportes
   */
  const canCreateReports = computed(() =>
    isActive.value || isSuspended.value,
  )

  /**
   * Verificar si se pueden agregar costos
   */
  const canAddCosts = computed(() =>
    isActive.value || isSuspended.value,
  )

  /**
   * Personal del proyecto transformado para UI
   */
  const personnelForDisplay = computed(() => {
    return projectPersonnel.value.map(p => ({
      id: p.employee?.id || p.id,
      name: p.employee?.full_name || p.name || 'N/A',
      position: mapRoleToPosition(p.role),
      role: p.role,
      assignedDate: p.assigned_date,
      avatar: p.employee?.avatar,
    }))
  })

  /**
   * Gerente del proyecto
   */
  const projectManager = computed(() => {
    const manager = projectPersonnel.value.find(
      p => p.role === 'drilling_engineer' || p.role === 'project_manager',
    )

    if (manager) {
      return {
        id: manager.employee?.id,
        name: manager.employee?.full_name,
        position: 'Gerente de Proyecto',
        avatar: manager.employee?.avatar,
      }
    }

    return null
  })

  // ========== ACTIONS ==========

  /**
   * Cargar proyecto completo
   */
  async function loadProject(projectId: string) {
    loadingStates.project = true
    errors.project = null

    try {
      const response = await DrillingReportApiService.getProject(projectId)

      currentProject.value = response.data

      // Actualizar timestamp de carga
      lastLoadTimestamps.project = Date.now()

      return currentProject.value
    }
    catch (error) {
      errors.project = error as Error
      throw error
    }
    finally {
      loadingStates.project = false
    }
  }

  /**
   * Cargar pozo del proyecto
   */
  async function loadProjectWell(projectId: string) {
    const wellsStore = useWellsStore()

    loadingStates.well = true
    errors.well = null

    try {
      const response = await wellsStore.fetchWellsByProject(projectId)
      const wells = response?.data || response || []

      if (wells.length > 0)
        currentWell.value = mapWellData(wells[0])
      else
        currentWell.value = null

      lastLoadTimestamps.well = Date.now()

      return currentWell.value
    }
    catch (error) {
      errors.well = error as Error
      currentWell.value = null
    }
    finally {
      loadingStates.well = false
    }
  }

  /**
   * Cargar personal del proyecto
   */
  async function loadProjectPersonnel(projectId: string) {
    loadingStates.personnel = true
    errors.personnel = null

    try {
      const response = await DrillingReportApiService.getProjectPersonnel(projectId)

      projectPersonnel.value = response.data || []
      lastLoadTimestamps.personnel = Date.now()

      return projectPersonnel.value
    }
    catch (error) {
      errors.personnel = error as Error
      projectPersonnel.value = []
    }
    finally {
      loadingStates.personnel = false
    }
  }

  /**
   * Cargar documentos del proyecto
   */
  async function loadProjectDocuments(projectId: string) {
    const documentsStore = useDocumentsStore()

    loadingStates.documents = true
    errors.documents = null

    try {
      const docs = await documentsStore.fetchDocumentsByEntity('project', projectId)

      projectDocuments.value = docs || []
      lastLoadTimestamps.documents = Date.now()

      return projectDocuments.value
    }
    catch (error) {
      errors.documents = error as Error
      projectDocuments.value = []
    }
    finally {
      loadingStates.documents = false
    }
  }

  /**
   * Cargar datos de un tab específico
   */
  async function loadTabData(tab: string, projectId: string, forceReload = false) {
    // Cache check - no recargar si los datos son recientes (5 minutos)
    const cacheTime = 5 * 60 * 1000 // 5 minutos
    const lastLoad = lastLoadTimestamps[tab] || 0
    const now = Date.now()

    if (!forceReload && tabDataCache[tab] && (now - lastLoad) < cacheTime)
      return tabDataCache[tab]

    loadingStates[tab] = true
    errors[tab] = null

    try {
      let data = null

      switch (tab) {
        case 'reports':

          const reportsResponse = await DrillingReportApiService.getReports({
            project_id: projectId,
            per_page: 250,
          })

          data = Array.isArray(reportsResponse?.data)
            ? reportsResponse.data
            : (reportsResponse?.data?.data || [])
          break

        case 'costs':
        case 'budget':
          const costsResponse = await DrillingReportApiService.getProjectCosts(projectId, {})

          data = Array.isArray(costsResponse?.data)
            ? costsResponse.data
            : (costsResponse?.data?.data || [])
          break

        case 'equipment':

          const equipmentResponse = await DrillingReportApiService.getProjectEquipment(projectId)

          data = equipmentResponse?.data || []
          break

        case 'personnel':

          const personnelResponse = await DrillingReportApiService.getProjectPersonnel(projectId, { active: true })

          data = Array.isArray(personnelResponse?.data)
            ? personnelResponse.data
            : (personnelResponse?.data?.data || [])
          break

        case 'tools':

          const toolsResponse = await DrillingReportApiService.getTools({ project_id: projectId })

          data = Array.isArray(toolsResponse?.data)
            ? toolsResponse.data
            : (toolsResponse?.data?.data || [])
          break

        case 'documents':
          const documentsResponse = await DrillingReportApiService.getProjectDocuments(projectId)

          projectDocuments.value = documentsResponse?.data || []
          data = projectDocuments.value
          break

        case 'history':
          const historyResponse = await DrillingReportApiService.getProjectStatusHistory(projectId)

          statusHistory.value = historyResponse?.data || []
          historySummary.value = historyResponse?.summary || null
          data = { history: statusHistory.value, summary: historySummary.value }
          break

        case 'statistics':
          const statisticsResponse = await DrillingReportApiService.getProjectStatistics(projectId)

          data = statisticsResponse?.data || null
          break
      }

      tabDataCache[tab] = data
      lastLoadTimestamps[tab] = Date.now()

      return data
    }
    catch (error) {
      errors[tab] = error as Error
      tabDataCache[tab] = null
      throw error
    }
    finally {
      loadingStates[tab] = false
    }
  }

  /**
   * Actualizar proyecto
   */
  async function updateProject(projectId: string, data: any) {
    const response = await DrillingReportApiService.updateProject(projectId, data)

    currentProject.value = response.data

    return currentProject.value
  }

  /**
   * Eliminar proyecto
   */
  async function deleteProject(projectId: string) {
    await DrillingReportApiService.deleteProject(projectId)
    $reset()
  }

  /**
   * Cambiar estado del proyecto
   */
  async function changeProjectStatus(
    projectId: string,
    action: 'start' | 'suspend' | 'resume' | 'complete' | 'cancel',
    data?: any,
  ) {
    const actions = {
      start: DrillingReportApiService.startProject,
      suspend: DrillingReportApiService.suspendProject,
      resume: DrillingReportApiService.resumeProject,
      complete: DrillingReportApiService.completeProject,
      cancel: DrillingReportApiService.cancelProject,
    }

    const response = await actions[action](projectId, data)

    currentProject.value = response.data

    return currentProject.value
  }

  /**
   * Invalidar cache de un tab
   */
  function invalidateTabCache(tab: string) {
    delete tabDataCache[tab]
    delete lastLoadTimestamps[tab]
  }

  /**
   * Resetear el store
   */
  function $reset() {
    currentProject.value = null
    currentWell.value = null
    projectPersonnel.value = []
    projectDocuments.value = []
    statusHistory.value = []
    historySummary.value = null

    Object.keys(loadingStates).forEach(key => {
      loadingStates[key] = false
    })

    Object.keys(errors).forEach(key => {
      errors[key] = null
    })

    Object.keys(tabDataCache).forEach(key => {
      delete tabDataCache[key]
    })

    Object.keys(lastLoadTimestamps).forEach(key => {
      delete lastLoadTimestamps[key]
    })
  }

  /**
   * Agregar costo al proyecto
   */
  async function addProjectCost(projectId: string, costData: {
    cost_type: string
    category: string
    description: string
    amount: number
    date: string
    currency: string
    vendor?: string
    reference_number?: string
    notes?: string
  }) {
    try {
      const response = await DrillingReportApiService.addProjectCost(projectId, costData)

      // Invalidar cache de costs/budget para forzar recarga
      tabDataCache.costs = null
      tabDataCache.budget = null
      delete lastLoadTimestamps.costs
      delete lastLoadTimestamps.budget

      return response.data
    }
    catch (error) {
      console.error('Error adding project cost:', error)
      throw error
    }
  }

  /**
   * Actualizar un costo del proyecto
   */
  async function updateProjectCost(projectId: string, costId: string, costData: {
    cost_type?: string
    category?: string
    description?: string
    amount?: number
    date?: string
    currency?: string
    vendor?: string
    reference_number?: string
    notes?: string
  }) {
    try {
      const response = await DrillingReportApiService.updateProjectCost(projectId, costId, costData)

      // Invalidar cache de costs/budget para forzar recarga
      tabDataCache.costs = null
      tabDataCache.budget = null
      delete lastLoadTimestamps.costs
      delete lastLoadTimestamps.budget

      return response.data
    }
    catch (error) {
      console.error('Error updating project cost:', error)
      throw error
    }
  }

  /**
   * Eliminar un costo del proyecto
   */
  async function deleteProjectCost(projectId: string, costId: string) {
    try {
      await DrillingReportApiService.deleteProjectCost(projectId, costId)

      // Invalidar cache de costs/budget para forzar recarga
      tabDataCache.costs = null
      tabDataCache.budget = null
      delete lastLoadTimestamps.costs
      delete lastLoadTimestamps.budget

      return true
    }
    catch (error) {
      console.error('Error deleting project cost:', error)
      throw error
    }
  }

  /**
   * Crear reporte de perforación
   */
  async function createReport(projectId: string, reportData: any) {
    try {
      const response = await DrillingReportApiService.createReport(reportData)

      // Invalidar cache de reports para forzar recarga
      tabDataCache.reports = null
      delete lastLoadTimestamps.reports

      return response.data
    }
    catch (error) {
      console.error('Error creating report:', error)
      throw error
    }
  }

  // ========== HELPERS ==========

  /**
   * Mapear rol a posición en español
   */
  function mapRoleToPosition(role: string): string {
    const roleMap: Record<string, string> = {
      project_manager: 'Gerente de Proyecto',
      drilling_engineer: 'Ingeniero de Perforación',
      operator: 'Operador',
      supervisor: 'Supervisor',
      helper: 'Ayudante',
      technician: 'Técnico',
      safety_officer: 'Oficial de Seguridad',
    }

    return roleMap[role] || role || 'Sin rol'
  }

  /**
   * Mapear datos de pozo del backend al frontend
   */
  function mapWellData(backendWell: any): Well {
    const mappedWellType = mapWellType(backendWell.well_type)

    return {
      id: backendWell.id,
      name: backendWell.well_name,
      well_number: backendWell.well_number,
      project_id: backendWell.project_id,
      project_name: currentProject.value?.project_name || '',
      status: backendWell.status,
      well_type: mappedWellType,
      depth_planned: backendWell.depth?.planned_meters || 0,
      depth_actual: backendWell.depth?.current_meters || 0,
      depth_remaining: backendWell.depth?.remaining_meters || 0,
      progress_percentage: backendWell.depth?.progress_percentage || 0,
      diameter: backendWell.hole_diameter_inches,
      coordinates: {
        latitude: backendWell.surface_coordinates?.latitude || 0,
        longitude: backendWell.surface_coordinates?.longitude || 0,
      },
      bottom_coordinates: backendWell.bottom_coordinates || null,
      start_date: backendWell.dates?.spud_date,
      completion_date: backendWell.dates?.completion_date,
      purpose: backendWell.purpose,
      statistics: backendWell.statistics || {},
      drilling_sections: backendWell.drilling_sections || [],
      lithology_logs: backendWell.lithology_logs || [],
      equipment_usage: backendWell.equipment_usage || [],
      created_at: backendWell.timestamps?.created_at || '',
      updated_at: backendWell.timestamps?.updated_at || '',
    }
  }

  /**
   * Mapear tipo de pozo
   */
  function mapWellType(backendType: string): 'exploration' | 'production' | 'injection' | 'monitoring' {
    const typeMap: Record<string, any> = {
      vertical: 'exploration',
      horizontal: 'exploration',
      directional: 'exploration',
      exploration: 'exploration',
      production: 'production',
      injection: 'injection',
      monitoring: 'monitoring',
    }

    return typeMap[backendType] || 'exploration'
  }

  /**
   * Asignar un pozo existente al proyecto
   */
  const assignWellToProject = async (projectId: string, wellId: string, notes?: string) => {
    loadingStates.well = true
    errors.well = null
    try {
      await DrillingReportApiService.addWellToProject(projectId, {
        well_id: wellId,
        assignment_date: new Date().toISOString().split('T')[0],
        notes: notes || '',
      })

      // Recargar datos del proyecto para reflejar el cambio
      await loadProject(projectId)
    }
    catch (err: any) {
      errors.well = err
      console.error('Error assigning well to project:', err)
      throw err
    }
    finally {
      loadingStates.well = false
    }
  }

  /**
   * Asignar personal al proyecto
   */
  const assignPersonnelToProject = async (projectId: string, data: {
    employee_id: string
    role: string
    assignment_date: string
    hourly_rate?: number
    estimated_hours?: number
    notes?: string
  }) => {
    console.log('🔵 projectDetailStore.assignPersonnelToProject called with:', { projectId, data })
    loadingStates.personnel = true
    errors.personnel = null
    try {
      console.log('🔵 Calling DrillingReportApiService.assignPersonnel...')
      await DrillingReportApiService.assignPersonnel(projectId, data)
      console.log('✅ DrillingReportApiService.assignPersonnel successful')

      // Recargar datos del proyecto para reflejar el cambio
      console.log('🔵 Reloading project data...')
      await loadProject(projectId)
      console.log('✅ Project data reloaded')
    }
    catch (err: any) {
      console.error('❌ Error in assignPersonnelToProject:', err)
      errors.personnel = err
      console.error('Error assigning personnel to project:', err)
      throw err
    }
    finally {
      loadingStates.personnel = false
    }
  }

  // ========== REPORT STATUS MANAGEMENT ==========

  /**
   * Completar reporte (cambiar a "pending_approval")
   */
  const completeReport = async (projectId: string, reportId: string) => {
    loadingStates.reports = true
    errors.reports = null
    try {
      await DrillingReportApiService.completeReport(projectId, reportId)

      // Invalidar cache de reportes para recargar
      invalidateTabCache('reports')
    }
    catch (err: any) {
      errors.reports = err
      throw err
    }
    finally {
      loadingStates.reports = false
    }
  }

  /**
   * Aprobar reporte (cambiar a "approved")
   */
  const approveReport = async (projectId: string, reportId: string) => {
    loadingStates.reports = true
    errors.reports = null
    try {
      await DrillingReportApiService.approveReport(projectId, reportId)

      // Invalidar cache de reportes para recargar
      invalidateTabCache('reports')
    }
    catch (err: any) {
      errors.reports = err
      throw err
    }
    finally {
      loadingStates.reports = false
    }
  }

  /**
   * Rechazar reporte (cambiar a "rejected")
   */
  const rejectReport = async (projectId: string, reportId: string) => {
    loadingStates.reports = true
    errors.reports = null
    try {
      await DrillingReportApiService.rejectReport(projectId, reportId)

      // Invalidar cache de reportes para recargar
      invalidateTabCache('reports')
    }
    catch (err: any) {
      errors.reports = err
      throw err
    }
    finally {
      loadingStates.reports = false
    }
  }

  // ========== EQUIPMENT MANAGEMENT ==========

  /**
   * Asignar equipo al proyecto
   */
  const assignEquipmentToProject = async (projectId: string, data: {
    equipment_id: string
    notes?: string
  }) => {
    loadingStates.equipment = true
    errors.equipment = null
    try {
      console.log('🔵 projectDetailStore.assignEquipmentToProject called with:', { projectId, data })

      // Importar EquipmentApiService dinámicamente para evitar dependencias circulares
      const { EquipmentApiService } = await import('../../infrastructure/api/services/EquipmentApiService')

      console.log('🔵 Calling EquipmentApiService.assignToProject...')

      const result = await EquipmentApiService.assignToProject(data.equipment_id, projectId, data.notes)

      console.log('🔵 EquipmentApiService.assignToProject result:', result)

      // Invalidar cache de equipos para recargar
      invalidateTabCache('equipment')

      console.log('✅ Equipment assigned successfully')
    }
    catch (err: any) {
      console.error('❌ Error in assignEquipmentToProject:', err)
      console.error('❌ Error details:', {
        message: err.message,
        status: err.status,
        response: err.response,
      })
      errors.equipment = err
      throw err
    }
    finally {
      loadingStates.equipment = false
    }
  }

  /**
   * Desasignar equipo del proyecto
   */
  const unassignEquipmentFromProject = async (projectId: string, data: {
    equipment_id: string
    notes?: string
  }) => {
    loadingStates.equipment = true
    errors.equipment = null
    try {
      console.log('🔵 projectDetailStore.unassignEquipmentFromProject called with:', { projectId, data })

      // Importar EquipmentApiService dinámicamente para evitar dependencias circulares
      const { EquipmentApiService } = await import('../../infrastructure/api/services/EquipmentApiService')

      await EquipmentApiService.unassignFromProject(data.equipment_id, data.notes)

      // Invalidar cache de equipos para recargar
      invalidateTabCache('equipment')

      console.log('✅ Equipment unassigned successfully')
    }
    catch (err: any) {
      console.error('❌ Error in unassignEquipmentFromProject:', err)
      errors.equipment = err
      throw err
    }
    finally {
      loadingStates.equipment = false
    }
  }

  return {
    // State
    currentProject,
    currentWell,
    projectPersonnel,
    projectDocuments,
    statusHistory,
    historySummary,
    loadingStates,
    errors,
    tabDataCache,

    // Getters
    projectStatus,
    isPlanned,
    isActive,
    isCompleted,
    isCancelled,
    isSuspended,
    canEdit,
    canCreateReports,
    canAddCosts,
    personnelForDisplay,
    projectManager,

    // Actions
    loadProject,
    loadProjectWell,
    loadProjectPersonnel,
    loadProjectDocuments,
    loadTabData,
    updateProject,
    deleteProject,
    changeProjectStatus,
    addProjectCost,
    updateProjectCost,
    deleteProjectCost,
    createReport,
    assignWellToProject,
    assignPersonnelToProject,
    completeReport,
    approveReport,
    rejectReport,
    assignEquipmentToProject,
    unassignEquipmentFromProject,
    invalidateTabCache,
    $reset,
  }
})
