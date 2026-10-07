import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ejeHoras, segmentosLineaTiempo, useJornada } from '../composables/useJornada'

const api = vi.hoisted(() => ({ obtenerJornada: vi.fn() }))

vi.mock('../services/monitoreoApi', () => api)

const lecturas = [
  { id: 1, contrato_id: 10, cuenta: '100', hora: '2026-09-22 07:00:00', llegada: null, sector_id: 1, sector: 'S1', anomalia: null, distancia_m: 10, lejos: false, impresa: true, con_gps: true },
  { id: 2, contrato_id: 11, cuenta: '101', hora: '2026-09-22 09:00:00', llegada: null, sector_id: 1, sector: 'S1', anomalia: 'MEDIDOR DESTRUIDO', distancia_m: 120, lejos: true, impresa: false, con_gps: true },
  { id: 3, contrato_id: 12, cuenta: '102', hora: '2026-09-22 22:30:00', llegada: null, sector_id: 1, sector: 'S1', anomalia: null, distancia_m: null, lejos: false, impresa: null, con_gps: false },
]

describe('línea de tiempo de la jornada', () => {
  it('convierte lecturas, huecos y tramos sin señal a porcentajes del eje y recorta lo que queda fuera', () => {
    const seg = segmentosLineaTiempo(lecturas, [{ desde: '2026-09-22 07:00:00', hasta: '2026-09-22 09:00:00', minutos: 120 }], [{ desde: '2026-09-22 10:00:00', hasta: '2026-09-22 14:00:00', minutos: 240, abierto: true }], 6, 14)

    expect(seg.map(s => s.tipo)).toEqual(['hueco', 'sin_senal', 'lectura', 'lectura']) // la lectura de las 22:30 queda fuera del eje
    expect(seg[0]).toMatchObject({ inicio: 12.5, fin: 37.5, etiqueta: '07:00–09:00 · 120 min' })
    expect(seg[1]).toMatchObject({ inicio: 50, fin: 100, abierto: true })
    expect(seg[3]).toMatchObject({ anomalia: true, lejos: true, contrato: 11 })
  })

  it('arma un eje que cubre la jornada y la actividad real con una hora de margen', () => {
    expect(ejeHoras({ inicio: '06:00', fin: '14:00' }, [])).toEqual({ desde: 5, hasta: 15 })
    expect(ejeHoras({ inicio: '06:00', fin: '14:00' }, ['2026-09-22 04:30:00', '2026-09-22 16:20:00'])).toEqual({ desde: 3, hasta: 17 })
    expect(ejeHoras({ inicio: '06:00', fin: '14:00' }, ['2026-09-22 23:59:00'])).toEqual({ desde: 5, hasta: 24 })
  })
})

describe('useJornada', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('carga la jornada y detecta recibos atorados y días sin actividad', async () => {
    api.obtenerJornada.mockResolvedValueOnce({
      lecturista: { id: 505, nombre: 'X' },
      dia: '2026-09-15',
      es_hoy: false,
      estado: 'terminado',
      avisos: ['atoradas'],
      jornada: { primera_lectura: '2026-09-15 07:13:34', ultima_lectura: '2026-09-15 10:20:18', lecturas: 306, huecos: [] },
      dispositivo: { sin_rastreo: false, tramos_sin_senal: [], primer_rastreo: '2026-09-15 07:00:00', ultimo_rastreo: '2026-09-15 15:00:00' },
      lecturas,
      promedio: null,
      parametros: { jornada: { inicio: '06:00', fin: '14:00' } },
    })

    const j = useJornada()

    await j.cargar(505, '2026-09-15')
    expect(api.obtenerJornada).toHaveBeenCalledWith(505, '2026-09-15', expect.anything())
    expect(j.atorado.value).toBe(true)
    expect(j.sinActividad.value).toBe(false)
    expect(j.eje.value).toEqual({ desde: 5, hasta: 15 }) // jornada 06–14 con margen; el rastreo de las 15:00 no estira el eje
    expect(j.segmentos.value.filter(s => s.tipo === 'lectura')).toHaveLength(2) // la de las 22:30 queda fuera del eje

    api.obtenerJornada.mockResolvedValueOnce({ lecturista: { id: 9 }, dia: '2026-09-15', es_hoy: false, estado: 'fuera_de_jornada', avisos: [], jornada: null, dispositivo: { sin_rastreo: true, tramos_sin_senal: [] }, lecturas: [], promedio: null, parametros: { jornada: { inicio: '06:00', fin: '14:00' } } })
    await j.cargar(9, '2026-09-15')
    expect(j.sinActividad.value).toBe(true)
  })

  it('marca el 404 como no visible y limpia los datos', async () => {
    api.obtenerJornada.mockRejectedValueOnce({ status: 404, body: { message: 'no' } })

    const j = useJornada()

    await j.cargar(1, null)
    expect(j.noVisible.value).toBe(true)
    expect(j.datos.value).toBeNull()
  })
})
