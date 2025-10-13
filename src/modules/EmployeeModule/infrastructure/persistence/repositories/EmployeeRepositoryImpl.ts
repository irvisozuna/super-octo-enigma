/**
 * Employee Repository Implementation - Infrastructure Layer
 *
 * Implements the domain repository interface using API services
 * This is the only place where we know about HTTP, API endpoints, etc.
 */

import type { EmployeeRepository } from '../../../domain/repositories/EmployeeRepository'
import type {
  CreateEmployeeRequest,
  EmployeeCertificationEntity,
  EmployeeEntity,
  EmployeeSearchCriteria,
  EmployeeSkillEntity,
  EmploymentHistoryEntity,
  UpdateEmployeeRequest,
} from '../../../domain/entities/EmployeeEntity'
import type {
  ApiResponse,
  EmployeeFilter,
  EmployeeStatistics,
  PaginatedResponse,
} from '../../../shared/types'
import { EmployeeMapper } from '../../../application/mappers/EmployeeMapper'
import { EmployeeApiService } from '../../api/services/EmployeeApiService'

export class EmployeeRepositoryImpl implements EmployeeRepository {
  private apiService: EmployeeApiService

  constructor() {
    this.apiService = new EmployeeApiService()
  }

  async findAll(filter?: EmployeeFilter): Promise<PaginatedResponse<EmployeeEntity>> {
    const response = await this.apiService.getList(filter)

    return {
      data: response.data.map(dto => EmployeeMapper.apiListToDomain(dto)),
      links: response.links,
      meta: response.meta,
    }
  }

  async findById(id: string): Promise<ApiResponse<EmployeeEntity>> {
    const response = await this.apiService.getById(id)

    return {
      data: EmployeeMapper.apiDetailToDomain(response.data),
    }
  }

  async findByEmployeeCode(employeeCode: string): Promise<ApiResponse<EmployeeEntity | null>> {
    const response = await this.apiService.findByEmployeeCode(employeeCode)

    return {
      data: response.data ? EmployeeMapper.apiDetailToDomain(response.data) : null,
    }
  }

  async create(data: CreateEmployeeRequest): Promise<ApiResponse<EmployeeEntity>> {
    const dto = EmployeeMapper.createRequestToDto(data)
    const response = await this.apiService.create(dto)

    return {
      data: EmployeeMapper.apiDetailToDomain(response.data),
    }
  }

  async update(id: string, data: Partial<UpdateEmployeeRequest>): Promise<ApiResponse<EmployeeEntity>> {
    const dto = EmployeeMapper.updateRequestToDto(data)
    const response = await this.apiService.update(id, dto)

    return {
      data: EmployeeMapper.apiDetailToDomain(response.data),
    }
  }

  async delete(id: string): Promise<void> {
    await this.apiService.delete(id)
  }

  async search(criteria: EmployeeSearchCriteria): Promise<PaginatedResponse<EmployeeEntity>> {
    const response = await this.apiService.getList(criteria)

    return {
      data: response.data.map(dto => EmployeeMapper.apiListToDomain(dto)),
      links: response.links,
      meta: response.meta,
    }
  }

  async getStatistics(): Promise<ApiResponse<EmployeeStatistics>> {
    const response = await this.apiService.getStatistics()

    return {
      data: {
        total: response.data.total,
        by_status: response.data.by_status as any,
        by_position: response.data.by_position as any,
        by_employment_type: response.data.by_employment_type as any,
        recent_hires_count: response.data.recent_hires_count,
        active_count: response.data.active_count,
        inactive_count: response.data.inactive_count,
      },
    }
  }

  async isEmployeeCodeAvailable(employeeCode: string, excludeId?: string): Promise<boolean> {
    return await this.apiService.isEmployeeCodeAvailable(employeeCode, excludeId)
  }

  async findByPosition(position: string): Promise<ApiResponse<EmployeeEntity[]>> {
    const response = await this.apiService.getByPosition(position)

    return {
      data: response.data.map(dto => EmployeeMapper.apiListToDomain(dto)),
    }
  }

  async findByStatus(status: string): Promise<PaginatedResponse<EmployeeEntity>> {
    const response = await this.apiService.getList({ status })

    return {
      data: response.data.map(dto => EmployeeMapper.apiListToDomain(dto)),
      links: response.links,
      meta: response.meta,
    }
  }

  async getOperators(): Promise<ApiResponse<EmployeeEntity[]>> {
    const response = await this.apiService.getOperators()

    return {
      data: response.data.map(dto => EmployeeMapper.apiListToDomain(dto)),
    }
  }

  async getHelpers(): Promise<ApiResponse<EmployeeEntity[]>> {
    const response = await this.apiService.getHelpers()

    return {
      data: response.data.map(dto => EmployeeMapper.apiListToDomain(dto)),
    }
  }

  async export(filter?: EmployeeFilter, format?: 'csv' | 'excel' | 'pdf'): Promise<Blob> {
    return await this.apiService.export(filter as any, format)
  }

  // Status Management

  async suspend(id: string): Promise<ApiResponse<EmployeeEntity>> {
    const response = await this.apiService.suspend(id)

    return {
      data: EmployeeMapper.apiDetailToDomain(response.data),
    }
  }

  async reactivate(id: string): Promise<ApiResponse<EmployeeEntity>> {
    const response = await this.apiService.reactivate(id)

    return {
      data: EmployeeMapper.apiDetailToDomain(response.data),
    }
  }

  async terminate(id: string): Promise<ApiResponse<EmployeeEntity>> {
    const response = await this.apiService.terminate(id)

    return {
      data: EmployeeMapper.apiDetailToDomain(response.data),
    }
  }

  // Skills Management

  async addSkill(employeeId: string, skill: Omit<EmployeeSkillEntity, 'id' | 'employee_id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<EmployeeSkillEntity>> {
    const response = await this.apiService.addSkill(employeeId, skill as any)

    return {
      data: EmployeeMapper.apiSkillToDomain(response.data),
    }
  }

  async updateSkill(employeeId: string, skillId: string, skill: Partial<EmployeeSkillEntity>): Promise<ApiResponse<EmployeeSkillEntity>> {
    const response = await this.apiService.updateSkill(employeeId, skillId, skill as any)

    return {
      data: EmployeeMapper.apiSkillToDomain(response.data),
    }
  }

  async deleteSkill(employeeId: string, skillId: string): Promise<void> {
    await this.apiService.deleteSkill(employeeId, skillId)
  }

  // Certifications Management

  async addCertification(employeeId: string, certification: Omit<EmployeeCertificationEntity, 'id' | 'employee_id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<EmployeeCertificationEntity>> {
    const response = await this.apiService.addCertification(employeeId, certification as any)

    return {
      data: EmployeeMapper.apiCertificationToDomain(response.data),
    }
  }

  async deleteCertification(employeeId: string, certificationId: string): Promise<void> {
    await this.apiService.deleteCertification(employeeId, certificationId)
  }

  // Employment History

  async getHistory(employeeId: string): Promise<ApiResponse<EmploymentHistoryEntity[]>> {
    const response = await this.apiService.getHistory(employeeId)

    return {
      data: response.data.map(dto => EmployeeMapper.apiHistoryToDomain(dto)),
    }
  }
}
