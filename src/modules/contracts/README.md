# Módulo de Contratos - Frontend

## Descripción General

El módulo de Contratos es una aplicación Vue 3 + TypeScript que proporciona una interfaz completa para la gestión de contratos de servicios de agua. Está integrado con la API de contratos del backend y sigue las mejores prácticas de arquitectura modular.

---

## Estructura del Módulo

```
src/modules/contracts/
├── components/
│   ├── ContractsFilters.vue      # Componente de filtros avanzados
│   └── ContractsStats.vue        # Componente de estadísticas
├── services/
│   └── contractsApi.ts           # Cliente API para contratos
├── types/
│   └── Contract.ts               # Interfaces TypeScript
├── views/
│   ├── ContractDetailView.vue    # Vista de detalle de contrato
│   └── ContractsList.vue         # Vista de lista de contratos
└── README.md                     # Este archivo
```

---

## Tipos de Datos (TypeScript)

### Contract
```typescript
interface Contract {
  id: string                    // UUID del registro
  contratid: string             // ID del contrato
  account: string               // Número de cuenta
  nameuser: string              // Nombre del usuario
  address: string               // Dirección
  type_contrat: string          // Tipo de contrato
  status: string                // Estado del contrato
  status_id: string             // ID del estado
  sector: string                // Sector
  systems: string               // Sistema
  debt?: string                 // Deuda total
  debt_months?: string          // Meses de deuda
}
```

### ContractDetail
```typescript
interface ContractDetail extends Contract {
  rate_type: string             // Tipo de tarifa
  rate_type_id: string          // ID de tarifa
  type_charge: string           // Tipo de cobro
  type_charge_code: string      // Código de tipo de cobro
  socket_diameter: string       // Diámetro de toma
  business_activity?: string    // Actividad comercial
  pensionary: string            // Pensionado (0/1)
  due_date_pensioner?: string   // Vencimiento pensión
  handicapped: string           // Discapacitado (0/1)
  due_date_handicapped?: string // Vencimiento discapacidad
  cadastral_number?: string     // Número catastral
  clave_loc?: string            // Clave de localidad
  sequence?: string             // Secuencia
  measurer: string              // Número de medidor
  positive_balance: string      // Saldo a favor
  type_services: number[]       // Servicios (array JSON)
  firefighters: string          // Cargo bomberos
  rfc?: string                  // RFC
  recharge: number              // Recargos
  read_only: number             // Solo lectura (0/1)
  trunks?: number               // Troncal
  round_charge: string          // Ajuste de redondeo
  entity?: string               // Entidad
  route?: string                // Ruta
  lecture?: ContractLecture     // Datos de lectura
}
```

### ContractLecture
```typescript
interface ContractLecture {
  last_read: string             // Última lectura (m³)
  last_date_read: string        // Fecha de última lectura
  debt: string                  // Deuda
  debt_months: string           // Meses de deuda
  amount_letters: string        // Monto en convenio
  average_consumption: string   // Consumo promedio (m³)
  last_latitude: string         // Latitud de última lectura
  last_longitude: string        // Longitud de última lectura
}
```

---

## Servicios API

### ContractsApi

Cliente API ubicado en `services/contractsApi.ts` que proporciona los siguientes métodos:

#### getContracts
Obtiene una lista paginada de contratos con filtros.

```typescript
getContracts(params?: {
  page?: number
  per_page?: number
  search?: string
  account?: string
  contratid?: string
  status?: string
  sector?: string
  systems?: string
  debt_months_min?: number
  debt_months_max?: number
}): Promise<PaginatedResponse<Contract>>
```

**Ejemplo:**
```typescript
const response = await ContractsApi.getContracts({
  page: 1,
  per_page: 15,
  search: 'FLORES',
  status: 'ACTIVO'
})
```

#### getContractDetails
Obtiene los detalles completos de un contrato por su UUID.

```typescript
getContractDetails(id: string): Promise<ContractDetail>
```

**Ejemplo:**
```typescript
const contract = await ContractsApi.getContractDetails('9de65c3a-xxxx-xxxx-xxxx-xxxxxxxxxxxx')
```

#### Catálogos
Obtiene catálogos para filtros:

```typescript
getStatusCatalog(): Promise<string[]>
getSystemsCatalog(): Promise<string[]>
getSectorsCatalog(): Promise<string[]>
```

---

## Componentes Vue

### ContractsList.vue

**Ruta:** `/contracts`

Vista principal que muestra una tabla paginada de contratos con:
- Búsqueda por cuenta, ID de contrato o nombre de usuario
- Filtros avanzados (estado, sector, sistema, meses de deuda)
- Paginación
- Navegación a detalle de contrato

**Características:**
- Tabla responsive con Vuetify DataTable
- Indicadores de estado con chips de color
- Acciones por fila (ver detalle)
- Estadísticas de contratos activos y con deuda

**Navegación:**
```typescript
const navigateToDetail = (id: string) => {
  router.push(`/contracts/${id}`)
}
```

### ContractDetailView.vue

**Ruta:** `/contracts/:id`

Vista de detalle que muestra información completa de un contrato en un layout de 4 columnas:

#### Columna 1: Resumen Financiero
- Adeudo
- Convenio
- Recargos
- Ajuste Redondeo
- Meses Vencidos
- Saldo a Favor

#### Columna 2: Datos Generales
- Tipo de Contrato
- Tarifa
- Tipo de Cobro
- Diámetro de Toma
- Actividad Comercial

