import { beforeEach, describe, expect, it, vi } from 'vitest'

import { filtrosOrdenesIniciales, parametrosOrdenes, useAgentes, useOrdenes } from '../composables/useOrdenes'

const api = vi.hoisted(() => ({
  obtenerCatalogo: vi.fn(),
  obtenerOrdenes: vi.fn(),
  obtenerAgentes: vi.fn(),
  guardarAgente: vi.fn(),
  obtenerPuente: vi.fn(),
  cambiarEstadoOrden: vi.fn(),
  obtenerUsuariosAgente: vi.fn(),
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

    await a.guardar(null, { nombre: '  Ana ', tipos: ['cobranza'], activo: true, usuario: null, usa_app: false, gerencias: [3] })
    expect(api.guardarAgente).toHaveBeenCalledWith(null, { nombre: 'Ana', tipos: ['cobranza'], activo: true, usuario: null, usa_app: false, gerencias: [3] })
    expect(a.agentes.value.map(x => x.id)).toEqual(['a', 'b'])

    expect(await a.guardar('a', { nombre: 'Ana', tipos: [], activo: false, usuario: 'akojeda', usa_app: true, gerencias: [] })).toBeNull()
    expect(a.errorGuardar.value).not.toBeNull()
  })

  it('trae las gerencias y al desactivar a uno lo pasa abajo de los activos (XEL1-786)', async () => {
    api.obtenerAgentes.mockResolvedValue({
      agentes: [{ id: 'b', nombre: 'Beto', tipos: [], activo: true }, { id: 'z', nombre: 'Zoe', tipos: [], activo: true }],
      puede_administrar: true,
      gerencias: [{ id: 3, nombre: 'San José' }],
    })
    api.guardarAgente.mockResolvedValueOnce({ id: 'b', nombre: 'Beto', tipos: [], activo: false })

    const a = useAgentes()

    await a.cargar()
    expect(a.gerencias.value).toEqual([{ id: 3, nombre: 'San José' }])

    await a.guardar('b', { nombre: 'Beto', tipos: [], activo: false, usuario: null, usa_app: false, gerencias: [] })
    expect(a.agentes.value.map(x => x.id)).toEqual(['z', 'b'])
  })
})

describe('cerrar órdenes desde la pantalla de órdenes (XEL1-660)', () => {
  it('solo los tipos sin módulo dueño ofrecen estados de cierre, y cerrar pide nota', async () => {
    api.obtenerCatalogo.mockResolvedValue({
      tipos: [
        { codigo: 'cobranza', nombre: 'Cobranza', refleja_ticket: true, captura_aqui: false, estados: [{ codigo: 'recibida', nombre: 'Recibida', inicial: false, cierra: true, cancela: false }] },
        {
          codigo: 'revision_padron',
          nombre: 'Revisión',
          refleja_ticket: false,
          captura_aqui: true,
          estados: [
            { codigo: 'pendiente', nombre: 'Pendiente', inicial: true, cierra: false, cancela: false },
            { codigo: 'corregida', nombre: 'Corregida', inicial: false, cierra: true, cancela: false },
          ],
        },
      ],
    })

    const fila = { id: 'o1', tipo: { codigo: 'revision_padron', nombre: 'Revisión' }, estado: { codigo: 'pendiente', nombre: 'Pendiente' }, contrato: 1, cuenta: '1', agente: null, observacion: null, entregada_en: null, vence: null, origen: null, abierta_en: null, cerrada_en: null, datos: null }

    api.obtenerOrdenes.mockResolvedValue({ ordenes: [fila], paginacion: { pagina: 1, por_pagina: 50, total: 1 } })
    api.cambiarEstadoOrden.mockResolvedValue({ ...fila, estado: { codigo: 'corregida', nombre: 'Corregida' }, cerrada_en: '2026-11-07T10:00:00+00:00' })

    const o = useOrdenes()

    await o.iniciar()
    expect(o.estadosDeCierre('cobranza')).toEqual([])
    expect(o.estadosDeCierre('revision_padron').map(e => e.codigo)).toEqual(['corregida'])
    expect(await o.cerrar(fila, 'corregida', ' ')).toBe(false)
    expect(await o.cerrar(fila, 'corregida', 'Se corrigió el número')).toBe(true)
    expect(api.cambiarEstadoOrden).toHaveBeenCalledWith('o1', 'corregida', 'Se corrigió el número')
    expect(o.filas.value[0].cerrada_en).not.toBeNull()
  })
})
