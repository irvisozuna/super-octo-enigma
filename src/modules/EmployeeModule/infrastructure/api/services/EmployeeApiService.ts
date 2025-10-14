/**
 * Employee API Service
 *
 * Handles HTTP requests to the Employee API endpoints
 * Maps between application DTOs and HTTP requests/responses
 */

import type {
  EmployeeCertificationCreateDto,
  EmployeeCertificationDto,
  EmployeeCreateDto,
  EmployeeDetailDto,
  EmployeeFilterDto,
  EmployeeListDto,
  EmployeeSkillCreateDto,
  EmployeeSkillDto,
  EmployeeSkillUpdateDto,
  EmployeeStatisticsDto,
  EmployeeUpdateDto,
  EmploymentHistoryDto,
  PaginatedResponseDto,
} from '../../../application/dtos/EmployeeDtos'
import { rawApi } from '@/services/api'

export class EmployeeApiService {
  private readonly baseUrl = '/employees'

  /**
   * Get paginated list of employees
   */
  async getList(filters: EmployeeFilterDto = {}): Promise<PaginatedResponseDto<EmployeeListDto>> {
    const params = new URLSearchParams()

    if (filters.first_name)
      params.append('first_name', filters.first_name)
    if (filters.last_name)
      params.append('last_name', filters.last_name)
    if (filters.position)
      params.append('position', filters.position)
    if (filters.status)
      params.append('status', filters.status)
    if (filters.department)
      params.append('department', filters.department)
    if (filters.employment_type)
      params.append('employment_type', filters.employment_type)
    if (filters.search)
      params.append('search', filters.search)
    if (filters.page)
      params.append('page', filters.page.toString())
    if (filters.per_page)
      params.append('per_page', filters.per_page.toString())
    if (filters.sort_by)
      params.append('sort_by', filters.sort_by)
    if (filters.sort_order)
      params.append('sort_order', filters.sort_order)

    const url = params.toString() ? `${this.baseUrl}?${params.toString()}` : this.baseUrl

    return await rawApi(url, {
      method: 'GET',
    })
  }

  /**
   * Get employee by ID
   */
  async getById(id: string): Promise<{ data: EmployeeDetailDto }> {
    return await rawApi(`${this.baseUrl}/${id}`, {
      method: 'GET',
    })
  }

  /**
   * Search by employee code
   */
  async findByEmployeeCode(employeeCode: string): Promise<{ data: EmployeeDetailDto | null }> {
    return await rawApi(`${this.baseUrl}/search?employee_code=${employeeCode}`, {
      method: 'GET',
    })
  }

  /**
   * Create new employee
   */
  async create(data: EmployeeCreateDto): Promise<{ data: EmployeeDetailDto }> {
    return await rawApi(this.baseUrl, {
      method: 'POST',
      body: data,
    })
  }

