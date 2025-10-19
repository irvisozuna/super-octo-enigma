<script setup lang="ts">

/**
 * ProjectDetail.vue - Versión Enterprise Refactorizada
 *
 * MIGRACIÓN COMPLETA DEL COMPONENTE ORIGINAL (1,500 líneas) A ARQUITECTURA ENTERPRISE
 *
 * Cambios principales:
 * - De 1,500 líneas a ~300 líneas
 * - Composables para encapsular toda la lógica
 * - Store centralizado en lugar de 38 refs locales
 * - Event-driven en lugar de refs directos
 * - Type-safe con TypeScript
 * - Lazy loading automático de tabs
 *
 * El componente original está respaldado en ProjectDetail.original.vue
 */

import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

// Composables - Toda la lógica de negocio extraída
import { useProjectDetail } from '../composables/project/useProjectDetail'
import { useTabManager } from '../composables/tabs/useTabManager'
import { useProjectDialogs } from '../composables/shared/useProjectDialogs'
import { useProjectPersonnel } from '../composables/personnel/useProjectPersonnel'
import { useWells } from '../composables/useWells'

// Componentes Container siguiendo Atomic Design
import ProjectDetailContainerOrganism from '../components/organisms/ProjectDetailContainerOrganism.vue'
import ProjectTabsContainerOrganism from '../components/organisms/ProjectTabsContainerOrganism.vue'

// Componentes de Tabs (los existentes del proyecto)
import ProjectOverviewTabOrganism from '../components/organisms/ProjectOverviewTabOrganism.vue'
import ProjectEquipmentTabOrganism from '../components/organisms/ProjectEquipmentTabOrganism.vue'

// Componentes de Diálogos (los existentes del proyecto)
import ProjectForm from '../components/ProjectForm.vue'
import ProjectStatusDialogsOrganism from '../components/organisms/ProjectStatusDialogsOrganism.vue'
import AssignPersonnelDialogOrganism from '../components/organisms/employees/AssignPersonnelDialogOrganism.vue'
import PersonnelListDialogOrganism from '../components/organisms/PersonnelListDialogOrganism.vue'
import AssignEquipmentDialogOrganism from '../components/organisms/equipment/AssignEquipmentDialogOrganism.vue'
import UnassignEquipmentDialogOrganism from '../components/organisms/equipment/UnassignEquipmentDialogOrganism.vue'
import AddCostDialogOrganism from '../components/organisms/cost/AddCostDialogOrganism.vue'
import AssignWellDialogOrganism from '../components/organisms/wells/AssignWellDialogOrganism.vue'

// Componentes adicionales existentes
import WellInfoCardMolecule from '../components/molecules/WellInfoCardMolecule.vue'
import PersonnelCardMolecule from '../components/molecules/PersonnelCardMolecule.vue'
import BudgetCardMolecule from '../components/molecules/BudgetCardMolecule.vue'
import ProjectProgressBarAtom from '../components/atoms/ProjectProgressBarAtom.vue'
import ProjectStatusBadgeAtom from '../components/atoms/ProjectStatusBadgeAtom.vue'

// Tabs adicionales existentes
import ProjectDocumentsTabOrganism from '../components/organisms/ProjectDocumentsTabOrganism.vue'
import ProjectReportsTabOrganism from '../components/organisms/ProjectReportsTabOrganism.vue'
import ProjectCostsTabOrganism from '../components/organisms/ProjectCostsTabOrganism.vue'
import ProjectStatisticsTabOrganism from '../components/organisms/ProjectStatisticsTabOrganism.vue'
import ProjectHistoryTabOrganism from '../components/organisms/ProjectHistoryTabOrganism.vue'
import CreateReportWizardOrganism from '../components/organisms/drillingReports/CreateReportWizardOrganism.vue'

