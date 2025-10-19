<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useProjectsStore } from '../stores/projectsStore'
import { useWellsStore } from '../stores/wellsStore'
import { useDocumentsStore } from '../stores/documentsStore'
import { DrillingReportApiService } from '../../infrastructure/api/services/DrillingReportApiService'
import { EquipmentApiService } from '../../infrastructure/api/services/EquipmentApiService'
import type { Well } from '../../domain/entities/WellEntity'
import type { Document } from '../../domain/entities/DocumentEntity'

// Components
import ProjectForm from '../components/ProjectForm.vue'
import ProjectBreadcrumbsAtom from '../components/atoms/ProjectBreadcrumbsAtom.vue'
import ProjectStatusBadgeAtom from '../components/atoms/ProjectStatusBadgeAtom.vue'
import ProjectStatusActionsMolecule from '../components/molecules/ProjectStatusActionsMolecule.vue'
import WellInfoCardMolecule from '../components/molecules/WellInfoCardMolecule.vue'
import PersonnelCardMolecule from '../components/molecules/PersonnelCardMolecule.vue'
import BudgetCardMolecule from '../components/molecules/BudgetCardMolecule.vue'
import ProjectOverviewTabOrganism from '../components/organisms/ProjectOverviewTabOrganism.vue'
import ProjectDocumentsTabOrganism from '../components/organisms/ProjectDocumentsTabOrganism.vue'
import ProjectReportsTabOrganism from '../components/organisms/ProjectReportsTabOrganism.vue'
import ProjectCostsTabOrganism from '../components/organisms/ProjectCostsTabOrganism.vue'
import ProjectEquipmentTabOrganism from '../components/organisms/ProjectEquipmentTabOrganism.vue'
import ProjectStatisticsTabOrganism from '../components/organisms/ProjectStatisticsTabOrganism.vue'
import ProjectHistoryTabOrganism from '../components/organisms/ProjectHistoryTabOrganism.vue'
import ProjectStatusDialogsOrganism from '../components/organisms/ProjectStatusDialogsOrganism.vue'
import AssignPersonnelDialogOrganism from '../components/organisms/AssignPersonnelDialogOrganism.vue'
import PersonnelListDialogOrganism from '../components/organisms/PersonnelListDialogOrganism.vue'
import WellDetailsDialogOrganism from '../components/organisms/WellDetailsDialogOrganism.vue'

// VERSIÓN LINEAL (Backup disponible en CreateReportDialogOrganism.vue.backup)
// import CreateReportDialogOrganism from '../components/organisms/CreateReportDialogOrganism.vue'

// VERSIÓN WIZARD CON SMART AUTOMATION (ACTIVA)
import CreateReportDialogOrganism from '../components/organisms/CreateReportWizardOrganism.vue'
import AddCostDialogOrganism from '../components/organisms/AddCostDialogOrganism.vue'
import AssignWellDialogOrganism from '../components/organisms/AssignWellDialogOrganism.vue'
import AssignEquipmentDialogOrganism from '../components/organisms/AssignEquipmentDialogOrganism.vue'
import UnassignEquipmentDialogOrganism from '../components/organisms/UnassignEquipmentDialogOrganism.vue'
import DeleteConfirmationDialog from '@/components/shared/DeleteConfirmationDialog.vue'
import { formatDate } from '@/modules/DrillingReportsModule/shared/utils/dateUtils'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const projectsStore = useProjectsStore()
const wellsStore = useWellsStore()
const documentsStore = useDocumentsStore()

// Estado local
const activeTab = ref('overview')
const project = ref(null)
const loading = ref(false)
const showEditDialog = ref(false)
const showDeleteDialog = ref(false)
const deleting = ref(false)

// Status action dialogs
const showStartDialog = ref(false)
const showSuspendDialog = ref(false)
const showResumeDialog = ref(false)
const showCompleteDialog = ref(false)
const showCancelDialog = ref(false)
const statusActionLoading = ref(false)

// Well data
const currentWell = ref<Well | null>(null)
const loadingWell = ref(false)
const showAssignWellDialog = ref(false)
const assigningWell = ref(false)

// Personnel data (moved to store - projectsStore.projectPersonnel)
const projectManager = ref<any | null>(null)

// Documents data
const projectDocuments = ref<Document[]>([])
const loadingDocuments = ref(false)

// Reports data
const projectReports = ref<any[]>([])
const loadingReports = ref(false)
const showCreateReportDialog = ref(false)
const creatingReport = ref(false)

// Costs data
const projectCosts = ref<any[]>([])
const loadingCosts = ref(false)
const showAddCostDialog = ref(false)
const addingCost = ref(false)

// Equipment data
const projectEquipment = ref<any[]>([])
const loadingEquipment = ref(false)
const showAssignEquipmentDialog = ref(false)
const assigningEquipment = ref(false)
const assignEquipmentError = ref<string | null>(null)
const assignEquipmentDialogRef = ref()
const projectEquipmentTabRef = ref()

// Unassign equipment dialog
const showUnassignEquipmentDialog = ref(false)
const selectedEquipmentForUnassign = ref<any>(null)
const unassignEquipmentDialogRef = ref()

// History data
const statusHistory = ref<any[]>([])
const historySummary = ref<any>(null)
const loadingHistory = ref(false)

