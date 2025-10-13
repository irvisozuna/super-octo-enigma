/**
 * Employee Application Service
 *
 * Orchestrates business operations and coordinates between layers
 * Implements use cases and handles cross-cutting concerns
 */

import type { EmployeeRepository } from '../../domain/repositories/EmployeeRepository'
import type { CreateEmployeeRequest, EmployeeEntity, UpdateEmployeeRequest } from '../../domain/entities/EmployeeEntity'
import { EmployeeDomain } from '../../domain/entities/EmployeeEntity'
import { EmployeeMapper } from '../mappers/EmployeeMapper'
import type { INotificationService } from '../../shared/contracts/INotificationService'
import type { EmployeeFilter, PaginatedResponse } from '../../shared/types'

export class EmployeeApplicationService {
  constructor(
    private employeeRepository: EmployeeRepository,
    private notificationService?: INotificationService,
  ) {}

  /**
   * Get employees with filtering and pagination
   */
  async getEmployees(filter?: EmployeeFilter): Promise<PaginatedResponse<EmployeeEntity>> {
    try {
      return await this.employeeRepository.findAll(filter)
    }
    catch (error) {
      this.handleError('Error al obtener la lista de empleados', error)
      throw error
    }
  }

  /**
   * Get employee by ID
   */
  async getEmployeeById(id: string): Promise<EmployeeEntity> {
    try {
      const response = await this.employeeRepository.findById(id)
      return response.data
    }
    catch (error) {
      this.handleError('Error al obtener el empleado', error)
      throw error
    }
  }

  /**
   * Create new employee with validation
   */
  async createEmployee(data: CreateEmployeeRequest): Promise<EmployeeEntity> {
    try {
      // Domain validation
      const validationErrors = EmployeeDomain.validate(data)
      if (validationErrors.length > 0)
        throw new Error(validationErrors.join(', '))

      // Check employee code availability
      const isCodeAvailable = await this.employeeRepository.isEmployeeCodeAvailable(data.employee_code)
      if (!isCodeAvailable)
        throw new Error('El código de empleado ya está en uso')

      // Check email uniqueness if provided
      if (data.email) {
        // Could add email check here if API supports it
      }

      const response = await this.employeeRepository.create(data)

      this.showSuccess('Empleado creado correctamente')

      return response.data
    }
    catch (error) {
      this.handleError('Error al crear el empleado', error)
      throw error
    }
  }

  /**
   * Update employee with validation
   */
  async updateEmployee(id: string, data: Partial<UpdateEmployeeRequest>): Promise<EmployeeEntity> {
    try {
      // Get current employee for comparison
      const currentEmployee = await this.getEmployeeById(id)

      // Check if there are actual changes
      if (!EmployeeDomain.hasChanges(currentEmployee, data)) {
        this.showInfo('No hay cambios para guardar')
        return currentEmployee
      }

      // Domain validation for updated fields
      const validationErrors = EmployeeDomain.validate(data)
      if (validationErrors.length > 0)
        throw new Error(validationErrors.join(', '))

      // Check employee code availability if changed
      if (data.employee_code && data.employee_code !== currentEmployee.employee_code) {
        const isAvailable = await this.employeeRepository.isEmployeeCodeAvailable(data.employee_code, id)
        if (!isAvailable)
          throw new Error('El código de empleado ya está en uso')
      }

      const response = await this.employeeRepository.update(id, data)

      this.showSuccess('Empleado actualizado correctamente')

      return response.data
    }
    catch (error) {
      this.handleError('Error al actualizar el empleado', error)
      throw error
    }
  }

  /**
   * Delete employee with business rules validation
   */
  async deleteEmployee(id: string): Promise<void> {
    try {
      // Get employee to check business rules
      const employee = await this.getEmployeeById(id)

      // Check if can be deleted
      const { canDelete, reason } = EmployeeDomain.canDelete(employee)
      if (!canDelete)
        throw new Error(reason)

      await this.employeeRepository.delete(id)

      this.showSuccess('Empleado eliminado correctamente')
    }
    catch (error) {
      this.handleError('Error al eliminar el empleado', error)
      throw error
    }
  }

