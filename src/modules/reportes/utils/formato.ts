import type { FormatoColumna } from '../types/reporte'

/*
 * Formato es-MX con Intl (sin dayjs: no está declarado en package.json).
 * Las fechas de la base llegan como 'AAAA-MM-DD' o 'AAAA-MM-DD HH:mm:ss' y se interpretan como hora local,
 * para que un '2026-09-01' no se convierta en 31 de agosto por la zona horaria.
 */

const LOCALE = 'es-MX'

const moneda = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'MXN', minimumFractionDigits: 2, maximumFractionDigits: 2 })
const entero = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 })
const fecha = new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: '2-digit', year: 'numeric' })
const relativo = new Intl.RelativeTimeFormat('es', { numeric: 'always' })

const decimales = new Map<number, Intl.NumberFormat>()

function conDecimales(n: number): Intl.NumberFormat {
  let formato = decimales.get(n)
  if (!formato) {
    formato = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: n, maximumFractionDigits: n })
    decimales.set(n, formato)
  }

  return formato
}

export function esVacio(valor: unknown): boolean {
  return valor === null || valor === undefined || valor === ''
}

export function aNumero(valor: unknown): number | null {
  if (typeof valor === 'number')
    return Number.isFinite(valor) ? valor : null

  if (typeof valor === 'string' && valor.trim() !== '') {
    const n = Number(valor.replace(/,/g, ''))

    return Number.isFinite(n) ? n : null
  }

  return null
}

/** 'AAAA-MM-DD' y 'AAAA-MM-DD HH:mm:ss' se leen como hora local; cualquier otra cadena, con Date. */
export function aFecha(valor: unknown): Date | null {
  if (valor instanceof Date)
    return Number.isNaN(valor.getTime()) ? null : valor

  if (typeof valor !== 'string' || valor.trim() === '')
    return null

  const partes = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(valor.trim())
  if (partes) {
    const [, anio, mes, dia, hora = '0', minuto = '0', segundo = '0'] = partes

    return new Date(Number(anio), Number(mes) - 1, Number(dia), Number(hora), Number(minuto), Number(segundo))
  }

  const parseada = new Date(valor)

  return Number.isNaN(parseada.getTime()) ? null : parseada
}

export function formatearMoneda(valor: unknown): string {
  if (esVacio(valor))
    return ''

  const n = aNumero(valor)

  return n === null ? String(valor) : moneda.format(n)
}

export function formatearNumero(valor: unknown, numDecimales = 2): string {
  if (esVacio(valor))
    return ''

  const n = aNumero(valor)

  return n === null ? String(valor) : conDecimales(numDecimales).format(n)
}

export function formatearEntero(valor: unknown): string {
  if (esVacio(valor))
    return ''

  const n = aNumero(valor)

  return n === null ? String(valor) : entero.format(n)
}

/** El valor ya viene en puntos porcentuales (12.5 → "12.50 %"). */
export function formatearPorcentaje(valor: unknown, numDecimales = 2): string {
  const texto = formatearNumero(valor, numDecimales)

  return texto === '' ? '' : `${texto} %`
}

export function formatearFecha(valor: unknown): string {
  const d = aFecha(valor)

  return d ? fecha.format(d) : esVacio(valor) ? '' : String(valor)
}

export function formatearFechaHora(valor: unknown): string {
  const d = aFecha(valor)
  if (!d)
    return esVacio(valor) ? '' : String(valor)

  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')

  return `${fecha.format(d)} ${hh}:${mm}`
}

export function formatearBooleano(valor: unknown): string {
  if (esVacio(valor))
    return ''

  return valor === true || valor === 1 || valor === '1' || valor === 'true' ? 'Sí' : 'No'
}

function formatearTexto(valor: unknown): string {
  return esVacio(valor) ? '' : String(valor)
}

const FORMATEADORES: Record<FormatoColumna, (valor: unknown) => string> = {
  moneda: formatearMoneda,
  decimal: valor => formatearNumero(valor),
  entero: formatearEntero,
  porcentaje: valor => formatearPorcentaje(valor),
  fecha: formatearFecha,
  fechaHora: formatearFechaHora,
  booleano: formatearBooleano,
  periodo: formatearTexto,
  texto: formatearTexto,
}

export function formatearValor(valor: unknown, formato: FormatoColumna): string {
  return (FORMATEADORES[formato] ?? formatearTexto)(valor)
}

/** "hace 4 minutos", "hace 2 horas", "justo ahora" (menos de 45 s). */
export function tiempoRelativo(valor: unknown, ahora: Date = new Date()): string {
  const d = aFecha(valor)
  if (!d)
    return ''

  const segundos = Math.round((d.getTime() - ahora.getTime()) / 1000)
  const absolutos = Math.abs(segundos)

  if (absolutos < 45)
    return 'justo ahora'

  if (absolutos < 3600)
    return relativo.format(Math.round(segundos / 60), 'minute')

  if (absolutos < 86400)
    return relativo.format(Math.round(segundos / 3600), 'hour')

  return relativo.format(Math.round(segundos / 86400), 'day')
}