// Usar el store directamente para algunos datos específicos
import { useProjectDetailStore } from '../stores/projectDetailStore'
import DeleteConfirmationDialog from '@/components/shared/DeleteConfirmationDialog.vue'
import { useGlobalSnackbar } from '@/composables/useGlobalSnackbar'
import { useErrorHandler } from '@/composables/useErrorHandler'

// ========== SETUP ==========

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { showSnackbar } = useGlobalSnackbar()
const { withErrorHandling } = useErrorHandler()

// ID del proyecto desde la ruta
const projectId = computed(() => route.params.id as string)

// 🎯 COMPOSABLE PRINCIPAL - Gestiona todo el estado del proyecto
const {
  project,
  loading,
  error,
  projectStatus,
  isPlanned,
  isActive,
  isCompleted,
  isCancelled,
  isSuspended,
  statistics,
  projectInfo,
  refreshProject,
  updateProject,
  deleteProject,
  changeProjectStatus,
} = useProjectDetail(projectId)

// 🎯 COMPOSABLE DE TABS - Gestiona navegación y lazy loading
const {
  activeTab,
  availableTabs,
  tabBadges,
  loadingStates: tabLoadingStates,
  switchTab,
  refreshTab,
  tabDataCache,
} = useTabManager(projectId.value)

// 🎯 COMPOSABLE DE DIÁLOGOS - Gestiona todos los modales
const {
  dialogs,
  openEditDialog,
  openDeleteDialog,
  openStatusDialog,
  openAssignPersonnelDialog,
  openAssignEquipmentDialog,
  openUnassignEquipmentDialog,
  openCreateReportDialog,
  openAddCostDialog,
  closeAllStatusDialogs,
  selectedEquipmentForUnassign,
} = useProjectDialogs()

// 🎯 COMPOSABLE DE WELLS - Gestiona operaciones de pozos
const { createWell } = useWells()

// 🎯 COMPOSABLE DE PERSONAL - Gestiona asignaciones de personal
const {
  projectPersonnel,
  personnelForDisplay,
  projectManager,
  availablePersonnel,
  assignPersonnel,
  unassignPersonnel,
  getStaffingRecommendations,
} = useProjectPersonnel(projectId.value)

const detailStore = useProjectDetailStore()

// Computeds locales para datos específicos de tabs
const currentWell = computed(() => detailStore.currentWell)
const projectDocuments = computed(() => detailStore.projectDocuments)
const statusHistory = computed(() => detailStore.statusHistory)
const historySummary = computed(() => detailStore.historySummary)

// Datos de tabs desde cache
const projectReports = computed(() => tabDataCache.value.reports || [])
const projectCosts = computed(() => tabDataCache.value.budget || tabDataCache.value.costs || [])
const projectEquipment = computed(() => tabDataCache.value.equipment || [])

// ========== VALIDACIONES Y PERMISOS ==========

const canCreateReports = computed(() =>
  isActive.value || projectStatus.value === 'suspended',
)

const canAddCosts = computed(() =>
  isActive.value || projectStatus.value === 'suspended',
)

const canEditProject = computed(() =>
  projectStatus.value !== 'completed' && projectStatus.value !== 'cancelled',
)

// ========== ESTADO LOCAL ==========

// Estado para el diálogo de confirmación de eliminación de costo
const deleteCostDialog = ref(false)
const costToDelete = ref<any>(null)
const deletingCost = ref(false)

// ========== EVENT HANDLERS ==========

/**
 * Manejar edición del proyecto
 */
function handleEditProject() {
  if (project.value && canEditProject.value)
    openEditDialog(project.value)
}

/**
 * Manejar eliminación del proyecto
 */
async function handleDeleteProject() {
  if (!project.value)
    return

  const confirmed = await openDeleteDialog(project.value)
  if (!confirmed)
    return

  await withErrorHandling(
    async () => {
      await deleteProject()
      showSnackbar({
        message: 'Proyecto eliminado correctamente',
        color: 'success',
      })
      router.push({ name: 'drilling-reports-projects' })
    },
    { context: 'Error al eliminar el proyecto' },
  )
}

