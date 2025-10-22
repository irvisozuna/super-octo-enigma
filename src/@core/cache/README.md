# Sistema de Cache Reutilizable

Este sistema de cache está diseñado para ser reutilizable en todos los módulos de la aplicación, siguiendo principios DDD y Clean Code.

## 🏗️ Arquitectura

### Capas del Sistema

1. **`@core/cache/types/`** - Tipos y interfaces genéricas
2. **`@core/cache/services/`** - Servicios base reutilizables
3. **`@core/cache/composables/`** - Composables base
4. **`@core/cache/components/`** - Componentes base
5. **`@core/cache/utils/`** - Utilidades y generadores

### Principios de Diseño

- **DRY (Don't Repeat Yourself)**: Lógica común centralizada
- **Single Responsibility**: Cada clase tiene una responsabilidad específica
- **Open/Closed**: Extensible sin modificar código existente
- **Dependency Inversion**: Depende de abstracciones, no de implementaciones

## 🚀 Uso Rápido

### 1. Crear Servicio de IndexedDB Específico

```typescript
// EmployeeModule/infrastructure/cache/services/EmployeeIndexedDBService.ts
import { BaseIndexedDBService } from '@/@core/cache/services/BaseIndexedDBService'

export class EmployeeIndexedDBService extends BaseIndexedDBService {
  constructor() {
    const stores = {
      employees: {
        name: 'employees',
        keyPath: 'id',
        indexes: [
          { name: 'employee_code', keyPath: 'employee_code', unique: true },
          { name: 'status', keyPath: 'status' }
        ]
      }
    }

    super('EmployeeModuleCache', 1, stores)
  }
}
```

### 2. Crear Servicio de Cache Específico

```typescript
// EmployeeModule/infrastructure/cache/services/EmployeeCacheService.ts
import { BaseCacheService } from '@/@core/cache/services/BaseCacheService'
import { EmployeeIndexedDBService } from './EmployeeIndexedDBService'

export class EmployeeCacheService extends BaseCacheService {
  constructor() {
    const indexedDB = new EmployeeIndexedDBService()
    const config = generateModuleCacheConfig('EmployeeModule', 'FREQUENT_UPDATES', {
      employees: createStoreConfig('employees', CachePriority.HIGH, 10, 2000)
    })

    super(indexedDB, config)
  }

  // Implementar métodos abstractos
  protected getStoreNameByKey(key: string): string {
    return key.includes('employees') ? 'employees' : 'statistics'
  }

  protected getConfigByKey(key: string) {
    return this.config.stores[this.getStoreNameByKey(key)]
  }
}
```

### 3. Crear Composable Específico

```typescript
// EmployeeModule/infrastructure/cache/composables/useEmployeeCache.ts
import { useBaseCache } from '@/@core/cache/composables/useBaseCache'
import { EmployeeCacheService } from '../services/EmployeeCacheService'

export function useEmployeeCache() {
  const cacheService = new EmployeeCacheService()
  const baseCache = useBaseCache(cacheService, 'EmployeeModule')

  // Funcionalidad específica
  async function cacheEmployees(employees: any[]) {
    await cacheService.set('employees_list', employees)
  }

  return {
    ...baseCache,
    cacheEmployees
  }
}
```

### 4. Crear Componente de Estado

```vue
<!-- EmployeeModule/infrastructure/cache/components/EmployeeCacheStatusIndicator.vue -->
<template>
  <BaseCacheStatusIndicator
    :cache-composable="employeeCache"
    module-name="Empleados"
  />
</template>

<script setup>
import BaseCacheStatusIndicator from '@/@core/cache/components/BaseCacheStatusIndicator.vue'
import { useEmployeeCache } from '../composables/useEmployeeCache'

const employeeCache = useEmployeeCache()
</script>
```

## 📋 Checklist de Implementación

### Para cada módulo nuevo:

- [ ] Crear `ModuleIndexedDBService` extendiendo `BaseIndexedDBService`
- [ ] Crear `ModuleCacheService` extendiendo `BaseCacheService`
- [ ] Implementar métodos abstractos requeridos
- [ ] Crear `useModuleCache` composable
- [ ] Crear `ModuleCacheStatusIndicator` componente
- [ ] Configurar tipos específicos del módulo
- [ ] Agregar traducciones para el módulo

### Métodos abstractos a implementar:

1. **`getStoreNameByKey(key: string): string`**
   - Mapear claves a nombres de stores

2. **`getConfigByKey(key: string): CacheConfig`**
   - Obtener configuración específica por clave

3. **`transformDataForCache(data: any, key: string): any`** (opcional)
   - Transformar datos antes de guardar

4. **`transformDataFromCache(data: any, key: string): any`** (opcional)
   - Transformar datos después de obtener

## 🔧 Configuración Avanzada

### Usar Presets de Configuración

```typescript
import { generateModuleCacheConfig, CACHE_PRESETS, createStoreConfig } from '@/@core/cache/utils/cacheConfigGenerator'

// Para datos sensibles
const config = generateModuleCacheConfig('DocumentsModule', 'SENSITIVE', {
  documents: createStoreConfig('documents', CachePriority.HIGH, 15, 5000, true)
})

// Para datos frecuentemente actualizados
const config = generateModuleCacheConfig('InventoryModule', 'FREQUENT_UPDATES', {
  inventory: createStoreConfig('inventory', CachePriority.HIGH, 5, 10000)
})
```

### Personalizar Comportamiento

```typescript
export class CustomCacheService extends BaseCacheService {
  // Sobrescribir métodos para personalizar comportamiento
  async set<T>(key: string, data: T, priority: CachePriority = CachePriority.MEDIUM): Promise<void> {
    // Lógica personalizada antes de guardar
    console.log(`Guardando ${key} con prioridad ${priority}`)
    
    // Llamar al método base
    await super.set(key, data, priority)
    
    // Lógica personalizada después de guardar
    await this.notifySubscribers(key, data)
  }
}
```

## 🎯 Beneficios

1. **Reutilización**: 90% del código es reutilizable
2. **Consistencia**: Comportamiento uniforme en todos los módulos
3. **Mantenibilidad**: Cambios centralizados se propagan automáticamente
4. **Testabilidad**: Fácil de testear con mocks
5. **Escalabilidad**: Fácil agregar nuevos módulos
6. **Performance**: Optimizaciones centralizadas

## 🐛 Debugging

### Logs Disponibles

- `💾 Datos cacheados: {key}`
- `📖 Datos obtenidos del cache: {key}`
- `🗑️ Datos eliminados del cache: {key}`
- `🧹 Cache limpiado completamente`
- `🔄 Sincronización forzada completada`

### Herramientas de Debug

```typescript
// Obtener estadísticas
const stats = await cacheService.getStats()

// Limpiar datos expirados
const deleted = await cacheService.cleanupExpired()

// Obtener estado del cache
const state = cacheService.getState()
```

## 📚 Ejemplos Completos

Ver los ejemplos implementados en:
- `EmployeeModule/infrastructure/cache/`
- `DocumentsModule/infrastructure/cache/`
- `ClientModule/infrastructure/cache/` (implementación original)
