# Módulo de Contratos - Documentación

## Estructura del Módulo

```
src/modules/contracts/
├── components/
│   └── ContractsFilters.vue      # Componente de filtros
├── composables/
│   └── useContractsHelpers.ts    # Helpers reutilizables
├── services/
│   └── contractsApi.ts           # API service (8 endpoints)
├── stores/
│   └── contractsStore.ts         # Pinia store
├── types/
│   ├── Contract.ts               # Tipos de contrato
│   └── ContractResponses.ts      # Tipos de respuestas API
├── views/
│   ├── ContractsList.vue         # Vista principal de listado
│   └── index.vue                 # Wrapper de la vista
├── index.ts                      # Exportaciones del módulo
├── indexedDbConfig.ts            # Configuración IndexedDB
├── menu.ts                       # Configuración del menú
└── routes.ts                     # Configuración de rutas
```

## API Endpoints Implementados

### 1. Listar Contratos
```typescript
ContractsApi.getContracts(params?: ContractsFilters): Promise<ContractsResponse>
```

**Parámetros disponibles:**
- `page`, `per_page` - Paginación
- `search` - Búsqueda por account, contratid o nameuser
- `account`, `contratid` - Filtros específicos
- `status`, `sector`, `systems`, `type_contract` - Filtros por catálogo
- `debt_months_min`, `debt_months_max` - Filtros por deuda

### 2. Detalle de Contrato
```typescript
ContractsApi.getContractById(contratid: string): Promise<ContractDetail>
```

### 3. Resumen de Deuda
```typescript
ContractsApi.getDebtSummary(contratid: string): Promise<ContractDebtSummary>
```

### 4. Validar Contrato
```typescript
ContractsApi.validateContract({ account?: string, contratid?: string }): Promise<ContractValidation>
```

### 5-8. Catálogos
```typescript
ContractsApi.getCatalog(type: 'status' | 'systems' | 'sectors' | 'type_contracts'): Promise<string[]>
ContractsApi.getAllCatalogs(): Promise<{ status, systems, sectors, type_contracts }>
```

## Tipos TypeScript

### Contract (Listado)
```typescript
interface Contract {
  contratid: string
  account: string
  nameuser: string
  address: string
  type_contrat: string
  status: string
  status_id: string
  sector: string
  systems: string
  debt: string
  debt_months: string
}
```

### ContractDetail (Detalle completo)
Extiende `Contract` con campos adicionales:
- `rate_type`, `rate_type_id`
- `type_charge`, `type_charge_code`
- `socket_diameter`, `business_activity`
- `pensionary`, `handicapped`
- `lecture: ContractLecture` (información de lectura)
- Y más...

### ContractDebtSummary
```typescript
interface ContractDebtSummary {
  contratid: string
  account: string
  nameuser: string
  debt: string
  debt_months: string
  average_consumption: string
  last_read: string
  last_date_read: string
  amount_letters: string
  has_debt: boolean
  status: string
}
```

### ContractValidation
```typescript
interface ContractValidation {
  exists: boolean
  contratid: string | null
  account: string | null
  status?: string
  has_debt?: boolean
  debt_months?: string
  debt_amount?: string
}
```

## Uso en Componentes

### Ejemplo: Listar contratos con filtros
```vue
<script setup lang="ts">
import { ContractsApi } from '@/modules/contracts'

const loadContracts = async () => {
  const response = await ContractsApi.getContracts({
    page: 1,
    per_page: 15,
    search: 'AGUNDEZ',
    status: 'ACTIVO'
  })
  
  console.log(response.data) // Contract[]
  console.log(response.meta.total) // Total de registros
}
</script>
```

### Ejemplo: Validar contrato
```vue
<script setup lang="ts">
import { ContractsApi } from '@/modules/contracts'

const validateByAccount = async (account: string) => {
  const result = await ContractsApi.validateContract({ account })
  
  if (result.exists) {
    console.log(`Contrato ${result.contratid} encontrado`)
    console.log(`Estado: ${result.status}`)
    console.log(`Tiene deuda: ${result.has_debt}`)
  }
}
</script>
```

### Ejemplo: Cargar todos los catálogos
```vue
<script setup lang="ts">
import { ContractsApi } from '@/modules/contracts'

const loadFilters = async () => {
  const catalogs = await ContractsApi.getAllCatalogs()
  
  statusOptions.value = catalogs.status
  systemOptions.value = catalogs.systems
  sectorOptions.value = catalogs.sectors
  typeOptions.value = catalogs.type_contracts
}
</script>
```

## Composables

### useContractsHelpers
```typescript
const {
  formatCurrency,      // Formatea montos a MXN
  getStatusColor,      // Color para badges de estado
  getDebtColor,        // Color basado en meses de deuda
  formatContractName,  // Formatea nombres
  getDefaultContract   // Contrato por defecto
} = useContractsHelpers()
```

## Store (Pinia)

```typescript
import { useContractsStore } from '@/modules/contracts'

const contractsStore = useContractsStore()

// Métodos disponibles del CRUD factory
await contractsStore.fetchList(filters)
await contractsStore.fetchItem(id)
await contractsStore.create(data)
await contractsStore.update(id, data)
await contractsStore.delete(id)
```

## Notas Importantes

1. **Autenticación**: Todos los endpoints requieren token Bearer (manejado por ApiService)
2. **Respuestas**: Los catálogos pueden venir como array directo o en `response.data`
3. **Tipos numéricos**: Campos como `debt`, `debt_months` son strings en la API
4. **Fechas**: Formato `Y-m-d H:i:s` (ej: "2025-10-30 17:10:09")
5. **Filtrado**: Los datos están filtrados por `company_id` del usuario autenticado
6. **Validación**: El endpoint `/validate` siempre retorna 200 con flag `exists`
