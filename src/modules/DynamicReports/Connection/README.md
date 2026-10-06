# DynamicReports Connection Module

Este módulo implementa la gestión de conexiones para el sistema DynamicReports, siguiendo los principios de **DDD (Domain-Driven Design)** y arquitectura de componentes **Atomic Design**.

## 🏗️ Arquitectura

### Estructura DDD
```
Connection/
├── domain/           # Lógica de dominio
│   ├── entities/     # Entidades de dominio
│   ├── valueObjects/ # Objetos de valor
│   ├── contracts/    # Contratos e interfaces
│   └── events/       # Eventos de dominio
├── application/      # Lógica de aplicación
│   ├── commands/     # Comandos CQRS
│   ├── queries/      # Consultas CQRS
│   ├── handlers/     # Manejadores
│   ├── dtos/         # Objetos de transferencia
│   └── mappers/      # Mapeadores
├── infrastructure/   # Implementaciones técnicas
│   ├── api/          # Servicios API
│   └── persistence/  # Persistencia
└── presentation/     # Capa de presentación
    ├── components/   # Componentes Vue
    ├── stores/       # Stores Pinia
    ├── composables/  # Composables
    └── views/        # Vistas
```

### Arquitectura de Componentes (Atomic Design)

#### 🧬 Atoms (Átomos)
- **ConnectionDriverSelect**: Selector de tipo de conexión con agrupación visual

#### 🧪 Molecules (Moléculas)
- **DatabaseConnectionConfig**: Configuración para conexiones de base de datos
- **ApiConnectionConfig**: Configuración para conexiones API
- **FileConnectionConfig**: Configuración para conexiones de archivos
- **SchemaExplorer**: Explorador de esquemas de base de datos
- **QueryTester**: Probador de consultas SQL

#### 🦠 Organisms (Organismos)
- **ConnectionForm**: Formulario principal de conexiones
- **ConnectionTable**: Tabla de conexiones
- **ConnectionDetail**: Detalle de conexión
- **ConnectionExplorer**: Explorador completo de conexiones

## 🔗 Tipos de Conexiones Soportadas

### 1. Conexiones de Base de Datos
- **MySQL**: Puerto 3306
- **PostgreSQL**: Puerto 5432
- **SQL Server**: Puerto 1433
- **Oracle**: Puerto 1521
- **SQLite**: Sin puerto

### 2. Conexiones API
- **REST API**: Con autenticación Bearer, Basic, API Key o sin autenticación
- **Headers personalizados**: Configuración de headers HTTP
- **URL base**: Configuración de endpoint principal

### 3. Conexiones de Archivo
- **CSV**: Con delimitadores configurables
- **Excel**: Archivos .xlsx y .xls
- **JSON**: Archivos JSON estructurados
- **XML**: Archivos XML

## 🚀 Uso de Componentes

### Formulario de Conexión
```vue
<script setup>
import { ConnectionForm } from '@/modules/DynamicReports/Connection'
</script>

<template>
  <ConnectionForm
    mode="create"
    title="Nueva Conexión"
    @submit="handleSubmit"
    @cancel="handleCancel"
  />
</template>
```

### Explorador de Conexiones
```vue
<script setup>
import { ConnectionExplorer } from '@/modules/DynamicReports/Connection'
</script>

<template>
  <ConnectionExplorer
    :connection-id="connectionId"
    :connection-name="connectionName"
    :driver="driver"
    @table-selected="handleTableSelected"
    @procedure-selected="handleProcedureSelected"
    @query-result="handleQueryResult"
  />
</template>
```

### Componentes Individuales
```vue
<template>
  <!-- Selector de driver -->
  <ConnectionDriverSelect
    v-model="driver"
    :error="errors.driver"
  />

  <!-- Configuración de base de datos -->
  <DatabaseConnectionConfig
    v-model="dbConfig"
    :driver="driver"
    :errors="errors"
  />

  <!-- Configuración de API -->
  <ApiConnectionConfig
    v-model="apiConfig"
    :errors="errors"
  />

  <!-- Configuración de archivo -->
  <FileConnectionConfig
    v-model="fileConfig"
    :errors="errors"
  />
</template>
```

## 🔧 Funcionalidades Avanzadas

### Testing de Conexiones
- **Test antes de guardar**: Valida credenciales sin persistir
- **Test de conexiones existentes**: Prueba conexiones ya guardadas
- **Mensajes detallados**: Información específica sobre errores

