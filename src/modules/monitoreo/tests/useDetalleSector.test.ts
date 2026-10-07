import { beforeEach, describe, expect, it, vi } from 'vitest'

import { nombreArchivo, serieHoraria, useDetalleSector } from '../composables/useDetalleSector'

const api = vi.hoisted(() => ({
  obtenerDetalleSector: vi.fn(),
  descargarPendientesSector: vi.fn(),
}))

vi.mock('../services/monitoreoApi', () => api)

const detalle = {
  sector: { id: 221, nombre: 'EL ZACATAL FUND - 1', codigo: null, sistema: 'X', gerencia_id: 2, gerencia: 'SJC', activo: true, tiene_contorno: true, centro: null },
  periodo: { id: 186, nombre: 'OCTUBRE 2026', inicio: '2026-10-01', fin: '2026-10-31', abierto: true },
  dia: '2026-10-01',
  avance: { estado: 'iniciado', esperadas: 229, esperadas_medidas: 229, tarifa_fija: 0, leidas: 220, con_anomalia: 3, estimadas: 0, tarifa_fija_leidas: 0, impresas: 100, atendidas: 223, atendidas_total: 223, pendientes: 6, pct_campo: 97.4, pct_total: 97.4, primera_lectura: '2026-10-01 07:01:19', ultima_lectura: '2026-10-01 09:49:45', dias_activo: 1, fecha_programada: null, fecha_limite: null, calculado: null, lecturas_extra: 0 },
  pendientes: [{ contrato_id: 1, cuenta: '1', nombre: null, direccion: null, manzana: null, lote: null, secuencia: 64, clave_loc: null, sin_coordenada: false, estimada: false, ultima_lectura: null }],
  lecturistas: [
    { lecturista_id: 411, nombre: 'SERGIO', asignado: true, lecturas: 224, pct: 100, primera: null, ultima: null, ultima_senal: null },
    { lecturista_id: 9, nombre: 'OTRO', asignado: false, lecturas: 3, pct: 1.3, primera: null, ultima: null, ultima_senal: null },
    { lecturista_id: 10, nombre: 'AUSENTE', asignado: true, lecturas: 0, pct: null, primera: null, ultima: null, ultima_senal: null },
  ],
  linea_tiempo: { dias: [{ fecha: '2026-10-01', lecturas: 224, lecturistas: 1 }], horas_dia: [{ hora: 7, lecturas: 140 }, { hora: 9, lecturas: 4 }], horas_periodo: [] },
}

describe('serieHoraria y nombreArchivo', () => {
  it('rellena las horas sin lecturas con cero dentro de la jornada', () => {
    const serie = serieHoraria([{ hora: 7, lecturas: 140 }, { hora: 9, lecturas: 4 }], 6, 10)

    expect(serie.map(s => s.hora)).toEqual([6, 7, 8, 9, 10])
    expect(serie.map(s => s.lecturas)).toEqual([0, 140, 0, 4, 0])
    expect(serieHoraria([{ hora: 22, lecturas: 1 }], 6, 10).at(-1)).toEqual({ hora: 22, lecturas: 1 })
  })

  it('arma un nombre de archivo seguro', () => {
    expect(nombreArchivo('EL ZACATAL FUND  - 1', 186)).toBe('pendientes_EL_ZACATAL_FUND_-_1_186.xlsx')
    expect(nombreArchivo('///', null)).toBe('pendientes_sector_periodo.xlsx')
  })
})

describe('useDetalleSector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.obtenerDetalleSector.mockResolvedValue(detalle)
  })

  it('carga el detalle y separa a los que leyeron sin asignación y a los asignados sin leer', async () => {
    const d = useDetalleSector()

    await d.cargar(221, { periodo: 186, dia: '2026-10-01' })

    expect(api.obtenerDetalleSector).toHaveBeenCalledWith(221, { periodo: 186, dia: '2026-10-01' }, expect.anything())
    expect(d.avance.value?.pendientes).toBe(6)
    expect(d.leyeronSinAsignar.value.map(l => l.nombre)).toEqual(['OTRO'])
    expect(d.asignadosSinLeer.value.map(l => l.nombre)).toEqual(['AUSENTE'])
    expect(d.soloTarifaFija.value).toBe(false)
  })

  it('detecta un sector de tarifa fija pura y el 404 fuera del alcance', async () => {
    api.obtenerDetalleSector.mockResolvedValueOnce({ ...detalle, avance: { ...detalle.avance, esperadas: 0, esperadas_medidas: 0, tarifa_fija: 11, pendientes: 0 } })

    const d = useDetalleSector()

    await d.cargar(542, {})
    expect(d.soloTarifaFija.value).toBe(true)

    api.obtenerDetalleSector.mockRejectedValueOnce({ status: 404, body: { message: 'no' } })
    await d.cargar(1, {})
    expect(d.noVisible.value).toBe(true)
    expect(d.detalle.value).toBeNull()
  })

  it('descarga el Excel con el token y lo guarda con su nombre', async () => {
    api.descargarPendientesSector.mockResolvedValue(new Blob(['x']))

    const crearOriginal = URL.createObjectURL
    const revocarOriginal = URL.revokeObjectURL

    URL.createObjectURL = vi.fn(() => 'blob:x')
    URL.revokeObjectURL = vi.fn()

    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const d = useDetalleSector()

    await d.cargar(221, { periodo: 186 })
    expect(await d.exportar()).toBe(true)
    expect(api.descargarPendientesSector).toHaveBeenCalledWith(221, { periodo: 186 })
    expect(click).toHaveBeenCalled()

    click.mockRestore()
    URL.createObjectURL = crearOriginal
    URL.revokeObjectURL = revocarOriginal
  })
})
