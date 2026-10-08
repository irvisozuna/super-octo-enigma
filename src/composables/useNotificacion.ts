import { useGlobalSnackbarStore } from '@/stores/globalSnackbarStore'
import { normalizarError } from '@/services/errores'

/*
 * Un solo canal de avisos al usuario (éxito, error, aviso, información) sobre el snackbar global.
 * Acepta texto ya traducido o una clave de traducción `{ clave, variables }`. Sustituye a los VSnackbar locales,
 * a los VAlert de éxito y a los `console.error` sin mensaje.
 *
 *   const notificar = useNotificacion()
 *   notificar.exito('Re-lectura solicitada')
 *   notificar.error(e)                         // normaliza el error de la API y muestra su mensaje
 *   notificar.aviso({ clave: 'monitoreo.alertas.silenciada', variables: { horas: 2 } })
 */
export type MensajeNotificacion = string | { clave: string; variables?: Record<string, unknown> }

export type TipoNotificacion = 'success' | 'error' | 'info' | 'warning'

const TITULOS: Record<TipoNotificacion, string> = {
  success: 'common.success',
  error: 'common.error',
  info: 'common.info',
  warning: 'common.warning',
}

export function useNotificacion() {
  const store = useGlobalSnackbarStore()

  function mostrar(tipo: TipoNotificacion, mensaje: MensajeNotificacion, opciones: { titulo?: string; timeout?: number } = {}) {
    const cuerpo = typeof mensaje === 'string'
      ? { messageKey: '', variables: {}, texto: mensaje }
      : { messageKey: mensaje.clave, variables: mensaje.variables ?? {} }

    store.showSnackbar(opciones.titulo ?? TITULOS[tipo], cuerpo, tipo, {
      position: 'top end',
      timeout: opciones.timeout ?? (tipo === 'error' ? 8000 : 5000),
      closable: true,
    })
  }

  /** Error de API o excepción: muestra el mensaje del servidor si lo hay; si no, la clave genérica del código. */
  function error(e: unknown, respaldo?: MensajeNotificacion) {
    if (typeof e === 'string' || (typeof e === 'object' && e !== null && 'clave' in e))
      return mostrar('error', e as MensajeNotificacion)

    const normalizado = normalizarError(e)
    if (normalizado.codigo === 'CANCELADO')
      return

    mostrar('error', normalizado.mensaje ? normalizado.mensaje : respaldo ?? { clave: `reportes.errores.${normalizado.codigo}` })
  }

  return {
    exito: (m: MensajeNotificacion, o?: { titulo?: string; timeout?: number }) => mostrar('success', m, o),
    aviso: (m: MensajeNotificacion, o?: { titulo?: string; timeout?: number }) => mostrar('warning', m, o),
    info: (m: MensajeNotificacion, o?: { titulo?: string; timeout?: number }) => mostrar('info', m, o),
    error,
    cerrar: () => store.closeSnackbar(),
  }
}
