/**
 * Fine Domain Entity
 *
 * Core business entity representing a traffic fine in the transport system
 */

import type { BaseEntity, FineStatus, ViolationType } from '../../../shared/types'

export interface FineEntity extends BaseEntity {

  // Basic Information
  fine_number: string
  violation_type: ViolationType
  description: string

  // Relationships
  vehicle_id: string
  driver_id?: string

  // Financial Information
  amount: number
  discount_amount?: number
  final_amount?: number
  currency: string

  // Dates
  violation_date: string
  due_date: string
  payment_deadline?: string

  // Location Information
  location?: string
  coordinates?: string

  // Officer Information
  officer_name?: string
  officer_badge?: string

  // Status and Control
  status: FineStatus
  is_paid: boolean
  is_overdue: boolean
  is_contested: boolean

  // Payment Information
  payment_date?: string
  payment_method?: string
  payment_reference?: string

  // Contest Information
  contest_date?: string
  contest_reason?: string
  contest_status?: string

  // Additional Information
  notes?: string
  observations?: string
  evidence_photos?: string[]

  // Relationship IDs
  company_id: string

  // Computed Fields (from API)
  days_overdue?: number
  days_until_due?: number
  discount_percentage?: number
  penalties?: number

  // Relationships (when included)
  vehicle?: any
  driver?: any
  payments?: any[]
  photos?: any[]
  documents?: any[]
}

export interface CreateFineRequest {
  fine_number: string
  vehicle_id: string
  driver_id?: string
  violation_type: ViolationType
  description: string
  amount: number
  currency: string
  violation_date: string
  due_date: string
  location?: string
  coordinates?: string
  officer_name?: string
  officer_badge?: string
  notes?: string
  status: FineStatus
}

export interface UpdateFineRequest extends Partial<CreateFineRequest> {
  id: string
}

export interface FineSearchCriteria {
  fine_number?: string
  vehicle_id?: string
  driver_id?: string
  violation_type?: ViolationType
  status?: FineStatus
  location?: string
  officer_name?: string
  violation_date_from?: string
  violation_date_to?: string
  due_date_from?: string
  due_date_to?: string
  amount_from?: number
  amount_to?: number
  is_overdue?: boolean
  is_paid?: boolean
}

/**
 * Fine business rules and validations
 */
export class FineDomain {
  /**
   * Validate fine data before creation/update
   */
  static validate(data: Partial<CreateFineRequest>): string[] {
    const errors: string[] = []

    // Required fields validation
    if (!data.fine_number?.trim())
      errors.push('El número de multa es requerido')

    if (!data.vehicle_id?.trim())
      errors.push('El vehículo es requerido')

    if (!data.violation_type)
      errors.push('El tipo de infracción es requerido')

    if (!data.description?.trim())
      errors.push('La descripción es requerida')

    if (!data.amount || data.amount <= 0)
      errors.push('El monto debe ser mayor a 0')

    if (!data.violation_date)
      errors.push('La fecha de infracción es requerida')

    if (!data.due_date)
      errors.push('La fecha de vencimiento es requerida')

    // Business rules validation
    if (data.fine_number && data.fine_number.length < 3)
      errors.push('El número de multa debe tener al menos 3 caracteres')

    if (data.description && data.description.length < 10)
      errors.push('La descripción debe tener al menos 10 caracteres')

    if (data.amount && data.amount > 100000)
      errors.push('El monto no puede exceder $100,000')

    // Date validations
    if (data.violation_date && data.due_date) {
      const violationDate = new Date(data.violation_date)
      const dueDate = new Date(data.due_date)
      const today = new Date()

      if (violationDate > today)
        errors.push('La fecha de infracción no puede ser futura')

      if (dueDate <= violationDate)
        errors.push('La fecha de vencimiento debe ser posterior a la fecha de infracción')

      // Minimum due period (e.g., 15 days)
      const minDuePeriod = 15 * 24 * 60 * 60 * 1000 // 15 days in milliseconds
      if (dueDate.getTime() - violationDate.getTime() < minDuePeriod)
        errors.push('El período de pago debe ser de al menos 15 días')
    }

    return errors
  }

