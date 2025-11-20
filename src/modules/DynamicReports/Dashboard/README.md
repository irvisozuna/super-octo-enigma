# Dashboard Module

## Descripción

Módulo para la creación y gestión de dashboards personalizados con widgets dinámicos que consumen datos de DataSources.

## Arquitectura DDD

Este módulo sigue los principios de Domain-Driven Design (DDD) con las siguientes capas:

### Domain Layer

#### Entities
- **Dashboard**: Entidad principal que representa un dashboard
  - Gestiona widgets, layout, tema, permisos
  - Soporta auto-refresh, filtros globales, acciones personalizadas
  - Métodos de negocio para agregar/quitar widgets, clonar dashboard, etc.

#### Value Objects
- **DashboardId**: Identificador único del dashboard

#### Events
- **DashboardCreated**: Evento de creación de dashboard
- **DashboardUpdated**: Evento de actualización
- **DashboardDeleted**: Evento de eliminación
- **WidgetAdded**: Evento cuando se agrega un widget
- **WidgetRemoved**: Evento cuando se quita un widget

#### Types
- **DashboardLayout**: Configuración del grid (columnas, filas, gaps)
- **DashboardTheme**: Tema visual (colores, fuentes, modo claro/oscuro)
- **DashboardPermission**: Permisos de usuario/rol/departamento
- **DashboardGlobalFilter**: Filtros que afectan a todos los widgets
- **AutoRefreshConfig**: Configuración de actualización automática
- **DashboardExportConfig**: Opciones de exportación (PDF, PNG, JSON)
- **DashboardTemplate**: Templates predefinidos
- **DashboardCategory**: Categorización de dashboards

### Application Layer

#### Use Cases
- CreateDashboardUseCase
- UpdateDashboardUseCase
- DeleteDashboardUseCase
- GetDashboardByIdUseCase
- GetDashboardListUseCase
- AddWidgetToDashboardUseCase
- RemoveWidgetUseCase
- CloneDashboardUseCase
- ShareDashboardUseCase
- ExportDashboardUseCase

#### DTOs
- DashboardCreateDto
- DashboardUpdateDto
- DashboardResponseDto

#### Mappers
- DashboardMapper: Transforma entre entidades de dominio y DTOs

### Infrastructure Layer

#### API Services
- DashboardApiService: Comunicación con el backend

#### Repositories
- DashboardRepositoryImpl: Implementación del repositorio

### Presentation Layer

#### Views
- **DashboardList.vue**: Lista de dashboards
- **DashboardBuilder.vue**: Editor drag-and-drop
- **DashboardViewer.vue**: Visualización del dashboard

#### Components

**Organisms:**
- DashboardGrid.vue: Grid con drag-and-drop para widgets
- DashboardToolbar.vue: Barra de herramientas (refresh, export, share)
- DashboardWizard.vue: Asistente de creación

**Molecules:**
- GridCell.vue: Celda individual del grid
- WidgetSelector.vue: Selector de widgets disponibles
- DashboardCard.vue: Card de dashboard en lista

**Atoms:**
- DashboardIcon.vue
- RefreshButton.vue

#### Stores
- dashboardStore.ts: Estado global de dashboards (Pinia)

#### Composables
- useDashboardLayout.ts: Lógica del grid layout
- useDashboardTheme.ts: Gestión de temas
- useDashboardRefresh.ts: Auto-refresh
- useDashboardExport.ts: Exportación

## Propiedades del Dashboard

```typescript
interface DashboardProps {
  id: string
  name: string
  description?: string
  slug: string
  layout: DashboardLayout           // Config del grid (12 cols)
  widgets: WidgetInstanceConfig[]   // Widgets en el dashboard
  theme?: DashboardTheme
  is_public: boolean
  is_shared: boolean
  is_favorite: boolean
  category_id?: string
  refresh_config?: AutoRefreshConfig
  permissions?: DashboardPermission[]
  global_filters?: DashboardGlobalFilter[]
  actions?: DashboardAction[]
  export_config?: DashboardExportConfig
  share_config?: DashboardShareConfig
  tags?: string[]
  view_count: number
  last_viewed_at?: Date
  created_by: string
  updated_by: string
  created_at: Date
  updated_at: Date
}
```

