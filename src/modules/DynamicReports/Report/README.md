# Dynamic Reports - Report Module

Este módulo proporciona funcionalidades completas para la creación, gestión y ejecución de reportes dinámicos dentro del sistema DynamicReports.

## 🏗️ Arquitectura

El módulo sigue la arquitectura **Domain-Driven Design (DDD)** con **Atomic Design** para los componentes:

```
Report/
├── domain/           # Entidades, value objects, repositorios
├── application/      # Casos de uso, DTOs, mappers
├── infrastructure/   # Implementaciones de repositorios, APIs
└── presentation/     # Componentes Vue, composables, stores
    ├── components/
    │   ├── organisms/    # Componentes complejos
    │   ├── molecules/    # Componentes medianos
    │   └── atoms/        # Componentes básicos
    ├── composables/      # Lógica reutilizable
    ├── stores/          # Estado global
    └── views/           # Páginas completas
```

## 🚀 Componentes Principales

### ReportWizard
El componente principal para crear/editar reportes con 6 pasos:

```vue
<script setup>
import { ReportWizard } from '@/modules/DynamicReports/Report'

const handleSubmit = reportData => {
  // Procesar datos del reporte
  console.log('Report data:', reportData)
}
</script>

<template>
  <ReportWizard
    :report-id="reportId"
    :initial-data="reportData"
    @submit="handleSubmit"
    @cancel="handleCancel"
  />
</template>
```

### Composables Disponibles

#### useReportWizard
Maneja la lógica del wizard de creación/edición:

```typescript
import { useReportWizard } from '@/modules/DynamicReports/Report'

const {
  currentStep,
  wizardData,
  steps,
  canGoNext,
  nextStep,
  previousStep,
  submitWizard
} = useReportWizard(initialData)
```

#### useReportFilters
Gestiona filtros dinámicos:

```typescript
import { useReportFilters } from '@/modules/DynamicReports/Report'

const {
  filters,
  appliedFilters,
  addFilter,
  removeFilter,
  applyFilters,
  clearFilters
} = useReportFilters(availableFields)
```

#### useReportExecution
Maneja la ejecución y exportación:

```typescript
import { useReportExecution } from '@/modules/DynamicReports/Report'

const {
  executeReport,
  exportReport,
  isExecuting,
  executionResult,
  totalRecords
} = useReportExecution()
```

#### useReportValidation
Validaciones con VeeValidate y Yup:

```typescript
import { useReportValidation } from '@/modules/DynamicReports/Report'

const {
  validateCompleteReport,
  validateBasicInfo,
  validateFields,
  validationErrors
} = useReportValidation()
```

## 📋 Pasos del Wizard

### 1. Información Básica
- Nombre del reporte
- Descripción
- Data Source
- Estado (activo/inactivo)
- Visibilidad (público/privado)

### 2. Selección de Campos
- Drag & drop de campos
- Configuración por campo:
  - Alias
  - Formato (text, number, currency, date)
  - Ancho de columna
  - Agregación (SUM, COUNT, AVG, MIN, MAX)
  - Ordenable/Filtrable

### 3. Configuración de Filtros
- Filtros dinámicos
- Tipos: text, number, date, select, range, boolean
- Operadores específicos por tipo
- Valores por defecto

### 4. Ordenamiento
- Orden primario, secundario, terciario
- Dirección ASC/DESC
- Manejo de nulls

### 5. Opciones de Exportación
- Excel: gráficos, auto-filtro
- PDF: orientación, tamaño, márgenes
- CSV: delimitador, encoding

### 6. Permisos y Metadatos
- Permisos requeridos
- Tags
- Departamento/Categoría
- Configuración de caché

## 🎨 Componentes Moleculares

### ReportFieldSelector
Selector de campos con drag & drop:

```vue
<ReportFieldSelector
  v-model="selectedFields"
  :available-fields="availableFields"
  :data-source-id="dataSourceId"
  @validation="validateStep"
/>
```

### ReportFilters
Configurador de filtros dinámicos:

```vue
<ReportFilters
  v-model="filters"
  :available-fields="selectedFields"
  @validation="validateStep"
/>
```

### ReportSortConfig
Configurador de ordenamiento:

```vue
<ReportSortConfig
  v-model="sorting"
  :available-fields="selectedFields"
  @validation="validateStep"
/>
```

### ReportExportOptions
Opciones de exportación:

```vue
<ReportExportOptions
  v-model="exportOptions"
  @validation="validateStep"
/>
```

### ReportPermissions
Configuración de permisos y metadatos:

```vue
<ReportPermissions
  v-model="metadata"
  @validation="validateStep"
/>
```

## 🔧 Configuración

### Store (Pinia)
```typescript
import { useReportStore } from '@/modules/DynamicReports/Report'

const reportStore = useReportStore()

// Acciones disponibles
await reportStore.fetchList()
await reportStore.createItem(data)
await reportStore.updateItem(id, data)
await reportStore.deleteItem(id)
```

