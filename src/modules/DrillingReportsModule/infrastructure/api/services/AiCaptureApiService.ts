/**
 * Captura con IA de hojas de perforación.
 * El backend guarda cada foto, la IA la lee en una cola y crea un reporte en borrador por foto.
 */

import { rawApi } from '@/services/api'

export type AiImportStatus = 'pending' | 'processing' | 'completed' | 'failed'

/** Paso del asistente de reporte al que pertenece la advertencia. */
export type AiImportStep = 'basic' | 'personnel' | 'activities' | 'directional' | 'consumptions' | 'tools' | 'review'

export interface AiImportWarning {
  source: 'validation' | 'ai_doubt' | 'mapping'
  field: string
  step: AiImportStep
  message: string
  severity: 'warning' | 'info'
}

export interface AiImportSteel {
  diametro: string | null
  no_serie: string | null
  serie_color: string | null
  desde: number | null
  hasta: number | null
  nota: string | null
}

/** Lo que la hoja dice y no se asignó solo al reporte: se muestra en la revisión para capturarlo a mano. */
export interface AiImportUnmapped {
  folio: string | null
  turno_escrito: string | null
  faena: Record<'centro_costo' | 'lugar' | 'equipo' | 'operador' | 'ayudante_1' | 'ayudante_2' | 'otro', string | null>
  pozo: { numero: string | null; prof_inicial: number | null; prof_final: number | null; mts_perforados: number | null }
  horometro: { inicial: number | null; final: number | null; total_horas: number | null }
  perforacion: Array<{ desde: number | null; hasta: number | null; mts_perforados: number | null; recuperacion: number | null }>
  perforacion_notas: string[]
  aceros: { broca: AiImportSteel[]; tricono: AiImportSteel[]; escareador: AiImportSteel[] }
  accesorios: Array<{ accesorio: string | null; cantidad: number | null; observaciones: string | null }>
  firmas: { operador: string | null; supervision_firmado: boolean; cliente_firmado: boolean }
}

export interface AiImport {
  id: string
  project_id: string
  well_id: string
  report_id: string | null
  status: AiImportStatus
  original_name: string
  error: string | null
  model: string | null
  warnings: AiImportWarning[]
  unmapped: AiImportUnmapped | null
  cost_usd: number
  created_at: string
  processed_at: string | null
}

export class AiCaptureApiService {
  private static readonly baseUrl = '/drilling/reports/ai-imports'

  static async upload(projectId: string, wellId: string, photos: File[]): Promise<AiImport[]> {
    const formData = new FormData()

    formData.append('project_id', projectId)
    formData.append('well_id', wellId)
    photos.forEach(photo => formData.append('photos[]', photo))

    const response = await rawApi(this.baseUrl, { method: 'POST', body: formData })

    return response?.data ?? []
  }

  static async list(filters: { ids?: string[]; reportId?: string; projectId?: string }): Promise<AiImport[]> {
    const response = await rawApi(this.baseUrl, {
      method: 'GET',
      params: {
        ids: filters.ids?.join(','),
        report_id: filters.reportId,
        project_id: filters.projectId,
      },
    })

    return response?.data ?? []
  }

  static async image(importId: string): Promise<Blob> {
    return await rawApi(`${this.baseUrl}/${importId}/image`, { method: 'GET', responseType: 'blob' })
  }
}
