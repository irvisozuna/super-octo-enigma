# 🧩 Componentes Compartidos Reutilizables

## Resumen

Colección de componentes Base estandarizados siguiendo **Atomic Design** para ser reutilizados en todo el proyecto. Estos componentes eliminan duplicación de código y mantienen consistencia visual y funcional.

---

## 📁 Estructura de Componentes Compartidos

```
src/components/
├── filters/              # Componentes de filtrado
│   ├── BaseFilters.vue          # Filtros genéricos configurables
│   └── BaseFilterChips.vue      # Chips de filtros activos
├── actions/              # Componentes de acciones
│   └── BaseExportMenu.vue       # Menú de exportación
├── layout/               # Componentes de layout
│   └── BaseListHeader.vue       # Header de listas
└── BaseDataTable.vue     # Tabla con paginación servidor
```

---

## 🔍 BaseFilters

Componente genérico para crear filtros configurables con diferentes tipos de campos.

### Props

```typescript
interface FilterField {
  key: string                    // Clave del filtro en el objeto
  label: string                  // Label del campo
  type: 'text' | 'select' | 'date' | 'number'  // Tipo de campo
  icon?: string                  // Icono del campo
  items?: Array<{title, value}> // Items para select
  multiple?: boolean             // Permitir selección múltiple (solo select)
  clearable?: boolean            // Mostrar botón limpiar
  placeholder?: string           // Placeholder del campo
  cols?: number                  // Columnas del grid (1-12)
}

interface Props {
  modelValue: T                  // Objeto con valores de filtros
  fields: FilterField[]          // Configuración de campos
  loading?: boolean              // Estado de carga
  variant?: 'outlined' | 'flat'  // Variante del card
  density?: 'default' | 'compact'// Densidad de los campos
}
```

### Eventos

- `@update:modelValue` - Se emite cuando cambia algún filtro
- `@search` - Se emite al escribir en campos de texto
- `@change` - Se emite al cambiar cualquier campo (incluye `field` y `value`)

### Ejemplo de Uso

```vue
<script setup lang="ts">
import BaseFilters from '@/components/filters/BaseFilters.vue'

const filters = ref({
  search: '',
  status: [],
  category: '',
  dateFrom: '',
})

const filterFields = [
  {
    key: 'search',
    label: 'Buscar',
    type: 'text',
    icon: 'tabler-search',
    cols: 4,
  },
  {
    key: 'status',
    label: 'Estado',
    type: 'select',
    items: [
      { title: 'Activo', value: 'active' },
      { title: 'Inactivo', value: 'inactive' },
    ],
    multiple: true,
    cols: 3,
  },
  {
    key: 'category',
    label: 'Categoría',
    type: 'select',
    items: categoryOptions,
    cols: 3,
  },
  {
    key: 'dateFrom',
    label: 'Desde',
    type: 'date',
    cols: 2,
  },
]

const handleSearch = () => {
  // Debounced search
  loadData()
}

const handleFilterChange = (field: string, value: any) => {
  console.log(`${field} changed to:`, value)
  loadData()
}
</script>

<template>
  <BaseFilters
    v-model="filters"
    :fields="filterFields"
    @search="handleSearch"
    @change="handleFilterChange"
  />
</template>
```

---

## 🏷️ BaseFilterChips

Componente para mostrar filtros activos como chips removibles.

### Props

```typescript
interface ActiveFilter {
  key: string      // Clave del filtro
  label: string    // Texto del chip
  value: any       // Valor del filtro
  color?: string   // Color del chip
}

interface Props {
  filters: ActiveFilter[]  // Array de filtros activos
  clearText?: string       // Texto del botón limpiar
  emptyText?: string       // Texto cuando no hay filtros
  showEmpty?: boolean      // Mostrar mensaje cuando vacío
}
```

### Eventos

- `@remove` - Se emite al cerrar un chip (incluye el `ActiveFilter`)
- `@clear` - Se emite al hacer click en "Limpiar todo"

### Ejemplo de Uso

