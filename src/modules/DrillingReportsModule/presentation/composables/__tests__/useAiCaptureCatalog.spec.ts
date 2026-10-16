import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AiCaptureCatalogApiService } from '../../../infrastructure/api/services/AiCaptureCatalogApiService'
import { useReportWizardStore } from '../../stores/reportWizardStore'
import { useAiCaptureCatalog } from '../useAiCaptureCatalog'

vi.mock('../../../infrastructure/api/services/AiCaptureCatalogApiService', () => ({
  AiCaptureCatalogApiService: { status: vi.fn(), addEmployeeToProject: vi.fn(), addEquipmentToProject: vi.fn() },
}))

describe('useAiCaptureCatalog', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.mocked(AiCaptureCatalogApiService.addEmployeeToProject).mockReset()
  })

  const setup = (shift = 'day') => {
    const wizard = useReportWizardStore()

    wizard.formData.shift = shift
    wizard.formData.drilling_depth_start = 194
    wizard.formData.drilling_depth_end = 197

    return { wizard, catalog: useAiCaptureCatalog(() => 'imp-1', () => 'p-1') }
  }

  it('pone al operador y suma ayudantes en el turno del reporte', () => {
    const { wizard, catalog } = setup('night')

    catalog.assignToReport({ kind: 'employee', id: 'e-op', position: 'operator' })
    catalog.assignToReport({ kind: 'employee', id: 'e-ay', position: 'helper' })
    catalog.assignToReport({ kind: 'employee', id: 'e-ay', position: 'helper' })

    expect(wizard.formData.operator_night_id).toBe('e-op')
    expect(wizard.formData.helper_night_ids).toEqual(['e-ay'])
    expect(catalog.isAssigned({ kind: 'employee', id: 'e-ay' })).toBe(true)
  })

  it('arma el grupo de aceros: escareador al grupo y la broca en su tramo', () => {
    const { wizard, catalog } = setup()

    catalog.assignToReport({ kind: 'tool', id: 't-ream', section: 'escareador' })
    catalog.assignToReport({ kind: 'tool', id: 't-tri', section: 'tricono', from: 194, to: 197 })

    const group = wizard.formData.tool_groups[0]

    expect(group.reamer.tool_id).toBe('t-ream')
    expect(group.bits).toHaveLength(1)
    expect(group.bits[0]).toMatchObject({ tool_id: 't-tri', tool_category: 'tricone', start_depth_meters: 194, end_depth_meters: 197 })
  })

  it('solo agrega al proyecto lo que no está', async () => {
    const { catalog } = setup()

    await catalog.ensureInProject({ kind: 'employee', id: 'e-1', position: 'helper', in_project: true })
    await catalog.ensureInProject({ kind: 'employee', id: 'e-2', position: 'helper', in_project: false })

    expect(AiCaptureCatalogApiService.addEmployeeToProject).toHaveBeenCalledTimes(1)
    expect(AiCaptureCatalogApiService.addEmployeeToProject).toHaveBeenCalledWith('p-1', 'e-2', 'helper')
  })
})