## Configuración de Widget en Dashboard

```typescript
interface WidgetInstanceConfig {
  id: string
  widget_id: string                 // Ref a Widget entity
  position: {
    x: number                       // Columna (0-11)
    y: number                       // Fila
    w: number                       // Ancho en columnas
    h: number                       // Alto en filas
  }
  config: Record<string, any>       // Config personalizada
  filters?: WidgetFilter[]          // Filtros del widget
  title?: string                    // Título personalizado
  description?: string              // Descripción personalizada
}
```

## Grid Layout System

El dashboard usa un sistema de grid de **12 columnas**:

- Cada widget ocupa un área rectangular definida por (x, y, w, h)
- No se permiten solapamientos
- Responsive: diferentes columnas por breakpoint (xs, sm, md, lg, xl)
- Drag & drop para reordenar
- Resize para ajustar tamaño

## Features

### ✅ Gestión de Dashboards
- Crear, editar, eliminar dashboards
- Clonar dashboards existentes
- Organizar por categorías
- Tags para búsqueda
- Favoritos

### ✅ Grid Layout
- Sistema de 12 columnas
- Drag & drop de widgets
- Redimensionamiento
- Responsive automático
- Validación de solapamientos

### ✅ Temas y Personalización
- Modo claro/oscuro/auto
- Colores personalizados
- Fuentes personalizadas
- CSS personalizado

### ✅ Filtros Globales
- Aplicar filtros a múltiples widgets
- Tipos: text, number, date, select, multiselect
- Valores por defecto

### ✅ Auto-Refresh
- Actualización automática configurable
- Intervalo personalizado (mínimo 5s)
- Refresh selectivo por widget
- Notificaciones opcionales

### ✅ Compartir y Permisos
- Dashboards públicos/privados
- Compartir con usuarios/roles/departamentos
- Permisos granulares (read, write, delete, share)
- Links públicos con expiración
- Protección con contraseña

### ✅ Exportación
- Formatos: PDF, PNG, JPG, JSON
- Incluir/excluir filtros
- Orientación y tamaño personalizado
- Calidad ajustable

### ✅ Auditoría
- Registro de acciones (created, updated, deleted, viewed, shared, exported)
- Contador de vistas
- Última visualización
- Metadatos adicionales

## Uso

### Crear Dashboard

```typescript
import { Dashboard } from './domain/entities/Dashboard'

const dashboard = Dashboard.create({
  name: 'Mi Dashboard',
  description: 'Dashboard de ventas',
  layout: {
    columns: 12,
    gap: 16,
    padding: 24,
  },
  widgets: [],
  theme: {
    mode: 'auto',
    primary_color: '#1976D2',
  },
  refresh_config: {
    enabled: true,
    interval: 60, // 60 segundos
  },
})
```

### Agregar Widget

```typescript
const widgetConfig: WidgetInstanceConfig = {
  id: 'widget-1',
  widget_id: 'stats-widget-id',
  position: { x: 0, y: 0, w: 3, h: 2 },
  config: {},
  title: 'Ventas del Mes',
}

dashboard.getValue().addWidget(widgetConfig)
```

### Filtros Globales

```typescript
const filter: DashboardGlobalFilter = {
  id: 'date-filter',
  field: 'created_at',
  type: 'date',
  label: 'Fecha',
  operator: 'gte',
  default_value: '2025-01-01',
}

dashboard.getValue().addGlobalFilter(filter)
```

## Próximos Pasos

1. ✅ Completar Application Layer (Use Cases, DTOs, Mappers)
2. ⏳ Implementar Infrastructure Layer (API Services, Repositories)
3. ⏳ Crear Presentation Layer (Stores, Composables, Views)
4. ⏳ Implementar componentes de widgets
5. ⏳ Crear Dashboard Builder con drag-and-drop
6. ⏳ Integrar con módulo Widget
7. ⏳ Añadir tests unitarios
8. ⏳ Documentación completa
