/**
 * Drilling Report Repository Implementation
 *
 * Implements the repository interface using the API service
 */

import type { DrillingReportRepository } from '../../../domain/repositories/DrillingReportRepository'
import type { DrillingReportEntity } from '../../../domain/entities/DrillingReportEntity'
import type { DrillingReportApiService } from '../../api/services/DrillingReportApiService'

export class DrillingReportRepositoryImpl implements DrillingReportRepository {
  private apiService: DrillingReportApiService

  constructor(apiService: DrillingReportApiService) {
    this.apiService = apiService
  }

  /**
   * Get paginated list of drilling reports
   */
  async getList(filters: any): Promise<any> {
    return await this.apiService.getList(filters)
  }

  /**
   * Get a drilling report by ID
   */
  async getById(id: string): Promise<DrillingReportEntity> {
    return await this.apiService.getById(id)
  }

  /**
   * Create a new drilling report
   */
  async create(data: any): Promise<DrillingReportEntity> {
    return await this.apiService.create(data)
  }

  /**
   * Update an existing drilling report
   */
  async update(id: string, data: any): Promise<DrillingReportEntity> {
    return await this.apiService.update(id, data)
  }

  /**
   * Delete a drilling report
   */
  async delete(id: string): Promise<void> {
    return await this.apiService.delete(id)
  }

  /**
   * Add activity to a report
   */
  async addActivity(reportId: string, data: any): Promise<void> {
    return await this.apiService.addActivity(reportId, data)
  }

  /**
   * Record consumption in a report
   */
  async recordConsumption(reportId: string, data: any): Promise<void> {
    return await this.apiService.recordConsumption(reportId, data)
  }

  /**
   * Assign tool to a report
   */
  async assignTool(reportId: string, data: any): Promise<void> {
    return await this.apiService.assignTool(reportId, data)
  }

  /**
   * Complete a report
   */
  async complete(reportId: string, data: any): Promise<DrillingReportEntity> {
    return await this.apiService.complete(reportId, data)
  }

  /**
   * Approve a report
   */
  async approve(reportId: string): Promise<DrillingReportEntity> {
    return await this.apiService.approve(reportId)
  }

  /**
   * Reject a report
   */
  async reject(reportId: string, data: any): Promise<DrillingReportEntity> {
    return await this.apiService.reject(reportId, data)
  }

  /**
   * Sign a report
   */
  async sign(reportId: string, data: any): Promise<void> {
    return await this.apiService.sign(reportId, data)
  }

  /**
   * Get report statistics
   */
  async getStatistics(filters?: any): Promise<any> {
    return await this.apiService.getStatistics(filters)
  }

  /**
   * Export reports to different formats
   */
  async export(filters: any, format: 'pdf' | 'excel' | 'csv'): Promise<Blob> {
    return await this.apiService.export(filters, format)
  }
}
