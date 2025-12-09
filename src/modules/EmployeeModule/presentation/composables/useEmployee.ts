/**
 * Employee Composable
 *
 * Reusable composition function for employee operations
 */

import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEmployeeStore } from '../stores/employeeStore'
import { EmployeeDomain } from '../../domain/entities/EmployeeEntity'
import type { EmployeeEntity } from '../../domain/entities/EmployeeEntity'

export function useEmployee() {
  const { t } = useI18n()
  const employeeStore = useEmployeeStore()
  const loading = ref(false)

  /**
   * Get employee by ID
   */
  async function getEmployee(id: string): Promise<EmployeeEntity | null> {
    loading.value = true

    try {
      await employeeStore.fetchById(id)

      return employeeStore.currentItem
    }
    catch (error) {
      console.error('Error loading employee:', error)

      return null
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Get status color
   */
  function getStatusColor(status: string) {
    return EmployeeDomain.getStatusColor(status as any)
  }

  /**
   * Get status label
   */
  function getStatusLabel(status: string) {
    return t(`employee.status.${status}`)
  }

  /**
   * Get position label
   */
  function getPositionLabel(position: string) {
    return t(`employee.positions.${position}`)
  }

  /**
   * Get employment type label
   */
  function getEmploymentTypeLabel(type: string) {
    return t(`employee.employment_types.${type}`)
  }

  /**
   * Format employee display name
   */
  function getDisplayName(employee: EmployeeEntity) {
    return EmployeeDomain.getDisplayName(employee)
  }

  /**
   * Calculate employee age
   */
  function calculateAge(employee: EmployeeEntity) {
    if (!employee.date_of_birth)
      return null

    return EmployeeDomain.calculateAge(employee.date_of_birth)
  }

  /**
   * Calculate years of service
   */
  function calculateYearsOfService(employee: EmployeeEntity) {
    return EmployeeDomain.calculateYearsOfService(
      employee.hire_date,
      employee.termination_date,
    )
  }

  /**
   * Check if employee can be deleted
   */
  function canDeleteEmployee(employee: EmployeeEntity) {
    return EmployeeDomain.canDelete(employee)
  }

  /**
   * Format date
   */
  function formatDate(date?: string) {
    if (!date)
      return '-'

    return new Date(date).toLocaleDateString()
  }

  /**
   * Format phone number
   */
  function formatPhone(phone?: string) {
    if (!phone)
      return '-'

    // Format: (XXX) XXX-XXXX
    if (phone.length === 10)
      return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`

    return phone
  }

  /**
   * Get employee initials
   */
  function getInitials(employee: EmployeeEntity) {
    return `${employee.first_name?.charAt(0) || ''}${employee.last_name?.charAt(0) || ''}`.toUpperCase()
  }

  /**
   * Check if employee is active
   */
  function isActive(employee: EmployeeEntity) {
    return EmployeeDomain.isActive(employee.status)
  }

  return {
    // State
    loading,

    // Store
    employeeStore,

    // Methods
    getEmployee,
    getStatusColor,
    getStatusLabel,
    getPositionLabel,
    getEmploymentTypeLabel,
    getDisplayName,
    calculateAge,
    calculateYearsOfService,
    canDeleteEmployee,
    formatDate,
    formatPhone,
    getInitials,
    isActive,
  }
}