### Exploración de Esquemas
- **Tablas y vistas**: Lista todas las tablas y vistas disponibles
- **Procedimientos almacenados**: Explora procedimientos (MySQL, PostgreSQL, SQL Server, Oracle)
- **Columnas**: Muestra estructura de tablas y procedimientos
- **Vista previa**: Previsualización de resultados de procedimientos

### Testing de Consultas
- **SQL personalizado**: Ejecuta consultas SQL directas
- **Query Builder**: Constructor visual de consultas
- **Parámetros**: Soporte para consultas parametrizadas
- **Resultados**: Visualización de resultados en tabla

## 📊 Store y Estado

### ConnectionStore
```typescript
const connectionStore = useConnectionStore()

// Operaciones básicas
await connectionStore.fetchList()
await connectionStore.createItem(data)
await connectionStore.updateItem(id, data)
await connectionStore.deleteItem(id)

// Testing
await connectionStore.testConnectionBeforeSave(data)
await connectionStore.testConnection(id)

// Exploración de esquemas
await connectionStore.fetchTablesAndViews(connectionId)
await connectionStore.fetchProcedures(connectionId)
await connectionStore.fetchColumns(connectionId, { table: 'users' })

// Testing de consultas
await connectionStore.testQuery(connectionId, queryData)
```

## 🎨 Estilos y Temas

Los componentes utilizan **Vuetify 3** con:
- **Density**: `comfortable` para formularios
- **Variants**: `outlined` para cards
- **Colors**: Sistema de colores semánticos
- **Icons**: Material Design Icons
- **Responsive**: Diseño adaptativo

## 🔒 Validaciones

### Validaciones por Tipo de Driver
- **Base de datos**: Host, puerto, nombre de BD, usuario, contraseña
- **API**: URL válida, tipo de autenticación
- **Archivo**: Ruta de archivo, formato, configuración

### Validaciones Dinámicas
- Esquemas de validación que cambian según el driver
- Validación en tiempo real
- Mensajes de error contextuales

## 🧪 Testing

### Componentes Testeables
- Todos los componentes son testeables
- Props bien definidas
- Eventos documentados
- Estados predecibles

### Ejemplo de Test
```typescript
import { mount } from '@vue/test-utils'
import ConnectionForm from './ConnectionForm.vue'

describe('ConnectionForm', () => {
  it('should validate database connection', async () => {
    const wrapper = mount(ConnectionForm, {
      props: { mode: 'create' }
    })
    
    // Test implementation
  })
})
```

## 📝 Convenciones

### Nomenclatura
- **Componentes**: PascalCase (ConnectionForm)
- **Props**: camelCase (connectionId)
- **Events**: kebab-case (table-selected)
- **Types**: PascalCase con sufijo (ConnectionDriver)

### Estructura de Archivos
- **Atoms**: `atoms/ComponentName.vue`
- **Molecules**: `molecules/ComponentName.vue`
- **Organisms**: `organisms/ComponentName.vue`

## 🔄 Integración con Backend

### Endpoints Soportados
- `POST /connections` - Crear conexión
- `GET /connections` - Listar conexiones
- `POST /connections/test-before-save` - Test antes de guardar
- `GET /connections/{id}/tables` - Obtener tablas
- `GET /connections/{id}/procedures` - Obtener procedimientos
- `POST /connections/{id}/test-query` - Probar consulta

### Mapeo de Datos
- **DTOs**: Objetos de transferencia tipados
- **Mappers**: Conversión entre capas
- **Transformers**: Transformación de respuestas API

## 🚀 Próximas Funcionalidades

- [ ] **Conexiones múltiples**: Soporte para múltiples conexiones simultáneas
- [ ] **Caché de esquemas**: Almacenamiento local de esquemas
- [ ] **Historial de consultas**: Guardado de consultas frecuentes
- [ ] **Exportación de esquemas**: Exportar estructura de BD
- [ ] **Monitoreo de conexiones**: Métricas de rendimiento

## 🤝 Contribución

1. Sigue la arquitectura DDD establecida
2. Mantén la separación de responsabilidades
3. Usa TypeScript para tipado fuerte
4. Documenta props y eventos
5. Escribe tests para nuevos componentes
6. Sigue las convenciones de nomenclatura

## 📚 Recursos

- [Documentación del Backend](../docs/backend.md)
- [Guía de DDD](../docs/ddd.md)
- [Atomic Design](../docs/atomic-design.md)
- [Vuetify 3](https://vuetifyjs.com/)
- [Vue 3 Composition API](https://vuejs.org/) 
