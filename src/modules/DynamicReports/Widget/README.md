# Widget Module

## Descripción

Módulo para la creación y gestión de widgets que visualizan datos de DataSources en diferentes formatos (gráficos, tablas, KPIs, mapas, etc.).

## Arquitectura DDD

Este módulo sigue los principios de Domain-Driven Design (DDD) con las siguientes capas:

### Domain Layer

#### Entities
- **Widget**: Entidad principal que representa un widget
  - Define tipo, configuración de consulta y visualización
  - Gestiona cache, refresh, filtros y transformaciones
  - Métodos de negocio para actualizar config, agregar filtros, etc.

#### Value Objects
- **WidgetId**: Identificador único del widget

#### Enums
- **WidgetTypeEnum**: Tipos de widgets disponibles
  - Metrics: STAT
  - Charts: LINE, BAR, PIE, AREA, DONUT, RADIAL, SCATTER
  - Data: TABLE, LIST
  - Visualization: GAUGE, PROGRESS, TIMELINE, CALENDAR, MAP
  - Custom: CUSTOM_HTML

- **WidgetCategory**: Categorías para agrupar
  - metrics, charts, data, visualization, custom

#### Events
- **WidgetCreated**: Evento de creación
- **WidgetUpdated**: Evento de actualización
- **WidgetDeleted**: Evento de eliminación

#### Types
Configuraciones específicas por tipo de widget:

- **QueryConfig**: Configuración de consulta (fields, aggregations, filters, sorting)
- **DisplayConfig**: Configuración de visualización
  - StatDisplayConfig
  - ChartDisplayConfig
  - TableDisplayConfig
  - MapDisplayConfig
  - GaugeDisplayConfig
  - ProgressDisplayConfig
  - ListDisplayConfig
  - TimelineDisplayConfig
  - CalendarDisplayConfig
  - CustomHtmlDisplayConfig

### Application Layer

#### Use Cases
- CreateWidgetUseCase
- UpdateWidgetUseCase
- DeleteWidgetUseCase
- GetWidgetByIdUseCase
- GetWidgetListUseCase
- ExecuteWidgetQueryUseCase
- RefreshWidgetDataUseCase

#### Services
- WidgetDataService: Carga datos del DataSource
- WidgetTransformService: Transforma datos para widgets

#### Factories
- WidgetFactory: Crea widgets según tipo

#### DTOs
- WidgetCreateDto
- WidgetUpdateDto
- WidgetResponseDto

#### Mappers
- WidgetMapper: Transforma entre entidades y DTOs

### Infrastructure Layer

#### API Services
- WidgetApiService: Comunicación con backend

#### Repositories
- WidgetRepositoryImpl: Implementación del repositorio

### Presentation Layer

#### Components

**Widgets (tipos de visualización):**
- StatWidget.vue: KPI/Contador
- ChartWidget.vue: Gráficos (ApexCharts)
- TableWidget.vue: Tabla de datos
- GaugeWidget.vue: Medidor/Gauge
- MapWidget.vue: Mapa geográfico
- ListWidget.vue: Lista de items
- CalendarWidget.vue: Calendario
- ProgressWidget.vue: Barra de progreso
- TimelineWidget.vue: Línea de tiempo
- CustomHTMLWidget.vue: HTML personalizado

**Atoms:**
- WidgetContainer.vue: Contenedor base
- WidgetHeader.vue: Cabecera con título y acciones

**Organisms:**
- WidgetBuilder.vue: Constructor de widgets
- WidgetConfigPanel.vue: Panel de configuración

#### Stores
- widgetStore.ts: Estado global de widgets (Pinia)

#### Composables
- useWidgetData.ts: Carga y gestión de datos
- useWidgetRefresh.ts: Auto-refresh
- useWidgetExport.ts: Exportación

## Tipos de Widgets

### 1. STAT Widget (KPI/Contador)
Muestra una métrica clave con icono, valor y tendencia.

