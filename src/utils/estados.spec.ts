import { describe, expect, it } from 'vitest'
import { COLOR_ESTADO_ALERTA, TOKEN_SECTOR, TOKEN_SEVERIDAD, TOKEN_TOMA, colorDe, tokenAvance, tokenMeta, tokenSenal } from './estados'
import tokens from '@/styles/tokens/colores.json'

const coloresClaro = tokens.light.colors as Record<string, string>
const coloresOscuro = tokens.dark.colors as Record<string, string>

describe('estados → tokens', () => {
  it('todo token operativo existe en los dos temas con su on-* y su -darken-1', () => {
    const operativos = [...Object.values(TOKEN_TOMA), ...Object.values(TOKEN_SECTOR), ...Object.values(TOKEN_SEVERIDAD), 'senal-reciente', 'senal-tarde', 'senal-sin-reporte', 'senal-termino', 'senal-sin-datos', 'toma-lejos']
    for (const token of operativos) {
      for (const colores of [coloresClaro, coloresOscuro]) {
        expect(colores[token], token).toMatch(/^#[0-9A-Fa-f]{6}$/)
        expect(colores[`on-${token}`], `on-${token}`).toMatch(/^#/)
        expect(colores[`${token}-darken-1`], `${token}-darken-1`).toMatch(/^#/)
      }
    }
  })

  it('señal del lecturista según minutos', () => {
    expect(tokenSenal('activo', 3)).toBe('senal-reciente')
    expect(tokenSenal('activo', 45)).toBe('senal-tarde')
    expect(tokenSenal('activo', 120)).toBe('senal-sin-reporte')
    expect(tokenSenal('activo', 95, 120)).toBe('senal-tarde')
    expect(tokenSenal('terminado', 300)).toBe('senal-termino')
    expect(tokenSenal('activo', null)).toBe('senal-sin-datos')
  })

  it('avance y meta', () => {
    expect(tokenAvance(98)).toBe('success')
    expect(tokenAvance(92)).toBe('warning')
    expect(tokenAvance(50)).toBe('primary')
    expect(tokenAvance(null)).toBe('sector-pendiente')
    expect(tokenMeta(100)).toBe('success')
    expect(tokenMeta(75)).toBe('primary')
    expect(tokenMeta(10)).toBe('warning')
  })

  it('colorDe con respaldo', () => {
    expect(colorDe(COLOR_ESTADO_ALERTA, 'abierta')).toBe('primary')
    expect(colorDe(COLOR_ESTADO_ALERTA, 'inexistente')).toBe('secondary')
    expect(colorDe(COLOR_ESTADO_ALERTA, null, 'default')).toBe('default')
  })
})
