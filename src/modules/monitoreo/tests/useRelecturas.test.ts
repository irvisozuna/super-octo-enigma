import { beforeEach, describe, expect, it, vi } from 'vitest'

import { agruparPendientes, filtrosRelecturasIniciales, parametrosRelecturas, useRelecturas } from '../composables/useRelecturas'
import type { Relectura, RespuestaRelecturas } from '../types/relecturas'

const api = vi.hoisted(() => ({
  obtenerRelecturas: vi.fn(),
  cancelarRelectura: vi.fn(),
  descargarRelecturasPdf: vi.fn(),
}))

vi.mock('../services/monitoreoApi', () => api)

const fila = (x: Partial<Relectura>): Relectura => ({
  id: 'r1',
  contrato_id: 40350,
  periodo_id: 186,
  lectura_id: 1,
  cuenta: '10702033',
  nombre: 'JUAN',
  direccion: 'CALLE 1',
  secuencia: 5,
  sector_id: 330,
  sector: 'SECTOR 3',
  gerencia_id: 1,
  lecturista_id: 7,
  lecturista: 'ANA',
  motivo: 'consumo_cero',
  motivo_etiqueta: 'Consumo cero',
  nota: null,
  estado: 'solicitada',
  pedida_por: 'admin',
  pedida_en: '2026-10-07 15:00:00',
  resuelta_en: null,
  resultado: null,
  cancelacion: null,
  ...x,
})

const respuesta: RespuestaRelecturas = {
  periodo: { id: 186, nombre: 'OCTUBRE 2026' },
  filas: [fila({}), fila({ id: 'r2', secuencia: 2 }), fila({ id: 'r3', lecturista_id: 8, lecturista: 'LUIS', sector_id: 1, sector: 'A', secuencia: null })],
  conteos: { solicitada: 3, releida: 0, cancelada: 1 },
  motivos: { consumo_cero: 'Consumo cero', consumo_alto: 'Consumo alto', consumo_bajo: 'Consumo bajo', lectura_menor: 'Lectura menor', anomalia: 'Anomalía', revisar: 'Revisar', otro: 'Otro' },
  puede_operar: true,
}

describe('re-lecturas: parámetros y agrupación', () => {
  it('manda el estado siempre y los demás filtros solo con valor', () => {
    expect(parametrosRelecturas({ ...filtrosRelecturasIniciales(), gerencia: 1 })).toEqual({ estado: 'solicitada', gerencia: 1 })
  })

  it('agrupa por lecturista y sector y ordena por secuencia dejando al final las tomas sin secuencia', () => {
    const grupos = agruparPendientes(respuesta.filas)

    expect(grupos.map(g => [g.lecturista, g.sector, g.filas.map(f => f.id)])).toEqual([
      ['ANA', 'SECTOR 3', ['r2', 'r1']],
      ['LUIS', 'A', ['r3']],
    ])
  })
})

describe('useRelecturas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.obtenerRelecturas.mockResolvedValue(JSON.parse(JSON.stringify(respuesta)))
  })

  it('carga, toma el periodo del servidor y al cancelar quita la fila de pendientes y ajusta los conteos', async () => {
    api.cancelarRelectura.mockResolvedValue(fila({ estado: 'cancelada', cancelacion: { nota: 'ya' } }))

    const r = useRelecturas()

    await r.cargar()
    expect(r.filtros.periodo).toBe(186)
    expect(r.grupos.value).toHaveLength(2)

    const c = await r.cancelar('r1', 'ya')

    expect(c?.estado).toBe('cancelada')
    expect(r.filas.value.map(f => f.id)).toEqual(['r2', 'r3'])
    expect(r.conteos.value).toEqual({ solicitada: 2, releida: 0, cancelada: 2 })
  })

  it('guarda el error de cancelar sin perder la lista', async () => {
    api.cancelarRelectura.mockRejectedValue(Object.assign(new Error('x'), { status: 409, body: { mensaje: 'Solo se cancela una re-lectura solicitada.' } }))

    const r = useRelecturas()

    await r.cargar()
    expect(await r.cancelar('r1')).toBeNull()
    expect(r.errorAccion.value?.mensaje).toContain('Solo se cancela')
    expect(r.filas.value).toHaveLength(3)
  })
})
