/**
 * Drilling Report Application Service
 *
 * Orchestrates business logic and coordinates between domain and infrastructure layers
 */

import type {
  AddActivityDto,
  AssignToolDto,
  CompleteReportDto,
  CreateDrillingReportDto,
  DrillingReportFilters,
  DrillingReportListResponse,
  DrillingReportRepository,
  RecordConsumptionDto,
  RejectReportDto,
  SignReportDto,
  UpdateDrillingReportDto,
} from '../../domain/repositories/DrillingReportRepository'
import type { DrillingReportEntity } from '../../domain/entities/DrillingReportEntity'
import { DrillingReportDomain } from '../../domain/entities/DrillingReportEntity'
import { DrillingReportMapper } from '../mappers/DrillingReportMapper'

export class DrillingReportApplicationService {
  constructor(private repository: DrillingReportRepository) {}

  /**
   * Get paginated list of drilling reports
   */
  async getReports(filters: DrillingReportFilters): Promise<DrillingReportListResponse> {
    try {
      return await this.repository.getList(filters)
    }
    catch (error) {
      console.error('Error fetching drilling reports:', error)
      throw new Error('Error al obtener los reportes de perforación')
    }
  }

  /**
   * Get a drilling report by ID
   */
  async getReportById(id: string): Promise<DrillingReportEntity> {
    try {
      return await this.repository.getById(id)
    }
    catch (error) {
      console.error('Error fetching drilling report:', error)
      throw new Error('Error al obtener el reporte de perforación')
    }
  }

  /**
   * Create a new drilling report
   */
  async createReport(data: CreateDrillingReportDto): Promise<DrillingReportEntity> {
    try {
      // Validate business rules
      this.validateCreateReport(data)

      return await this.repository.create(data)
    }
    catch (error) {
      console.error('Error creating drilling report:', error)
      throw new Error('Error al crear el reporte de perforación')
    }
  }

  /**
   * Update an existing drilling report
   */
  async updateReport(id: string, data: UpdateDrillingReportDto, userId: string): Promise<DrillingReportEntity> {
    try {
      // Get current report to validate
      const currentReport = await this.repository.getById(id)

      // Validate business rules
      const canEdit = DrillingReportDomain.canEdit(currentReport, userId)
      if (!canEdit.canEdit)
        throw new Error(canEdit.reason)

      return await this.repository.update(id, data)
    }
    catch (error) {
      console.error('Error updating drilling report:', error)
      throw new Error('Error al actualizar el reporte de perforación')
    }
  }

  /**
   * Delete a drilling report
   */
  async deleteReport(id: string, userId: string): Promise<void> {
    try {
      // Get current report to validate
      const currentReport = await this.repository.getById(id)

      // Validate business rules
      if (currentReport.status !== 'draft')
        throw new Error('Solo los reportes en borrador pueden eliminarse')

      if (currentReport.created_by_id && currentReport.created_by_id !== userId)
        throw new Error('Solo el creador puede eliminar el reporte')

      await this.repository.delete(id)
    }
    catch (error) {
      console.error('Error deleting drilling report:', error)
      throw new Error('Error al eliminar el reporte de perforación')
    }
  }

  /**
   * Add activity to a report
   */
  async addActivity(reportId: string, data: AddActivityDto): Promise<void> {
    try {
      // Get current report to validate
      const currentReport = await this.repository.getById(reportId)

      // Validate business rules
      if (currentReport.status !== 'draft')
        throw new Error('Solo los reportes en borrador pueden modificarse')

      // Validate shift hours
      const activities = currentReport.activities || []
      const validation = DrillingReportDomain.validateShiftHours(activities, data)
      if (!validation.isValid)
        throw new Error(validation.reason)

      await this.repository.addActivity(reportId, data)
    }
    catch (error) {
      console.error('Error adding activity:', error)
      throw new Error('Error al agregar la actividad')
    }
  }

  /**
   * Record consumption in a report
   */
  async recordConsumption(reportId: string, data: RecordConsumptionDto): Promise<void> {
    try {
      // Get current report to validate
      const currentReport = await this.repository.getById(reportId)

      // Validate business rules
      if (currentReport.status !== 'draft')
        throw new Error('Solo los reportes en borrador pueden modificarse')

      await this.repository.recordConsumption(reportId, data)
    }
    catch (error) {
      console.error('Error recording consumption:', error)
      throw new Error('Error al registrar el consumo')
    }
  }

