import { beforeEach, describe, expect, it, vi } from 'vitest'

import { comparacion, parametrosRanking, useRanking } from '../composables/useRanking'
import type { FilaRanking, RespuestaRanking } from '../types/ranking'

const api = vi.hoisted(() => ({
  obtenerRanking: vi.fn(),
  descargarRanking: vi.fn(),
}))

vi.mock('../services/monitoreoApi', () => api)

const fila = (x: Partial<FilaRanking>): FilaRanking => ({
  posicion: 1,
  lecturista_id: 411,
  nombre: 'SERGIO',
  gerencia_id: 2,
  gerencia: 'SJC',
  dias: 5,
  lecturas: 1200,
  lecturas_dia: 240,
  lecturas_hora: 60,
  min_totales: 1200,
  min_muertos: 100,
  anomalias: 10,
  impresas: 600,
  lejos: 12,
  pct_lejos: 1,
  apego_pct: 90,
  sectores: 6,
  km: 20,
  referencia: { periodos: 3, dias: 60, lecturas_dia: 220, lecturas_hora: 55, min_muertos_dia: 30 },
  delta: { lecturas_dia: 20, lecturas_hora: 5, min_muertos_dia: -10 },
  ...x,
})

const respuesta: RespuestaRanking = {
  periodo: { id: 186, nombre: 'OCTUBRE 2026', inicio: '2026-10-01', fin: '2026-10-31' },
  desde: '2026-10-01',
  hasta: '2026-10-07',
  gerencia_id: null,
  meta_diaria: 250,
  distancia_m: 50,
  filas: [fila({}), fila({ posicion: 2, lecturista_id: 7, nombre: 'ANA', lecturas: 900, referencia: null, delta: null })],
  totales: { lecturistas: 2, dias: 10, lecturas: 2100, lecturas_dia: 210, lecturas_hora: 58, min_totales: 2400, min_muertos: 200, anomalias: 20, impresas: 1000, lejos: 20 },
  referencia_periodos: ['JULIO 2026', 'AGOSTO 2026', 'SEPTIEMBRE 2026'],
}

describe('ranking: parámetros y comparación', () => {
  it('manda solo los filtros con valor', () => {
    expect(parametrosRanking({ periodo: 186, gerencia: null, desde: '2026-10-05', hasta: null })).toEqual({ periodo: 186, desde: '2026-10-05' })
  })

  it('compara contra el promedio propio con flecha y signo, y "sin referencia" cuando no hay historial', () => {
    const f = fila({})

    expect(comparacion(f, 'lecturas_dia')).toEqual({ flecha: 'arriba', texto: '+20', mejor: true })
    expect(comparacion(f, 'min_muertos_dia')).toEqual({ flecha: 'abajo', texto: '-10', mejor: true }) // menos tiempo muerto es mejor
    expect(comparacion(fila({ delta: { lecturas_dia: -3, lecturas_hora: 0, min_muertos_dia: 4 } }), 'lecturas_dia')).toEqual({ flecha: 'abajo', texto: '-3', mejor: false })
    expect(comparacion(fila({ delta: { lecturas_dia: 0, lecturas_hora: 0, min_muertos_dia: 0 } }), 'lecturas_hora')).toEqual({ flecha: 'igual', texto: '=', mejor: null })
    expect(comparacion(fila({ referencia: null, delta: null }), 'lecturas_dia')).toEqual({ flecha: null, texto: '', mejor: null })
  })
})

describe('useRanking', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.obtenerRanking.mockResolvedValue(respuesta)
  })

  it('carga, toma el rango que acotó el servidor y reinicia fechas al cambiar de periodo', async () => {
    const r = useRanking()

    await r.cargar()
    expect(r.filas.value).toHaveLength(2)
    expect(r.filtros.periodo).toBe(186)
    expect(r.filtros.desde).toBe('2026-10-01')
    expect(r.filtros.hasta).toBe('2026-10-07')

    await r.aplicar({ periodo: 185 })
    expect(api.obtenerRanking).toHaveBeenLastCalledWith({ periodo: 185 }, expect.anything())
  })

  it('exporta descargando el archivo y guarda el error si falla', async () => {
    const r = useRanking()

    await r.cargar()
    api.descargarRanking.mockResolvedValue(new Blob(['x']))

    // jsdom no implementa createObjectURL
    Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:x'), revokeObjectURL: vi.fn() })

    const clic = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    await r.exportar('pdf')
    expect(api.descargarRanking).toHaveBeenCalledWith('pdf', { periodo: 186, desde: '2026-10-01', hasta: '2026-10-07' })
    expect(clic).toHaveBeenCalled()
    clic.mockRestore()

    api.descargarRanking.mockRejectedValue(Object.assign(new Error('fallo'), { status: 422, body: { mensaje: 'No se pudo generar el PDF' } }))
    await r.exportar('pdf')
    expect(r.errorExportacion.value?.mensaje).toContain('No se pudo generar el PDF')
  })
})