// Recent activities (mock data for now)
const recentActivities = ref([
  {
    id: '1',
    description: 'Reporte diario de perforación subido',
    created_at: new Date().toISOString(),
    color: 'primary',
  },
  {
    id: '2',
    description: 'Personal asignado al proyecto',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    color: 'success',
  },
  {
    id: '3',
    description: 'Presupuesto actualizado',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    color: 'warning',
  },
])

// Computed
const projectId = computed(() => route.params.id as string)

// Project status computed
const projectStatus = computed(() => project.value?.data?.status || project.value?.status)
const isPlanned = computed(() => projectStatus.value === 'planned')
const isActive = computed(() => projectStatus.value === 'active')
const isCompleted = computed(() => projectStatus.value === 'completed')
const isCancelled = computed(() => projectStatus.value === 'cancelled')

// Transform personnel data from store for PersonnelCardMolecule
const projectPersonnelForCard = computed(() => {
  return projectsStore.projectPersonnel.map((p: any) => ({
    id: p.employee?.id || p.id,
    name: p.employee?.full_name || p.name || 'N/A',
    position: p.role === 'project_manager'
      ? 'Gerente de Proyecto'
      : p.role === 'operator'
        ? 'Operador'
        : p.role === 'supervisor'
          ? 'Supervisor'
          : p.role === 'helper'
            ? 'Ayudante'
            : p.role || 'Sin rol',
    role: p.role,
  }))
})

// Tab counters
const reportsCount = computed(() => project.value?.data?.statistics?.reports_count || 0)
const equipmentCount = computed(() => project.value?.data?.statistics?.equipment_count || 0)
const documentsCount = computed(() => projectDocuments.value.length)

// Watch for project status changes to redirect to allowed tabs
watch(projectStatus, newStatus => {
  if (newStatus === 'planned') {
    // If project is planned, only allow overview, equipment, and documents tabs
    const allowedTabs = ['overview', 'equipment', 'documents']
    if (!allowedTabs.includes(activeTab.value))
      activeTab.value = 'overview'
  }
}, { immediate: true })

// Watch for tab changes to load data lazily
watch(activeTab, async newTab => {
  console.log('🔄 Tab changed to:', newTab)

  switch (newTab) {
    case 'reports':
      if (projectReports.value.length === 0 && !loadingReports.value) {
        console.log('📊 Loading reports...')
        await loadReports()
      }
      break
    case 'budget':
      if (projectCosts.value.length === 0 && !loadingCosts.value) {
        console.log('💰 Loading costs...')
        await loadCosts()
      }
      break
    case 'equipment':
    // Equipment is loaded by ProjectEquipmentTabOrganism component
      console.log('🔧 Equipment tab activated - data loaded by component')
      break
    case 'statistics':
    // Statistics are computed from existing data, no additional loading needed
      console.log('📈 Statistics tab activated - using existing data')
      break
    case 'history':
      if (statusHistory.value.length === 0 && !loadingHistory.value) {
        console.log('📜 Loading status history...')
        await loadStatusHistory()
      }
      break
    case 'documents':
    // Documents are already loaded on initial page load
      console.log('📄 Documents tab activated - data already loaded')
      break
    case 'overview':
    // Overview uses existing data, no additional loading needed
      console.log('🏠 Overview tab activated - using existing data')
      break
  }
})

// Métodos
const loadProject = async () => {
  if (!projectId.value)
    return

  loading.value = true
  try {
    console.log('Loading project:', projectId.value)
    project.value = await projectsStore.fetchProject(projectId.value)
    console.log('Project loaded:', project.value)

    // Load only essential data on initial load for better performance
    // Other data (reports, costs, equipment, history) will be loaded lazily when user accesses each tab
    await Promise.all([
      loadWellData(),
      loadPersonnel(),
      loadDocuments(),
    ])
  }
  catch (error) {
    console.error('Error loading project:', error)
  }
  finally {
    loading.value = false
  }
}

const loadWellData = async () => {
  if (!projectId.value)
    return

  loadingWell.value = true
  try {
    const response = await wellsStore.fetchWellsByProject(projectId.value)

    console.log('📍 Wells response:', response)

    const wells = response?.data || response

    console.log('📍 Wells array:', wells)

    if (wells && Array.isArray(wells) && wells.length > 0) {
      // Map backend structure to frontend Well entity
      const firstWell = wells[0]

      // Map well_type from backend to frontend enum
      let mappedWellType: 'exploration' | 'production' | 'injection' | 'monitoring' = 'exploration'
      if (firstWell.well_type === 'vertical' || firstWell.well_type === 'horizontal' || firstWell.well_type === 'directional') {
        // Backend uses drilling types, we'll default to 'exploration' for now
        mappedWellType = 'exploration'
      }

      currentWell.value = {
        id: firstWell.id,
        name: firstWell.well_name,
        well_number: firstWell.well_number,
        project_id: firstWell.project_id,
        project_name: project.value?.data?.project_name || '',
        status: firstWell.status,
        well_type: mappedWellType,
        depth_planned: firstWell.depth?.planned_meters || 0,
        depth_actual: firstWell.depth?.current_meters || 0,
        depth_remaining: firstWell.depth?.remaining_meters || 0,
        progress_percentage: firstWell.depth?.progress_percentage || 0,
        diameter: firstWell.hole_diameter_inches,
        coordinates: {
          latitude: firstWell.surface_coordinates?.latitude || 0,
          longitude: firstWell.surface_coordinates?.longitude || 0,
        },
        bottom_coordinates: firstWell.bottom_coordinates
          ? {
              latitude: firstWell.bottom_coordinates.latitude,
              longitude: firstWell.bottom_coordinates.longitude,
            }
          : null,
        start_date: firstWell.dates?.spud_date,
        completion_date: firstWell.dates?.completion_date,
        purpose: firstWell.purpose,
        statistics: {
          drilling_section_count: firstWell.statistics?.drilling_section_count || 0,
          lithology_log_count: firstWell.statistics?.lithology_log_count || 0,
        },
        drilling_sections: firstWell.drilling_sections || [],
        lithology_logs: firstWell.lithology_logs || [],
        equipment_usage: firstWell.equipment_usage || [],
        created_at: firstWell.timestamps?.created_at || '',
        updated_at: firstWell.timestamps?.updated_at || '',
      }
      console.log('📍 Mapped well:', currentWell.value)
    }
    else {
      currentWell.value = null
      console.log('📍 No wells found')
    }
  }
  catch (error) {
    console.error('Error loading well:', error)
    currentWell.value = null
  }
  finally {
    loadingWell.value = false
  }
}

