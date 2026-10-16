import { flushPromises, mount } from '@vue/test-utils'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { CatalogImportApiService } from '../../../infrastructure/api/services/CatalogImportApiService'
import CatalogImport from '../CatalogImport.vue'

vi.mock('../../../infrastructure/api/services/DrillingReportApiService', () => ({
  DrillingReportApiService: { getProjects: vi.fn().mockResolvedValue({ data: [{ id: 'p-1', project_name: 'EL CUBO', status: 'active' }] }) },
}))
vi.mock('../../../infrastructure/api/services/CatalogImportApiService', () => ({
  CatalogImportApiService: { downloadTemplate: vi.fn(), preview: vi.fn(), commit: vi.fn() },
}))

const vuetify = createVuetify({ components, directives })

describe('CatalogImport', () => {
  beforeAll(() => {
    globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as any
  })

  it('muestra la vista previa y carga solo las filas nuevas', async () => {
    vi.mocked(CatalogImportApiService.preview).mockResolvedValue({
      rows: [
        { row: 2, data: { employee_code: 'CDK0020', first_name: 'Manuel', last_name: 'Morales', position: 'operator' }, status: 'new', messages: [] },
        { row: 3, data: { employee_code: 'CDK006', first_name: 'Martin', last_name: 'Gonzalez', position: 'helper' }, status: 'exists', messages: ['Ya está dado de alta: se omite.'] },
      ],
      summary: { new: 1, exists: 1, error: 0 },
    })
    vi.mocked(CatalogImportApiService.commit).mockResolvedValue({ created: 1, results: [{ row: 2, status: 'created', message: null }, { row: 3, status: 'exists', message: 'Ya está dado de alta: se omite.' }] })
    const wrapper = mount(CatalogImport, { global: { plugins: [vuetify] } })

    await flushPromises()
    await wrapper.findComponent({ name: 'VFileInput' }).vm.$emit('update:modelValue', new File(['x'], 'personal.xlsx'))
    await flushPromises()

    expect(wrapper.text()).toContain('Nuevo: 1')
    expect(wrapper.text()).toContain('Ya está dado de alta: se omite.')

    await wrapper.findAll('button').find(button => button.text().includes('Cargar 1 nuevo'))!.trigger('click')
    await flushPromises()

    expect(vi.mocked(CatalogImportApiService.commit).mock.calls[0][1]).toHaveLength(1)
    expect(wrapper.text()).toContain('Se cargaron 1.')
  })
})
