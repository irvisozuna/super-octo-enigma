# 🏗️ Generador de Módulos DDD - Guía Completa

## 🚀 ¿Qué Problema Resuelve?

Antes tenías que:
- ❌ Hardcodear módulos específicos en scripts
- ❌ Copiar y modificar código manualmente  
- ❌ Variables de template sin reemplazar (`{{moduleName}}`)
- ❌ Arquitectura DDD inconsistente

Ahora tienes:
- ✅ **Generador genérico** que lee specs JSON
- ✅ **Módulos completamente funcionales** sin editar código
- ✅ **Arquitectura DDD perfecta** desde el minuto 1
- ✅ **Reutilizable** para cualquier tipo de módulo

---

## 📋 3 Formas de Generar Módulos

### 1️⃣ **Crear Módulo Nuevo (Recomendado)**
```bash
npm run create:module InventoryManager
npm run create:module BlogSystem  
npm run create:module CRMModule
```

**Flujo:**
1. 📄 Crea spec desde template base
2. ✏️ Te permite editarlo  
3. 🚀 Genera módulo automáticamente
4. 📁 Te muestra la estructura creada

### 2️⃣ **Generar desde Spec Existente**
```bash
npm run generate:from-spec specs/dashboad-monitor.json
npm run generate:from-spec specs/mi-modulo.json
```

### 3️⃣ **Clonar Módulo Existente**
```bash
npm run create:module NewModule --from specs/dashboad-monitor.json
```

---

## 📁 Estructura de Archivos

```bash
📁 specs/
├── 📄 spectBase.json           # Template base para nuevos módulos
├── 📄 dashboad-monitor.json    # Ejemplo: Dashboard de lecturas
└── 📄 tu-modulo.json          # Tu spec personalizado

📁 scripts/
├── 📄 createNewModule.mjs      # Script principal (recomendado)
├── 📄 generateModuleFromSpec.mjs # Generador genérico
└── 📄 generateFunctionalDashboard.mjs # Script específico (deprecated)

📁 src/modules/
└── 📁 tu-modulo/              # Módulo generado con DDD completo
    ├── 📂 domain/             # Entidades, Value Objects, Eventos
    ├── 📂 application/        # Use Cases, DTOs, Mappers  
    ├── 📂 infrastructure/     # APIs, Repositorios, Servicios
    ├── 📂 presentation/       # Componentes Vue, Stores, Rutas
    └── 📂 shared/            # Utilidades, Tipos, Constantes
```

---

## 🔧 Cómo Crear Tu Spec JSON

### Ejemplo Básico:
```json
{
  "moduleName": "InventoryManager",
  "description": "Sistema de gestión de inventario",
  "entities": {
    "Product": {
      "table": "products",
      "properties": {
        "id": { "type": "uuid", "primary": true, "generated": true },
        "name": { "type": "string", "required": true },
        "price": { "type": "number", "required": true },
        "category": { "type": "string", "required": true },
        "stock": { "type": "integer", "default": 0 },
        "status": { 
          "type": "enum", 
          "values": ["active", "discontinued"],
          "default": "active" 
        },
        "created_at": { "type": "datetime", "generated": true }
      }
    },
    "Category": {
      "table": "categories", 
      "properties": {
        "id": { "type": "uuid", "primary": true, "generated": true },
        "name": { "type": "string", "required": true },
        "description": { "type": "string", "required": false }
      }
    }
  }
}
```

### Tipos de Datos Soportados:
- `uuid` → `string`
- `string` → `string` 
- `integer` / `number` → `number`
- `boolean` → `boolean`
- `datetime` → `Date`
- `json` → `Record<string, any>`
- `enum` → `'value1' | 'value2' | 'value3'`

---

## 🎯 Ejemplos de Uso

### E-commerce:
```bash
npm run create:module EcommerceSystem
```
**Entidades:** Product, Category, Order, Customer, Payment

### Blog:
```bash
npm run create:module BlogManager
```
**Entidades:** Post, Comment, Tag, Author, Category

### CRM:
```bash
npm run create:module CRMSystem  
```
**Entidades:** Lead, Contact, Deal, Activity, Company

### Inventario:
```bash
npm run create:module InventoryTracker
```
**Entidades:** Item, Location, Movement, Supplier, Warehouse

---

## ✅ ¿Qué Se Genera Automáticamente?