const loadPersonnel = async () => {
  if (!projectId.value)
    return

  try {
    await projectsStore.fetchProjectPersonnel(projectId.value)

    // Find project manager (drilling_engineer or first personnel)
    const personnel = projectsStore.projectPersonnel
    const manager = personnel.find((p: any) => p.role === 'drilling_engineer' || p.role === 'project_manager') || personnel[0]
    if (manager) {
      projectManager.value = {
        id: manager.employee?.id,
        name: manager.employee?.full_name,
        position: 'Gerente de Proyecto',
      }
    }
  }
  catch (error) {
    console.error('Error loading personnel:', error)
  }
}

const loadDocuments = async () => {
  if (!projectId.value)
    return

  loadingDocuments.value = true
  try {
    const docs = await documentsStore.fetchDocumentsByEntity('project', projectId.value)

    projectDocuments.value = docs || []
  }
  catch (error) {
    console.error('Error loading documents:', error)
    projectDocuments.value = []
  }
  finally {
    loadingDocuments.value = false
  }
}

const loadReports = async () => {
  if (!projectId.value || loadingReports.value)
    return

  loadingReports.value = true
  try {
    const response = await DrillingReportApiService.getReports({ project_id: projectId.value })

    // Handle both response.data.data (paginated) and response.data (direct array)
    projectReports.value = Array.isArray(response?.data) ? response.data : (response?.data?.data || [])
  }
  catch (error) {
    console.error('Error loading reports:', error)
    projectReports.value = []
  }
  finally {
    loadingReports.value = false
  }
}

const loadCosts = async () => {
  if (!projectId.value || loadingCosts.value)
    return

  loadingCosts.value = true
  try {
    const response = await DrillingReportApiService.getProjectCosts(projectId.value)

    projectCosts.value = response?.data || []
  }
  catch (error) {
    console.error('Error loading costs:', error)
    projectCosts.value = []
  }
  finally {
    loadingCosts.value = false
  }
}

const loadEquipment = async () => {
  if (!projectId.value)
    return

  loadingEquipment.value = true
  try {
    const response = await DrillingReportApiService.getProjectEquipment?.(projectId.value) || { data: [] }

    projectEquipment.value = response?.data || []
  }
  catch (error) {
    console.error('Error loading equipment:', error)
    projectEquipment.value = []
  }
  finally {
    loadingEquipment.value = false
  }
}

const loadStatusHistory = async () => {
  if (!projectId.value || loadingHistory.value)
    return

  loadingHistory.value = true
  try {
    const response = await DrillingReportApiService.getProjectStatusHistory(projectId.value)

    statusHistory.value = response?.data || []
    historySummary.value = response?.summary || null
  }
  catch (error) {
    console.error('Error loading status history:', error)
    statusHistory.value = []
    historySummary.value = null
  }
  finally {
    loadingHistory.value = false
  }
}

const handleEditProject = () => {
  showEditDialog.value = true
}

const handleDeleteProject = () => {
  showDeleteDialog.value = true
}

const handleProjectUpdate = () => {
  showEditDialog.value = false
  loadProject()
}

const confirmDeleteProject = async () => {
  if (!project.value)
    return

  deleting.value = true
  try {
    await projectsStore.deleteProject(project.value.id)
    router.push({ name: 'drilling-projects' })
  }
  catch (error) {
    console.error('Error deleting project:', error)
  }
  finally {
    deleting.value = false
  }
}

const cancelDeleteProject = () => {
  showDeleteDialog.value = false
}

// Well handlers
const showWellDetailsDialog = ref(false)

const handleViewWellDetails = () => {
  if (currentWell.value)
    showWellDetailsDialog.value = true
}

const confirmAssignWell = async (wellId: string, notes?: string) => {
  assigningWell.value = true
  try {
    await DrillingReportApiService.addWellToProject(projectId.value, {
      well_id: wellId,
      assignment_date: new Date().toISOString().split('T')[0],
      notes: notes || '',
    })
    await loadWellData()
    showAssignWellDialog.value = false
  }
  catch (error) {
    console.error('Error assigning well:', error)
  }
  finally {
    assigningWell.value = false
  }
}