```typescript
{
  type: WidgetTypeEnum.STAT,
  display_config: {
    stat: {
      value_field: 'total_sales',
      label: 'Ventas Totales',
      icon: 'tabler-cash',
      color: 'success',
      format: 'currency',
      show_trend: true,
      trend_field: 'growth_rate',
    }
  }
}
```

### 2. CHART Widgets (Gráficos)

#### LINE (Líneas)
```typescript
{
  type: WidgetTypeEnum.CHART_LINE,
  display_config: {
    chart: {
      x_axis_field: 'date',
      y_axis_field: 'revenue',
      curve: 'smooth',
      colors: ['#1976D2'],
      data_labels: true,
    }
  }
}
```

#### BAR (Barras)
```typescript
{
  type: WidgetTypeEnum.CHART_BAR,
  display_config: {
    chart: {
      x_axis_field: 'product',
      y_axis_field: 'sales',
      horizontal: false,
      stacked: false,
    }
  }
}
```

#### PIE/DONUT (Torta/Dona)
```typescript
{
  type: WidgetTypeEnum.CHART_PIE,
  display_config: {
    chart: {
      x_axis_field: 'category',
      y_axis_field: 'percentage',
      legend_position: 'bottom',
    }
  }
}
```

### 3. TABLE Widget (Tabla)
```typescript
{
  type: WidgetTypeEnum.TABLE,
  display_config: {
    table: {
      columns: [
        { field: 'id', title: 'ID', type: 'number' },
        { field: 'name', title: 'Nombre', type: 'text' },
        { field: 'amount', title: 'Monto', type: 'currency' },
      ],
      pagination: true,
      rows_per_page: 10,
      sortable: true,
      filterable: true,
    }
  }
}
```

### 4. MAP Widget (Mapa)
```typescript
{
  type: WidgetTypeEnum.MAP,
  display_config: {
    map: {
      lat_field: 'latitude',
      lng_field: 'longitude',
      zoom_level: 10,
      marker_config: {
        color_field: 'status',
        default_color: '#1976D2',
      },
      cluster_markers: true,
    }
  }
}
```

### 5. GAUGE Widget (Medidor)
```typescript
{
  type: WidgetTypeEnum.GAUGE,
  display_config: {
    gauge: {
      value_field: 'completion',
      max_value: 100,
      unit: '%',
      color_ranges: [
        { from: 0, to: 50, color: '#DC2626' },
        { from: 50, to: 75, color: '#EAB308' },
        { from: 75, to: 100, color: '#16A34A' },
      ],
    }
  }
}
```

### 6. LIST Widget (Lista)
```typescript
{
  type: WidgetTypeEnum.LIST,
  display_config: {
    list: {
      title_field: 'title',
      subtitle_field: 'subtitle',
      description_field: 'description',
      icon_field: 'icon',
      max_items: 10,
      show_dividers: true,
    }
  }
}
```

### 7. TIMELINE Widget (Línea de Tiempo)
```typescript
{
  type: WidgetTypeEnum.TIMELINE,
  display_config: {
    timeline: {
      date_field: 'created_at',
      title_field: 'event_name',
      description_field: 'details',
      icon_field: 'type_icon',
      sort_direction: 'DESC',
    }
  }
}
```

### 8. CALENDAR Widget (Calendario)
```typescript
{
  type: WidgetTypeEnum.CALENDAR,
  display_config: {
    calendar: {
      date_field: 'event_date',
      title_field: 'event_title',
      start_field: 'start_time',
      end_field: 'end_time',
      view: 'month',
    }
  }
}
```

## Configuración de Consulta

```typescript
interface QueryConfig {
  fields: string[]                    // Campos a traer
  aggregations?: [                    // Agregaciones
    {
      field: 'amount',
      function: 'SUM',
      alias: 'total_amount'
    }
  ],
  filters?: [                         // Filtros
    {
      field: 'status',
      operator: 'eq',
      value: 'active'
    }
  ],
  sorting?: [                         // Ordenamiento
    {
      field: 'created_at',
      direction: 'DESC'
    }
  ],
  limit?: 100,                        // Límite de registros
  groupBy?: ['category']              // Agrupar por
}
```

