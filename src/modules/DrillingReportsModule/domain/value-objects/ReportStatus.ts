/**
 * Report Status Value Object
 *
 * Encapsulates the business rules for report status transitions
 */

export type ReportStatus = 'draft' | 'completed' | 'approved' | 'rejected'

export interface StatusTransition {
  from: ReportStatus
  to: ReportStatus
  action: string
  permission: string
  validations: string[]
}

export class ReportStatusVO {
  private static readonly STATUS_TRANSITIONS: StatusTransition[] = [
    {
      from: 'draft',
      to: 'completed',
      action: 'complete',
      permission: 'drilling.reports.complete',
      validations: [
        'Debe tener al menos 1 actividad',
        'Debe tener al menos 1 operador asignado',
      ],
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
    },
    {
      from: 'completed',
      to: 'rejected',
      action: 'reject',
      permission: 'drilling.reports.reject',
      validations: [
        'Debe proporcionar un motivo de rechazo',
      ],
    },
    {
      from: 'rejected',
      to: 'draft',
      action: 'edit',
      permission: 'drilling.reports.update',
      validations: [],
    },
  ]

  /**
   * Check if a status transition is valid
   */
  static canTransition(from: ReportStatus, to: ReportStatus): boolean {
    return this.STATUS_TRANSITIONS.some(
      transition => transition.from === from && transition.to === to,
    )
  }

  /**
   * Get available transitions from a status
   */
  static getAvailableTransitions(from: ReportStatus): StatusTransition[] {
    return this.STATUS_TRANSITIONS.filter(transition => transition.from === from)
  }

  /**
   * Get transition by action
   */
  static getTransitionByAction(action: string): StatusTransition | undefined {
    return this.STATUS_TRANSITIONS.find(transition => transition.action === action)
  }

  /**
   * Validate if user can perform action
   */
  static canPerformAction(
    currentStatus: ReportStatus,
    action: string,
    userPermissions: string[],
  ): boolean {
    const transition = this.getTransitionByAction(action)

    if (!transition || transition.from !== currentStatus)
      return false

    return userPermissions.includes(transition.permission)
  }

  /**
   * Get status display configuration
   */
  static getStatusConfig(status: ReportStatus) {
    const configs = {
      draft: {
        label: 'Borrador',
        color: '#FCD34D',
        bgColor: '#FEF3C7',
        icon: '✏️',
        description: 'Reporte en construcción',
        actions: ['edit', 'delete', 'complete'],
      },
      completed: {
        label: 'Completado',
        color: '#60A5FA',
        bgColor: '#DBEAFE',
        icon: '📝',
        description: 'Esperando aprobación',
        actions: ['view', 'approve', 'reject'],
      },
      approved: {
        label: 'Aprobado',
        color: '#34D399',
        bgColor: '#D1FAE5',
        icon: '✅',
        description: 'Reporte aprobado',
        actions: ['view', 'export'],
      },
      rejected: {
        label: 'Rechazado',
        color: '#F87171',
        bgColor: '#FEE2E2',
        icon: '❌',
        description: 'Requiere corrección',
        actions: ['view', 'edit'],
      },
    }

    return configs[status]
  }

  /**
   * Get next possible statuses
   */
  static getNextStatuses(currentStatus: ReportStatus): ReportStatus[] {
    return this.getAvailableTransitions(currentStatus).map(t => t.to)
  }

  /**
   * Check if status allows editing
   */
  static isEditable(status: ReportStatus): boolean {
    return status === 'draft' || status === 'rejected'
  }

  /**
   * Check if status allows deletion
   */
  static isDeletable(status: ReportStatus): boolean {
    return status === 'draft'
  }

  /**
   * Check if status is final
   */
  static isFinal(status: ReportStatus): boolean {
    return status === 'approved'
  }
}
