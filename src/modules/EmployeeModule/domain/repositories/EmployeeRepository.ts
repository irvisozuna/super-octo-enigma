/**
 * Employee Repository Interface
 *
 * Domain contract for employee data access operations
 * This is a pure interface with no implementation dependencies
 */

import type {
  CreateEmployeeRequest,
  EmployeeCertificationEntity,
  EmployeeEntity,
  EmployeeSearchCriteria,
  EmployeeSkillEntity,
  EmploymentHistoryEntity,
  UpdateEmployeeRequest,
} from '../entities/EmployeeEntity'
import type {
  ApiResponse,
  EmployeeFilter,
  EmployeeStatistics,
  PaginatedResponse,
} from '../../shared/types'

export interface EmployeeRepository {
  /**
   * Get paginated list of employees
   */
  findAll(filter?: EmployeeFilter): Promise<PaginatedResponse<EmployeeEntity>>

  /**
   * Find employee by ID
   */
  findById(id: string): Promise<ApiResponse<EmployeeEntity>>

  /**
   * Search employees by employee code
   */
  findByEmployeeCode(employeeCode: string): Promise<ApiResponse<EmployeeEntity | null>>

  /**
   * Create new employee
   */
  create(data: CreateEmployeeRequest): Promise<ApiResponse<EmployeeEntity>>

  /**
   * Update existing employee
   */
  update(id: string, data: Partial<UpdateEmployeeRequest>): Promise<ApiResponse<EmployeeEntity>>

  /**
   * Delete employee (soft delete)
   */
  delete(id: string): Promise<void>

  /**
   * Search employees with criteria
   */
  search(criteria: EmployeeSearchCriteria): Promise<PaginatedResponse<EmployeeEntity>>

  /**
   * Get employee statistics
   */
  getStatistics(): Promise<ApiResponse<EmployeeStatistics>>

  /**
   * Check if employee code is available
   */
  isEmployeeCodeAvailable(employeeCode: string, excludeId?: string): Promise<boolean>

  /**
   * Get employees by position
   */
  findByPosition(position: string): Promise<ApiResponse<EmployeeEntity[]>>

  /**
   * Get employees by status
   */
  findByStatus(status: string): Promise<PaginatedResponse<EmployeeEntity>>

  /**
   * Get operators
   */
  getOperators(): Promise<ApiResponse<EmployeeEntity[]>>

  /**
   * Get helpers
   */
  getHelpers(): Promise<ApiResponse<EmployeeEntity[]>>

  /**
   * Export employees data
   */
  export(filter?: EmployeeFilter, format?: 'csv' | 'excel' | 'pdf'): Promise<Blob>

  // Status Management
  /**
   * Suspend employee
   */
  suspend(id: string): Promise<ApiResponse<EmployeeEntity>>

  /**
   * Reactivate employee
   */
  reactivate(id: string): Promise<ApiResponse<EmployeeEntity>>

  /**
   * Terminate employee
   */
  terminate(id: string): Promise<ApiResponse<EmployeeEntity>>

  // Skills Management
  /**
   * Add skill to employee
   */
  addSkill(employeeId: string, skill: Omit<EmployeeSkillEntity, 'id' | 'employee_id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<EmployeeSkillEntity>>

  /**
   * Update employee skill
   */
  updateSkill(employeeId: string, skillId: string, skill: Partial<EmployeeSkillEntity>): Promise<ApiResponse<EmployeeSkillEntity>>

  /**
   * Delete employee skill
   */
  deleteSkill(employeeId: string, skillId: string): Promise<void>

  // Certifications Management
  /**
   * Add certification to employee
   */
  addCertification(employeeId: string, certification: Omit<EmployeeCertificationEntity, 'id' | 'employee_id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<EmployeeCertificationEntity>>

  /**
   * Delete employee certification
   */
  deleteCertification(employeeId: string, certificationId: string): Promise<void>

  // Employment History
  /**
   * Get employee employment history
   */
  getHistory(employeeId: string): Promise<ApiResponse<EmploymentHistoryEntity[]>>
}
