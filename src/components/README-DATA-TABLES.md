# 📊 Guía de Tablas Estandarizadas

## Resumen

Este proyecto utiliza un patrón estandarizado para tablas con paginación del servidor que simplifica el desarrollo y mantiene consistencia en toda la aplicación.

## Componentes Principales

### 1. `BaseDataTable.vue`

Componente reutilizable que maneja automáticamente:
- ✅ Paginación servidor con estructura estándar `{data: [], meta: {}}`
- ✅ Sorting de columnas
- ✅ Loading states
- ✅ Empty states personalizables
- ✅ Slots para personalizar cada columna
- ✅ Eventos de click en filas

### 2. `useDataTable` Composable

Composable que estandariza:
- ✅ Parsing de respuestas del backend
- ✅ Manejo de estado de paginación
- ✅ Construcción de parámetros de consulta
- ✅ Estados computed útiles (hasItems, isEmpty, totalItems)

## Estructura de Respuesta del Backend

El sistema espera respuestas en este formato:

```json
{
  "data": [
    { "id": 1, "name": "Item 1" },
    { "id": 2, "name": "Item 2" }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 10,
    "per_page": 15,
    "total": 150
  },
  "links": {
    "first": "http://...",
    "last": "http://...",
    "prev": null,
    "next": "http://..."
  }
}
```

## Cómo Usar

### Paso 1: Crear el Store

```typescript
// stores/myStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useDataTable } from '@/composables/useDataTable'
import { MyApiService, type MyItem } from '../api/MyApiService'

export const useMyStore = defineStore('my-store', () => {
  // Usa el composable estandarizado
  const {
    items,                  // ref<MyItem[]>
    pagination,             // ref<PaginationMeta>
    loading,                // ref<boolean>
    error,                  // ref<string | null>
    hasItems,               // computed<boolean>
    isEmpty,                // computed<boolean>
    totalItems,             // computed<number>
    setPage,                // (page: number) => void
    setItemsPerPage,        // (perPage: number) => void
    resetPagination,        // () => void
    updateState,            // (response: any) => void
    buildParams,            // (page, perPage, filters, sortBy, sortOrder) => params
  } = useDataTable<MyItem>(15) // 15 = items per page default

  const currentItem = ref<MyItem | null>(null)

  // Acción para cargar items
  const fetchItems = async (params: any = {}) => {
    loading.value = true
    error.value = null
    try {
      const response = await MyApiService.getItems(params)
      updateState(response) // Automáticamente parsea y actualiza items + pagination
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error fetching items'
      console.error('Error fetching items:', err)
    }
    finally {
      loading.value = false
    }
  }

  const createItem = async (itemData: any) => {
    loading.value = true
    error.value = null
    try {
      const response = await MyApiService.createItem(itemData)
      items.value.unshift(response.data)
      return response.data
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error creating item'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const deleteItem = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      await MyApiService.deleteItem(id)
      items.value = items.value.filter(item => item.id !== id)
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error deleting item'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  return {
    // State
    items,
    currentItem,
    loading,
    error,
    pagination,

    // Computed
    hasItems,
    isEmpty,
    totalItems,

    // Actions
    fetchItems,
    createItem,
    deleteItem,
    setPage,
    setItemsPerPage,
    resetPagination,
    buildParams,
  }
})
```

### Paso 2: Usar en el Componente Vue

#### Opción A: Usar BaseDataTable directamente

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useMyStore } from '../stores/myStore'
import BaseDataTable from '@/components/BaseDataTable.vue'

const myStore = useMyStore()

// Filtros locales
const filters = ref({
  search: '',
  status: [],
  category: [],
})

// Headers de la tabla
const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Nombre', key: 'name', sortable: true },
  { title: 'Estado', key: 'status', sortable: true },
  { title: 'Acciones', key: 'actions', sortable: false, align: 'end' },
]

// Handler cuando la tabla cambia opciones (paginación, sorting)
const handleOptionsUpdate = (params: any) => {
  // Agregar filtros a los parámetros
  if (filters.value.search)
    params.search = filters.value.search

  if (filters.value.status.length > 0)
    params.status = filters.value.status.join(',')

  if (filters.value.category.length > 0)
    params.category = filters.value.category.join(',')

  // Cargar datos
  myStore.fetchItems(params)
}

// Handler para cambio de filtros
const handleFilterChange = () => {
  myStore.resetPagination() // Reset a página 1
  const params = myStore.buildParams(
    1,
    myStore.pagination.per_page,
    {
      search: filters.value.search,
      status: filters.value.status,
      category: filters.value.category,
    },
  )
  myStore.fetchItems(params)
}

const handleCreate = () => {
  // Abrir dialog de creación
}

const handleEdit = (item: any) => {
  // Abrir dialog de edición
}

const handleDelete = (item: any) => {
  // Abrir dialog de confirmación
}
</script>

