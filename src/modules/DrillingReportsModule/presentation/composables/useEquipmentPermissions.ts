/**
 * Equipment Permissions Composable
 * Manages permissions for equipment operations
 */

import { computed } from 'vue'
import { useAbility } from '@casl/vue'

export const useEquipmentPermissions = () => {
  const { can } = useAbility()

  // View permissions
  const canViewEquipment = computed(() => can('read', 'drilling-equipment'))
  const canViewEquipmentDetail = computed(() => can('read', 'drilling-equipment-detail'))

  // CRUD permissions
  const canCreateEquipment = computed(() => can('create', 'drilling-equipment'))
  const canUpdateEquipment = computed(() => can('update', 'drilling-equipment'))
  const canDeleteEquipment = computed(() => can('delete', 'drilling-equipment'))

  // Assignment permissions
  const canAssignEquipment = computed(() => can('assign', 'drilling-equipment'))
  const canUnassignEquipment = computed(() => can('unassign', 'drilling-equipment'))

  // Export permissions
  const canExportEquipment = computed(() => can('export', 'drilling-equipment'))

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
