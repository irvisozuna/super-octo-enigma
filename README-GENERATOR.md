# DDD Module Generator from Specs

Este sistema permite generar módulos completos con arquitectura DDD (Domain-Driven Design) para Vue 3 + TypeScript basándose en archivos de especificación JSON.

## 🚀 Características

- **Generación automática** de módulos desde archivos spec JSON
- **Arquitectura DDD completa** con todas las capas (Domain, Application, Infrastructure, Presentation)
- **Múltiples entidades** por módulo con relaciones complejas
- **Componentes Vue funcionales** con formularios y tablas inteligentes
- **Stores Pinia** con gestión de estado completa
- **Sistema de permisos** integrado con CASL
- **Export/Import** de datos
- **Caché offline** con IndexedDB
- **WebSocket** para actualizaciones en tiempo real
- **Tests unitarios y E2E** incluidos
- **Documentación automática** del módulo

## 📁 Estructura del Spec

Crea archivos JSON en la carpeta `specs/` con la siguiente estructura:

```json
{
  "moduleName": "DynamicReports",
  "version": "1.0.0",
  "description": "Módulo de reportes dinámicos configurables",
  "author": "Development Team",
  "framework": "vue",
  "language": "typescript",
  
  "entities": {
    "Connection": {
      "table": "dynamic_report_connections",
      "properties": {
        "id": {
          "type": "uuid",
          "primary": true,
          "generated": true
        },
        "name": {
          "type": "string",
          "required": true
        },
        "driver": {
          "type": "enum",
          "values": ["mysql", "pgsql", "sqlsrv", "oracle", "sqlite"],
          "required": true
        },
        "host": {
          "type": "string",
          "required": true
        },
        "port": {
          "type": "integer",
          "required": true
        },
        "database_name": {
          "type": "string",
          "required": true
        },
        "username": {
          "type": "string",
          "required": true
        },
        "password": {
          "type": "string",
          "required": true,
          "encrypted": true
        },
        "status": {
          "type": "enum",
          "values": ["active", "inactive", "testing", "error"],
          "default": "inactive"
        },
        "created_at": {
          "type": "datetime",
          "generated": true
        },
        "updated_at": {
          "type": "datetime",
          "generated": true
        }
      },
      "indexes": ["name", "driver"]
    }
  },
  
  "relationships": {
    "Connection": {
      "hasMany": ["DataSource"]
    }
  },
  
  "features": {
    "crud": true,
    "export": true,
    "cache": true,
    "audit": true
  },
  
  "permissions": {
    "casl": {
      "enabled": true,
      "subjects": ["Connection", "DataSource", "Report", "Execution"],
      "actions": ["manage", "create", "read", "update", "delete", "execute", "export", "test"]
    }
  },
  
  "routing": {
    "basePath": "/dynamic-reports",
    "routes": [...]
  },
  
  "ui": {
    "theme": {
      "primary": "teal",
      "secondary": "gray"
    },
    "icon": "tabler-report-analytics",
    "color": "teal"
  }
}
```

## 🛠️ Uso

### 1. Generar desde Specs

```bash
# Ejecutar el generador interactivo
npm run generate:from-spec

# O ejecutar directamente
node scripts/generateModuleFromSpec.mjs
```

### 2. Generar módulo específico

```bash
# Generar módulo desde spec específico
node scripts/test-generate-from-spec.mjs
```

### 3. Generar módulo manual

```bash
# Generar módulo manual
npm run generate:module
```

## 📋 Tipos de Propiedades Soportadas

### Básicos
- `string` - Texto simple
- `integer` - Número entero
- `boolean` - Valor booleano
- `text` - Texto largo (textarea)
- `datetime` - Fecha y hora
- `uuid` - Identificador único

### Avanzados
- `enum` - Enumeración con valores específicos
- `json` - Objeto JSON
- `encrypted` - Campo encriptado (para passwords)

### Especiales
- `primary` - Clave primaria
- `generated` - Generado automáticamente
- `required` - Campo obligatorio
- `default` - Valor por defecto

## 🏗️ Estructura Generada

