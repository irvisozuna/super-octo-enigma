/**
 * Drilling Report API Service
 *
 * Service for handling all API calls related to drilling reports
 */

import type { Activity, Consumption, CreateReportDto, DrillingReport, Signature, ToolAssignment, UpdateReportDto } from '../../domain/entities/DrillingReportEntity'
import { rawApi } from '@/services/api'

export class DrillingReportApiService {
  private static readonly baseUrl = '/drilling/reports'

  /**
   * Get all drilling reports with filters and pagination
   */
  static async getReports(params: {
    page?: number
    per_page?: number
    sort_by?: string
    sort_order?: 'asc' | 'desc'
    project_id?: string
    well_id?: string
    status?: string
    date_from?: string
    date_to?: string
    shift?: string
    search?: string
  } = {}) {
    const queryParams = new URLSearchParams()

    if (params.page)
      queryParams.append('page', params.page.toString())
    if (params.per_page)
      queryParams.append('per_page', params.per_page.toString())
    if (params.sort_by)
      queryParams.append('sort_by', params.sort_by)
    if (params.sort_order)
      queryParams.append('sort_order', params.sort_order)
    if (params.project_id)
      queryParams.append('project_id', params.project_id)
    if (params.well_id)
      queryParams.append('well_id', params.well_id)
    if (params.status)
      queryParams.append('status', params.status)
    if (params.date_from)
      queryParams.append('date_from', params.date_from)
    if (params.date_to)
      queryParams.append('date_to', params.date_to)
    if (params.shift)
      queryParams.append('shift', params.shift)
    if (params.search)
      queryParams.append('search', params.search)

    const url = queryParams.toString() ? `${this.baseUrl}?${queryParams.toString()}` : this.baseUrl

    return await rawApi(url, {
      method: 'GET',
    })
  }

  /**
   * Get a single drilling report by ID
   */
  static async getReportById(id: string): Promise<{ data: DrillingReport }> {
    return await rawApi(`${this.baseUrl}/${id}`, {
      method: 'GET',
    })
  }

  /**
   * Create a new drilling report
   */
  static async createReport(data: CreateReportDto): Promise<{ data: DrillingReport }> {
    return await rawApi(this.baseUrl, {
      method: 'POST',
      body: data,
    })
  }

