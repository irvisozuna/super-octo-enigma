/**
 * Carga de catálogos desde Excel: plantilla, vista previa y alta (personal, aceros, equipos).
 */

import { rawApi } from '@/services/api'

export type CatalogImportKind = 'employees' | 'tools' | 'equipment'
export type CatalogImportRowStatus = 'new' | 'exists' | 'error'

export interface CatalogImportRow {
  row: number
  data: Record<string, string | number | null>
  status: CatalogImportRowStatus
  messages: string[]
}

export interface CatalogImportPreview {
  rows: CatalogImportRow[]
  summary: Record<CatalogImportRowStatus, number>
}

export interface CatalogImportResult {
  created: number
  results: Array<{ row: number; status: 'created' | 'exists' | 'error'; message: string | null }>
}

const BASE = '/drilling/reports/catalog-imports'

export class CatalogImportApiService {
  /** Descarga la plantilla como archivo. */
  static async downloadTemplate(kind: CatalogImportKind, fileName: string) {
    const blob: Blob = await rawApi(`${BASE}/${kind}/template`, { method: 'GET', responseType: 'blob' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)
  }

  static async preview(kind: CatalogImportKind, file: File): Promise<CatalogImportPreview> {
    const body = new FormData()

    body.append('file', file)

    return (await rawApi(`${BASE}/${kind}/preview`, { method: 'POST', body })).data
  }

  static async commit(kind: CatalogImportKind, rows: CatalogImportRow[], projectId: string | null): Promise<CatalogImportResult> {
    const response = await rawApi(`${BASE}/${kind}/commit`, {
      method: 'POST',
      body: { project_id: projectId, rows: rows.map(row => ({ row: row.row, data: row.data })) },
    })

    return response.data
  }
}