#### Columna 3: Datos de Lectura
- Medidor
- Última Lectura
- Fecha Lectura
- Consumo Promedio
- Ubicación (Lat, Lon)

#### Columna 4: Descuentos y Cargos Especiales
- **Descuentos:**
  - Pensión (SÍ/NO)
  - Vencimiento Pensión
  - Discapacitado (SÍ/NO)
  - Vencimiento Discapacidad
- **Cargos Especiales:**
  - Bomberos
  - Cruz Roja
  - Ayuntamiento

**Características de Diseño:**
- Header con información clave del contrato
- Layout responsive (4 columnas en desktop, 1 en móvil)
- Valores monetarios formateados en MXN
- Código de colores:
  - Rojo: deudas y cargos
  - Verde: saldo a favor
  - Amarillo: meses vencidos
  - Secundario: títulos de sección

**Formateo de Moneda:**
```typescript
const formatCurrency = (amount: string | number) => {
  const num = typeof amount === 'string' ? Number.parseFloat(amount) : amount
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(num || 0)
}
```

### ContractsFilters.vue

Componente de filtros avanzados que incluye:
- Búsqueda por texto
- Filtro por estado (catálogo)
- Filtro por sector (catálogo)
- Filtro por sistema (catálogo)
- Rango de meses de deuda

**Eventos:**
- `@apply`: Aplicar filtros
- `@clear`: Limpiar filtros

### ContractsStats.vue

Componente de estadísticas que muestra:
- Total de contratos
- Contratos activos
- Contratos con deuda
- Deuda total

---

## Endpoints Consumidos

### 1. Listar Contratos
```
GET /api/contracts
```
Parámetros: page, per_page, search, account, contratid, status, sector, systems, debt_months_min, debt_months_max

### 2. Detalle de Contrato
```
GET /api/contracts/details/{id}
```
Parámetro de ruta: id (UUID)

### 3. Catálogo de Estados
```
GET /api/contracts/catalog/status
```

### 4. Catálogo de Sistemas
```
GET /api/contracts/catalog/systems
```

### 5. Catálogo de Sectores
```
GET /api/contracts/catalog/sectors
```

---

## Configuración de Rutas

```typescript
// src/router/index.ts
{
  path: '/contracts',
  name: 'contracts',
  component: () => import('@/modules/contracts/views/ContractsList.vue'),
  meta: { requiresAuth: true }
},
{
  path: '/contracts/:id',
  name: 'contract-detail',
  component: () => import('@/modules/contracts/views/ContractDetailView.vue'),
  meta: { requiresAuth: true }
}
```

---

## Estado y Gestión de Datos

El módulo utiliza Vue Composition API con:
- `ref()` para estado reactivo
- `onMounted()` para carga inicial de datos
- `watch()` para reactividad a cambios (filtros, paginación)

**Ejemplo de carga de datos:**
```typescript
const loading = ref(false)
const contracts = ref<Contract[]>([])

const loadContracts = async () => {
  loading.value = true
  try {
    const response = await ContractsApi.getContracts(filters.value)
    contracts.value = response.data
  } catch (error) {
    console.error('Error loading contracts:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadContracts()
})
```

---

## Manejo de Errores

```typescript
try {
  const contract = await ContractsApi.getContractDetails(id)
  // Procesar datos
} catch (error) {
  console.error('Error loading contract data:', error)
  // Mostrar notificación de error al usuario
  // Redirigir a lista si el contrato no existe
}
```

---

## Responsividad

El módulo está completamente optimizado para dispositivos móviles:

- **Desktop (≥960px)**: Layout de 4 columnas con anchos personalizados
- **Tablet (600-959px)**: Layout de 2 columnas
- **Móvil (<600px)**: Layout de 1 columna (100% de ancho)

```vue
<VCol
  cols="12"           <!-- Móvil: 100% --
>
  md="6"              <!-- Tablet: 50% -->
  class="col-custom-20" <!-- Desktop: 20% -->
>
```

---

## Cambios Recientes

### v1.2.0 (Último Commit)
- ✅ Actualización del endpoint de detalle: `/api/contracts/{id}` → `/api/contracts/details/{id}`
- ✅ Eliminación del método `getDebtSummary` (no utilizado)
- ✅ Navegación por UUID (`id`) en lugar de `contratid`
- ✅ Refactorización completa de `ContractDetailView.vue` con layout de 4 columnas

### v1.1.0
- ✅ Implementación de filtros avanzados
- ✅ Integración de catálogos dinámicos
- ✅ Modal con detalle de contratos
- ✅ Paginación mejorada

### v1.0.0
- ✅ Implementación inicial del módulo
- ✅ Lista de contratos con búsqueda
- ✅ Vista de detalle básica
- ✅ Integración con API

---

## Mejoras Futuras

- [ ] Implementar exportación de datos a Excel/PDF
- [ ] Agregar gráficos de consumo histórico
- [ ] Implementar edición de contratos
- [ ] Agregar historial de cambios
- [ ] Implementar sistema de notificaciones para deudas
- [ ] Agregar mapa interactivo de ubicaciones de lecturas

---

## Dependencias Principales

- **Vue 3**: Framework principal
- **TypeScript**: Tipado estático
- **Vuetify 3**: Framework de componentes UI
- **Vue Router**: Enrutamiento
- **Axios**: Cliente HTTP

---

## API Backend

Para más información sobre los endpoints de la API, consultar la documentación del backend en:
- `app/Modules/Contract/README.md` (Backend)

---

## Soporte

Para reportar problemas o solicitar mejoras del módulo frontend, contactar al equipo de desarrollo frontend.
