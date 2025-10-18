import type { EmployeeRepository } from '../../domain/repositories/EmployeeRepository'
import type { EmployeeCreateRequest, EmployeeUpdateRequest } from '../../domain/entities/EmployeeEntity'
import { Employee, EmployeeListResponse } from '../../domain/entities/EmployeeEntity'
import type { EmployeeCreateDto, EmployeeDto, EmployeeListDto, EmployeeUpdateDto } from '../dtos/EmployeeDtos'
import { EmployeeMapper } from '../mappers/EmployeeMapper'

export class EmployeeApplicationService {
  constructor(private employeeRepository: EmployeeRepository) {}

  async getAllEmployees(params?: any): Promise<EmployeeListDto> {
    const response = await this.employeeRepository.getAll(params)

    return {
      data: response.data.map(employee => EmployeeMapper.toDto(employee)),
      total: response.total,
      page: response.page,
      per_page: response.per_page,
      last_page: response.last_page,
    }
  }

  async getEmployeeById(id: string): Promise<EmployeeDto> {
    const employee = await this.employeeRepository.getById(id)

    return EmployeeMapper.toDto(employee)
  }

  async createEmployee(employeeData: EmployeeCreateDto): Promise<EmployeeDto> {
    const entityData = EmployeeMapper.createDtoToEntity(employeeData)
    const employee = await this.employeeRepository.create(entityData as EmployeeCreateRequest)

    return EmployeeMapper.toDto(employee)
  }

  async updateEmployee(id: string, employeeData: EmployeeUpdateDto): Promise<EmployeeDto> {
    const entityData = EmployeeMapper.updateDtoToEntity(employeeData)
    const employee = await this.employeeRepository.update(id, entityData as EmployeeUpdateRequest)

    return EmployeeMapper.toDto(employee)
  }

  async deleteEmployee(id: string): Promise<void> {
    await this.employeeRepository.delete(id)
  }

  async getEmployeesByDepartment(department: string, params?: any): Promise<EmployeeListDto> {
    const response = await this.employeeRepository.getByDepartment(department, params)

    return {
      data: response.data.map(employee => EmployeeMapper.toDto(employee)),
      total: response.total,
      page: response.page,
      per_page: response.per_page,
      last_page: response.last_page,
    }
  }

  async getActiveEmployees(params?: any): Promise<EmployeeListDto> {
    const response = await this.employeeRepository.getActive(params)

    return {
      data: response.data.map(employee => EmployeeMapper.toDto(employee)),
      total: response.total,
      page: response.page,
      per_page: response.per_page,
      last_page: response.last_page,
    }
  }
}
