/**
 * Drilling Report Entity
 *
 * Core business entity for drilling reports following DDD principles
 */

export interface DrillingReportEntity {
  id: string
  report_number: string
  report_date: string
  shift: 'day' | 'night' | 'mixed'
  status: 'draft' | 'completed' | 'approved' | 'rejected'

  // Project and Well information
  project_id: string
  well_id: string
  equipment_id?: string

  // Personnel
  operator_day_id?: string
  helper1_day_id?: string
  helper2_day_id?: string
  operator_night_id?: string
  helper1_night_id?: string
  helper2_night_id?: string

  // Horometer readings
  horometer_start_day?: number
  horometer_start_night?: number
  horometer_end_day?: number
  horometer_end_night?: number

  // RPM settings
  rpm_pull_down?: number
  rpm_rotation?: number

  // Observations
  observations?: string

  // Metadata
  created_at: string
  updated_at: string
  created_by_id?: string

  // Relations (loaded separately)
  project?: ProjectEntity
  well?: WellEntity
  equipment?: EquipmentEntity
  personnel?: PersonnelEntity
  activities?: ActivityEntity[]
  consumptions?: ConsumptionEntity[]
  tool_assignments?: ToolAssignmentEntity[]
  signatures?: SignatureEntity[]
  totals?: ReportTotalsEntity
}

export interface ProjectEntity {
  id: string
  name: string
  code: string
  client?: {
    id: string
    business_name: string
  }
}

export interface WellEntity {
  id: string
  name: string
  well_number: string
  target_depth_meters: number
  current_depth_meters: number
  status: string
}

export interface EquipmentEntity {
  id: string
  name: string
  serial_number: string
  brand: string
  model: string
}

export interface PersonnelEntity {
  operator_day?: EmployeeEntity
  helper1_day?: EmployeeEntity
  helper2_day?: EmployeeEntity
  operator_night?: EmployeeEntity
  helper1_night?: EmployeeEntity
  helper2_night?: EmployeeEntity
}

export interface EmployeeEntity {
  id: string
  name: string
  position: string
}

export interface ActivityEntity {
  id: string
  activity_type: 'drilling' | 'maintenance' | 'installation' | 'testing' | 'waiting' | 'mobilization' | 'demobilization' | 'otros'
  shift: 'day' | 'night' | 'mixed'
  hours: number
  start_time?: string
  end_time?: string
  description?: string
}

export interface ConsumptionEntity {
  id: string
  consumable_type: string
  shift: 'day' | 'night' | 'mixed'
  quantity: number
  unit: 'kg' | 'bags' | 'liters' | 'gallons' | 'units'
}

export interface ToolAssignmentEntity {
  id: string
  tool_id: string
  shift: 'day' | 'night' | 'mixed'
  tool_category: string
  start_depth_meters: number
  end_depth_meters: number
  meters_drilled: number
  wear_pattern?: 'uniform' | 'centered' | 'eccentric' | 'one_sided'
  matrix?: 'good_condition' | 'moderate_wear' | 'severe_wear' | 'needs_replacement'
  assigned_at: string
  tool?: ToolEntity
}

export interface ToolEntity {
  id: string
  serial_number: string
  name: string
  manufacturer: string
  status: string
  total_usage_meters: number
  capacity_meters?: number
  remaining_meters?: number
}

export interface SignatureEntity {
  id: string
  signature_type: 'operator' | 'supervisor' | 'client'
  signatory_name: string
  signatory_user_id?: string
  signature_method: 'digital' | 'physical' | 'electronic'
  signature_data?: string
  signed_at: string
}

export interface ReportTotalsEntity {
  hours_worked: number
  meters_drilled: number
}

/**
 * Domain business rules and validations
 */
export class DrillingReportDomain {
  /**
   * Validate if a report can be completed
   */
  static canComplete(report: DrillingReportEntity): { canComplete: boolean; reason?: string } {
    if (report.status !== 'draft')
      return { canComplete: false, reason: 'Solo los reportes en borrador pueden completarse' }

    if (!report.operator_day_id && !report.operator_night_id)
      return { canComplete: false, reason: 'Debe tener al menos un operador asignado' }

    return { canComplete: true }
  }