  /**
   * Calculate days until due date
   */
  static daysUntilDue(dueDate?: string): number {
    if (!dueDate)
      return 0

    const due = new Date(dueDate)
    const now = new Date()
    const diffTime = due.getTime() - now.getTime()

    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Calculate days overdue
   */
  static daysOverdue(dueDate?: string): number {
    if (!dueDate)
      return 0

    const due = new Date(dueDate)
    const now = new Date()
    const diffTime = now.getTime() - due.getTime()

    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
  }

  /**
   * Check if fine is overdue
   */
  static isOverdue(dueDate?: string): boolean {
    if (!dueDate)
      return false

    const due = new Date(dueDate)
    const now = new Date()

    return due < now
  }

  /**
   * Calculate penalties for overdue fines
   */
  static calculatePenalties(amount: number, daysOverdue: number, penaltyRate = 0.02): number {
    if (daysOverdue <= 0)
      return 0

    // Calculate monthly penalty (2% per month example)
    const monthsOverdue = Math.ceil(daysOverdue / 30)

    return amount * penaltyRate * monthsOverdue
  }

  /**
   * Calculate final amount with penalties and discounts
   */
  static calculateFinalAmount(fine: FineEntity): number {
    let finalAmount = fine.amount

    // Add penalties if overdue
    if (fine.days_overdue && fine.days_overdue > 0) {
      const penalties = this.calculatePenalties(fine.amount, fine.days_overdue)

      finalAmount += penalties
    }

    // Apply discount if applicable
    if (fine.discount_amount)
      finalAmount -= fine.discount_amount

    return Math.max(0, finalAmount)
  }

  /**
   * Get violation type label
   */
  static getViolationTypeLabel(violationType: ViolationType): string {
    const labels = {
      SPEEDING: 'Exceso de Velocidad',
      PARKING: 'Estacionamiento Indebido',
      TRAFFIC_LIGHT: 'Semáforo en Rojo',
      STOP_SIGN: 'No Respetar Alto',
      DRIVING_LICENSE: 'Licencia de Conducir',
      VEHICLE_REGISTRATION: 'Registro Vehicular',
      INSURANCE: 'Seguro Vehicular',
      OTHER: 'Otra Infracción',
    }

    return labels[violationType] || violationType
  }

  /**
   * Get fine status label
   */
  static getStatusLabel(status: FineStatus): string {
    const labels = {
      PENDING: 'Pendiente',
      PAID: 'Pagada',
      OVERDUE: 'Vencida',
      CANCELLED: 'Cancelada',
      CONTESTED: 'Impugnada',
    }

    return labels[status] || status
  }

  /**
   * Get fine status color
   */
  static getStatusColor(fine: FineEntity): string {
    if (fine.status === 'PAID')
      return '#16A34A' // Green
    if (fine.status === 'CANCELLED')
      return '#6B7280' // Gray
    if (fine.status === 'CONTESTED')
      return '#2563EB' // Blue
    if (fine.is_overdue)
      return '#DC2626' // Red

    return '#EAB308' // Yellow
  }

  /**
   * Check if fine can be deleted (business rules)
   */
  static canDelete(fine: FineEntity): { canDelete: boolean; reason?: string } {
    // Cannot delete if paid
    if (fine.is_paid || fine.status === 'PAID') {
      return {
        canDelete: false,
        reason: 'No se puede eliminar una multa que ya ha sido pagada',
      }
    }

    // Cannot delete if contested
    if (fine.is_contested || fine.status === 'CONTESTED') {
      return {
        canDelete: false,
        reason: 'No se puede eliminar una multa que está siendo impugnada',
      }
    }

    return { canDelete: true }
  }

  /**
   * Check if fine can be paid
   */
  static canPay(fine: FineEntity): boolean {
    return fine.status === 'PENDING' || fine.status === 'OVERDUE'
  }

  /**
   * Check if fine can be contested
   */
  static canContest(fine: FineEntity): boolean {
    return (fine.status === 'PENDING' || fine.status === 'OVERDUE')
           && !fine.is_contested
           && !fine.is_paid
  }

  /**
   * Check if fine can be cancelled
   */
  static canCancel(fine: FineEntity): boolean {
    return fine.status !== 'PAID' && fine.status !== 'CANCELLED'
  }

  /**
   * Get early payment discount
   */
  static getEarlyPaymentDiscount(fine: FineEntity, discountRate = 0.1): number {
    const daysUntilDue = this.daysUntilDue(fine.due_date)

    // Apply discount if paid early (e.g., more than 15 days before due)
    if (daysUntilDue > 15)
      return fine.amount * discountRate

    return 0
  }

  /**
   * Check if fine data has changed
   */
  static hasChanges(original: FineEntity, updated: Partial<FineEntity>): boolean {
    const fieldsToCompare = [
      'fine_number',
      'vehicle_id',
      'driver_id',
      'violation_type',
      'description',
      'amount',
      'violation_date',
      'due_date',
      'location',
      'officer_name',
      'officer_badge',
      'notes',
      'status',
    ]

    return fieldsToCompare.some(field => {
      const originalValue = original[field as keyof FineEntity]
      const updatedValue = updated[field as keyof FineEntity]

      return originalValue !== updatedValue
    })
  }

  /**
   * Format fine display name
   */
  static getDisplayName(fine: FineEntity): string {
    return `${fine.fine_number} - ${this.getViolationTypeLabel(fine.violation_type)}`
  }

  /**
   * Get severity level based on violation type and amount
   */
  static getSeverityLevel(fine: FineEntity): 'LOW' | 'MEDIUM' | 'HIGH' {
    const highSeverityTypes = ['SPEEDING', 'TRAFFIC_LIGHT', 'DRIVING_LICENSE']
    const highAmountThreshold = 5000

    if (highSeverityTypes.includes(fine.violation_type) || fine.amount > highAmountThreshold)
      return 'HIGH'
    else if (fine.amount > 1000)
      return 'MEDIUM'

    return 'LOW'
  }
}
