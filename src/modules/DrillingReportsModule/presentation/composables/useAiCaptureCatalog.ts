/**
 * Revisión de la captura con IA: lo que la hoja dice y no está en los catálogos, altas rápidas
 * y asignación al reporte que se está revisando (asistente).
 */

import { ref } from 'vue'
import type { CatalogGap, CatalogMatch, CatalogStatus, SteelSection } from '../../infrastructure/api/services/AiCaptureCatalogApiService'
import { AiCaptureCatalogApiService } from '../../infrastructure/api/services/AiCaptureCatalogApiService'
import { useReportWizardStore } from '../stores/reportWizardStore'

/** Tipo de herramienta del inventario para cada sección de ACEROS de la hoja. */
export const TOOL_TYPE_BY_SECTION: Record<SteelSection, string> = {
  broca: 'drill_bit_diamond',
  tricono: 'drill_bit_tricone',
  escareador: 'reamer',
}

export interface AssignableItem {
  kind: CatalogGap['kind']
  id: string
  position?: 'operator' | 'helper'
  section?: SteelSection
  type?: string
  from?: number | null
  to?: number | null
}

export function useAiCaptureCatalog(importId: () => string, projectId: () => string) {
  const wizard = useReportWizardStore()
  const status = ref<CatalogStatus>({ gaps: [], matches: [] })
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load() {
    loading.value = true
    error.value = null
    try {
      status.value = await AiCaptureCatalogApiService.status(importId())
    }
    catch (err: any) {
      error.value = err?.message || 'No se pudo revisar contra los catálogos'
    }
    finally {
      loading.value = false
    }
  }

  const shift = () => (wizard.formData.shift === 'night' ? 'night' : 'day')

  /** ¿El reporte ya usa este registro? (para no ofrecer "Asignar" de nuevo) */
  function isAssigned(item: Pick<AssignableItem, 'kind' | 'id'>): boolean {
    const form = wizard.formData as any
    if (item.kind === 'equipment')
      return form.equipment_id === item.id
    if (item.kind === 'employee')
      return form[`operator_${shift()}_id`] === item.id || (form[`helper_${shift()}_ids`] ?? []).includes(item.id)

    return form.tool_groups.some((group: any) => group.reamer?.tool_id === item.id || group.bits.some((bit: any) => bit.tool_id === item.id))
  }

  /** Lo que el asistente solo puede elegir si está en el proyecto: personal y equipo. */
  async function ensureInProject(item: AssignableItem & { in_project?: boolean }) {
    if (item.in_project !== false)
      return
    if (item.kind === 'employee')
      await AiCaptureCatalogApiService.addEmployeeToProject(projectId(), item.id, item.position ?? 'helper')
    else if (item.kind === 'equipment')
      await AiCaptureCatalogApiService.addEquipmentToProject(projectId(), item.id)
  }

  function assignToReport(item: AssignableItem) {
    if (item.kind === 'equipment')
      wizard.updateFormData({ equipment_id: item.id })
    else if (item.kind === 'employee')
      assignEmployee(item.id, item.position ?? 'helper')
    else
      assignTool(item)
  }

  function assignEmployee(id: string, position: 'operator' | 'helper') {
    const key = `${position === 'operator' ? 'operator' : 'helper'}_${shift()}` as const
    if (position === 'operator') {
      wizard.updateFormData({ [`${key}_id`]: id } as any)

      return
    }
    const helpers: string[] = (wizard.formData as any)[`${key}_ids`] ?? []
    if (!helpers.includes(id))
      wizard.updateFormData({ [`${key}_ids`]: [...helpers, id] } as any)
  }

  /** El escareador va al grupo; una broca/tricono ocupa el renglón vacío de su tramo o uno nuevo. */
  function assignTool(item: AssignableItem) {
    if (!wizard.formData.tool_groups.length)
      wizard.addToolGroup()
    if (item.section === 'escareador') {
      wizard.updateToolGroupReamer(0, { tool_id: item.id })

      return
    }
    const group = wizard.formData.tool_groups[0]
    let index = group.bits.findIndex(bit => !bit.tool_id && (item.from == null || bit.start_depth_meters === item.from))
    if (index === -1) {
      wizard.addBitToGroup(0)
      index = group.bits.length - 1
    }
    wizard.updateBitInGroup(0, index, {
      tool_id: item.id,
      tool_category: item.section === 'tricono' || item.type === 'drill_bit_tricone' ? 'tricone' : 'diamond_bit',
      ...(item.from != null && { start_depth_meters: item.from }),
      ...(item.to != null && { end_depth_meters: item.to }),
    })
  }

  return { status, loading, error, load, isAssigned, ensureInProject, assignToReport }
}

export type { CatalogGap, CatalogMatch }