  /**
   * Assign tool to a report
   */
  async assignTool(reportId: string, data: AssignToolDto): Promise<void> {
    try {
      // Get current report to validate
      const currentReport = await this.repository.getById(reportId)

      // Validate business rules
      if (currentReport.status !== 'draft')
        throw new Error('Solo los reportes en borrador pueden modificarse')

      // Validate tool capacity (this would need to be implemented with tool service)
      // const tool = await this.toolService.getTool(data.tool_id)
      // const metersToDrill = data.end_depth_meters - data.start_depth_meters
      // const capacityValidation = DrillingReportDomain.validateToolCapacity(tool, metersToDrill)
      // if (!capacityValidation.isValid) {
      //   throw new Error(capacityValidation.reason)
      // }

      await this.repository.assignTool(reportId, data)
    }
    catch (error) {
      console.error('Error assigning tool:', error)
      throw new Error('Error al asignar la herramienta')
    }
  }

  /**
   * Complete a report
   */
  async completeReport(reportId: string, data: CompleteReportDto): Promise<DrillingReportEntity> {
    try {
      // Get current report to validate
      const currentReport = await this.repository.getById(reportId)

      // Validate business rules
      const canComplete = DrillingReportDomain.canComplete(currentReport)
      if (!canComplete.canComplete)
        throw new Error(canComplete.reason)

      return await this.repository.complete(reportId, data)
    }
    catch (error) {
      console.error('Error completing report:', error)
      throw new Error('Error al completar el reporte')
    }
  }

  /**
   * Approve a report
   */
  async approveReport(reportId: string, userId: string): Promise<DrillingReportEntity> {
    try {
      // Get current report to validate
      const currentReport = await this.repository.getById(reportId)

      // Validate business rules
      const canApprove = DrillingReportDomain.canApprove(currentReport)
      if (!canApprove.canApprove)
        throw new Error(canApprove.reason)

      return await this.repository.approve(reportId)
    }
    catch (error) {
      console.error('Error approving report:', error)
      throw new Error('Error al aprobar el reporte')
    }
  }

  /**
   * Reject a report
   */
  async rejectReport(reportId: string, data: RejectReportDto): Promise<DrillingReportEntity> {
    try {
      // Get current report to validate
      const currentReport = await this.repository.getById(reportId)

      // Validate business rules
      if (currentReport.status !== 'completed')
        throw new Error('Solo los reportes completados pueden rechazarse')

      if (!data.reason || data.reason.trim().length < 10)
        throw new Error('Debe proporcionar un motivo de rechazo (mínimo 10 caracteres)')

      return await this.repository.reject(reportId, data)
    }
    catch (error) {
      console.error('Error rejecting report:', error)
      throw new Error('Error al rechazar el reporte')
    }
  }

  /**
   * Sign a report
   */
  async signReport(reportId: string, data: SignReportDto): Promise<void> {
    try {
      // Get current report to validate
      const currentReport = await this.repository.getById(reportId)

      // Validate business rules
      if (currentReport.status === 'approved')
        throw new Error('Los reportes aprobados no pueden firmarse')

      // Check for duplicate signatures
      const existingSignature = currentReport.signatures?.find(
        s => s.signature_type === data.signature_type,
      )

      if (existingSignature)
        throw new Error(`Ya existe una firma de tipo ${data.signature_type}`)

      await this.repository.sign(reportId, data)
    }
    catch (error) {
      console.error('Error signing report:', error)
      throw new Error('Error al firmar el reporte')
    }
  }

  /**
   * Get report statistics
   */
  async getStatistics(filters?: Partial<DrillingReportFilters>) {
    try {
      return await this.repository.getStatistics(filters)
    }
    catch (error) {
      console.error('Error fetching statistics:', error)
      throw new Error('Error al obtener las estadísticas')
    }
  }

  /**
   * Export reports
   */
  async exportReports(filters: DrillingReportFilters, format: 'pdf' | 'excel' | 'csv'): Promise<Blob> {
    try {
      return await this.repository.export(filters, format)
    }
    catch (error) {
      console.error('Error exporting reports:', error)
      throw new Error('Error al exportar los reportes')
    }
  }

  /**
   * Validate create report data
   */
  private validateCreateReport(data: CreateDrillingReportDto): void {
    if (!data.project_id)
      throw new Error('El proyecto es requerido')

    if (!data.well_id)
      throw new Error('El pozo es requerido')

    if (!data.report_date)
      throw new Error('La fecha de reporte es requerida')

    if (!data.shift)
      throw new Error('El turno es requerido')

    // Validate date is not in the future
    const reportDate = new Date(data.report_date)
    const today = new Date()

    today.setHours(0, 0, 0, 0)

    if (reportDate > today)
      throw new Error('La fecha no puede ser futura')

    // Validate shift-specific requirements
    if (data.shift === 'day' || data.shift === 'mixed') {
      if (!data.operator_day_id)
        throw new Error('El operador del turno día es requerido')
    }

    if (data.shift === 'night' || data.shift === 'mixed') {
      if (!data.operator_night_id)
        throw new Error('El operador del turno noche es requerido')
    }
  }
}
