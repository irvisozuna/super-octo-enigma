/**
 * Tools Permissions Composable
 * Manages permissions for tools operations
 */

import { computed } from 'vue'
import { useAbility } from '@casl/vue'

export const useToolsPermissions = () => {
  const { can } = useAbility()

  // View permissions
  const canViewTools = computed(() => can('read', 'Tool'))
  const canViewToolDetail = computed(() => can('read', 'Tool'))

  // CRUD permissions
  const canCreateTool = computed(() => can('create', 'Tool'))
  const canUpdateTool = computed(() => can('update', 'Tool'))
  const canDeleteTool = computed(() => can('delete', 'Tool'))

  // Assignment permissions
  const canAssignTool = computed(() => can('assign', 'Tool'))
  const canUnassignTool = computed(() => can('unassign', 'Tool'))

  // Export permissions
  const canExportTools = computed(() => can('export', 'Tool'))

  // Combined permissions
  const canManageTools = computed(() =>
    canCreateTool.value || canUpdateTool.value || canDeleteTool.value,
  )

  const canAccessTools = computed(() =>
    canViewTools.value || canViewToolDetail.value,
  )

  return {
    // View permissions
    canView: canViewTools,
    canViewDetail: canViewToolDetail,

    // CRUD permissions
    canCreate: canCreateTool,
    canEdit: canUpdateTool,
    canDelete: canDeleteTool,

    // Assignment permissions
    canAssign: canAssignTool,
    canUnassign: canUnassignTool,

    // Export permissions
    canExport: canExportTools,

    // Combined permissions
    canManage: canManageTools,
    canAccess: canAccessTools,
  }
}