## Transformaciones de Datos

Los widgets pueden aplicar transformaciones a los datos antes de visualizarlos:

```typescript
{
  transformations: [
    {
      type: 'filter',
      config: { condition: 'value > 1000' }
    },
    {
      type: 'map',
      config: { field: 'amount', transform: 'value / 1000' }
    },
    {
      type: 'sort',
      config: { field: 'date', direction: 'DESC' }
    }
  ]
}
```

## Cache y Auto-Refresh

```typescript
{
  cache_enabled: true,
  cache_ttl: 300,                     // 5 minutos
  refresh_interval: 60,               // Auto-refresh cada 60s
}
```

## Metadata de Tipos

Cada tipo de widget tiene metadata asociada:

```typescript
WidgetTypeMetadata[WidgetTypeEnum.STAT] = {
  name: 'Estadística',
  description: 'Muestra una métrica clave con icono y tendencia',
  icon: 'tabler-chart-line',
  category: 'metrics',
  minSize: { w: 2, h: 2 },
  defaultSize: { w: 3, h: 2 },
}
```

## Uso

### Crear Widget

```typescript
import { Widget } from './domain/entities/Widget'
import { WidgetTypeEnum } from './domain/enums/WidgetTypeEnum'

const widget = Widget.create({
  name: 'Ventas Mensuales',
  description: 'Gráfico de ventas del último mes',
  type: WidgetTypeEnum.CHART_LINE,
  data_source_id: 'datasource-123',
  query_config: {
    fields: ['date', 'amount'],
    sorting: [{ field: 'date', direction: 'ASC' }],
    limit: 30,
  },
  display_config: {
    chart: {
      x_axis_field: 'date',
      y_axis_field: 'amount',
      curve: 'smooth',
      colors: ['#1976D2'],
    },
  },
  cache_enabled: true,
  cache_ttl: 300,
})
```

### Cargar Datos del Widget

```typescript
// En el composable useWidgetData.ts
const loadWidgetData = async (widget: Widget) => {
  // 1. Ejecutar query en el DataSource
  const queryResult = await executeDataSourceQuery(
    widget.data_source_id,
    widget.query_config
  )

  // 2. Aplicar transformaciones
  const transformedData = applyTransformations(
    queryResult.data,
    widget.transformations
  )

  // 3. Retornar datos formateados
  return {
    rows: transformedData,
    columns: queryResult.columns,
    total: queryResult.total,
  }
}
```

## Widget Factory

```typescript
// En application/factories/WidgetFactory.ts
export class WidgetFactory {
  static createFromType(type: WidgetTypeEnum, props: Partial<WidgetProps>): Widget {
    const metadata = WidgetTypeMetadata[type]

    return Widget.create({
      ...props,
      type,
      display_config: this.getDefaultDisplayConfig(type),
      query_config: props.query_config || { fields: [] },
    })
  }

  private static getDefaultDisplayConfig(type: WidgetTypeEnum): DisplayConfig {
    // Retorna configuración por defecto según el tipo
    switch (type) {
      case WidgetTypeEnum.STAT:
        return {
          stat: {
            value_field: '',
            label: '',
            format: 'number',
          },
        }
      // ... otros tipos
    }
  }
}
```

## Próximos Pasos

1. ✅ Completar Application Layer (Use Cases, Services, Factories)
2. ⏳ Implementar Infrastructure Layer (API Services, Repositories)
3. ⏳ Crear Presentation Layer (Stores, Composables)
4. ⏳ Implementar componentes de cada tipo de widget
5. ⏳ Integrar con módulo Dashboard
6. ⏳ Añadir tests unitarios
7. ⏳ Documentación completa
