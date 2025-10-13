/**
 * Employee Mapper
 *
 * Transforms data between DTOs and Domain Entities
 * Keeps domain layer independent from infrastructure layer
 */

import type {
  CreateEmployeeRequest,
  EmployeeCertificationEntity,
  EmployeeEntity,
  EmployeeSkillEntity,
  EmploymentHistoryEntity,
  UpdateEmployeeRequest,
} from '../../domain/entities/EmployeeEntity'
import type {
  EmployeeCertificationDto,
  EmployeeCreateDto,
  EmployeeDetailDto,
  EmployeeListDto,
  EmployeeSkillDto,
  EmployeeUpdateDto,
  EmploymentHistoryDto,
} from '../dtos/EmployeeDtos'
import type { EmployeePosition, EmployeeStatus, EmploymentType, Gender } from '../../shared/types'

export class EmployeeMapper {
  /**
   * Map API response to Domain Entity (List)
   */
  static apiListToDomain(dto: EmployeeListDto): EmployeeEntity {
    return {
      id: dto.id,
      employee_code: dto.employee_code,
      first_name: dto.first_name,
      last_name: dto.last_name,
      full_name: dto.full_name,
      email: dto.email,
      primary_phone: dto.primary_phone,
      position: dto.position as EmployeePosition,
      department: dto.department,
      employment_type: dto.employment_type as EmploymentType,
      status: dto.status as EmployeeStatus,
      hire_date: dto.hire_date,
      termination_date: dto.termination_date,
      is_active: dto.is_active,
      created_at: dto.created_at,
      updated_at: dto.updated_at,
    }
  }

  /**
   * Map API response to Domain Entity (Detail)
   */
  static apiDetailToDomain(dto: EmployeeDetailDto): EmployeeEntity {
    const base = EmployeeMapper.apiListToDomain(dto)

    return {
      ...base,
      date_of_birth: dto.date_of_birth,
      gender: dto.gender as Gender,
      tax_id: dto.tax_id,
      photo_url: dto.photo_url,
      secondary_phone: dto.secondary_phone,
      address_line_1: dto.address_line_1,
      address_line_2: dto.address_line_2,
      city: dto.city,
      state: dto.state,
      postal_code: dto.postal_code,
      country: dto.country,
      emergency_contact_name: dto.emergency_contact_name,
      emergency_contact_phone: dto.emergency_contact_phone,
      salary_amount: dto.salary_amount,
      salary_currency: dto.salary_currency,
      age: dto.age,
      skills: dto.skills?.map(s => EmployeeMapper.apiSkillToDomain(s)),
      certifications: dto.certifications?.map(c => EmployeeMapper.apiCertificationToDomain(c)),
      employment_history: dto.employment_history?.map(h => EmployeeMapper.apiHistoryToDomain(h)),
    }
  }

  /**
   * Map API skill to Domain entity
   */
  static apiSkillToDomain(dto: EmployeeSkillDto): EmployeeSkillEntity {
    return {
      id: dto.id,
      employee_id: dto.employee_id,
      skill_name: dto.skill_name,
      proficiency_level: dto.proficiency_level,
      years_of_experience: dto.years_of_experience,
      acquired_date: dto.acquired_date,
      notes: dto.notes,
      created_at: dto.created_at,
      updated_at: dto.updated_at,
    }
  }

  /**
   * Map API certification to Domain entity
   */
  static apiCertificationToDomain(dto: EmployeeCertificationDto): EmployeeCertificationEntity {
    return {
      id: dto.id,
      employee_id: dto.employee_id,
      certification_name: dto.certification_name,
      certification_number: dto.certification_number,
      issuing_organization: dto.issuing_organization,
      issue_date: dto.issue_date,
      expiration_date: dto.expiration_date,
      status: dto.status,
      document_url: dto.document_url,
      created_at: dto.created_at,
      updated_at: dto.updated_at,
    }
  }

