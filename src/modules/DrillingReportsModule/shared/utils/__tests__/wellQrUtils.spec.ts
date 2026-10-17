import QRCode from 'qrcode'
import { describe, expect, it } from 'vitest'
import { findWellIdInPixels, parseWellQr, wellQrPayload } from '../wellQrUtils'
import type { PixelData } from '../photoQualityUtils'

const WELL = '06981752-eceb-43d3-8e28-d1f8ed545fbc'

/** Dibuja el QR en píxeles (sin canvas), con margen blanco y cada módulo de `scale` píxeles. */
function render(text: string, scale = 6, margin = 4): PixelData {
  const qr = QRCode.create(text, { errorCorrectionLevel: 'M' })
  const modules = qr.modules.size
  const size = (modules + margin * 2) * scale
  const data = new Uint8ClampedArray(size * size * 4).fill(255)
  for (let row = 0; row < modules; row++) {
    for (let col = 0; col < modules; col++) {
      if (!qr.modules.get(row, col))
        continue
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const i = (((row + margin) * scale + dy) * size + (col + margin) * scale + dx) * 4

          data.set([0, 0, 0, 255], i)
        }
      }
    }
  }

  return { data, width: size, height: size }
}

describe('wellQrUtils', () => {
  it('lee el pozo de la etiqueta impresa', async () => {
    expect(await findWellIdInPixels(render(wellQrPayload(WELL)))).toBe(WELL)
  })

  it('ignora QR que no son de SIMO', async () => {
    expect(await findWellIdInPixels(render('https://example.com'))).toBeNull()
    expect(parseWellQr('SIMO-POZO:no-es-un-id')).toBeNull()
    expect(parseWellQr(` SIMO-POZO:${WELL.toUpperCase()} `)).toBe(WELL)
  })
})
