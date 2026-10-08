/*
 * Formato único de números, moneda, fechas y horas de Atención (Aquasoft Design System 1.0).
 *
 * Una sola convención para toda la aplicación:
 *  - Locale es-MX: miles con coma, decimales con punto, moneda MXN con dos decimales.
 *  - Hora local de OOMSAPAS (America/Mazatlan, sin horario de verano desde 2022). Las fechas que llegan del servidor sin
 *    zona ("2026-10-07 09:33:00" o "2026-10-07") se interpretan como hora local de OOMSAPAS, y todo se muestra en esa
 *    zona, sin importar dónde esté el navegador.
 *  - Valor ausente → "—" (guion largo), salvo que se pida otra cosa.
 *
 * Los módulos de Reportes (`modules/reportes/utils/formato.ts`) y Monitoreo (`modules/monitoreo/utils/tiempo.ts`)
 * re-exportan desde aquí con sus nombres históricos. vue-i18n usa las mismas opciones (`NUMBER_FORMATS`,
 * `DATETIME_FORMATS`), así que `n()` y `d()` dan el mismo resultado que estas funciones.
 */

export const LOCALE = 'es-MX'
export const ZONA_HORARIA = 'America/Mazatlan'

/** Desfase fijo de OOMSAPAS (America/Mazatlan no cambia de horario desde 2022). */
export const DESFASE_LOCAL = '-07:00'

export const VACIO = '—'

export type FormatoValor = 'texto' | 'entero' | 'decimal' | 'moneda' | 'porcentaje' | 'fecha' | 'fechaHora' | 'hora' | 'booleano' | 'periodo'

export interface OpcionesFormato {

  /** Texto para valores ausentes (por defecto «—»). */
  vacio?: string
}

// ---------------------------------------------------------------------------------------------------------------------
// Conversión

export function esVacio(valor: unknown): boolean {
  return valor === null || valor === undefined || valor === '' || (typeof valor === 'number' && Number.isNaN(valor))
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

/**
 * Convierte a Date. Las cadenas sin zona ("AAAA-MM-DD" o "AAAA-MM-DD HH:mm[:ss]") se leen como hora local de OOMSAPAS;
 * las ISO con zona o "Z" se respetan; los números son milisegundos.
 */
export function aFecha(valor: unknown): Date | null {
  if (valor instanceof Date)
    return Number.isNaN(valor.getTime()) ? null : valor

  if (typeof valor === 'number')
    return Number.isFinite(valor) ? new Date(valor) : null

  if (typeof valor !== 'string' || valor.trim() === '')
    return null

  const cadena = valor.trim()
  const sinZona = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}(?:\.\d+)?))?)?$/.exec(cadena)

  const resultado = sinZona
    ? new Date(`${sinZona[1]}-${sinZona[2]}-${sinZona[3]}T${sinZona[4] ?? '00'}:${sinZona[5] ?? '00'}:${sinZona[6] ?? '00'}${DESFASE_LOCAL}`)
    : new Date(cadena)

  return Number.isNaN(resultado.getTime()) ? null : resultado
}

// ---------------------------------------------------------------------------------------------------------------------
// Números

const formatosNumero = new Map<string, Intl.NumberFormat>()

function formatoNumero(opciones: Intl.NumberFormatOptions): Intl.NumberFormat {
  const clave = JSON.stringify(opciones)
  let f = formatosNumero.get(clave)
  if (!f) {
    f = new Intl.NumberFormat(LOCALE, opciones)
    formatosNumero.set(clave, f)
  }

  return f
}

/** 12345 → "12,345". */
export function entero(valor: unknown, opciones: OpcionesFormato = {}): string {
  const n = aNumero(valor)

  return n === null ? (esVacio(valor) ? opciones.vacio ?? VACIO : String(valor)) : formatoNumero({ maximumFractionDigits: 0 }).format(n)
}

/** 1234.5 → "1,234.50" (dos decimales por defecto). */
export function decimal(valor: unknown, decimales = 2, opciones: OpcionesFormato = {}): string {
  const n = aNumero(valor)

  return n === null
    ? (esVacio(valor) ? opciones.vacio ?? VACIO : String(valor))
    : formatoNumero({ minimumFractionDigits: decimales, maximumFractionDigits: decimales }).format(n)
}

