/**
 * Drilling Report Permissions Composable
 *
 * Composable for handling permissions in drilling reports
 */

import { computed } from 'vue'
import { useAbility } from '@casl/vue'
import { DRILLING_REPORTS_PERMISSIONS, DRILLING_REPORTS_PERMISSION_GROUPS } from '../../config/permissions'

export function useDrillingReportPermissions() {
  const { can: canAbility } = useAbility()

  /**
   * Check if user has a specific permission
   */
  const canPermission = (permission: string): boolean => {
    return canAbility('manage', permission)
  }

  /**
   * Check if user has any of the specified permissions
   */
  const canAny = (permissions: string[]): boolean => {
    return permissions.some(permission => canPermission(permission))
  }

  /**
   * Check if user has all of the specified permissions
   */
  const canAll = (permissions: string[]): boolean => {
    return permissions.every(permission => canPermission(permission))
  }

  /**
   * Check if user can view reports
   */
  const canViewReports = computed(() => {
    return canPermission('drilling.reports.view')
  })

  /**
   * Check if user can view all reports
   */
  const canViewAllReports = computed(() => {
    return canPermission('drilling.reports.view.all')
  })

  /**
   * Check if user can create reports
   */
  const canCreateReports = computed(() => {
    return canPermission('drilling.reports.create')
  })

  /**
   * Check if user can update reports
   */
  const canUpdateReports = computed(() => {
    return canPermission('drilling.reports.update')
  })

  /**
   * Check if user can delete reports
   */
  const canDeleteReports = computed(() => {
    return canPermission('drilling.reports.delete')
  })

  /**
   * Check if user can complete reports
   */
  const canCompleteReports = computed(() => {
    return canPermission('drilling.reports.complete')
  })

  /**
   * Check if user can approve reports
   */
  const canApproveReports = computed(() => {
    return canPermission('drilling.reports.approve')
  })

  /**
   * Check if user can reject reports
   */
  const canRejectReports = computed(() => {
    return canPermission('drilling.reports.reject')
  })

  /**
   * Check if user can sign reports
   */
  const canSignReports = computed(() => {
    return canPermission('drilling.reports.sign')
  })

  /**
   * Check if user can add activities
   */
  const canAddActivities = computed(() => {
    return canPermission('drilling.reports.activities.add')
  })

  /**
   * Check if user can update activities
   */
  const canUpdateActivities = computed(() => {
    return canPermission('drilling.reports.activities.update')
  })

  /**
   * Check if user can add consumptions
   */
  const canAddConsumptions = computed(() => {
    return canPermission('drilling.reports.consumptions.add')
  })

  /**
   * Check if user can update consumptions
   */
  const canUpdateConsumptions = computed(() => {
    return canPermission('drilling.reports.consumptions.update')
  })

  /**
   * Check if user can assign tools
   */
  const canAssignTools = computed(() => {
    return canPermission('drilling.reports.tools.assign')
  })

  /**
   * Check if user can update tool assignments
   */
  const canUpdateToolAssignments = computed(() => {
    return canPermission('drilling.reports.tools.update')
  })

  /**
   * Check if user can export reports
   */
  const canExportReports = computed(() => {
    return canPermission('drilling.reports.export')
  })

  /**
   * Check if user can view statistics
   */
  const canViewStatistics = computed(() => {
    return canPermission('drilling.reports.statistics')
  })

  /**
   * Check if user can perform specific action on a report
   */
  const canPerformAction = (report: any, action: string): boolean => {
    switch (action) {
      case 'view':
        return canViewReports.value

      case 'create':
        return canCreateReports.value

      case 'edit':
        return canUpdateReports.value && (report.status === 'draft' || report.status === 'rejected')

      case 'delete':
        return canDeleteReports.value && report.status === 'draft'

      case 'complete':
        return canCompleteReports.value && report.status === 'draft'

      case 'approve':
        return canApproveReports.value && report.status === 'completed'

      case 'reject':
        return canRejectReports.value && report.status === 'completed'

      case 'sign':
        return canSignReports.value

      case 'export':
        return canExportReports.value

      default:
        return false
    }
  }

  /**
   * Get available actions for a report based on status and permissions
   */
  const getAvailableActions = (report: any): string[] => {
    const actions: string[] = []

    if (canPerformAction(report, 'view'))
      actions.push('view')

    if (canPerformAction(report, 'edit'))
      actions.push('edit')

    if (canPerformAction(report, 'delete'))
      actions.push('delete')

    if (canPerformAction(report, 'complete'))
      actions.push('complete')

    if (canPerformAction(report, 'approve'))
      actions.push('approve')

    if (canPerformAction(report, 'reject'))
      actions.push('reject')

    if (canPerformAction(report, 'sign'))
      actions.push('sign')

    if (canPerformAction(report, 'export'))
      actions.push('export')

    return actions
  }

  /**
   * Check if user has admin permissions
   */
  const isAdmin = computed(() => {
    return canAll(DRILLING_REPORTS_PERMISSION_GROUPS.admin)
  })

  /**
   * Check if user has manager permissions
   */
  const isManager = computed(() => {
    return canAll(DRILLING_REPORTS_PERMISSION_GROUPS.manager)
  })

  /**
   * Check if user has supervisor permissions
   */
  const isSupervisor = computed(() => {
    return canAll(DRILLING_REPORTS_PERMISSION_GROUPS.supervisor)
  })

  /**
   * Check if user has operator permissions
   */
  const isOperator = computed(() => {
    return canAll(DRILLING_REPORTS_PERMISSION_GROUPS.operator)
  })

  /**
   * Check if user has viewer permissions
   */
  const isViewer = computed(() => {
    return canAll(DRILLING_REPORTS_PERMISSION_GROUPS.viewer)
  })

  /**
   * Get user role based on permissions
   */
  const getUserRole = computed(() => {
    if (isAdmin.value)
      return 'admin'
    if (isManager.value)
      return 'manager'
    if (isSupervisor.value)
      return 'supervisor'
    if (isOperator.value)
      return 'operator'
    if (isViewer.value)
      return 'viewer'

    return 'guest'
  })

  return {
    // Permission checks
    can: canPermission,
    canAny,
    canAll,

    // Specific permission checks
    canViewReports,
    canViewAllReports,
    canCreateReports,
    canUpdateReports,
    canDeleteReports,
    canCompleteReports,
    canApproveReports,
    canRejectReports,
    canSignReports,
    canAddActivities,
    canUpdateActivities,
    canAddConsumptions,
    canUpdateConsumptions,
    canAssignTools,
    canUpdateToolAssignments,
    canExportReports,
    canViewStatistics,

    // Action-based checks
    canPerformAction,
    getAvailableActions,

    // Role checks
    isAdmin,
    isManager,
    isSupervisor,
    isOperator,
    isViewer,
    getUserRole,
  }
}
