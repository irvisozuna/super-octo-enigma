# Data Source Form

Este formulario permite crear y editar Data Sources para el módulo Dynamic Reports.

## Características

- **Selector de Conexiones**: Permite seleccionar una conexión existente de la base de datos
- **Editor de SQL**: Área de texto expandible para escribir consultas SQL personalizadas
- **Campos Disponibles**: Gestión dinámica de campos con tipos de datos
- **Definiciones de Filtros**: Configuración de filtros para los reportes
- **Datos de Ejemplo**: Botón para cargar datos de ejemplo y entender la estructura

## Estructura del JSON

El formulario genera un JSON con la siguiente estructura:

```json
{
  connection_id: '9f42fcdb-dc56-4964-a617-defdebe7c1d5',
  name: 'Ingresos JAPAMA',
  type: 'custom_sql',
  custom_sql: 'SELECT fk_payment_source as FOLIO, fecha_pago as FECHA...',
  available_fields: {
    FOLIO: { "label": 'Folio', type: 'text'},
    FECHA: { "label": 'Fecha', type: 'datetime'},
    TOTAL: { "label": 'Total', type: 'currency'}
  },
  filter_definitions: {
    anio_origen: { "label": 'Ejercicio', type: 'select', options: 'dynamic'},
    fecha_pago: { "label": 'Rango de Fechas', type: 'date_range'}
  },
}
```

## Tipos de Campos Disponibles

- **text**: Campo de texto simple
- **number**: Campo numérico
- **currency**: Campo de moneda
- **date**: Campo de fecha
- **datetime**: Campo de fecha y hora
- **boolean**: Campo booleano
- **masked**: Campo enmascarado (para datos sensibles)

## Tipos de Filtros

- **select**: Selector simple
- **multiselect**: Selector múltiple
- **date_range**: Rango de fechas
- **text**: Campo de texto
- **number**: Campo numérico

## Cómo Usar

1. **Seleccionar Conexión**: Elige una conexión de la base de datos
2. **Nombre del Data Source**: Asigna un nombre descriptivo
3. **Tipo**: Selecciona el tipo de data source (Custom SQL, Visual Builder, Hybrid)
4. **SQL Personalizado**: Escribe tu consulta SQL
5. **Campos Disponibles**: 
   - Haz clic en el botón "+" para agregar campos
   - Define el nombre del campo, etiqueta y tipo
   - Usa el botón de eliminar para quitar campos
6. **Definiciones de Filtros**:
   - Agrega filtros con el botón "+"
   - Configura nombre, etiqueta, tipo y opciones
7. **Datos de Ejemplo**: Usa el botón "Load Example" para ver un ejemplo completo

## Ejemplo Completo

El botón "Load Example" carga automáticamente:

- **Nombre**: "Ingresos JAPAMA"
- **SQL**: Consulta completa para ingresos
- **Campos**: 24 campos con tipos apropiados
- **Filtros**: 10 filtros para diferentes criterios

## Endpoint

El formulario envía los datos al endpoint:
```
POST /dynamic-reports/data-sources
```

## Validaciones

- Connection ID es requerido
- Nombre es requerido
- SQL personalizado es requerido
- Los campos disponibles deben tener label y tipo
- Los filtros deben tener label y tipo

## Componentes Relacionados

- `DataSourceAdd.vue`: Vista para crear nuevos data sources
- `DataSourceEdit.vue`: Vista para editar data sources existentes
- `DataSourceList.vue`: Lista de data sources
- `dataSourceStore.ts`: Store para manejo de estado 
