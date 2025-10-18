# Drilling Reports Module

Módulo completo de gestión de reportes de perforación siguiendo arquitectura DDD (Domain-Driven Design) y Clean Architecture.

## 📋 Características

### Funcionalidades Principales
- ✅ **CRUD Completo** de reportes de perforación (Crear, Leer, Actualizar, Eliminar)
- ✅ **Gestión de Estados** (Borrador, Completado, Aprobado, Rechazado)
- ✅ **Gestión de Actividades** múltiples por reporte
- ✅ **Registro de Consumos** (bentonita, cemento, agua, etc.)
- ✅ **Asignación de Herramientas** con verificación de capacidad
- ✅ **Firmas Digitales** para operadores y supervisores
- ✅ **Flujo de Trabajo** completo (Crear → Completar → Aprobar/Rechazar)
- ✅ **Exportación de Datos** (PDF, Excel, CSV)
- ✅ **Estadísticas** y reportes de perforación
- ✅ **Búsqueda y Filtrado** avanzado
- ✅ **Sistema de Permisos** con CASL
- ✅ **Validaciones** exhaustivas en tiempo real

### Tipos de Reporte
- **Reporte Diario**: Registro diario de actividades de perforación
- **Reporte de Turno**: Registro por turno (día/noche/mixto)

## 🏗️ Arquitectura

### Estructura DDD

```
DrillingReportsModule/
├── domain/                          # Capa de Dominio (Business Logic)
│   ├── entities/
│   │   └── DrillingReportEntity.ts  # Entidades de negocio
│   ├── repositories/
│   │   └── DrillingReportRepository.ts # Interfaz del repositorio
│   └── value-objects/
│       └── ReportStatus.ts         # Value Objects
│
├── application/                     # Capa de Aplicación (Use Cases)
│   ├── dtos/
│   │   └── DrillingReportDtos.ts   # Data Transfer Objects
│   ├── mappers/
│   │   └── DrillingReportMapper.ts # Mapeo entre DTOs y Entidades
│   └── services/
│       └── DrillingReportApplicationService.ts # Servicios de aplicación
│
├── infrastructure/                  # Capa de Infraestructura (External)
│   ├── api/
│   │   └── services/
│   │       └── DrillingReportApiService.ts # Servicio HTTP API
│   └── persistence/
│       └── repositories/
│           └── DrillingReportRepositoryImpl.ts # Implementación del repositorio
│
├── presentation/                    # Capa de Presentación (UI)
│   ├── views/
│   │   ├── DrillingReportList.vue  # Vista de lista
│   │   ├── DrillingReportCreate.vue # Vista de creación
│   │   ├── DrillingReportEdit.vue   # Vista de edición
│   │   └── DrillingReportDetail.vue # Vista de detalle
│   ├── components/
│   │   └── organisms/
│   │       └── DrillingReportCard.vue # Tarjeta de reporte
│   ├── stores/
│   │   └── drillingReportStore.ts   # Pinia Store
│   ├── composables/
│   │   └── useDrillingReport.ts     # Composable reutilizable
│   └── locales/
│       ├── es.json                 # Traducciones español
│       └── en.json                 # Traducciones inglés
│
├── config/                          # Configuración del módulo
│   ├── routes.ts                   # Definición de rutas
│   ├── menu.ts                     # Configuración del menú
│   ├── permissions.ts              # Permisos CASL
│   ├── container.ts                # Dependency Injection
│   └── config.ts                   # Configuración general
│
├── shared/                          # Código compartido
│   ├── types/                      # Tipos TypeScript
│   └── contracts/                  # Interfaces de contratos
│
├── installer.ts                     # Instalador del módulo
├── index.ts                         # Punto de entrada
└── README.md                        # Esta documentación
```

## 🚀 Instalación

El módulo se instala automáticamente a través del sistema de plugins:

```typescript
// src/plugins/drilling-reports/index.ts
import { installDrillingReportsModule } from '@/modules/DrillingReportsModule/installer'

export default function (app: App) {
  const router = app.config.globalProperties.$router
  const i18n = app.config.globalProperties.$i18n

  installDrillingReportsModule(router, i18n)
}
```

## 💻 Uso

### En Componentes

```typescript
<script setup lang="ts">
import { useDrillingReport } from '@/modules/DrillingReportsModule'

const {
  // State
  reports,
  currentReport,
  loading,
  error,
  pagination,

  // Actions
  fetchReports,
  fetchReportById,
  createReport,
  updateReport,
  deleteReport,

  // Workflow Actions
  addActivity,
  recordConsumption,
  assignTool,
  completeReport,
  approveReport,
  rejectReport,
  signReport,

  // Helper functions
  getStatusColor,
  getStatusLabel,
  canEditReport,
  canCompleteReport,
  canApproveReport,
} = useDrillingReport()

// Cargar reportes
await fetchReports({ status: 'draft', page: 1 })

// Crear reporte
await createReport({
  project_id: 'proj-123',
  well_id: 'well-456',
  report_date: '2025-10-15',
  shift: 'day',
  operator_day_id: 'emp-789'
})

// Completar reporte
await completeReport(reportId, {
  horometer_end_day: 1259.0
})

// Aprobar reporte
await approveReport(reportId, userId)
</script>
```

