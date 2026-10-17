import { describe, expect, it } from 'vitest'
import { assessQuality, brightness, sharpness } from '../photoQualityUtils'
import type { PixelData } from '../photoQualityUtils'

/** Imagen sintética: "hoja" con texto (bordes) o lisa (sin enfoque), con el gris indicado. */
function image(kind: 'text' | 'flat', level = 200, size = 200): PixelData {
  const data = new Uint8ClampedArray(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const ink = kind === 'text' && (x % 8 < 2) && (y % 12 < 6)
      const value = ink ? Math.max(0, level - 170) : level
      const i = (y * size + x) * 4

      data.set([value, value, value, 255], i)
    }
  }

  return { data, width: size, height: size }
}

describe('photoQualityUtils', () => {
  it('una hoja con texto y buena luz pasa', () => {
    const quality = assessQuality(image('text'), 3000)

    expect(quality.ok).toBe(true)
    expect(quality.sharpness).toBeGreaterThan(100)
  })

  it('detecta borrosa, oscura, quemada y chica', () => {
    expect(assessQuality(image('flat'), 3000).issues).toEqual(['blurry'])
    expect(assessQuality(image('text', 40), 3000).issues).toContain('dark')
    expect(assessQuality(image('flat', 250), 3000).issues).toContain('overexposed')
    expect(assessQuality(image('text'), 800).issues).toContain('small')
  })

  it('mide brillo y nitidez', () => {
    expect(brightness(image('flat', 120))).toBeCloseTo(120, 0)
    expect(sharpness(image('flat'))).toBe(0)
  })
})
