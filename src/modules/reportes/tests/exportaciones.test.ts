import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useExportacionesStore } from '../stores/exportacionesStore'
import type { Ejecucion } from '../types/exportacion'
import { opcionesFormato, tamanoLegible } from '../utils/exportaciones'

vi.mock('../services/reportesApi', () => ({
  crearExportacion: vi.fn(),
  listarEjecuciones: vi.fn(),
  obtenerEjecucion: vi.fn(),
  cancelarEjecucion: vi.fn(),
  descargarEjecucion: vi.fn(),
}))

const { cancelarEjecucion, crearExportacion, listarEjecuciones, obtenerEjecucion } = await import('../services/reportesApi')

function ejecucion(parcial: Partial<Ejecucion> = {}): Ejecucion {
  return {
    id: 'e1',
    kind: 'export',
    object_key: 'facturacion_por_concepto',
    titulo: 'Facturación por conceptos',
    formato: 'xlsx',
    estado: 'queued',
    progreso: 0,
    filas: null,
    duracion_ms: null,
    tamano: null,
    mensaje: null,
    nombre_archivo: null,
    url_descarga: null,
    filtros: { periodo: 185 },
    alcance: 'todo',
    expires_at: null,
    created_at: '2026-10-06T12:00:00Z',
    finished_at: null,
    ...parcial,
  }
}

describe('utils/exportaciones', () => {
  it('deshabilita el formato cuando el conjunto excede su tope', () => {
    const opciones = opcionesFormato(['xlsx', 'csv', 'pdf'], { xlsx: 500_000, csv: 1_000_000, pdf: 5_000 }, 12_000)

    expect(opciones.map(o => [o.formato, o.deshabilitado])).toEqual([['xlsx', false], ['csv', false], ['pdf', true]])
    expect(opciones[2].limite).toBe(5_000)
  })

  it('tamaño legible', () => {
    expect(tamanoLegible(512)).toBe('512 B')
    expect(tamanoLegible(20_480)).toBe('20 KB')
    expect(tamanoLegible(3_500_000)).toBe('3.3 MB')
    expect(tamanoLegible(null)).toBe('')
  })
})

describe('exportacionesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
    vi.mocked(crearExportacion).mockReset()
    vi.mocked(listarEjecuciones).mockReset()
    vi.mocked(obtenerEjecucion).mockReset()
    vi.mocked(cancelarEjecucion).mockReset()
  })

  afterEach(() => {
    useExportacionesStore().detener()
    vi.useRealTimers()
  })

  it('encola, sigue con pausa creciente y se detiene al terminar', async () => {
    const store = useExportacionesStore()

    vi.mocked(crearExportacion).mockResolvedValue({ ejecucion_id: 'e1', ejecucion: ejecucion() })
    vi.mocked(obtenerEjecucion)
      .mockResolvedValueOnce(ejecucion({ estado: 'running', progreso: 40 }))
      .mockResolvedValueOnce(ejecucion({ estado: 'running', progreso: 80 }))
      .mockResolvedValueOnce(ejecucion({ estado: 'done', progreso: 100, filas: 28, nombre_archivo: 'f.xlsx', url_descarga: '/d' }))

    const id = await store.iniciar('facturacion_por_concepto', 'Facturación por conceptos', { formato: 'xlsx', alcance: 'todo', filtros: { periodo: 185 } })

    expect(id).toBe('e1')
    expect(store.activas).toHaveLength(1)

    await vi.advanceTimersByTimeAsync(2_000)
    expect(vi.mocked(obtenerEjecucion)).toHaveBeenCalledTimes(1)
    expect(store.tareas[0].progreso).toBe(40)

    await vi.advanceTimersByTimeAsync(3_000)
    expect(vi.mocked(obtenerEjecucion)).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(4_500)
    expect(vi.mocked(obtenerEjecucion)).toHaveBeenCalledTimes(3)
    expect(store.tareas[0].estado).toBe('done')
    expect(store.listas).toHaveLength(1)
    expect(store.activas).toHaveLength(0)

    await vi.advanceTimersByTimeAsync(60_000)
    expect(vi.mocked(obtenerEjecucion)).toHaveBeenCalledTimes(3)
  })

  it('rehidrata desde el servidor y solo sigue las activas', async () => {
    const store = useExportacionesStore()

    vi.mocked(listarEjecuciones).mockResolvedValue([ejecucion({ id: 'a', estado: 'done' }), ejecucion({ id: 'b', estado: 'running' })])
    vi.mocked(obtenerEjecucion).mockResolvedValue(ejecucion({ id: 'b', estado: 'done' }))

    await store.rehidratar()
    expect(store.tareas).toHaveLength(2)
    await vi.advanceTimersByTimeAsync(2_000)
    expect(vi.mocked(obtenerEjecucion)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(obtenerEjecucion)).toHaveBeenCalledWith('b')
  })

  it('cancelar detiene el seguimiento y refleja el estado del servidor', async () => {
    const store = useExportacionesStore()

    vi.mocked(crearExportacion).mockResolvedValue({ ejecucion_id: 'e1', ejecucion: ejecucion() })
    vi.mocked(cancelarEjecucion).mockResolvedValue(ejecucion({ estado: 'canceled' }))

    await store.iniciar('x', 'X', { formato: 'csv', alcance: 'todo', filtros: {} })
    await store.cancelar('e1')
    expect(store.tareas[0].estado).toBe('canceled')

    await vi.advanceTimersByTimeAsync(30_000)
    expect(vi.mocked(obtenerEjecucion)).not.toHaveBeenCalled()
  })

  it('reintentar vuelve a encolar con la misma solicitud y oculta la fallida', async () => {
    const store = useExportacionesStore()

    vi.mocked(crearExportacion)
      .mockResolvedValueOnce({ ejecucion_id: 'e1', ejecucion: ejecucion({ estado: 'failed', mensaje: 'x' }) })
      .mockResolvedValueOnce({ ejecucion_id: 'e2', ejecucion: ejecucion({ id: 'e2' }) })

    await store.iniciar('x', 'X', { formato: 'pdf', alcance: 'pagina', filtros: { periodo: 1 }, pagina: 2, por_pagina: 50 })

    const nuevo = await store.reintentar('e1')

    expect(nuevo).toBe('e2')
    expect(vi.mocked(crearExportacion)).toHaveBeenLastCalledWith('x', { formato: 'pdf', alcance: 'pagina', filtros: { periodo: 1 }, pagina: 2, por_pagina: 50 })
    expect(store.visibles.map(t => t.id)).toEqual(['e2'])
  })
})
