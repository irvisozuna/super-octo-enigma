import type { ConversacionDetalle, ConversacionResumen, DocumentoAsistente, EstadoAsistente, EventoChat, NivelRespuesta } from '../types'
import { crearLectorSse } from '../utils/sse'
import { rawApi } from '@/services/api'
import { sesionVencida } from '@/utils/sesion'

/*
 * Una función por endpoint de /api/asistente. El chat no pasa por rawApi porque la respuesta llega en vivo (SSE) y
 * se lee con fetch y ReadableStream; lleva las mismas cabeceras (Authorization y X-Organization).
 */

const BASE = '/asistente'

export interface SolicitudPregunta {
  mensaje: string
  conversacion_id?: string
  nivel?: NivelRespuesta
  contexto?: { tipo: 'reporte'; clave: string; filtros: Record<string, unknown> }
}

/** Error del chat antes de empezar a transmitir (permiso, cupo, tope, agente caído). */
export class ErrorChat extends Error {
  constructor(message: string, public readonly status: number, public readonly codigo?: string) {
    super(message)
    this.name = 'ErrorChat'
  }
}

export async function preguntar(solicitud: SolicitudPregunta, alEvento: (evento: EventoChat) => void, signal?: AbortSignal): Promise<void> {
  const token = useCookie('accessToken').value

  const respuesta = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? ''}${BASE}/chat`, {
    method: 'POST',
    signal,
    headers: {
      'Accept': 'text/event-stream',
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}`, 'X-Organization': `${import.meta.env.VITE_API_ORGANIZATION}` } : {}),
    },
    body: JSON.stringify(solicitud),
  })

  if (!respuesta.ok || !respuesta.body) {
    if (respuesta.status === 401 && token)
      void sesionVencida(`${BASE}/chat`)
    let cuerpo: { message?: string; code?: string } = {}
    try {
      cuerpo = await respuesta.json()
    }
    catch {}
    throw new ErrorChat(cuerpo.message || 'El asistente no está disponible en este momento.', respuesta.status, cuerpo.code)
  }

  const lector = respuesta.body.getReader()
  const decodificador = new TextDecoder()
  const sse = crearLectorSse()
  for (;;) {
    const { done, value } = await lector.read()
    if (done)
      break
    sse.leer(decodificador.decode(value, { stream: true })).forEach(alEvento)
  }
  sse.leer(decodificador.decode())
  sse.cerrar().forEach(alEvento)
}

export function obtenerEstado(): Promise<EstadoAsistente> {
  return rawApi(`${BASE}/estado`)
}

export async function listarConversaciones(): Promise<ConversacionResumen[]> {
  return (await rawApi(`${BASE}/conversaciones`) as { conversaciones: ConversacionResumen[] }).conversaciones
}

export function obtenerConversacion(id: string): Promise<ConversacionDetalle> {
  return rawApi(`${BASE}/conversaciones/${encodeURIComponent(id)}`)
}

export function renombrarConversacion(id: string, titulo: string): Promise<{ ok: boolean }> {
  return rawApi(`${BASE}/conversaciones/${encodeURIComponent(id)}`, { method: 'PATCH', body: { titulo } })
}

export function borrarConversacion(id: string): Promise<{ ok: boolean }> {
  return rawApi(`${BASE}/conversaciones/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

/** Datos de un informe o presentación del asistente para su tarjeta (XEL1-712). */
export function obtenerDocumento(id: string): Promise<DocumentoAsistente> {
  return rawApi(`${BASE}/documentos/${encodeURIComponent(id)}`)
}

/** HTML del documento, armado por Atención con su plantilla (sin scripts). */
export function htmlDocumento(id: string): Promise<string> {
  return rawApi(`${BASE}/documentos/${encodeURIComponent(id)}/html`, { headers: { Accept: 'text/html' }, responseType: 'text' })
}
