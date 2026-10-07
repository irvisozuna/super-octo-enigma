import { beforeEach, describe, expect, it, vi } from 'vitest'

import { filtrosCoordenadasIniciales, moverResumen, parametrosCoordenadas, useCoordenadas } from '../composables/useCoordenadas'
import type { PropuestaCoordenada, RespuestaCoordenadas } from '../types/coordenadas'

const api = vi.hoisted(() => ({
  obtenerCoordenadas: vi.fn(),
  decidirCoordenada: vi.fn(),
  descargarCoordenadasCsv: vi.fn(),
}))

vi.mock('../services/monitoreoApi', () => api)

const fila = (extra: Partial<PropuestaCoordenada> = {}): PropuestaCoordenada => ({
  id: 'a',
  contrato_id: 1,
  cuenta: '100',
  nombre: 'X',
  direccion: null,
  activo: true,
  sector_id: 1,
  sector: 'S',
  gerencia_id: 1,
  gerencia: 'CSL',
  tipo: 'sin_coordenada',
  estado: 'propuesta',
  actual: { lat: null, lng: null },
  propuesta: { lat: 23.1, lng: -109.7 },
  lecturas_base: 3,
  dispersion_m: 8,
  distancia_actual_m: null,
  confianza: 'alta',
  decidido_por: null,
  decidido_en: null,
  nota: null,
  calculado: null,
  ...extra,
})

const respuesta: RespuestaCoordenadas = {
  filas: [fila(), fila({ id: 'b', contrato_id: 2, tipo: 'desactualizada', actual: { lat: 23, lng: -109 }, distancia_actual_m: 220 })],
  total: 2,
  pagina: 1,
  por_pagina: 50,
  resumen: { sin_coordenada: { propuesta: 1, aceptada: 0, descartada: 0, aplicada: 0 }, desactualizada: { propuesta: 1, aceptada: 0, descartada: 0, aplicada: 0 }, tomas_sin_coordenada: 13508, tomas_sin_coordenada_activas: 9546, calculado: '2026-10-07 13:00:00' },
  puede_decidir: true,
}

describe('parametrosCoordenadas y moverResumen', () => {
  it('manda solo los filtros con valor y pagina cuando se pide', () => {
    expect(parametrosCoordenadas(filtrosCoordenadasIniciales())).toEqual({ estado: 'propuesta', pagina: 1, por_pagina: 50 })
    expect(parametrosCoordenadas({ ...filtrosCoordenadasIniciales(), estado: null, tipo: 'desactualizada', gerencia: 2, q: ' 107 ' }, false)).toEqual({ tipo: 'desactualizada', gerencia: 2, q: '107' })
  })

  it('mueve el conteo del resumen al cambiar de estado', () => {
    const r = moverResumen(respuesta.resumen, fila(), fila({ estado: 'aceptada' }))

    expect(r.sin_coordenada).toEqual({ propuesta: 0, aceptada: 1, descartada: 0, aplicada: 0 })
    expect(r.desactualizada.propuesta).toBe(1)
    expect(moverResumen(respuesta.resumen, fila(), fila())).toBe(respuesta.resumen)
  })
})

describe('useCoordenadas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.obtenerCoordenadas.mockResolvedValue(respuesta)
  })

  it('carga con los filtros, vuelve a la primera página al cambiar un filtro y cuenta las abiertas', async () => {
    const c = useCoordenadas()

    await c.cargar()
    expect(c.filas.value).toHaveLength(2)
    expect(c.abiertas.value).toBe(2)
    expect(c.puedeDecidir.value).toBe(true)

    c.filtros.pagina = 3
    await c.aplicar({ tipo: 'desactualizada' })
    expect(c.filtros.pagina).toBe(1)
    expect(api.obtenerCoordenadas).toHaveBeenLastCalledWith({ tipo: 'desactualizada', estado: 'propuesta', pagina: 1, por_pagina: 50 }, expect.anything())
  })

  it('al decidir reemplaza la fila y ajusta el resumen sin recargar', async () => {
    api.decidirCoordenada.mockResolvedValue(fila({ estado: 'aceptada', decidido_por: 'admin', decidido_en: '2026-10-07 13:05:00' }))

    const c = useCoordenadas()

    await c.cargar()
    expect(await c.decidir(c.filas.value[0], 'aceptar')).toBe(true)
    expect(api.decidirCoordenada).toHaveBeenCalledWith(1, 'aceptar', undefined)
    expect(c.filas.value[0].estado).toBe('aceptada')
    expect(c.resumen.value?.sin_coordenada.aceptada).toBe(1)
    expect(c.abiertas.value).toBe(1)
    expect(api.obtenerCoordenadas).toHaveBeenCalledTimes(1)
  })

  it('guarda el error de una decisión rechazada (403) sin tocar la lista', async () => {
    api.decidirCoordenada.mockRejectedValueOnce({ status: 403, body: { message: 'Solo quien opera…' } })

    const c = useCoordenadas()

    await c.cargar()
    expect(await c.decidir(c.filas.value[0], 'descartar')).toBe(false)
    expect(c.errorDecision.value?.codigo).toBe('SIN_PERMISO')
    expect(c.filas.value[0].estado).toBe('propuesta')
  })
})