const confirmCreateAndAssignWell = async (wellData: any) => {
  assigningWell.value = true
  try {
    // Backend now handles creation + assignment in one call
    // wellData already includes project_id from AssignWellDialogOrganism
    const createdWell = await DrillingReportApiService.createWell?.(wellData)

    console.log('✅ Well created and assigned successfully:', createdWell)

    await loadWellData()
    showAssignWellDialog.value = false
  }
  catch (error) {
    console.error('❌ Error creating and assigning well:', error)
  }
  finally {
    assigningWell.value = false
  }
}

// Personnel handlers
const showPersonnelListDialog = ref(false)

const handleViewAllPersonnel = () => {
  showPersonnelListDialog.value = true
}

const showAssignPersonnelDialog = ref(false)
const assigningPersonnel = ref(false)
const assignPersonnelError = ref<string | null>(null)
const assignPersonnelDialogRef = ref()

const handleAssignPersonnel = () => {
  assignPersonnelError.value = null // Clear previous errors
  showAssignPersonnelDialog.value = true
}

const confirmAssignPersonnel = async (data: any) => {
  assigningPersonnel.value = true
  assignPersonnelError.value = null

  try {
    await DrillingReportApiService.assignPersonnel(projectId.value, data)
    await loadPersonnel()

    // Call the success method on the dialog to reset and close
    assignPersonnelDialogRef.value?.onSuccess()
  }
  catch (error: any) {
    console.error('❌ Error assigning personnel:', error)
    console.log('📦 Full error object:', error)
    console.log('📦 Error response:', error.response)
    console.log('📦 Error response data:', error.response?.data)
    console.log('📦 Error response status:', error.response?.status)

    // Extract error message from response
    const errorData = error.response?.data
    const statusCode = error.response?.status

    if (errorData && errorData.error) {
      // Backend sent structured error - pass it through
      assignPersonnelError.value = JSON.stringify(errorData)
      console.log('📤 Sending structured error to dialog:', assignPersonnelError.value)
    }
    else if (statusCode === 409) {
      // 409 Conflict - handle specifically
      assignPersonnelError.value = JSON.stringify({
        error: {
          code: 'PERSONNEL_ALREADY_ASSIGNED',
          message: errorData?.message || 'El empleado ya está asignado al proyecto',
          status_code: 409,
        },
      })
      console.log('📤 Sending 409 conflict error to dialog')
    }
    else {
      // Other errors - create generic error object
      assignPersonnelError.value = JSON.stringify({
        error: {
          code: 'UNKNOWN_ERROR',
          message: errorData?.message || error.message || 'Error desconocido al asignar personal',
          status_code: statusCode,
        },
      })
      console.log('📤 Sending generic error to dialog')
    }
  }
  finally {
    assigningPersonnel.value = false
  }
}

// handleRemovePersonnel moved to PersonnelListDialogOrganism

// Document handlers
const handleUploadDocument = async (data: any) => {
  try {
    await documentsStore.uploadDocument(data)
    await loadDocuments()
  }
  catch (error) {
    console.error('Error uploading document:', error)
  }
}

const handleDownloadDocument = (document: Document) => {
  console.log('Download document:', document.id)

  // TODO: Implement download
}

const handleViewDocument = (document: Document) => {
  console.log('View document:', document.id)

  // TODO: Implement view
}

const handleEditDocument = (document: Document) => {
  console.log('Edit document:', document.id)

  // TODO: Implement edit
}

const handleDeleteDocument = async (document: Document) => {
  try {
    await documentsStore.deleteDocument(document.id)
    await loadDocuments()
  }
  catch (error) {
    console.error('Error deleting document:', error)
  }
}

// Other handlers
const handleViewMap = () => {
  console.log('View project location on map')

  // TODO: Implement map view
}

// Equipment handlers
const handleAssignEquipment = () => {
  assignEquipmentError.value = null
  showAssignEquipmentDialog.value = true
}

const handleViewEquipment = (equipment: any) => {
  console.log('View equipment:', equipment.id)

  // TODO: Open equipment details dialog
}

const handleRemoveEquipment = (equipment: any) => {
  selectedEquipmentForUnassign.value = equipment
  showUnassignEquipmentDialog.value = true
}

const handleUnassignSuccess = async () => {
  // Close the dialog
  showUnassignEquipmentDialog.value = false
  selectedEquipmentForUnassign.value = null

  // Reload equipment list in the tab component
  if (projectEquipmentTabRef.value)
    await projectEquipmentTabRef.value.loadEquipment()

  console.log('✅ Equipment unassigned successfully')
}

const confirmAssignEquipment = async (data: any) => {
  assigningEquipment.value = true
  assignEquipmentError.value = null

  try {
    await EquipmentApiService.assignToProject(data.equipment_id, projectId.value, data.notes)

    // Reload equipment list in the tab component
    if (projectEquipmentTabRef.value)
      await projectEquipmentTabRef.value.loadEquipment()

    // Close the dialog and reset form
    showAssignEquipmentDialog.value = false
    assignEquipmentDialogRef.value?.onSuccess()

    // Show success notification
    console.log('✅ Equipment assigned successfully:', data.equipment_name)

    // You can add a toast notification here if you have a notification system
    // For example: showToast('success', `Equipo ${data.equipment_name} asignado exitosamente`)
  }
  catch (error: any) {
    console.error('❌ Error assigning equipment:', error)
    console.log('📦 Error response data:', error.response?.data)

    // Extract error message from response
    const errorData = error.response?.data
    if (errorData) {
      assignEquipmentError.value = JSON.stringify(errorData)
      console.log('📤 Sending equipment error to dialog:', assignEquipmentError.value)
    }
    else {
      assignEquipmentError.value = JSON.stringify({
        error: {
          code: 'UNKNOWN_ERROR',
          message: error.message || 'Error desconocido al asignar equipo',
        },
      })
    }
  }
  finally {
    assigningEquipment.value = false
  }
}

