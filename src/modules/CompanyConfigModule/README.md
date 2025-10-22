# Company Configuration Module

Este módulo maneja la configuración de tema, branding y personalización de la compañía.

## 📋 Características

### Configuraciones que se pueden guardar:

- **Colores**:
  - Primary Color (y su variante darken)
  - Secondary Color (y su variante darken)

- **Tema**:
  - Light / Dark / System

- **Apariencia**:
  - Skin: Default / Bordered
  - Semi Dark Menu (solo en modo light)

- **Layout**:
  - Layout: Vertical / Collapsed / Horizontal
  - Content Width: Boxed / Fluid

- **Branding**:
  - App Title (título de la aplicación)
  - Login Logo (logo en la página de login)
  - Menu Logo (logo en el menú lateral)
  - Favicon (ícono en el navegador)

## 🏗️ Arquitectura

El módulo sigue los principios de Domain-Driven Design (DDD):

```
CompanyConfigModule/
├── domain/
│   ├── entities/
│   │   └── CompanyConfigEntity.ts      # Entidad de configuración
│   └── repositories/
│       └── CompanyConfigRepository.ts  # Interface del repositorio
├── application/
│   └── usecases/
│       ├── LoadCompanyConfigUseCase.ts # Cargar configuración
│       └── SaveCompanyConfigUseCase.ts # Guardar configuración
├── infrastructure/
│   ├── api/
│   │   └── CompanyConfigApiService.ts  # Servicio API
│   └── cache/
│       └── CompanyConfigCacheService.ts # Servicio de caché
└── presentation/
    └── stores/
        └── companyConfigStore.ts       # Store de Pinia
```

## 🚀 Uso

### 1. Integración en el Layout

Reemplaza el customizer original por el nuevo que soporta guardado:

```vue
<!-- En tu layout principal -->
<template>
  <div>
    <!-- Tu contenido -->

    <!-- Customizer con guardado -->
    <customizerWithSave />
  </div>
</template>

<script setup>
import customizerWithSave from '@/components/customizerWithSave.vue'
</script>
```

### 2. Carga automática con el Tenant

La configuración se carga automáticamente cuando se inicializa el tenant en `tenantBootstrapService.ts`:

```typescript
// Esto ya está integrado, no necesitas hacer nada
async bootstrap() {
  // ... carga el tenant
  // Luego carga la configuración de la compañía
  await this.loadCompanyConfiguration(tenantData.companyId)
}
```

### 3. Usar el Store manualmente

Si necesitas acceder a la configuración desde otro componente:

```vue
<script setup>
import { useCompanyConfigStore } from '@/modules/CompanyConfigModule/presentation/stores/companyConfigStore'
import { storeToRefs } from 'pinia'

const companyConfigStore = useCompanyConfigStore()
const { config, loading, saving } = storeToRefs(companyConfigStore)

// Obtener configuración actual
console.log(config.value)

// Cargar configuración manualmente
await companyConfigStore.loadConfig('company-id')

// Actualizar configuración
companyConfigStore.updateConfig({
  primaryColor: '#FF0000',
  appTitle: 'Mi App'
})

// Guardar cambios
await companyConfigStore.saveConfig()

// Forzar recarga desde servidor
await companyConfigStore.forceRefresh('company-id')
```

## 🎨 Flujo de Personalización

### Para el Usuario:

1. **Abrir el Customizer**: Click en el ícono de configuración (engranaje) en la esquina superior derecha
2. **Editar valores**: Cambiar colores, tema, layout, logos, etc.
3. **Preview**: Click en "Preview Changes" para ver los cambios temporalmente
4. **Guardar**: Click en "Save Configuration" para guardar permanentemente
5. **Cancelar**: Si cierra el panel sin guardar, los cambios se revierten automáticamente

### Estados del Customizer:

- **Sin cambios**: Los botones están deshabilitados
- **Con cambios**: Badge rojo en el botón de reset, botones habilitados
- **Preview activo**: Los cambios se ven pero no están guardados
- **Guardando**: Loading en el botón de guardar

## 💾 Sistema de Caché

El módulo implementa un sistema de caché inteligente:

- **Cache local**: Usa IndexedDB (Dexie) para guardar la configuración
- **TTL**: 24 horas de duración del cache
- **Versionado**: Usa un número de versión para invalidar cache automáticamente
- **Fallback**: Si falla la API, usa el cache como respaldo

### Flujo de carga:

```
1. Usuario accede → tenantBootstrapService carga tenant
2. Se intenta cargar desde cache
3. Si cache es válido y la versión coincide → usa cache
4. Si no → carga desde API
5. Guarda en cache para futura carga
```

