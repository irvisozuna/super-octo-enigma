/**
 * Prepara las fotos de hojas antes de subirlas a la captura con IA.
 *
 * Las fotos HEIC de iPhone se convierten a JPEG aquí: el servidor (ImageMagick 6 + libheif 1.17 de Ubuntu 24.04)
 * no decodifica las HEIC actuales ("Metadata not correctly assigned to image"). De paso se reduce la foto,
 * así se sube ~0.5 MB en lugar de 2–5 MB.
 */

/** Lado mayor con el que se sube; el servidor la vuelve a acotar a 2000 px antes de mandarla al modelo. */
const MAX_LONG_EDGE_PX = 2400
const JPEG_QUALITY = 0.88

const HEIF_BRANDS = ['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1', 'heim', 'heis']

function readBytes(blob: Blob): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer))
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(blob)
  })
}

export async function isHeicPhoto(file: File): Promise<boolean> {
  if (/^image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name))
    return true

  const header = await readBytes(file.slice(0, 12))
  const ascii = (from: number, to: number) => String.fromCharCode(...header.slice(from, to))

  return ascii(4, 8) === 'ftyp' && HEIF_BRANDS.includes(ascii(8, 12))
}

async function heicToJpeg(file: File): Promise<File> {
  // Carga diferida: el decodificador (libheif en WebAssembly) pesa ~2.7 MB y solo se necesita con fotos HEIC
  const { heicTo } = await import('heic-to')
  const bitmap = await heicTo({ blob: file, type: 'bitmap' })

  try {
    const scale = Math.min(1, MAX_LONG_EDGE_PX / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')

    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

    const jpeg = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY))
    if (!jpeg)
      throw new Error('el navegador no pudo generar el JPEG')

    return new File([jpeg], `${file.name.replace(/\.[^.]+$/, '')}.jpg`, { type: 'image/jpeg', lastModified: file.lastModified })
  }
  finally {
    bitmap.close()
  }
}

/** Devuelve las fotos listas para subir: las HEIC convertidas a JPEG y el resto sin cambios. */
export async function prepareSheetPhotos(photos: File[]): Promise<File[]> {
  const prepared: File[] = []
  for (const photo of photos) {
    if (!(await isHeicPhoto(photo))) {
      prepared.push(photo)
      continue
    }
    try {
      prepared.push(await heicToJpeg(photo))
    }
    catch (err) {
      console.error('No se pudo convertir la foto HEIC:', photo.name, err)
      throw new Error(`No se pudo leer la foto ${photo.name}. Intenta tomarla de nuevo o súbela en JPEG.`)
    }
  }

  return prepared
}
