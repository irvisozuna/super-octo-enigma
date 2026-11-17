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

  const id = typeof payload.id === 'number' && Number.isInteger(payload.id) && payload.id >= 0 ? payload.id : undefined
  const herramienta = typeof payload.toolName === 'string' ? payload.toolName : undefined

  if (type === 'conversation' && typeof payload.id === 'string')
    return { type, payload: { id: payload.id, ...(payload.nivel === 'analisis' || payload.nivel === 'rapido' ? { nivel: payload.nivel } : {}) } }
  if (type === 'text-delta' && typeof payload.text === 'string')
    return { type, payload: { text: payload.text } }
  if (type === 'tool-call' && herramienta)
    return { type, payload: { toolName: herramienta, ...(id !== undefined ? { id } : {}), ...(typeof payload.detalle === 'string' ? { detalle: payload.detalle } : {}) } }
  if (type === 'tool-start' && herramienta && id !== undefined)
    return { type, payload: { id, toolName: herramienta } }
  if (type === 'tool-result' && herramienta && id !== undefined && typeof payload.ok === 'boolean')
    return { type, payload: { id, toolName: herramienta, ok: payload.ok } }
  if (type === 'tool-progress' && herramienta && id !== undefined && typeof payload.secciones === 'number')
    return { type, payload: { id, toolName: herramienta, secciones: payload.secciones, ...(payload.tipo === 'presentacion' || payload.tipo === 'informe' ? { tipo: payload.tipo } : {}) } }
  if (type === 'thinking')
    return { type, payload: {} }
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
