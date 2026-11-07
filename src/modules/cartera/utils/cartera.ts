import type { EstadoNotificacion, EstadoTicket, FiltrosBusqueda, FiltrosNotificaciones, ItemCatalogo } from '../types/cartera'

/*
 * Reglas puras del módulo de cartera: cuerpo de la búsqueda, cascada de catálogos, colores y descarga.
 */

export function filtrosBusquedaIniciales(): FiltrosBusqueda {
  return {
    gerencias: [],
    sistemas: [],
    sectores: [],
    colonias: [],
    tipos_contrato: [],
    giros: [],
    estatus: [],
    meses_desde: 3,
    meses_hasta: null,
    importe_desde: null,
    importe_hasta: null,
    ultimo_pago_dias: null,
    ultimo_pago_importe_max: null,
    nunca_ha_pagado: 'incluir',
    convenio: 'excluir_al_corriente',
  }
}

/** Solo lo que tiene valor; «incluir a quien nunca ha pagado» y «excluir convenios al corriente» son lo normal y no se mandan. */
export function cuerpoBusqueda(f: FiltrosBusqueda): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [clave, valor] of Object.entries(f)) {
    if (Array.isArray(valor) ? valor.length > 0 : valor !== null && valor !== '' && valor !== undefined)
      out[clave] = valor
  }
  if (out.nunca_ha_pagado === 'incluir')
    delete out.nunca_ha_pagado
  if (out.convenio === 'excluir_al_corriente')
    delete out.convenio

  return out
}

/** Cuántos filtros cambió el usuario respecto de los iniciales (para el contador de la barra). */
export function filtrosActivos(f: FiltrosBusqueda): number {
  const base = cuerpoBusqueda(filtrosBusquedaIniciales())
  const actual = cuerpoBusqueda(f)
  const claves = new Set([...Object.keys(base), ...Object.keys(actual)])

  return [...claves].filter(k => JSON.stringify(base[k]) !== JSON.stringify(actual[k])).length
}

/** Hijos de los padres elegidos (gerencia → sistema → sector); sin padres elegidos, todos. */
export function hijosDe(items: ItemCatalogo[], padres: number[]): ItemCatalogo[] {
  return padres.length ? items.filter(i => i.padre !== null && padres.includes(i.padre)) : items
}

/** Quita de la selección lo que ya no está entre las opciones (al cambiar el padre). */
export function recortar(seleccion: number[], opciones: ItemCatalogo[]): number[] {
  const validos = new Set(opciones.map(o => o.id))

  return seleccion.filter(id => validos.has(id))
}

export function parametrosNotificaciones(f: FiltrosNotificaciones, pagina: number, porPagina: number): Record<string, string | number> {
  const p: Record<string, string | number> = { pagina, por_pagina: porPagina }
  for (const clave of ['estado', 'lote', 'notificador', 'origen', 'desde', 'hasta'] as const) {
    const v = f[clave]
    if (v)
      p[clave] = v
  }
  if (f.cuenta.trim())
    p.cuenta = f.cuenta.trim()

  return p
}

export function filtrosNotificacionesIniciales(): FiltrosNotificaciones {
  return { estado: null, lote: null, notificador: null, cuenta: '', origen: null, desde: null, hasta: null }
}

/** Token de color del chip de estado de una notificación. */
export const COLOR_NOTIFICACION: Record<EstadoNotificacion, string> = {
  en_proceso: 'warning',
  recibida: 'success',
  firmada: 'success',
  no_entregada: 'error',
  usuario_no_localizado: 'error',
  toma_no_localizada: 'error',
  duplicidad: 'secondary',
  rechazada: 'error',
  cancelada: 'secondary',
  vencida: 'secondary',
  sin_estado: 'secondary',
}

export const COLOR_TICKET: Record<EstadoTicket, string> = { creado: 'success', pendiente: 'warning', fallido: 'error' }

/** La notificación se puede capturar o cancelar desde aquí (sigue en proceso y no es del módulo viejo en uso). */
export function esCapturable(n: { estado_codigo: EstadoNotificacion | null; se_captura_aqui: boolean }): boolean {
  return n.se_captura_aqui && n.estado_codigo === 'en_proceso'
}

/** Descarga un archivo recibido de la API. */
export function descargarArchivo(blob: Blob, nombre: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')

  a.href = url
  a.download = nombre
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
