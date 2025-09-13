# Sistema de Gestión de Documentos - TransportModule

## Descripción
Sistema reutilizable para la gestión de documentos siguiendo los principios de DDD (Domain Driven Design) y Clean Architecture. Puede ser utilizado por cualquier entidad del módulo de transporte (holders, concessions, drivers, vehicles, fines, payments, insurance).

## Arquitectura

```
shared/
├── domain/
│   ├── entities/DocumentEntity.ts          # Entidad de dominio + reglas de negocio
│   ├── repositories/DocumentRepository.ts  # Contrato del repositorio
│   └── types/index.ts                      # Tipos compartidos
├── infrastructure/
│   └── repositories/HttpDocumentRepository.ts  # Implementación HTTP
└── presentation/
    ├── composables/useDocumentManager.ts   # Lógica de negocio UI
    └── components/
        ├── molecules/DocumentUploadDialog.vue    # Diálogo de subida
        └── organisms/DocumentManagerTab.vue      # Tab completo de gestión
```

## Uso Básico

### 1. En cualquier Tab de Entidad

```vue
<script setup lang="ts">
import DocumentManagerTab from '../../../../shared/presentation/components/organisms/DocumentManagerTab.vue'

interface Props {
  entity: YourEntity // Cualquier entidad (holder, driver, vehicle, etc.)
}

const props = defineProps<Props>()
</script>

<template>
  <DocumentManagerTab
    :entity-id="entity.id"
    entity-type="holder"  // holder|concession|driver|vehicle|fine|payment|insurance
    title="Documentos de la Entidad"
  />
</template>
```

### 2. Usando el Composable Directamente

```vue
<script setup lang="ts">
import { useDocumentManager } from '../composables/useDocumentManager'

const documentManager = useDocumentManager({
  entityId: 'your-entity-id',
  entityType: 'holder', // Tipo de entidad
  autoLoad: true
})

// Inicializar
await documentManager.initialize()

// Subir documento
const result = await documentManager.uploadDocument({
  documentable_id: 'entity-id',
  entity_type: 'holder',
  document_type: 'LICENCIA',
  title: 'Mi Documento',
  file: fileObject
})

// Descargar documento
await documentManager.downloadDocument('document-id', 'filename.pdf')
</script>
```

## Tipos de Entidad Soportados

| Entity Type | Descripción | Tipos de Documento |
|-------------|-------------|-------------------|
| `holder` | Concession Holder | LICENCIA, IDENTIFICACION, CERTIFICADO, CONTRATO |
| `concession` | Concession | PERMISO, CERTIFICADO, CONTRATO, REGISTRO |
| `driver` | Driver | IDENTIFICACION, LICENCIA, CERTIFICADO, VERIFICACION |
| `vehicle` | Vehicle | POLIZA, CERTIFICADO, REGISTRO, FACTURA |
| `fine` | Fine | REGISTRO, CERTIFICADO, OTROS |
| `payment` | Payment | FACTURA, COMPROBANTE, REGISTRO |
| `insurance` | Insurance | POLIZA, CERTIFICADO, REGISTRO |

## Funcionalidades Incluidas

### ✅ Gestión Completa
- Subir documentos (drag & drop, selección)
- Vista en grid y lista
- Previsualización de documentos
- Descarga individual y masiva
- Eliminación con confirmación
- Selección múltiple para acciones masivas

### ✅ Validaciones de Negocio
- Validación de tipos de archivo (PDF, imágenes, Office)
- Límite de tamaño (10MB)
- Validación de fechas de emisión/vencimiento
- Verificación de permisos para eliminar

### ✅ Estados y Alertas
- Documentos expirados (automático)
- Documentos por vencer (30 días)
- Estados: PENDING, APPROVED, REJECTED, EXPIRED, ACTIVE
- Estadísticas visuales por estado

### ✅ UX/UI Avanzada
- Indicadores de progreso de subida
- Iconos por tipo de archivo
- Colores por estado de documento
- Responsive design
- Mensajes de error contextual

## Reglas de Negocio Implementadas

### Validaciones
- Título mínimo 3 caracteres, máximo 255
- Archivo requerido en creación
- Fecha de vencimiento debe ser posterior a emisión
- Tipos de documento válidos según entidad

### Restricciones
- No eliminar documentos APROBADOS de tipo LICENCIA
- Archivos máximo 10MB
- Solo tipos de entidad válidos

### Auto-cálculo
- Detección automática de documentos expirados
- Alertas de vencimiento próximo (30 días)
- Estadísticas en tiempo real

## API Endpoints Utilizados

```
GET /api/transport/documents/entity-types     # Tipos disponibles
GET /api/transport/documents                  # Listar documentos
POST /api/transport/documents                 # Subir documento
PUT /api/transport/documents/{id}             # Actualizar documento  
DELETE /api/transport/documents/{id}          # Eliminar documento
GET /api/transport/documents/{id}/download    # Descargar archivo
GET /api/transport/documents/{id}/preview     # Preview del archivo
POST /api/transport/documents/bulk-delete     # Eliminación masiva
```

## Ejemplo Completo de Integración

```vue
<!-- En cualquier Tab de entidad -->
<template>
  <DocumentManagerTab
    :entity-id="holder.id"
    entity-type="holder"
    title="Documentos del Concesionario"
  />
</template>
```

¡Solo una línea de código para tener gestión completa de documentos! 🚀

## Características Técnicas

- **Framework**: Vue 3 + Composition API + TypeScript
- **UI**: Vuetify 3.x
- **Arquitectura**: DDD + Clean Architecture
- **Reutilizable**: 100% agnóstico a la entidad
- **Testeable**: Separación clara de responsabilidades
- **Mantenible**: Código limpio y bien documentado