<template>
  <VCard>
    <VCardTitle>Mi Lista</VCardTitle>

    <VCardText>
      <!-- Filtros -->
      <VRow class="mb-4">
        <VCol cols="12" md="4">
          <VTextField
            v-model="filters.search"
            label="Buscar"
            prepend-inner-icon="tabler-search"
            clearable
            @input="handleFilterChange"
          />
        </VCol>
        <VCol cols="12" md="4">
          <VSelect
            v-model="filters.status"
            :items="statusOptions"
            label="Estado"
            multiple
            chips
            @update:model-value="handleFilterChange"
          />
        </VCol>
      </VRow>

      <!-- Tabla Estandarizada -->
      <BaseDataTable
        :headers="headers"
        :items="myStore.items"
        :meta="myStore.pagination"
        :loading="myStore.loading"
        empty-state-title="No hay items"
        empty-state-description="Aún no se han registrado items"
        empty-state-icon="tabler-database-off"
        :show-create-button="true"
        create-button-text="Crear Item"
        @update:options="handleOptionsUpdate"
        @create="handleCreate"
      >
        <!-- Personalizar columna de estado -->
        <template #item.status="{ item }">
          <VChip
            :color="getStatusColor(item.status)"
            size="small"
          >
            {{ item.status }}
          </VChip>
        </template>

        <!-- Personalizar columna de acciones -->
        <template #actions="{ item }">
          <VBtn
            icon="tabler-edit"
            variant="text"
            size="small"
            @click="handleEdit(item)"
          />
          <VBtn
            icon="tabler-trash"
            variant="text"
            size="small"
            color="error"
            @click="handleDelete(item)"
          />
        </template>
      </BaseDataTable>
    </VCardText>
  </VCard>
</template>
```

#### Opción B: Usar VDataTableServer directamente (como ToolsList.vue actual)

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useMyStore } from '../stores/myStore'

const myStore = useMyStore()

const filters = ref({
  search: '',
  status: [],
})

const headers = [
  { title: 'Nombre', key: 'name', sortable: true },
  { title: 'Estado', key: 'status', sortable: true },
  { title: 'Acciones', key: 'actions', sortable: false },
]

const handleOptionsUpdate = (options: any) => {
  const { page, itemsPerPage, sortBy } = options

  const params: any = {
    page,
    per_page: itemsPerPage,
  }

  // Agregar filtros
  if (filters.value.search)
    params.search = filters.value.search

  if (filters.value.status.length > 0)
    params.status = filters.value.status.join(',')

  // Agregar sorting
  if (sortBy && sortBy.length > 0) {
    params.sort_by = sortBy[0].key
    params.sort_order = sortBy[0].order || 'asc'
  }

  myStore.fetchItems(params)
}

// No need for onMounted - VDataTableServer handles initial load
</script>

<template>
  <VDataTableServer
    v-model:items-per-page="myStore.pagination.per_page"
    v-model:page="myStore.pagination.current_page"
    :headers="headers"
    :items="myStore.items"
    :items-length="myStore.pagination.total"
    :loading="myStore.loading"
    @update:options="handleOptionsUpdate"
  >
    <!-- Slots personalizados aquí -->
  </VDataTableServer>
</template>
```

## Funciones Útiles del Composable

### `buildParams(page, perPage, filters, sortBy, sortOrder)`

Construye automáticamente los parámetros para la API:

```typescript
const params = myStore.buildParams(
  1,                          // page
  15,                         // per_page
  {                           // filters
    search: 'test',
    status: ['active', 'pending'],  // Arrays se convierten a 'active,pending'
    category: 'electronics',
  },
  'name',                     // sort_by (opcional)
  'desc',                     // sort_order (opcional)
)

// Resultado:
// {
//   page: 1,
//   per_page: 15,
//   search: 'test',
//   status: 'active,pending',
//   category: 'electronics',
//   sort_by: 'name',
//   sort_order: 'desc'
// }
```

### `updateState(response)`

Parsea automáticamente cualquier formato de respuesta del backend:

```typescript
// Funciona con respuesta estándar
const response = {
  data: {
    data: [...items],
    meta: { current_page: 1, ... }
  }
}
updateState(response) // ✅

// También funciona con formato antiguo
const oldResponse = {
  data: {
    data: [...items],
    current_page: 1,
    last_page: 10,
    ...
  }
}
updateState(oldResponse) // ✅

// E incluso con arrays directos
const arrayResponse = {
  data: [...items]
}
updateState(arrayResponse) // ✅
```

## Ventajas del Patrón

✅ **Consistencia**: Todas las tablas funcionan igual
✅ **Menos código**: No repetir lógica de paginación
✅ **Menos bugs**: Lógica probada y centralizada
✅ **Fácil mantenimiento**: Cambios en un solo lugar
✅ **Type-safe**: Full TypeScript support
✅ **Flexible**: Compatible con múltiples formatos de respuesta

## Migración de Código Existente

Para migrar una tabla existente:

1. **En el Store**: Reemplaza el código manual de paginación con `useDataTable`
2. **En fetchItems**: Usa `updateState(response)` en lugar de asignar manualmente
3. **En el componente**: Usa `v-model:page` y `v-model:items-per-page` directamente con `myStore.pagination`
4. **Elimina `onMounted`**: VDataTableServer carga automáticamente
5. **Simplifica `handleOptionsUpdate`**: Recibe parámetros directos y llama al store

## Ejemplos en el Proyecto

- ✅ `/src/modules/DrillingReportsModule/presentation/views/ToolsList.vue` - Implementación completa
- ✅ `/src/modules/EmployeeModule/presentation/views/EmployeeList.vue` - Referencia de buenas prácticas
