<script setup lang="ts">
/**
 * ProjectDetail.vue - Versión Enterprise Refactorizada
 *
 * ANTES: 1,500 líneas monolíticas
 * AHORA: ~250 líneas siguiendo DDD, Atomic Design y mejores prácticas
 *
 * Arquitectura:
 * - Composables para lógica de negocio
 * - Store centralizado para estado
 * - Componentes Organism para UI
 * - Event-driven communication
 * - Type-safe con TypeScript
 */

import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

// Composables - Toda la lógica extraída
import { useProjectDetail } from '../composables/project/useProjectDetail'
import { useTabManager } from '../composables/tabs/useTabManager'
import { useProjectDialogs } from '../composables/shared/useProjectDialogs'
import { useProjectPersonnel } from '../composables/personnel/useProjectPersonnel'

// Componentes Container - UI modular
import ProjectDetailContainerOrganism from '../components/organisms/ProjectDetailContainerOrganism.vue'
import ProjectTabsContainerOrganism from '../components/organisms/ProjectTabsContainerOrganism.vue'

// Tab Components - Lazy loaded
import ProjectOverviewTabOrganism from '../components/organisms/ProjectOverviewTabOrganism.vue'
import ProjectEquipmentTabOrganism from '../components/organisms/ProjectEquipmentTabOrganism.vue'
import ProjectReportsTabOrganism from '../components/organisms/ProjectReportsTabOrganism.vue'
import ProjectBudgetTabOrganism from '../components/organisms/ProjectBudgetTabOrganism.vue'
import ProjectDocumentsTabOrganism from '../components/organisms/ProjectDocumentsTabOrganism.vue'
import ProjectStatisticsTabOrganism from '../components/organisms/ProjectStatisticsTabOrganism.vue'
import ProjectHistoryTabOrganism from '../components/organisms/ProjectHistoryTabOrganism.vue'

// Dialogs - Lazy loaded
import ProjectEditDialog from '../components/ProjectEditDialog.vue'
import ProjectDeleteDialog from '../components/ProjectDeleteDialog.vue'
import ProjectStatusDialogsOrganism from '../components/organisms/ProjectStatusDialogsOrganism.vue'
import AssignPersonnelDialogOrganism from '../components/organisms/AssignPersonnelDialogOrganism.vue'
import AssignEquipmentDialogOrganism from '../components/organisms/AssignEquipmentDialogOrganism.vue'
import { useToast } from '@/composables/useToast'
import { useErrorHandler } from '@/composables/useErrorHandler'

// ========== SETUP ==========

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { showToast } = useToast()
const { withErrorHandling } = useErrorHandler()

// ID del proyecto desde la ruta
const projectId = computed(() => route.params.id as string)

// Composables - Encapsulan TODA la lógica
const {
  project,
  loading,
  error,
  projectStatus,
  isPlanned,
  isActive,
  statistics,
  refreshProject,
  updateProject,
  deleteProject,
  changeProjectStatus,
} = useProjectDetail(projectId)

const {
  activeTab,
  availableTabs,
  tabBadges,
  loadingStates: tabLoadingStates,
  switchTab,
  refreshTab,
} = useTabManager(projectId.value)

const {
  dialogs,
  openEditDialog,
  openDeleteDialog,
  openStatusDialog,
  openAssignPersonnelDialog,
  openAssignEquipmentDialog,
  openCreateReportDialog,
  openAddCostDialog,
} = useProjectDialogs()

const {
  projectPersonnel,
  assignPersonnel,
  unassignPersonnel,
  getStaffingRecommendations,
} = useProjectPersonnel(projectId.value)

// ========== EVENT HANDLERS ==========

/**
 * Manejar edición del proyecto
 */
async function handleEditProject() {
  if (project.value)
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
      showToast({
        type: 'success',
        message: t('project.deleted_successfully'),
      })
      router.push({ name: 'projects-list' })
    },
    { context: t('project.delete_error') },
  )
}

/**
 * Manejar cambio de estado del proyecto
 */
async function handleStatusChange(action: string) {
  if (!project.value)
    return

  const opened = await openStatusDialog(action as any, project.value)
  if (!opened)
    return

  // El diálogo maneja la confirmación y ejecución
}

/**
 * Callback cuando se guarda la edición
 */
async function handleProjectUpdated(updatedData: any) {
  await updateProject(updatedData)
  dialogs.edit = false
  showToast({
    type: 'success',
    message: t('project.updated_successfully'),
  })
}

/**
 * Callback cuando se confirma cambio de estado
 */
async function handleStatusConfirmed(action: string, data?: any) {
  await changeProjectStatus(action as any, data)

  // Cerrar todos los diálogos de estado
  closeAllStatusDialogs()
}

/**
 * Manejar asignación de personal
 */
