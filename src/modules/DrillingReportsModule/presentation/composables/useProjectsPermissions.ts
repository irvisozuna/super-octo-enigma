/**
 * Projects Permissions Composable
 * Manages permissions for projects operations
 */

import { computed } from 'vue'

export const useProjectsPermissions = () => {
  // Por ahora, permitir todas las operaciones
  // TODO: Implementar permisos reales con CASL cuando esté configurado

  const canView = computed(() => true)
  const canViewDetail = computed(() => true)
  const canCreate = computed(() => true)

  const canEdit = computed(() => (item: any) => {
    // Permitir editar si el proyecto no está completado o cancelado
    return item?.status !== 'completed' && item?.status !== 'cancelled'
  })

  const canDelete = computed(() => (item: any) => {
    // Permitir eliminar si el proyecto no está completado
    return item?.status !== 'completed'
  })

  const canExport = computed(() => true)
  const canManage = computed(() => true)
  const canAccess = computed(() => true)

  return {
    canView,
    canViewDetail,
    canCreate,
    canEdit,
    canDelete,
    canExport,
    canManage,
    canAccess,
  }
}
