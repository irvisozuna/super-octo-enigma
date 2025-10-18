/**
 * Wells Permissions Composable
 * Manages permissions for wells operations
 */

import { computed } from 'vue'
import { useAbility } from '@casl/vue'

export const useWellsPermissions = () => {
  const { can } = useAbility()

  // View permissions
  const canViewWells = computed(() => can('read', 'drilling-wells'))
  const canViewWellDetail = computed(() => can('read', 'drilling-well-detail'))

  // CRUD permissions
  const canCreateWell = computed(() => can('create', 'drilling-wells'))
  const canUpdateWell = computed(() => can('update', 'drilling-wells'))
  const canDeleteWell = computed(() => can('delete', 'drilling-wells'))

  // Export permissions
  const canExportWells = computed(() => can('export', 'drilling-wells'))

  // Combined permissions
  const canManageWells = computed(() =>
    canCreateWell.value || canUpdateWell.value || canDeleteWell.value,
  )

  const canAccessWells = computed(() =>
    canViewWells.value || canViewWellDetail.value,
  )

  return {
    // View permissions
    canView: canViewWells,
    canViewDetail: canViewWellDetail,

    // CRUD permissions
    canCreate: canCreateWell,
    canEdit: canUpdateWell,
    canDelete: canDeleteWell,

    // Export permissions
    canExport: canExportWells,

    // Combined permissions
    canManage: canManageWells,
    canAccess: canAccessWells,
  }
}
