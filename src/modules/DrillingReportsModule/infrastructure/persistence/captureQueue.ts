/**
 * Cola de fotos de hojas en el teléfono (IndexedDB): en la mina casi no hay señal. La foto se guarda aquí
 * y se sube sola cuando hay conexión; si la app se cierra, sigue en la cola al volver a abrirla.
 *
 * Cada foto es de quien la tomó (ownerId): si el teléfono es compartido, cada usuario solo ve y sube las suyas.
 */

import Dexie, { type Table } from 'dexie'
import { AiCaptureApiService } from '../api/services/AiCaptureApiService'

export type QueuedPhotoStatus = 'pending' | 'uploading' | 'uploaded' | 'failed'

export interface QueuedPhoto {
  id: string
  ownerId: string
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
    this.version(2).stores({ photos: 'id, ownerId, status, createdAt' })
  }
}

let database: CaptureQueueDatabase | null = null
const db = () => (database ??= new CaptureQueueDatabase())

/** Usuario con sesión; sin sesión no se muestra ni se sube nada. */
function currentUserId(): string | null {
  const user = useCookie<{ id?: string | number } | null>('userData').value

  return user?.id != null ? String(user.id) : null
}

const mine = (ownerId: string) => db().photos.where('ownerId').equals(ownerId)

export const captureQueue = {
  async add(photo: Omit<QueuedPhoto, 'id' | 'ownerId' | 'status' | 'createdAt'>): Promise<QueuedPhoto> {
    const ownerId = currentUserId()
    if (!ownerId)
      throw new Error('Inicia sesión para capturar hojas')
    const item: QueuedPhoto = { ...photo, id: crypto.randomUUID(), ownerId, status: 'pending', createdAt: Date.now() }

    await db().photos.put(item)

    return item
  },

  async list(): Promise<QueuedPhoto[]> {
    const ownerId = currentUserId()
    if (!ownerId)
      return []

    return (await mine(ownerId).toArray()).sort((a, b) => b.createdAt - a.createdAt)
  },

  async remove(id: string) {
    const ownerId = currentUserId()
    if (ownerId)
      await db().photos.where({ id, ownerId }).delete()
  },

  /** Las ya subidas se guardan un día para ver su avance; luego se limpian solas. */
  async prune(maxAgeMs = 24 * 60 * 60 * 1000) {
    const limit = Date.now() - maxAgeMs

    // De cualquier usuario: lo ya subido no hace falta en el teléfono. Las fotos de antes del dueño por foto se descartan.
    await db().photos.filter(photo => !photo.ownerId || (photo.status === 'uploaded' && photo.createdAt < limit)).delete()
  },

  /** Sube lo pendiente, una por una. Sin conexión no intenta. Devuelve cuántas se subieron. */
  async uploadPending(): Promise<number> {
    const ownerId = currentUserId()
    if (!ownerId || (typeof navigator !== 'undefined' && !navigator.onLine))
      return 0

    const pending = (await mine(ownerId).toArray())
      .filter(photo => photo.status === 'pending' || photo.status === 'failed')
      .sort((a, b) => a.createdAt - b.createdAt)

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
