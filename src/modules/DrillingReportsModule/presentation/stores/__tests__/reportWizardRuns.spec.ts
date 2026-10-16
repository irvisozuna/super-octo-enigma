import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useReportWizardStore } from '../reportWizardStore'

describe('reportWizardStore · corridas', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('cada corrida nueva empieza donde terminó la anterior', () => {
    const store = useReportWizardStore()

    store.formData.drilling_depth_start = 194
    store.addRun()
    store.updateRun(0, { depth_to: 197 })
    store.addRun()

    expect(store.formData.runs.map(run => run.depth_from)).toEqual([194, 197])
  })

  it('carga las corridas del reporte al editar', () => {
    const store = useReportWizardStore()

    store.loadReportData({ id: 'r-1', shift: 'day', activities: [], runs: [{ depth_from: 194, depth_to: 197, meters_drilled: 3, meters_recovered: 2.9, rock_type: 'Andesita', hardness: null }] })

    expect(store.formData.runs).toEqual([{ depth_from: 194, depth_to: 197, meters_drilled: 3, meters_recovered: 2.9, rock_type: 'Andesita', hardness: null }])
  })

  it('un borrador guardado antes de existir las corridas se abre sin errores', () => {
    localStorage.setItem('report_draft_p-1_w-1', JSON.stringify({ formData: { shift: 'night', activities: [] }, currentStep: '2', timestamp: Date.now() }))
    const store = useReportWizardStore()

    store.loadDraft('p-1', 'w-1')

    expect(store.formData.runs).toEqual([])
    expect(store.formData.shift).toBe('night')
  })
})
