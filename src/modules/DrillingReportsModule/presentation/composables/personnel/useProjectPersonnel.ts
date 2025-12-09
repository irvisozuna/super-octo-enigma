import { computed } from 'vue'
import { useProjectDetailStore } from '../../stores/projectDetailStore'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { useSimpleLoading } from '@/composables/useLoadingState'

/**
 * Composable para gestionar el personal del proyecto
 * Centraliza toda la lógica de personal, asignaciones y validaciones
 */

export interface PersonnelAssignment {
  employee_id: string
  role: string
  assigned_date?: string
  assignment_date?: string
  hourly_rate?: number
  expected_hours?: number
  notes?: string
}

export interface PersonnelValidationError {
  field: string
  message: string
}

// Roles disponibles para personal
export const PERSONNEL_ROLES = [
  { value: 'drilling_engineer', label: 'Ingeniero de Perforación' },
  { value: 'project_manager', label: 'Gerente de Proyecto' },
  { value: 'operator', label: 'Operador' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'helper', label: 'Ayudante' },
  { value: 'technician', label: 'Técnico' },
  { value: 'safety_officer', label: 'Oficial de Seguridad' },
  { value: 'geologist', label: 'Geólogo' },
  { value: 'mechanic', label: 'Mecánico' },
  { value: 'electrician', label: 'Electricista' },
] as const

export type PersonnelRole = typeof PERSONNEL_ROLES[number]['value']

