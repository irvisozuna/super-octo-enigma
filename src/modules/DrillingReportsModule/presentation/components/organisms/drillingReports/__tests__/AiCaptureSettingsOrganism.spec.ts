import { flushPromises, mount } from '@vue/test-utils'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { AiCaptureSettingsApiService } from '../../../../../infrastructure/api/services/AiCaptureSettingsApiService'
import AiCaptureSettingsOrganism from '../AiCaptureSettingsOrganism.vue'

vi.mock('../../../../../infrastructure/api/services/AiCaptureSettingsApiService', () => ({
  AiCaptureSettingsApiService: { get: vi.fn(), save: vi.fn(), reset: vi.fn(), preview: vi.fn(), suggestions: vi.fn() },
}))

const vuetify = createVuetify({ components, directives })

const settings = {
  shifts: { day_start: '07:00', labels: { day: ['a', '1'], night: ['b', '2'] } },
  activity_rules: [{ activity_type: 'drilling', keywords: ['perfor'] }],
}

const mountOrganism = async (canConfigure: boolean, projectId: string | null = 'p-1') => {
  vi.mocked(AiCaptureSettingsApiService.get).mockResolvedValue({
    stored: null, inherited: settings, resolved: settings, defaults: settings,
    activity_types: { drilling: 'Perforación', other: 'Otros' }, can_configure: canConfigure,
  })
  vi.mocked(AiCaptureSettingsApiService.suggestions).mockResolvedValue([
    { description: 'Se lleva muestra', mapped_type: 'other', chosen_type: 'drilling', chosen_label: 'Perforación', count: 2 },
  ])
  const wrapper = mount(AiCaptureSettingsOrganism, { props: { projectId }, global: { plugins: [vuetify] } })

  await flushPromises()

  return wrapper
}

describe('AiCaptureSettingsOrganism', () => {
  beforeAll(() => {
    globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as any
    // jsdom no trae matchMedia y VSwitch lo usa
    window.matchMedia ??= ((query: string) => ({ matches: false, media: query, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false })) as any
  })

  it('en un proyecto muestra que hereda de la empresa y no deja guardar sin cambios', async () => {
    const wrapper = await mountOrganism(true)

    expect(wrapper.text()).toContain('Personalizar para este proyecto')
    expect(wrapper.text()).toContain('Día: 07:00 a 19:00')
    const save = wrapper.findAll('button').find(button => button.text().includes('Guardar'))!

    expect(save.attributes('disabled')).toBeDefined()
  })

  it('avisa cuando el usuario no puede cambiar la configuración', async () => {
    const wrapper = await mountOrganism(false)

    expect(wrapper.text()).toContain('Solo un administrador puede cambiar esta configuración')
  })
})
