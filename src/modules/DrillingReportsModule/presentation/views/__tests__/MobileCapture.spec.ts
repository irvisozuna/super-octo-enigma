import { flushPromises, mount } from '@vue/test-utils'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import MobileCapture from '../MobileCapture.vue'

vi.mock('../../../infrastructure/api/services/DrillingReportApiService', () => ({
  DrillingReportApiService: {
    getProjects: vi.fn().mockResolvedValue({ data: [{ id: 'p-1', project_name: 'EL CUBO', status: 'active' }] }),
    getWellsByProject: vi.fn().mockResolvedValue({ data: [{ id: 'w-1', well_number: 'VPO-00-01' }] }),
  },
}))
vi.mock('../../../infrastructure/api/services/AiCaptureApiService', () => ({
  AiCaptureApiService: { list: vi.fn().mockResolvedValue([{ id: 'imp-1', status: 'completed' }]), upload: vi.fn() },
}))
vi.mock('../../../infrastructure/persistence/captureQueue', () => ({
  captureQueue: {
    prune: vi.fn().mockResolvedValue(undefined),
    uploadPending: vi.fn().mockResolvedValue(0),
    list: vi.fn().mockResolvedValue([
      { id: 'q-1', projectId: 'p-1', wellId: 'w-1', name: 'hoja.jpg', blob: new Blob(['x']), status: 'pending', createdAt: 1 },
      { id: 'q-2', projectId: 'p-1', wellId: 'w-1', name: 'hoja2.jpg', blob: new Blob(['x']), status: 'uploaded', importId: 'imp-1', createdAt: 2 },
    ]),
  },
}))

const vuetify = createVuetify({ components, directives })

describe('MobileCapture', () => {
  beforeAll(() => {
    globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as any
    URL.createObjectURL = vi.fn(() => 'blob:x')
    URL.revokeObjectURL = vi.fn()
  })

  it('elige solo el único proyecto y pozo, y muestra el estado de cada hoja', async () => {
    const wrapper = mount(MobileCapture, { global: { plugins: [vuetify], stubs: { RouterLink: true } } })

    await flushPromises()
    await flushPromises()

    expect(wrapper.text()).toContain('Guardada en el teléfono')
    expect(wrapper.text()).toContain('Lista para revisar')
    expect(wrapper.find('input[capture="environment"]').exists()).toBe(true)
    const take = wrapper.findAll('button').find(button => button.text().includes('Tomar foto'))!

    expect(take.attributes('disabled')).toBeUndefined()
    wrapper.unmount()
  })
})