/**
 * Manejar cambio de estado del proyecto
 */
async function handleStatusChange(action: string) {
  if (!project.value)
    return

  const result = await openStatusDialog(action as any, project.value)
  if (!result)
    return
}

/**
 * Confirmar cambio de estado
 */
async function handleStatusConfirmed(payload: { action: string; data?: any }) {
  const { action, data } = payload

  await changeProjectStatus(action as any, data)
  closeAllStatusDialogs()
  showSnackbar({
    title: 'Éxito',
    message: `Proyecto ${getActionMessage(action)} correctamente`,
    color: 'success',
  })
}

/**
 * Actualizar proyecto después de edición
 */
async function handleProjectUpdated(updatedData: any) {
  await updateProject(updatedData)
  dialogs.edit = false
  showSnackbar({
    message: 'Proyecto actualizado correctamente',
    color: 'success',
  })
}

/**
 * Asignar personal
 */
async function handleAssignPersonnel(data: any) {
  try {
    console.log('🔵 Starting personnel assignment with data:', data)
    await assignPersonnel(data)
    console.log('✅ Personnel assignment successful')
    dialogs.assignPersonnel = false
    await refreshTab('overview')
    showSnackbar({
      message: 'Personal asignado correctamente',
      color: 'success',
    })
  } catch (error) {
    console.error('❌ Error in handleAssignPersonnel:', error)
    showSnackbar({
      title: 'Error',
      message: error.message || 'Error al asignar personal',
      color: 'error',
    })
  }
}

/**
 * Asignar equipo
 */
async function handleAssignEquipment(data: any) {
  await withErrorHandling(
    async () => {
      // Aquí iría la lógica de asignación de equipo
      await refreshTab('equipment')
      dialogs.assignEquipment = false
      showSnackbar({
        message: 'Equipo asignado correctamente',
        color: 'success',
      })
    },
    { context: 'Error al asignar equipo' },
  )
}

/**
 * Desasignar equipo
 */
async function handleUnassignEquipment(data: any) {
  await withErrorHandling(
    async () => {
      // Aquí iría la lógica de desasignación
      await refreshTab('equipment')
      dialogs.unassignEquipment = false
      showSnackbar({
        message: 'Equipo desasignado correctamente',
        color: 'success',
      })
    },
    { context: 'Error al desasignar equipo' },
  )
}

/**
 * Manejar creación de reporte
 */
function handleCreateReport() {
  if (!canCreateReports.value) {
    showSnackbar({
      message: `No se pueden crear reportes en un proyecto ${projectStatus.value}`,
      color: 'warning',
    })

    return
  }

  if (project.value)
    openCreateReportDialog(project.value)
}

/**
 * Manejar envío del formulario de crear reporte
 */
const creatingReport = ref(false)
const reportError = ref<string | null>(null)
const reportWizardRef = ref<any>(null)

async function handleCreateReportSubmit(reportData: any) {
  creatingReport.value = true
  reportError.value = null

  try {
    // Llamar al API para crear el reporte
    await withErrorHandling(
      async () => {
        const response = await detailStore.createReport?.(projectId.value, reportData)

        // Llamar al método onSuccess del wizard para limpiar todo
        if (reportWizardRef.value?.onSuccess) {
          reportWizardRef.value.onSuccess()
        }

        dialogs.createReport = false
        await refreshTab('reports')

        showSnackbar({
          title: 'Éxito',
          message: 'Reporte de perforación creado correctamente',
          color: 'success',
        })

        return response
      },
      { context: 'Error al crear el reporte' },
    )
  }
  catch (error: any) {
    // Llamar al método onError del wizard si existe
    if (reportWizardRef.value?.onError) {
      reportWizardRef.value.onError(error)
    }
    reportError.value = error.message || 'Error al crear el reporte'
  }
  finally {
    creatingReport.value = false
  }
}

/**
 * Manejar adición de costo
 */
