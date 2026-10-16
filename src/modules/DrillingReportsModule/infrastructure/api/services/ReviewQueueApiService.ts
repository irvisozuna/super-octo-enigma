/**
 * Bandeja de revisión de un proyecto: reportes por revisar con semáforo y "Aprobar los verdes".
 */

import { rawApi } from '@/services/api'

export type ReviewLight = 'red' | 'yellow' | 'green'

export interface ReviewIssue {
  code: string
  severity: 'error' | 'warning'
  message: string
  step?: string | null
  previous_report_id?: string | null
  previous_report_number?: string | null
}

export interface ReviewQueueEntry {
  id: string
  report_number: string
  report_date: string
  shift: 'day' | 'night' | 'mixed'
  status: 'draft' | 'pending_approval'
  well_id: string
  well_number: string | null
  meters: number | null
  hours: number
  ai_import_id: string | null
  light: ReviewLight
  issues: ReviewIssue[]
}

export interface ReviewQueue {
  reports: ReviewQueueEntry[]
  summary: Record<ReviewLight, number>
  can_approve: boolean
}

export interface BulkApproveResult {
  report_id: string
  report_number: string | null
  result: 'approved' | 'skipped' | 'failed'
  message: string | null
}

export class ReviewQueueApiService {
  static async get(projectId: string): Promise<ReviewQueue> {
    const response = await rawApi('/drilling/reports/review-queue', { method: 'GET', params: { project_id: projectId } })

    return response.data
  }

  static async bulkApprove(projectId: string, reportIds: string[]): Promise<BulkApproveResult[]> {
    const response = await rawApi('/drilling/reports/bulk-approve', { method: 'POST', body: { project_id: projectId, report_ids: reportIds } })

    return response.data
  }
}
