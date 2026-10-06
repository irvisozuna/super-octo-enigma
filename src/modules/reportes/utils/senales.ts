import { TiempoAgotadoError } from '../services/errores'

export interface SenalConLimite {
  signal: AbortSignal

  /** Cancela el temporizador; llamar siempre al terminar la petición. */
  limpiar: () => void
}

/**
 * Señal que se aborta al vencer `ms` (con TiempoAgotadoError) o cuando se aborta la señal externa.
 * Implementación propia para no depender de AbortSignal.any / AbortSignal.timeout.
 */
export function senalConTiempoLimite(ms: number, externa?: AbortSignal): SenalConLimite {
  const controlador = new AbortController()

  const temporizador = setTimeout(() => controlador.abort(new TiempoAgotadoError()), ms)

  const propagar = () => {
    clearTimeout(temporizador)
    controlador.abort(externa?.reason)
  }

  if (externa?.aborted)
    propagar()
  else
    externa?.addEventListener('abort', propagar, { once: true })

  return {
    signal: controlador.signal,
    limpiar: () => {
      clearTimeout(temporizador)
      externa?.removeEventListener('abort', propagar)
    },
  }
}
