# TransportModule - Sistema de Multas

## 📋 Descripción

Este módulo implementa un sistema completo de gestión de multas para el TransportModule, incluyendo:

- **Carga de datos desde API** - Integración con endpoints REST
- **Visualización moderna** - UI/UX optimizada para mostrar multas
- **Mapa interactivo** - Ubicación de multas con Mapbox
- **Filtros avanzados** - Búsqueda y filtrado por estado, tipo, etc.
- **Detalle completo** - Modal con información detallada y evidencia

## 🏗️ Arquitectura

### Tipos TypeScript
- `src/modules/TransportModule/types/fine.ts` - Interfaces y tipos para multas

### Store (Pinia)
- `src/modules/TransportModule/stores/fineStore.ts` - Estado global de multas

### Componentes
- `ConcessionFinesTab.vue` - Tab principal de multas en concesión
- `FineDetailDialog.vue` - Modal de detalle con mapa
- `MapComponent.vue` - Componente de mapa reutilizable

### Configuración
- `src/config/mapbox.ts` - Configuración de Mapbox
- `src/services/endpoints.ts` - Endpoints de API

## 🚀 Características

### 1. Carga de Datos
```typescript
// Cargar multas de una concesión
await fineStore.fetchList(concessionId, {
  include_computed: ['subject_type', 'formatted_amount', 'status_label'],
  include_relations: ['vehicle', 'concession_holder', 'violation_type']
})
```

### 2. Filtros y Búsqueda
- **Por estado**: Todas, Pendientes, Pagadas, Vencidas
- **Búsqueda de texto**: Número de multa, tipo de violación, lugar, etc.
- **Estadísticas en tiempo real**

### 3. Visualización de Mapa
- **Mapbox integrado** con configuración flexible
- **Marcadores personalizados** para ubicación de multas
- **Popups informativos** con detalles de ubicación
- **Diferentes tipos de mapa** según el contexto

### 4. Detalle de Multa
- **Información completa** - Estado, montos, fechas, ubicación
- **Sujeto de la multa** - Concesión, concesionario o conductor
- **Tipo de violación** - Con severidad y descripción
- **Evidencias fotográficas** - Galería de imágenes
- **Historial de pagos** - Pagos realizados
- **Mapa de ubicación** - Ubicación exacta de la multa

## 🔧 Configuración

### Variables de Entorno
```env
# Token de Mapbox para mapas
VITE_MAPBOX_KEY=your_mapbox_token_here
```

### API Endpoints
```typescript
// Lista de multas por concesión
GET /api/transport/fines/concession/{concessionId}

// Detalle de multa específica
GET /api/transport/fines/{fineId}
```

## 📱 UI/UX Features

### Diseño Responsivo
- **Grid adaptativo** - Se ajusta a diferentes tamaños de pantalla
- **Cards interactivas** - Hover effects y transiciones suaves
- **Filtros intuitivos** - Botones de grupo para filtros rápidos

### Estados Visuales
- **Colores semánticos** - Verde para pagadas, rojo para vencidas, etc.
- **Iconos descriptivos** - Diferentes iconos según tipo de sujeto
- **Chips informativos** - Estado, tipo de violación, severidad
- **Alertas contextuales** - Información del sujeto de la multa

### Interacciones
- **Click para ver detalle** - Cards clickeables
- **Búsqueda en tiempo real** - Filtrado instantáneo
- **Navegación por tabs** - Información organizada en pestañas

## 🎯 Casos de Uso

### 1. Gestión de Multas por Concesión
- Ver todas las multas asociadas a una concesión
- Filtrar por estado (pendientes, pagadas, vencidas)
- Buscar multas específicas
- Ver estadísticas de montos

### 2. Análisis de Ubicación
- Visualizar ubicación exacta de multas en mapa
- Identificar patrones geográficos
- Verificar evidencia fotográfica

### 3. Seguimiento de Pagos
- Ver historial de pagos por multa
- Identificar multas pendientes de pago
- Calcular montos totales adeudados

## 🔍 Filtros Disponibles

### Por Estado
- **Todas** - Muestra todas las multas
- **Pendientes** - Multas emitidas o vencidas
- **Pagadas** - Multas completamente pagadas
- **Vencidas** - Multas que han pasado la fecha límite

### Por Sujeto
- **Concesión** - Multas directas a la concesión
- **Concesionario** - Multas al titular de la concesión
- **Conductor** - Multas al conductor del vehículo

### Por Búsqueda
- Número de multa
- Tipo de violación
- Lugar de la infracción
- Nombre del concesionario
- Placa del vehículo

## 📊 Estadísticas

El sistema calcula automáticamente:
- **Total de multas** - Cantidad total
- **Multas pendientes** - Sin pagar
- **Multas pagadas** - Completamente pagadas
- **Multas vencidas** - Pasadas de fecha
- **Monto total** - Suma de todas las multas
- **Monto pendiente** - Suma de multas sin pagar

## 🗺️ Integración con Mapbox

### Configuración
```typescript
// Configuración por tipo de mapa
const mapConfig = getMapConfig('fine_location')
// Zoom: 15, Estilo: streets, Altura: 400px
```

### Tipos de Mapa
- **fine_location** - Para ubicación de multas (zoom alto)
- **vehicle_tracking** - Para seguimiento de vehículos
- **concession_overview** - Para vista general de concesiones

## 🚀 Uso

### En ConcessionDetail.vue
```vue
<ConcessionFinesTab
  :concession="concession"
  :concession-id="concession?.id"
  :loading="loading"
  @refresh="fetchConcessionDetail"
/>
```

### En cualquier componente
```vue
<FineDetailDialog
  v-model:visible="showDialog"
  :fine="selectedFine"
  @close="closeDialog"
/>
```

## 🔧 Mantenimiento

### Agregar Nuevos Filtros
1. Actualizar `FineFilters` interface
2. Agregar lógica en `fines` computed
3. Actualizar UI con nuevos controles

### Agregar Nuevos Campos
1. Actualizar `Fine` interface
2. Actualizar API calls en store
3. Actualizar componentes de visualización

### Personalizar Mapa
1. Modificar `MAPBOX_CONFIG` en `mapbox.ts`
2. Agregar nuevos tipos de mapa
3. Actualizar `MapComponent` si es necesario

## 📝 Notas Técnicas

- **Lazy loading** - Mapbox se carga dinámicamente
- **Error handling** - Manejo robusto de errores de API
- **Type safety** - TypeScript en toda la implementación
- **Performance** - Computed properties para cálculos eficientes
- **Accessibility** - Componentes accesibles con Vuetify
