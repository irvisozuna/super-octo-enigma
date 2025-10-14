# Client Module

Módulo completo de gestión de clientes siguiendo arquitectura DDD (Domain-Driven Design) y Clean Architecture.

## 📋 Características

### Funcionalidades Principales
- ✅ **CRUD Completo** de clientes (Crear, Leer, Actualizar, Eliminar)
- ✅ **Gestión de Estados** (Activo, Inactivo, Suspendido, Lista Negra)
- ✅ **Gestión de Contactos** múltiples por cliente
- ✅ **Historial de Cambios** de estado con auditoría
- ✅ **Información Fiscal** (RFC, Régimen, Uso de CFDI) - Específico para México
- ✅ **Términos Comerciales** (Términos de pago, límite de crédito, días de crédito, descuento)
- ✅ **Exportación de Datos** (Excel, CSV, PDF)
- ✅ **Estadísticas** y reportes de clientes
- ✅ **Búsqueda y Filtrado** avanzado
- ✅ **Validación de RFC** mexicano
- ✅ **Sistema de Permisos** con CASL

### Tipos de Cliente
- **Empresa (Company)**: Clientes corporativos con razón social
- **Persona Física (Individual)**: Clientes individuales

## 🏗️ Arquitectura

### Estructura DDD

```
ClientModule/
├── domain/                          # Capa de Dominio (Business Logic)
│   ├── entities/
│   │   └── ClientEntity.ts         # Entidades de negocio
│   └── repositories/
│       └── ClientRepository.ts     # Interfaz del repositorio
│
├── application/                     # Capa de Aplicación (Use Cases)
│   ├── dtos/
│   │   └── ClientDtos.ts           # Data Transfer Objects
│   ├── mappers/
│   │   └── ClientMapper.ts         # Mapeo entre DTOs y Entidades
│   └── services/
│       └── ClientApplicationService.ts  # Servicios de aplicación
│
├── infrastructure/                  # Capa de Infraestructura (External)
│   ├── api/
│   │   └── services/
│   │       └── ClientApiService.ts # Servicio HTTP API
│   └── persistence/
│       └── repositories/
│           └── ClientRepositoryImpl.ts  # Implementación del repositorio
│
├── presentation/                    # Capa de Presentación (UI)
│   ├── views/
│   │   ├── ClientList.vue          # Vista de lista
│   │   ├── ClientCreate.vue        # Vista de creación
│   │   ├── ClientEdit.vue          # Vista de edición
│   │   └── ClientDetail.vue        # Vista de detalle
│   ├── components/
│   │   └── organisms/
│   │       ├── ContactsListOrganism.vue        # Gestión de contactos
│   │       └── ClientStatusHistoryOrganism.vue # Historial de cambios
│   ├── stores/
│   │   └── clientStore.ts          # Pinia Store
│   ├── composables/
│   │   └── useClient.ts            # Composable reutilizable
│   └── locales/
│       ├── es.json                 # Traducciones español
│       └── en.json                 # Traducciones inglés
│
├── config/                          # Configuración del módulo
│   ├── routes.ts                   # Definición de rutas
│   ├── menu.ts                     # Configuración del menú
│   ├── permissions.ts              # Permisos CASL
│   ├── container.ts                # Dependency Injection
│   └── config.ts                   # Configuración general
│
├── shared/                          # Código compartido
│   ├── types/                      # Tipos TypeScript
│   └── contracts/                  # Interfaces de contratos
│
├── installer.ts                     # Instalador del módulo
├── index.ts                         # Punto de entrada
└── README.md                        # Esta documentación
```

## 🚀 Instalación

El módulo se instala automáticamente a través del sistema de plugins:

```typescript
// src/plugins/client/index.ts
import { installClientModule } from '@/modules/ClientModule/installer'

export default function (app: App) {
  const router = app.config.globalProperties.$router
  const i18n = app.config.globalProperties.$i18n

  installClientModule(router, i18n)
}
```

## 💻 Uso

### En Componentes

```typescript
<script setup lang="ts">
import { useClient } from '@/modules/ClientModule'

const {
  // State
  clients,
  currentClient,
  loading,
  error,
  pagination,

  // Actions
  fetchClients,
  fetchClientById,
  createClient,
  updateClient,
  deleteClient,

  // Status Management
  activateClient,
  suspendClient,
  deactivateClient,
  blacklistClient,

  // Helpers
  getStatusColor,
  getDisplayName,
  canDeleteClient,
} = useClient()

// Cargar clientes
await fetchClients({ status: 'active', page: 1 })

// Crear cliente
await createClient({
  business_type: 'company',
  company_name: 'Acme Corp',
  email: 'contact@acme.com',
  rfc: 'ACM010101ABC',
  payment_terms: 'net_30',
  credit_limit: 50000
})

// Suspender cliente
await suspendClient(clientId, 'Falta de pago', 'Suspensión temporal', '2025-10-15')
</script>
```