### 🏗️ **Arquitectura DDD Completa:**
```bash
📁 tu-modulo/
├── 📂 domain/
│   ├── 📂 entities/           # Product.ts, Category.ts
│   ├── 📂 valueObjects/       # Money.ts, Status.ts  
│   └── 📂 events/            # ProductCreated.ts
├── 📂 application/
│   ├── 📂 dtos/              # CreateProductDTO.ts, UpdateProductDTO.ts
│   ├── 📂 mappers/           # ProductMapper.ts  
│   ├── 📂 repositories/      # ProductRepository.ts (interface)
│   └── 📂 useCases/          # CreateProductUseCase.ts
├── 📂 infrastructure/
│   ├── 📂 api/services/      # ProductApiService.ts, ProductEndpoints.ts
│   └── 📂 persistence/repos/ # ProductRepositoryImpl.ts
└── 📂 presentation/
    ├── 📂 views/            # ProductList.vue, ProductForm.vue
    ├── 📂 components/       # ProductTable.vue, ProductCard.vue  
    ├── 📂 stores/          # productStore.ts
    └── 📂 router/          # productRoutes.ts
```

### 🔧 **Cada Archivo con Responsabilidad Específica:**
- **Entities**: Lógica de negocio pura
- **DTOs**: Transferencia de datos tipada
- **Repositories**: Abstracción de persistencia
- **API Services**: Comunicación HTTP
- **Mappers**: Transformación de datos
- **Components**: UI reutilizable
- **Stores**: Estado global con Pinia

---

## 🚨 Diferencias vs Generador Anterior

| **Antes** | **Ahora** |
|-----------|-----------|
| ❌ Script hardcodeado para 1 módulo | ✅ Generador genérico para cualquier módulo |
| ❌ Variables sin reemplazar `{{moduleName}}` | ✅ Código completamente funcional |
| ❌ Misma clase repetida en todos lados | ✅ Cada archivo con su responsabilidad |
| ❌ Propiedades genéricas (id, name) | ✅ Propiedades específicas del dominio |
| ❌ Sobreescribir script para nuevo módulo | ✅ Reutilizable con cualquier spec |

---

## 💡 Tips y Mejores Prácticas

### 1. **Naming Conventions:**
- **Módulos**: PascalCase (`InventoryManager`)
- **Entidades**: PascalCase (`Product`, `OrderItem`)
- **Propiedades**: snake_case (`created_at`, `user_id`)
- **Archivos spec**: kebab-case (`inventory-manager.json`)

### 2. **Estructura de Entidades:**
```json
{
  "Product": {
    "properties": {
      "id": { "type": "uuid", "primary": true, "generated": true },
      "name": { "type": "string", "required": true },
      "price": { "type": "number", "required": true },
      "status": { 
        "type": "enum",
        "values": ["active", "inactive", "draft"],
        "default": "draft"
      },
      "created_at": { "type": "datetime", "generated": true },
      "updated_at": { "type": "datetime", "generated": true }
    }
  }
}
```

### 3. **Relaciones entre Entidades:**
```json
{
  "Order": {
    "properties": {
      "customer_id": { "type": "uuid", "required": true },
      "product_ids": { "type": "json", "required": true }
    }
  }
}
```

---

## 🔄 Flujo de Trabajo Recomendado

1. **Crear módulo**: `npm run create:module MiModulo`
2. **Editar spec**: Personalizar entidades y propiedades  
3. **Generar**: Presionar ENTER para generar
4. **Revisar**: Verificar estructura generada
5. **Personalizar**: Ajustar componentes Vue si necesario
6. **Integrar**: Añadir al router principal de la app

---

## 🆘 Solución de Problemas

### ❓ **El módulo no se genera**
- Verificar que el spec JSON sea válido
- Verificar que `moduleName` esté definido
- Verificar permisos de escritura

### ❓ **Faltan propiedades en las entidades**
- Verificar la estructura del spec JSON
- Verificar que `properties` esté bien definido
- Revisar tipos de datos soportados

### ❓ **Variables sin reemplazar**
- Usar `generateModuleFromSpec.mjs` (generador nuevo)
- No usar `generateModuleFromSpec.mjs` (generador antiguo)

---

## 🎉 ¡Listo para Usar!

```bash
# Crear tu primer módulo
npm run create:module MiPrimerModulo

# Editar el spec generado
# Presionar ENTER  

# ¡Tu módulo DDD está listo! 🚀
``` 
