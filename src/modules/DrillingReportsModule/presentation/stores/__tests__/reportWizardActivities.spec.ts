import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useReportWizardStore } from '../reportWizardStore'

describe('reportWizardStore · actividades al editar', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('conserva el tipo de cada actividad que manda el detalle del reporte', () => {
    const store = useReportWizardStore()

    store.loadReportData({
      id: 'r-1',
      report_date: '2026-09-27',
      shift: 'night',
      runs: [],
      activities: [
        { type: 'drilling', shift: 'night', hours: 5, start_time: '19:00', end_time: '00:00', description: 'perforación' },
        { type: 'meal_break', shift: 'night', hours: 1, start_time: '00:00', end_time: '01:00', description: 'comida' },
      ],
    })

    expect(store.formData.activities.map(activity => activity.activity_type)).toEqual(['drilling', 'meal_break'])
    expect(store.formData.report_date).toBe('2026-09-27')
  })
})
