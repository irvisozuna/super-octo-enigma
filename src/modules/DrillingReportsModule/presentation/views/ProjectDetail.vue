<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useProjectsStore } from '../stores/projectsStore'
import { useWellsStore } from '../stores/wellsStore'
import { useDocumentsStore } from '../stores/documentsStore'
import { DrillingReportApiService } from '../../infrastructure/api/services/DrillingReportApiService'
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

// Métodos
const loadProject = async () => {
  if (!projectId.value)
    return

  loading.value = true
  try {
    console.log('Loading project:', projectId.value)
    project.value = await projectsStore.fetchProject(projectId.value)
    console.log('Project loaded:', project.value)

    // Load related data
    await Promise.all([
      loadWellData(),
      loadPersonnel(),
      loadDocuments(),
      loadReports(),
      loadCosts(),
      loadEquipment(),
      loadStatusHistory(),
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
  if (!projectId.value)
    return

  loadingReports.value = true
  try {
    const response = await DrillingReportApiService.getReports({ project_id: projectId.value })

    projectReports.value = response?.data || []
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
  if (!projectId.value)
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
  if (!projectId.value)
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
    console.log('🔵 Creating and assigning well with single API call')
    console.log('🔵 Endpoint: POST /api/drilling/wells')
    console.log('🔵 Payload:', wellData)

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
  console.log('Assign equipment to project:', projectId.value)

  // TODO: Open assign equipment dialog
}

const handleViewEquipment = (equipment: any) => {
  console.log('View equipment:', equipment.id)

  // TODO: Open equipment details dialog
}

const handleRemoveEquipment = async (equipment: any) => {
  if (!confirm(`¿Estás seguro de desasignar el equipo "${equipment.name}"?`))
    return

  try {
    await DrillingReportApiService.removeEquipmentFromProject?.(projectId.value, equipment.id)
    await loadEquipment()
  }
  catch (error) {
    console.error('Error removing equipment:', error)
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
          <VTab value="reports">
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
          <VTab value="budget">
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
          <VTab value="statistics">
            <VIcon
              start
              icon="tabler-chart-bar"
            />
            Estadísticas
          </VTab>
          <VTab value="history">
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
          <ProjectOverviewTabOrganism
            v-if="activeTab === 'overview'"
            :statistics="project?.data?.statistics || project?.statistics"
            :dates="project?.data?.dates || project?.dates"
            :budget="project?.data?.budget || project?.budget"
            :general-location="project?.data?.general_location || project?.general_location"
            :coordinates="project?.data?.general_coordinates || project?.general_coordinates"
            :recent-activities="recentActivities"
            @view-map="handleViewMap"
            @view-budget="activeTab = 'budget'"
            @add-expense="handleAddBudgetItem"
          />
        </VTabsWindowItem>

        <!-- Tab: Reportes -->
        <VTabsWindowItem value="reports">
          <ProjectReportsTabOrganism
            v-if="activeTab === 'reports'"
            :reports="projectReports"
            :loading="loadingReports"
            @create="showCreateReportDialog = true"
            @view="handleViewReport"
            @edit="handleEditReport"
            @delete="handleDeleteReport"
          />
        </VTabsWindowItem>

        <!-- Tab: Presupuesto -->
        <VTabsWindowItem value="budget">
          <ProjectCostsTabOrganism
            v-if="activeTab === 'budget'"
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
            :equipment="projectEquipment"
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
        <VTabsWindowItem value="statistics">
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
        <VTabsWindowItem value="history">
          <ProjectHistoryTabOrganism
            v-if="activeTab === 'history'"
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
      text-transform: none;
      letter-spacing: normal;
      font-weight: 500;

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
    padding: 0.5rem 0;
  }

  // Responsive adjustments
  @media (max-width: 960px) {
    :deep(.v-card-title) {
      padding-block: 1rem;
    }
  }
}
</style>
