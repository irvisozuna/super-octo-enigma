/**
 * Drilling Report Status Transition Composable
 *
 * Composable for handling status transitions in drilling reports
 */

import { computed } from 'vue'
import { REPORT_STATUS } from '../../shared/constants/DrillingConstants'

export interface StatusTransition {
  from: string
  to: string
  action: string
  permission: string
  validations: string[]
  description: string
}

export const STATUS_TRANSITIONS: StatusTransition[] = [
  {
    from: 'draft',
    to: 'completed',
    action: 'complete',
    permission: 'drilling.reports.complete',
    validations: [
      'Debe tener al menos 1 actividad',
      'Debe tener al menos 1 operador asignado',
    ],
    description: 'Completar reporte para enviar a aprobación',
  },
  {
    from: 'completed',
    to: 'approved',
    action: 'approve',
    permission: 'drilling.reports.approve',
    validations: [
      'Debe tener firma de operador',
      'Debe tener firma de supervisor',
    ],
    description: 'Aprobar reporte como definitivo',
  },
  {
    from: 'completed',
    to: 'rejected',
    action: 'reject',
    permission: 'drilling.reports.reject',
    validations: [
      'Debe proporcionar un motivo de rechazo',
    ],
    description: 'Rechazar reporte para corrección',
  },
  {
    from: 'rejected',
    to: 'draft',
    action: 'edit',
    permission: 'drilling.reports.update',
    validations: [],
    description: 'Editar reporte rechazado',
  },
]

export function useDrillingReportStatusTransition(report: any) {
  /**
   * Get current status configuration
   */
  const currentStatusConfig = computed(() => {
    return REPORT_STATUS.find(status => status.value === report.status)
  })

  /**
   * Get available transitions from current status
   */
  const availableTransitions = computed(() => {
    return STATUS_TRANSITIONS.filter(transition => transition.from === report.status)
  })

  /**
   * Check if a specific transition is possible
   */
  const canTransitionTo = (targetStatus: string): boolean => {
    const transition = STATUS_TRANSITIONS.find(
      t => t.from === report.status && t.to === targetStatus,
    )

    if (!transition)
      return false

    // TODO: Check permissions
    // if (!hasPermission(transition.permission)) return false

    return true
  }

  /**
   * Get available actions for current status
   */
  const getAvailableActions = (): string[] => {
    return availableTransitions.value.map(transition => transition.action)
  }

  /**
   * Get next possible statuses
   */
  const getNextStatuses = (): string[] => {
    return availableTransitions.value.map(transition => transition.to)
  }

  /**
   * Check if report can be edited
   */
  const canEdit = computed(() => {
    return report.status === 'draft' || report.status === 'rejected'
  })

  /**
   * Check if report can be deleted
   */
  const canDelete = computed(() => {
    return report.status === 'draft'
  })

  /**
   * Check if report can be completed
   */
  const canComplete = computed(() => {
    return report.status === 'draft' && canTransitionTo('completed')
  })

  /**
   * Check if report can be approved
   */
  const canApprove = computed(() => {
    return report.status === 'completed' && canTransitionTo('approved')
  })

  /**
   * Check if report can be rejected
   */
  const canReject = computed(() => {
    return report.status === 'completed' && canTransitionTo('rejected')
  })

  /**
   * Check if report can be signed
   */
  const canSign = computed(() => {
    return report.status === 'draft' || report.status === 'completed'
  })

  /**
   * Check if report is in final state
   */
  const isFinalState = computed(() => {
    return report.status === 'approved'
  })

  /**
   * Check if report is in editable state
   */
  const isEditable = computed(() => {
    return report.status === 'draft' || report.status === 'rejected'
  })

  /**
   * Check if report is pending approval
   */
  const isPendingApproval = computed(() => {
    return report.status === 'completed'
  })

  /**
   * Check if report is rejected
   */
  const isRejected = computed(() => {
    return report.status === 'rejected'
  })

  /**
   * Get status color
   */
  const getStatusColor = (status?: string): string => {
    const targetStatus = status || report.status
    const statusConfig = REPORT_STATUS.find(s => s.value === targetStatus)

    return statusConfig?.color || '#6B7280'
  }

  /**
   * Get status background color
   */
  const getStatusBgColor = (status?: string): string => {
    const targetStatus = status || report.status
    const statusConfig = REPORT_STATUS.find(s => s.value === targetStatus)

    return statusConfig?.bgColor || '#F3F4F6'
  }

  /**
   * Get status icon
   */
  const getStatusIcon = (status?: string): string => {
    const targetStatus = status || report.status
    const statusConfig = REPORT_STATUS.find(s => s.value === targetStatus)

    return statusConfig?.icon || 'mdi-help-circle'
  }

  /**
   * Get status label
   */
  const getStatusLabel = (status?: string): string => {
    const targetStatus = status || report.status
    const statusConfig = REPORT_STATUS.find(s => s.value === targetStatus)

    return statusConfig?.label || 'Desconocido'
  }

  /**
   * Get status description
   */
  const getStatusDescription = (status?: string): string => {
    const targetStatus = status || report.status
    const statusConfig = REPORT_STATUS.find(s => s.value === targetStatus)

    return statusConfig?.description || 'Estado desconocido'
  }

  /**
   * Get transition description
   */
  const getTransitionDescription = (targetStatus: string): string => {
    const transition = STATUS_TRANSITIONS.find(
      t => t.from === report.status && t.to === targetStatus,
    )

    return transition?.description || 'Transición no disponible'
  }

  /**
   * Get transition validations
   */
  const getTransitionValidations = (targetStatus: string): string[] => {
    const transition = STATUS_TRANSITIONS.find(
      t => t.from === report.status && t.to === targetStatus,
    )

    return transition?.validations || []
  }

  /**
   * Check if transition requires validations
   */
  const requiresValidations = (targetStatus: string): boolean => {
    const validations = getTransitionValidations(targetStatus)

    return validations.length > 0
  }

  /**
   * Get all possible statuses
   */
  const getAllStatuses = () => {
    return REPORT_STATUS.map(status => ({
      value: status.value,
      label: status.label,
      color: status.color,
      bgColor: status.bgColor,
      icon: status.icon,
      description: status.description,
    }))
  }

  /**
   * Get status history (if available)
   */
  const getStatusHistory = () => {
    // TODO: Implement status history if available in report data
    return []
  }

  return {
    // Status configuration
    currentStatusConfig,
    availableTransitions,

    // Transition checks
    canTransitionTo,
    getAvailableActions,
    getNextStatuses,

    // Action checks
    canEdit,
    canDelete,
    canComplete,
    canApprove,
    canReject,
    canSign,

    // State checks
    isFinalState,
    isEditable,
    isPendingApproval,
    isRejected,

    // Status display
    getStatusColor,
    getStatusBgColor,
    getStatusIcon,
    getStatusLabel,
    getStatusDescription,

    // Transition info
    getTransitionDescription,
    getTransitionValidations,
    requiresValidations,

    // Utilities
    getAllStatuses,
    getStatusHistory,
  }
}
