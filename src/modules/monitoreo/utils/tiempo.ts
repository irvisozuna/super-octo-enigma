/*
 * Fechas del monitoreo. El servidor manda las horas locales de OOMSAPAS como "Y-m-d H:i:s" (sin zona) y las marcas
 * de proceso en ISO con zona. Aquí se interpretan ambas y se expresan en relativo ("hace 4 min") o como hora corta.
 */

/** Desfase fijo de OOMSAPAS (America/Mazatlan no cambia de horario desde 2022). */
export const DESFASE_LOCAL = '-07:00'

export function aFecha(valor: string | null | undefined): Date | null {
  if (!valor)
    return null
  const texto = valor.includes('T') || /[+-]\d\d:\d\d$|Z$/.test(valor) ? valor : `${valor.replace(' ', 'T')}${DESFASE_LOCAL}`
  const fecha = new Date(texto)

  return Number.isNaN(fecha.getTime()) ? null : fecha
}

/** Minutos transcurridos desde la fecha (0 si es futura); null si no hay fecha. */
export function minutosDesde(valor: string | null | undefined, ahora: Date = new Date()): number | null {
  const fecha = aFecha(valor)
  if (!fecha)
    return null

  return Math.max(0, Math.floor((ahora.getTime() - fecha.getTime()) / 60000))
}

export function segundosDesde(valor: Date | string | null | undefined, ahora: Date = new Date()): number | null {
  const fecha = valor instanceof Date ? valor : aFecha(valor)
  if (!fecha)
    return null

  return Math.max(0, Math.floor((ahora.getTime() - fecha.getTime()) / 1000))
}

/** Hora corta local de OOMSAPAS ("09:15"). */
export function horaCorta(valor: string | null | undefined): string {
  const fecha = aFecha(valor)
  if (!fecha)
    return '—'

  return fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Mazatlan' })
}

/** Fecha corta local ("7 oct"). */
export function fechaCorta(valor: string | null | undefined): string {
  const fecha = aFecha(valor)
  if (!fecha)
    return '—'

  return fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', timeZone: 'America/Mazatlan' })
}

/** Fecha "Y-m-d" de hoy en hora local de OOMSAPAS. */
export function hoyLocal(ahora: Date = new Date()): string {
  const partes = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mazatlan', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(ahora)
  const v = (tipo: string) => partes.find(p => p.type === tipo)?.value ?? ''

  return `${v('year')}-${v('month')}-${v('day')}`
}

export type TraductorRelativo = (clave: 'nunca' | 'ahora' | 'minutos' | 'horas' | 'dias', n?: number) => string

/** "hace 4 min", "hace 2 h", "hace 3 días" con las claves de `monitoreo.tiempo.*`. */
export function haceCuanto(valor: string | Date | null | undefined, t: TraductorRelativo, ahora: Date = new Date()): string {
  const minutos = valor instanceof Date ? Math.max(0, Math.floor((ahora.getTime() - valor.getTime()) / 60000)) : minutosDesde(valor, ahora)
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
