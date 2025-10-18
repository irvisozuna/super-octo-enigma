/**
 * Tool Management API Service
 *
 * Service for handling all API calls related to tool management
 * Base URL: /tool-management/tools
 */

import { rawApi } from '@/services/api'

export interface Tool {
  id: string
  company_id: string
  type: string
  serial_number: string
  capacity_meters: number
  used_meters: number
  remaining_meters: number
  usage_percentage: number
  remaining_capacity_percentage: number
  wear_level: 'new' | 'light' | 'moderate' | 'severe' | 'critical'
  status: 'available' | 'in_use' | 'maintenance' | 'retired' | 'lost' | 'damaged'
  acquired_at: string
  retired_at?: string
  retirement_reason?: string
  current_project_id?: string
  assigned_at?: string
  is_available_for_use: boolean
  is_assigned_to_project: boolean
  created_at: string
  updated_at: string
}

export interface CreateToolDto {
  type: string
  serial_number: string
  capacity_meters: number
  acquired_at: string
}

export interface UpdateToolDto {
  type?: string
  serial_number?: string
  capacity_meters?: number
}

export interface RecordUsageDto {
  meters_used: number
  wear_level: string
  project_id?: string
  report_id?: string
}

export interface AssignToolDto {
  project_id: string
  notes?: string
}

export interface ReturnToolDto {
  condition: string
  notes?: string
}

export interface SendToMaintenanceDto {
  reason: string
  scheduled_date?: string
  estimated_completion?: string
}

export interface CompleteMaintenanceDto {
  maintenance_notes: string
  cost?: number
  performed_by?: string
}

export interface RetireToolDto {
  reason: string
}

export class ToolApiService {
  private static readonly baseUrl = '/tool-management/tools'

  /**
   * Get all tools with filters and pagination
   */
  static async getTools(params: {
    search?: string
    type?: string
    status?: string
    wear_level?: string
    page?: number
    per_page?: number
    sort_by?: string
    sort_order?: 'asc' | 'desc'
  } = {}) {
    return await rawApi(this.baseUrl, {
      method: 'GET',
      params,
    })
  }

  /**
   * Get a single tool by ID
   */
  static async getToolById(id: string): Promise<{ data: Tool }> {
    return await rawApi(`${this.baseUrl}/${id}`, {
      method: 'GET',
    })
  }

  /**
   * Create a new tool
   */
  static async createTool(data: CreateToolDto): Promise<{ data: Tool }> {
    return await rawApi(this.baseUrl, {
      method: 'POST',
      body: data,
    })
  }

  /**
   * Update an existing tool
   */
  static async updateTool(id: string, data: UpdateToolDto): Promise<{ data: Tool }> {
    return await rawApi(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      body: data,
    })
  }

  /**
   * Delete a tool (soft delete)
   */
  static async deleteTool(id: string): Promise<void> {
    return await rawApi(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    })
  }

  /**
   * Record tool usage
   */
  static async recordUsage(id: string, data: RecordUsageDto): Promise<{ data: Tool }> {
    return await rawApi(`${this.baseUrl}/${id}/record-usage`, {
      method: 'POST',
      body: data,
    })
  }

  /**
   * Assign tool to project
   */
  static async assignToProject(id: string, data: AssignToolDto): Promise<{ data: Tool }> {
    return await rawApi(`${this.baseUrl}/${id}/assign`, {
      method: 'POST',
      body: data,
    })
  }

  /**
   * Return tool from project
   */
  static async returnFromProject(id: string, data: ReturnToolDto): Promise<{ data: Tool }> {
    return await rawApi(`${this.baseUrl}/${id}/return`, {
      method: 'POST',
      body: data,
    })
  }

  /**
   * Send tool to maintenance
   */
  static async sendToMaintenance(id: string, data: SendToMaintenanceDto): Promise<{ data: Tool }> {
    return await rawApi(`${this.baseUrl}/${id}/send-to-maintenance`, {
      method: 'POST',
      body: data,
    })
  }

  /**
   * Complete tool maintenance
   */
  static async completeMaintenance(id: string, data: CompleteMaintenanceDto): Promise<{ data: Tool }> {
    return await rawApi(`${this.baseUrl}/${id}/complete-maintenance`, {
      method: 'POST',
      body: data,
    })
  }

  /**
   * Retire tool manually
   */
  static async retireTool(id: string, data: RetireToolDto): Promise<{ data: Tool }> {
    return await rawApi(`${this.baseUrl}/${id}/retire`, {
      method: 'POST',
      body: data,
    })
  }

  /**
   * Get available tools
   */
  static async getAvailableTools(params: {
    search?: string
    type?: string
    page?: number
    per_page?: number
  } = {}) {
    return await rawApi(`${this.baseUrl}/status/available`, {
      method: 'GET',
      params,
    })
  }

  /**
   * Get tools in use
   */
  static async getToolsInUse(params: {
    search?: string
    type?: string
    page?: number
    per_page?: number
  } = {}) {
    return await rawApi(`${this.baseUrl}/status/in-use`, {
      method: 'GET',
      params,
    })
  }

  /**
   * Get tools nearing retirement
   */
  static async getToolsNearingRetirement(params: {
    search?: string
    type?: string
    page?: number
    per_page?: number
  } = {}) {
    return await rawApi(`${this.baseUrl}/status/nearing-retirement`, {
      method: 'GET',
      params,
    })
  }

  /**
   * Get tools by project
   */
  static async getToolsByProject(projectId: string, params: {
    page?: number
    per_page?: number
  } = {}) {
    return await rawApi(`${this.baseUrl}/project/${projectId}`, {
      method: 'GET',
      params,
    })
  }
}
