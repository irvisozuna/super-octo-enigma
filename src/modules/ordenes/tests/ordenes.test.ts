import { beforeEach, describe, expect, it, vi } from 'vitest'

import { filtrosOrdenesIniciales, parametrosOrdenes, useAgentes, useOrdenes } from '../composables/useOrdenes'

const api = vi.hoisted(() => ({
  obtenerCatalogo: vi.fn(),
  obtenerOrdenes: vi.fn(),
  obtenerAgentes: vi.fn(),
  guardarAgente: vi.fn(),
  obtenerPuente: vi.fn(),
}))

vi.mock('../services/ordenesApi', () => api)

beforeEach(() => {
  Object.values(api).forEach(f => f.mockReset())
})

describe('órdenes de trabajo', () => {
  it('manda solo los filtros con valor y abiertas como 1/0', () => {
    expect(parametrosOrdenes(filtrosOrdenesIniciales(), 1, 50)).toEqual({ page: 1, por_pagina: 50 })
    expect(parametrosOrdenes({ ...filtrosOrdenesIniciales(), tipo: 'cobranza', abiertas: false, cuenta: ' 12 ' }, 2, 10))
      .toEqual({ page: 2, por_pagina: 10, tipo: 'cobranza', abiertas: 0, cuenta: '12' })
  })

  it('al cambiar de tipo se limpia el estado, que es propio de cada tipo', async () => {
    api.obtenerOrdenes.mockResolvedValue({ ordenes: [], paginacion: { pagina: 1, por_pagina: 50, total: 0 } })

    const o = useOrdenes()

    await o.aplicar({ tipo: 'cobranza', estado: 'recibida' })
    await o.aplicar({ tipo: 'corte' })
    expect(o.filtros.estado).toBeNull()
    expect(api.obtenerOrdenes.mock.calls[1][0]).toEqual({ page: 1, por_pagina: 50, tipo: 'corte' })
  })
})

describe('agentes de campo', () => {
  it('al guardar recorta el nombre, reemplaza o agrega y deja la lista en orden', async () => {
    api.obtenerAgentes.mockResolvedValue({ agentes: [{ id: 'b', nombre: 'Beto', tipos: [], activo: true }], puede_administrar: true })
    api.guardarAgente.mockResolvedValueOnce({ id: 'a', nombre: 'Ana', tipos: ['cobranza'], activo: true })
    api.guardarAgente.mockRejectedValueOnce(Object.assign(new Error('x'), { status: 422 }))

    const a = useAgentes()

    await a.cargar()

    await a.guardar(null, { nombre: '  Ana ', tipos: ['cobranza'], activo: true })
    expect(api.guardarAgente).toHaveBeenCalledWith(null, { nombre: 'Ana', tipos: ['cobranza'], activo: true })
    expect(a.agentes.value.map(x => x.id)).toEqual(['a', 'b'])

    expect(await a.guardar('a', { nombre: 'Ana', tipos: [], activo: false })).toBeNull()
    expect(a.errorGuardar.value).not.toBeNull()
  })
})