### Directamente con el Store

```typescript
import { useClientStore } from '@/modules/ClientModule'

const clientStore = useClientStore()

// Lista de clientes
const clients = computed(() => clientStore.items)
const loading = computed(() => clientStore.loading)

// Acciones
await clientStore.fetchList({ search: 'Acme', status: 'active' })
await clientStore.updateItem(id, { credit_limit: 100000 })
```

## 📊 Endpoints Backend

### Clientes

```
GET    /api/clients                    # Lista paginada
GET    /api/clients/{id}                # Detalle de cliente
GET    /api/clients/search              # Búsqueda por código
POST   /api/clients                     # Crear cliente
PUT    /api/clients/{id}                # Actualizar cliente
DELETE /api/clients/{id}                # Eliminar cliente
GET    /api/clients/statistics          # Estadísticas
GET    /api/clients/export              # Exportar datos
```

### Gestión de Estado

```
POST   /api/clients/{id}/activate       # Activar cliente
POST   /api/clients/{id}/suspend        # Suspender cliente
POST   /api/clients/{id}/deactivate     # Desactivar cliente
POST   /api/clients/{id}/blacklist      # Agregar a lista negra
GET    /api/clients/{id}/status-history # Historial de estados
```

### Contactos

```
GET    /api/clients/{id}/contacts              # Lista de contactos
POST   /api/clients/{id}/contacts              # Crear contacto
PUT    /api/clients/{id}/contacts/{contactId}  # Actualizar contacto
DELETE /api/clients/{id}/contacts/{contactId}  # Eliminar contacto
POST   /api/clients/{id}/contacts/{contactId}/set-primary  # Marcar como principal
```

### Crédito

```
PATCH  /api/clients/{id}/credit-limit    # Actualizar límite de crédito
```

## 🔒 Permisos

### Permisos Disponibles

```typescript
// Visualización
'client:view:clients'              // Ver lista de clientes
'client:view:client-detail'        // Ver detalle de cliente

// CRUD
'client:create:client'             // Crear cliente
'client:update:client'             // Actualizar cliente
'client:delete:client'             // Eliminar cliente

// Gestión de Estado
'client:activate:client'           // Activar cliente
'client:suspend:client'            // Suspender cliente
'client:deactivate:client'         // Desactivar cliente
'client:blacklist:client'          // Agregar a lista negra

// Especiales
'client:update:credit-limit'       // Modificar límite de crédito
'client:export:clients'            // Exportar datos
'client:view:status-history'       // Ver historial de estados
'client:manage:contacts'           // Gestionar contactos
```

### Grupos de Permisos por Rol

```typescript
// Administrador
CLIENT_PERMISSION_GROUPS.admin  // Todos los permisos

// Gerente
CLIENT_PERMISSION_GROUPS.manager  // CRUD completo + gestión de estado

// Supervisor
CLIENT_PERMISSION_GROUPS.supervisor  // Ver, crear, actualizar

// Ventas
CLIENT_PERMISSION_GROUPS.sales  // Ver + crear clientes

// Finanzas
CLIENT_PERMISSION_GROUPS.finance  // Ver + gestión de crédito

// Solo Lectura
CLIENT_PERMISSION_GROUPS.viewer  // Solo visualización
```

### Uso en Templates

```vue
<template>
  <VBtn
    v-can="'client:create:client'"
    @click="createClient"
  >
    Nuevo Cliente
  </VBtn>

  <VBtn
    v-can="'client:update:credit-limit'"
    @click="updateCreditLimit"
  >
    Actualizar Crédito
  </VBtn>
</template>
```

### Uso en Código

```typescript
import { useClientPermissions } from '@/modules/ClientModule'

const { can, canAny, canAll } = useClientPermissions()

if (can('client:create:client')) {
  // Mostrar botón de crear
}

if (canAny(['client:update:client', 'client:delete:client'])) {
  // Mostrar acciones de edición
}
```

## 🌍 Internacionalización

El módulo incluye traducciones completas en:
- ✅ Español (es)
- ✅ Inglés (en)

### Estructura de Traducciones

