import { reactive, readonly, ref } from 'vue'

/**
 * COMPOSABLE ESPECÍFICO DEL MÓDULO
 * Gestiona todos los diálogos relacionados con ProjectDetail
 */

export interface ProjectDialogsState {

  // Diálogos principales
  edit: boolean
  delete: boolean

  // Diálogos de cambio de estado
  startProject: boolean
  suspendProject: boolean
  resumeProject: boolean
  completeProject: boolean
  cancelProject: boolean

  // Diálogos de asignación
  assignPersonnel: boolean
  assignEquipment: boolean
  unassignEquipment: boolean
  assignWell: boolean

  // Diálogos de creación
  createReport: boolean
  addCost: boolean
  addDocument: boolean

  // Diálogos de visualización
  wellDetails: boolean
  personnelList: boolean
  equipmentDetails: boolean
}

export function useProjectDialogs() {
  // Estado de diálogos
  const dialogs = reactive<ProjectDialogsState>({
    // Diálogos principales
    edit: false,
    delete: false,

    // Diálogos de cambio de estado
    startProject: false,
    suspendProject: false,
    resumeProject: false,
    completeProject: false,
    cancelProject: false,

    // Diálogos de asignación
    assignPersonnel: false,
    assignEquipment: false,
    unassignEquipment: false,
    assignWell: false,

    // Diálogos de creación
    createReport: false,
    addCost: false,
    addDocument: false,

    // Diálogos de visualización
    wellDetails: false,
    personnelList: false,
    equipmentDetails: false,
  })

  // Data asociada a diálogos
  const dialogData = reactive<Record<string, any>>({})

  /**
   * Abrir diálogo
   */
  function openDialog(name: keyof ProjectDialogsState, data?: any) {
    dialogs[name] = true
    if (data)
      dialogData[name] = data
  }

  /**
   * Cerrar diálogo
   */
  function closeDialog(name: keyof ProjectDialogsState) {
    dialogs[name] = false
    delete dialogData[name]
  }

  /**
   * Cerrar todos los diálogos
   */
  function closeAllDialogs() {
    Object.keys(dialogs).forEach(key => {
      dialogs[key as keyof ProjectDialogsState] = false
    })
  }

  // Data específica para cada diálogo
  const selectedEquipmentForUnassign = ref<any>(null)
  const selectedPersonnelForAssign = ref<any>(null)
  const selectedReportForEdit = ref<any>(null)
  const selectedCostForEdit = ref<any>(null)

  /**
   * Abrir diálogo de edición de proyecto
   */
  function openEditDialog(project: any) {
    openDialog('edit', project)
  }

  /**
   * Abrir diálogo de eliminación con confirmación
   */
  async function openDeleteDialog(project: any): Promise<boolean> {
    return new Promise(resolve => {
      dialogData.delete = {
        project,
        onConfirm: () => {
          closeDialog('delete')
          resolve(true)
        },
        onCancel: () => {
          closeDialog('delete')
          resolve(false)
        },
      }
      openDialog('delete')
    })
  }

  /**
   * Abrir diálogos de cambio de estado con validación
   */
  async function openStatusDialog(
    action: 'start' | 'suspend' | 'resume' | 'complete' | 'cancel',
    project: any,
  ) {
    // Validaciones según el estado actual
    const validations: Record<string, string[]> = {
      start: ['planned'],
      suspend: ['active'],
      resume: ['suspended'],
      complete: ['active', 'suspended'],
      cancel: ['planned', 'active', 'suspended'],
    }

    const allowedStatuses = validations[action] || []
    if (!allowedStatuses.includes(project.status)) {
      console.warn(`Cannot ${action} project in status ${project.status}`)

      return false
    }

    const dialogName = `${action}Project` as keyof ProjectDialogsState

    openDialog(dialogName, { project, action })

    return true
  }

  /**
   * Abrir diálogo de asignación de personal con datos precargados
   */
  function openAssignPersonnelDialog(project: any, availablePersonnel?: any[]) {
    openDialog('assignPersonnel', {
      project,
      availablePersonnel,
      onSuccess: () => {
        console.log('Personnel assigned successfully')
      },
    })
  }

  /**
   * Abrir diálogo de asignación de equipo
   */
  function openAssignEquipmentDialog(project: any, availableEquipment?: any[]) {
    openDialog('assignEquipment', {
      project,
      availableEquipment,
      onSuccess: () => {
        console.log('Equipment assigned successfully')
      },
    })
  }

  /**
   * Abrir diálogo de desasignación de equipo
   */
  function openUnassignEquipmentDialog(equipment: any) {
    selectedEquipmentForUnassign.value = equipment
    openDialog('unassignEquipment', {
      equipment,
      onSuccess: () => {
        selectedEquipmentForUnassign.value = null
      },
    })
  }

  /**
   * Abrir diálogo de creación de reporte con validación
   */
  function openCreateReportDialog(project: any) {
    // Validar que el proyecto esté activo
    if (project.status !== 'active' && project.status !== 'suspended') {
      console.warn('Cannot create reports for project in status:', project.status)

      return false
    }

    openDialog('createReport', {
      project,
      defaultDate: new Date(),
      onSuccess: (report: any) => {
        console.log('Report created:', report)
      },
    })
  }

  /**
   * Abrir diálogo de costos con validación
   */
  function openAddCostDialog(project: any, editMode = false, cost?: any) {
    if (!editMode && project.status === 'planned') {
      console.warn('Cannot add costs to planned project')

      return false
    }

    openDialog('addCost', {
      project,
      editMode,
      cost,
      onSuccess: (costData: any) => {
        console.log('Cost saved:', costData)
      },
    })
  }

  /**
   * Gestión de grupo de diálogos relacionados
   */
  function closeAllAssignmentDialogs() {
    closeDialog('assignPersonnel')
    closeDialog('assignEquipment')
    closeDialog('unassignEquipment')
    closeDialog('assignWell')
  }

  function closeAllStatusDialogs() {
    closeDialog('startProject')
    closeDialog('suspendProject')
    closeDialog('resumeProject')
    closeDialog('completeProject')
    closeDialog('cancelProject')
  }

  /**
   * Helper para obtener configuración de diálogo
   */
  function getDialogConfig(name: keyof ProjectDialogsState) {
    const configs: Record<string, any> = {
      edit: { maxWidth: 800, persistent: true },
      delete: { maxWidth: 500, persistent: true },
      assignPersonnel: { maxWidth: 700 },
      assignEquipment: { maxWidth: 700 },
      createReport: { maxWidth: 900, persistent: true },
      addCost: { maxWidth: 600 },
      wellDetails: { maxWidth: 1000, fullscreen: false },
    }

    return configs[name] || { maxWidth: 600 }
  }

  return {
    // Estado de diálogos
    dialogs,
    dialogData: readonly(dialogData),

    // Estado específico
    selectedEquipmentForUnassign: readonly(selectedEquipmentForUnassign),
    selectedPersonnelForAssign: readonly(selectedPersonnelForAssign),
    selectedReportForEdit: readonly(selectedReportForEdit),
    selectedCostForEdit: readonly(selectedCostForEdit),

    // Métodos básicos
    openDialog,
    closeDialog,
    closeAllDialogs,

    // Métodos específicos del proyecto
    openEditDialog,
    openDeleteDialog,
    openStatusDialog,
    openAssignPersonnelDialog,
    openAssignEquipmentDialog,
    openUnassignEquipmentDialog,
    openCreateReportDialog,
    openAddCostDialog,
    closeAllAssignmentDialogs,
    closeAllStatusDialogs,
    getDialogConfig,
  }
}