### API Endpoints
```
GET    /api/dynamic-reports/reports/     # Listar reportes
GET    /api/dynamic-reports/reports/{id} # Obtener reporte
POST   /api/dynamic-reports/reports/     # Crear reporte
PUT    /api/dynamic-reports/reports/{id} # Actualizar reporte
DELETE /api/dynamic-reports/reports/{id} # Eliminar reporte
POST   /api/dynamic-reports/reports/{id}/duplicate # Duplicar
GET    /api/dynamic-reports/reports/{id}/fields    # Campos disponibles
GET    /api/dynamic-reports/reports/{id}/filters   # Filtros disponibles
POST   /api/dynamic-reports/reports/{id}/execute   # Ejecutar reporte
POST   /api/dynamic-reports/reports/{id}/export    # Exportar reporte
```

## 🎯 Ejemplos de Uso

### Crear un Nuevo Reporte
```vue
<script setup>
import { ReportWizard, useReportStore } from '@/modules/DynamicReports/Report'

const reportStore = useReportStore()

const handleSubmit = async reportData => {
  try {
    await reportStore.createItem(reportData)

    // Mostrar mensaje de éxito
  }
  catch (error) {
    // Manejar error
  }
}
</script>

<template>
  <div>
    <h1>Crear Reporte</h1>
    <ReportWizard @submit="handleSubmit" />
  </div>
</template>
```

### Ejecutar un Reporte
```vue
<script setup>
import { useReportExecution } from '@/modules/DynamicReports/Report'

const {
  executeReport,
  isExecuting,
  executionResult,
  totalRecords,
} = useReportExecution()

const handleExecute = () => {
  executeReport({
    reportId: '123',
    filters: { status: 'active' },
    pagination: { page: 1, limit: 50 },
  })
}
</script>

<template>
  <div>
    <VBtn @click="executeReport">
      Ejecutar Reporte
    </VBtn>
    <div v-if="isExecuting">
      Ejecutando...
    </div>
    <div v-if="executionResult">
      Total: {{ totalRecords }} registros
    </div>
  </div>
</template>
```

### Exportar Reporte
```vue
<script setup>
import { useReportExecution } from '@/modules/DynamicReports/Report'

const { exportReport } = useReportExecution()

const exportToExcel = () => {
  exportReport({
    format: 'excel',
    filename: 'reporte_ventas.xlsx',
    includeHeaders: true,
    includeTotals: true,
  })
}

const exportToPDF = () => {
  exportReport({
    format: 'pdf',
    filename: 'reporte_ventas.pdf',
    orientation: 'landscape',
    pageSize: 'A4',
  })
}
</script>

<template>
  <div>
    <VBtn @click="exportToExcel">
      Exportar a Excel
    </VBtn>
    <VBtn @click="exportToPDF">
      Exportar a PDF
    </VBtn>
  </div>
</template>
```

## 🎨 Personalización

### Temas y Estilos
Los componentes usan el sistema de diseño de Vuetify 3 y pueden personalizarse con CSS variables:

```css
:root {
  --v-theme-primary: #1976d2;
  --v-theme-secondary: #424242;
  --v-theme-success: #4caf50;
  --v-theme-warning: #ff9800;
  --v-theme-error: #f44336;
}
```

### Iconos
Se utilizan iconos de Tabler Icons:
- `tabler-file-spreadsheet` - Excel
- `tabler-file-type-pdf` - PDF
- `tabler-file-text` - CSV
- `tabler-download` - Exportar
- `tabler-sort-ascending` - Ordenar
- `tabler-filter` - Filtrar

## 🧪 Testing

### Unit Tests
```typescript
import { describe, it, expect } from 'vitest'
import { useReportWizard } from '@/modules/DynamicReports/Report'

describe('useReportWizard', () => {
  it('should initialize with default values', () => {
    const { wizardData, currentStep } = useReportWizard()
    
    expect(currentStep.value).toBe(1)
    expect(wizardData.value.basicInfo.name).toBe('')
  })
})
```

### Component Tests
```typescript
import { mount } from '@vue/test-utils'
import ReportWizard from '@/modules/DynamicReports/Report/presentation/components/organisms/ReportWizard.vue'

describe('ReportWizard', () => {
  it('should render all steps', () => {
    const wrapper = mount(ReportWizard)
    
    expect(wrapper.find('.v-stepper').exists()).toBe(true)
    expect(wrapper.findAll('.v-stepper-item')).toHaveLength(6)
  })
})
```

## 📚 Dependencias

- **Vue 3** - Framework principal
- **Vuetify 3** - UI Framework
- **Pinia** - Gestión de estado
- **VeeValidate** - Validaciones
- **Yup** - Esquemas de validación
- **@tabler/icons-vue** - Iconos
- **Axios** - HTTP Client

## 🤝 Contribución

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles. 
