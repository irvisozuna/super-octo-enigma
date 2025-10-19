import { type MaybeRef, computed, onMounted, onUnmounted, unref } from 'vue'
import { useProjectDetailStore } from '../../stores/projectDetailStore'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { useGlobalSnackbar } from '@/composables/useGlobalSnackbar'

// Usar el snackbar global que ya existe en el proyecto
const useNotifications = () => {
  const { showSnackbar } = useGlobalSnackbar()

  const showError = (options: { title: string; message: string }) => {
    showSnackbar({
      message: `${options.title}: ${options.message}`,
      color: 'error',
    })
  }

  const showSuccess = (message: string) => {
    showSnackbar({
      message,
      color: 'success',
    })
  }

  return { showError, showSuccess }
}

/**
 * Composable para gestionar los detalles de un proyecto
 * Centraliza toda la lógica de carga y estado del proyecto
 */
export function useProjectDetail(projectId: MaybeRef<string>) {
  const store = useProjectDetailStore()
  const { showError, showSuccess } = useNotifications()
  const { withErrorHandling } = useErrorHandler()

  // Estado derivado del store
  const project = computed(() => store.currentProject)
  const loading = computed(() => store.loadingStates.project)
  const error = computed(() => store.errors.project)

  // Computed properties para estado del proyecto
  const projectStatus = computed(() => store.projectStatus)
  const isPlanned = computed(() => store.isPlanned)
  const isActive = computed(() => store.isActive)
  const isCompleted = computed(() => store.isCompleted)
  const isCancelled = computed(() => store.isCancelled)
  const isSuspended = computed(() => store.isSuspended)

  // Estadísticas del proyecto
  const statistics = computed(() => ({
    reports: project.value?.statistics?.reports_count || 0,
    equipment: project.value?.statistics?.equipment_count || 0,
    personnel: project.value?.statistics?.personnel_count || 0,
    wells: project.value?.statistics?.wells_count || 0,
    documents: project.value?.statistics?.documents_count || 0,
    totalCost: project.value?.budget?.current_cost || 0,
    budget: project.value?.budget?.total || 0,
    budgetUsage: project.value?.budget?.usage_percentage || 0,
  }))

  // Información del proyecto formateada
  const projectInfo = computed(() => ({
    name: project.value?.project_name || '',
    code: project.value?.project_code || '',
    client: project.value?.client?.business_name || 'Sin cliente',
    location: project.value?.general_location || 'Sin ubicación',
    startDate: project.value?.dates?.start_date || null,
    endDate: project.value?.dates?.end_date || null,
    description: project.value?.description || '',
    coordinates: project.value?.general_coordinates || null,
  }))

  /**
   * Cargar proyecto con manejo de errores mejorado
   */
  async function loadProject() {
    const id = unref(projectId)
    if (!id) {
      console.warn('No project ID provided')

      return
    }

    await withErrorHandling(
      async () => {
        await store.loadProject(id)

        // Cargar solo datos esenciales del overview - documentos se cargan lazy
        await Promise.allSettled([
          store.loadProjectWell(id),
          store.loadProjectPersonnel(id),
        ])
      },
      { context: 'Error al cargar el proyecto' },
    )
  }

  /**
   * Recargar proyecto
   */
  async function refreshProject() {
    await loadProject()
    showSuccess('Proyecto actualizado correctamente')
  }

  /**
   * Actualizar proyecto
   */
  async function updateProject(data: any) {
    const id = unref(projectId)
    if (!id)
      return

    await withErrorHandling(
      async () => {
        await store.updateProject(id, data)
        showSuccess('Proyecto actualizado correctamente')
        await loadProject()
      },
      { context: 'Error al actualizar el proyecto' },
    )
  }

  /**
   * Eliminar proyecto
   */
  async function deleteProject() {
    const id = unref(projectId)
    if (!id)
      return

    await withErrorHandling(
      async () => {
        await store.deleteProject(id)
        showSuccess('Proyecto eliminado correctamente')
      },
      { context: 'Error al eliminar el proyecto' },
    )
  }

  /**
   * Cambiar estado del proyecto
   */
  async function changeProjectStatus(action: 'start' | 'suspend' | 'resume' | 'complete' | 'cancel', data?: any) {
    const id = unref(projectId)
    if (!id)
      return

    await withErrorHandling(
      async () => {
        await store.changeProjectStatus(id, action, data)
        showSuccess(`Proyecto ${getStatusActionMessage(action)} correctamente`)
        await loadProject()
      },
      { context: `Error al ${getStatusActionMessage(action)} el proyecto` },
    )
  }

  /**
   * Helper para obtener mensaje de acción de estado
   */
  function getStatusActionMessage(action: string): string {
    const messages: Record<string, string> = {
      start: 'iniciado',
      suspend: 'suspendido',
      resume: 'reanudado',
      complete: 'completado',
      cancel: 'cancelado',
    }

    return messages[action] || 'actualizado'
  }

  // Lifecycle
  onMounted(() => {
    loadProject()
  })

  // Cleanup al desmontar
  onUnmounted(() => {
    store.$reset()
  })

  return {
    // Estado
    project,
    loading,
    error,

    // Computed
    projectStatus,
    isPlanned,
    isActive,
    isCompleted,
    isCancelled,
    isSuspended,
    statistics,
    projectInfo,

    // Actions
    loadProject,
    refreshProject,
    updateProject,
    deleteProject,
    changeProjectStatus,
  }
}
