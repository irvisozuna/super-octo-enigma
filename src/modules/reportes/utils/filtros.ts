import type { FiltroDef, Opcion, ValoresFiltros } from '../types/reporte'
import { formatearFecha } from './formato'

export interface Rango {
  desde: unknown
  hasta: unknown
}

export const TIPOS_RANGO = ['period_range', 'date_range'] as const

export function esRango(def: FiltroDef): boolean {
  return (TIPOS_RANGO as readonly string[]).includes(def.tipo)
}

export function estaVacio(valor: unknown): boolean {
  if (valor === null || valor === undefined || valor === '')
    return true

  if (Array.isArray(valor))
    return valor.length === 0

  if (typeof valor === 'object') {
    const rango = valor as Partial<Rango>

    return estaVacio(rango.desde) && estaVacio(rango.hasta)
  }

  return false
}

/** Valor con el que arranca un filtro: su default resuelto por el servidor o el vacío de su tipo. */
export function valorInicial(def: FiltroDef): unknown {
  if (!estaVacio(def.valor_default))
    return def.valor_default

  if (def.tipo === 'multiselect')
    return []

  if (esRango(def))
    return { desde: null, hasta: null }

  return null
}

/** Solo los filtros con valor, en la forma que espera el API. */
export function aPayload(definiciones: FiltroDef[], valores: ValoresFiltros): ValoresFiltros {
  const payload: ValoresFiltros = {}

  for (const def of definiciones) {
    const valor = valores[def.key]
    if (!estaVacio(valor))
      payload[def.key] = valor
  }

  return payload
}

/** Texto legible de un valor (para los chips de filtros activos). */
export function etiquetaValor(def: FiltroDef, valor: unknown, opciones: Opcion[] = []): string {
  if (estaVacio(valor))
    return ''

  const etiquetaDe = (v: unknown) => opciones.find(o => String(o.value) === String(v))?.label ?? String(v)

  if (Array.isArray(valor)) {
    const textos = valor.map(etiquetaDe)
    if (textos.length <= 3)
      return textos.join(', ')

    return `${textos.slice(0, 3).join(', ')} +${textos.length - 3}`
  }

  if (typeof valor === 'object' && valor !== null) {
    const rango = valor as Rango
    const textoDe = (v: unknown) => (def.tipo === 'date_range' ? formatearFecha(v) : etiquetaDe(v))

    return [rango.desde, rango.hasta].map(v => (estaVacio(v) ? '…' : textoDe(v))).join(' – ')
  }

  if (def.tipo === 'boolean')
    return valor === true || valor === 'true' || valor === 1 ? 'Sí' : 'No'

  return etiquetaDe(valor)
}
