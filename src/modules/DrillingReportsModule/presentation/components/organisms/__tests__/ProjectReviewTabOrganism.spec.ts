import { flushPromises, mount } from '@vue/test-utils'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import type { ReviewIssue, ReviewQueueEntry } from '../../../../infrastructure/api/services/ReviewQueueApiService'
import { ReviewQueueApiService } from '../../../../infrastructure/api/services/ReviewQueueApiService'
import ProjectReviewTabOrganism from '../ProjectReviewTabOrganism.vue'

vi.mock('../../../../infrastructure/api/services/ReviewQueueApiService', () => ({
  ReviewQueueApiService: { get: vi.fn(), bulkApprove: vi.fn() },
}))
vi.mock('../../../../infrastructure/api/services/AiCaptureApiService', () => ({
  AiCaptureApiService: { list: vi.fn().mockResolvedValue([]), assignWell: vi.fn() },
}))

const vuetify = createVuetify({ components, directives })

const entry = (id: string, light: ReviewQueueEntry['light'], issues: ReviewIssue[] = []): ReviewQueueEntry => ({
  id, report_number: `RPT-${id}`, report_date: '2026-08-11', shift: 'day', status: 'draft', well_id: 'w-1',
  well_number: 'VPO-00-01', meters: 3, hours: 12, ai_import_id: 'imp', light, issues,
})

describe('ProjectReviewTabOrganism', () => {
  beforeAll(() => {
    globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as any
  })

  const mountTab = async () => {
    vi.mocked(ReviewQueueApiService.get).mockResolvedValue({
      reports: [
        entry('a', 'green'),
        entry('b', 'red', [{ code: 'depth_gap', severity: 'error', message: 'Empieza en 200 m, pero el anterior terminó en 197 m', previous_report_id: 'a', previous_report_number: 'RPT-a' }]),
      ],
      summary: { green: 1, yellow: 0, red: 1 },
      can_approve: true,
    })
    vi.mocked(ReviewQueueApiService.bulkApprove).mockResolvedValue([{ report_id: 'a', report_number: 'RPT-a', result: 'approved', message: null }])
    const wrapper = mount(ProjectReviewTabOrganism, { props: { projectId: 'p-1' }, global: { plugins: [vuetify] } })

    await flushPromises()

    return wrapper
  }

  it('muestra el semáforo, los motivos y el reporte anterior', async () => {
    const wrapper = await mountTab()

    expect(wrapper.text()).toContain('Listos para aprobar (1)')
    expect(wrapper.text()).toContain('Con bloqueos (1)')
    expect(wrapper.text()).toContain('Empieza en 200 m')
    expect(wrapper.emitted('count')).toEqual([[2]])

    await wrapper.find('a').trigger('click')
    expect(wrapper.emitted('review')).toEqual([[{ id: 'a', well_id: 'w-1' }]])
  })

  it('aprueba solo el verde con su botón', async () => {
    const wrapper = await mountTab()
    const approve = wrapper.findAll('button').find(button => button.text() === 'Aprobar')!

    await approve.trigger('click')
    await flushPromises()

    expect(ReviewQueueApiService.bulkApprove).toHaveBeenCalledWith('p-1', ['a'])
    expect(wrapper.text()).toContain('Se aprobaron 1 reporte.')
    expect(wrapper.emitted('approved')).toHaveLength(1)
  })
})