// Report handlers
const handleViewReport = (report: any) => {
  console.log('View report:', report.id)
  router.push({ name: 'drilling-report-detail', params: { id: report.id } })
}

const handleEditReport = (report: any) => {
  console.log('Edit report:', report.id)
  router.push({ name: 'drilling-report-edit', params: { id: report.id } })
}

const handleDeleteReport = async (report: any) => {
  if (!confirm(`¿Estás seguro de eliminar el reporte ${report.report_date}?`))
    return

  try {
    await DrillingReportApiService.deleteReport(report.id)
    await loadReports()
  }
  catch (error) {
    console.error('Error deleting report:', error)
  }
}

const createReportError = ref<string | null>(null)
const createReportDialogRef = ref()

const confirmCreateReport = async (data: any) => {
  if (isPlanned.value) {
    alert('No se pueden crear reportes en un proyecto en estado Planificado. Debe iniciar el proyecto primero.')

    return
  }

  creatingReport.value = true
  createReportError.value = null

  try {
    const newReport = await DrillingReportApiService.createReport(data)

    await loadReports()

    // Call success method to close and reset the wizard
    createReportDialogRef.value?.onSuccess()

    // Navigate to edit the newly created report for further details
    router.push({ name: 'drilling-report-edit', params: { id: newReport.id } })
  }
  catch (error: any) {
    console.error('❌ Error creating report:', error)
    console.log('📦 Error response data:', error.response?.data)

    // Extract error message from response
    const errorData = error.response?.data
    if (errorData) {
      createReportError.value = JSON.stringify(errorData)
      console.log('📤 Sending report error to wizard:', createReportError.value)
    }
    else {
      createReportError.value = JSON.stringify({
        error: {
          code: 'UNKNOWN_ERROR',
          message: error.message || 'Error desconocido al crear el reporte',
        },
      })
    }
  }
  finally {
    creatingReport.value = false
  }
}

// Cost handlers
const handleEditCost = (cost: any) => {
  console.log('Edit cost:', cost.id)

  // TODO: Implement edit cost
}

const handleDeleteCost = async (cost: any) => {
  if (!confirm(`¿Estás seguro de eliminar el costo "${cost.description}"?`))
    return

  try {
    await DrillingReportApiService.deleteCost(cost.id)
    await loadCosts()
  }
  catch (error) {
    console.error('Error deleting cost:', error)
  }
}

const addCostError = ref<string | null>(null)
const addCostDialogRef = ref()

const confirmAddCost = async (data: any) => {
  addingCost.value = true
  addCostError.value = null

  try {
    await DrillingReportApiService.addProjectCost(projectId.value, data)
    await loadCosts()

    // Call the success method on the dialog to reset and close
    addCostDialogRef.value?.onSuccess()
  }
  catch (error: any) {
    console.error('❌ Error adding cost:', error)
    console.log('📦 Error response data:', error.response?.data)

    // Extract error message from response
    const errorData = error.response?.data
    if (errorData) {
      addCostError.value = JSON.stringify(errorData)
      console.log('📤 Sending cost error to dialog:', addCostError.value)
    }
    else {
      addCostError.value = JSON.stringify({
        error: {
          code: 'UNKNOWN_ERROR',
          message: error.message || 'Error desconocido al agregar costo',
        },
      })
    }
  }
  finally {
    addingCost.value = false
  }
}

const handleAddBudgetItem = () => {
  if (isPlanned.value) {
    // Show alert that budget items can't be added to planned projects
    alert('No se pueden agregar gastos a un proyecto en estado Planificado. Debe iniciar el proyecto primero.')

    return
  }
  showAddCostDialog.value = true
}

// Status action handlers
const handleStartProject = async (data: any) => {
  statusActionLoading.value = true
  try {
    await DrillingReportApiService.startProject(projectId.value, data)
    await loadProject()
  }
  catch (error) {
    console.error('Error starting project:', error)
  }
  finally {
    statusActionLoading.value = false
  }
}

const handleSuspendProject = async (data: any) => {
  statusActionLoading.value = true
  try {
    await DrillingReportApiService.suspendProject(projectId.value, data)
    await loadProject()
  }
  catch (error) {
    console.error('Error suspending project:', error)
  }
  finally {
    statusActionLoading.value = false
  }
}

const handleResumeProject = async (data: any) => {
  statusActionLoading.value = true
  try {
    await DrillingReportApiService.resumeProject(projectId.value, data)
    await loadProject()
  }
  catch (error) {
    console.error('Error resuming project:', error)
  }
  finally {
    statusActionLoading.value = false
  }
}

const handleCompleteProject = async (data: any) => {
  statusActionLoading.value = true
  try {
    await DrillingReportApiService.completeProject(projectId.value, data)
    await loadProject()
  }
  catch (error) {
    console.error('Error completing project:', error)
  }
  finally {
    statusActionLoading.value = false
  }
}