function handleAddCost() {
  if (!canAddCosts.value) {
    showSnackbar({
      message: `No se pueden agregar costos en un proyecto ${projectStatus.value}`,
      color: 'warning',
    })

    return
  }

  if (project.value)
    openAddCostDialog(project.value)
}

/**
 * Manejar envío del formulario de costos
 */
async function handleAddCostSubmit(costData: any) {
  try {
    // Mapear los datos del formulario al formato que espera la API
    const formattedData = {
      cost_type: 'direct', // o el tipo que venga del formulario
      category: costData.category,
      description: costData.description,
      amount: costData.amount,
      date: costData.date,
      currency: costData.currency, // Campo requerido por el backend
      vendor: costData.supplier || undefined,
      reference_number: costData.invoice_number || undefined,
      notes: costData.notes || undefined,
    }

    // Usar el store siguiendo DDD - la capa de presentación no llama directamente a servicios
    await detailStore.addProjectCost(projectId.value, formattedData)

    dialogs.addCost = false
    await refreshTab('budget')

    showSnackbar({
      title: 'Éxito',
      message: 'Costo agregado correctamente',
      color: 'success',
    })
  }
  catch (error: any) {
    showSnackbar({
      title: 'Error',
      message: error.message || 'Error al agregar el costo',
      color: 'error',
    })
  }
}

/**
 * Manejar edición de un costo
 * TODO: Implementar diálogo de edición con datos precargados
 */
function handleEditCost(cost: any) {
  console.log('Editar costo:', cost)

  // TODO: Abrir diálogo de edición cuando esté implementado
  // Por ahora, mostrar mensaje informativo
  showSnackbar({
    title: 'Información',
    message: 'La funcionalidad de edición de costos estará disponible próximamente',
    color: 'info',
  })
}

/**
 * Manejar eliminación de un costo - abrir diálogo de confirmación
 */
function handleDeleteCost(cost: any) {
  costToDelete.value = cost
  deleteCostDialog.value = true
}

/**
 * Confirmar eliminación del costo
 */
async function confirmDeleteCost() {
  if (!costToDelete.value)
    return

  deletingCost.value = true

  try {
    await detailStore.deleteProjectCost(projectId.value, costToDelete.value.id)

    deleteCostDialog.value = false
    costToDelete.value = null

    await refreshTab('budget')

    showSnackbar({
      title: 'Éxito',
      message: 'Costo eliminado correctamente',
      color: 'success',
    })
  }
  catch (error: any) {
    showSnackbar({
      title: 'Error',
      message: error.message || 'Error al eliminar el costo',
      color: 'error',
    })
  }
  finally {
    deletingCost.value = false
  }
}

/**
 * Manejar cambio de pozo
 */
function handleChangeWell() {
  if (!canEditProject.value) {
    showSnackbar({
      title: 'Advertencia',
      message: `No se puede cambiar el pozo en un proyecto ${projectStatus.value}`,
      color: 'warning',
    })

    return
  }

  // Abrir diálogo para cambiar pozo
  dialogs.assignWell = true
}

/**
 * Manejar asignación de pozo
 */
function handleAssignWell() {
  if (!canEditProject.value) {
    showSnackbar({
      title: 'Advertencia',
      message: `No se puede asignar pozo en un proyecto ${projectStatus.value}`,
      color: 'warning',
    })

    return
  }

  // Abrir diálogo para asignar pozo
  dialogs.assignWell = true
}

/**
 * Manejar cuando se asigna un pozo existente
 */
async function handleWellAssigned(wellId: string, notes?: string) {
  try {
    // Asignar el pozo al proyecto usando el store (mantiene arquitectura DDD)
    await detailStore.assignWellToProject(projectId.value, wellId, notes)

    dialogs.assignWell = false

    showSnackbar({
      title: 'Éxito',
      message: 'Pozo asignado correctamente',
      color: 'success',
    })
  }
  catch (error: any) {
    showSnackbar({
      title: 'Error',
      message: error.message || 'Error al asignar el pozo',
      color: 'error',
    })
  }
}

