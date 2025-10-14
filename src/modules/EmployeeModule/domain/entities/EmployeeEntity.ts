/**
 * Employee Domain Entity
 *
 * Core business entity representing an employee with domain logic
 */

import type { BaseEntity, EmployeePosition, EmployeeStatus, EmploymentType, Gender } from '../../shared/types'

export interface EmployeeEntity extends BaseEntity {

  // Basic Information
  employee_code: string
  first_name: string
  last_name: string
  full_name: string
  date_of_birth?: string
  gender?: Gender
  tax_id?: string
  photo_url?: string

  // Contact Information
  primary_phone?: string
  secondary_phone?: string
  email?: string

  // Address
  address_line_1?: string
  address_line_2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string

  // Emergency Contact
  emergency_contact_name?: string
  emergency_contact_phone?: string

  // Employment Information
  hire_date: string
  termination_date?: string
  position: EmployeePosition
  department?: string
  employment_type: EmploymentType
  salary_amount?: number
  salary_currency?: string
  status: EmployeeStatus

  // Computed Fields
  is_active: boolean
  age?: number

  // Relationships
  skills?: EmployeeSkillEntity[]
  certifications?: EmployeeCertificationEntity[]
  employment_history?: EmploymentHistoryEntity[]
}

export interface EmployeeSkillEntity extends BaseEntity {
  employee_id: string
  skill_name: string
  proficiency_level: string
  years_of_experience?: number
  acquired_date?: string
  notes?: string
}

export interface EmployeeCertificationEntity extends BaseEntity {
  employee_id: string
  certification_name: string
  certification_number?: string
  issuing_organization: string
  issue_date: string
  expiration_date?: string
  status: string
  document_url?: string
}

export interface EmploymentHistoryEntity extends BaseEntity {
  employee_id: string
  change_type: string
  change_description?: string
  previous_position?: EmployeePosition
  new_position?: EmployeePosition
  previous_status?: EmployeeStatus
  new_status?: EmployeeStatus
  change_date: string
  reason?: string
  notes?: string
  changed_by?: string
  changed_by_user?: {
    id: string
    name: string
    email: string
  }
}

// Request interfaces for creating/updating employees
export interface CreateEmployeeRequest {
  employee_code: string
  first_name: string
  last_name: string
  date_of_birth?: string
  gender?: Gender
  tax_id?: string
  photo_url?: string
  primary_phone?: string
  secondary_phone?: string
  email?: string
  address_line_1?: string
  address_line_2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  hire_date: string
  position: EmployeePosition
  department?: string
  employment_type: EmploymentType
  salary_amount?: number
  salary_currency?: string
  status?: EmployeeStatus
}

export interface UpdateEmployeeRequest extends Partial<CreateEmployeeRequest> {
  id: string
}

export interface EmployeeSearchCriteria {
  first_name?: string
  last_name?: string
  position?: EmployeePosition
  status?: EmployeeStatus
  department?: string
  employment_type?: EmploymentType
}

/**
 * Employee Domain Logic
 *
 * Business rules and validations for employees
 */
export class EmployeeDomain {
  /**
   * Validate employee data before creation/update
   */
  static validate(data: Partial<CreateEmployeeRequest>): string[] {
    const errors: string[] = []

    // Required fields validation
    if (!data.employee_code?.trim())
      errors.push('El código de empleado es requerido')

    if (!data.first_name?.trim())
      errors.push('El nombre es requerido')

    if (!data.last_name?.trim())
      errors.push('El apellido es requerido')

    if (!data.hire_date)
      errors.push('La fecha de contratación es requerida')

    if (!data.position)
      errors.push('El puesto es requerido')

    if (!data.employment_type)
      errors.push('El tipo de empleo es requerido')

    // Business rules validation
    if (data.employee_code && data.employee_code.length > 50)
      errors.push('El código de empleado no puede exceder 50 caracteres')

    if (data.first_name && data.first_name.length > 100)
      errors.push('El nombre no puede exceder 100 caracteres')

    if (data.last_name && data.last_name.length > 100)
      errors.push('El apellido no puede exceder 100 caracteres')

    // Date validations
    if (data.date_of_birth) {
      const birthDate = new Date(data.date_of_birth)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()

      if (age < 18)
        errors.push('El empleado debe ser mayor de 18 años')

      if (age > 100)
        errors.push('Fecha de nacimiento inválida')
    }

    if (data.hire_date && data.termination_date) {
      const hireDate = new Date(data.hire_date)
      const terminationDate = new Date(data.termination_date)

      if (terminationDate <= hireDate)
        errors.push('La fecha de terminación debe ser posterior a la fecha de contratación')
    }

    // Email validation
    if (data.email && !EmployeeDomain.isValidEmail(data.email))
      errors.push('El email no es válido')

    // Phone validation
    if (data.primary_phone && !EmployeeDomain.isValidPhone(data.primary_phone))
      errors.push('El teléfono principal no es válido')

    if (data.secondary_phone && !EmployeeDomain.isValidPhone(data.secondary_phone))
      errors.push('El teléfono secundario no es válido')

    // Salary validation
    if (data.salary_amount !== undefined && data.salary_amount < 0)
      errors.push('El salario no puede ser negativo')

    return errors
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/

    return emailRegex.test(email)
  }

