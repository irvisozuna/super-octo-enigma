/**
 * Equipment Permissions Composable
 * Manages permissions for equipment operations
 */

import { computed } from 'vue'
import { useAbility } from '@casl/vue'

export const useEquipmentPermissions = () => {
  const { can } = useAbility()

  // View permissions
  const canViewEquipment = computed(() => can('read', 'Tool'))
  const canViewEquipmentDetail = computed(() => can('read', 'Tool'))

  // CRUD permissions
  const canCreateEquipment = computed(() => can('create', 'Tool'))
  const canUpdateEquipment = computed(() => can('update', 'Tool'))
  const canDeleteEquipment = computed(() => can('delete', 'Tool'))

  // Assignment permissions
  const canAssignEquipment = computed(() => can('assign', 'Tool'))
  const canUnassignEquipment = computed(() => can('unassign', 'Tool'))

  // Export permissions
  const canExportEquipment = computed(() => can('export', 'Tool'))

  // Combined permissions
  const canManageEquipment = computed(() =>
    canCreateEquipment.value || canUpdateEquipment.value || canDeleteEquipment.value,
  )

  const canAccessEquipment = computed(() =>
    canViewEquipment.value || canViewEquipmentDetail.value,
  )

  return {
    // View permissions
    canView: canViewEquipment,
    canViewDetail: canViewEquipmentDetail,

    // CRUD permissions
    canCreate: canCreateEquipment,
    canEdit: canUpdateEquipment,
    canDelete: canDeleteEquipment,

    // Assignment permissions
    canAssign: canAssignEquipment,
    canUnassign: canUnassignEquipment,

    // Export permissions
    canExport: canExportEquipment,

    // Combined permissions
    canManage: canManageEquipment,
    canAccess: canAccessEquipment,
  }
}