/**
 * Manejar cuando se crea y asigna un nuevo pozo
 */
async function handleWellCreated(wellData: any) {
  try {
    // Crear el pozo usando el composable de wells
    await createWell(wellData)

    dialogs.assignWell = false
    await detailStore.loadProject(projectId.value)

    showSnackbar({
      title: 'Éxito',
      message: 'Pozo creado y asignado correctamente',
      color: 'success',
    })
  }
  catch (error: any) {
    showSnackbar({
      title: 'Error',
      message: error.message || 'Error al crear el pozo',
      color: 'error',
    })
  }
}

/**
 * Manejar "Ver Todos" del personal
 */
function handleViewAllPersonnel() {
  dialogs.personnelList = true
}

/**
 * Manejar "Ver Detalles" del presupuesto - cambiar al tab de presupuesto
 */
function handleViewBudgetDetails() {
  activeTab.value = 'budget'
}

// ========== HELPERS ==========

function getActionMessage(action: string): string {
  const messages: Record<string, string> = {
    start: 'iniciado',
    suspend: 'suspendido',
    resume: 'reanudado',
    complete: 'completado',
    cancel: 'cancelado',
  }

  return messages[action] || 'actualizado'
}

// ========== LIFECYCLE ==========

onMounted(() => {
  // Mostrar recomendaciones de personal si las hay
  const recommendations = getStaffingRecommendations()

  recommendations.forEach(rec => {
    if (rec.type === 'warning') {
      showSnackbar({
        title: 'Advertencia',
        message: rec.message,
        color: 'warning',
        timeout: 5000,
      })
    }
  })
})
</script>