  /**
   * Validate phone format (Mexican format: 10 digits)
   */
  static isValidPhone(phone: string): boolean {
    const cleanPhone = phone.replace(/\D/g, '')

    return cleanPhone.length === 10
  }

  /**
   * Calculate employee age
   */
  static calculateAge(dateOfBirth: string): number {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()))
      age--

    return age
  }

  /**
   * Check if employee is active
   */
  static isActive(status: EmployeeStatus): boolean {
    return status === 'active'
  }

  /**
   * Check if employee can be deleted
   */
  static canDelete(employee: EmployeeEntity): { canDelete: boolean; reason?: string } {
    // Cannot delete active employees
    if (employee.status === 'active') {
      return {
        canDelete: false,
        reason: 'No se puede eliminar un empleado activo',
      }
    }

    // Cannot delete if has recent activity (less than 30 days since termination)
    if (employee.termination_date) {
      const terminationDate = new Date(employee.termination_date)

      const daysSinceTermination = Math.floor(
        (new Date().getTime() - terminationDate.getTime()) / (1000 * 60 * 60 * 24),
      )

      if (daysSinceTermination < 30) {
        return {
          canDelete: false,
          reason: 'Debe esperar al menos 30 días después de la terminación para eliminar',
        }
      }
    }

    return { canDelete: true }
  }

  /**
   * Get employee status color
   */
  static getStatusColor(status: EmployeeStatus): string {
    const colors = {
      active: '#16A34A',
      inactive: '#6B7280',
      suspended: '#F97316',
      terminated: '#DC2626',
      vacation: '#2563EB',
    }

    return colors[status] || colors.inactive
  }

  /**
   * Get position display name
   */
  static getPositionLabel(position: EmployeePosition): string {
    const labels = {
      operator: 'Operador',
      helper: 'Ayudante',
      manager: 'Gerente',
      supervisor: 'Supervisor',
      admin: 'Administrador',
    }

    return labels[position] || position
  }

  /**
   * Get employment type display name
   */
  static getEmploymentTypeLabel(type: EmploymentType): string {
    const labels = {
      full_time: 'Tiempo Completo',
      part_time: 'Medio Tiempo',
      contractor: 'Contratista',
      temporary: 'Temporal',
    }

    return labels[type] || type
  }

  /**
   * Format employee display name
   */
  static getDisplayName(employee: EmployeeEntity): string {
    return `${employee.first_name} ${employee.last_name} (${employee.employee_code})`
  }

  /**
   * Check if employee data has changed
   */
  static hasChanges(original: EmployeeEntity, updated: Partial<EmployeeEntity>): boolean {
    const fieldsToCompare = [
      'employee_code',
      'first_name',
      'last_name',
      'email',
      'primary_phone',
      'position',
      'department',
      'employment_type',
      'status',
      'salary_amount',
    ]

    return fieldsToCompare.some(field => {
      const originalValue = original[field as keyof EmployeeEntity]
      const updatedValue = updated[field as keyof EmployeeEntity]

      return updatedValue !== undefined && originalValue !== updatedValue
    })
  }

  /**
   * Calculate years of service
   */
  static calculateYearsOfService(hireDate: string, terminationDate?: string): number {
    const start = new Date(hireDate)
    const end = terminationDate ? new Date(terminationDate) : new Date()
    const years = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25)

    return Math.floor(years * 10) / 10 // Round to 1 decimal
  }

  /**
   * Check if certification is expired
   */
  static isCertificationExpired(certification: EmployeeCertificationEntity): boolean {
    if (!certification.expiration_date)
      return false

    const expirationDate = new Date(certification.expiration_date)
    const today = new Date()

    return expirationDate < today
  }

  /**
   * Check if certification expires soon (within 30 days)
   */
  static isCertificationExpiringSoon(certification: EmployeeCertificationEntity, days = 30): boolean {
    if (!certification.expiration_date)
      return false

    const expirationDate = new Date(certification.expiration_date)
    const today = new Date()

    const daysUntilExpiration = Math.floor(
      (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    )

    return daysUntilExpiration > 0 && daysUntilExpiration <= days
  }
}
