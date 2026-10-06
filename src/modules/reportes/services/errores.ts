import type { ErrorApi } from '../types/api'

/*
 * Cualquier fallo (HTTP, red, cancelación, tiempo agotado) se convierte en un ErrorReporte
 * con un código estable; las pantallas traducen el código con `reportes.errores.<codigo>`.
 */

export type CodigoError =
  | 'SIN_PERMISO'
  | 'SESION'
  | 'NO_ENCONTRADO'
  | 'TIEMPO_AGOTADO'
  | 'SIN_CONEXION'
  | 'VALIDACION'
  | 'LIMITE'
  | 'SERVIDOR'
  | 'SQL'
  | 'CANCELADO'
  | 'GENERICO'

export interface ErrorReporte {
  codigo: CodigoError

  /** Mensaje que mandó el servidor, si lo hubo. */
  mensaje: string
  detalle?: string
  reintentable: boolean
  status?: number

  /** Errores de validación por filtro (422). */
  campos?: Record<string, string>
}

/** Razón con la que se aborta una petición cuando vence el tiempo límite del cliente. */
export class TiempoAgotadoError extends Error {
  constructor(message = 'La petición excedió el tiempo límite') {
    super(message)
    this.name = 'TiempoAgotadoError'
  }
}

interface ErrorHttp extends Error {
  status?: number
  body?: unknown
  errors?: unknown
}

interface CuerpoError extends Partial<ErrorApi> {
  message?: string
  errors?: Record<string, string[] | string>
}

// Por nombre y no con instanceof: DOMException (AbortError) no siempre hereda de Error (jsdom, otros realms)
function nombreError(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null)
    return undefined

  const nombre = (error as { name?: unknown }).name

  return typeof nombre === 'string' ? nombre : undefined
}

export function esCancelacion(error: unknown): boolean {
  return nombreError(error) === 'AbortError'
}

export function esTiempoAgotado(error: unknown): boolean {
  return error instanceof TiempoAgotadoError || ['TimeoutError', 'TiempoAgotadoError'].includes(nombreError(error) ?? '')
}

function camposDeValidacion(errors: CuerpoError['errors']): Record<string, string> | undefined {
  if (!errors || typeof errors !== 'object')
    return undefined

  const campos: Record<string, string> = {}

  Object.entries(errors).forEach(([campo, mensajes]) => {
    const primero = Array.isArray(mensajes) ? mensajes[0] : mensajes
    if (typeof primero === 'string')
      campos[campo] = primero
  })

  return Object.keys(campos).length ? campos : undefined
}

const CODIGO_POR_STATUS: Record<number, { codigo: CodigoError; reintentable: boolean }> = {
  401: { codigo: 'SESION', reintentable: false },
  403: { codigo: 'SIN_PERMISO', reintentable: false },
  404: { codigo: 'NO_ENCONTRADO', reintentable: false },
  408: { codigo: 'TIEMPO_AGOTADO', reintentable: true },
  429: { codigo: 'LIMITE', reintentable: true },
  504: { codigo: 'TIEMPO_AGOTADO', reintentable: true },
}

export function normalizarError(error: unknown): ErrorReporte {
  if (esTiempoAgotado(error))
    return { codigo: 'TIEMPO_AGOTADO', mensaje: '', reintentable: true }

  if (esCancelacion(error))
    return { codigo: 'CANCELADO', mensaje: '', reintentable: false }

  // fetch rechaza con TypeError cuando no hay red o el servidor no responde
  if (error instanceof TypeError)
    return { codigo: 'SIN_CONEXION', mensaje: '', reintentable: true }

  const e = (error ?? {}) as ErrorHttp
  const status = e.status
  const cuerpo = (typeof e.body === 'object' && e.body !== null ? e.body : {}) as CuerpoError
  const mensaje = cuerpo.mensaje ?? cuerpo.message ?? (status ? '' : e.message ?? '')
  const detalle = cuerpo.detalle

  if (cuerpo.codigo === 'SQL')
    return { codigo: 'SQL', mensaje, detalle, reintentable: false, status }

  if (status === 422)
    return { codigo: 'VALIDACION', mensaje, reintentable: false, status, campos: camposDeValidacion(cuerpo.errors) }

  const porStatus = status ? CODIGO_POR_STATUS[status] : undefined
  if (porStatus)
    return { codigo: porStatus.codigo, mensaje, detalle, reintentable: porStatus.reintentable, status }

  if (status && status >= 500)
    return { codigo: 'SERVIDOR', mensaje, detalle, reintentable: cuerpo.reintentable ?? true, status }

  return { codigo: 'GENERICO', mensaje, detalle, reintentable: cuerpo.reintentable ?? true, status }
}

export function claveMensaje(error: ErrorReporte): string {
  return `reportes.errores.${error.codigo}`
}
