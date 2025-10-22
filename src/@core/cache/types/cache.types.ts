/**
 * Tipos genéricos para el sistema de cache
 * Reutilizables en todos los módulos
 */

// Prioridades de cache genéricas
export enum CachePriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

// Estados de sincronización
export enum SyncStatus {
  SYNCED = 'synced',
  PENDING = 'pending',
  CONFLICT = 'conflict',
  ERROR = 'error'
}

// Configuración base de cache
export interface BaseCacheConfig {
  key: string
  priority: CachePriority
  ttl: number // Time to live en minutos
  maxSize: number // Número máximo de registros
  encrypted: boolean // Si requiere encriptación
}

// Configuración de módulo de cache
export interface CacheModuleConfig {
  enabled: boolean
  dbName: string
  dbVersion: number
  stores: Record<string, BaseCacheConfig>
  sync: {
    enabled: boolean
    interval: number
    retryAttempts: number
    conflictResolution: 'server' | 'client' | 'manual'
  }
}

// Estado del cache
export interface CacheState {
  isEnabled: boolean
  lastSync: string | null
  pendingChanges: number
  conflicts: number
  cacheSize: number
  efficiency: number
}

// Datos de cache genéricos
export interface BaseCacheData {
  id: string
  cached_at: string
  version: number
  sync_status: SyncStatus
}

// Configuración de invalidez
export interface InvalidationPolicy {
  strategy: 'time' | 'version' | 'manual' | 'hybrid'
  ttl: number
  maxAge: number
  checkInterval: number
}

// Estadísticas de cache
export interface CacheStats {
  totalItems: number
  hitRate: number
  missRate: number
  averageResponseTime: number
  lastCleanup: string
  memoryUsage: number
}

// Eventos de cache
export interface CacheEvent {
  type: 'set' | 'get' | 'delete' | 'sync' | 'error'
  key: string
  timestamp: string
  data?: any
  error?: string
}

// Configuración de store de IndexedDB
export interface IndexedDBStoreConfig {
  name: string
  keyPath: string
  indexes: Array<{
    name: string
    keyPath: string
    unique?: boolean
  }>
}