### Directamente con el Store

```typescript
import { useDrillingReportStore } from '@/modules/DrillingReportsModule'

const drillingReportStore = useDrillingReportStore()

// Lista de reportes
const reports = computed(() => drillingReportStore.items)
const loading = computed(() => drillingReportStore.loading)

// Acciones
await drillingReportStore.fetchList({ search: 'REP-2025', status: 'draft' })
await drillingReportStore.updateItem(id, { observations: 'Nueva observación' })
```

## 📊 Endpoints Backend

### Reportes

```
GET    /api/drilling/reports                    # Lista paginada
GET    /api/drilling/reports/{id}               # Detalle de reporte
POST   /api/drilling/reports                    # Crear reporte
PUT    /api/drilling/reports/{id}               # Actualizar reporte
DELETE /api/drilling/reports/{id}               # Eliminar reporte
GET    /api/drilling/reports/statistics         # Estadísticas
GET    /api/drilling/reports/export             # Exportar datos
```

### Gestión de Flujo de Trabajo

```
POST   /api/drilling/reports/{id}/add-activity     # Agregar actividad
POST   /api/drilling/reports/{id}/record-consumption # Registrar consumo
POST   /api/drilling/reports/{id}/assign-tool      # Asignar herramienta
POST   /api/drilling/reports/{id}/complete         # Completar reporte
POST   /api/drilling/reports/{id}/approve          # Aprobar reporte
POST   /api/drilling/reports/{id}/reject           # Rechazar reporte
POST   /api/drilling/reports/{id}/sign              # Firmar reporte
```

## 🔒 Permisos

### Permisos Disponibles

```typescript
// Visualización
'drilling.reports.view'              // Ver reportes
'drilling.reports.view.own'          // Ver reportes propios
'drilling.reports.view.all'          // Ver todos los reportes

// CRUD
'drilling.reports.create'            // Crear reportes
'drilling.reports.update'            // Actualizar reportes
'drilling.reports.delete'            // Eliminar reportes

// Flujo de trabajo
'drilling.reports.complete'          // Completar reportes
'drilling.reports.approve'           // Aprobar reportes
'drilling.reports.reject'            // Rechazar reportes
'drilling.reports.sign'              // Firmar reportes

// Actividades
'drilling.reports.activities.add'    // Agregar actividades
'drilling.reports.activities.update' // Actualizar actividades
'drilling.reports.activities.delete' // Eliminar actividades

// Consumos
'drilling.reports.consumptions.add'  // Registrar consumos
'drilling.reports.consumptions.update' // Actualizar consumos
'drilling.reports.consumptions.delete' // Eliminar consumos

// Herramientas
'drilling.reports.tools.assign'      // Asignar herramientas
'drilling.reports.tools.update'      // Actualizar asignaciones
'drilling.reports.tools.delete'      // Eliminar asignaciones

// Exportación
'drilling.reports.export'            // Exportar reportes
'drilling.reports.statistics'       // Ver estadísticas
```

### Grupos de Permisos por Rol

```typescript
// Administrador
DRILLING_REPORTS_PERMISSION_GROUPS.admin  // Todos los permisos

// Gerente
DRILLING_REPORTS_PERMISSION_GROUPS.manager  // CRUD completo + aprobación

// Supervisor
DRILLING_REPORTS_PERMISSION_GROUPS.supervisor  // Ver, crear, aprobar/rechazar

// Operador
DRILLING_REPORTS_PERMISSION_GROUPS.operator  // Crear, completar, firmar

// Solo Lectura
DRILLING_REPORTS_PERMISSION_GROUPS.viewer  // Solo visualización
```

### Uso en Templates

```vue
<template>
  <VBtn
    v-can="'drilling.reports.create'"
    @click="createReport"
  >
    Nuevo Reporte
  </VBtn>

  <VBtn
    v-can="'drilling.reports.approve'"
    @click="approveReport"
  >
    Aprobar Reporte
  </VBtn>
</template>
```

### Uso en Código

```typescript
import { useDrillingReportPermissions } from '@/modules/DrillingReportsModule'

const { can, canAny, canAll } = useDrillingReportPermissions()

if (can('drilling.reports.create')) {
  // Mostrar botón de crear
}

if (canAny(['drilling.reports.approve', 'drilling.reports.reject'])) {
  // Mostrar acciones de aprobación
}
```

## 🌍 Internacionalización

El módulo incluye traducciones completas en:
- ✅ Español (es)
- ✅ Inglés (en)

### Estructura de Traducciones

