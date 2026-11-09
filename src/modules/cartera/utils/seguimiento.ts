import type { CandidataSeguimiento, OrdenSeguimiento } from '../types/cartera'

/*
 * Buscador, filtros y orden de la bandeja de Seguimiento (XEL1-682). La bandeja llega completa, así que se filtra aquí,
 * sin volver al servidor. La búsqueda ignora acentos y mayúsculas y pide que aparezcan todas las palabras.
 */

export type OrdenSeguimientoBandeja = 'dias' | 'adeudo' | 'recientes' | 'notificador'

export interface FiltrosSeguimiento {
  texto: string
  notificador: string | null
  resultado: string | null
  origen: 'atencion' | 'legado' | null
  diasMin: number | null
  adeudoMin: number | null
  orden: OrdenSeguimientoBandeja
}

export const filtrosSeguimientoIniciales = (): FiltrosSeguimiento => ({
  texto: '', notificador: null, resultado: null, origen: null, diasMin: null, adeudoMin: null, orden: 'dias',
})

/** Cuántos filtros hay puestos (el orden no cuenta). */
export function filtrosSeguimientoActivos(f: FiltrosSeguimiento): number {
  return [f.texto.trim(), f.notificador, f.resultado, f.origen, f.diasMin, f.adeudoMin].filter(v => v !== null && v !== '').length
}

export function normalizar(s: string): string {
  return s.normalize('NFD').replace(/\p{Mn}+/gu, '').toLowerCase().replace(/\s+/g, ' ').trim()
}

function coincide(texto: string, campos: (string | number | null | undefined)[]): boolean {
  const palabras = normalizar(texto).split(' ').filter(Boolean)
  if (!palabras.length)
    return true
  const donde = normalizar(campos.filter(c => c !== null && c !== undefined).join(' '))

  return palabras.every(p => donde.includes(p))
}

export function filtrarCandidatas(lista: CandidataSeguimiento[], f: FiltrosSeguimiento): CandidataSeguimiento[] {
  const filtradas = lista.filter(c =>
    coincide(f.texto, [c.cuenta, c.contrato, c.ref, c.titular, c.notificador])
    && (!f.notificador || c.notificador === f.notificador)
    && (!f.resultado || c.estado_codigo === f.resultado)
    && (!f.origen || c.origen === f.origen)
    && (f.diasMin === null || c.dias >= f.diasMin)
    && (f.adeudoMin === null || c.adeudo_actual >= f.adeudoMin))

  // Los empates siempre se resuelven igual: más días y luego mayor adeudo
  const dias = (a: CandidataSeguimiento, b: CandidataSeguimiento) => b.dias - a.dias || b.adeudo_actual - a.adeudo_actual

  const por: Record<OrdenSeguimientoBandeja, (a: CandidataSeguimiento, b: CandidataSeguimiento) => number> = {
    dias,
    adeudo: (a, b) => b.adeudo_actual - a.adeudo_actual || dias(a, b),
    recientes: (a, b) => b.entregada.localeCompare(a.entregada) || dias(a, b),
    notificador: (a, b) => (a.notificador ?? '').localeCompare(b.notificador ?? '') || dias(a, b),
  }

  return [...filtradas].sort(por[f.orden])
}

export function filtrarOrdenes(lista: OrdenSeguimiento[], texto: string): OrdenSeguimiento[] {
  return lista.filter(o => coincide(texto, [o.cuenta, o.contrato, o.notificacion?.ref, o.motivo]))
}
