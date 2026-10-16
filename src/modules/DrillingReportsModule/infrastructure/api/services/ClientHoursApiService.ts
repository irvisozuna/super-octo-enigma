/**
 * Horas a cargo del cliente (columna CLIENTE de la hoja): prefactura de stand-by por periodo.
 */

import { rawApi } from '@/services/api'

export interface ClientHoursRow {
  report_id: string
  report_number: string
  report_date: string
  shift: 'day' | 'night' | 'mixed'
  status: 'approved' | 'pending_approval' | 'draft'
  well_id: string
  well_number: string | null
  activity_type: string
  activity_label: string
  description: string | null
  start_time: string | null
  end_time: string | null
  hours_client: number
  folio: string | null
  ai_import_id: string | null
}

export interface ClientHoursGroup {
  key: string
  label: string
  hours: number
  count: number
}

export interface ClientHours {
  rows: ClientHoursRow[]
  totals: { hours: number; by_type: ClientHoursGroup[]; by_well: ClientHoursGroup[]; pending_hours: number }
}

export interface ClientHoursFilters {
  projectId: string
  from: string
  to: string
  includePending?: boolean
}

const params = (f: ClientHoursFilters) => ({ project_id: f.projectId, from: f.from, to: f.to, include_pending: f.includePending ? 1 : 0 })

export class ClientHoursApiService {
  static async get(filters: ClientHoursFilters): Promise<ClientHours> {
    return (await rawApi('/drilling/reports/client-hours', { method: 'GET', params: params(filters) })).data
  }

  static async export(filters: ClientHoursFilters, fileName: string) {
    const blob: Blob = await rawApi('/drilling/reports/client-hours/export', { method: 'GET', params: params(filters), responseType: 'blob' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)
  }
}
