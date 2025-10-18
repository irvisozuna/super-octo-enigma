import type { Employee, EmployeeCreateRequest, EmployeeListResponse, EmployeeUpdateRequest } from '../entities/EmployeeEntity'

export interface EmployeeRepository {
  getAll(params?: any): Promise<EmployeeListResponse>
  getById(id: string): Promise<Employee>
  create(employee: EmployeeCreateRequest): Promise<Employee>
  update(id: string, employee: EmployeeUpdateRequest): Promise<Employee>
  delete(id: string): Promise<void>
  getByDepartment(department: string, params?: any): Promise<EmployeeListResponse>
  getActive(params?: any): Promise<EmployeeListResponse>
}