export function useProjectPersonnel(projectId?: string) {
  const detailStore = useProjectDetailStore()
  const { handleError, withErrorHandling } = useErrorHandler()
  const { withLoading, loading } = useSimpleLoading()

  // ========== ESTADO ==========

  /**
   * Personal del proyecto desde el store
   */
  const projectPersonnel = computed(() => detailStore.projectPersonnel)

  /**
   * Personal formateado para mostrar
   */
  const personnelForDisplay = computed(() => detailStore.personnelForDisplay)

  /**
   * Gerente del proyecto
   */
  const projectManager = computed(() => detailStore.projectManager)

  /**
   * Personal disponible para asignar (no asignado actualmente)
   */
  const availablePersonnel = computed(() => {
    // Por ahora retornar array vacío - se puede implementar después
    // TODO: Implementar carga de empleados disponibles
    return []
  })

  /**
   * Verificar si un rol ya está asignado
   */
  const isRoleAssigned = computed(() => (role: PersonnelRole) => {
    return projectPersonnel.value.some(p => p.role === role)
  })

  /**
   * Obtener personal por rol
   */
  const getPersonnelByRole = computed(() => (role: PersonnelRole) => {
    return projectPersonnel.value.filter(p => p.role === role)
  })

  /**
   * Estadísticas de personal
   */
  const personnelStats = computed(() => ({
    total: projectPersonnel.value.length,
    byRole: PERSONNEL_ROLES.reduce((acc, role) => {
      acc[role.value] = getPersonnelByRole.value(role.value).length

      return acc
    }, {} as Record<PersonnelRole, number>),
    hasManager: !!projectManager.value,
    hasMinimumCrew: projectPersonnel.value.length >= 3, // Mínimo recomendado
  }))

  // ========== VALIDACIONES ==========

  /**
   * Validar asignación de personal
   */
  function validateAssignment(data: PersonnelAssignment): PersonnelValidationError[] {
    const errors: PersonnelValidationError[] = []

    // Validar empleado
    if (!data.employee_id)
      errors.push({ field: 'employee_id', message: 'El empleado es requerido' })

    // Validar rol
    if (!data.role)
      errors.push({ field: 'role', message: 'El rol es requerido' })

    // Validar rol único (algunos roles solo pueden tener una persona)
    const uniqueRoles: PersonnelRole[] = ['project_manager', 'drilling_engineer']
    if (uniqueRoles.includes(data.role as PersonnelRole) && isRoleAssigned.value(data.role as PersonnelRole)) {
      errors.push({
        field: 'role',
        message: `Ya existe un ${PERSONNEL_ROLES.find(r => r.value === data.role)?.label}`,
      })
    }

    // Validar que no esté ya asignado
    const isAlreadyAssigned = projectPersonnel.value.some(
      p => p.employee_id === data.employee_id || p.employee?.id === data.employee_id,
    )

    if (isAlreadyAssigned)
      errors.push({ field: 'employee_id', message: 'Este empleado ya está asignado al proyecto' })

    return errors
  }

  /**
   * Validar desasignación
   */
  function validateUnassignment(personnelId: string): PersonnelValidationError[] {
    const errors: PersonnelValidationError[] = []

    const personnel = projectPersonnel.value.find(
      p => p.id === personnelId || p.employee_id === personnelId,
    )

    if (!personnel) {
      errors.push({ field: 'id', message: 'Personal no encontrado' })

      return errors
    }

    // No permitir desasignar si es el último operador/helper en proyecto activo
    if (detailStore.isActive) {
      const operatorsCount = getPersonnelByRole.value('operator').length
      const helpersCount = getPersonnelByRole.value('helper').length

      if (personnel.role === 'operator' && operatorsCount === 1) {
        errors.push({
          field: 'role',
          message: 'No se puede desasignar el último operador de un proyecto activo',
        })
      }

      if (personnel.role === 'helper' && helpersCount === 1) {
        errors.push({
          field: 'role',
          message: 'No se puede desasignar el último ayudante de un proyecto activo',
        })
      }
    }

    return errors
  }

  // ========== ACCIONES ==========

  /**
   * Cargar personal del proyecto
   */
  async function loadPersonnel() {
    if (!projectId) {
      console.warn('No project ID provided')

      return
    }

    return withLoading(async () => {
      await detailStore.loadProjectPersonnel(projectId)
    })
  }

  /**
   * Asignar personal al proyecto
   */
  async function assignPersonnel(data: PersonnelAssignment) {
    console.log('🔵 useProjectPersonnel.assignPersonnel called with:', data)
    console.log('🔵 projectId:', projectId)

    if (!projectId)
      throw new Error('Project ID is required')

    // Validar antes de asignar
    console.log('🔵 Validating assignment...')

    const errors = validateAssignment(data)
    if (errors.length > 0) {
      const errorMessage = errors.map(e => e.message).join(', ')

      console.error('❌ Validation errors:', errors)
      throw new Error(errorMessage)
    }
    console.log('✅ Validation passed')

    return withErrorHandling(
      async () => {
        console.log('🔵 Calling detailStore.assignPersonnelToProject...')

        // Usar el detailStore en lugar del projectsStore (mantiene arquitectura DDD)
        const result = await detailStore.assignPersonnelToProject(projectId, {
          employee_id: data.employee_id,
          role: data.role,
          assignment_date: data.assigned_date || data.assignment_date || new Date().toISOString().split('T')[0],
          hourly_rate: data.hourly_rate,
          estimated_hours: data.expected_hours,
          notes: data.notes,
        })

        console.log('✅ detailStore.assignPersonnelToProject result:', result)

        // Recargar personal después de asignar
        console.log('🔵 Reloading personnel...')
        await loadPersonnel()
        console.log('✅ Personnel reloaded')

        return result
      },
      {
        context: 'Error al asignar personal',
        showNotification: true,
      },
    )
  }

  /**
   * Desasignar personal del proyecto
   */
  async function unassignPersonnel(personnelId: string) {
    if (!projectId)
      throw new Error('Project ID is required')

    // Validar antes de desasignar
    const errors = validateUnassignment(personnelId)
    if (errors.length > 0) {
      const errorMessage = errors.map(e => e.message).join(', ')
      throw new Error(errorMessage)
    }

    return withErrorHandling(
      async () => {
        // TODO: Implementar función de desasignación en detailStore
        // Por ahora solo recargar personal
        await loadPersonnel()

        return { success: true }
      },
      {
        context: 'Error al desasignar personal',
        showNotification: true,
      },
    )
  }

  /**
   * Actualizar rol de personal
   */
  async function updatePersonnelRole(personnelId: string, newRole: PersonnelRole) {
    if (!projectId)
      throw new Error('Project ID is required')

    // Validar que el nuevo rol no esté ocupado (si es único)
    const uniqueRoles: PersonnelRole[] = ['project_manager', 'drilling_engineer']
    if (uniqueRoles.includes(newRole) && isRoleAssigned.value(newRole))
      throw new Error(`Ya existe un ${PERSONNEL_ROLES.find(r => r.value === newRole)?.label}`)

    return withErrorHandling(
      async () => {
        // TODO: Implementar función de actualización de rol en detailStore
        // Por ahora solo recargar personal
        await loadPersonnel()

        return { success: true }
      },
      {
        context: 'Error al actualizar rol',
        showNotification: true,
      },
    )
  }

  /**
   * Asignación masiva de personal
   */
  async function assignMultiplePersonnel(assignments: PersonnelAssignment[]) {
    if (!projectId)
      throw new Error('Project ID is required')

    // Validar todas las asignaciones
    const allErrors: PersonnelValidationError[] = []

    assignments.forEach(assignment => {
      const errors = validateAssignment(assignment)

      allErrors.push(...errors)
    })

    if (allErrors.length > 0) {
      const errorMessage = allErrors.map(e => e.message).join(', ')
      throw new Error(errorMessage)
    }

    return withErrorHandling(
      async () => {
        // Asignar en paralelo usando detailStore
        const results = await Promise.allSettled(
          assignments.map(assignment =>
            detailStore.assignPersonnelToProject(projectId, {
              employee_id: assignment.employee_id,
              role: assignment.role,
              assignment_date: assignment.assigned_date || new Date().toISOString().split('T')[0],
              notes: assignment.notes,
            }),
          ),
        )

        // Verificar resultados
        const failures = results.filter(r => r.status === 'rejected')
        if (failures.length > 0)
          console.error('Some assignments failed:', failures)

        // Recargar personal
        await loadPersonnel()

        return {
          successful: results.filter(r => r.status === 'fulfilled').length,
          failed: failures.length,
        }
      },
      {
        context: 'Error en asignación masiva',
        showNotification: true,
      },
    )
  }

  // ========== HELPERS ==========

  /**
   * Obtener label de rol
   */
  function getRoleLabel(role: string): string {
    return PERSONNEL_ROLES.find(r => r.value === role)?.label || role
  }

  /**
   * Verificar si se puede asignar más personal de un rol
   */
  function canAssignRole(role: PersonnelRole): boolean {
    const uniqueRoles: PersonnelRole[] = ['project_manager', 'drilling_engineer']

    if (uniqueRoles.includes(role))
      return !isRoleAssigned.value(role)

    // Límites por rol (opcional)
    const roleLimits: Partial<Record<PersonnelRole, number>> = {
      supervisor: 3,
      operator: 5,
      helper: 5,
    }

    const limit = roleLimits[role]
    if (limit)
      return getPersonnelByRole.value(role).length < limit

    return true
  }

  /**
   * Obtener recomendaciones de personal
   */
  function getStaffingRecommendations() {
    const recommendations = []

    if (!projectManager.value) {
      // recommendations.push({
      //   type: 'warning',
      //   message: 'Se recomienda asignar un Gerente de Proyecto'
      // })
    }

    // if (getPersonnelByRole.value('operator').length === 0) {
    //   recommendations.push({
    //     type: 'warning',
    //     message: 'Se requiere al menos un Operador'
    //   })
    // }

    if (getPersonnelByRole.value('safety_officer').length === 0) {
      recommendations.push({
        type: 'info',
        message: 'Considere asignar un Oficial de Seguridad',
      })
    }

    if (personnelStats.value.total < 3) {
      recommendations.push({
        type: 'info',
        message: 'Se recomienda un equipo mínimo de 3 personas',
      })
    }

    return recommendations
  }

  return {
    // Estado
    projectPersonnel,
    personnelForDisplay,
    projectManager,
    availablePersonnel,
    loading,

    // Computed
    isRoleAssigned,
    getPersonnelByRole,
    personnelStats,

    // Validaciones
    validateAssignment,
    validateUnassignment,

    // Acciones
    loadPersonnel,
    assignPersonnel,
    unassignPersonnel,
    updatePersonnelRole,
    assignMultiplePersonnel,

    // Helpers
    getRoleLabel,
    canAssignRole,
    getStaffingRecommendations,
    PERSONNEL_ROLES,
  }
}
