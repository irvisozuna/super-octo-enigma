/**
 * Catálogos desde la revisión de la captura con IA: qué de la hoja no está dado de alta,
 * y altas rápidas (personal, equipo, aceros) con los endpoints de cada módulo.
 */

import { rawApi } from '@/services/api'

export type CatalogKind = 'employee' | 'equipment' | 'tool'
export type SteelSection = 'broca' | 'tricono' | 'escareador'

export interface CatalogCandidate {
  id: string
  label: string
  in_project?: boolean
}

/** Lo que la hoja dice y no se encontró en los catálogos. */
export interface CatalogGap {
  kind: CatalogKind
  field: string
  written: string
  position?: 'operator' | 'helper'
  section?: SteelSection
  serial?: string | null
  diameter?: string | null
  from?: number | null
  to?: number | null
  candidates: CatalogCandidate[]
}

/** Lo que sí se encontró (para asignarlo al reporte o al proyecto). */
export interface CatalogMatch {
  kind: CatalogKind
  field: string
  written: string
  id: string
  label: string
  in_project?: boolean
  position?: 'operator' | 'helper'
  section?: SteelSection
  type?: string
  from?: number | null
  to?: number | null
}

export interface CatalogStatus {
  gaps: CatalogGap[]
  matches: CatalogMatch[]
}

export interface NewEmployee {
  first_name: string
  last_name: string
  employee_code: string
  position: 'operator' | 'helper'
  hire_date: string
}

export interface NewEquipment {
  equipment_code: string
  equipment_name: string
  equipment_type: string
  manufacturer: string
  model: string
  serial_number: string
  year_manufactured: number
}

export interface NewTool {
  type: string
  serial_number: string
  capacity_meters: number
  core_size?: string | null
  brand?: string | null
}

export class AiCaptureCatalogApiService {
  static async status(importId: string): Promise<CatalogStatus> {
    const response = await rawApi(`/drilling/reports/ai-imports/${importId}/catalog-status`, { method: 'GET' })

    return response?.data ?? { gaps: [], matches: [] }
  }

  static async createEmployee(data: NewEmployee): Promise<{ id: string }> {
    const response = await rawApi('/employees', { method: 'POST', body: { ...data, employment_type: 'full_time', status: 'active' } })

    return response.data
  }

  static async createEquipment(data: NewEquipment): Promise<{ id: string }> {
    const response = await rawApi('/equipment-management/equipment', { method: 'POST', body: data })

    return response.data
  }

  static async createTool(data: NewTool): Promise<{ id: string }> {
    const response = await rawApi('/tool-management/tools', { method: 'POST', body: data })

    return response.data
  }

  /** El asistente solo ofrece personal del proyecto. En el proyecto no existe el rol "ayudante": es "assistant". */
  static async addEmployeeToProject(projectId: string, employeeId: string, position: 'operator' | 'helper') {
    await rawApi(`/drilling/projects/${projectId}/personnel`, {
      method: 'POST',
      body: { employee_id: employeeId, role: position === 'operator' ? 'operator' : 'assistant' },
    })
  }

  /** El asistente solo ofrece equipos asignados al proyecto. */
  static async addEquipmentToProject(projectId: string, equipmentId: string) {
    await rawApi(`/equipment-management/equipment/${equipmentId}/assign`, { method: 'POST', body: { project_id: projectId } })
  }
}