```json
{
  "ClientModule": {
    "common": { /* botones, acciones, mensajes */ },
    "client": {
      "fields": { /* campos del formulario */ },
      "status": { /* estados */ },
      "business_type": { /* tipos de negocio */ },
      "payment_terms": { /* términos de pago */ },
      "tax_regime": { /* régimenes fiscales */ },
      "cfdi_use": { /* usos de CFDI */ }
    },
    "client.contacts": { /* gestión de contactos */ },
    "client.history": { /* historial de cambios */ },
    "navigation": { /* elementos del menú */ }
  }
}
```

## 🎨 Componentes

### Atomic Design

El módulo sigue el patrón Atomic Design:

- **Organisms**: Componentes complejos reutilizables
  - `ContactsListOrganism`: Gestión de contactos con CRUD
  - `ClientStatusHistoryOrganism`: Timeline de cambios de estado

### Vistas Principales

1. **ClientList**: Lista con filtros, búsqueda y acciones en lote
2. **ClientCreate**: Formulario multi-sección para crear clientes
3. **ClientEdit**: Edición de cliente existente
4. **ClientDetail**: Vista detallada con tabs (Info, Contactos, Historial)

## 🧪 Validaciones

### Validación de RFC

```typescript
import { ClientDomain } from '@/modules/ClientModule'

// Valida formato de RFC mexicano
const isValid = ClientDomain.validateRFC('ACM010101ABC')
```

### Reglas de Negocio

```typescript
// Verificar si se puede eliminar
const { canDelete, reason } = ClientDomain.canDelete(client)

// Verificar si se puede suspender
const { canSuspend, reason } = ClientDomain.canSuspend(client)

// Verificar si se puede activar
const { canActivate, reason } = ClientDomain.canActivate(client)

// Verificar límite de crédito
const exceeded = ClientDomain.hasExceededCreditLimit(client, 75000)
```

## 📝 Tipos de Datos

### Client Entity

```typescript
interface ClientEntity {
  id: string
  client_code: string
  business_type: 'individual' | 'company'
  status: 'active' | 'inactive' | 'suspended' | 'blacklisted'

  // Información de empresa
  company_name?: string
  trade_name?: string
  contact_person?: string

  // Contacto
  email?: string
  phone?: string
  mobile?: string
  website?: string

  // Dirección
  address_line_1?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string

  // Información fiscal (México)
  rfc?: string
  tax_regime?: TaxRegime
  cfdi_use?: CFDIUse

  // Términos comerciales
  payment_terms?: PaymentTerms
  credit_limit?: number
  credit_days?: number
  discount_percentage?: number

  // Metadatos
  notes?: string
  tags?: string[]
  created_at?: string
  updated_at?: string

  // Relaciones
  contacts?: ClientContactEntity[]
  status_history?: ClientStatusHistoryEntity[]
}
```

## 🔄 Flujo de Datos

```
┌─────────────────┐
│   Vue Component │
└────────┬────────┘
         │ uses
         ▼
┌─────────────────┐
│  Pinia Store    │ ◄── State Management
└────────┬────────┘
         │ calls
         ▼
┌─────────────────┐
│ Application     │ ◄── Business Logic
│ Service         │
└────────┬────────┘
         │ uses
         ▼
┌─────────────────┐
│ Repository      │ ◄── Data Access
│ Implementation  │
└────────┬────────┘
         │ calls
         ▼
┌─────────────────┐
│ API Service     │ ◄── HTTP Calls
└────────┬────────┘
         │
         ▼
    Backend API
```

## 🚨 Manejo de Errores

Todos los servicios incluyen manejo robusto de errores:

```typescript
try {
  await clientStore.createItem(data)
  // Notificación de éxito automática
} catch (error) {
  // Error capturado y mostrado al usuario
  // Logging automático
  console.error('Error creating client:', error)
}
```

## 📦 Dependencias

- Vue 3
- Pinia (State Management)
- Vue Router
- Vuetify 3 (UI Components)
- Vue I18n (Internationalization)
- TypeScript
- CASL (Permissions)

## 🎯 Próximas Mejoras

- [ ] Integración con módulo de facturación
- [ ] Dashboard de análisis de clientes
- [ ] Gestión de documentos por cliente
- [ ] Historial de transacciones
- [ ] Sistema de etiquetas y categorías
- [ ] Importación masiva desde Excel/CSV
- [ ] API de sincronización con sistemas externos

## 📄 Licencia

Parte del proyecto Skeleton - Todos los derechos reservados

---

**Desarrollado siguiendo principios de DDD y Clean Architecture**
