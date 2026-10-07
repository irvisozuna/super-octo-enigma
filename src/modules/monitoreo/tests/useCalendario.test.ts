import { beforeEach, describe, expect, it, vi } from 'vitest'

import { agruparPorDia, edicionDe, mismaEdicion, useCalendario } from '../composables/useCalendario'
import type { FilaCalendario, RespuestaCalendario } from '../types/calendario'

const api = vi.hoisted(() => ({
  obtenerCalendario: vi.fn(),
  guardarCalendario: vi.fn(),
  copiarCalendario: vi.fn(),
  importarCalendario: vi.fn(),
  descargarPlantillaCalendario: vi.fn(),
}))

vi.mock('../services/monitoreoApi', () => api)

const fila = (extra: Partial<FilaCalendario>): FilaCalendario => ({
  sector_id: 1,
  sector: 'S1',
  sistema: 'X',
  gerencia_id: 1,
  gerencia: 'CSL',
  programada: null,
  limite: null,
  lecturista_id: null,
  lecturista: null,
  nota: null,
  origen: null,
  actualizado: null,
  estado: 'pendiente',
  esperadas: 100,
  pct_campo: 0,
  primera_lectura: null,
  ultima_lectura: null,
  lecturistas_reales: [],
  ...extra,
})

const respuesta: RespuestaCalendario = {
  periodo: { id: 186, nombre: 'OCTUBRE 2026', inicio: '2026-10-01', fin: '2026-10-31', abierto: true },
  anterior: { id: 185, nombre: 'SEPTIEMBRE 2026', con_calendario: 3 },
  sectores: [fila({ sector_id: 1, programada: '2026-10-01', limite: '2026-10-02' }), fila({ sector_id: 2 }), fila({ sector_id: 3, limite: '2026-10-02' })],
  con_fecha: 2,
  dias_habiles: [1, 2, 3, 4, 5],
  puede_editar: true,
}

describe('edición del calendario', () => {
  it('normaliza vacíos a null y compara ediciones', () => {
    const e = edicionDe(fila({ sector_id: 9, programada: '', nota: '  ' }))

    expect(e).toEqual({ sector_id: 9, programada: null, limite: null, lecturista_id: null, nota: null })
    expect(mismaEdicion(e, { ...e, nota: null })).toBe(true)
    expect(mismaEdicion(e, { ...e, limite: '2026-10-02' })).toBe(false)
  })

  it('agrupa programados y límites por día', () => {
    const porDia = agruparPorDia(respuesta.sectores)

    expect(porDia['2026-10-01'].programados.map(f => f.sector_id)).toEqual([1])
    expect(porDia['2026-10-02'].limites.map(f => f.sector_id)).toEqual([1, 3])
    expect(porDia['2026-10-03']).toBeUndefined()
  })
})

describe('useCalendario', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.obtenerCalendario.mockResolvedValue(respuesta)
  })

  it('detecta solo las filas cambiadas y las manda al guardar, luego recarga', async () => {
    api.guardarCalendario.mockResolvedValue({ guardadas: 1, borradas: 1, rechazadas: [] })

    const c = useCalendario()

    await c.cargar(186, null)
    expect(c.hayCambios.value).toBe(false)
    c.filas.value[1].programada = '2026-10-05'
    c.filas.value[0].programada = null
    c.filas.value[0].limite = null
    c.filas.value[2].nota = '   ' // sin cambio real
    expect(c.cambios.value.map(e => e.sector_id)).toEqual([1, 2])

    const r = await c.guardar()

    expect(r?.guardadas).toBe(1)
    expect(api.guardarCalendario).toHaveBeenCalledWith(186, [
      { sector_id: 1, programada: null, limite: null, lecturista_id: null, nota: null },
      { sector_id: 2, programada: '2026-10-05', limite: null, lecturista_id: null, nota: null },
    ])
    expect(api.obtenerCalendario).toHaveBeenCalledTimes(2)
    expect(c.hayCambios.value).toBe(false)
  })

  it('descarta cambios, copia del periodo anterior e importa un archivo', async () => {
    api.copiarCalendario.mockResolvedValue({ copiadas: 3, omitidas: 1, rechazadas: [] })
    api.importarCalendario.mockResolvedValue({ leidas: 5, guardadas: 3, borradas: 0, rechazadas: [{ fila: 5, sector_id: 999999, motivo: 'no existe' }] })

    const c = useCalendario()

    await c.cargar(186, 2)
    c.filas.value[1].limite = '2026-10-09'
    expect(c.hayCambios.value).toBe(true)
    c.descartarCambios()
    expect(c.hayCambios.value).toBe(false)

    expect((await c.copiar(185))?.copiadas).toBe(3)
    expect(api.copiarCalendario).toHaveBeenCalledWith(186, 185, false)

    const archivo = new File(['x'], 'cal.xlsx')
    const r = await c.importar(archivo)

    expect(r?.rechazadas).toHaveLength(1)
    expect(api.importarCalendario).toHaveBeenCalledWith(186, archivo)
    expect(api.obtenerCalendario).toHaveBeenLastCalledWith(186, 2, expect.anything())
  })
})
