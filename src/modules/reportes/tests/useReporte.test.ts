import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import { useReporte } from '../composables/useReporte'
import type { ReporteConfig, ResultadoConsulta } from '../types/reporte'

vi.mock('../services/reportesApi', () => ({
  obtenerReporte: vi.fn(),
  ejecutarReporte: vi.fn(),
  obtenerEjecucion: vi.fn(),
}))

const { ejecutarReporte, obtenerEjecucion, obtenerReporte } = await import('../services/reportesApi')

const config: ReporteConfig = {
  key: 'cifras',
  titulo: 'Cifras',
  descripcion: null,
  categoria: null,
  columnas: [{ columna: 'TOTAL', etiqueta: 'Total', tipo: 'decimal', formato: 'moneda', alineacion: 'end', visible: true, total: true }],
  filtros: [],
  orden_default: [{ columna: 'TOTAL', dir: 'desc' }],
  formatos: ['xlsx'],
  por_pagina_default: 25,
  por_pagina_max: 500,
  permisos: { puede_exportar: true, puede_editar: false },
  version: 1,
}

function resultado(parcial: Partial<ResultadoConsulta> = {}): ResultadoConsulta {
  return {
    consulta_id: 'c1',
    filas: [{ TOTAL: 1 }],
    total_filas: 1,
    totales: { TOTAL: '1.00' },
    pagina: 1,
    por_pagina: 25,
    cached_at: '2026-10-06T12:00:00Z',
    expires_at: null,
    cache_hit: false,
    duracion_ms: 12,
    ...parcial,
  }
}

function errorHttp(status: number, body: unknown = null) {
  const error = new Error(`HTTP ${status}`) as Error & { status?: number; body?: unknown }

  error.status = status
  error.body = body

  return error
}

function crear() {
  const scope = effectScope()
  const reporte = scope.run(() => useReporte('cifras'))!

  return { reporte, scope }
}

describe('useReporte', () => {
  beforeEach(() => {
    vi.mocked(obtenerReporte).mockReset().mockResolvedValue(config)
    vi.mocked(ejecutarReporte).mockReset().mockResolvedValue(resultado())
    vi.mocked(obtenerEjecucion).mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('carga la configuración y toma de ella la página y el orden iniciales', async () => {
    const { reporte, scope } = crear()

    await reporte.cargarConfig()
    expect(reporte.config.value?.key).toBe('cifras')
    expect(reporte.porPagina.value).toBe(25)
    expect(reporte.orden.value).toEqual([{ columna: 'TOTAL', dir: 'desc' }])
    scope.stop()
  })

  it('consultar manda los filtros, regresa a la página 1 y guarda el resultado', async () => {
    const { reporte, scope } = crear()

    await reporte.cargarConfig()
    await reporte.irAPagina(3)
    await reporte.consultar({ periodo: 185 })

    expect(reporte.pagina.value).toBe(1)
    expect(reporte.filas.value).toEqual([{ TOTAL: 1 }])
    expect(reporte.totales.value).toEqual({ TOTAL: '1.00' })
    expect(reporte.actualizadoEn.value).toBe('2026-10-06T12:00:00Z')
    expect(vi.mocked(ejecutarReporte)).toHaveBeenLastCalledWith('cifras', expect.objectContaining({ filtros: { periodo: 185 }, pagina: 1, por_pagina: 25, orden: [{ columna: 'TOTAL', dir: 'desc' }] }), expect.anything())
    scope.stop()
  })

  it('ordenar y cambiar filas por página regresan a la página 1; paginar no', async () => {
    const { reporte, scope } = crear()

    await reporte.consultar({ periodo: 185 })
    await reporte.irAPagina(4)
    expect(reporte.pagina.value).toBe(4)
    await reporte.ordenar([{ columna: 'TOTAL', dir: 'asc' }])
    expect(reporte.pagina.value).toBe(1)
    await reporte.irAPagina(2)
    await reporte.cambiarPorPagina(100)
    expect(reporte.pagina.value).toBe(1)
    expect(reporte.porPagina.value).toBe(100)
    scope.stop()
  })

  it('una consulta nueva cancela la anterior', async () => {
    const { reporte, scope } = crear()
    const senales: AbortSignal[] = []

    vi.mocked(ejecutarReporte).mockImplementation((_clave, _params, opciones) => {
      senales.push(opciones!.signal!)

      return new Promise(resolve => setTimeout(() => resolve(resultado()), 50))
    })

    const primera = reporte.consultar({ periodo: 184 })
    const segunda = reporte.consultar({ periodo: 185 })

    await Promise.all([primera, segunda])
    expect(senales[0].aborted).toBe(true)
    expect(senales[1].aborted).toBe(false)
    expect(reporte.error.value).toBeNull()
    scope.stop()
  })

  it('traduce los errores del API', async () => {
    const { reporte, scope } = crear()

    vi.mocked(ejecutarReporte).mockRejectedValue(errorHttp(403))
    await reporte.consultar({ periodo: 185 })
    expect(reporte.error.value?.codigo).toBe('SIN_PERMISO')

    vi.mocked(ejecutarReporte).mockRejectedValue(errorHttp(422, { codigo: 'VALIDACION', mensaje: 'Revisa', reintentable: false, errors: { periodo: 'obligatorio' } }))
    await reporte.consultar({})
    expect(reporte.error.value?.codigo).toBe('VALIDACION')
    expect(reporte.error.value?.campos).toEqual({ periodo: 'obligatorio' })
    scope.stop()
  })

  it('con 202 espera la ejecución en segundo plano y vuelve a pedir la página', async () => {
    vi.useFakeTimers()

    const { reporte, scope } = crear()

    vi.mocked(ejecutarReporte)
      .mockResolvedValueOnce({ ejecucion_id: 'e1' })
      .mockResolvedValueOnce(resultado({ cache_hit: true, total_filas: 28 }))
    vi.mocked(obtenerEjecucion)
      .mockResolvedValueOnce({ estado: 'running' } as never)
      .mockResolvedValueOnce({ estado: 'done' } as never)

    const consulta = reporte.consultar({ periodo: 183 })

    await flushPromises()
    expect(reporte.enSegundoPlano.value).toBe(true)

    await vi.advanceTimersByTimeAsync(2_000)
    await flushPromises()
    expect(vi.mocked(obtenerEjecucion)).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(3_000)
    await flushPromises()
    await consulta

    expect(vi.mocked(obtenerEjecucion)).toHaveBeenCalledTimes(2)
    expect(vi.mocked(ejecutarReporte)).toHaveBeenCalledTimes(2)
    expect(reporte.enSegundoPlano.value).toBe(false)
    expect(reporte.totalFilas.value).toBe(28)
    expect(reporte.desdeCache.value).toBe(true)
    scope.stop()
  })
})
