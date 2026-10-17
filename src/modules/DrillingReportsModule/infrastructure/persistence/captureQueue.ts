/**
 * Cola de fotos de hojas en el teléfono (IndexedDB): en la mina casi no hay señal. La foto se guarda aquí
 * y se sube sola cuando hay conexión; si la app se cierra, sigue en la cola al volver a abrirla.
 */

import Dexie, { type Table } from 'dexie'
import { AiCaptureApiService } from '../api/services/AiCaptureApiService'

export type QueuedPhotoStatus = 'pending' | 'uploading' | 'uploaded' | 'failed'

export interface QueuedPhoto {
  id: string
  projectId: string
  wellId: string
  name: string
  blob: Blob
  status: QueuedPhotoStatus
  importId?: string | null
  error?: string | null
  createdAt: number
}

class CaptureQueueDatabase extends Dexie {
  photos!: Table<QueuedPhoto, string>

  constructor() {
    super('simo-capture-queue')
    this.version(1).stores({ photos: 'id, status, createdAt' })
  }
}

let database: CaptureQueueDatabase | null = null
const db = () => (database ??= new CaptureQueueDatabase())

export const captureQueue = {
  async add(photo: Omit<QueuedPhoto, 'id' | 'status' | 'createdAt'>): Promise<QueuedPhoto> {
    const item: QueuedPhoto = { ...photo, id: crypto.randomUUID(), status: 'pending', createdAt: Date.now() }

    await db().photos.put(item)

    return item
  },

  list: () => db().photos.orderBy('createdAt').reverse().toArray(),

  remove: (id: string) => db().photos.delete(id),

  /** Las ya subidas se guardan un día para ver su avance; luego se limpian solas. */
  async prune(maxAgeMs = 24 * 60 * 60 * 1000) {
    const limit = Date.now() - maxAgeMs

    await db().photos.where('status').equals('uploaded').and(photo => photo.createdAt < limit).delete()
  },

  /** Sube lo pendiente, una por una. Sin conexión no intenta. Devuelve cuántas se subieron. */
  async uploadPending(): Promise<number> {
    if (typeof navigator !== 'undefined' && !navigator.onLine)
      return 0
    const pending = await db().photos.where('status').anyOf('pending', 'failed').sortBy('createdAt')
    let uploaded = 0
    for (const photo of pending) {
      await db().photos.update(photo.id, { status: 'uploading', error: null })
      try {
        const file = new File([photo.blob], photo.name, { type: photo.blob.type || 'image/jpeg' })
        const [created] = await AiCaptureApiService.upload(photo.projectId, photo.wellId, [file])

        await db().photos.update(photo.id, { status: 'uploaded', importId: created?.id ?? null })
        uploaded++
      }
      catch (err: any) {
        // Sin red se reintenta después; un rechazo del servidor (p. ej. 422) queda como error visible
        await db().photos.update(photo.id, { status: 'failed', error: err?.message || 'No se pudo subir' })
        if (!navigator.onLine)
          break
      }
    }

    return uploaded
  },
}
