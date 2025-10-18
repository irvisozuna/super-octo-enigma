/**
 * Equipment Management API Service
 *
 * Service for handling all API calls related to equipment management
 * Base URL: /equipment-management/equipment
 */

import { rawApi } from '@/services/api'

export interface Equipment {
  id: string
  company_id: string
  equipment_code: string
  equipment_name: string
  equipment_type: string
  manufacturer?: string
  model?: string
  serial_number?: string
  year_manufactured?: number
  purchase_date?: string
  specifications?: Record<string, any>
  last_service_date?: string
  next_service_date?: string
  service_interval_hours?: number
  operating_hours: number
  current_project_id?: string
  status: 'active' | 'inactive' | 'in_maintenance' | 'retired' | 'out_of_service'
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface CreateEquipmentDto {
  equipment_code: string
  equipment_name: string
  equipment_type: string
  manufacturer?: string
  model?: string
  serial_number?: string
  year_manufactured?: number
  purchase_date?: string
  specifications?: Record<string, any>
  service_interval_hours?: number
  initial_operating_hours?: number
}

export interface UpdateEquipmentDto {
  equipment_name?: string
  manufacturer?: string
  model?: string
  specifications?: Record<string, any>
  service_interval_hours?: number
}

export class EquipmentApiService {
  private static readonly baseUrl = '/equipment-management/equipment'

  /**
   * Get all equipment with filters and pagination
   */
  static async getEquipment(params: {
    search?: string
    equipment_type?: string
    status?: string
    page?: number
    per_page?: number
  } = {}) {
    return await rawApi(this.baseUrl, {
      method: 'GET',
      params,
    })
  }

  /**
   * Get a single equipment by ID
   */
  static async getEquipmentById(id: string): Promise<{ data: Equipment }> {
    return await rawApi(`${this.baseUrl}/${id}`, {
      method: 'GET',
    })
  }

  /**
   * Create a new equipment
   */
  static async createEquipment(data: CreateEquipmentDto): Promise<{ data: Equipment }> {
    return await rawApi(this.baseUrl, {
      method: 'POST',
      body: data,
    })
  }

  /**
   * Update an existing equipment
   */
  static async updateEquipment(id: string, data: UpdateEquipmentDto): Promise<{ data: Equipment }> {
    return await rawApi(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      body: data,
    })
  }

  /**
   * Delete an equipment (soft delete)
   */
  static async deleteEquipment(id: string): Promise<void> {
    return await rawApi(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    })
  }

  /**
   * Assign equipment to project
   */
  static async assignToProject(id: string, projectId: string, notes?: string): Promise<{ data: Equipment }> {
    return await rawApi(`${this.baseUrl}/${id}/assign`, {
      method: 'POST',
      body: { 
        project_id: projectId,
        ...(notes && { notes })
      },
    })
  }

  /**
   * Unassign equipment from project
   */
  static async unassignFromProject(id: string, notes?: string): Promise<{ data: Equipment }> {
    return await rawApi(`${this.baseUrl}/${id}/unassign`, {
      method: 'POST',
      body: notes ? { notes } : {},
    })
  }

  /**
   * Send equipment to maintenance
   */
  static async sendToMaintenance(id: string, data: {
    reason: string
    estimated_completion_date?: string
  }): Promise<{ data: Equipment }> {
    return await rawApi(`${this.baseUrl}/${id}/maintenance/send`, {
      method: 'POST',
      body: data,
    })
  }

  /**
   * Complete equipment maintenance
   */
  static async completeMaintenance(id: string, data: {
    service_date: string
    notes?: string
    next_service_hours?: number
  }): Promise<{ data: Equipment }> {
    return await rawApi(`${this.baseUrl}/${id}/maintenance/complete`, {
      method: 'POST',
      body: data,
    })
  }

  /**
   * Add operating hours to equipment
   */
  static async addOperatingHours(id: string, data: {
    hours: number
    date: string
    notes?: string
  }): Promise<{ data: Equipment }> {
    return await rawApi(`${this.baseUrl}/${id}/operating-hours`, {
      method: 'POST',
      body: data,
    })
  }
}