const handleCancelProject = async (data: any) => {
  statusActionLoading.value = true
  try {
    await DrillingReportApiService.cancelProject(projectId.value, data)
    await loadProject()
  }
  catch (error) {
    console.error('Error cancelling project:', error)
  }
  finally {
    statusActionLoading.value = false
  }
}

onMounted(() => {
  loadProject()
})
</script>

<template>
  <div class="project-detail">
    <!-- Breadcrumbs -->
    <div class="mb-4">
      <ProjectBreadcrumbsAtom
        :project-name="project?.data?.project_name || project?.project_name"
        :project-code="project?.data?.project_code || project?.project_code"
      />
    </div>

    <VCard>
      <!-- Compact Header -->
      <VCardTitle class="d-flex flex-column flex-md-row align-start align-md-center justify-space-between gap-3 pa-4">
        <div class="d-flex align-center gap-3 flex-grow-1">
          <VAvatar
            color="primary"
            size="48"
            variant="tonal"
          >
            <VIcon
              icon="tabler-folder"
              size="24"
            />
          </VAvatar>
          <div class="flex-grow-1">
            <h4 class="text-h5 mb-1">
              {{ project?.data?.project_name || project?.project_name }}
            </h4>
            <div class="d-flex align-center gap-2 flex-wrap">
              <VChip
                variant="text"
                size="x-small"
                density="compact"
              >
                <VIcon
                  start
                  icon="tabler-hash"
                  size="12"
                />
                {{ project?.data?.project_code || project?.project_code }}
              </VChip>
              <ProjectStatusBadgeAtom
                :status="project?.data?.status || project?.status"
                size="small"
              />
              <span class="text-caption text-medium-emphasis">
                <VIcon
                  icon="tabler-building"
                  size="14"
                  class="me-1"
                />
                {{ project?.data?.client?.business_name || project?.client?.business_name || 'Sin cliente' }}
              </span>
            </div>
          </div>
        </div>
        <div class="d-flex gap-2 flex-wrap align-center">
          <ProjectStatusActionsMolecule
            :status="project?.data?.status || project?.status"
            :loading="statusActionLoading"
            @start="showStartDialog = true"
            @suspend="showSuspendDialog = true"
            @resume="showResumeDialog = true"
            @complete="showCompleteDialog = true"
            @cancel="showCancelDialog = true"
          />
          <VMenu>
            <template #activator="{ props: menuProps }">
              <VBtn
                v-bind="menuProps"
                icon="tabler-dots-vertical"
                variant="text"
                size="small"
              />
            </template>
            <VList density="compact">
              <VListItem
                prepend-icon="tabler-edit"
                title="Editar Proyecto"
                @click="handleEditProject"
              />
              <VDivider />
              <VListItem
                prepend-icon="tabler-trash"
                title="Eliminar Proyecto"
                class="text-error"
                @click="handleDeleteProject"
              />
            </VList>
          </VMenu>
        </div>
      </VCardTitle>

      <VDivider />

      <!-- Compact Well and Personnel Cards -->
      <VCardText class="pa-4">
        <VRow dense>
          <!-- Well Info Card -->
          <VCol
            cols="12"
            md="6"
          >
            <WellInfoCardMolecule
              :well="currentWell"
              :loading="loadingWell"
              @view-details="handleViewWellDetails"
              @assign-well="showAssignWellDialog = true"
              @change-well="showAssignWellDialog = true"
            />
          </VCol>

          <!-- Personnel Card -->
          <VCol
            cols="12"
            md="6"
          >
            <PersonnelCardMolecule
              :personnel="projectPersonnelForCard"
              :manager="projectManager"
              :loading="projectsStore.loadingPersonnel"
              @view-all="handleViewAllPersonnel"
              @assign="handleAssignPersonnel"
            />
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <!-- Enhanced Tabs with Badges -->
      <div class="px-4 pt-3">
        <VTabs
          v-model="activeTab"
          color="primary"
          class="v-tabs-pill"
          show-arrows
        >
          <VTab value="overview">
            <VIcon
              start
              icon="tabler-layout-dashboard"
            />
            Overview
          </VTab>
          <VTab
            v-if="!isPlanned"
            value="reports"
          >
            <VIcon
              start
              icon="tabler-file-text"
            />
            Reportes
            <VChip
              v-if="reportsCount > 0"
              color="primary"
              size="x-small"
              class="ml-2"
            >
              {{ reportsCount }}
            </VChip>
          </VTab>
          <VTab
            v-if="!isPlanned"
            value="budget"
          >
            <VIcon
              start
              icon="tabler-currency-dollar"
            />
            Presupuesto
          </VTab>
          <VTab value="equipment">
            <VIcon
              start
              icon="tabler-tools"
            />
            Equipos
            <VChip
              v-if="equipmentCount > 0"
              color="primary"
              size="x-small"
              class="ml-2"
            >
              {{ equipmentCount }}
            </VChip>
          </VTab>
          <VTab value="documents">
            <VIcon
              start
              icon="tabler-paperclip"
            />
            Documentos
            <VChip
              v-if="documentsCount > 0"
              color="primary"
              size="x-small"
              class="ml-2"
            >
              {{ documentsCount }}
            </VChip>
          </VTab>
          <VTab
            v-if="!isPlanned"
            value="statistics"
          >
            <VIcon
              start
              icon="tabler-chart-bar"
            />
            Estadísticas
          </VTab>
          <VTab
            v-if="!isPlanned"
            value="history"
          >
            <VIcon
              start
              icon="tabler-history"
            />
            Historial
          </VTab>
        </VTabs>
      </div>

      <VDivider />

      <VTabsWindow v-model="activeTab">
        <!-- Tab: Overview (Dashboard) -->
        <VTabsWindowItem value="overview">
          <!-- Planned Project Notice -->
          <VAlert
            v-if="isPlanned"
            type="info"
            variant="tonal"
            class="ma-4"
            prominent
          >
            <template #prepend>
              <VIcon
                icon="tabler-info-circle"
                size="32"
              />
            </template>
            <VAlertTitle class="text-h6 mb-2">
              Proyecto en Estado Planificado
            </VAlertTitle>
            <p class="mb-2">
              Este proyecto está en estado <strong>Planificado</strong>. Para comenzar a trabajar en él, debe iniciarlo primero.
            </p>
            <p class="mb-0">
              <strong>Funcionalidades disponibles:</strong> Solo se pueden agregar equipos y documentos.
              Los reportes, gastos, estadísticas e historial estarán disponibles una vez que el proyecto sea iniciado.
            </p>
          </VAlert>

          <ProjectOverviewTabOrganism
            v-if="activeTab === 'overview'"
            :statistics="project?.data?.statistics || project?.statistics"
            :dates="project?.data?.dates || project?.dates"
            :budget="project?.data?.budget || project?.budget"
            :general-location="project?.data?.general_location || project?.general_location"
            :coordinates="project?.data?.general_coordinates || project?.general_coordinates"
            :recent-activities="recentActivities"
            :status="project?.data?.status || project?.status"
            @view-map="handleViewMap"
            @view-budget="activeTab = 'budget'"
            @add-expense="handleAddBudgetItem"
          />
        </VTabsWindowItem>

        <!-- Tab: Reportes -->
        <VTabsWindowItem
          v-if="!isPlanned"
          value="reports"
        >
          <div
            v-if="loadingReports"
            class="d-flex align-center justify-center pa-8"
          >
            <VIcon
              icon="tabler-loader-2"
              size="32"
              class="animate-spin text-primary me-3"
            />
            <span class="text-body-1">Cargando reportes...</span>
          </div>
          <ProjectReportsTabOrganism
            v-else-if="activeTab === 'reports'"
            :reports="projectReports"
            :loading="loadingReports"
            @create="showCreateReportDialog = true"
            @view="handleViewReport"
            @edit="handleEditReport"
            @delete="handleDeleteReport"
          />
        </VTabsWindowItem>

        <!-- Tab: Presupuesto -->
        <VTabsWindowItem
          v-if="!isPlanned"
          value="budget"
        >
          <div
            v-if="loadingCosts"
            class="d-flex align-center justify-center pa-8"
          >
            <VIcon
              icon="tabler-loader-2"
              size="32"
              class="animate-spin text-primary me-3"
            />
            <span class="text-body-1">Cargando presupuesto...</span>
          </div>
          <ProjectCostsTabOrganism
            v-else-if="activeTab === 'budget'"
            :costs="projectCosts"
            :budget="(project?.data?.budget || project?.budget)?.total || 0"
            :currency="(project?.data?.budget || project?.budget)?.currency || 'USD'"
            :loading="loadingCosts"
            @create="showAddCostDialog = true"
            @edit="handleEditCost"
            @delete="handleDeleteCost"
          />
        </VTabsWindowItem>

        <!-- Tab: Equipment -->
        <VTabsWindowItem value="equipment">
          <ProjectEquipmentTabOrganism
            v-if="activeTab === 'equipment'"
            ref="projectEquipmentTabRef"
            :project-id="projectId"
            :loading="loadingEquipment"
            @assign="handleAssignEquipment"
            @view="handleViewEquipment"
            @remove="handleRemoveEquipment"
          />
        </VTabsWindowItem>

        <!-- Tab: Documents -->
        <VTabsWindowItem value="documents">
          <ProjectDocumentsTabOrganism
            v-if="activeTab === 'documents'"
            :documents="projectDocuments"
            :loading="loadingDocuments"
            :project-id="projectId"
            @upload="handleUploadDocument"
            @download="handleDownloadDocument"
            @view="handleViewDocument"
            @edit="handleEditDocument"
            @delete="handleDeleteDocument"
          />
        </VTabsWindowItem>

        <!-- Tab: Estadísticas -->
        <VTabsWindowItem
          v-if="!isPlanned"
          value="statistics"
        >
          <ProjectStatisticsTabOrganism
            v-if="activeTab === 'statistics'"
            :statistics="project?.data?.statistics || project?.statistics"
            :budget-data="{
              total: (project?.data?.budget || project?.budget)?.total || 0,
              spent: (project?.data?.budget || project?.budget)?.current_cost || 0,
              remaining: ((project?.data?.budget || project?.budget)?.total || 0) - ((project?.data?.budget || project?.budget)?.current_cost || 0),
            }"
          />
        </VTabsWindowItem>

        <!-- Tab: Historial -->
        <VTabsWindowItem
          v-if="!isPlanned"
          value="history"
        >
          <div
            v-if="loadingHistory"
            class="d-flex align-center justify-center pa-8"
          >
            <VIcon
              icon="tabler-loader-2"
              size="32"
              class="animate-spin text-primary me-3"
            />
            <span class="text-body-1">Cargando historial...</span>
          </div>
          <ProjectHistoryTabOrganism
            v-else-if="activeTab === 'history'"
            :history="statusHistory"
            :summary="historySummary"
            :loading="loadingHistory"
            @refresh="loadStatusHistory"
          />
        </VTabsWindowItem>
      </VTabsWindow>
    </VCard>

    <!-- Edit Project Dialog -->
    <VDialog
      v-model="showEditDialog"
      max-width="800"
    >
      <ProjectForm
        :project="project?.data || project"
        :is-editing="true"
        :show-close-button="false"
        @submit="handleProjectUpdate"
        @cancel="showEditDialog = false"
      />
    </VDialog>

    <!-- Status Dialogs -->
    <ProjectStatusDialogsOrganism
      v-model:start-dialog="showStartDialog"
      v-model:suspend-dialog="showSuspendDialog"
      v-model:resume-dialog="showResumeDialog"
      v-model:complete-dialog="showCompleteDialog"
      v-model:cancel-dialog="showCancelDialog"
      :loading="statusActionLoading"
      @start="handleStartProject"
      @suspend="handleSuspendProject"
      @resume="handleResumeProject"
      @complete="handleCompleteProject"
      @cancel="handleCancelProject"
    />

    <!-- Assign Personnel Dialog -->
    <AssignPersonnelDialogOrganism
      ref="assignPersonnelDialogRef"
      v-model="showAssignPersonnelDialog"
      :project-id="projectId"
      :loading="assigningPersonnel"
      :error="assignPersonnelError"
      @assign="confirmAssignPersonnel"
    />

    <!-- Create Report Dialog -->
    <CreateReportDialogOrganism
      ref="createReportDialogRef"
      v-model="showCreateReportDialog"
      :project-id="projectId"
      :project-name="project?.data?.project_name || project?.project_name || ''"
      :well-id="currentWell?.id || ''"
      :well-name="currentWell?.name || ''"
      :loading="creatingReport"
      :error="createReportError"
      @submit="confirmCreateReport"
    />

    <!-- Add Cost Dialog -->
    <AddCostDialogOrganism
      ref="addCostDialogRef"
      v-model="showAddCostDialog"
      :project-id="projectId"
      :currency="(project?.data?.budget || project?.budget)?.currency || 'USD'"
      :loading="addingCost"
      :error="addCostError"
      @submit="confirmAddCost"
    />

    <!-- Assign Well Dialog -->
    <AssignWellDialogOrganism
      v-model="showAssignWellDialog"
      :project-id="projectId"
      :loading="assigningWell"
      @assign="confirmAssignWell"
      @create="confirmCreateAndAssignWell"
    />

    <!-- Assign Equipment Dialog -->
    <AssignEquipmentDialogOrganism
      ref="assignEquipmentDialogRef"
      v-model="showAssignEquipmentDialog"
      :project-id="projectId"
      :loading="assigningEquipment"
      :error="assignEquipmentError"
      @submit="confirmAssignEquipment"
    />

    <!-- Unassign Equipment Dialog -->
    <UnassignEquipmentDialogOrganism
      ref="unassignEquipmentDialogRef"
      v-model="showUnassignEquipmentDialog"
      :equipment="selectedEquipmentForUnassign"
      @success="handleUnassignSuccess"
    />

    <!-- Personnel List Dialog -->
    <PersonnelListDialogOrganism
      v-model="showPersonnelListDialog"
      :project-id="projectId"
      @assign-new="handleAssignPersonnel"
    />

    <!-- Well Details Dialog -->
    <WellDetailsDialogOrganism
      v-model="showWellDetailsDialog"
      :well="currentWell"
    />

    <!-- Delete Confirmation Dialog -->
    <DeleteConfirmationDialog
      :visible="showDeleteDialog"
      title="Eliminar Proyecto"
      entity-name="Proyecto"
      :entity-id="project?.id"
      warning-message="Esta acción eliminará permanentemente el proyecto y todos sus datos asociados (pozos, reportes, personal asignado, etc.). Esta acción no se puede deshacer."
      confirmation-word="ELIMINAR"
      :loading="deleting"
      @close="cancelDeleteProject"
      @confirm="confirmDeleteProject"
    >
      <template #entity-info>
        {{ project?.data?.project_name || project?.project_name }} ({{ project?.data?.project_code || project?.project_code }})
      </template>
      <template #confirmation-text>
        el proyecto <strong>{{ project?.data?.project_name || project?.project_name }}</strong> y todos sus datos asociados
      </template>
    </DeleteConfirmationDialog>
  </div>
</template>

<style scoped lang="scss">
.project-detail {
  inline-size: 100%;

  :deep(.v-card-title) {
    padding-block: 1.5rem;
  }

  :deep(.v-tabs-pill) {
    .v-tab {
      font-weight: 500;
      letter-spacing: normal;
      text-transform: none;

      &.v-tab--selected {
        font-weight: 600;
      }
    }
  }

  // Smooth transitions
  :deep(.v-tabs-window-item) {
    transition: opacity 0.3s ease;
  }

  // Detail block styling for well details dialog
  .detail-block {
    padding-block: 0.5rem;
    padding-inline: 0;
  }

  // Responsive adjustments
  @media (max-width: 960px) {
    :deep(.v-card-title) {
      padding-block: 1rem;
    }
  }
}
</style>