```vue
<script setup lang="ts">
import BaseFilterChips from '@/components/filters/BaseFilterChips.vue'
import type { ActiveFilter } from '@/components/filters/BaseFilterChips.vue'

const filters = ref({ search: 'test', status: ['active', 'pending'] })

// Construir array de filtros activos
const activeFilters = computed<ActiveFilter[]>(() => {
  const active: ActiveFilter[] = []

  if (filters.value.search) {
    active.push({
      key: 'search',
      label: `Búsqueda: ${filters.value.search}`,
      value: filters.value.search,
    })
  }

  filters.value.status.forEach((status) => {
    active.push({
      key: 'status',
      label: `Estado: ${status}`,
      value: status,
      color: 'primary',
    })
  })

  return active
})

const removeFilter = (filter: ActiveFilter) => {
  if (filter.key === 'search') {
    filters.value.search = ''
  }
  else if (filter.key === 'status') {
    filters.value.status = filters.value.status.filter(v => v !== filter.value)
  }
  loadData()
}

const clearAllFilters = () => {
  filters.value = { search: '', status: [] }
  loadData()
}
</script>

<template>
  <BaseFilterChips
    :filters="activeFilters"
    @remove="removeFilter"
    @clear="clearAllFilters"
  />
</template>
```

---

## 📥 BaseExportMenu

Componente de menú dropdown para exportar datos en diferentes formatos.

### Props

```typescript
interface ExportFormat {
  type: 'excel' | 'pdf' | 'csv' | 'json'
  label: string
  icon: string
  color?: string
}

interface Props {
  formats?: ExportFormat[]     // Formatos de exportación disponibles
  loading?: boolean            // Estado de carga
  disabled?: boolean           // Deshabilitar botón
  buttonText?: string          // Texto del botón
  buttonVariant?: string       // Variante del botón
  buttonColor?: string         // Color del botón
}
```

### Eventos

- `@export` - Se emite al seleccionar un formato (incluye el `type` del formato)

### Ejemplo de Uso

```vue
<script setup lang="ts">
import BaseExportMenu from '@/components/actions/BaseExportMenu.vue'

const exporting = ref(false)
const hasData = computed(() => items.value.length > 0)

// Formatos personalizados (opcional)
const customFormats = [
  { type: 'excel', label: 'Exportar Excel', icon: 'tabler-file-spreadsheet', color: 'success' },
  { type: 'pdf', label: 'Exportar PDF', icon: 'tabler-file-type-pdf', color: 'error' },
]

const handleExport = async (format: 'excel' | 'pdf' | 'csv' | 'json') => {
  exporting.value = true
  try {
    await exportService.export(format, items.value)
  }
  finally {
    exporting.value = false
  }
}
</script>

<template>
  <BaseExportMenu
    :loading="exporting"
    :disabled="!hasData"
    :formats="customFormats"
    @export="handleExport"
  />
</template>
```

---

## 📋 BaseListHeader

Componente de header para listas con título, contador, descripción y acciones.

### Props

```typescript
interface Props {
  title?: string               // Título del header
  icon?: string                // Icono del título
  total?: number               // Total de items (contador)
  itemLabel?: string           // Label singular (ej: "herramienta")
  itemLabelPlural?: string     // Label plural (ej: "herramientas")
  description?: string         // Descripción debajo del título
  createButtonText?: string    // Texto del botón crear
  createButtonIcon?: string    // Icono del botón crear
  showCreateButton?: boolean   // Mostrar botón crear
  canCreate?: boolean          // Habilitar botón crear
  loading?: boolean            // Estado de carga
}
```

### Eventos

- `@create` - Se emite al hacer click en el botón crear

### Slots

- `title` - Slot para personalizar completamente el título
- `actions` - Slot para agregar acciones adicionales (ej: botón exportar)
- `stats` - Slot para agregar estadísticas adicionales
- `default` - Slot para contenido adicional debajo del header

### Ejemplo de Uso