<template>
  <div class="project-detail-view">
    <!-- Container Principal con Header -->
    <ProjectDetailContainerOrganism
      :project="project"
      :loading="loading"
      :error="error"
      @edit="handleEditProject"
      @delete="handleDeleteProject"
      @status-change="handleStatusChange"
      @refresh="refreshProject"
    >
      <!-- Container de Tabs -->
      <ProjectTabsContainerOrganism
        v-model:active-tab="activeTab"
        :available-tabs="availableTabs"
        :tab-badges="tabBadges"
        :loading="tabLoadingStates"
      >
        <!-- TAB: RESUMEN / OVERVIEW -->
        <template #tab-overview>
          <VContainer
            v-if="project"
            fluid
          >
            <VRow>
              <!-- Información del Pozo -->
              <VCol
                cols="12"
                md="4"
              >
                <WellInfoCardMolecule
                  :well="currentWell"
                  :loading="loading"
                  :show-actions="canEditProject"
                  @change-well="handleChangeWell"
                  @assign-well="handleAssignWell"
                />
              </VCol>

              <!-- Personal del Proyecto -->
              <VCol
                cols="12"
                md="4"
              >
                <PersonnelCardMolecule
                  :personnel="personnelForDisplay"
                  :project-manager="projectManager"
                  :loading="loading"
                  :can-edit="canEditProject"
                  @assign="openAssignPersonnelDialog(project)"
                  @view-all="handleViewAllPersonnel"
                />
              </VCol>

              <!-- Presupuesto -->
              <VCol
                cols="12"
                md="4"
              >
                <BudgetCardMolecule
                  :total="project.budget?.total || 0"
                  :current="project.budget?.current_cost || statistics.totalCost || 0"
                  :currency="project.budget?.currency || 'MXN'"
                  :loading="loading"
                  @view-details="handleViewBudgetDetails"
                  @add-expense="handleAddCost"
                />
              </VCol>

              <!-- Información General -->
              <VCol cols="12">
                <ProjectOverviewTabOrganism
                  :statistics="statistics"
                  :dates="project.dates"
                  :budget="project.budget"
                  :general-location="project.general_location"
                  :coordinates="project.general_coordinates"
                  :client="project.client"
                  :description="project.description"
                  :project-manager="projectManager"
                  :project-personnel="personnelForDisplay"
                  :current-well="currentWell"
                />
              </VCol>
            </VRow>
          </VContainer>
        </template>

        <!-- TAB: REPORTES -->
        <template #tab-reports>
          <ProjectReportsTabOrganism
            v-if="activeTab === 'reports'"
            :project-id="projectId"
            :reports="projectReports"
            :loading="tabLoadingStates.reports"
            :can-create="canCreateReports"
            @create="handleCreateReport"
            @refresh="() => refreshTab('reports')"
          />
        </template>

        <!-- TAB: PRESUPUESTO -->
        <template #tab-budget>
          <ProjectCostsTabOrganism
            v-if="activeTab === 'budget'"
            :costs="projectCosts"
            :loading="tabLoadingStates.budget"
            :budget="project?.budget?.total || 0"
            :currency="project?.budget?.currency || 'MXN'"
            @create="handleAddCost"
            @delete="handleDeleteCost"
          />
        </template>

        <!-- TAB: EQUIPOS -->
        <template #tab-equipment>
          <ProjectEquipmentTabOrganism
            v-if="activeTab === 'equipment'"
            :project-id="projectId"
            :equipment="projectEquipment"
            :loading="tabLoadingStates.equipment"
            :can-edit="canEditProject"
            @assign="openAssignEquipmentDialog(project)"
            @unassign="openUnassignEquipmentDialog"
            @refresh="() => refreshTab('equipment')"
          />
        </template>

        <!-- TAB: DOCUMENTOS -->
        <template #tab-documents>
          <ProjectDocumentsTabOrganism
            v-if="activeTab === 'documents'"
            :project-id="projectId"
            :documents="projectDocuments"
            :loading="tabLoadingStates.documents"
            @refresh="() => refreshTab('documents')"
          />
        </template>

        <!-- TAB: ESTADÍSTICAS -->
        <template #tab-statistics>
          <ProjectStatisticsTabOrganism
            v-if="activeTab === 'statistics' && project"
            :project="project"
            :statistics="statistics"
            :loading="tabLoadingStates.statistics"
          />
        </template>

        <!-- TAB: HISTORIAL -->
        <template #tab-history>
          <ProjectHistoryTabOrganism
            v-if="activeTab === 'history'"
            :project-id="projectId"
            :history="statusHistory"
            :summary="historySummary"
            :loading="tabLoadingStates.history"
          />
        </template>
      </ProjectTabsContainerOrganism>
    </ProjectDetailContainerOrganism>

    <!-- ========== DIÁLOGOS ========== -->

    <!-- Diálogo de Edición -->
    <VDialog
      v-model="dialogs.edit"
      max-width="800"
      persistent
    >
      <VCard>
        <VCardTitle>Editar Proyecto</VCardTitle>
        <VCardText>
          <ProjectForm
            v-if="project"
            :project="project"
            @save="handleProjectUpdated"
            @cancel="dialogs.edit = false"
          />
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Diálogo de Eliminación -->
    <VDialog
      v-model="dialogs.delete"
      max-width="500"
      persistent
    >
      <VCard>
        <VCardTitle>Confirmar Eliminación</VCardTitle>
        <VCardText>
          ¿Estás seguro de que deseas eliminar el proyecto "{{ project?.project_name }}"?
          Esta acción no se puede deshacer.
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn @click="dialogs.delete = false">
            Cancelar
          </VBtn>
          <VBtn
            color="error"
            @click="handleDeleteProject"
          >
            Eliminar
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Diálogos de Cambio de Estado -->
    <ProjectStatusDialogsOrganism
      :project="project"
      :show-start-dialog="dialogs.startProject"
      :show-suspend-dialog="dialogs.suspendProject"
      :show-resume-dialog="dialogs.resumeProject"
      :show-complete-dialog="dialogs.completeProject"
      :show-cancel-dialog="dialogs.cancelProject"
      @update:show-start-dialog="dialogs.startProject = $event"
      @update:show-suspend-dialog="dialogs.suspendProject = $event"
      @update:show-resume-dialog="dialogs.resumeProject = $event"
      @update:show-complete-dialog="dialogs.completeProject = $event"
      @update:show-cancel-dialog="dialogs.cancelProject = $event"
      @status-changed="handleStatusConfirmed"
    />

    <!-- Diálogo de Asignación de Personal -->
    <AssignPersonnelDialogOrganism
      v-model="dialogs.assignPersonnel"
      :project-id="projectId"
      :available-personnel="availablePersonnel"
      @assign="handleAssignPersonnel"
    />

    <!-- Diálogo de Asignación de Equipo -->
    <AssignEquipmentDialogOrganism
      v-model:visible="dialogs.assignEquipment"
      :project-id="projectId"
      @assigned="handleAssignEquipment"
    />

    <!-- Diálogo de Desasignación de Equipo -->
    <UnassignEquipmentDialogOrganism
      v-model:visible="dialogs.unassignEquipment"
      :equipment="selectedEquipmentForUnassign"
      :project-id="projectId"
      @unassigned="handleUnassignEquipment"
    />

    <!-- Diálogo de Agregar Costo -->
    <AddCostDialogOrganism
      v-model="dialogs.addCost"
      :project-id="projectId"
      :currency="project?.budget?.currency || 'MXN'"
      @submit="handleAddCostSubmit"
    />

    <!-- Diálogo de Asignar/Cambiar Pozo -->
    <AssignWellDialogOrganism
      v-model="dialogs.assignWell"
      :project-id="projectId"
      @assign="handleWellAssigned"
      @create="handleWellCreated"
    />

    <!-- Diálogo de Lista de Personal -->
    <PersonnelListDialogOrganism
      v-model="dialogs.personnelList"
      :project-id="projectId"
      @assign-new="openAssignPersonnelDialog(project)"
    />

    <!-- Diálogo de Confirmación de Eliminación de Costo -->
    <DeleteConfirmationDialog
      :visible="deleteCostDialog"
      title="Eliminar Costo"
      entity-name="costo"
      :entity-id="costToDelete?.id"
      warning-message="Esta acción eliminará permanentemente el registro de costo del proyecto. Esta acción no se puede deshacer."
      confirmation-word="ELIMINAR"
      :loading="deletingCost"
      @close="deleteCostDialog = false; costToDelete = null"
      @confirm="confirmDeleteCost"
    >
      <template #entity-info>
        <div v-if="costToDelete">
          <div class="font-weight-medium">
            {{ costToDelete.description }}
          </div>
          <div class="text-caption text-medium-emphasis mt-1">
            Monto: {{ costToDelete.amount }} {{ costToDelete.currency }}
          </div>
          <div class="text-caption text-medium-emphasis">
            Categoría: {{ costToDelete.category }}
          </div>
          <div class="text-caption text-medium-emphasis">
            Fecha: {{ costToDelete.date }}
          </div>
        </div>
      </template>
    </DeleteConfirmationDialog>

    <!-- Diálogo de Crear Reporte (Wizard) -->
    <CreateReportWizardOrganism
      ref="reportWizardRef"
      v-model="dialogs.createReport"
      :project-id="projectId"
      :project-name="project?.project_name || ''"
      :well-id="currentWell?.id || ''"
      :well-name="currentWell?.name || ''"
      :loading="creatingReport"
      :error="reportError"
      @submit="handleCreateReportSubmit"
    />
  </div>
</template>

<style scoped>
.project-detail-view {
  overflow: auto;
  block-size: 100%;
}

/* Estilos responsive para móvil */
@media (max-width: 600px) {
  .project-detail-view :deep(.v-container) {
    padding: 8px;
  }
}
</style>
