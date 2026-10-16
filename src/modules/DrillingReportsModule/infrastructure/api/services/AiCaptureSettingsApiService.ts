/**
 * Configuración de la captura con IA: qué significa cada turno escrito en la hoja y cómo se clasifican
 * las actividades escritas a mano. Se guarda por empresa y, opcionalmente, por proyecto.
 */

import { rawApi } from '@/services/api'

export type ShiftCode = 'day' | 'night'

export interface ShiftSettings {
  /** Hora de inicio del turno de día (HH:MM). El de noche empieza 12 h después. */
  day_start: string
  labels: Record<ShiftCode, string[]>
}

export interface ActivityRule {
  activity_type: string
  keywords: string[]
}

/** Cada sección es opcional: la que falta se hereda (proyecto → empresa → valores de fábrica). */
export interface CaptureSettingsSections {
  shifts?: ShiftSettings
  activity_rules?: ActivityRule[]
}

export interface ResolvedCaptureSettings {
  shifts: ShiftSettings
  activity_rules: ActivityRule[]
}

export interface CaptureSettingsResponse {
  /** Lo guardado exactamente en este nivel (empresa o proyecto); null si hereda todo. */
  stored: CaptureSettingsSections | null
  /** Lo que hereda el proyecto: la configuración de la empresa ya combinada con la de fábrica. */
  inherited: ResolvedCaptureSettings
  resolved: ResolvedCaptureSettings
  defaults: ResolvedCaptureSettings
  activity_types: Record<string, string>
  can_configure: boolean
}

export interface CaptureSettingsPreview {
  shift: { shift: ShiftCode; source: 'hours' | 'label' | 'default'; evidence: string | null }
  activity: { activity_type: string; label: string; keyword: string | null; source: 'rule' | 'ai_or_other' } | null
}

export interface ActivityCorrection {
  description: string
  mapped_type: string
  chosen_type: string
  chosen_label: string
  count: number
}

export class AiCaptureSettingsApiService {
  private static readonly baseUrl = '/drilling/reports/ai-capture'

  static async get(projectId?: string | null): Promise<CaptureSettingsResponse> {
    const response = await rawApi(`${this.baseUrl}/settings`, { method: 'GET', params: { project_id: projectId ?? undefined } })

    return response.data
  }

  static async save(settings: CaptureSettingsSections, projectId?: string | null): Promise<CaptureSettingsResponse> {
    const response = await rawApi(`${this.baseUrl}/settings`, { method: 'PUT', body: { project_id: projectId ?? null, settings } })

    return response.data
  }

  /** Borra lo guardado en este nivel: el proyecto vuelve a usar lo de la empresa, y la empresa lo de fábrica. */
  static async reset(projectId?: string | null): Promise<CaptureSettingsResponse> {
    const response = await rawApi(`${this.baseUrl}/settings`, { method: 'DELETE', params: { project_id: projectId ?? undefined } })

    return response.data
  }

  static async preview(input: {
    projectId?: string | null
    settings?: CaptureSettingsSections
    description?: string
    writtenShift?: string
    times?: string[]
  }): Promise<CaptureSettingsPreview> {
    const response = await rawApi(`${this.baseUrl}/settings/preview`, {
      method: 'POST',
      body: {
        project_id: input.projectId ?? null,
        settings: input.settings ?? null,
        description: input.description || null,
        written_shift: input.writtenShift || null,
        times: input.times ?? [],
      },
    })

    return response.data
  }

  static async suggestions(projectId?: string | null): Promise<ActivityCorrection[]> {
    const response = await rawApi(`${this.baseUrl}/activity-suggestions`, { method: 'GET', params: { project_id: projectId ?? undefined } })

    return response?.data ?? []
  }
}
