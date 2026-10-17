/**
 * Revisión rápida de la foto de una hoja en el teléfono, antes de subirla: si está borrosa, oscura,
 * quemada o con muy poca resolución, se pide repetirla ahí mismo (en la mina, no días después en la oficina).
 *
 * Trabaja sobre los píxeles de una versión reducida (lado mayor ANALYSIS_EDGE), así tarda milisegundos.
 */

export interface PixelData {
  data: Uint8ClampedArray
  width: number
  height: number
}

export type QualityIssue = 'blurry' | 'dark' | 'overexposed' | 'small'

export interface PhotoQuality {
  ok: boolean
  issues: QualityIssue[]
  brightness: number
  sharpness: number
}

export const ANALYSIS_EDGE = 800

/** Umbrales calibrados con fotos reales de hojas CDK (ver tests). */
export const QUALITY_THRESHOLDS = {
  minSharpness: 100, // varianza del laplaciano: hojas reales 3,100–4,300; con desenfoque de 1.5 px, 20–27
  minBrightness: 70, // luminancia media 0–255: hojas reales 133–144; oscurecidas al 40 %, ~55
  maxBrightness: 225,
  minLongEdge: 1200, // píxeles de la foto original
}

export const QUALITY_MESSAGES: Record<QualityIssue, string> = {
  blurry: 'Salió borrosa: sostén el teléfono firme y toca la hoja en la pantalla para enfocar.',
  dark: 'Está oscura: busca más luz o usa el flash.',
  overexposed: 'Tiene mucho brillo: evita el sol directo o el reflejo del flash sobre la hoja.',
  small: 'Tiene muy poca resolución: acércate para que la hoja llene la foto.',
}

function grayscale({ data, width, height }: PixelData): Float32Array {
  const gray = new Float32Array(width * height)
  for (let i = 0; i < gray.length; i++)
    gray[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]

  return gray
}

/** Varianza del laplaciano: baja cuando la imagen no tiene bordes definidos (borrosa). */
export function sharpness(pixels: PixelData): number {
  const { width, height } = pixels
  const gray = grayscale(pixels)
  let sum = 0
  let sumSquares = 0
  let count = 0
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x
      const laplacian = gray[i - width] + gray[i + width] + gray[i - 1] + gray[i + 1] - 4 * gray[i]

      sum += laplacian
      sumSquares += laplacian * laplacian
      count++
    }
  }
  if (!count)
    return 0
  const mean = sum / count

  return sumSquares / count - mean * mean
}

export function brightness(pixels: PixelData): number {
  const gray = grayscale(pixels)
  let sum = 0
  for (const value of gray)
    sum += value

  return gray.length ? sum / gray.length : 0
}

export function assessQuality(pixels: PixelData, originalLongEdge: number): PhotoQuality {
  const issues: QualityIssue[] = []
  const light = brightness(pixels)
  const sharp = sharpness(pixels)

  if (originalLongEdge < QUALITY_THRESHOLDS.minLongEdge)
    issues.push('small')
  if (light < QUALITY_THRESHOLDS.minBrightness)
    issues.push('dark')
  else if (light > QUALITY_THRESHOLDS.maxBrightness)
    issues.push('overexposed')
  if (sharp < QUALITY_THRESHOLDS.minSharpness)
    issues.push('blurry')

  return { ok: issues.length === 0, issues, brightness: Math.round(light), sharpness: Math.round(sharp) }
}

/** Píxeles de la foto reducida para analizarla (y para buscar el QR del pozo). */
export async function readPixels(file: Blob, maxEdge = ANALYSIS_EDGE): Promise<{ pixels: PixelData; originalLongEdge: number }> {
  const bitmap = await createImageBitmap(file)
  try {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')

    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const context = canvas.getContext('2d', { willReadFrequently: true })!

    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const image = context.getImageData(0, 0, canvas.width, canvas.height)

    return { pixels: { data: image.data, width: image.width, height: image.height }, originalLongEdge: Math.max(bitmap.width, bitmap.height) }
  }
  finally {
    bitmap.close()
  }
}