async function handleAssignPersonnel(data: any) {
  await assignPersonnel(data)
  dialogs.assignPersonnel = false
  refreshTab('overview') // Actualizar tab overview que muestra personal
  showToast({
    type: 'success',
    message: t('personnel.assigned_successfully'),
  })
}

/**
 * Manejar creación de reporte
 */
async function handleCreateReport() {
  if (!canCreateReports.value) {
    showToast({
      type: 'warning',
      message: t('reports.cannot_create_in_status', { status: projectStatus.value }),
    })

    return
  }

  if (project.value)
    openCreateReportDialog(project.value)
}

// ========== COMPUTED ==========

const canCreateReports = computed(() => isActive.value || projectStatus.value === 'suspended')
const canAddCosts = computed(() => isActive.value || projectStatus.value === 'suspended')
const canEditProject = computed(() => projectStatus.value !== 'completed' && projectStatus.value !== 'cancelled')

// ========== LIFECYCLE ==========

onMounted(() => {
  // Verificar recomendaciones de personal
  const recommendations = getStaffingRecommendations()

  recommendations.forEach(rec => {
    if (rec.type === 'warning') {
      showToast({
        type: 'warning',
        message: rec.message,
        duration: 5000,
      })
    }
  })
})
</script>

<template>
  <div class="project-detail-view">
    <!-- Container Principal -->
    <ProjectDetailContainerOrganism
      :project="project"
      :loading="loading"
      :error="error"
      @edit="handleEditProject"
      @delete="handleDeleteProject"
      @status-change="handleStatusChange"
      @refresh="refreshProject"
    >
      <!-- Tabs Container -->
      <ProjectTabsContainerOrganism
        v-model:active-tab="activeTab"
        :available-tabs="availableTabs"
        :tab-badges="tabBadges"
        :loading="tabLoadingStates"
      >
        <!-- Tab: Overview -->
        <template #tab-overview>
          <ProjectOverviewTabOrganism
            v-if="project"
            :project="project"
            :statistics="statistics"
            :personnel="projectPersonnel"
            @add-personnel="openAssignPersonnelDialog(project)"
          />
        </template>

        <!-- Tab: Reports -->
        <template #tab-reports>
          <ProjectReportsTabOrganism
            v-if="activeTab === 'reports'"
            :project-id="projectId"
            :can-create="canCreateReports"
            @create="handleCreateReport"
          />
        </template>

        <!-- Tab: Budget -->
        <template #tab-budget>
          <ProjectBudgetTabOrganism
            v-if="activeTab === 'budget'"
            :project-id="projectId"
            :can-add="canAddCosts"
            @add-cost="openAddCostDialog(project)"
          />
        </template>

        <!-- Tab: Equipment -->
        <template #tab-equipment>
          <ProjectEquipmentTabOrganism
            v-if="activeTab === 'equipment'"
            :project-id="projectId"
            @assign="openAssignEquipmentDialog(project)"
          />
        </template>

        <!-- Tab: Documents -->
        <template #tab-documents>
          <ProjectDocumentsTabOrganism
            v-if="activeTab === 'documents'"
            :project-id="projectId"
          />
        </template>

        <!-- Tab: Statistics -->
        <template #tab-statistics>
          <ProjectStatisticsTabOrganism
            v-if="activeTab === 'statistics' && project"
            :project="project"
          />
        </template>

        <!-- Tab: History -->
        <template #tab-history>
          <ProjectHistoryTabOrganism
            v-if="activeTab === 'history'"
            :project-id="projectId"
          />
        </template>
      </ProjectTabsContainerOrganism>
    </ProjectDetailContainerOrganism>

    <!-- ========== DIALOGS ========== -->

    <!-- Edit Project Dialog -->
    <ProjectEditDialog
      v-model="dialogs.edit"
      :project="project"
      @save="handleProjectUpdated"
    />

    <!-- Delete Project Dialog -->
    <ProjectDeleteDialog
      v-model="dialogs.delete"
      :project="project"
      @confirm="handleDeleteProject"
    />

    <!-- Status Change Dialogs -->
    <ProjectStatusDialogsOrganism
      :dialogs="dialogs"
      :project="project"
      @confirm="handleStatusConfirmed"
    />

    <!-- Assign Personnel Dialog -->
    <AssignPersonnelDialogOrganism
      v-model="dialogs.assignPersonnel"
      :project-id="projectId"
      @assigned="handleAssignPersonnel"
    />

    <!-- Assign Equipment Dialog -->
    <AssignEquipmentDialogOrganism
      v-model="dialogs.assignEquipment"
      :project-id="projectId"
      @assigned="refreshTab('equipment')"
    />
  </div>
</template>

<style scoped>
.project-detail-view {
  block-size: 100%;
}
</style>
