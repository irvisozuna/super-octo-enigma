import { flushPromises, mount } from '@vue/test-utils'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import type { AiImport } from '../../../../infrastructure/api/services/AiCaptureApiService'
import AiCapturePhotoPanelMolecule from '../AiCapturePhotoPanelMolecule.vue'

vi.mock('../../../../infrastructure/api/services/AiCaptureApiService', () => ({
  AiCaptureApiService: { image: vi.fn().mockResolvedValue(new Blob(['jpeg'], { type: 'image/jpeg' })) },
}))

const vuetify = createVuetify({ components, directives })

const aiImport: AiImport = {
  id: 'imp-1',
  project_id: 'p-1',
  well_id: 'w-1',
  report_id: 'r-1',
  status: 'completed',
  original_name: 'hoja.heic',
  error: null,
  model: 'claude-opus-5-5',
  warnings: [
    { source: 'validation', field: 'actividades[0]', step: 'activities', message: '7:00–9:30 son 2.5 h, pero anotaron 1.5 h', severity: 'warning' },
    { source: 'mapping', field: 'turno', step: 'basic', message: 'Turno escrito "1" interpretado como Día.', severity: 'info' },
    { source: 'mapping', field: 'faena', step: 'personnel', message: 'Selecciona operador, ayudantes y equipo.', severity: 'warning' },
  ],
  unmapped: {
    folio: '9001',
    turno_escrito: '1',
    faena: { centro_costo: null, lugar: 'Mina', equipo: 'CDK-0000', operador: 'Juan Pérez', ayudante_1: null, ayudante_2: null, otro: null },
    pozo: { numero: 'VPO-00-01', prof_inicial: 194, prof_final: 197, mts_perforados: 3.6 },
    horometro: { inicial: null, final: null, total_horas: null },
    perforacion: [{ desde: 194, hasta: 197, mts_perforados: 3, recuperacion: 3 }],
    perforacion_notas: ['Medición 90 MTS'],
    aceros: { broca: [{ diametro: 'NQ', no_serie: '13445', serie_color: '12', desde: 194, hasta: 197, nota: null }], tricono: [], escareador: [] },
    accesorios: [],
    firmas: { operador: 'Juan Pérez', supervision_firmado: false, cliente_firmado: false },
  },
  cost_usd: 0.07,
  created_at: '2026-10-15T12:00:00Z',
  processed_at: '2026-10-15T12:00:30Z',
}

describe('AiCapturePhotoPanelMolecule', () => {
  beforeAll(() => {
    globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as any
    URL.createObjectURL = vi.fn(() => 'blob:hoja')
    URL.revokeObjectURL = vi.fn()
  })

  const mountPanel = async () => {
    const wrapper = mount(AiCapturePhotoPanelMolecule, { props: { aiImport }, global: { plugins: [vuetify] } })

    await flushPromises()

    return wrapper
  }

  it('muestra la foto, el folio y cuántos puntos hay por revisar', async () => {
    const wrapper = await mountPanel()

    expect(wrapper.find('img').attributes('src')).toBe('blob:hoja')
    expect(wrapper.text()).toContain('Folio 9001')
    expect(wrapper.text()).toContain('2 puntos por revisar')
  })

  it('agrupa las advertencias por paso del asistente, en orden', async () => {
    const text = (await mountPanel()).text()

    expect(text.indexOf('Información básica')).toBeLessThan(text.indexOf('Personal'))
    expect(text.indexOf('Personal')).toBeLessThan(text.indexOf('Actividades'))
    expect(text).toContain('7:00–9:30 son 2.5 h, pero anotaron 1.5 h')
  })

  it('lleva al paso del asistente correspondiente', async () => {
    const wrapper = await mountPanel()
    const goToActivities = wrapper.findAll('button').filter(button => button.text().includes('Ir al paso'))[2]

    await goToActivities.trigger('click')

    expect(wrapper.emitted('goToStep')).toEqual([['3']])
  })

  it('muestra lo que la hoja dice y no se cargó solo', async () => {
    const text = (await mountPanel()).text()

    expect(text).toContain('Operador: Juan Pérez')
    expect(text).toContain('Broca NQ · serie 13445 / 12')
    expect(text).toContain('Medición 90 MTS')
  })
})
