import { describe, expect, it, vi } from 'vitest'
import { isHeicPhoto, prepareSheetPhotos } from '../sheetPhotoUtils'

vi.mock('heic-to', () => ({
  heicTo: vi.fn().mockRejectedValue(new Error('libheif no disponible en pruebas')),
}))

const heicHeader = () => new Uint8Array([0, 0, 0, 24, ...'ftypheic'].map(c => typeof c === 'string' ? c.charCodeAt(0) : c))

describe('isHeicPhoto', () => {
  it('reconoce HEIC por tipo, por extensión o por sus bytes', async () => {
    expect(await isHeicPhoto(new File(['x'], 'hoja.jpg', { type: 'image/heic' }))).toBe(true)
    expect(await isHeicPhoto(new File(['x'], 'IMG_1411.HEIC'))).toBe(true)
    expect(await isHeicPhoto(new File([heicHeader()], 'sin-extension'))).toBe(true)
  })

  it('no confunde un JPEG con HEIC', async () => {
    expect(await isHeicPhoto(new File([new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0])], 'hoja.jpg', { type: 'image/jpeg' }))).toBe(false)
  })
})

describe('prepareSheetPhotos', () => {
  it('deja pasar los JPEG sin tocarlos', async () => {
    const jpeg = new File([new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0])], 'hoja.jpg', { type: 'image/jpeg' })

    expect(await prepareSheetPhotos([jpeg])).toEqual([jpeg])
  })

  it('si una HEIC no se puede convertir, avisa cuál foto fue', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(prepareSheetPhotos([new File([heicHeader()], 'IMG_1411.heic')])).rejects.toThrow('IMG_1411.heic')
  })
})