```json
{
  "DrillingReportsModule": {
    "common": { /* botones, acciones, mensajes */ },
    "fields": { /* campos del formulario */ },
    "status": { /* estados */ },
    "shift": { /* turnos */ },
    "activityType": { /* tipos de actividad */ },
    "consumableType": { /* tipos de consumibles */ },
    "toolCategory": { /* categorías de herramientas */ },
    "filters": { /* filtros */ },
    "actions": { /* acciones */ },
    "messages": { /* mensajes del sistema */ },
    "errors": { /* mensajes de error */ },
    "validation": { /* mensajes de validación */ }
  }
}
```

## 🎨 Componentes

### Atomic Design

El módulo sigue el patrón Atomic Design:

- **Organisms**: Componentes complejos reutilizables
  - `DrillingReportCard`: Tarjeta de reporte con acciones

### Vistas Principales

1. **DrillingReportList**: Lista con filtros, búsqueda y acciones en lote
2. **DrillingReportCreate**: Formulario multi-sección para crear reportes
3. **DrillingReportEdit**: Edición de reporte existente
4. **DrillingReportDetail**: Vista detallada con tabs (Info, Actividades, Consumos, Herramientas, Firmas)
5. **DrillingReportComplete**: Wizard para completar reporte
6. **DrillingReportApprove**: Vista para aprobar reporte
7. **DrillingReportReject**: Vista para rechazar reporte

## 🧪 Validaciones

### Reglas de Negocio

```typescript
import { DrillingReportDomain } from '@/modules/DrillingReportsModule'

// Verificar si se puede completar
const { canComplete, reason } = DrillingReportDomain.canComplete(report)

// Verificar si se puede aprobar
const { canApprove, reason } = DrillingReportDomain.canApprove(report)

// Verificar si se puede editar
const { canEdit, reason } = DrillingReportDomain.canEdit(report, userId)

// Validar horas por turno
const validation = DrillingReportDomain.validateShiftHours(activities, newActivity)

// Validar capacidad de herramienta
const capacityValidation = DrillingReportDomain.validateToolCapacity(tool, metersToDrill)
```

## 📝 Tipos de Datos

### Drilling Report Entity

```typescript
interface DrillingReportEntity {
  id: string
  report_number: string
  report_date: string
  shift: 'day' | 'night' | 'mixed'
  status: 'draft' | 'completed' | 'approved' | 'rejected'
  
  // Información del proyecto
  project_id: string
  well_id: string
  equipment_id?: string
  
  // Personal
  operator_day_id?: string
  helper1_day_id?: string
  helper2_day_id?: string
  operator_night_id?: string
  helper1_night_id?: string
  helper2_night_id?: string
  
  // Horómetro
  horometer_start_day?: number
  horometer_start_night?: number
  horometer_end_day?: number
  horometer_end_night?: number
  
  // RPM
  rpm_pull_down?: number
  rpm_rotation?: number
  
  // Observaciones
  observations?: string
  
  // Metadatos
  created_at: string
  updated_at: string
  created_by_id?: string
  
  // Relaciones
  project?: ProjectEntity
  well?: WellEntity
  equipment?: EquipmentEntity
  personnel?: PersonnelEntity
  activities?: ActivityEntity[]
  consumptions?: ConsumptionEntity[]
  tool_assignments?: ToolAssignmentEntity[]
  signatures?: SignatureEntity[]
  totals?: ReportTotalsEntity
}
```

## 🔄 Flujo de Datos

```
┌─────────────────┐
│   Vue Component │
└────────┬────────┘
         │ uses
         ▼
┌─────────────────┐
│  Pinia Store    │ ◄── State Management
└────────┬────────┘
         │ calls
         ▼
┌─────────────────┐
│ Application     │ ◄── Business Logic
│ Service         │
└────────┬────────┘
         │ uses
         ▼
┌─────────────────┐
│ Repository      │ ◄── Data Access
│ Implementation  │
└────────┬────────┘
         │ calls
         ▼
┌─────────────────┐
│ API Service     │ ◄── HTTP Calls
└────────┬────────┘
         │
         ▼
    Backend API
```

## 🚨 Manejo de Errores

Todos los servicios incluyen manejo robusto de errores:

```typescript
try {
  await drillingReportStore.createItem(data)
  // Notificación de éxito automática
} catch (error) {
  // Error capturado y mostrado al usuario
  // Logging automático
  console.error('Error creating drilling report:', error)
}
```

## 📦 Dependencias

- Vue 3
- Pinia (State Management)
- Vue Router
- Vuetify 3 (UI Components)
- Vue I18n (Internationalization)
- TypeScript
- CASL (Permissions)

## 🎯 Próximas Mejoras

- [ ] Integración con módulo de proyectos
- [ ] Dashboard de análisis de perforación
- [ ] Gestión de documentos por reporte
- [ ] Historial de cambios de estado
- [ ] Sistema de notificaciones push
- [ ] Importación masiva desde Excel/CSV
- [ ] API de sincronización con sistemas externos
- [ ] Reportes automáticos por email
- [ ] Integración con sistemas de GPS
- [ ] Análisis predictivo de rendimiento

## 📄 Licencia

Parte del proyecto Skeleton - Todos los derechos reservados

---

**Desarrollado siguiendo principios de DDD y Clean Architecture**
