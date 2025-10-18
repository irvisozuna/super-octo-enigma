import type { EmployeeRepository } from '../../../domain/repositories/EmployeeRepository'
import type { Employee, EmployeeCreateRequest, EmployeeListResponse, EmployeeUpdateRequest } from '../../../domain/entities/EmployeeEntity'
import type { EmployeeApiService } from '../../api/services/EmployeeApiService'

export class EmployeeRepositoryImpl implements EmployeeRepository {
  constructor(private employeeApiService: EmployeeApiService) {}

  async getAll(params?: any): Promise<EmployeeListResponse> {
    return await this.employeeApiService.getEmployees(params)
  }

  async getById(id: string): Promise<Employee> {
    return await this.employeeApiService.getEmployeeById(id)
  }

  async create(employee: EmployeeCreateRequest): Promise<Employee> {
    return await this.employeeApiService.createEmployee(employee)
  }

  async update(id: string, employee: EmployeeUpdateRequest): Promise<Employee> {
    return await this.employeeApiService.updateEmployee(id, employee)
  }

  async delete(id: string): Promise<void> {
    return await this.employeeApiService.deleteEmployee(id)
  }

  async getByDepartment(department: string, params?: any): Promise<EmployeeListResponse> {
    return await this.employeeApiService.getEmployeesByDepartment(department, params)
  }

  async getActive(params?: any): Promise<EmployeeListResponse> {
    return await this.employeeApiService.getActiveEmployees(params)
  }
}
