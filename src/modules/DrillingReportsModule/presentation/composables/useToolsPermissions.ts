/**
 * Tools Permissions Composable
 * Manages permissions for tools operations
 */

import { computed } from 'vue'
import { useAbility } from '@casl/vue'

export const useToolsPermissions = () => {
  const { can } = useAbility()

  // View permissions
  const canViewTools = computed(() => can('read', 'drilling-tools'))
  const canViewToolDetail = computed(() => can('read', 'drilling-tool-detail'))

  // CRUD permissions
  const canCreateTool = computed(() => can('create', 'drilling-tools'))
  const canUpdateTool = computed(() => can('update', 'drilling-tools'))
  const canDeleteTool = computed(() => can('delete', 'drilling-tools'))

  // Assignment permissions
  const canAssignTool = computed(() => can('assign', 'drilling-tools'))
  const canUnassignTool = computed(() => can('unassign', 'drilling-tools'))

  // Export permissions
  const canExportTools = computed(() => can('export', 'drilling-tools'))

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
