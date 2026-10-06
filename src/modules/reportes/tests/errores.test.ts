import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TiempoAgotadoError, claveMensaje, normalizarError } from '../services/errores'
import { senalConTiempoLimite } from '../utils/senales'

function errorHttp(status: number, body: unknown = null): Error {
  const error = new Error(`HTTP error! status: ${status}`) as Error & { status?: number; body?: unknown }

  error.status = status
  error.body = body

  return error
}

describe('normalizarError', () => {
  it('mapea los códigos HTTP a códigos estables', () => {
    expect(normalizarError(errorHttp(401)).codigo).toBe('SESION')
    expect(normalizarError(errorHttp(403)).codigo).toBe('SIN_PERMISO')
    expect(normalizarError(errorHttp(404)).codigo).toBe('NO_ENCONTRADO')
    expect(normalizarError(errorHttp(429)).codigo).toBe('LIMITE')
    expect(normalizarError(errorHttp(500)).codigo).toBe('SERVIDOR')
  })

  it('tiempo agotado es reintentable, sin permiso no', () => {
    expect(normalizarError(errorHttp(504))).toMatchObject({ codigo: 'TIEMPO_AGOTADO', reintentable: true })
    expect(normalizarError(new TiempoAgotadoError())).toMatchObject({ codigo: 'TIEMPO_AGOTADO', reintentable: true })
    expect(normalizarError(errorHttp(403)).reintentable).toBe(false)
  })

  it('422 expone el primer mensaje por filtro', () => {
    const error = normalizarError(errorHttp(422, { message: 'Datos inválidos', errors: { periodo: ['El periodo es obligatorio.', 'otro'], gerencia: 'No existe' } }))

    expect(error.codigo).toBe('VALIDACION')
    expect(error.campos).toEqual({ periodo: 'El periodo es obligatorio.', gerencia: 'No existe' })
    expect(error.mensaje).toBe('Datos inválidos')
  })

  it('usa la forma estándar del API cuando viene ({codigo, mensaje, detalle, reintentable})', () => {
    const error = normalizarError(errorHttp(500, { codigo: 'SQL', mensaje: 'La fuente falló', detalle: 'Unknown column X', reintentable: false }))

    expect(error).toMatchObject({ codigo: 'SQL', mensaje: 'La fuente falló', detalle: 'Unknown column X', reintentable: false })
  })

  it('distingue cancelación, red caída y tiempo agotado', () => {
    expect(normalizarError(new DOMException('cancelado', 'AbortError')).codigo).toBe('CANCELADO')
    expect(normalizarError(new TypeError('Failed to fetch')).codigo).toBe('SIN_CONEXION')
    expect(normalizarError(new TiempoAgotadoError()).codigo).toBe('TIEMPO_AGOTADO')
    expect(normalizarError(undefined).codigo).toBe('GENERICO')
  })

  it('la clave de i18n sale del código', () => {
    expect(claveMensaje(normalizarError(errorHttp(403)))).toBe('reportes.errores.SIN_PERMISO')
  })
})

describe('senalConTiempoLimite', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('aborta con TiempoAgotadoError al vencer el plazo', () => {
    const { signal } = senalConTiempoLimite(1000)

    expect(signal.aborted).toBe(false)
    vi.advanceTimersByTime(1000)
    expect(signal.aborted).toBe(true)
    expect(signal.reason).toBeInstanceOf(TiempoAgotadoError)
  })

  it('propaga la cancelación externa y no vence después', () => {
    const externa = new AbortController()
    const { signal } = senalConTiempoLimite(1000, externa.signal)

    externa.abort()
    expect(signal.aborted).toBe(true)
    expect(signal.reason).not.toBeInstanceOf(TiempoAgotadoError)
  })

  it('limpiar cancela el temporizador', () => {
    const { signal, limpiar } = senalConTiempoLimite(1000)

    limpiar()
    vi.advanceTimersByTime(5000)
    expect(signal.aborted).toBe(false)
  })
})
