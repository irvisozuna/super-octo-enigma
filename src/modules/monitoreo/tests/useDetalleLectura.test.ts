import { beforeEach, describe, expect, it, vi } from 'vitest'

import { normalizarHistorial, useDetalleLectura } from '../composables/useDetalleLectura'

const api = vi.hoisted(() => ({
  obtenerDetalleLectura: vi.fn(),
  obtenerHistorialContrato: vi.fn(),
}))

const reportes = vi.hoisted(() => ({ generarDocumento: vi.fn() }))

vi.mock('../services/monitoreoApi', () => api)
vi.mock('@/modules/reportes/services/reportesApi', () => reportes)

const detalle = {
  contrato: { id: 88463, cuenta: '10702033', nombre: 'MARIA', coordenada: { lat: '23.05', lng: '-109.70', valida: true, corregida: false } },
  periodo: { id: 185, nombre: 'SEPTIEMBRE 2026', abierto: false },
  lectura: { id: 1, origen: 'campo', consumo: 0, variacion_pct: -100, gps: { lat: 23.058, lng: -109.705 } },
  otras_lecturas: [],
  permisos: { duplicado: true },
}

describe('normalizarHistorial', () => {
  it('traduce los nombres de Dolibarr, convierte números y ordena del periodo más reciente al más viejo', () => {
    const filas = normalizarHistorial([
      { Periodo: 'AGOSTO 2026 ', Fecha: '2026-08-15 10:00:00', Anomalia: 'LECTURA REAL', Lecturista: 'X', Anterior: '900', Actual: '905', Consumo: '5', periodoDeFacturacionID: '184' },
      { Periodo: 'SEPTIEMBRE 2026', Fecha: null, Anomalia: 'MEDIDOR DESTRUIDO', Lecturista: null, Anterior: 905, Actual: 909, Consumo: 4, periodoDeFacturacionID: 185 },
    ])

    expect(filas.map(f => f.periodoId)).toEqual([185, 184])
    expect(filas[1]).toEqual({ periodoId: 184, periodo: 'AGOSTO 2026', fecha: '2026-08-15 10:00:00', anomalia: null, lecturista: 'X', anterior: 900, actual: 905, consumo: 5 })
    expect(filas[0].anomalia).toBe('MEDIDOR DESTRUIDO')
  })
})

describe('useDetalleLectura', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.obtenerDetalleLectura.mockResolvedValue(detalle)
    api.obtenerHistorialContrato.mockResolvedValue({ data: [{ Periodo: 'SEPTIEMBRE 2026', Fecha: null, Anomalia: null, Lecturista: null, Anterior: 905, Actual: 909, Consumo: 4, periodoDeFacturacionID: 185 }, { Periodo: 'AGOSTO 2026', Fecha: null, Anomalia: null, Lecturista: null, Anterior: 900, Actual: 905, Consumo: 5, periodoDeFacturacionID: 184 }], pagination: { total: 2 } })
  })

  it('carga el detalle y el historial del contrato en paralelo y arma la serie de consumo', async () => {
    const d = useDetalleLectura()

    await d.cargar(88463, 185)

    expect(api.obtenerDetalleLectura).toHaveBeenCalledWith(88463, 185, expect.anything())
    expect(api.obtenerHistorialContrato).toHaveBeenCalledWith(88463, 12, expect.anything())
    expect(d.contrato.value?.cuenta).toBe('10702033')
    expect(d.historial.value).toHaveLength(2)
    expect(d.serieConsumo.value.map(s => s.consumo)).toEqual([5, 4]) // del más viejo al más reciente
    expect(d.error.value).toBeNull()
  })

  it('marca como no visible un 404 y mantiene el historial independiente', async () => {
    api.obtenerDetalleLectura.mockRejectedValueOnce({ status: 404, body: { message: 'no' } })

    const d = useDetalleLectura()

    await d.cargar(1, null)

    expect(d.noVisible.value).toBe(true)
    expect(d.detalle.value).toBeNull()
    expect(d.historial.value).toHaveLength(2)
  })

  it('genera el duplicado y lo abre en una pestaña nueva; si la bloquean, deja la URL', async () => {
    reportes.generarDocumento.mockResolvedValue({ pdf_base64: btoa('%PDF-1.4'), mime: 'application/pdf', nombre_archivo: 'x.pdf' })

    const open = vi.spyOn(window, 'open').mockReturnValue({} as Window)

    // jsdom no implementa createObjectURL
    const crearOriginal = URL.createObjectURL

    URL.createObjectURL = vi.fn(() => 'blob:x')

    const d = useDetalleLectura()

    await d.cargar(88463, 185)
    expect(await d.abrirDuplicado()).toBe(true)
    expect(reportes.generarDocumento).toHaveBeenCalledWith('duplicado_recibo', { contrato: '10702033', periodo: 185 })
    expect(open).toHaveBeenCalledWith('blob:x', '_blank')

    open.mockReturnValue(null)
    expect(await d.abrirDuplicado()).toBe(false)
    expect(d.duplicadoBloqueado.value).toBe('blob:x')

    open.mockRestore()
    URL.createObjectURL = crearOriginal
  })
})