  /**
   * Search employees by employee code
   */
  async searchByEmployeeCode(employeeCode: string): Promise<EmployeeEntity | null> {
    try {
      const response = await this.employeeRepository.findByEmployeeCode(employeeCode)
      return response.data
    }
    catch (error) {
      if ((error as any).status === 404)
        return null

      this.handleError('Error al buscar el empleado', error)
      throw error
    }
  }

  /**
   * Suspend employee
   */
  async suspendEmployee(id: string): Promise<EmployeeEntity> {
    try {
      const response = await this.employeeRepository.suspend(id)

      this.showSuccess('Empleado suspendido correctamente')

      return response.data
    }
    catch (error) {
      this.handleError('Error al suspender el empleado', error)
      throw error
    }
  }

  /**
   * Reactivate employee
   */
  async reactivateEmployee(id: string): Promise<EmployeeEntity> {
    try {
      const response = await this.employeeRepository.reactivate(id)

      this.showSuccess('Empleado reactivado correctamente')

      return response.data
    }
    catch (error) {
      this.handleError('Error al reactivar el empleado', error)
      throw error
    }
  }

  /**
   * Terminate employee
   */
  async terminateEmployee(id: string): Promise<EmployeeEntity> {
    try {
      const response = await this.employeeRepository.terminate(id)

      this.showSuccess('Empleado terminado correctamente')

      return response.data
    }
    catch (error) {
      this.handleError('Error al terminar el empleado', error)
      throw error
    }
  }

  /**
   * Get operators
   */
  async getOperators(): Promise<EmployeeEntity[]> {
    try {
      const response = await this.employeeRepository.getOperators()
      return response.data
    }
    catch (error) {
      this.handleError('Error al obtener operadores', error)
      throw error
    }
  }

  /**
   * Get helpers
   */
  async getHelpers(): Promise<EmployeeEntity[]> {
    try {
      const response = await this.employeeRepository.getHelpers()
      return response.data
    }
    catch (error) {
      this.handleError('Error al obtener ayudantes', error)
      throw error
    }
  }

  /**
   * Get employee statistics
   */
  async getStatistics() {
    try {
      const response = await this.employeeRepository.getStatistics()
      return response.data
    }
    catch (error) {
      this.handleError('Error al obtener estadísticas', error)
      throw error
    }
  }

  /**
   * Export employees data
   */
  async exportEmployees(filter?: EmployeeFilter, format = 'excel'): Promise<Blob> {
    try {
      const blob = await this.employeeRepository.export(filter, format as 'csv' | 'excel' | 'pdf')

      this.showSuccess('Exportación completada')

      return blob
    }
    catch (error) {
      this.handleError('Error al exportar datos', error)
      throw error
    }
  }

  /**
   * Validate employee data without saving
   */
  validateEmployeeData(data: Partial<CreateEmployeeRequest>): string[] {
    return EmployeeDomain.validate(data)
  }

  /**
   * Get employee display name
   */
  getEmployeeDisplayName(employee: EmployeeEntity): string {
    return EmployeeDomain.getDisplayName(employee)
  }

  /**
   * Calculate employee age
   */
  calculateEmployeeAge(employee: EmployeeEntity): number | undefined {
    return employee.date_of_birth ? EmployeeDomain.calculateAge(employee.date_of_birth) : undefined
  }

  /**
   * Calculate years of service
   */
  calculateYearsOfService(employee: EmployeeEntity): number {
    return EmployeeDomain.calculateYearsOfService(employee.hire_date, employee.termination_date)
  }

  // Private helper methods

  private showSuccess(message: string): void {
    this.notificationService?.success('Éxito', message)
  }

  private showInfo(message: string): void {
    this.notificationService?.info('Información', message)
  }

  private handleError(title: string, error: any): void {
    console.error(title, error)

    let message = 'Ha ocurrido un error inesperado'

    if (error?.response?.data?.message)
      message = error.response.data.message
    else if (error?.message)
      message = error.message

    this.notificationService?.error(title, message)
  }
}
