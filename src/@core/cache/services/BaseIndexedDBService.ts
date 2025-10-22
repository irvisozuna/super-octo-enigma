/**
 * Servicio base de IndexedDB reutilizable
 * Implementa operaciones CRUD genéricas para cualquier módulo
 */

import type { IndexedDBStoreConfig } from '../types/cache.types'

export abstract class BaseIndexedDBService {
  protected dbName: string
  protected dbVersion: number
  protected stores: Record<string, IndexedDBStoreConfig>
  private db: IDBDatabase | null = null

  constructor(dbName: string, dbVersion: number, stores: Record<string, IndexedDBStoreConfig>) {
    this.dbName = dbName
    this.dbVersion = dbVersion
    this.stores = stores
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => {
        console.error('Error al abrir IndexedDB:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log(`✅ IndexedDB ${this.dbName} inicializado correctamente`)
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        // Crear stores dinámicamente
        Object.values(this.stores).forEach(storeConfig => {
          if (!db.objectStoreNames.contains(storeConfig.name)) {
            const store = db.createObjectStore(storeConfig.name, { 
              keyPath: storeConfig.keyPath 
            })
            
            // Crear índices
            storeConfig.indexes.forEach(index => {
              store.createIndex(index.name, index.keyPath, { unique: index.unique || false })
            })
          }
        })
      }
    })
  }

  protected async getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    if (!this.db) {
      throw new Error('IndexedDB no está inicializado')
    }

    const transaction = this.db.transaction([storeName], mode)
    return transaction.objectStore(storeName)
  }

  // Operaciones CRUD genéricas
  async set<T>(storeName: string, data: T): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite')

    return new Promise((resolve, reject) => {
      const request = store.put(data)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async get<T>(storeName: string, id: string): Promise<T | null> {
    const store = await this.getStore(storeName)

    return new Promise((resolve, reject) => {
      const request = store.get(id)

      request.onsuccess = () => {
        resolve(request.result || null)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    const store = await this.getStore(storeName)

    return new Promise((resolve, reject) => {
      const request = store.getAll()

      request.onsuccess = () => {
        resolve(request.result || [])
      }
      request.onerror = () => reject(request.error)
    })
  }

  async delete(storeName: string, id: string): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite')

    return new Promise((resolve, reject) => {
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async clear(storeName: string): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite')

    return new Promise((resolve, reject) => {
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async count(storeName: string): Promise<number> {
    const store = await this.getStore(storeName)

    return new Promise((resolve, reject) => {
      const request = store.count()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Método para obtener estadísticas
  async getStats(): Promise<Record<string, number>> {
    const stats: Record<string, number> = {}
    
    for (const storeName of Object.keys(this.stores)) {
      try {
        stats[storeName] = await this.count(storeName)
      } catch (error) {
        console.error(`Error obteniendo estadísticas para ${storeName}:`, error)
        stats[storeName] = 0
      }
    }

    return stats
  }

  // Método para limpiar cache expirado
  async cleanupExpired(storeName: string, ttlMinutes: number): Promise<number> {
    const store = await this.getStore(storeName, 'readwrite')
    const cutoffTime = new Date(Date.now() - ttlMinutes * 60 * 1000).toISOString()
    let deletedCount = 0

    return new Promise((resolve, reject) => {
      const request = store.openCursor()

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        
        if (cursor) {
          const data = cursor.value
          
          if (data.cached_at && data.cached_at < cutoffTime) {
            cursor.delete()
            deletedCount++
          }
          
          cursor.continue()
        } else {
          resolve(deletedCount)
        }
      }

      request.onerror = () => reject(request.error)
    })
  }
}
