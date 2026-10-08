import { describe, expect, it } from 'vitest'
import {
  aFecha, aNumero, booleano, compacto, conSigno, decimal, duracion, entero, esNumerico, esVacio,
  fecha, fechaCorta, fechaHora, fechaHoraCorta, fechaIso, fechaLarga, haceCuanto, hora, mesAnio, minutosDesde,
  moneda, porFormato, porcentaje, texto, tiempoRelativo,
} from './index'

describe('formato · conversión', () => {
  it('detecta vacíos', () => {
    expect(esVacio(null)).toBe(true)
    expect(esVacio(undefined)).toBe(true)
    expect(esVacio('')).toBe(true)
    expect(esVacio(Number.NaN)).toBe(true)
    expect(esVacio(0)).toBe(false)
    expect(esVacio('0')).toBe(false)
  })

  it('convierte números con separador de miles', () => {
    expect(aNumero('1,234.5')).toBe(1234.5)
    expect(aNumero(' ')).toBeNull()
    expect(aNumero('abc')).toBeNull()
    expect(aNumero(Number.POSITIVE_INFINITY)).toBeNull()
  })

  it('lee las cadenas sin zona como hora local de OOMSAPAS', () => {
    expect(aFecha('2026-10-07 09:33:00')?.toISOString()).toBe('2026-10-07T16:33:00.000Z')
    expect(aFecha('2026-10-07')?.toISOString()).toBe('2026-10-07T07:00:00.000Z')
    expect(aFecha('2026-10-07T16:33:00Z')?.toISOString()).toBe('2026-10-07T16:33:00.000Z')
    expect(aFecha('2026-10-07T09:33:00-07:00')?.toISOString()).toBe('2026-10-07T16:33:00.000Z')
    expect(aFecha('no es fecha')).toBeNull()
    expect(aFecha(null)).toBeNull()
  })
})

describe('formato · números', () => {
  it('entero, decimal y moneda en es-MX', () => {
    expect(entero(12345)).toBe('12,345')
    expect(entero('12345.7')).toBe('12,346')
    expect(decimal(1234.5)).toBe('1,234.50')
    expect(decimal(1234.567, 1)).toBe('1,234.6')
    expect(moneda(1234.5)).toBe('$1,234.50')
    expect(moneda(0)).toBe('$0.00')
    expect(moneda(-359.5)).toBe('-$359.50')
  })

  it('porcentaje con un decimal y espacio fino', () => {
    expect(porcentaje(98.4)).toBe('98.4 %')
    expect(porcentaje(12.5, 2)).toBe('12.50 %')
    expect(porcentaje(null)).toBe('—')
  })

  it('vacíos y no numéricos', () => {
    expect(entero(null)).toBe('—')
    expect(entero(null, { vacio: '' })).toBe('')
    expect(entero('N/A')).toBe('N/A')
    expect(texto('')).toBe('—')
    expect(texto('hola')).toBe('hola')
  })

  it('compacto y con signo', () => {
    expect(compacto(9999)).toBe('9,999')
    expect(compacto(94946)).toMatch(/^94\.9\s?(mil|k)$/)
    expect(conSigno(4.5)).toBe('+4.5')
    expect(conSigno(-3)).toBe('−3.0')
    expect(conSigno(0)).toBe('0.0')
  })

  it('booleano', () => {
    expect(booleano(true)).toBe('Sí')
    expect(booleano('0')).toBe('No')
    expect(booleano(null)).toBe('—')
  })
})

describe('formato · fechas en la zona de OOMSAPAS', () => {
  const valor = '2026-10-07 09:33:00'

  it('fecha, hora y combinaciones', () => {
    expect(fecha(valor)).toBe('07/10/2026')
    expect(hora(valor)).toBe('09:33')
    expect(fechaHora(valor)).toBe('07/10/2026 09:33')
    expect(fechaCorta(valor)).toBe('7 oct')
    expect(fechaHoraCorta(valor)).toBe('7 oct 09:33')
    expect(fechaLarga(valor)).toBe('miércoles, 7 de octubre de 2026')
    expect(mesAnio(valor)).toBe('octubre 2026')
  })

  it('la zona del navegador no cambia el resultado (entrada en UTC)', () => {
    expect(hora('2026-10-07T16:33:00Z')).toBe('09:33')
    expect(fecha('2026-10-08T03:00:00Z')).toBe('07/10/2026')
  })

  it('vacíos y texto no fechable', () => {
    expect(fecha(null)).toBe('—')
    expect(fecha('', { vacio: '' })).toBe('')
    expect(fecha('pendiente')).toBe('pendiente')
  })

  it('fechaIso y minutosDesde', () => {
    expect(fechaIso(new Date('2026-10-08T03:00:00Z'))).toBe('2026-10-07')

    const ahora = new Date('2026-10-07T17:00:00Z')

    expect(minutosDesde(valor, ahora)).toBe(27)
    expect(minutosDesde(null, ahora)).toBeNull()
    expect(minutosDesde('2026-10-07T18:00:00Z', ahora)).toBe(0)
  })

  it('duración y relativo', () => {
    expect(duracion(117)).toBe('1 h 57 min')
    expect(duracion(45)).toBe('45 min')
    expect(duracion(120)).toBe('2 h')
    expect(duracion(null)).toBe('—')

    const ahora = new Date('2026-10-07T17:00:00Z')

    expect(tiempoRelativo('2026-10-07T16:56:00Z', ahora)).toBe('hace 4 minutos')
    expect(tiempoRelativo('2026-10-07T16:59:40Z', ahora)).toBe('justo ahora')
    expect(tiempoRelativo('2026-10-05T17:00:00Z', ahora)).toBe('hace 2 días')

    const t = (clave: string, n?: number) => `${clave}${n ?? ''}`

    expect(haceCuanto('2026-10-07T16:56:00Z', t, ahora)).toBe('minutos4')
    expect(haceCuanto(null, t, ahora)).toBe('nunca')
    expect(haceCuanto('2026-10-04T17:00:00Z', t, ahora)).toBe('dias3')
  })
})

describe('formato · por tipo de columna', () => {
  it('aplica el formato y sabe cuáles son numéricos', () => {
    expect(porFormato(1234.5, 'moneda')).toBe('$1,234.50')
    expect(porFormato(12.345, 'decimal')).toBe('12.35')
    expect(porFormato(98.44, 'porcentaje')).toBe('98.4 %')
    expect(porFormato('2026-10-07 09:33:00', 'fechaHora')).toBe('07/10/2026 09:33')
    expect(porFormato('SEPTIEMBRE 2026', 'periodo')).toBe('SEPTIEMBRE 2026')
    expect(esNumerico('moneda')).toBe(true)
    expect(esNumerico('fecha')).toBe(false)
  })
})
