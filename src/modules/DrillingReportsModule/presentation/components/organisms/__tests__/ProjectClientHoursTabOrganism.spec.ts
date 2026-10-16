import { flushPromises, mount } from '@vue/test-utils'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { ClientHoursApiService } from '../../../../infrastructure/api/services/ClientHoursApiService'
import ProjectClientHoursTabOrganism from '../ProjectClientHoursTabOrganism.vue'

vi.mock('../../../../infrastructure/api/services/ClientHoursApiService', () => ({
  ClientHoursApiService: { get: vi.fn(), export: vi.fn() },
}))

const vuetify = createVuetify({ components, directives })

describe('ProjectClientHoursTabOrganism', () => {
  beforeAll(() => {
    globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as any
    window.matchMedia ??= ((query: string) => ({ matches: false, media: query, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false })) as any
  })

  it('muestra el total a cobrar, lo pendiente aparte y la evidencia de cada renglón', async () => {
    vi.mocked(ClientHoursApiService.get).mockResolvedValue({
      rows: [{
        report_id: 'r-1', report_number: 'RPT-1', report_date: '2026-08-11', shift: 'night', status: 'approved', well_id: 'w-1',
        well_number: 'VPO-00-01', activity_type: 'standby_client', activity_label: 'Stand by cliente', description: 'Esperando agua',
        start_time: '22:00', end_time: '01:00', hours_client: 3, folio: '1406', ai_import_id: 'imp-1',
      }],
      totals: { hours: 3, by_type: [{ key: 'standby_client', label: 'Stand by cliente', hours: 3, count: 1 }], by_well: [], pending_hours: 1.5 },
    })
    const wrapper = mount(ProjectClientHoursTabOrganism, { props: { projectId: 'p-1', projectName: 'EL CUBO' }, global: { plugins: [vuetify] } })

    await flushPromises()

    expect(wrapper.text()).toContain('3 h')
    expect(wrapper.text()).toContain('+ 1.5 h en reportes sin aprobar')
    expect(wrapper.text()).toContain('folio 1406')

    await wrapper.find('a').trigger('click')
    expect(wrapper.emitted('review')).toEqual([[{ id: 'r-1', well_id: 'w-1' }]])
  })
})