  /**
   * Map API history to Domain entity
   */
  static apiHistoryToDomain(dto: EmploymentHistoryDto): EmploymentHistoryEntity {
    return {
      id: dto.id,
      employee_id: dto.employee_id,
      change_type: dto.change_type,
      change_description: dto.change_description,
      previous_position: dto.previous_position as EmployeePosition,
      new_position: dto.new_position as EmployeePosition,
      previous_status: dto.previous_status as EmployeeStatus,
      new_status: dto.new_status as EmployeeStatus,
      change_date: dto.change_date,
      reason: dto.reason,
      notes: dto.notes,
      changed_by: dto.changed_by,
      changed_by_user: dto.changed_by_user,
      created_at: dto.created_at,
      updated_at: dto.updated_at,
    }
  }

  /**
   * Map Create Request to DTO for API
   */
  static createRequestToDto(request: CreateEmployeeRequest): EmployeeCreateDto {
    return {
      employee_code: request.employee_code,
      first_name: request.first_name,
      last_name: request.last_name,
      date_of_birth: request.date_of_birth,
      gender: request.gender,
      tax_id: request.tax_id,
      photo_url: request.photo_url,
      primary_phone: request.primary_phone,
      secondary_phone: request.secondary_phone,
      email: request.email,
      address_line_1: request.address_line_1,
      address_line_2: request.address_line_2,
      city: request.city,
      state: request.state,
      postal_code: request.postal_code,
      country: request.country,
      emergency_contact_name: request.emergency_contact_name,
      emergency_contact_phone: request.emergency_contact_phone,
      hire_date: request.hire_date,
      position: request.position,
      department: request.department,
      employment_type: request.employment_type,
      salary_amount: request.salary_amount,
      salary_currency: request.salary_currency,
      status: request.status,
    }
  }

  /**
   * Map Update Request to DTO for API
   */
  static updateRequestToDto(request: Partial<UpdateEmployeeRequest>): EmployeeUpdateDto {
    const dto: EmployeeUpdateDto = {}

    if (request.employee_code !== undefined)
      dto.employee_code = request.employee_code
    if (request.first_name !== undefined)
      dto.first_name = request.first_name
    if (request.last_name !== undefined)
      dto.last_name = request.last_name
    if (request.date_of_birth !== undefined)
      dto.date_of_birth = request.date_of_birth
    if (request.gender !== undefined)
      dto.gender = request.gender
    if (request.tax_id !== undefined)
      dto.tax_id = request.tax_id
    if (request.photo_url !== undefined)
      dto.photo_url = request.photo_url
    if (request.primary_phone !== undefined)
      dto.primary_phone = request.primary_phone
    if (request.secondary_phone !== undefined)
      dto.secondary_phone = request.secondary_phone
    if (request.email !== undefined)
      dto.email = request.email
    if (request.address_line_1 !== undefined)
      dto.address_line_1 = request.address_line_1
    if (request.address_line_2 !== undefined)
      dto.address_line_2 = request.address_line_2
    if (request.city !== undefined)
      dto.city = request.city
    if (request.state !== undefined)
      dto.state = request.state
    if (request.postal_code !== undefined)
      dto.postal_code = request.postal_code
    if (request.country !== undefined)
      dto.country = request.country
    if (request.emergency_contact_name !== undefined)
      dto.emergency_contact_name = request.emergency_contact_name
    if (request.emergency_contact_phone !== undefined)
      dto.emergency_contact_phone = request.emergency_contact_phone
    if (request.hire_date !== undefined)
      dto.hire_date = request.hire_date
    if (request.position !== undefined)
      dto.position = request.position
    if (request.department !== undefined)
      dto.department = request.department
    if (request.employment_type !== undefined)
      dto.employment_type = request.employment_type
    if (request.salary_amount !== undefined)
      dto.salary_amount = request.salary_amount
    if (request.salary_currency !== undefined)
      dto.salary_currency = request.salary_currency
    if (request.status !== undefined)
      dto.status = request.status

    return dto
  }

  /**
   * Map any API response to Domain (auto-detect)
   */
  static mapApiResponse(dto: EmployeeListDto | EmployeeDetailDto): EmployeeEntity {
    // If it has skills/certifications/history, it's a detail DTO
    if ('skills' in dto || 'certifications' in dto || 'employment_history' in dto)
      return EmployeeMapper.apiDetailToDomain(dto as EmployeeDetailDto)

    return EmployeeMapper.apiListToDomain(dto)
  }
}