  /**
   * Update an existing drilling report
   */
  static async updateReport(id: string, data: UpdateReportDto): Promise<{ data: DrillingReport }> {
    return await rawApi(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      body: data,
    })
  }

  /**
   * Delete a drilling report (only if status is 'draft')
   */
  static async deleteReport(id: string): Promise<void> {
    await rawApi(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    })
  }

  /**
   * Add an activity to a report
   */
  static async addActivity(reportId: string, activity: Omit<Activity, 'id'>): Promise<{ data: Activity }> {
    return await rawApi(`${this.baseUrl}/${reportId}/add-activity`, {
      method: 'POST',
      body: activity,
    })
  }

  /**
   * Update an activity
   */
  static async updateActivity(reportId: string, activityId: string, activity: Partial<Activity>): Promise<{ data: Activity }> {
    return await rawApi(`${this.baseUrl}/${reportId}/activities/${activityId}`, {
      method: 'PUT',
      body: activity,
    })
  }

  /**
   * Delete an activity
   */
  static async deleteActivity(reportId: string, activityId: string): Promise<void> {
    await rawApi(`${this.baseUrl}/${reportId}/activities/${activityId}`, {
      method: 'DELETE',
    })
  }

  /**
   * Record a consumption
   */
  static async recordConsumption(reportId: string, consumption: Omit<Consumption, 'id'>): Promise<{ data: Consumption }> {
    return await rawApi(`${this.baseUrl}/${reportId}/record-consumption`, {
      method: 'POST',
      body: consumption,
    })
  }

  /**
   * Update a consumption
   */
  static async updateConsumption(reportId: string, consumptionId: string, consumption: Partial<Consumption>): Promise<{ data: Consumption }> {
    return await rawApi(`${this.baseUrl}/${reportId}/consumptions/${consumptionId}`, {
      method: 'PUT',
      body: consumption,
    })
  }

  /**
   * Delete a consumption
   */
  static async deleteConsumption(reportId: string, consumptionId: string): Promise<void> {
    await rawApi(`${this.baseUrl}/${reportId}/consumptions/${consumptionId}`, {
      method: 'DELETE',
    })
  }

  /**
   * Assign a tool to a report
   */
  static async assignTool(reportId: string, toolAssignment: Omit<ToolAssignment, 'id'>): Promise<{ data: ToolAssignment }> {
    return await rawApi(`${this.baseUrl}/${reportId}/assign-tool`, {
      method: 'POST',
      body: toolAssignment,
    })
  }

  /**
   * Update a tool assignment
   */
  static async updateToolAssignment(reportId: string, assignmentId: string, toolAssignment: Partial<ToolAssignment>): Promise<{ data: ToolAssignment }> {
    return await rawApi(`${this.baseUrl}/${reportId}/tool-assignments/${assignmentId}`, {
      method: 'PUT',
      body: toolAssignment,
    })
  }

  /**
   * Delete a tool assignment
   */
  static async deleteToolAssignment(reportId: string, assignmentId: string): Promise<void> {
    await rawApi(`${this.baseUrl}/${reportId}/tool-assignments/${assignmentId}`, {
      method: 'DELETE',
    })
  }

  /**
   * Complete a report
   */
  static async completeReport(reportId: string, data: {
    horometer_end_day?: number
    horometer_end_night?: number
  }): Promise<{ data: DrillingReport }> {
    return await rawApi(`${this.baseUrl}/${reportId}/complete`, {
      method: 'POST',
      body: data,
    })
  }

  /**
   * Approve a report
   */
  static async approveReport(reportId: string, data?: {
    comments?: string
    notify_client?: boolean
    send_email?: boolean
  }): Promise<{ data: DrillingReport }> {
    return await rawApi(`${this.baseUrl}/${reportId}/approve`, {
      method: 'POST',
      body: data || {},
    })
  }

  /**
   * Reject a report
   */
  static async rejectReport(reportId: string, data: {
    reason: string
    comments?: string
    notify_operator?: boolean
    send_email?: boolean
  }): Promise<{ data: DrillingReport }> {
    return await rawApi(`${this.baseUrl}/${reportId}/reject`, {
      method: 'POST',
      body: data,
    })
  }

  /**
   * Sign a report
   */
  static async signReport(reportId: string, signature: Omit<Signature, 'id' | 'signed_at'>): Promise<{ data: Signature }> {
    return await rawApi(`${this.baseUrl}/${reportId}/sign`, {
      method: 'POST',
      body: signature,
    })
  }

  /**
   * Export report to PDF
   */
  static async exportReportToPDF(reportId: string): Promise<Blob> {
    return await rawApi(`${this.baseUrl}/${reportId}/export/pdf`, {
      method: 'GET',
      responseType: 'blob',
    })
  }

  // Related entities methods (simple versions for dropdowns)

  /**
   * Get projects for dropdown
   */
  static async getProjects(params: any = {}): Promise<any> {
    try {
      console.log('🌐 DrillingReportApiService.getProjects llamado con params:', params)

      const response = await rawApi('/drilling/projects', {
        method: 'GET',
        params,
      })

      console.log('🌐 DrillingReportApiService.getProjects respuesta completa:', response)

      // Devolver la respuesta completa, no solo response.data
      return response
    }
    catch (error) {
      console.error('Error fetching projects:', error)
      throw error
    }
  }

  /**
   * Get clients list for projects
   */
  static async getClients(params: any = {}): Promise<any> {
    try {
      console.log('🌐 DrillingReportApiService.getClients llamado con params:', params)

      const response = await rawApi('/clients', {
        method: 'GET',
        params,
      })

      console.log('🌐 DrillingReportApiService.getClients respuesta completa:', response)

      return response
    }
    catch (error) {
      console.error('Error fetching clients:', error)
      throw error
    }
  }

  /**
   * Get employees for dropdown
   */
  static async getEmployees(params: any = {}): Promise<any> {
    try {
      const response = await rawApi('/employees', {
        method: 'GET',
        params,
      })

      return response.data
    }
    catch (error) {
      console.error('Error fetching employees:', error)
      throw error
    }
  }

  /**
   * Get equipment for dropdown
   * Note: Equipment is managed through equipment_usage within wells
   * This endpoint may not exist in the API - using tools as alternative
   */
  static async getEquipment(params: any = {}): Promise<any> {
    try {
      // Since equipment is managed through wells, we'll use tools as alternative
      const response = await rawApi('/drilling/tools', {
        method: 'GET',
        params,
      })

      return response.data
    }
    catch (error) {
      console.error('Error fetching equipment:', error)
      throw error
    }
  }

  /**
   * Get tools for dropdown
   */
  static async getTools(params: any = {}): Promise<any> {
    try {
      const response = await rawApi('/drilling/tools', {
        method: 'GET',
        params,
      })

      return response.data
    }
    catch (error) {
      console.error('Error fetching tools:', error)
      throw error
    }
  }

  /**
   * Get documents by entity
   */
  static async getDocumentsByEntity(entityType: string, entityId: string, params: {
    page?: number
    per_page?: number
    document_type?: string
  } = {}): Promise<any> {
    const queryParams = new URLSearchParams()

    if (params.page)
      queryParams.append('page', params.page.toString())
    if (params.per_page)
      queryParams.append('per_page', params.per_page.toString())
    if (params.document_type)
      queryParams.append('document_type', params.document_type)

    const url = queryParams.toString()
      ? `/documents/entity/${entityType}/${entityId}?${queryParams.toString()}`
      : `/documents/entity/${entityType}/${entityId}`

    return await rawApi(url, {
      method: 'GET',
    })
  }

  /**
   * Upload document
   */
  static async uploadDocument(file: File, metadata: {
    name: string
    description?: string
    document_type: string
    related_entity_type: string
    related_entity_id: string
  }): Promise<any> {
    const formData = new FormData()

    formData.append('file', file)
    formData.append('name', metadata.name)
    if (metadata.description)
      formData.append('description', metadata.description)

    formData.append('document_type', metadata.document_type)
    formData.append('related_entity_type', metadata.related_entity_type)
    formData.append('related_entity_id', metadata.related_entity_id)

    return await rawApi('/documents/upload', {
      method: 'POST',
      body: formData,
    })
  }

  /**
   * Download document
   */
  static async downloadDocument(documentId: string): Promise<Blob> {
    return await rawApi(`/documents/${documentId}/download`, {
      method: 'GET',
      responseType: 'blob',
    })
  }

  // ===== PROJECT METHODS =====

  /**
   * Get a single project by ID
   */
  static async getProject(id: string) {
    return await rawApi(`/drilling/projects/${id}`, {
      method: 'GET',
    })
  }

  /**
   * Create a new project
   */
  static async createProject(projectData: any) {
    console.log('🌐 API: createProject llamado con:', projectData)
    console.log('🌐 API: URL:', '/drilling/projects')
    console.log('🌐 API: Método: POST')

    try {
      const result = await rawApi('/drilling/projects', {
        method: 'POST',
        body: projectData,
      })

      console.log('🌐 API: Respuesta exitosa:', result)

      return result
    }
    catch (error) {
      console.error('🌐 API: Error en createProject:', error)
      throw error
    }
  }

  /**
   * Update an existing project
   */
  static async updateProject(id: string, projectData: any) {
    return await rawApi(`/drilling/projects/${id}`, {
      method: 'PUT',
      body: projectData,
    })
  }

  /**
   * Delete a project
   */
  static async deleteProject(id: string) {
    return await rawApi(`/drilling/projects/${id}`, {
      method: 'DELETE',
    })
  }

  // ==================== PROJECT STATUS MANAGEMENT ====================

  /**
   * Start a project
   */
  static async startProject(id: string, data: { start_date: string; notes?: string }) {
    return await rawApi(`/drilling/projects/${id}/start`, {
      method: 'POST',
      body: data,
    })
  }

  /**
   * Complete a project
   */
  static async completeProject(id: string, data: { completion_date: string; final_cost?: number; completion_notes?: string }) {
    return await rawApi(`/drilling/projects/${id}/complete`, {
      method: 'POST',
      body: data,
    })
  }

  /**
   * Suspend a project
   */
  static async suspendProject(id: string, data: { suspension_date: string; reason: string; expected_resume_date?: string }) {
    return await rawApi(`/drilling/projects/${id}/suspend`, {
      method: 'POST',
      body: data,
    })
  }

  /**
   * Cancel a project
   */
  static async cancelProject(id: string, data: { cancellation_date: string; reason: string }) {
    return await rawApi(`/drilling/projects/${id}/cancel`, {
      method: 'POST',
      body: data,
    })
  }

  /**
   * Resume a suspended project
   */
  static async resumeProject(id: string, data: { resume_date: string; notes?: string }) {
    return await rawApi(`/drilling/projects/${id}/resume`, {
      method: 'POST',
      body: data,
    })
  }

  // ==================== EMPLOYEES ====================

  /**
   * Get all employees
   */
  static async getEmployees(params: any = {}) {
    const queryParams = new URLSearchParams()

    Object.keys(params).forEach(key => {
      if (params[key])
        queryParams.append(key, params[key].toString())
    })

    const url = queryParams.toString() ? `/employees?${queryParams.toString()}` : '/employees'

    return await rawApi(url, {
      method: 'GET',
    })
  }

  // ==================== PERSONNEL MANAGEMENT ====================

  /**
   * Assign personnel to a project
   */
  static async assignPersonnel(projectId: string, data: {
    employee_id: string
    role: string
    assignment_date: string
    hourly_rate?: number
    notes?: string
  }) {
    return await rawApi(`/drilling/projects/${projectId}/personnel`, {
      method: 'POST',
      body: data,
    })
  }

  /**
   * Remove personnel from a project
   */
  static async removePersonnel(projectId: string, employeeId: string) {
    return await rawApi(`/drilling/projects/${projectId}/personnel/${employeeId}`, {
      method: 'DELETE',
    })
  }

  /**
   * Get project personnel
   */
  static async getProjectPersonnel(projectId: string, params: { role?: string; active?: boolean } = {}) {
    const queryParams = new URLSearchParams()
    if (params.role)
      queryParams.append('role', params.role)
    if (params.active !== undefined)
      queryParams.append('active', params.active.toString())

    const url = queryParams.toString()
      ? `/drilling/projects/${projectId}/personnel?${queryParams.toString()}`
      : `/drilling/projects/${projectId}/personnel`

    return await rawApi(url, {
      method: 'GET',
    })
  }

  // ==================== COST MANAGEMENT ====================

  /**
   * Add a cost entry to a project
   */
  static async addProjectCost(projectId: string, data: {
    cost_type: string
    category: string
    description: string
    amount: number
    date: string
    vendor?: string
    reference_number?: string
    notes?: string
  }) {
    return await rawApi(`/drilling/projects/${projectId}/costs`, {
      method: 'POST',
      body: data,
    })
  }

  /**
   * Get project costs
   */
  static async getProjectCosts(projectId: string, params: {
    cost_type?: string
    category?: string
    date_from?: string
    date_to?: string
    per_page?: number
    page?: number
  } = {}) {
    const queryParams = new URLSearchParams()
    if (params.cost_type)
      queryParams.append('cost_type', params.cost_type)
    if (params.category)
      queryParams.append('category', params.category)
    if (params.date_from)
      queryParams.append('date_from', params.date_from)
    if (params.date_to)
      queryParams.append('date_to', params.date_to)
    if (params.per_page)
      queryParams.append('per_page', params.per_page.toString())
    if (params.page)
      queryParams.append('page', params.page.toString())

    const url = queryParams.toString()
      ? `/drilling/projects/${projectId}/costs?${queryParams.toString()}`
      : `/drilling/projects/${projectId}/costs`

    return await rawApi(url, {
      method: 'GET',
    })
  }

  /**
   * Update project budget
   */
  static async updateProjectBudget(projectId: string, data: {
    budget_amount: number
    reason: string
    effective_date: string
  }) {
    return await rawApi(`/drilling/projects/${projectId}/budget`, {
      method: 'PUT',
      body: data,
    })
  }

  // ==================== WELLS MANAGEMENT ====================

  /**
   * Add a well to a project
   */
  static async addWellToProject(projectId: string, data: {
    well_id: string
    assignment_date: string
    planned_start_date?: string
    planned_depth?: number
    notes?: string
  }) {
    return await rawApi(`/drilling/projects/${projectId}/wells`, {
      method: 'POST',
      body: data,
    })
  }

  /**
   * Remove a well from a project
   */
  static async removeWellFromProject(projectId: string, wellId: string) {
    return await rawApi(`/drilling/projects/${projectId}/wells/${wellId}`, {
      method: 'DELETE',
    })
  }

  /**
   * Get project wells
   */
  static async getWellsByProject(projectId: string, params: { status?: string; include_details?: boolean } = {}) {
    const queryParams = new URLSearchParams()
    if (params.status)
      queryParams.append('status', params.status)
    if (params.include_details !== undefined)
      queryParams.append('include_details', params.include_details.toString())

    const url = queryParams.toString()
      ? `/drilling/projects/${projectId}/wells?${queryParams.toString()}`
      : `/drilling/projects/${projectId}/wells`

    return await rawApi(url, {
      method: 'GET',
    })
  }

  // ==================== HISTORY ====================

  /**
   * Get project status history
   */
  static async getProjectStatusHistory(projectId: string, params: {
    date_from?: string
    date_to?: string
    per_page?: number
    page?: number
  } = {}) {
    const queryParams = new URLSearchParams()
    if (params.date_from)
      queryParams.append('date_from', params.date_from)
    if (params.date_to)
      queryParams.append('date_to', params.date_to)
    if (params.per_page)
      queryParams.append('per_page', params.per_page.toString())
    if (params.page)
      queryParams.append('page', params.page.toString())

    const url = queryParams.toString()
      ? `/drilling/projects/${projectId}/status-history?${queryParams.toString()}`
      : `/drilling/projects/${projectId}/status-history`

    return await rawApi(url, {
      method: 'GET',
    })
  }

  // ==================== WELLS CRUD ====================

  /**
   * Get all wells
   */
  static async getWells(params: any = {}) {
    const queryParams = new URLSearchParams()

    Object.keys(params).forEach(key => {
      if (params[key])
        queryParams.append(key, params[key].toString())
    })

    const url = queryParams.toString() ? `/drilling/wells?${queryParams.toString()}` : '/drilling/wells'

    return await rawApi(url, {
      method: 'GET',
    })
  }

  /**
   * Get a single well
   */
  static async getWell(id: string) {
    return await rawApi(`/drilling/wells/${id}`, {
      method: 'GET',
    })
  }

  /**
   * Create a new well
   */
  static async createWell(wellData: any) {
    return await rawApi('/drilling/wells', {
      method: 'POST',
      body: wellData,
    })
  }

  /**
   * Update a well
   */
  static async updateWell(id: string, wellData: any) {
    return await rawApi(`/drilling/wells/${id}`, {
      method: 'PUT',
      body: wellData,
    })
  }

  /**
   * Delete a well
   */
  static async deleteWell(id: string) {
    return await rawApi(`/drilling/wells/${id}`, {
      method: 'DELETE',
    })
  }

  /**
   * Get drilling tools
   */
  static async getTools(params: any = {}) {
    const queryParams = new URLSearchParams()

    Object.keys(params).forEach(key => {
      if (params[key])
        queryParams.append(key, params[key].toString())
    })

    const url = queryParams.toString() ? `/drilling/tools?${queryParams.toString()}` : '/drilling/tools'

    return await rawApi(url, {
      method: 'GET',
    })
  }

  // ==================== DRILLING REPORT WORKFLOW ====================

  /**
   * Complete a drilling report
   */
  static async completeReport(reportId: string, data: { horometer_end_day?: number; horometer_end_night?: number }) {
    return await rawApi(`/drilling/reports/${reportId}/complete`, {
      method: 'POST',
      body: data,
    })
  }

  /**
   * Approve a drilling report
   */
  static async approveReport(reportId: string, data?: { approved_by?: string }) {
    return await rawApi(`/drilling/reports/${reportId}/approve`, {
      method: 'POST',
      body: data || {},
    })
  }

  // ==================== DRILLING REPORT ACTIVITIES ====================

  /**
   * Add activity to a drilling report
   */
  static async addActivity(reportId: string, data: {
    activity_type: string
    shift: string
    hours: number
    start_time?: string
    end_time?: string
    description?: string
  }) {
    return await rawApi(`/drilling/reports/${reportId}/activities`, {
      method: 'POST',
      body: data,
    })
  }

  // ==================== DRILLING REPORT CONSUMPTIONS ====================

  /**
   * Add consumption to a drilling report
   */
  static async addConsumption(reportId: string, data: {
    consumable_type: string
    shift: string
    quantity: number
    unit: string
  }) {
    return await rawApi(`/drilling/reports/${reportId}/consumptions`, {
      method: 'POST',
      body: data,
    })
  }

  // ==================== DRILLING REPORT TOOL ASSIGNMENTS ====================

  /**
   * Add tool assignment to a drilling report
   */
  static async addToolAssignment(reportId: string, data: {
    tool_id: string
    shift: string
    tool_category: string
    start_depth_meters: number
    end_depth_meters: number
    wear_pattern?: string
    matrix?: string
  }) {
    return await rawApi(`/drilling/reports/${reportId}/tool-assignments`, {
      method: 'POST',
      body: data,
    })
  }
}