  /**
   * Update employee
   */
  async update(id: string, data: EmployeeUpdateDto): Promise<{ data: EmployeeDetailDto }> {
    return await rawApi(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      body: data,
    })
  }

  /**
   * Delete employee
   */
  async delete(id: string): Promise<void> {
    await rawApi(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    })
  }

  /**
   * Get employees by position
   */
  async getByPosition(position: string): Promise<{ data: EmployeeListDto[] }> {
    return await rawApi(`${this.baseUrl}/by-position/${position}`, {
      method: 'GET',
    })
  }

  /**
   * Get operators
   */
  async getOperators(): Promise<{ data: EmployeeListDto[] }> {
    return await rawApi(`${this.baseUrl}/roles/operators`, {
      method: 'GET',
    })
  }

  /**
   * Get helpers
   */
  async getHelpers(): Promise<{ data: EmployeeListDto[] }> {
    return await rawApi(`${this.baseUrl}/roles/helpers`, {
      method: 'GET',
    })
  }

  /**
   * Get statistics
   */
  async getStatistics(): Promise<{ data: EmployeeStatisticsDto }> {
    return await rawApi(`${this.baseUrl}/statistics`, {
      method: 'GET',
    })
  }

  /**
   * Check if employee code is available
   */
  async isEmployeeCodeAvailable(employeeCode: string, excludeId?: string): Promise<boolean> {
    try {
      const params = new URLSearchParams({ employee_code: employeeCode })
      if (excludeId)
        params.append('exclude_id', excludeId)

      const response = await rawApi(`${this.baseUrl}/check-code?${params.toString()}`, {
        method: 'GET',
      })

      return response.available ?? false
    }
    catch {
      return false
    }
  }

  /**
   * Export employees
   */
  async export(filters: EmployeeFilterDto = {}, format: 'csv' | 'excel' | 'pdf' = 'excel'): Promise<Blob> {
    const params = new URLSearchParams()

    if (filters.first_name)
      params.append('first_name', filters.first_name)
    if (filters.last_name)
      params.append('last_name', filters.last_name)
    if (filters.position)
      params.append('position', filters.position)
    if (filters.status)
      params.append('status', filters.status)
    if (filters.department)
      params.append('department', filters.department)

    params.append('format', format)

    return await rawApi(`${this.baseUrl}/export?${params.toString()}`, {
      method: 'GET',
      responseType: 'blob',
    })
  }

  // Status Management

  /**
   * Suspend employee
   */
  async suspend(id: string, reason?: string, notes?: string, effective_date?: string): Promise<{ data: EmployeeDetailDto }> {
    const body: Record<string, any> = {}

    if (reason)
      body.reason = reason

    if (notes)
      body.notes = notes

    if (effective_date)
      body.effective_date = effective_date

    console.log('🔍 Suspend API Call - Body:', body, { reason, notes, effective_date })

    return await rawApi(`${this.baseUrl}/${id}/suspend`, {
      method: 'POST',
      body,
    })
  }

  /**
   * Reactivate employee
   */
  async reactivate(id: string, reason?: string, notes?: string, effective_date?: string): Promise<{ data: EmployeeDetailDto }> {
    const body: Record<string, any> = {}

    if (reason)
      body.reason = reason

    if (notes)
      body.notes = notes

    if (effective_date)
      body.effective_date = effective_date

    return await rawApi(`${this.baseUrl}/${id}/reactivate`, {
      method: 'POST',
      body,
    })
  }

  /**
   * Terminate employee
   */
  async terminate(id: string, reason?: string, notes?: string, effective_date?: string): Promise<{ data: EmployeeDetailDto }> {
    const body: Record<string, any> = {}

    if (reason)
      body.reason = reason

    if (notes)
      body.notes = notes

    if (effective_date)
      body.effective_date = effective_date

    return await rawApi(`${this.baseUrl}/${id}/terminate`, {
      method: 'POST',
      body,
    })
  }

  // Skills Management

  /**
   * Get employee skills
   */
  async getSkills(employeeId: string): Promise<{ data: EmployeeSkillDto[] }> {
    return await rawApi(`${this.baseUrl}/${employeeId}/skills`, {
      method: 'GET',
    })
  }

  /**
   * Add skill to employee
   */
  async addSkill(employeeId: string, data: EmployeeSkillCreateDto): Promise<{ data: EmployeeSkillDto }> {
    return await rawApi(`${this.baseUrl}/${employeeId}/skills`, {
      method: 'POST',
      body: data,
    })
  }

  /**
   * Update employee skill
   */
  async updateSkill(employeeId: string, skillId: string, data: EmployeeSkillUpdateDto): Promise<{ data: EmployeeSkillDto }> {
    return await rawApi(`${this.baseUrl}/${employeeId}/skills/${skillId}`, {
      method: 'PUT',
      body: data,
    })
  }

  /**
   * Delete employee skill
   */
  async deleteSkill(employeeId: string, skillId: string): Promise<void> {
    await rawApi(`${this.baseUrl}/${employeeId}/skills/${skillId}`, {
      method: 'DELETE',
    })
  }

  // Certifications Management

  /**
   * Get employee certifications
   */
  async getCertifications(employeeId: string): Promise<{ data: EmployeeCertificationDto[] }> {
    return await rawApi(`${this.baseUrl}/${employeeId}/certifications`, {
      method: 'GET',
    })
  }

  /**
   * Add certification to employee
   */
  async addCertification(employeeId: string, data: EmployeeCertificationCreateDto): Promise<{ data: EmployeeCertificationDto }> {
    return await rawApi(`${this.baseUrl}/${employeeId}/certifications`, {
      method: 'POST',
      body: data,
    })
  }

  /**
   * Delete employee certification
   */
  async deleteCertification(employeeId: string, certificationId: string): Promise<void> {
    await rawApi(`${this.baseUrl}/${employeeId}/certifications/${certificationId}`, {
      method: 'DELETE',
    })
  }

  // Employment History

  /**
   * Get employee employment history
   */
  async getHistory(employeeId: string): Promise<{ data: EmploymentHistoryDto[] }> {
    return await rawApi(`${this.baseUrl}/${employeeId}/history`, {
      method: 'GET',
    })
  }
}
