/**
 * QR del pozo: una etiqueta impresa (Proyecto → Etiquetas QR) que se pega en la tabla o se imprime en la hoja.
 * Si aparece en la foto, el pozo se elige solo. El contenido no lleva datos personales: solo el id del pozo.
 */

import type { PixelData } from './photoQualityUtils'
import { readPixels } from './photoQualityUtils'

const PREFIX = 'SIMO-POZO:'

/** Las etiquetas son chicas en la foto: se busca en una versión más grande que la del análisis de calidad. */
const QR_EDGE = 1600

export const wellQrPayload = (wellId: string) => `${PREFIX}${wellId}`

export function parseWellQr(text: string | null | undefined): string | null {
  const match = (text ?? '').trim().match(/^SIMO-POZO:([0-9a-f-]{36})$/i)

  return match ? match[1].toLowerCase() : null
}

export async function findWellIdInPixels(pixels: PixelData): Promise<string | null> {
  const { default: jsQR } = await import('jsqr')
  const found = jsQR(pixels.data, pixels.width, pixels.height, { inversionAttempts: 'dontInvert' })

  return parseWellQr(found?.data)
}

/** Id del pozo si la foto trae su etiqueta QR; null si no hay o no se lee. */
export async function findWellIdInPhoto(file: Blob): Promise<string | null> {
  try {
    const { pixels } = await readPixels(file, QR_EDGE)

    return await findWellIdInPixels(pixels)
  }
  catch {
    return null
  }
}