/** 1234.5 → "$1,234.50" (MXN). */
export function moneda(valor: unknown, opciones: OpcionesFormato = {}): string {
  const n = aNumero(valor)

  return n === null
    ? (esVacio(valor) ? opciones.vacio ?? VACIO : String(valor))
    : formatoNumero({ style: 'currency', currency: 'MXN', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}

/** El valor ya viene en puntos porcentuales: 12.5 → "12.5 %" (un decimal por defecto). */
export function porcentaje(valor: unknown, decimales = 1, opciones: OpcionesFormato = {}): string {
  const cifra = decimal(valor, decimales, opciones)

  return aNumero(valor) === null ? cifra : `${cifra} %`
}

/** Cifra compacta para indicadores: 12 345 → "12.3 mil", 1 234 567 → "1.2 M". */
export function compacto(valor: unknown, opciones: OpcionesFormato = {}): string {
  const n = aNumero(valor)
  if (n === null)
    return esVacio(valor) ? opciones.vacio ?? VACIO : String(valor)
  if (Math.abs(n) < 10000)
    return entero(n)

  return formatoNumero({ notation: 'compact', maximumFractionDigits: 1 }).format(n)
}

/** Diferencia con signo: 4.5 → "+4.5", −3 → "−3" (menos tipográfico). */
export function conSigno(valor: unknown, decimales = 1): string {
  const n = aNumero(valor)
  if (n === null)
    return VACIO
  const cifra = decimal(Math.abs(n), decimales)

  return n > 0 ? `+${cifra}` : n < 0 ? `−${cifra}` : cifra
}

export function booleano(valor: unknown, opciones: OpcionesFormato = {}): string {
  if (esVacio(valor))
    return opciones.vacio ?? VACIO

  return valor === true || valor === 1 || valor === '1' || valor === 'true' ? 'Sí' : 'No'
}

export function texto(valor: unknown, opciones: OpcionesFormato = {}): string {
  return esVacio(valor) ? opciones.vacio ?? VACIO : String(valor)
}

// ---------------------------------------------------------------------------------------------------------------------
// Fechas y horas (siempre en la zona de OOMSAPAS)

const formatosFecha = new Map<string, Intl.DateTimeFormat>()

function formatoFecha(opciones: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const clave = JSON.stringify(opciones)
  let f = formatosFecha.get(clave)
  if (!f) {
    f = new Intl.DateTimeFormat(LOCALE, { timeZone: ZONA_HORARIA, ...opciones })
    formatosFecha.set(clave, f)
  }

  return f
}

function conFecha(valor: unknown, opciones: OpcionesFormato, fn: (d: Date) => string): string {
  const d = aFecha(valor)
  if (d)
    return fn(d)

  return esVacio(valor) ? opciones.vacio ?? VACIO : String(valor)
}

/** "07/10/2026". */
export function fecha(valor: unknown, opciones: OpcionesFormato = {}): string {
  return conFecha(valor, opciones, d => formatoFecha({ day: '2-digit', month: '2-digit', year: 'numeric' }).format(d))
}

/** "7 oct". */
export function fechaCorta(valor: unknown, opciones: OpcionesFormato = {}): string {
  return conFecha(valor, opciones, d => formatoFecha({ day: 'numeric', month: 'short' }).format(d).replace('.', ''))
}

/** "martes, 7 de octubre de 2026". */
export function fechaLarga(valor: unknown, opciones: OpcionesFormato = {}): string {
  return conFecha(valor, opciones, d => formatoFecha({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d))
}

/** "octubre 2026". */
export function mesAnio(valor: unknown, opciones: OpcionesFormato = {}): string {
  return conFecha(valor, opciones, d => formatoFecha({ month: 'long', year: 'numeric' }).format(d).replace(' de ', ' '))
}

/** "09:33" (24 h). */
export function hora(valor: unknown, opciones: OpcionesFormato = {}): string {
  return conFecha(valor, opciones, d => formatoFecha({ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d))
}

/** "07/10/2026 09:33". */
export function fechaHora(valor: unknown, opciones: OpcionesFormato = {}): string {
  return conFecha(valor, opciones, d => `${fecha(d)} ${hora(d)}`)
}

/** "7 oct 09:33": para listas densas. */
export function fechaHoraCorta(valor: unknown, opciones: OpcionesFormato = {}): string {
  return conFecha(valor, opciones, d => `${fechaCorta(d)} ${hora(d)}`)
}

/** Fecha "AAAA-MM-DD" de hoy (o de la fecha dada) en hora local de OOMSAPAS. */
export function fechaIso(valor: Date = new Date()): string {
  const partes = new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_HORARIA, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(valor)
  const v = (tipo: string) => partes.find(p => p.type === tipo)?.value ?? ''

  return `${v('year')}-${v('month')}-${v('day')}`
}

export const hoyLocal = fechaIso

/** Minutos transcurridos desde la fecha (0 si es futura); null si no hay fecha. */
export function minutosDesde(valor: unknown, ahora: Date = new Date()): number | null {
  const d = aFecha(valor)

  return d ? Math.max(0, Math.floor((ahora.getTime() - d.getTime()) / 60000)) : null
}

export function segundosDesde(valor: unknown, ahora: Date = new Date()): number | null {
  const d = aFecha(valor)

  return d ? Math.max(0, Math.floor((ahora.getTime() - d.getTime()) / 1000)) : null
}

/** 117 → "1 h 57 min"; 45 → "45 min"; 0 → "0 min". */
export function duracion(minutos: unknown, opciones: OpcionesFormato = {}): string {
  const n = aNumero(minutos)
  if (n === null)
    return opciones.vacio ?? VACIO
  const total = Math.round(n)
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h === 0)
    return `${m} min`

  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, '0')} min`
}

const relativo = new Intl.RelativeTimeFormat('es', { numeric: 'always' })

/** "hace 4 minutos", "hace 2 horas", "justo ahora" (menos de 45 s); también futuro ("en 3 días"). */
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

export type TraductorRelativo = (clave: 'nunca' | 'ahora' | 'minutos' | 'horas' | 'dias', n?: number) => string

/** "hace 4 min", "hace 2 h", "hace 3 días", con las claves de traducción del módulo que lo use. */
export function haceCuanto(valor: unknown, t: TraductorRelativo, ahora: Date = new Date()): string {
  const minutos = minutosDesde(valor, ahora)
  if (minutos === null)
    return t('nunca')
  if (minutos < 1)
    return t('ahora')
  if (minutos < 60)
    return t('minutos', minutos)
  if (minutos < 48 * 60)
    return t('horas', Math.round(minutos / 60))

  return t('dias', Math.round(minutos / 1440))
}

// ---------------------------------------------------------------------------------------------------------------------
// Por tipo de columna (tablas, reportes, indicadores)

const POR_FORMATO: Record<FormatoValor, (valor: unknown, opciones: OpcionesFormato) => string> = {
  texto,
  entero: (v, o) => entero(v, o),
  decimal: (v, o) => decimal(v, 2, o),
  moneda,
  porcentaje: (v, o) => porcentaje(v, 1, o),
  fecha,
  fechaHora,
  hora,
  booleano,
  periodo: texto,
}

export function porFormato(valor: unknown, formato: FormatoValor, opciones: OpcionesFormato = {}): string {
  return (POR_FORMATO[formato] ?? texto)(valor, opciones)
}

/** Los formatos numéricos se alinean a la derecha; el resto, a la izquierda. */
export function esNumerico(formato: FormatoValor): boolean {
  return formato === 'entero' || formato === 'decimal' || formato === 'moneda' || formato === 'porcentaje'
}

// ---------------------------------------------------------------------------------------------------------------------
// Opciones para vue-i18n (n() y d() con la misma convención)

export const NUMBER_FORMATS: Record<string, Intl.NumberFormatOptions> = {
  entero: { maximumFractionDigits: 0 },
  decimal: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
  decimal1: { minimumFractionDigits: 1, maximumFractionDigits: 1 },
  moneda: { style: 'currency', currency: 'MXN', minimumFractionDigits: 2, maximumFractionDigits: 2 },
  porcentaje: { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 },
  compacto: { notation: 'compact', maximumFractionDigits: 1 },
}

export const DATETIME_FORMATS: Record<string, Intl.DateTimeFormatOptions> = {
  fecha: { timeZone: ZONA_HORARIA, day: '2-digit', month: '2-digit', year: 'numeric' },
  fechaCorta: { timeZone: ZONA_HORARIA, day: 'numeric', month: 'short' },
  fechaLarga: { timeZone: ZONA_HORARIA, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
  hora: { timeZone: ZONA_HORARIA, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' },
  fechaHora: { timeZone: ZONA_HORARIA, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' },
  mesAnio: { timeZone: ZONA_HORARIA, month: 'long', year: 'numeric' },
}
