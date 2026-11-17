import type { EventoChat } from '../types'

/*
 * Lector del SSE de POST /api/asistente/chat. El servidor ya filtra lo que llega (lista blanca de AgentEvents), pero
 * aquí también se valida cada evento: lo que no tenga la forma esperada se descarta.
 */
export function interpretarBloque(bloque: string): EventoChat | null {
  const datos = bloque
    .split(/\r?\n/)
    .filter(linea => linea.startsWith('data:'))
    .map(linea => linea.slice(5).trim())
    .join('\n')

  if (!datos)
    return null
  if (datos === '[DONE]')
    return { type: 'done' }

  let evento: unknown
  try {
    evento = JSON.parse(datos)
  }
  catch {
    return null
  }
  if (!evento || typeof evento !== 'object' || Array.isArray(evento))
    return null

  const { type, payload } = evento as { type?: unknown; payload?: Record<string, unknown> }
  if (!payload || typeof payload !== 'object')
    return null

  if (type === 'conversation' && typeof payload.id === 'string')
    return { type, payload: { id: payload.id } }
  if (type === 'text-delta' && typeof payload.text === 'string')
    return { type, payload: { text: payload.text } }
  if (type === 'tool-call' && typeof payload.toolName === 'string')
    return { type, payload: { toolName: payload.toolName } }
  if (type === 'truncated' && (payload.motivo === 'longitud' || payload.motivo === 'pasos'))
    return { type, payload: { motivo: payload.motivo } }
  if (type === 'error') {
    const mensaje = (payload.error as { message?: unknown } | undefined)?.message

    return { type, payload: { error: { message: typeof mensaje === 'string' ? mensaje : '' } } }
  }

  return null
}

/** Junta los trozos que llegan de la red y entrega los eventos completos (separados por línea en blanco). */
export function crearLectorSse() {
  let pendiente = ''

  function extraer(final: boolean): EventoChat[] {
    const bloques = pendiente.split(/\r?\n\r?\n/)

    pendiente = final ? '' : (bloques.pop() ?? '')

    return bloques.map(interpretarBloque).filter((e): e is EventoChat => e !== null)
  }

  return {
    leer(trozo: string): EventoChat[] {
      pendiente += trozo

      return extraer(false)
    },
    cerrar(): EventoChat[] {
      return extraer(true)
    },
  }
}