```vue
<script setup lang="ts">
import BaseListHeader from '@/components/layout/BaseListHeader.vue'
import BaseExportMenu from '@/components/actions/BaseExportMenu.vue'

const total = ref(150)
const handleCreate = () => { /* ... */ }
const handleExport = (format) => { /* ... */ }
</script>

<template>
  <BaseListHeader
    title="Herramientas"
    icon="tabler-tools"
    :total="total"
    item-label="herramienta"
    item-label-plural="herramientas"
    description="Gestiona todas las herramientas del sistema"
    create-button-text="Nueva Herramienta"
    :can-create="canCreate"
    @create="handleCreate"
  >
    <!-- Acciones adicionales -->
    <template #actions>
      <BaseExportMenu @export="handleExport" />
    </template>

    <!-- Estadísticas adicionales -->
    <template #stats>
      <VChip color="success" size="small">
        {{ availableCount }} disponibles
      </VChip>
    </template>
  </BaseListHeader>
</template>
```

---

## 🎯 Ejemplo Completo - Vista de Lista

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseListHeader from '@/components/layout/BaseListHeader.vue'
import BaseFilters from '@/components/filters/BaseFilters.vue'
import BaseFilterChips from '@/components/filters/BaseFilterChips.vue'
import BaseExportMenu from '@/components/actions/BaseExportMenu.vue'
import BaseDataTable from '@/components/BaseDataTable.vue'
import { useMyStore } from './stores/myStore'

const myStore = useMyStore()

// Filtros
const filters = ref({
  search: '',
  status: [],
  category: '',
})

const filterFields = [
  { key: 'search', label: 'Buscar', type: 'text', icon: 'tabler-search', cols: 4 },
  {
    key: 'status',
    label: 'Estado',
    type: 'select',
    items: [
      { title: 'Activo', value: 'active' },
      { title: 'Inactivo', value: 'inactive' },
    ],
    multiple: true,
    cols: 4,
  },
  {
    key: 'category',
    label: 'Categoría',
    type: 'select',
    items: categoryOptions,
    cols: 4,
  },
]

// Filtros activos para chips
const activeFilters = computed(() => {
  const active = []
  if (filters.value.search)
    active.push({ key: 'search', label: `Búsqueda: ${filters.value.search}`, value: filters.value.search })
  // ... más filtros
  return active
})

// Handlers
const handleSearch = () => loadData()
const handleFilterChange = () => loadData()
const removeFilter = (filter) => { /* ... */ }
const clearFilters = () => { /* ... */ }
const handleExport = (format) => { /* ... */ }
const handleCreate = () => { /* ... */ }
const handleOptionsUpdate = (params) => myStore.fetchItems(params)
</script>

<template>
  <VCard>
    <VCardText>
      <!-- Header -->
      <BaseListHeader
        title="Mi Lista"
        icon="tabler-list"
        :total="myStore.pagination.total"
        item-label="item"
        item-label-plural="items"
        @create="handleCreate"
      >
        <template #actions>
          <BaseExportMenu @export="handleExport" />
        </template>
      </BaseListHeader>

      <!-- Filtros -->
      <BaseFilters
        v-model="filters"
        :fields="filterFields"
        @search="handleSearch"
        @change="handleFilterChange"
      />

      <!-- Chips de filtros activos -->
      <BaseFilterChips
        :filters="activeFilters"
        @remove="removeFilter"
        @clear="clearFilters"
      />

      <!-- Tabla -->
      <BaseDataTable
        :headers="headers"
        :items="myStore.items"
        :meta="myStore.pagination"
        :loading="myStore.loading"
        @update:options="handleOptionsUpdate"
      >
        <!-- Slots personalizados -->
      </BaseDataTable>
    </VCardText>
  </VCard>
</template>
```

---

## 🎨 Ventajas de usar Componentes Compartidos

### ✅ Consistencia
- Mismo look & feel en toda la aplicación
- Misma experiencia de usuario

### ✅ Menos Código
- No repetir lógica de filtros en cada vista
- Reutilizar componentes en múltiples módulos

### ✅ Mantenimiento
- Cambios en un solo lugar
- Fácil actualizar estilos o funcionalidad

### ✅ Testing
- Testear una vez, usar en todas partes
- Tests centralizados

### ✅ Atomic Design
- Componentes bien definidos por responsabilidad
- Fácil composición de UI complejas

---

## 📚 Referencias

- [BaseDataTable](./README-DATA-TABLES.md) - Tabla con paginación servidor
- [Atomic Design Pattern](https://atomicdesign.bradfrost.com/)
- [Vuetify Components](https://vuetifyjs.com/)
