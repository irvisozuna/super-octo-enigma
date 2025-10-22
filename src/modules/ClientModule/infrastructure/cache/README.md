# Sistema de Cache de ClientModule (V2)

Sistema de cache refactorizado que utiliza la arquitectura base reutilizable de `@core/cache`.

## 🏗️ Arquitectura

### Estructura del Directorio

```
cache/
├── components/
│   └── ClientCacheStatusIndicatorV2.vue    # Indicador de estado del cache
├── composables/
│   ├── useClientCacheV2.ts                 # Composable principal (V2)
│   └── useClientCacheHybrid.ts             # Composable de compatibilidad
├── services/
│   ├── ClientIndexedDBService.ts           # Servicio de IndexedDB específico
│   └── ClientCacheServiceV2.ts             # Servicio de cache específico
├── index.ts                                # Exportaciones del módulo
└── README.md                               # Este archivo
```

## 🚀 Uso

### Sistema V2 (Recomendado)

```typescript
import { useClientCacheV2 } from './composables/useClientCacheV2'

const {
  cacheClientsList,
  getCachedClientsList,
  searchCachedClients,
  cacheStats,
  isCacheAvailable,
  forceSync,
  clearCache
} = useClientCacheV2()

// Cachear lista de clientes
await cacheClientsList(clients)

// Obtener del cache
const cachedClients = await getCachedClientsList()

// Buscar clientes
const filteredClients = await searchCachedClients({
  status: 'active',
  business_type: 'corporation'
})
```

### Sistema Híbrido (Compatibilidad)

```typescript
import { useClientCacheHybrid } from './composables/useClientCacheHybrid'

const {
  cacheClients,        // API compatible con sistema anterior
  getCachedClients,    // API compatible con sistema anterior
  clearCache,
  forceSync
} = useClientCacheHybrid()

// Usar API compatible
await cacheClients(clients)
const cached = await getCachedClients()
```

### Componente de Estado

```vue
<template>
  <ClientCacheStatusIndicatorV2
    :show-detailed-info="true"
    :show-actions="true"
    variant="chip"
  />
</template>

<script setup>
import ClientCacheStatusIndicatorV2 from './components/ClientCacheStatusIndicatorV2.vue'
</script>
```

## 🔧 Configuración

### Inicialización

```typescript
import { initializeClientCacheSystem } from './index'

// Inicializar el sistema
await initializeClientCacheSystem()
```

### Información del Sistema

```typescript
import { getCacheSystemInfo } from './index'

const info = await getCacheSystemInfo()
console.log('Sistema actual:', info.currentSystem) // 'v2'
console.log('Estadísticas:', info.stats)
```

## 📊 Características

### Funcionalidades Principales

- ✅ **Cache inteligente** con IndexedDB
- ✅ **Sincronización automática** con servidor
- ✅ **Búsqueda avanzada** en cache
- ✅ **Estadísticas en tiempo real**
- ✅ **Gestión de errores** robusta
- ✅ **API compatible** con sistema anterior

### Tipos de Datos Soportados

- **Lista de clientes** (`clients_list`)
- **Cliente individual** (`client_{id}`)
- **Contactos** (`contacts_list`)
- **Estadísticas** (`client_statistics`)

### Configuración de Cache

- **TTL**: 5 minutos para clientes, 15 para contactos, 60 para estadísticas
- **Prioridad**: HIGH para clientes, MEDIUM para contactos, LOW para estadísticas
- **Encriptación**: Deshabilitada (datos no sensibles)
- **Sincronización**: Cada 5 minutos

## 🎯 Beneficios

1. **Reutilización**: 90% del código es reutilizable
2. **Mantenibilidad**: Cambios centralizados en `@core/cache`
3. **Performance**: Optimizaciones centralizadas
4. **Consistencia**: Comportamiento uniforme
5. **Escalabilidad**: Fácil replicar en otros módulos
6. **Compatibilidad**: API compatible con sistema anterior

## 🔄 Migración

### Desde Sistema Anterior

El sistema híbrido proporciona compatibilidad total con la API anterior:

```typescript
// Antes
import { useClientCache } from './useClientCache'

// Después (compatible)
import { useClientCacheHybrid } from './useClientCacheHybrid'

// La API es idéntica
const { cacheClients, getCachedClients } = useClientCacheHybrid()
```

### A Sistema V2

Para nuevos desarrollos, usar directamente el sistema V2:

```typescript
import { useClientCacheV2 } from './useClientCacheV2'

const { cacheClientsList, getCachedClientsList } = useClientCacheV2()
```

## 🐛 Debugging

### Logs Disponibles

- `💾 Datos cacheados: {key}`
- `📖 Datos obtenidos del cache: {key}`
- `🗑️ Datos eliminados del cache: {key}`
- `🔄 Sincronización forzada completada`
- `✅ Cache de clientes inicializado`

### Herramientas de Debug

```typescript
// Obtener estadísticas
const stats = await cache.getCacheStats()

// Verificar estado
const state = cache.cacheState.value

// Limpiar cache
await cache.clearCache()
```

## 📚 Referencias

- [Sistema Base de Cache](../../@core/cache/README.md)
- [Tipos de Cache](../../@core/cache/types/cache.types.ts)
- [Componente Base](../../@core/cache/components/BaseCacheStatusIndicator.vue)