  /**
   * Validate if a report can be approved
   */
  static canApprove(report: DrillingReportEntity): { canApprove: boolean; reason?: string } {
    if (report.status !== 'completed')
      return { canApprove: false, reason: 'Solo los reportes completados pueden aprobarse' }

    const hasOperatorSignature = report.signatures?.some(s => s.signature_type === 'operator')
    if (!hasOperatorSignature)
      return { canApprove: false, reason: 'Debe tener firma de operador' }

    return { canApprove: true }
  }

  /**
   * Validate if a report can be edited
   */
  static canEdit(report: DrillingReportEntity, userId: string): { canEdit: boolean; reason?: string } {
    if (report.status !== 'draft' && report.status !== 'rejected')
      return { canEdit: false, reason: 'Solo los reportes en borrador o rechazados pueden editarse' }

    if (report.created_by_id && report.created_by_id !== userId && report.status === 'draft')
      return { canEdit: false, reason: 'Solo el creador puede editar reportes en borrador' }

    return { canEdit: true }
  }

  /**
   * Calculate total hours for a shift
   */
  static calculateShiftHours(activities: ActivityEntity[], shift: 'day' | 'night' | 'mixed'): number {
    return activities
      .filter(activity => activity.shift === shift || activity.shift === 'mixed')
      .reduce((total, activity) => total + activity.hours, 0)
  }

  /**
   * Validate shift hours don't exceed 24
   */
  static validateShiftHours(activities: ActivityEntity[], newActivity: Partial<ActivityEntity>): { isValid: boolean; reason?: string } {
    const shift = newActivity.shift
    if (!shift)
      return { isValid: false, reason: 'Turno requerido' }

    const currentHours = this.calculateShiftHours(activities, shift)
    const newHours = newActivity.hours || 0

    if (currentHours + newHours > 24) {
      return {
        isValid: false,
        reason: `El turno ${shift} ya tiene ${currentHours}h. No puedes agregar ${newHours}h más (máximo 24h)`,
      }
    }

    return { isValid: true }
  }

  /**
   * Validate tool capacity
   */
  static validateToolCapacity(tool: ToolEntity, metersToDrill: number): { isValid: boolean; reason?: string; remaining?: number } {
    if (!tool.capacity_meters)
      return { isValid: true } // No capacity limit

    const remaining = tool.capacity_meters - tool.total_usage_meters
    if (remaining < metersToDrill) {
      return {
        isValid: false,
        reason: `Capacidad insuficiente. Restante: ${remaining}m, Requerido: ${metersToDrill}m`,
        remaining,
      }
    }

    return { isValid: true, remaining }
  }

  /**
   * Get status display information
   */
  static getStatusInfo(status: DrillingReportEntity['status']) {
    const statusConfig = {
      draft: {
        label: 'Borrador',
        color: '#FCD34D',
        bgColor: '#FEF3C7',
        icon: '✏️',
        description: 'Reporte en construcción',
      },
      completed: {
        label: 'Completado',
        color: '#60A5FA',
        bgColor: '#DBEAFE',
        icon: '📝',
        description: 'Esperando aprobación',
      },
      approved: {
        label: 'Aprobado',
        color: '#34D399',
        bgColor: '#D1FAE5',
        icon: '✅',
        description: 'Reporte aprobado',
      },
      rejected: {
        label: 'Rechazado',
        color: '#F87171',
        bgColor: '#FEE2E2',
        icon: '❌',
        description: 'Requiere corrección',
      },
    }

    return statusConfig[status]
  }

  /**
   * Get available actions for a report based on status and user permissions
   */
  static getAvailableActions(report: DrillingReportEntity, userPermissions: string[]): string[] {
    const actions: string[] = []

    // View action is always available
    actions.push('view')

    // Edit action
    if (report.status === 'draft' || report.status === 'rejected')
      actions.push('edit')

    // Complete action
    if (report.status === 'draft' && userPermissions.includes('drilling.reports.complete'))
      actions.push('complete')

    // Approve action
    if (report.status === 'completed' && userPermissions.includes('drilling.reports.approve'))
      actions.push('approve')

    // Reject action
    if (report.status === 'completed' && userPermissions.includes('drilling.reports.reject'))
      actions.push('reject')

    // Delete action
    if (report.status === 'draft' && userPermissions.includes('drilling.reports.delete'))
      actions.push('delete')

    // Export action
    if (userPermissions.includes('drilling.reports.export'))
      actions.push('export')

    return actions
  }
}