```
modules/
└── dynamic-reports/
    ├── domain/
    │   ├── entities/
    │   ├── valueObjects/
    │   ├── events/
    │   ├── exceptions/
    │   └── contracts/
    ├── application/
    │   ├── commands/
    │   ├── queries/
    │   ├── handlers/
    │   ├── dtos/
    │   ├── mappers/
    │   └── useCases/
    ├── infrastructure/
    │   ├── api/
    │   ├── persistence/
    │   └── websocket/
    ├── presentation/
    │   ├── views/
    │   ├── components/
    │   ├── stores/
    │   └── composables/
    ├── shared/
    │   ├── types/
    │   ├── constants/
    │   ├── utils/
    │   └── locales/
    ├── tests/
    │   ├── unit/
    │   ├── integration/
    │   └── e2e/
    ├── index.ts
    ├── module.config.ts
    ├── container.ts
    ├── menu.ts
    └── types.ts
```

## 🎨 Componentes Generados

### Formularios Inteligentes
- Detección automática de tipos de campos
- Validación con Zod
- Relaciones con otras entidades
- Enums con opciones predefinidas
- Campos encriptados para passwords

### Tablas Avanzadas
- Filtros por enums
- Búsqueda global
- Relaciones mostradas como nombres
- Acciones contextuales
- Paginación

### Stores Complejos
- Gestión de estado reactiva
- Filtros y búsqueda
- Estadísticas automáticas
- Relaciones entre entidades
- Permisos integrados

## 🔐 Sistema de Permisos

El sistema genera automáticamente:

- **Permisos CASL** para cada entidad
- **Roles predefinidos** (admin, manager, user, viewer)
- **Permisos a nivel de campo** para datos sensibles
- **Validación en componentes** Vue

## 📊 Características Especiales

### Export/Import
- Export a Excel, PDF, CSV, JSON
- Import desde Excel y CSV
- Validación de datos
- Procesamiento en background

### Caché Offline
- IndexedDB para almacenamiento local
- Sincronización automática
- Gestión de conflictos

### WebSocket
- Actualizaciones en tiempo real
- Eventos de dominio
- Reconexión automática

## 🧪 Testing

### Tests Unitarios
- Tests de dominio
- Tests de aplicación
- Tests de infraestructura
- Tests de presentación

### Tests E2E
- Flujos completos de CRUD
- Validación de permisos
- Export/Import
- WebSocket

## 📚 Documentación

Cada módulo incluye:

- **README.md** - Documentación del módulo
- **API.md** - Documentación de endpoints
- **ARCHITECTURE.md** - Arquitectura DDD
- **TESTING.md** - Guía de testing

## 🔧 Configuración

### Dependencias
El sistema detecta automáticamente las dependencias necesarias:

```json
{
  dependencies: {
    core: ['vue@^3.4.0', 'pinia@^2.1.0'],
    ui: ['@headlessui/vue@^1.7.0'],
    validation: ['vee-validate@^4.11.0'],
    utilities: ['lodash-es@^4.17.0']
  },
}
```

### Build Configuration
```json
{
  buildConfig: {
    vite: {
      plugins: ['vue', 'typescript'],
      alias: {
        '@': './src',
        '@modules': './src/modules'
      },
    }
  },
}
```

## 🚀 Ejemplo Completo

Ver el archivo `specs/dynamic-reports.json` para un ejemplo completo de un módulo de reportes dinámicos con:

- 4 entidades (Connection, DataSource, Report, Execution)
- Relaciones complejas
- Enums múltiples
- Export/Import
- Permisos granulares
- UI personalizada

## 📝 Notas

- Los módulos generados son **plug-and-play**
- Incluyen **toda la funcionalidad CRUD**
- Son **completamente tipados** con TypeScript
- Siguen **mejores prácticas** de Vue 3 y DDD
- Son **escalables** y **mantenibles**

## 🤝 Contribuir

1. Crea un spec JSON en `specs/`
2. Ejecuta el generador
3. Personaliza según necesidades
4. Comparte mejoras en los stubs 
