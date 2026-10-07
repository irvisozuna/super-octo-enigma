import { describe, expect, it } from 'vitest'
import { aFecha, haceCuanto, horaCorta, hoyLocal, minutosDesde, segundosDesde } from '../utils/tiempo'

const t = (clave: string, n?: number) => (n === undefined ? clave : `${clave}:${n}`)

describe('tiempo', () => {
  it('interpreta las horas locales de OOMSAPAS como UTC-7 y respeta las ISO con zona', () => {
    expect(aFecha('2026-10-07 09:15:14')?.toISOString()).toBe('2026-10-07T16:15:14.000Z')
    expect(aFecha('2026-10-07T16:15:14+00:00')?.toISOString()).toBe('2026-10-07T16:15:14.000Z')
    expect(aFecha('2026-10-07T16:15:14.000000Z')?.toISOString()).toBe('2026-10-07T16:15:14.000Z')
    expect(aFecha(null)).toBeNull()
    expect(aFecha('ayer')).toBeNull()
  })

  it('calcula minutos y segundos transcurridos sin ir a negativo', () => {
    const ahora = new Date('2026-10-07T17:00:00Z') // 10:00 en Los Cabos

    expect(minutosDesde('2026-10-07 08:15:00', ahora)).toBe(105)
    expect(minutosDesde('2026-10-07 11:00:00', ahora)).toBe(0)
    expect(minutosDesde(null, ahora)).toBeNull()
    expect(segundosDesde(new Date('2026-10-07T16:59:15Z'), ahora)).toBe(45)
  })

  it('expresa el tiempo relativo con las claves del módulo', () => {
    const ahora = new Date('2026-10-07T17:00:00Z')

    expect(haceCuanto(null, t, ahora)).toBe('nunca')
    expect(haceCuanto('2026-10-07 09:59:40', t, ahora)).toBe('ahora')
    expect(haceCuanto('2026-10-07 07:45:00', t, ahora)).toBe('horas:2')
    expect(haceCuanto('2026-10-07 09:45:00', t, ahora)).toBe('minutos:15')
    expect(haceCuanto('2026-10-04 09:00:00', t, ahora)).toBe('dias:3')
  })

  it('da la hora corta y la fecha de hoy en hora local', () => {
    expect(horaCorta('2026-10-07 09:15:14')).toBe('09:15')
    expect(horaCorta(null)).toBe('—')
    expect(hoyLocal(new Date('2026-10-08T05:30:00Z'))).toBe('2026-10-07') // todavía es 7 de octubre en Los Cabos
  })
})
