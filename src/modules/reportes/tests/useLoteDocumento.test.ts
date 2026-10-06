import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import { useLoteDocumento } from '../composables/useLoteDocumento'
import { useExportacionesStore } from '../stores/exportacionesStore'
import type { LoteConfig, LoteConteo } from '../types/documento'
import type { Ejecucion } from '../types/exportacion'

vi.mock('../services/reportesApi', () => ({
  obtenerLoteDocumento: vi.fn(),
  contarLoteDocumento: vi.fn(),
  crearLoteDocumento: vi.fn(),
  crearExportacion: vi.fn(),
  listarEjecuciones: vi.fn(),
  obtenerEjecucion: vi.fn(),
  cancelarEjecucion: vi.fn(),
  descargarEjecucion: vi.fn(),
}))

const { contarLoteDocumento, crearLoteDocumento, obtenerLoteDocumento } = await import('../services/reportesApi')

const config: LoteConfig = {
  documento: { key: 'duplicado_recibo', titulo: 'Duplicado de recibo', descripcion: null },
  titulo: 'Recibos en lote',
  descripcion: null,
  filtros: [],
  maximo: 2000,
}

function conteo(parcial: Partial<LoteConteo> = {}): LoteConteo {
  return { contratos: 50, maximo: 2000, excede: false, filtros: { periodo: 185, gerencia: [5] }, ...parcial }
}

function ejecucion(parcial: Partial<Ejecucion> = {}): Ejecucion {
  return {
    id: 'lote-1',
    kind: 'export',
    object_key: 'duplicado_recibo',
    titulo: null,
    formato: 'pdf',
    estado: 'queued',
    progreso: 0,
    filas: null,
    duracion_ms: null,
    tamano: null,
    mensaje: null,
    nombre_archivo: null,
    url_descarga: null,
    filtros: { periodo: 185, gerencia: [5] },
    alcance: null,
    expires_at: null,
    created_at: '2026-10-06T12:00:00Z',
    finished_at: null,
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
  const lote = scope.run(() => useLoteDocumento('duplicado_recibo'))!

  return { lote, scope }
}

describe('useLoteDocumento', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
    vi.mocked(obtenerLoteDocumento).mockReset().mockResolvedValue(config)
    vi.mocked(contarLoteDocumento).mockReset().mockResolvedValue(conteo())
    vi.mocked(crearLoteDocumento).mockReset().mockResolvedValue({ ejecucion_id: 'lote-1', ejecucion: ejecucion() })
  })

  afterEach(() => {
    useExportacionesStore().detener()
    vi.useRealTimers()
  })

  it('carga la configuración y cuenta con los filtros normalizados por el servidor', async () => {
    const { lote, scope } = crear()

    await lote.cargarConfig()
    expect(lote.config.value?.titulo).toBe('Recibos en lote')
    expect(lote.contado.value).toBe(false)

    await lote.contar({ periodo: 185, gerencia: [5], sector: null })
    expect(contarLoteDocumento).toHaveBeenCalledWith('duplicado_recibo', { periodo: 185, gerencia: [5], sector: null }, expect.anything())
    expect(lote.conteo.value?.contratos).toBe(50)
    expect(lote.filtrosAplicados.value).toEqual({ periodo: 185, gerencia: [5] })
    expect(lote.puedeGenerar.value).toBe(true)

    scope.stop()
  })

  it('no deja generar si no hay contratos o se excede el tope', async () => {
    const { lote, scope } = crear()

    vi.mocked(contarLoteDocumento).mockResolvedValueOnce(conteo({ contratos: 0 }))
    await lote.contar({ periodo: 185, gerencia: [5] })
    expect(lote.puedeGenerar.value).toBe(false)
    expect(await lote.generar()).toBeNull()

    vi.mocked(contarLoteDocumento).mockResolvedValueOnce(conteo({ contratos: 2500, excede: true }))
    await lote.contar({ periodo: 185, gerencia: [5] })
    expect(lote.puedeGenerar.value).toBe(false)
    expect(crearLoteDocumento).not.toHaveBeenCalled()

    scope.stop()
  })

  it('encola el lote con los filtros contados y lo registra en la cola de exportaciones', async () => {
    const { lote, scope } = crear()
    const exportaciones = useExportacionesStore()

    await lote.cargarConfig()
    await lote.contar({ periodo: 185, gerencia: [5] })

    const id = await lote.generar()

    await flushPromises()

    expect(id).toBe('lote-1')
    expect(crearLoteDocumento).toHaveBeenCalledWith('duplicado_recibo', { periodo: 185, gerencia: [5] })
    expect(lote.ultimaEjecucionId.value).toBe('lote-1')
    expect(exportaciones.tareas.map(t => t.id)).toEqual(['lote-1'])
    expect(exportaciones.tareas[0]?.titulo).toBe('Recibos en lote') // toma el título del lote si el servidor no lo manda
    expect(lote.ejecucion.value?.estado).toBe('queued')

    scope.stop()
  })

  it('traduce los errores de conteo y de encolado sin perder los filtros', async () => {
    const { lote, scope } = crear()

    vi.mocked(contarLoteDocumento).mockRejectedValueOnce(errorHttp(403, { codigo: 'SIN_PERMISO', mensaje: 'No tienes permiso.', reintentable: false }))
    await lote.contar({ periodo: 185, gerencia: [5] })
    expect(lote.errorConteo.value?.codigo).toBe('SIN_PERMISO')
    expect(lote.conteo.value).toBeNull()
    expect(lote.filtrosAplicados.value).toEqual({ periodo: 185, gerencia: [5] })

    await lote.contar({ periodo: 185, gerencia: [5] })
    vi.mocked(crearLoteDocumento).mockRejectedValueOnce(errorHttp(422, { codigo: 'DEMASIADAS_FILAS', mensaje: 'El lote tendría 2,500 documentos.', reintentable: false }))
    expect(await lote.generar()).toBeNull()
    expect(lote.errorEncolar.value?.codigo).toBe('DEMASIADAS_FILAS')
    expect(lote.ultimaEjecucionId.value).toBeNull()

    scope.stop()
  })
})
