import type { FormatoColumna } from '../types/reporte'
import * as f from '@/utils/formato'

/*
 * Formato de Reportes. Desde el sistema de diseño 1.0 la implementación vive en `src/utils/formato` (es-MX, zona de
 * OOMSAPAS). Se conservan los nombres y la convención histórica del módulo: los valores ausentes se muestran vacíos
 * (las celdas de reporte no llevan guion) y el porcentaje usa dos decimales.
 */

const VACIO = { vacio: '' }

export const esVacio = f.esVacio
export const aNumero = f.aNumero
export const aFecha = f.aFecha
export const tiempoRelativo = f.tiempoRelativo

export function formatearMoneda(valor: unknown): string {
  return f.moneda(valor, VACIO)
}

export function formatearNumero(valor: unknown, numDecimales = 2): string {
  return f.decimal(valor, numDecimales, VACIO)
}

export function formatearEntero(valor: unknown): string {
  return f.entero(valor, VACIO)
}

/** El valor ya viene en puntos porcentuales (12.5 → "12.50 %"). */
export function formatearPorcentaje(valor: unknown, numDecimales = 2): string {
  return f.porcentaje(valor, numDecimales, VACIO)
}

export function formatearFecha(valor: unknown): string {
  return f.fecha(valor, VACIO)
}

export function formatearFechaHora(valor: unknown): string {
  return f.fechaHora(valor, VACIO)
}

export function formatearBooleano(valor: unknown): string {
  return f.booleano(valor, VACIO)
}

export function formatearValor(valor: unknown, formato: FormatoColumna): string {
  if (formato === 'porcentaje')
    return formatearPorcentaje(valor)

  return f.porFormato(valor, formato, VACIO)
}
