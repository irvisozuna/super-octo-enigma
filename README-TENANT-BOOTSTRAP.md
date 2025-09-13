# Sistema de Tenant Bootstrap

Este documento describe la implementación del sistema de tenant bootstrap en el proyecto Vue 3.

## Descripción

El sistema permite cargar la configuración de la compañía (branding, tema, i18n) **antes** de montar la aplicación para evitar FOUC (Flash of Unstyled Content) y asegurar el contexto correcto desde el primer paint.

## Arquitectura

### Componentes Principales

1. **Store de Tenant** (`src/stores/tenant.store.ts`)
   - Maneja el estado global del tenant
   - Incluye cache con localStorage
   - Invalidación por versión

2. **Servicio de Bootstrap** (`src/services/tenantBootstrapService.ts`)
   - Resuelve tenant basado en host o query parameter
   - Aplica branding dinámicamente
   - Maneja errores y fallbacks

3. **Inicialización** (`src/@core/initTenant.ts`)
   - Se integra con el patrón de inicialización existente
   - Se ejecuta en `App.vue` junto con `initCore()` e `initConfigStore()`
   - No bloquea el render inicial

4. **Componentes de UI**
   - `TenantBootstrapLoader.vue`: Loader con branding del tenant
   - `TenantErrorScreen.vue`: Pantalla de error para dominios no reconocidos

5. **Sistema de Tema** (`src/composables/useTenantTheme.ts`)
   - Integración con Vuetify y el sistema de configuración existente
   - Variables CSS dinámicas
   - Aplicación automática de colores
   - Respeto por las preferencias del usuario guardadas en cookies/localStorage

## Flujo de Ejecución

```
1. Usuario accede a la app
2. Vue monta la app y ejecuta App.vue
3. Se ejecutan las inicializaciones: initCore(), initConfigStore(), initTenant()
4. initTenant() inicia el bootstrap del tenant de manera asíncrona
5. Mientras tanto, se muestra TenantBootstrapLoader si está cargando
6. Detectar host (o ?tenant= en dev)
7. Verificar cache en localStorage
8. Si no hay cache válido → llamar /api/public/tenant
9. Aplicar branding (favicon, título, colores)
10. Actualizar store de tenant
11. Persistir en localStorage
12. La UI reacciona y muestra la app normal
```

## Configuración

### Variables de Entorno

- `VITE_API_BASE_URL`: URL base de la API (opcional, default: '/api')
- `VITE_API_ORGANIZATION`: Organización fallback (opcional)

### Endpoint del Backend

El sistema espera un endpoint `POST /api/public/tenant` que reciba:

```json
{
  host: 'ejemplo.com',
  tenant: 'ejemplo' // opcional, para modo dev
}
```

Y retorne:

```json
{
  companyId: 'uuid',
  slug: 'ejemplo',
  name: 'Empresa Ejemplo',
  assets: {
    logo: 'https://...',
    favicon: 'https://...',
    loading: 'https://...'
  },
  theme: {
    primary: '#7367F0',
    secondary: '#8C9EFF',
    dark: false,
  },
  i18n: {
    locale: 'es',
    timezone: 'UTC'
  },
  plan: 'premium',
  flags: {},
  version: '1.0.0'
}
```

## Uso en Desarrollo

### Con Query Parameters

```
http://localhost:5173/?tenant=empresa1
http://localhost:5173/?tenant=empresa2
```

### Con Hosts Locales

Configurar `/etc/hosts`:
```
127.0.0.1 empresa1.localhost
127.0.0.1 empresa2.localhost
```

Luego acceder:
```
http://empresa1.localhost:5173
http://empresa2.localhost:5173
```

## Testing

### Utilidades de Prueba

El archivo `src/utils/tenantTestHelper.ts` incluye utilidades para pruebas:

```typescript
import { TenantTestHelper } from '@/utils/tenantTestHelper'

// Limpiar cache
TenantTestHelper.clearCache()

// Simular errores
TenantTestHelper.simulateError('network')
TenantTestHelper.simulateError('not-found')
TenantTestHelper.simulateError('timeout')

// Restaurar comportamiento normal
TenantTestHelper.restoreFetch()
```

### Escenarios de Prueba

1. **Carga exitosa**: Verificar que se aplica el branding correcto
2. **Cache**: Verificar que se usa cache en recargas
3. **Errores de red**: Verificar pantalla de error
4. **Dominio no encontrado**: Verificar fallback a VITE_API_ORGANIZATION
5. **Datos inválidos**: Verificar manejo de errores

## Integración con APIs

Los servicios API existentes se actualizaron para usar la organización del tenant:

- `src/composables/useApi.ts`
- `src/services/api.ts`
- `src/services/apiService.ts`

Todos incluyen fallback a `VITE_API_ORGANIZATION` si el tenant no está disponible.

## Router Guards

El router incluye guards que verifican que el tenant esté listo antes de permitir navegación:

- `/tenant-loading`: Pantalla de carga
- `/tenant-error`: Pantalla de error

## Cache y Persistencia

- **Clave**: `tenantBoot` en localStorage
- **TTL**: 15 minutos (configurable)
- **Invalidación**: Por campo `version`
- **Fallback**: Variable de entorno `VITE_API_ORGANIZATION`

## Compatibilidad

- ✅ Vue 3 + Composition API
- ✅ Pinia para estado global
- ✅ Vuetify para UI
- ✅ TypeScript
- ✅ Modo desarrollo y producción
- ✅ Fallback a configuración existente
- ✅ Respeta preferencias del usuario en cookies/localStorage
- ✅ Sincronización con `config.ts` existente

## Troubleshooting

### Problemas Comunes

1. **Error de Pinia**: "getActivePinia() was called but there was no active Pinia"
   - **Causa**: El servicio se instancia antes de que Pinia esté disponible
   - **Solución**: El servicio usa lazy initialization con getters para evitar la instanciación temprana
   
2. **FOUC**: Verificar que el bootstrap se ejecuta antes del mount
3. **Colores no se aplican**: Verificar que el tema se aplica después de resolver tenant
4. **Cache no funciona**: Verificar localStorage y TTL
5. **APIs fallan**: Verificar que la organización se pasa correctamente

### Debug

```typescript
// En consola del navegador
const tenantStore = useTenantStore()
console.log('Tenant data:', tenantStore.data)
console.log('Is ready:', tenantStore.isReady)
console.log('Organization:', tenantStore.organization)

// Para acceder al servicio de bootstrap
import { tenantBootstrapService } from '@/services/tenantBootstrapService'
console.log('Current organization:', tenantBootstrapService.getCurrentOrganization())
```

## Próximos Pasos

1. Implementar endpoint real en el backend
2. Configurar CDN para assets de tenant
3. Añadir tests unitarios
4. Optimizar performance del bootstrap
5. Añadir métricas de carga