## 🔌 Endpoints del Backend

El backend debe implementar estos endpoints:

### GET `/api/companies/{companyId}/configuration`
Obtiene la configuración de la compañía.

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "companyId": "uuid",
    "primaryColor": "#7367F0",
    "primaryDarkenColor": "#675DD8",
    "secondaryColor": "#FF9F43",
    "secondaryDarkenColor": "#E6892E",
    "theme": "light",
    "skin": "default",
    "semiDarkMenu": false,
    "layout": "vertical",
    "contentWidth": "fluid",
    "appTitle": "My Application",
    "loginLogo": "https://example.com/logo-login.png",
    "menuLogo": "https://example.com/logo-menu.png",
    "favicon": "https://example.com/favicon.ico",
    "version": 1,
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### POST `/api/companies/{companyId}/configuration`
Guarda la configuración de la compañía.

**Request Body:**
```json
{
  "companyId": "uuid",
  "primaryColor": "#7367F0",
  "primaryDarkenColor": "#675DD8",
  // ... resto de campos
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "companyId": "uuid",
    // ... configuración guardada con version incrementada
    "version": 2,
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### GET `/api/companies/{companyId}/configuration/version`
Obtiene solo el número de versión de la configuración (para validar cache).

**Response:**
```json
{
  "version": 2
}
```

### POST `/api/companies/{companyId}/configuration/logo`
Sube un logo (login, menu o favicon).

**Request (FormData):**
- `file`: El archivo de imagen
- `type`: 'login' | 'menu' | 'favicon'

**Response:**
```json
{
  "url": "https://example.com/storage/companies/{companyId}/logos/xyz.png",
  "type": "menu",
  "message": "Logo uploaded successfully"
}
```

**Nota:** La URL puede venir sin protocolo (ej: `www.example.com/...`), el frontend automáticamente agrega `https://` si es necesario.

## 🔐 Autenticación

Todos los requests usan `rawApi` que automáticamente incluye:

- **Authorization**: Bearer token desde las cookies
- **X-Organization**: Organización del tenant actual
- **Content-Type**: application/json (o multipart/form-data para uploads)

## 📝 Tipos TypeScript

```typescript
interface CompanyConfigEntity {
  id?: string
  companyId: string

  // Theme colors
  primaryColor: string
  primaryDarkenColor: string
  secondaryColor: string
  secondaryDarkenColor: string

  // Theme settings
  theme: 'light' | 'dark' | 'system'
  skin: 'default' | 'bordered'
  semiDarkMenu: boolean

  // Layout settings
  layout: 'vertical' | 'collapsed' | 'horizontal'
  contentWidth: 'boxed' | 'fluid'

  // Branding
  appTitle: string
  loginLogo?: string
  menuLogo?: string
  favicon?: string

  // Metadata
  updatedAt?: string
  updatedBy?: string
  version?: number
}
```

## 🐛 Debug

Para debug, revisa los console.log en:

```javascript
// Carga de configuración
console.log('Loading company configuration for:', companyId)
console.log('Company configuration loaded successfully')

// Upload de logos
console.log(`${type} logo uploaded successfully:`, url)

// Errores
console.error('Error fetching company config:', error)
console.error('Error uploading logo:', error)
```

## 🔄 Actualizar Configuración desde Código

Si necesitas actualizar la configuración programáticamente:

```typescript
import { useCompanyConfigStore } from '@/modules/CompanyConfigModule/presentation/stores/companyConfigStore'

const companyConfigStore = useCompanyConfigStore()

// Opción 1: Actualizar solo el store (sin guardar)
companyConfigStore.updateConfig({
  primaryColor: '#FF0000',
  appTitle: 'Nueva App'
})

// Opción 2: Actualizar y guardar
companyConfigStore.updateConfig({
  primaryColor: '#FF0000'
})
await companyConfigStore.saveConfig()

// Opción 3: Aplicar configuración directamente
await companyConfigStore.applyConfiguration(newConfig)
```

## 📦 Dependencias

- **Dexie**: IndexedDB wrapper para cache local
- **Pinia**: State management
- **Vuetify**: UI framework y temas
- **VueUse**: Utilidades de Vue (useStorage)

## 🎯 Mejoras Futuras

- [ ] Notificaciones toast al guardar/error
- [ ] Validación de tamaño/formato de imágenes
- [ ] Preview de logos antes de subir
- [ ] Deshacer/Rehacer cambios
- [ ] Exportar/Importar configuración
- [ ] Templates de configuración predefinidos
