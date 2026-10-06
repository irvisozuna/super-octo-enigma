import { describe, expect, it } from 'vitest'
import { aFecha, formatearEntero, formatearFecha, formatearFechaHora, formatearMoneda, formatearNumero, formatearPorcentaje, formatearValor, tiempoRelativo } from '../utils/formato'

describe('formato es-MX', () => {
  it('moneda con separador de miles y dos decimales', () => {
    expect(formatearMoneda(42101360.87)).toBe('$42,101,360.87')
    expect(formatearMoneda('1234.5')).toBe('$1,234.50')
    expect(formatearMoneda(0)).toBe('$0.00')
  })

  it('vacíos y no numéricos no truenan', () => {
    expect(formatearMoneda(null)).toBe('')
    expect(formatearMoneda(undefined)).toBe('')
    expect(formatearMoneda('')).toBe('')
    expect(formatearMoneda('N/A')).toBe('N/A')
  })

  it('números, enteros y porcentajes', () => {
    expect(formatearNumero(1234.567)).toBe('1,234.57')
    expect(formatearNumero(1234.567, 1)).toBe('1,234.6')
    expect(formatearEntero(100513)).toBe('100,513')
    expect(formatearEntero('96000.4')).toBe('96,000')
    expect(formatearPorcentaje(12.5)).toBe('12.50 %')
  })

  it('las fechas de la base se leen como hora local (sin corrimiento por zona)', () => {
    expect(formatearFecha('2026-09-01')).toBe('01/09/2026')
    expect(formatearFechaHora('2026-09-01 14:05:00')).toBe('01/09/2026 14:05')
    expect(aFecha('2026-09-01')?.getDate()).toBe(1)
    expect(formatearFecha('no es fecha')).toBe('no es fecha')
    expect(formatearFecha(null)).toBe('')
  })

  it('formatearValor despacha por formato de columna', () => {
    expect(formatearValor(1500, 'moneda')).toBe('$1,500.00')
    expect(formatearValor('2026-09-30', 'fecha')).toBe('30/09/2026')
    expect(formatearValor(1, 'booleano')).toBe('Sí')
    expect(formatearValor('SEPTIEMBRE 2026', 'periodo')).toBe('SEPTIEMBRE 2026')
    expect(formatearValor(null, 'texto')).toBe('')
  })

  it('tiempo relativo en español', () => {
    const ahora = new Date(2026, 9, 6, 12, 0, 0)

    expect(tiempoRelativo(new Date(ahora.getTime() - 10_000), ahora)).toBe('justo ahora')
    expect(tiempoRelativo(new Date(ahora.getTime() - 4 * 60_000), ahora)).toBe('hace 4 minutos')
    expect(tiempoRelativo('2026-10-06 10:00:00', ahora)).toBe('hace 2 horas')
    expect(tiempoRelativo('2026-10-03 12:00:00', ahora)).toBe('hace 3 días')
    expect(tiempoRelativo(null, ahora)).toBe('')
  })
})
