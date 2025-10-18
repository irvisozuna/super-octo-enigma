import axios from 'axios'
import type { Employee, EmployeeCreateRequest, EmployeeListResponse, EmployeeUpdateRequest } from '../../../domain/entities/EmployeeEntity'

export class EmployeeApiService {
  private baseUrl = '/api/employees'

  async getEmployees(params?: any): Promise<EmployeeListResponse> {
    const response = await axios.get(this.baseUrl, { params })

    return response.data
  }

  async getEmployeeById(id: string): Promise<Employee> {
    const response = await axios.get(`${this.baseUrl}/${id}`)

    return response.data
  }

  async createEmployee(employee: EmployeeCreateRequest): Promise<Employee> {
    const response = await axios.post(this.baseUrl, employee)

    return response.data
  }

  async updateEmployee(id: string, employee: EmployeeUpdateRequest): Promise<Employee> {
    const response = await axios.put(`${this.baseUrl}/${id}`, employee)

    return response.data
  }

  async deleteEmployee(id: string): Promise<void> {
    await axios.delete(`${this.baseUrl}/${id}`)
  }

  async getEmployeesByDepartment(department: string, params?: any): Promise<EmployeeListResponse> {
    const response = await axios.get(`${this.baseUrl}/department/${department}`, { params })

    return response.data
  }

  async getActiveEmployees(params?: any): Promise<EmployeeListResponse> {
    const response = await axios.get(`${this.baseUrl}/active`, { params })

    return response.data
  }
}
