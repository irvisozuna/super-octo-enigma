# 📋 ESPECIFICACIÓN TÉCNICA COMPLETA - DRILLING REPORTS FRONTEND

**Documento para**: Equipo de Desarrollo Frontend  
**Módulo**: Reportes de Perforación (Drilling Reports)  
**Versión API**: v1  
**Fecha**: 2025-10-15  
**Prioridad**: Alta

---

## 📑 TABLA DE CONTENIDOS

1. [Contexto de Negocio](#1-contexto-de-negocio)
2. [Arquitectura y Endpoints](#2-arquitectura-y-endpoints)
3. [Flujo de Trabajo Completo](#3-flujo-de-trabajo-completo)
4. [Pantallas y Componentes](#4-pantallas-y-componentes)
5. [Modelos de Datos](#5-modelos-de-datos)
6. [Validaciones Frontend](#6-validaciones-frontend)
7. [Estados y Transiciones](#7-estados-y-transiciones)
8. [Casos de Uso Detallados](#8-casos-de-uso-detallados)
9. [UI/UX Especificaciones](#9-uiux-especificaciones)
10. [Mensajes y Notificaciones](#10-mensajes-y-notificaciones)
11. [Permisos y Roles](#11-permisos-y-roles)
12. [Criterios de Aceptación](#12-criterios-de-aceptación)

---

## 1. CONTEXTO DE NEGOCIO

### 1.1 ¿Qué son los Reportes de Perforación?

Los **Reportes de Perforación** son documentos diarios que registran TODAS las actividades, recursos utilizados y progreso durante operaciones de perforación de pozos de agua. 

**Piensa en esto como**: Un "diario de obra" digital donde cada día se registra:
- ✅ Qué se hizo (actividades)
- ✅ Quién lo hizo (operadores y ayudantes)
- ✅ Con qué se hizo (herramientas, equipos)
- ✅ Qué se consumió (materiales, aditivos)
- ✅ Cuánto se avanzó (metros perforados)
- ✅ Cuántas horas trabajó el equipo

### 1.2 Actores del Sistema

| Actor | Rol | Permisos |
|-------|-----|----------|
| **Operador de Campo** | Persona que crea el reporte diario | Crear, Editar (draft), Ver |
| **Supervisor** | Revisa y aprueba reportes | Ver, Aprobar, Rechazar, Firmar |
| **Gerente de Proyecto** | Monitorea progreso | Ver todos los reportes, Exportar |
| **Cliente** | Dueño del pozo | Ver reportes aprobados, Firmar |
| **Administrador** | Control total | Todos los permisos |

### 1.3 Ciclo de Vida de un Reporte

```
┌─────────┐     ┌───────────┐     ┌──────────┐     ┌──────────┐
│  DRAFT  │ --> │ COMPLETED │ --> │ APPROVED │ --> │  FINAL   │
└─────────┘     └───────────┘     └──────────┘     └──────────┘
    ↑                 │                  │
    │                 │                  ↓
    │                 │            ┌──────────┐
    │                 └----------> │ REJECTED │
    │                              └──────────┘
    │                                    │
    └────────────────────────────────────┘
```

**Estados**:
1. **DRAFT** (Borrador): Reporte en construcción, editable
2. **COMPLETED** (Completado): Reporte finalizado por operador, esperando aprobación
3. **APPROVED** (Aprobado): Reporte aprobado por supervisor
4. **REJECTED** (Rechazado): Reporte rechazado, vuelve a DRAFT para corrección

---

## 2. ARQUITECTURA Y ENDPOINTS

### 2.1 Base URL
```
https://api.tudominio.com/api/drilling/reports
```

### 2.2 Autenticación
Todas las peticiones requieren:
```http
Authorization: Bearer {token}
X-Company-Id: {uuid-de-la-empresa}
Content-Type: application/json
Accept: application/json
```

### 2.3 Endpoints Completos

#### 📋 **ENDPOINT 1: Listar Reportes**
```http
GET /api/drilling/reports
```

**Query Parameters**:
```javascript
{
  page: 1,                    // Página actual (requerido)
  per_page: 20,              // Items por página (default: 15, max: 100)
  sort_by: 'report_date',    // Campo para ordenar
  sort_order: 'desc',        // asc | desc
  
  // Filtros opcionales:
  project_id: 'uuid',        // Filtrar por proyecto
  well_id: 'uuid',           // Filtrar por pozo
  status: 'draft',           // draft | completed | approved | rejected
  date_from: '2025-01-01',   // Fecha desde (YYYY-MM-DD)
  date_to: '2025-12-31',     // Fecha hasta (YYYY-MM-DD)
  shift: 'day',              // day | night | mixed
  search: 'REP-2025-0001'    // Buscar por número de reporte
}
```

**Response 200 OK**:
```json
{
  "data": [
    {
      "id": "9d4f8c2a-...",
      "report_number": "REP-2025-0001",
      "report_date": "2025-10-15",
      "shift": "day",
      "status": "draft",
      "project": {
        "id": "uuid",
        "name": "Pozo Comunidad San Juan",
        "code": "PROJ-2025-001"
      },
      "well": {
        "id": "uuid",
        "name": "Pozo #1",
        "well_number": "WELL-001"
      },
      "equipment": {
        "id": "uuid",
        "name": "Perforadora Caterpillar MD6250",
        "serial_number": "CAT-12345"
      },
      "personnel": {
        "operator_day": {
          "id": "uuid",
          "name": "Juan Pérez"
        },
        "helper1_day": {
          "id": "uuid",
          "name": "Pedro López"
        },
        "helper2_day": null
      },
      "totals": {
        "hours_worked": 8.5,
        "meters_drilled": 45.3
      },
      "created_at": "2025-10-15T08:00:00Z",
      "updated_at": "2025-10-15T16:30:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 20,
    "total": 95
  },
  "links": {
    "first": "/api/drilling/reports?page=1",
    "last": "/api/drilling/reports?page=5",
    "prev": null,
    "next": "/api/drilling/reports?page=2"
  }
}
```

---

#### 📝 **ENDPOINT 2: Crear Reporte**
```http
POST /api/drilling/reports
```

**Request Body**:
```json
{
  "project_id": "uuid-proyecto",           // REQUERIDO
  "well_id": "uuid-pozo",                 // REQUERIDO
  "report_date": "2025-10-15",            // REQUERIDO (YYYY-MM-DD)
  "shift": "day",                         // REQUERIDO (day | night | mixed)
  "equipment_id": "uuid-equipo",          // OPCIONAL
  
  // Personal turno día (OPCIONAL pero recomendado)
  "operator_day_id": "uuid-operador",
  "helper1_day_id": "uuid-ayudante1",
  "helper2_day_id": "uuid-ayudante2",
  
  // Personal turno noche (OPCIONAL, solo si shift = night o mixed)
  "operator_night_id": "uuid-operador-noche",
  "helper1_night_id": "uuid-ayudante1-noche",
  "helper2_night_id": "uuid-ayudante2-noche",
  
  // Horómetro (OPCIONAL)
  "horometer_start_day": 1250.5,          // Lectura inicial turno día
  "horometer_start_night": 1259.0,        // Lectura inicial turno noche
  
  // RPM (OPCIONAL)
  "rpm_pull_down": 45.0,
  "rpm_rotation": 120.0,
  
  // Observaciones (OPCIONAL)
  "observations": "Condiciones climáticas favorables"
}
```

**Validaciones Frontend**:
```javascript
{
  project_id: {
    required: true,
    type: 'uuid',
    message: 'Debe seleccionar un proyecto'
  },
  well_id: {
    required: true,
    type: 'uuid',
    message: 'Debe seleccionar un pozo',
    custom: async (wellId, projectId) => {
      // Validar que el pozo pertenezca al proyecto
      const well = await fetchWell(wellId);
      if (well.project_id !== projectId) {
        return 'El pozo no pertenece al proyecto seleccionado';
      }
    }
  },
  report_date: {
    required: true,
    type: 'date',
    format: 'YYYY-MM-DD',
    max: 'today',  // No puede ser fecha futura
    message: 'Fecha de reporte inválida'
  },
  shift: {
    required: true,
    options: ['day', 'night', 'mixed'],
    message: 'Debe seleccionar un turno'
  },
  horometer_start_day: {
    type: 'number',
    min: 0,
    max: 999999.9,
    decimals: 1,
    message: 'Horómetro inicial debe ser positivo'
  },
  observations: {
    type: 'string',
    maxLength: 1000,
    message: 'Observaciones no puede exceder 1000 caracteres'
  }
}
```

**Response 201 Created**:
```json
{
  "data": {
    "id": "9d4f8c2a-...",
    "report_number": "REP-2025-0042",
    "report_date": "2025-10-15",
    "shift": "day",
    "status": "draft",
    // ... todos los demás campos
  },
  "message": "Reporte creado exitosamente"
}
```

**Response 422 Unprocessable Entity**:
```json
{
  "message": "Los datos proporcionados no son válidos",
  "errors": {
    "project_id": ["El proyecto es requerido"],
    "report_date": ["La fecha no puede ser futura"]
  }
}
```

---

#### 👁️ **ENDPOINT 3: Ver Detalle de Reporte**
```http
GET /api/drilling/reports/{id}
```

**Response 200 OK**:
```json
{
  "data": {
    "id": "9d4f8c2a-...",
    "report_number": "REP-2025-0042",
    "report_date": "2025-10-15",
    "shift": "day",
    "status": "completed",
    
    "project": {
      "id": "uuid",
      "name": "Pozo Comunidad San Juan",
      "code": "PROJ-2025-001",
      "client": {
        "id": "uuid",
        "business_name": "Municipio de San Juan"
      }
    },
    
    "well": {
      "id": "uuid",
      "name": "Pozo #1",
      "well_number": "WELL-001",
      "target_depth_meters": 150.0,
      "current_depth_meters": 95.3
    },
    
    "equipment": {
      "id": "uuid",
      "name": "Perforadora Caterpillar MD6250",
      "serial_number": "CAT-12345",
      "brand": "Caterpillar",
      "model": "MD6250"
    },
    
    "personnel": {
      "operator_day": {
        "id": "uuid",
        "name": "Juan Pérez",
        "position": "Operador Senior"
      },
      "helper1_day": {
        "id": "uuid",
        "name": "Pedro López",
        "position": "Ayudante"
      },
      "helper2_day": null,
      "operator_night": null,
      "helper1_night": null,
      "helper2_night": null
    },
    
    "horometer": {
      "day": {
        "start": 1250.5,
        "end": 1259.0,
        "hours_worked": 8.5
      },
      "night": null
    },
    
    "rpm": {
      "pull_down": 45.0,
      "rotation": 120.0
    },
    
    "activities": [
      {
        "id": "uuid",
        "activity_type": "drilling",
        "shift": "day",
        "hours": 6.5,
        "start_time": "08:00:00",
        "end_time": "14:30:00",
        "description": "Perforación continua en formación rocosa"
      },
      {
        "id": "uuid",
        "activity_type": "maintenance",
        "shift": "day",
        "hours": 1.0,
        "start_time": "14:30:00",
        "end_time": "15:30:00",
        "description": "Cambio de broca"
      }
    ],
    
    "consumptions": [
      {
        "id": "uuid",
        "consumable_type": "bentonite",
        "shift": "day",
        "quantity": 25.0,
        "unit": "kg"
      },
      {
        "id": "uuid",
        "consumable_type": "water",
        "shift": "day",
        "quantity": 500.0,
        "unit": "liters"
      }
    ],
    
    "tool_assignments": [
      {
        "id": "uuid",
        "tool_id": "uuid",
        "tool": {
          "id": "uuid",
          "serial_number": "DRILL-BIT-001",
          "name": "Broca Tricónica 12\"",
          "manufacturer": "Hughes",
          "total_usage_meters": 450.5,
          "capacity_meters": 1000.0,
          "remaining_meters": 549.5
        },
        "shift": "day",
        "tool_category": "drill_bit",
        "depth_range": {
          "start_meters": 50.0,
          "end_meters": 95.3,
          "meters_drilled": 45.3
        },
        "wear_pattern": "uniform",
        "matrix": "good_condition",
        "assigned_at": "2025-10-15T08:00:00Z"
      }
    ],
    
    "casings": [
      {
        "id": "uuid",
        "diameter_inches": 10.0,
        "depth_range": {
          "start_meters": 0.0,
          "end_meters": 50.0
        },
        "quantity": 10,
        "description": "Tubería de acero Schedule 40"
      }
    ],
    
    "additives": [
      {
        "id": "uuid",
        "additive_type": "Polímero",
        "quantity": 5.0,
        "unit": "kg",
        "description": "Polímero para control de filtrado"
      }
    ],
    
    "accessories": [
      {
        "id": "uuid",
        "accessory_type": "Estabilizador",
        "quantity": 2.0,
        "unit": "units",
        "supplier": "Baker Hughes",
        "observations": "Estabilizadores de 10 pulgadas"
      }
    ],
    
    "signatures": [
      {
        "id": "uuid",
        "signature_type": "operator",
        "signatory_name": "Juan Pérez",
        "signatory_user_id": "uuid",
        "signature_method": "digital",
        "signature_data": "base64-encoded-signature",
        "signed_at": "2025-10-15T16:30:00Z"
      }
    ],
    
    "totals": {
      "hours_worked": 8.5,
      "meters_drilled": 45.3
    },
    
    "observations": "Jornada exitosa. Formación rocosa según lo esperado.",
    
    "created_at": "2025-10-15T08:00:00Z",
    "updated_at": "2025-10-15T16:30:00Z",
    "created_by": {
      "id": "uuid",
      "name": "Juan Pérez"
    }
  }
}
```

---

#### ✏️ **ENDPOINT 4: Actualizar Reporte**
```http
PUT /api/drilling/reports/{id}
```

**IMPORTANTE**: Solo se puede actualizar si `status === 'draft'`

**Request Body**: (mismo formato que POST, todos los campos opcionales)
```json
{
  "observations": "Actualización de observaciones",
  "rpm_pull_down": 50.0
}
```

---

#### ➕ **ENDPOINT 5: Agregar Actividad**
```http
POST /api/drilling/reports/{id}/add-activity
```

**Request Body**:
```json
{
  "activity_type": "drilling",        // REQUERIDO: drilling, maintenance, installation, testing, waiting, otros
  "shift": "day",                     // REQUERIDO: day, night, mixed
  "hours": 6.5,                       // REQUERIDO: 0.1 a 24.0
  "start_time": "08:00:00",          // OPCIONAL: HH:mm:ss
  "end_time": "14:30:00",            // OPCIONAL: HH:mm:ss
  "description": "Perforación..."     // OPCIONAL: max 500 caracteres
}
```

**Validaciones Frontend**:
```javascript
{
  activity_type: {
    required: true,
    options: ['drilling', 'maintenance', 'installation', 'testing', 'waiting', 'mobilization', 'demobilization', 'otros'],
    labels: {
      drilling: 'Perforación',
      maintenance: 'Mantenimiento',
      installation: 'Instalación',
      testing: 'Pruebas',
      waiting: 'Tiempo de Espera',
      mobilization: 'Movilización',
      demobilization: 'Desmovilización',
      otros: 'Otros'
    }
  },
  shift: {
    required: true,
    custom: (shift, reportShift) => {
      // El shift de la actividad debe coincidir con el shift del reporte
      if (reportShift === 'day' && shift !== 'day') {
        return 'El reporte es de turno día, la actividad debe ser de turno día';
      }
      if (reportShift === 'night' && shift !== 'night') {
        return 'El reporte es de turno noche, la actividad debe ser de turno noche';
      }
      // Si el reporte es 'mixed', la actividad puede ser day o night
    }
  },
  hours: {
    required: true,
    type: 'number',
    min: 0.1,
    max: 24.0,
    decimals: 1,
    custom: async (hours, shift, reportId) => {
      // Validar que el total de horas por turno no exceda 24
      const report = await fetchReport(reportId);
      const currentHours = report.activities
        .filter(a => a.shift === shift)
        .reduce((sum, a) => sum + a.hours, 0);
      
      if (currentHours + hours > 24) {
        return `El turno ${shift} ya tiene ${currentHours} horas. No puedes agregar ${hours} horas más (máximo 24h por turno)`;
      }
    }
  },
  start_time: {
    type: 'time',
    format: 'HH:mm',
    custom: (startTime, endTime) => {
      if (startTime && endTime && startTime >= endTime) {
        return 'La hora de inicio debe ser menor que la hora de fin';
      }
    }
  },
  end_time: {
    type: 'time',
    format: 'HH:mm'
  },
  description: {
    type: 'string',
    maxLength: 500
  }
}
```

**Response 200 OK**:
```json
{
  "message": "Actividad agregada exitosamente",
  "data": {
    "id": "uuid-actividad",
    "activity_type": "drilling",
    "shift": "day",
    "hours": 6.5,
    // ... más campos
  }
}
```

# 📋 ESPECIFICACIÓN TÉCNICA - DRILLING REPORTS FRONTEND (PARTE 2)

## ENDPOINTS CONTINUACIÓN

#### 📦 **ENDPOINT 6: Registrar Consumo**
```http
POST /api/drilling/reports/{id}/record-consumption
```

**Request Body**:
```json
{
  "consumable_type": "bentonite",    // REQUERIDO
  "shift": "day",                    // REQUERIDO
  "quantity": 25.0,                  // REQUERIDO: > 0
  "unit": "kg"                       // REQUERIDO: kg, bags, liters, gallons, units
}
```

**Tipos de Consumibles** (para frontend):
```javascript
const CONSUMABLE_TYPES = [
  { value: 'bentonite', label: 'Bentonita', defaultUnit: 'kg' },
  { value: 'cement', label: 'Cemento', defaultUnit: 'bags' },
  { value: 'water', label: 'Agua', defaultUnit: 'liters' },
  { value: 'diesel', label: 'Diesel', defaultUnit: 'liters' },
  { value: 'lubricant', label: 'Lubricante', defaultUnit: 'liters' },
  { value: 'polymer', label: 'Polímero', defaultUnit: 'kg' },
  { value: 'gravel', label: 'Grava', defaultUnit: 'kg' },
  { value: 'sand', label: 'Arena', defaultUnit: 'kg' }
];

const UNITS = [
  { value: 'kg', label: 'Kilogramos' },
  { value: 'bags', label: 'Sacos' },
  { value: 'liters', label: 'Litros' },
  { value: 'gallons', label: 'Galones' },
  { value: 'units', label: 'Unidades' }
];
```

**Validaciones Frontend**:
```javascript
{
  consumable_type: {
    required: true,
    message: 'Debe seleccionar un tipo de consumible'
  },
  quantity: {
    required: true,
    type: 'number',
    min: 0.01,
    max: 999999,
    decimals: 2,
    message: 'La cantidad debe ser mayor a 0'
  },
  unit: {
    required: true,
    options: ['kg', 'bags', 'liters', 'gallons', 'units']
  }
}
```

---

#### 🔧 **ENDPOINT 7: Asignar Herramienta**
```http
POST /api/drilling/reports/{id}/assign-tool
```

**Request Body**:
```json
{
  "tool_id": "uuid-herramienta",       // REQUERIDO
  "shift": "day",                      // REQUERIDO
  "tool_category": "drill_bit",        // REQUERIDO
  "start_depth_meters": 50.0,          // REQUERIDO: >= 0
  "end_depth_meters": 95.3,            // REQUERIDO: > start_depth_meters
  "wear_pattern": "uniform",           // OPCIONAL: uniform, centered, eccentric
  "matrix": "good_condition"           // OPCIONAL: good_condition, moderate_wear, severe_wear
}
```

**Categorías de Herramientas**:
```javascript
const TOOL_CATEGORIES = [
  { value: 'drill_bit', label: 'Broca de Perforación' },
  { value: 'reamer', label: 'Escariador' },
  { value: 'stabilizer', label: 'Estabilizador' },
  { value: 'drill_pipe', label: 'Tubería de Perforación' },
  { value: 'drill_collar', label: 'Portamecha' },
  { value: 'kelly', label: 'Kelly' },
  { value: 'otros', label: 'Otros' }
];

const WEAR_PATTERNS = [
  { value: 'uniform', label: 'Desgaste Uniforme' },
  { value: 'centered', label: 'Desgaste Centrado' },
  { value: 'eccentric', label: 'Desgaste Excéntrico' },
  { value: 'one_sided', label: 'Desgaste de un Lado' }
];

const MATRIX_CONDITIONS = [
  { value: 'good_condition', label: 'Buen Estado' },
  { value: 'moderate_wear', label: 'Desgaste Moderado' },
  { value: 'severe_wear', label: 'Desgaste Severo' },
  { value: 'needs_replacement', label: 'Requiere Reemplazo' }
];
```

**Validaciones Frontend**:
```javascript
{
  tool_id: {
    required: true,
    type: 'uuid',
    custom: async (toolId) => {
      // Validar que la herramienta esté disponible
      const tool = await fetchTool(toolId);
      if (tool.status !== 'available') {
        return `La herramienta no está disponible (estado: ${tool.status})`;
      }
      
      // Validar capacidad si tiene límite
      if (tool.capacity_meters) {
        const remaining = tool.capacity_meters - tool.total_usage_meters;
        if (remaining <= 0) {
          return 'La herramienta ha excedido su capacidad máxima';
        }
      }
    }
  },
  start_depth_meters: {
    required: true,
    type: 'number',
    min: 0,
    decimals: 2
  },
  end_depth_meters: {
    required: true,
    type: 'number',
    decimals: 2,
    custom: (endDepth, startDepth) => {
      if (endDepth <= startDepth) {
        return 'La profundidad final debe ser mayor que la profundidad inicial';
      }
    }
  }
}
```

**Response 200 OK**:
```json
{
  "message": "Herramienta asignada exitosamente",
  "data": {
    "id": "uuid",
    "tool_id": "uuid",
    "meters_drilled": 45.3,
    "tool": {
      "serial_number": "DRILL-BIT-001",
      "remaining_capacity_meters": 504.2
    }
  },
  "warnings": [
    "⚠️ La herramienta tiene solo 504.2 metros de capacidad restante (50%)"
  ]
}
```

---

#### ✅ **ENDPOINT 8: Completar Reporte**
```http
POST /api/drilling/reports/{id}/complete
```

**Request Body**:
```json
{
  "horometer_end_day": 1259.0,      // OPCIONAL: Lectura final horómetro día
  "horometer_end_night": null       // OPCIONAL: Lectura final horómetro noche
}
```

**Validaciones Automáticas del Backend** (el frontend debe advertir):
- ✅ Debe tener al menos 1 actividad
- ✅ Debe tener al menos 1 operador asignado (día o noche)
- ✅ Si se proporcionan horómetros, el final debe ser >= inicial

**Response 200 OK**:
```json
{
  "message": "Reporte completado exitosamente",
  "data": {
    "id": "uuid",
    "status": "completed",
    "total_hours_worked": 8.5,
    "total_meters_drilled": 45.3
  }
}
```

**Response 422 Unprocessable Entity** (ejemplo):
```json
{
  "message": "No se puede completar el reporte",
  "errors": {
    "activities": ["El reporte debe tener al menos una actividad"],
    "personnel": ["El reporte debe tener al menos un operador asignado"]
  }
}
```

---

#### ✔️ **ENDPOINT 9: Aprobar Reporte**
```http
POST /api/drilling/reports/{id}/approve
```

**Requisitos**:
- El reporte debe estar en estado `completed` o `pending_approval`
- Debe tener firma de operador
- Debe tener firma de supervisor
- El usuario debe tener permiso `drilling.reports.approve`

**Request Body**: (vacío)
```json
{}
```

**Response 200 OK**:
```json
{
  "message": "Reporte aprobado exitosamente",
  "data": {
    "id": "uuid",
    "status": "approved",
    "approved_by": {
      "id": "uuid",
      "name": "Carlos Supervisor"
    },
    "approved_at": "2025-10-15T18:00:00Z"
  }
}
```

---

#### ❌ **ENDPOINT 10: Rechazar Reporte**
```http
POST /api/drilling/reports/{id}/reject
```

**Request Body**:
```json
{
  "reason": "Faltan detalles en las actividades de mantenimiento"  // REQUERIDO
}
```

**Validaciones**:
```javascript
{
  reason: {
    required: true,
    minLength: 10,
    maxLength: 500,
    message: 'Debe explicar el motivo del rechazo (mínimo 10 caracteres)'
  }
}
```

**Response 200 OK**:
```json
{
  "message": "Reporte rechazado",
  "data": {
    "id": "uuid",
    "status": "rejected",
    "rejected_by": {
      "id": "uuid",
      "name": "Carlos Supervisor"
    },
    "rejected_at": "2025-10-15T18:00:00Z",
    "rejection_reason": "Faltan detalles..."
  }
}
```

---

#### ✍️ **ENDPOINT 11: Firmar Reporte**
```http
POST /api/drilling/reports/{id}/sign
```

**Request Body**:
```json
{
  "signature_type": "operator",      // REQUERIDO: operator, supervisor, client
  "signature_method": "digital",     // REQUERIDO: digital, physical, electronic
  "signature_data": "base64..."      // OPCIONAL: firma digitalizada en base64
}
```

**Tipos de Firma**:
```javascript
const SIGNATURE_TYPES = [
  { 
    value: 'operator', 
    label: 'Operador', 
    description: 'Firma del operador que ejecutó el trabajo',
    required: true  // Requerida para aprobar
  },
  { 
    value: 'supervisor', 
    label: 'Supervisor', 
    description: 'Firma del supervisor que revisó el trabajo',
    required: true  // Requerida para aprobar
  },
  { 
    value: 'client', 
    label: 'Cliente', 
    description: 'Firma del representante del cliente',
    required: false
  }
];
```

**Validaciones**:
```javascript
{
  signature_type: {
    required: true,
    options: ['operator', 'supervisor', 'client'],
    custom: async (signatureType, reportId) => {
      // Validar que no haya firma duplicada del mismo tipo
      const report = await fetchReport(reportId);
      if (report.signatures.some(s => s.signature_type === signatureType)) {
        return `Ya existe una firma de tipo ${signatureType}`;
      }
    }
  },
  signature_method: {
    required: true,
    options: ['digital', 'physical', 'electronic']
  }
}
```

---

#### 🗑️ **ENDPOINT 12: Eliminar Reporte**
```http
DELETE /api/drilling/reports/{id}
```

**IMPORTANTE**: Solo se puede eliminar si `status === 'draft'`

**Response 200 OK**:
```json
{
  "message": "Reporte eliminado exitosamente"
}
```

---

## 3. FLUJO DE TRABAJO COMPLETO

### 3.1 Flujo Principal - Crear y Completar Reporte

```
┌─────────────────────────────────────────────────────────┐
│ 1. OPERADOR INICIA JORNADA (08:00 AM)                  │
├─────────────────────────────────────────────────────────┤
│ Acción: Crear Reporte                                  │
│ POST /api/drilling/reports                             │
│                                                         │
│ UI: Formulario de Creación                             │
│  - Seleccionar Proyecto (dropdown)                     │
│  - Seleccionar Pozo (dropdown filtrado por proyecto)   │
│  - Fecha (datepicker, default: hoy)                    │
│  - Turno (radio buttons: Día/Noche/Mixto)             │
│  - Equipo (dropdown, opcional)                         │
│  - Personal (autocomplete con empleados)               │
│  - Horómetro Inicial (número)                          │
│                                                         │
│ Resultado: Reporte en estado DRAFT                     │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ 2. DURANTE LA JORNADA (08:00 - 16:00)                 │
├─────────────────────────────────────────────────────────┤
│ 2.1 Agregar Actividades (múltiples veces)             │
│     POST /api/drilling/reports/{id}/add-activity       │
│                                                         │
│     UI: Modal "Agregar Actividad"                      │
│      - Tipo de Actividad (dropdown)                    │
│      - Horas (número, 0.1 - 24.0)                      │
│      - Hora Inicio/Fin (timepicker)                    │
│      - Descripción (textarea)                          │
│                                                         │
│     Mostrar: Lista de actividades agregadas            │
│      [Perforación - 6.5h] [Mantenimiento - 1.0h]      │
│      Total: 7.5h                                       │
│                                                         │
│ 2.2 Registrar Consumos (múltiples veces)              │
│     POST /api/drilling/reports/{id}/record-consumption │
│                                                         │
│     UI: Modal "Registrar Consumo"                      │
│      - Tipo (dropdown: Bentonita, Cemento, etc.)      │
│      - Cantidad (número)                               │
│      - Unidad (dropdown auto-seleccionado)             │
│                                                         │
│ 2.3 Asignar Herramientas (múltiples veces)            │
│     POST /api/drilling/reports/{id}/assign-tool        │
│                                                         │
│     UI: Modal "Asignar Herramienta"                    │
│      - Buscar Herramienta (autocomplete)               │
│      - Ver capacidad restante (badge de alerta)        │
│      - Profundidad Inicial (número)                    │
│      - Profundidad Final (número)                      │
│      - Metros Perforados (calculado automático)        │
│      - Patrón de Desgaste (dropdown)                   │
│      - Estado de Matriz (dropdown)                     │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ 3. FIN DE JORNADA (16:00)                              │
├─────────────────────────────────────────────────────────┤
│ 3.1 Completar Reporte                                  │
│     POST /api/drilling/reports/{id}/complete           │
│                                                         │
│     UI: Botón "Completar Reporte"                      │
│      - Validación previa:                              │
│        ✓ Tiene actividades                             │
│        ✓ Tiene operador asignado                       │
│      - Input: Horómetro Final                          │
│      - Mostrar resumen:                                │
│        • Total Horas: 8.5h                             │
│        • Total Metros: 45.3m                            │
│        • Consumos: 3 items                             │
│        • Herramientas: 1 item                          │
│                                                         │
│ 3.2 Firmar como Operador                              │
│     POST /api/drilling/reports/{id}/sign               │
│                                                         │
│     UI: Modal "Firmar Reporte"                         │
│      - Canvas para firma digital (touchpad/mouse)      │
│      - Botón "Guardar Firma"                           │
│      - Preview de firma                                 │
│                                                         │
│ Resultado: Reporte pasa a COMPLETED                   │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ 4. SUPERVISOR REVISA (Siguiente día)                   │
├─────────────────────────────────────────────────────────┤
│ 4.1 Ver Detalle Completo                              │
│     GET /api/drilling/reports/{id}                     │
│                                                         │
│     UI: Vista de Solo Lectura                          │
│      - Información general                             │
│      - Personal asignado                               │
│      - Horómetros                                       │
│      - Lista de actividades                            │
│      - Lista de consumos                               │
│      - Herramientas asignadas                          │
│      - Totales calculados                              │
│                                                         │
│ 4.2 Opciones del Supervisor:                          │
│                                                         │
│     A) APROBAR:                                        │
│        - Firmar como Supervisor                        │
│          POST /api/drilling/reports/{id}/sign          │
│        - Aprobar                                       │
│          POST /api/drilling/reports/{id}/approve       │
│                                                         │
│     B) RECHAZAR:                                       │
│        POST /api/drilling/reports/{id}/reject          │
│        - Input: Motivo del rechazo (textarea)          │
│                                                         │
│ Resultado: Reporte pasa a APPROVED o REJECTED         │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ 5. SI FUE RECHAZADO                                    │
├─────────────────────────────────────────────────────────┤
│ Operador ve notificación de rechazo                   │
│ Puede editar el reporte (vuelve a DRAFT)              │
│ Repite el proceso desde paso 2                        │
└─────────────────────────────────────────────────────────┘
```

---

# 📋 ESPECIFICACIÓN TÉCNICA - DRILLING REPORTS FRONTEND (PARTE 3)

## 4. PANTALLAS Y COMPONENTES

### 4.1 PANTALLA 1: Lista de Reportes (Grid View)

**Ruta**: `/drilling/reports`

**Propósito**: Ver todos los reportes creados, filtrar, buscar y acceder a detalles

#### Layout Desktop:
```
┌────────────────────────────────────────────────────────────────┐
│  🏗️ Reportes de Perforación                    [+ Nuevo Reporte]│
├────────────────────────────────────────────────────────────────┤
│  🔍 [Buscar por #...] [Proyecto ▼] [Estado ▼] [Fecha ▼]  🔄   │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ REP-2025-0042          │ 15/10/2025 │ Día  │ 🟡 DRAFT    │ │
│  │ Pozo Comunidad San Juan - Pozo #1                        │ │
│  │ Operador: Juan Pérez  │  8.5h  │  45.3m                  │ │
│  │ [👁️ Ver] [✏️ Editar] [🗑️ Eliminar]                        │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ REP-2025-0041          │ 14/10/2025 │ Día  │ ✅ APPROVED │ │
│  │ Pozo Comunidad San Juan - Pozo #1                        │ │
│  │ Operador: Juan Pérez  │  7.0h  │  38.5m                  │ │
│  │ [👁️ Ver] [📄 Exportar PDF]                               │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ REP-2025-0040          │ 13/10/2025 │ Día  │ 🔵 COMPLETED│ │
│  │ Pozo Comunidad San Juan - Pozo #1                        │ │
│  │ Operador: Juan Pérez  │  8.0h  │  42.0m                  │ │
│  │ [👁️ Ver] [✅ Aprobar] [❌ Rechazar]                       │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Página 1 de 5                              [< Anterior | Siguiente >] │
└────────────────────────────────────────────────────────────────┘
```

#### Componentes React (sugeridos):

```typescript
// DrillingReportsPage.tsx
interface ReportListItem {
  id: string;
  report_number: string;
  report_date: string;
  shift: 'day' | 'night' | 'mixed';
  status: 'draft' | 'completed' | 'approved' | 'rejected';
  project: {
    name: string;
  };
  well: {
    name: string;
  };
  personnel: {
    operator_day?: { name: string };
  };
  totals: {
    hours_worked: number;
    meters_drilled: number;
  };
}

// Estado
const [reports, setReports] = useState<ReportListItem[]>([]);
const [filters, setFilters] = useState({
  search: '',
  project_id: '',
  status: '',
  date_from: '',
  date_to: ''
});
const [pagination, setPagination] = useState({
  currentPage: 1,
  perPage: 20,
  total: 0
});

// Función de carga
const loadReports = async () => {
  const response = await api.get('/drilling/reports', {
    params: {
      page: pagination.currentPage,
      per_page: pagination.perPage,
      ...filters
    }
  });
  setReports(response.data.data);
  setPagination(response.data.meta);
};
```

#### Componentes UI:

1. **ReportCard** - Tarjeta individual de reporte
   - Props: `report`, `onView`, `onEdit`, `onDelete`, `onApprove`, `onReject`
   - Estados visuales por status

2. **ReportFilters** - Barra de filtros
   - Props: `filters`, `onChange`, `onReset`
   - Dropdowns: Proyecto, Estado, Rango de Fechas

3. **StatusBadge** - Badge de estado
   - Props: `status`
   - Colores:
     - DRAFT: Amarillo (#FCD34D)
     - COMPLETED: Azul (#60A5FA)
     - APPROVED: Verde (#34D399)
     - REJECTED: Rojo (#F87171)

---

### 4.2 PANTALLA 2: Crear/Editar Reporte

**Ruta**: `/drilling/reports/create` o `/drilling/reports/{id}/edit`

#### Layout Desktop:
```
┌────────────────────────────────────────────────────────────────┐
│  ← Volver    🏗️ Nuevo Reporte de Perforación                   │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─── PASO 1: Información General ───────────────────────────┐ │
│  │                                                            │ │
│  │  * Proyecto                                               │ │
│  │  [Seleccionar proyecto...                          ▼]     │ │
│  │                                                            │ │
│  │  * Pozo                                                   │ │
│  │  [Seleccionar pozo...                              ▼]     │ │
│  │  ℹ️ Profundidad actual: 50.0m / Meta: 150.0m             │ │
│  │                                                            │ │
│  │  * Fecha de Reporte       * Turno                        │ │
│  │  [15/10/2025     📅]      ⚪ Día  ⚪ Noche  ⚪ Mixto      │ │
│  │                                                            │ │
│  │  Equipo (opcional)                                        │ │
│  │  [Perforadora Caterpillar MD6250             ▼]          │ │
│  │                                                            │ │
│  │  ───── Personal Turno Día ─────                          │ │
│  │                                                            │ │
│  │  * Operador                                               │ │
│  │  [Juan Pérez                                      ▼]      │ │
│  │                                                            │ │
│  │  Ayudante 1                Ayudante 2                     │ │
│  │  [Pedro López        ▼]    [Carlos Ruiz          ▼]      │ │
│  │                                                            │ │
│  │  ───── Horómetro ─────                                   │ │
│  │                                                            │ │
│  │  Lectura Inicial Día       RPM Pull Down                 │ │
│  │  [1250.5            ]      [45.0                 ]       │ │
│  │                                                            │ │
│  │  RPM Rotation                                             │ │
│  │  [120.0             ]                                     │ │
│  │                                                            │ │
│  │  Observaciones Generales                                  │ │
│  │  [────────────────────────────────────────────]          │ │
│  │  [                                             ]          │ │
│  │  [────────────────────────────────────────────]          │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                                 │
│                                [Cancelar]  [Guardar Borrador] │
└────────────────────────────────────────────────────────────────┘
```

#### Validaciones en Tiempo Real:

```typescript
// Validación de Proyecto
const validateProject = (projectId: string) => {
  if (!projectId) {
    setError('project_id', 'Debe seleccionar un proyecto');
    return false;
  }
  clearError('project_id');
  return true;
};

// Validación de Pozo
const validateWell = async (wellId: string, projectId: string) => {
  if (!wellId) {
    setError('well_id', 'Debe seleccionar un pozo');
    return false;
  }
  
  const well = await fetchWell(wellId);
  if (well.project_id !== projectId) {
    setError('well_id', 'El pozo no pertenece al proyecto seleccionado');
    return false;
  }
  
  if (well.status !== 'drilling') {
    setError('well_id', 'El pozo no está activo para perforación');
    return false;
  }
  
  clearError('well_id');
  return true;
};

// Validación de Fecha
const validateDate = (date: string) => {
  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (selectedDate > today) {
    setError('report_date', 'La fecha no puede ser futura');
    return false;
  }
  
  clearError('report_date');
  return true;
};
```

---

### 4.3 PANTALLA 3: Vista Detallada de Reporte

**Ruta**: `/drilling/reports/{id}`

#### Layout Desktop (Tabs):
```
┌────────────────────────────────────────────────────────────────┐
│  ← Volver    📄 REP-2025-0042              🟡 DRAFT            │
│                                                                 │
│  🏗️ Pozo Comunidad San Juan - Pozo #1                         │
│  📅 15/10/2025  ☀️ Turno Día  👤 Juan Pérez                   │
├────────────────────────────────────────────────────────────────┤
│  [📝 General] [⚙️ Actividades] [📦 Consumos] [🔧 Herramientas] [📊 Resumen] │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─── TAB: Actividades (2) ────────────────────────────────┐  │
│  │                                       [+ Agregar Actividad]│ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────────┐   │ │
│  │  │ 🏗️ Perforación                    ☀️ Día  │ 6.5h│   │ │
│  │  │ 08:00 - 14:30                                     │   │ │
│  │  │ Perforación continua en formación rocosa          │   │ │
│  │  │                                    [✏️] [🗑️]       │   │ │
│  │  └──────────────────────────────────────────────────┘   │ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────────┐   │ │
│  │  │ 🔧 Mantenimiento                  ☀️ Día  │ 1.0h│   │ │
│  │  │ 14:30 - 15:30                                     │   │ │
│  │  │ Cambio de broca por desgaste                      │   │ │
│  │  │                                    [✏️] [🗑️]       │   │ │
│  │  └──────────────────────────────────────────────────┘   │ │
│  │                                                            │ │
│  │  📊 Total Horas: 7.5h / 24h (31%)                        │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────┘  │
│                                                                 │
│                    [❌ Eliminar] [✏️ Editar] [✅ Completar]    │
└────────────────────────────────────────────────────────────────┘
```

#### Modal: Agregar Actividad
```
┌────────────────────────────────────────────┐
│  ⚙️ Agregar Actividad                  [✖]│
├────────────────────────────────────────────┤
│                                             │
│  * Tipo de Actividad                       │
│  [Perforación                          ▼] │
│                                             │
│  * Turno                                    │
│  ⚪ Día  ⚪ Noche                           │
│                                             │
│  * Horas Trabajadas                        │
│  [6.5                                   ] │
│  ℹ️ Rango: 0.1 - 24.0 horas                │
│  ℹ️ Disponibles en turno Día: 16.5h        │
│                                             │
│  Hora de Inicio (opcional)                 │
│  [08:00                                🕐] │
│                                             │
│  Hora de Fin (opcional)                    │
│  [14:30                                🕐] │
│                                             │
│  Descripción (opcional)                    │
│  [──────────────────────────────────]     │
│  [                                   ]     │
│  [──────────────────────────────────]     │
│                                             │
│         [Cancelar]  [Agregar Actividad]   │
└────────────────────────────────────────────┘
```

---

### 4.4 PANTALLA 4: Completar Reporte (Wizard Final)

```
┌────────────────────────────────────────────────────────────────┐
│  ✅ Completar Reporte REP-2025-0042                            │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─── PASO 1: Verificar Información ───────────────────────┐  │
│  │                                                           │  │
│  │  ✅ Información General    ✅ Personal Asignado          │  │
│  │  ✅ Actividades (2)        ✅ Consumos (3)               │  │
│  │  ✅ Herramientas (1)       ⚠️  Sin firmas                │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─── PASO 2: Horómetro Final ──────────────────────────────┐  │
│  │                                                           │  │
│  │  Horómetro Inicial:  1250.5                              │  │
│  │  Horómetro Final:    [1259.0              ]             │  │
│  │  Horas Trabajadas:   8.5h  (calculado)                   │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─── PASO 3: Resumen Final ─────────────────────────────────┐ │
│  │                                                           │  │
│  │  📊 Total Horas Trabajadas:    8.5h                      │  │
│  │  📏 Total Metros Perforados:   45.3m                     │  │
│  │  ⚙️  Total Actividades:         2                        │  │
│  │  📦 Total Consumos:            3 items                   │  │
│  │  🔧 Herramientas Asignadas:    1                         │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                                 │
│             [← Volver]  [Completar y Firmar →]                │
└────────────────────────────────────────────────────────────────┘
```

---

## 5. MODELOS DE DATOS (TypeScript Interfaces)

### 5.1 Modelo Principal: DrillingReport

```typescript
interface DrillingReport {
  id: string;  // UUID
  report_number: string;  // "REP-2025-0042"
  report_date: string;  // "2025-10-15" (YYYY-MM-DD)
  shift: 'day' | 'night' | 'mixed';
  status: 'draft' | 'completed' | 'approved' | 'rejected';
  
  // Relaciones
  project: Project;
  well: Well;
  equipment?: Equipment;
  personnel: Personnel;
  
  // Mediciones
  horometer?: Horometer;
  rpm?: RPM;
  
  // Colecciones
  activities: Activity[];
  consumptions: Consumption[];
  tool_assignments: ToolAssignment[];
  casings: Casing[];
  additives: Additive[];
  accessories: Accessory[];
  signatures: Signature[];
  
  // Totales calculados
  totals: {
    hours_worked: number;
    meters_drilled: number;
  };
  
  // Metadata
  observations?: string;
  created_at: string;  // ISO 8601
  updated_at: string;
  created_by?: User;
}
```

### 5.2 Sub-modelos

```typescript
interface Project {
  id: string;
  name: string;
  code: string;
  client?: {
    id: string;
    business_name: string;
  };
}

interface Well {
  id: string;
  name: string;
  well_number: string;
  target_depth_meters: number;
  current_depth_meters: number;
  status: string;
}

interface Equipment {
  id: string;
  name: string;
  serial_number: string;
  brand: string;
  model: string;
}

interface Personnel {
  operator_day?: Employee;
  helper1_day?: Employee;
  helper2_day?: Employee;
  operator_night?: Employee;
  helper1_night?: Employee;
  helper2_night?: Employee;
}

interface Employee {
  id: string;
  name: string;
  position: string;
}

interface Horometer {
  day?: {
    start: number;
    end?: number;
    hours_worked: number;
  };
  night?: {
    start: number;
    end?: number;
    hours_worked: number;
  };
}

interface RPM {
  pull_down?: number;
  rotation?: number;
}

interface Activity {
  id: string;
  activity_type: 'drilling' | 'maintenance' | 'installation' | 'testing' | 'waiting' | 'mobilization' | 'demobilization' | 'otros';
  shift: 'day' | 'night' | 'mixed';
  hours: number;  // 0.1 - 24.0
  start_time?: string;  // "08:00:00"
  end_time?: string;
  description?: string;
}

interface Consumption {
  id: string;
  consumable_type: string;
  shift: 'day' | 'night' | 'mixed';
  quantity: number;
  unit: 'kg' | 'bags' | 'liters' | 'gallons' | 'units';
}

interface ToolAssignment {
  id: string;
  tool_id: string;
  tool?: Tool;
  shift: 'day' | 'night' | 'mixed';
  tool_category: string;
  depth_range: {
    start_meters: number;
    end_meters: number;
    meters_drilled: number;
  };
  wear_pattern?: 'uniform' | 'centered' | 'eccentric' | 'one_sided';
  matrix?: 'good_condition' | 'moderate_wear' | 'severe_wear' | 'needs_replacement';
  assigned_at: string;
}

interface Tool {
  id: string;
  serial_number: string;
  name: string;
  manufacturer: string;
  status: string;
  total_usage_meters: number;
  capacity_meters?: number;
  remaining_meters?: number;
}

interface Signature {
  id: string;
  signature_type: 'operator' | 'supervisor' | 'client';
  signatory_name: string;
  signatory_user_id?: string;
  signature_method: 'digital' | 'physical' | 'electronic';
  signature_data?: string;  // Base64
  signed_at: string;
}
```

---

## 6. VALIDACIONES FRONTEND (Completas)

### 6.1 Validaciones de Formulario Principal

```typescript
// Archivo: validations/drillingReportValidations.ts

import * as yup from 'yup';

export const createReportSchema = yup.object({
  project_id: yup
    .string()
    .uuid('Formato de UUID inválido')
    .required('El proyecto es requerido'),
  
  well_id: yup
    .string()
    .uuid('Formato de UUID inválido')
    .required('El pozo es requerido')
    .test('belongs-to-project', 'El pozo no pertenece al proyecto', async function(wellId) {
      const { project_id } = this.parent;
      if (!wellId || !project_id) return true;
      
      const well = await fetchWell(wellId);
      return well.project_id === project_id;
    }),
  
  report_date: yup
    .date()
    .required('La fecha es requerida')
    .max(new Date(), 'La fecha no puede ser futura')
    .typeError('Fecha inválida'),
  
  shift: yup
    .string()
    .oneOf(['day', 'night', 'mixed'], 'Turno inválido')
    .required('Debe seleccionar un turno'),
  
  equipment_id: yup
    .string()
    .uuid()
    .nullable(),
  
  operator_day_id: yup
    .string()
    .uuid()
    .when('shift', {
      is: (shift) => shift === 'day' || shift === 'mixed',
      then: (schema) => schema.nullable(),
      otherwise: (schema) => schema.nullable()
    }),
  
  horometer_start_day: yup
    .number()
    .min(0, 'El horómetro no puede ser negativo')
    .max(999999.9, 'Valor de horómetro inválido')
    .nullable()
    .transform((value, originalValue) => 
      originalValue === '' ? null : value
    ),
  
  rpm_pull_down: yup
    .number()
    .min(0, 'RPM no puede ser negativo')
    .max(500, 'RPM parece irreal')
    .nullable()
    .transform((value, originalValue) => 
      originalValue === '' ? null : value
    ),
  
  observations: yup
    .string()
    .max(1000, 'Las observaciones no pueden exceder 1000 caracteres')
    .nullable()
});

export const addActivitySchema = yup.object({
  activity_type: yup
    .string()
    .oneOf([
      'drilling',
      'maintenance',
      'installation',
      'testing',
      'waiting',
      'mobilization',
      'demobilization',
      'otros'
    ], 'Tipo de actividad inválido')
    .required('Debe seleccionar un tipo de actividad'),
  
  shift: yup
    .string()
    .oneOf(['day', 'night', 'mixed'])
    .required('Debe seleccionar un turno'),
  
  hours: yup
    .number()
    .min(0.1, 'Mínimo 0.1 horas')
    .max(24, 'Máximo 24 horas')
    .required('Las horas son requeridas')
    .test('total-hours', 'Excede el máximo de 24 horas por turno', async function(hours) {
      const { shift } = this.parent;
      const reportId = this.options.context?.reportId;
      
      if (!reportId || !shift) return true;
      
      const report = await fetchReport(reportId);
      const currentHours = report.activities
        .filter(a => a.shift === shift)
        .reduce((sum, a) => sum + a.hours, 0);
      
      return (currentHours + hours) <= 24;
    }),
  
  start_time: yup
    .string()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:mm)')
    .nullable(),
  
  end_time: yup
    .string()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:mm)')
    .nullable()
    .test('is-after-start', 'La hora de fin debe ser después de la hora de inicio', function(endTime) {
      const { start_time } = this.parent;
      if (!start_time || !endTime) return true;
      
      return endTime > start_time;
    }),
  
  description: yup
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .nullable()
});

export const recordConsumptionSchema = yup.object({
  consumable_type: yup
    .string()
    .required('Debe seleccionar un tipo de consumible'),
  
  shift: yup
    .string()
    .oneOf(['day', 'night', 'mixed'])
    .required('Debe seleccionar un turno'),
  
  quantity: yup
    .number()
    .min(0.01, 'La cantidad debe ser mayor a 0')
    .max(999999, 'Cantidad inválida')
    .required('La cantidad es requerida'),
  
  unit: yup
    .string()
    .oneOf(['kg', 'bags', 'liters', 'gallons', 'units'])
    .required('Debe seleccionar una unidad')
});

export const assignToolSchema = yup.object({
  tool_id: yup
    .string()
    .uuid()
    .required('Debe seleccionar una herramienta')
    .test('is-available', 'La herramienta no está disponible', async function(toolId) {
      if (!toolId) return true;
      
      const tool = await fetchTool(toolId);
      return tool.status === 'available';
    })
    .test('has-capacity', 'La herramienta no tiene capacidad suficiente', async function(toolId) {
      if (!toolId) return true;
      
      const tool = await fetchTool(toolId);
      if (!tool.capacity_meters) return true;  // Sin límite
      
      const remaining = tool.capacity_meters - tool.total_usage_meters;
      return remaining > 0;
    }),
  
  shift: yup
    .string()
    .oneOf(['day', 'night', 'mixed'])
    .required('Debe seleccionar un turno'),
  
  tool_category: yup
    .string()
    .required('Debe seleccionar una categoría'),
  
  start_depth_meters: yup
    .number()
    .min(0, 'La profundidad no puede ser negativa')
    .required('La profundidad inicial es requerida'),
  
  end_depth_meters: yup
    .number()
    .required('La profundidad final es requerida')
    .test('is-greater', 'La profundidad final debe ser mayor que la inicial', function(endDepth) {
      const { start_depth_meters } = this.parent;
      if (!start_depth_meters) return true;
      
      return endDepth > start_depth_meters;
    }),
  
  wear_pattern: yup
    .string()
    .oneOf(['uniform', 'centered', 'eccentric', 'one_sided'])
    .nullable(),
  
  matrix: yup
    .string()
    .oneOf(['good_condition', 'moderate_wear', 'severe_wear', 'needs_replacement'])
    .nullable()
});
```
# 📋 ESPECIFICACIÓN TÉCNICA - DRILLING REPORTS FRONTEND (PARTE 4 - FINAL)

## 7. ESTADOS Y TRANSICIONES

### 7.1 Máquina de Estados

```typescript
type ReportStatus = 'draft' | 'completed' | 'approved' | 'rejected';

interface StatusTransition {
  from: ReportStatus;
  to: ReportStatus;
  action: string;
  permission: string;
  validations: string[];
}

const STATUS_TRANSITIONS: StatusTransition[] = [
  {
    from: 'draft',
    to: 'completed',
    action: 'complete',
    permission: 'drilling.reports.complete',
    validations: [
      'Debe tener al menos 1 actividad',
      'Debe tener al menos 1 operador asignado'
    ]
  },
  {
    from: 'completed',
    to: 'approved',
    action: 'approve',
    permission: 'drilling.reports.approve',
    validations: [
      'Debe tener firma de operador',
      'Debe tener firma de supervisor'
    ]
  },
  {
    from: 'completed',
    to: 'rejected',
    action: 'reject',
    permission: 'drilling.reports.reject',
    validations: [
      'Debe proporcionar un motivo de rechazo'
    ]
  },
  {
    from: 'rejected',
    to: 'draft',
    action: 'edit',
    permission: 'drilling.reports.update',
    validations: []
  }
];

// Hook personalizado para manejar transiciones
const useReportStatusTransition = (report: DrillingReport) => {
  const canTransitionTo = (targetStatus: ReportStatus): boolean => {
    const transition = STATUS_TRANSITIONS.find(
      t => t.from === report.status && t.to === targetStatus
    );
    
    if (!transition) return false;
    
    // Verificar permiso
    if (!hasPermission(transition.permission)) {
      return false;
    }
    
    return true;
  };
  
  const getAvailableActions = (): string[] => {
    return STATUS_TRANSITIONS
      .filter(t => t.from === report.status)
      .filter(t => hasPermission(t.permission))
      .map(t => t.action);
  };
  
  return { canTransitionTo, getAvailableActions };
};
```

### 7.2 Estados Visuales en UI

```typescript
const STATUS_CONFIG = {
  draft: {
    label: 'Borrador',
    color: '#FCD34D',  // Amarillo
    bgColor: '#FEF3C7',
    icon: '✏️',
    description: 'Reporte en construcción',
    actions: ['edit', 'delete', 'complete']
  },
  completed: {
    label: 'Completado',
    color: '#60A5FA',  // Azul
    bgColor: '#DBEAFE',
    icon: '📝',
    description: 'Esperando aprobación',
    actions: ['view', 'approve', 'reject']
  },
  approved: {
    label: 'Aprobado',
    color: '#34D399',  // Verde
    bgColor: '#D1FAE5',
    icon: '✅',
    description: 'Reporte aprobado',
    actions: ['view', 'export']
  },
  rejected: {
    label: 'Rechazado',
    color: '#F87171',  // Rojo
    bgColor: '#FEE2E2',
    icon: '❌',
    description: 'Requiere corrección',
    actions: ['view', 'edit']
  }
};

// Componente StatusBadge
const StatusBadge: React.FC<{ status: ReportStatus }> = ({ status }) => {
  const config = STATUS_CONFIG[status];
  
  return (
    <span
      className="status-badge"
      style={{
        backgroundColor: config.bgColor,
        color: config.color,
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 600
      }}
    >
      {config.icon} {config.label}
    </span>
  );
};
```

---

## 8. CASOS DE USO DETALLADOS

### CASO DE USO 1: Crear Reporte Diario

**Actor**: Operador de Campo  
**Precondiciones**:
- Usuario autenticado
- Tiene permiso `drilling.reports.create`
- Existe al menos 1 proyecto activo
- Existe al menos 1 pozo en estado "drilling"

**Flujo Principal**:

1. **Operador navega** a `/drilling/reports`
2. **Sistema muestra** lista de reportes existentes
3. **Operador hace clic** en botón "Nuevo Reporte"
4. **Sistema navega** a `/drilling/reports/create`
5. **Sistema carga**:
   - Lista de proyectos activos
   - Lista de empleados disponibles
   - Lista de equipos disponibles
6. **Operador selecciona**:
   - Proyecto: "Pozo Comunidad San Juan"
   - Pozo: "Pozo #1" (filtrado por proyecto)
   - Fecha: 15/10/2025 (default: hoy)
   - Turno: "Día"
   - Equipo: "Perforadora Caterpillar MD6250"
   - Operador: "Juan Pérez"
   - Ayudante 1: "Pedro López"
   - Horómetro Inicial: 1250.5
7. **Sistema valida** en tiempo real cada campo
8. **Operador hace clic** en "Guardar Borrador"
9. **Sistema**:
   - Valida todos los campos
   - Envía POST `/api/drilling/reports`
   - Genera número de reporte: "REP-2025-0042"
   - Crea reporte en estado "DRAFT"
10. **Sistema muestra** mensaje: "✅ Reporte REP-2025-0042 creado exitosamente"
11. **Sistema navega** a vista detallada: `/drilling/reports/{id}`

**Flujos Alternativos**:

**A1: Validación Falla**
- En paso 9, si algún campo es inválido:
  - Sistema muestra errores debajo de cada campo
  - Operador corrige errores
  - Retorna a paso 8

**A2: Pozo No Pertenece a Proyecto**
- En paso 6, si operador selecciona pozo incorrecto:
  - Sistema muestra: "⚠️ El pozo no pertenece al proyecto seleccionado"
  - Operador selecciona pozo correcto

**A3: Fecha Futura**
- En paso 6, si operador selecciona fecha futura:
  - Sistema muestra: "❌ La fecha no puede ser futura"
  - Sistema sugiere fecha actual

**Poscondiciones**:
- Reporte creado en BD con status "draft"
- Reporte asignado al operador que lo creó
- Número de reporte único generado

---

### CASO DE USO 2: Agregar Actividad Durante Jornada

**Actor**: Operador de Campo  
**Precondiciones**:
- Reporte existe en estado "DRAFT"
- Usuario es creador del reporte

**Flujo Principal**:

1. **Operador está** en vista detallada del reporte
2. **Sistema muestra** tab "Actividades" con lista vacía o existente
3. **Operador hace clic** en "+ Agregar Actividad"
4. **Sistema muestra** modal con formulario:
   ```
   Tipo de Actividad: [Dropdown]
   Turno: [Radio: Día/Noche] (pre-seleccionado según reporte)
   Horas: [Input numérico]
   Hora Inicio: [TimePicker] (opcional)
   Hora Fin: [TimePicker] (opcional)
   Descripción: [Textarea] (opcional)
   ```
5. **Operador ingresa**:
   - Tipo: "Perforación"
   - Turno: "Día" (disabled, heredado del reporte)
   - Horas: 6.5
   - Inicio: 08:00
   - Fin: 14:30
   - Descripción: "Perforación continua en formación rocosa"
6. **Sistema calcula** automáticamente:
   - Duración: 6.5h (si hay inicio/fin)
   - Total de horas en turno: 6.5h / 24h
   - Muestra: "📊 Disponibles: 17.5h en turno Día"
7. **Sistema valida** en tiempo real:
   - ✅ Horas en rango 0.1 - 24.0
   - ✅ Total de turno no excede 24h
   - ✅ Hora fin > Hora inicio
8. **Operador hace clic** "Agregar Actividad"
9. **Sistema**:
   - Envía POST `/api/drilling/reports/{id}/add-activity`
   - Agrega actividad a la lista
   - Actualiza total de horas: "Total: 6.5h"
   - Cierra modal
10. **Sistema muestra** mensaje: "✅ Actividad agregada"
11. **Sistema actualiza** tarjeta de actividad en la lista

**Flujos Alternativos**:

**A1: Excede 24 horas**
- En paso 7, si (horas existentes + nuevas horas) > 24:
  - Sistema muestra: "❌ El turno Día ya tiene 18h. No puedes agregar 6.5h más (máximo 24h)"
  - Operador ajusta horas

**A2: Hora Fin Antes de Inicio**
- En paso 7, si hora fin < hora inicio:
  - Sistema muestra: "❌ La hora de fin debe ser después de la hora de inicio"
  - Operador corrige

**Poscondiciones**:
- Actividad guardada en BD vinculada al reporte
- Total de horas recalculado
- Reporte permanece en estado "DRAFT"

---

### CASO DE USO 3: Asignar Herramienta con Verificación de Capacidad

**Actor**: Operador de Campo  
**Precondiciones**:
- Reporte existe en estado "DRAFT"
- Existen herramientas disponibles

**Flujo Principal**:

1. **Operador** navega a tab "Herramientas"
2. **Sistema muestra** lista de herramientas asignadas (puede estar vacía)
3. **Operador hace clic** "+ Asignar Herramienta"
4. **Sistema muestra** modal con:
   - Buscador de herramientas (autocomplete)
   - Campos deshabilitados hasta seleccionar herramienta
5. **Operador busca** "Broca 12"
6. **Sistema muestra** resultados:
   ```
   🔧 Broca Tricónica 12" - DRILL-BIT-001
      Fabricante: Hughes
      Estado: ✅ Disponible
      Capacidad: 450.5m / 1000m (45% usado)
      Restante: 549.5m
      [Seleccionar]
   
   🔧 Broca PDC 12" - DRILL-BIT-002
      Fabricante: Smith
      Estado: ⚠️ Baja Capacidad
      Capacidad: 920m / 1000m (92% usado)
      Restante: 80m ⚠️
      [Seleccionar]
   ```
7. **Operador selecciona** "Broca Tricónica 12" - DRILL-BIT-001
8. **Sistema habilita** campos y pre-carga:
   - Categoría: "Broca de Perforación"
   - Profundidad Inicial: [Sugerida: última prof. del pozo]
9. **Operador ingresa**:
   - Prof. Inicial: 50.0m
   - Prof. Final: 95.3m
   - **Sistema calcula**: Metros perforados: 45.3m
10. **Sistema verifica** capacidad:
    - Capacidad restante: 549.5m
    - Metros a perforar: 45.3m
    - **✅ Suficiente** (549.5m - 45.3m = 504.2m)
    - Muestra: "✅ Capacidad suficiente. Restará: 504.2m (50%)"
11. **Operador ingresa** adicionales:
    - Patrón de desgaste: "Uniforme"
    - Estado de matriz: "Buen Estado"
12. **Operador hace clic** "Asignar Herramienta"
13. **Sistema**:
    - Envía POST `/api/drilling/reports/{id}/assign-tool`
    - Backend valida disponibilidad nuevamente
    - Backend registra uso en historial
    - Backend actualiza total de metros del reporte
14. **Sistema muestra**:
    - "✅ Herramienta asignada exitosamente"
    - Si capacidad < 30%: "⚠️ La herramienta tiene solo 504.2m restantes (50%)"
15. **Sistema actualiza** lista de herramientas asignadas

**Flujos Alternativos**:

**A1: Capacidad Insuficiente**
- En paso 10, si metros a perforar > capacidad restante:
  - Sistema muestra: "❌ Capacidad insuficiente. Restante: 80m, Requerido: 95m"
  - Sistema sugiere: "💡 Considera usar otra herramienta o perforar en etapas"
  - Operador cancela o ajusta profundidades

**A2: Herramienta No Disponible**
- En paso 7, si herramienta tiene status != 'available':
  - Sistema muestra badge: "🔴 No Disponible (En Mantenimiento)"
  - Botón "Seleccionar" deshabilitado

**A3: Prof. Final < Prof. Inicial**
- En paso 9, si prof. final <= prof. inicial:
  - Sistema muestra: "❌ La profundidad final debe ser mayor que la inicial"
  - Operador corrige

**Poscondiciones**:
- Herramienta asignada al reporte
- Uso registrado en historial de herramienta
- Total de metros del reporte actualizado
- Si capacidad < 20%: Alerta generada en sistema

---

### CASO DE USO 4: Completar y Firmar Reporte

**Actor**: Operador de Campo  
**Precondiciones**:
- Reporte en estado "DRAFT"
- Reporte tiene al menos 1 actividad
- Reporte tiene al menos 1 operador asignado

**Flujo Principal**:

1. **Operador** hace clic en "Completar Reporte"
2. **Sistema valida** pre-requisitos:
   - ✅ Tiene actividades
   - ✅ Tiene operador
   - ⚠️ Sin firmas
3. **Sistema muestra** wizard en 3 pasos:

**PASO 1: Verificación**
```
✅ Información General      ✅ Personal Asignado
✅ Actividades (2)          ✅ Consumos (3)
✅ Herramientas (1)         ⚠️ Sin firmas

[Siguiente →]
```

**PASO 2: Horómetro Final**
```
Horómetro Inicial:  1250.5
Horómetro Final:    [______]  (foco aquí)

ℹ️ Ingrese la lectura final del horómetro

[← Atrás]  [Siguiente →]
```

4. **Operador ingresa**: 1259.0
5. **Sistema calcula**: Horas: 8.5h
6. **Sistema valida**: 1259.0 >= 1250.5 ✅

**PASO 3: Resumen**
```
📊 Total Horas Trabajadas:    8.5h
📏 Total Metros Perforados:   45.3m
⚙️ Total Actividades:         2
📦 Total Consumos:            3 items
🔧 Herramientas Asignadas:    1

[← Volver]  [Completar y Firmar →]
```

7. **Operador hace clic** "Completar y Firmar"
8. **Sistema**:
   - Envía POST `/api/drilling/reports/{id}/complete` con `horometer_end_day: 1259.0`
   - Backend valida y cambia status a "COMPLETED"
   - Backend calcula totales finales
9. **Sistema muestra** modal de firma:
```
✍️ Firma Digital

Por favor, firme el reporte como operador

[Canvas para dibujar firma]

[Limpiar]  [Guardar Firma]
```

10. **Operador** dibuja firma en canvas
11. **Operador hace clic** "Guardar Firma"
12. **Sistema**:
    - Convierte canvas a base64
    - Envía POST `/api/drilling/reports/{id}/sign` con:
      ```json
      {
        "signature_type": "operator",
        "signature_method": "digital",
        "signature_data": "data:image/png;base64,iVBOR..."
      }
      ```
13. **Sistema muestra**:
    - "✅ Reporte completado y firmado exitosamente"
    - "📧 Notificación enviada al supervisor"
14. **Sistema navega** a vista detallada (modo lectura)

**Flujos Alternativos**:

**A1: Sin Actividades**
- En paso 2, si reporte no tiene actividades:
  - Sistema bloquea botón "Completar Reporte"
  - Sistema muestra: "⚠️ Debes agregar al menos una actividad"
  - Operador agrega actividad

**A2: Horómetro Final < Inicial**
- En paso 6, si horómetro final < inicial:
  - Sistema muestra: "❌ El horómetro final debe ser mayor o igual al inicial"
  - Operador corrige

**A3: Error al Guardar Firma**
- En paso 12, si falla el guardado:
  - Sistema muestra: "❌ Error al guardar firma. Intente nuevamente"
  - Operador reintenta

**Poscondiciones**:
- Reporte en estado "COMPLETED"
- Horómetro final registrado
- Totales finales calculados
- Firma de operador guardada
- Notificación enviada a supervisor
- Reporte de solo lectura para operador

---

### CASO DE USO 5: Aprobar Reporte (Supervisor)

**Actor**: Supervisor  
**Precondiciones**:
- Reporte en estado "COMPLETED"
- Usuario tiene permiso `drilling.reports.approve`
- Reporte tiene firma de operador

**Flujo Principal**:

1. **Supervisor** recibe notificación: "📧 Nuevo reporte REP-2025-0042 esperando aprobación"
2. **Supervisor** navega a `/drilling/reports?status=completed`
3. **Sistema muestra** lista de reportes pendientes de aprobación
4. **Supervisor hace clic** "Ver" en reporte REP-2025-0042
5. **Sistema muestra** vista detallada completa con tabs:
   - General, Actividades, Consumos, Herramientas, Firmas, Resumen
6. **Supervisor revisa** cada tab:
   - ✅ Personal correcto
   - ✅ Actividades razonables
   - ✅ Consumos dentro de lo esperado
   - ✅ Herramientas correctas
   - ✅ Firma de operador presente
7. **Supervisor hace clic** tab "Firmas"
8. **Sistema muestra**:
   ```
   ✅ Firma de Operador
      Juan Pérez
      15/10/2025 16:30
      [Ver Firma]
   
   ⚠️ Falta Firma de Supervisor
      [Firmar como Supervisor]
   ```
9. **Supervisor hace clic** "Firmar como Supervisor"
10. **Sistema muestra** modal de firma (canvas)
11. **Supervisor** dibuja y guarda firma
12. **Sistema** guarda firma tipo "supervisor"
13. **Supervisor hace clic** botón "✅ Aprobar Reporte"
14. **Sistema muestra** confirmación:
    ```
    ¿Aprobar Reporte REP-2025-0042?
    
    Esta acción no se puede deshacer.
    El reporte quedará como definitivo.
    
    [Cancelar]  [Sí, Aprobar]
    ```
15. **Supervisor confirma**
16. **Sistema**:
    - Envía POST `/api/drilling/reports/{id}/approve`
    - Backend valida firmas requeridas
    - Backend cambia status a "APPROVED"
    - Backend registra quién aprobó y cuándo
17. **Sistema muestra**: "✅ Reporte aprobado exitosamente"
18. **Sistema envía** notificaciones:
    - Al operador: "✅ Tu reporte REP-2025-0042 fue aprobado"
    - Al cliente: "📄 Nuevo reporte disponible"

**Flujos Alternativos**:

**A1: Falta Firma de Operador**
- En paso 13, si no hay firma de operador:
  - Sistema deshabilita botón "Aprobar"
  - Sistema muestra: "⚠️ No se puede aprobar sin firma de operador"

**A2: Supervisor Rechaza**
- En paso 13, supervisor hace clic "❌ Rechazar"
- Sistema muestra modal:
  ```
  Rechazar Reporte
  
  Motivo del Rechazo: *
  [_________________________________]
  [                                 ]
  [_________________________________]
  
  Mínimo 10 caracteres
  
  [Cancelar]  [Rechazar Reporte]
  ```
- Supervisor escribe: "Faltan detalles en actividades de mantenimiento"
- Sistema envía POST `/api/drilling/reports/{id}/reject` con motivo
- Sistema cambia status a "REJECTED"
- Sistema notifica operador con motivo

**Poscondiciones**:
- Reporte en estado "APPROVED"
- Firma de supervisor guardada
- Registro de aprobación con timestamp
- Notificaciones enviadas
- Reporte visible para cliente

---

## 9. UI/UX ESPECIFICACIONES

### 9.1 Paleta de Colores

```css
/* Colores Principales */
--primary-blue: #3B82F6;
--primary-blue-dark: #2563EB;
--primary-blue-light: #DBEAFE;

/* Estados */
--status-draft: #FCD34D;
--status-completed: #60A5FA;
--status-approved: #34D399;
--status-rejected: #F87171;

/* Fondos de Estados */
--bg-draft: #FEF3C7;
--bg-completed: #DBEAFE;
--bg-approved: #D1FAE5;
--bg-rejected: #FEE2E2;

/* Grises */
--gray-50: #F9FAFB;
--gray-100: #F3F4F6;
--gray-200: #E5E7EB;
--gray-300: #D1D5DB;
--gray-500: #6B7280;
--gray-700: #374151;
--gray-900: #111827;

/* Alertas */
--warning: #F59E0B;
--warning-bg: #FEF3C7;
--error: #EF4444;
--error-bg: #FEE2E2;
--success: #10B981;
--success-bg: #D1FAE5;
--info: #3B82F6;
--info-bg: #DBEAFE;
```

### 9.2 Tipografía

```css
/* Font Family */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Tamaños */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */

/* Pesos */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### 9.3 Espaciado y Layout

```css
/* Espaciado */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */

/* Bordes */
--radius-sm: 0.375rem;   /* 6px */
--radius-md: 0.5rem;     /* 8px */
--radius-lg: 0.75rem;    /* 12px */
--radius-full: 9999px;

/* Sombras */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
```

### 9.4 Componentes Clave

#### Botón Primario
```css
.button-primary {
  background-color: var(--primary-blue);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  font-weight: var(--font-medium);
  transition: background-color 0.2s;
}

.button-primary:hover {
  background-color: var(--primary-blue-dark);
}

.button-primary:disabled {
  background-color: var(--gray-300);
  cursor: not-allowed;
}
```

#### Tarjeta de Reporte
```css
.report-card {
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s;
}

.report-card:hover {
  box-shadow: var(--shadow-md);
}
```

#### Input de Formulario
```css
.form-input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 3px var(--primary-blue-light);
}

.form-input.error {
  border-color: var(--error);
}
```

---

## 10. MENSAJES Y NOTIFICACIONES

### 10.1 Mensajes de Éxito

```typescript
const SUCCESS_MESSAGES = {
  REPORT_CREATED: {
    title: 'Reporte Creado',
    message: 'Reporte {reportNumber} creado exitosamente',
    icon: '✅',
    duration: 3000
  },
  ACTIVITY_ADDED: {
    title: 'Actividad Agregada',
    message: 'La actividad se agregó correctamente',
    icon: '✅',
    duration: 2000
  },
  TOOL_ASSIGNED: {
    title: 'Herramienta Asignada',
    message: 'Herramienta {toolName} asignada exitosamente',
    icon: '✅',
    duration: 3000
  },
  REPORT_COMPLETED: {
    title: 'Reporte Completado',
    message: 'El reporte está listo para aprobación',
    icon: '✅',
    duration: 3000
  },
  REPORT_APPROVED: {
    title: 'Reporte Aprobado',
    message: 'El reporte {reportNumber} ha sido aprobado',
    icon: '✅',
    duration: 4000
  },
  SIGNATURE_SAVED: {
    title: 'Firma Guardada',
    message: 'Tu firma se guardó correctamente',
    icon: '✍️',
    duration: 2000
  }
};
```

### 10.2 Mensajes de Advertencia

```typescript
const WARNING_MESSAGES = {
  LOW_TOOL_CAPACITY: {
    title: 'Capacidad Baja',
    message: 'La herramienta {toolName} tiene solo {remaining}m de capacidad restante ({percentage}%)',
    icon: '⚠️',
    type: 'warning',
    duration: 5000
  },
  SHIFT_HOURS_HIGH: {
    title: 'Alerta de Horas',
    message: 'El turno {shift} ya tiene {hours}h de 24h registradas',
    icon: '⚠️',
    type: 'warning',
    duration: 4000
  },
  MISSING_SIGNATURES: {
    title: 'Firmas Pendientes',
    message: 'El reporte requiere firmas para ser aprobado',
    icon: '⚠️',
    type: 'warning',
    duration: 0  // No auto-cerrar
  }
};
```

### 10.3 Mensajes de Error

```typescript
const ERROR_MESSAGES = {
  NETWORK_ERROR: {
    title: 'Error de Conexión',
    message: 'No se pudo conectar con el servidor. Verifica tu conexión.',
    icon: '🔌',
    type: 'error',
    duration: 0  // No auto-cerrar
  },
  VALIDATION_ERROR: {
    title: 'Datos Inválidos',
    message: 'Por favor corrige los errores marcados en rojo',
    icon: '❌',
    type: 'error',
    duration: 4000
  },
  TOOL_NOT_AVAILABLE: {
    title: 'Herramienta No Disponible',
    message: 'La herramienta seleccionada no está disponible (estado: {status})',
    icon: '❌',
    type: 'error',
    duration: 5000
  },
  INSUFFICIENT_CAPACITY: {
    title: 'Capacidad Insuficiente',
    message: 'La herramienta solo tiene {remaining}m disponibles. Necesitas {required}m',
    icon: '❌',
    type: 'error',
    duration: 6000
  },
  PERMISSION_DENIED: {
    title: 'Permiso Denegado',
    message: 'No tienes permiso para realizar esta acción',
    icon: '🔒',
    type: 'error',
    duration: 4000
  }
};
```

### 10.4 Notificaciones Push

```typescript
interface PushNotification {
  type: 'report_completed' | 'report_approved' | 'report_rejected';
  title: string;
  message: string;
  reportId: string;
  reportNumber: string;
  actionUrl: string;
}

// Ejemplo de uso
const sendNotification = (userId: string, notification: PushNotification) => {
  // Implementar con tu sistema de notificaciones
  // Ejemplo: Firebase Cloud Messaging, OneSignal, etc.
};

// Configuraciones de notificaciones
const NOTIFICATION_CONFIGS = {
  report_completed: {
    title: 'Nuevo Reporte Completado',
    body: 'El reporte {reportNumber} está esperando tu aprobación',
    icon: '📝',
    sound: 'default',
    badge: 1
  },
  report_approved: {
    title: 'Reporte Aprobado',
    body: 'Tu reporte {reportNumber} ha sido aprobado por {approverName}',
    icon: '✅',
    sound: 'success',
    badge: 0
  },
  report_rejected: {
    title: 'Reporte Rechazado',
    body: 'Tu reporte {reportNumber} requiere correcciones',
    icon: '❌',
    sound: 'alert',
    badge: 1
  }
};
```

---

## 11. PERMISOS Y ROLES

### 11.1 Matriz de Permisos

| Acción | Operador | Supervisor | Gerente | Admin |
|--------|----------|------------|---------|-------|
| Crear reporte | ✅ | ✅ | ✅ | ✅ |
| Ver reportes propios | ✅ | ✅ | ✅ | ✅ |
| Ver todos los reportes | ❌ | ✅ | ✅ | ✅ |
| Editar reporte (draft) | ✅ (propio) | ✅ | ✅ | ✅ |
| Eliminar reporte (draft) | ✅ (propio) | ✅ | ✅ | ✅ |
| Completar reporte | ✅ (propio) | ✅ | ✅ | ✅ |
| Aprobar reporte | ❌ | ✅ | ✅ | ✅ |
| Rechazar reporte | ❌ | ✅ | ✅ | ✅ |
| Firmar como operador | ✅ (propio) | ❌ | ❌ | ✅ |
| Firmar como supervisor | ❌ | ✅ | ✅ | ✅ |
| Exportar PDF | ✅ (propio) | ✅ | ✅ | ✅ |
| Ver historial completo | ❌ | ✅ | ✅ | ✅ |

### 11.2 Implementación de Permisos

```typescript
// Constantes de permisos
const PERMISSIONS = {
  REPORTS_CREATE: 'drilling.reports.create',
  REPORTS_VIEW_OWN: 'drilling.reports.view.own',
  REPORTS_VIEW_ALL: 'drilling.reports.view.all',
  REPORTS_UPDATE: 'drilling.reports.update',
  REPORTS_DELETE: 'drilling.reports.delete',
  REPORTS_COMPLETE: 'drilling.reports.complete',
  REPORTS_APPROVE: 'drilling.reports.approve',
  REPORTS_REJECT: 'drilling.reports.reject',
  REPORTS_SIGN_OPERATOR: 'drilling.reports.sign.operator',
  REPORTS_SIGN_SUPERVISOR: 'drilling.reports.sign.supervisor',
  REPORTS_EXPORT: 'drilling.reports.export'
};

// Hook personalizado para verificar permisos
const usePermission = () => {
  const { user } = useAuth();
  
  const hasPermission = (permission: string): boolean => {
    return user?.permissions?.includes(permission) || false;
  };
  
  const canEditReport = (report: DrillingReport): boolean => {
    // Solo draft puede editarse
    if (report.status !== 'draft') return false;
    
    // Admin puede editar cualquiera
    if (hasPermission('drilling.reports.update')) return true;
    
    // Usuario puede editar su propio reporte
    return report.created_by?.id === user?.id;
  };
  
  const canApproveReport = (report: DrillingReport): boolean => {
    // Solo completed puede aprobarse
    if (report.status !== 'completed') return false;
    
    // Debe tener permisos
    return hasPermission(PERMISSIONS.REPORTS_APPROVE);
  };
  
  return { hasPermission, canEditReport, canApproveReport };
};

// Componente que usa permisos
const ReportActions: React.FC<{ report: DrillingReport }> = ({ report }) => {
  const { canEditReport, canApproveReport } = usePermission();
  
  return (
    <div className="report-actions">
      {canEditReport(report) && (
        <button onClick={handleEdit}>✏️ Editar</button>
      )}
      
      {canApproveReport(report) && (
        <button onClick={handleApprove}>✅ Aprobar</button>
      )}
    </div>
  );
};
```

---

## 12. CRITERIOS DE ACEPTACIÓN

### 12.1 Criterio 1: Creación de Reporte
✅ **Dado** que soy un operador autenticado  
✅ **Cuando** creo un nuevo reporte con datos válidos  
✅ **Entonces**:
- Se genera un número de reporte único (formato: REP-YYYY-NNNN)
- El reporte se crea en estado "DRAFT"
- Se me asigna como creador del reporte
- Puedo ver el reporte en mi lista
- El reporte está editable

### 12.2 Criterio 2: Validación de Datos
✅ **Dado** que estoy creando un reporte  
✅ **Cuando** ingreso datos inválidos  
✅ **Entonces**:
- Se muestran mensajes de error específicos debajo de cada campo
- Los campos inválidos se marcan en rojo
- El botón "Guardar" permanece habilitado pero muestra errores al hacer clic
- No se envía la petición al servidor hasta que todos los datos sean válidos

### 12.3 Criterio 3: Agregar Actividades
✅ **Dado** que tengo un reporte en estado "DRAFT"  
✅ **Cuando** agrego una actividad  
✅ **Entonces**:
- La actividad se guarda en la base de datos
- La actividad aparece en la lista inmediatamente
- El total de horas se recalcula automáticamente
- No puedo agregar más de 24 horas por turno
- El reporte permanece en estado "DRAFT"

### 12.4 Criterio 4: Asignar Herramienta
✅ **Dado** que estoy asignando una herramienta  
✅ **Cuando** la herramienta tiene capacidad limitada  
✅ **Entonces**:
- Se muestra la capacidad restante antes de asignar
- Se valida que la capacidad sea suficiente
- Si la capacidad es < 30%, se muestra una advertencia
- Si la capacidad es insuficiente, se bloquea la asignación
- Se actualiza el historial de uso de la herramienta

### 12.5 Criterio 5: Completar Reporte
✅ **Dado** que tengo un reporte con todos los datos necesarios  
✅ **Cuando** completo el reporte  
✅ **Entonces**:
- El reporte cambia a estado "COMPLETED"
- Se calcula y guarda el horómetro final
- Se calculan los totales finales (horas y metros)
- Se solicita la firma del operador
- El reporte ya no es editable
- Se envía notificación al supervisor

### 12.6 Criterio 6: Aprobar Reporte
✅ **Dado** que soy supervisor y hay un reporte "COMPLETED"  
✅ **Cuando** apruebo el reporte  
✅ **Entonces**:
- El reporte debe tener firma de operador
- Debo firmar como supervisor antes de aprobar
- El reporte cambia a estado "APPROVED"
- Se registra quién y cuándo aprobó
- Se envía notificación al operador y al cliente
- El reporte se vuelve de solo lectura para todos

### 12.7 Criterio 7: Rechazar Reporte
✅ **Dado** que soy supervisor  
✅ **Cuando** rechazo un reporte  
✅ **Entonces**:
- Debo proporcionar un motivo (mínimo 10 caracteres)
- El reporte cambia a estado "REJECTED"
- El operador recibe notificación con el motivo
- El operador puede editar el reporte nuevamente
- El reporte vuelve a estado "DRAFT" al editar

### 12.8 Criterio 8: Responsividad
✅ **Dado** que accedo desde diferentes dispositivos  
✅ **Cuando** uso la aplicación  
✅ **Entonces**:
- En desktop (>1024px): Vista de tabla con todos los detalles
- En tablet (768-1024px): Vista de tarjetas en 2 columnas
- En móvil (<768px): Vista de lista con detalles esenciales
- Los formularios se adaptan al tamaño de pantalla
- Los modales ocupan full screen en móvil

---

## 13. RESUMEN Y PRÓXIMOS PASOS

### 13.1 Resumen Ejecutivo

Este documento proporciona la especificación completa para implementar el módulo de **Reportes de Perforación** en el frontend. Incluye:

✅ 12 Endpoints de API completamente documentados  
✅ 4 Pantallas principales con layouts y flujos  
✅ 5 Casos de uso detallados paso a paso  
✅ Modelos de datos TypeScript completos  
✅ Validaciones frontend exhaustivas  
✅ Máquina de estados y transiciones  
✅ Especificaciones UI/UX con paleta de colores  
✅ Sistema de mensajes y notificaciones  
✅ Matriz de permisos por rol  
✅ 8 Criterios de aceptación  

### 13.2 Stack Tecnológico Recomendado

**Frontend**:
- React 18+ con TypeScript
- React Router v6 para navegación
- React Query para manejo de estado servidor
- Formik + Yup para formularios y validaciones
- Tailwind CSS para estilos
- Axios para peticiones HTTP
- React Signature Canvas para firmas digitales
- React Datepicker para calendarios
- React Select para dropdowns avanzados
- React Toastify para notificaciones

**Librerías Adicionales**:
- date-fns para manejo de fechas
- chart.js o recharts para gráficas (si es necesario)
- html2pdf para exportar a PDF (lado cliente)

### 13.3 Estructura de Carpetas Sugerida

```
src/
├── features/
│   └── drilling-reports/
│       ├── components/
│       │   ├── ReportCard.tsx
│       │   ├── ReportFilters.tsx
│       │   ├── StatusBadge.tsx
│       │   ├── ActivityForm.tsx
│       │   ├── ConsumptionForm.tsx
│       │   ├── ToolAssignmentForm.tsx
│       │   └── SignatureCanvas.tsx
│       ├── pages/
│       │   ├── ReportListPage.tsx
│       │   ├── ReportCreatePage.tsx
│       │   ├── ReportDetailPage.tsx
│       │   └── ReportCompletePage.tsx
│       ├── hooks/
│       │   ├── useReports.ts
│       │   ├── useReportActions.ts
│       │   ├── usePermissions.ts
│       │   └── useStatusTransition.ts
│       ├── services/
│       │   └── drillingReportService.ts
│       ├── types/
│       │   └── index.ts
│       └── validations/
│           └── schemas.ts
├── shared/
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   └── constants/
└── api/
    └── client.ts
```

### 13.4 Estimación de Esfuerzo

| Componente | Días | Desarrollador |
|------------|------|---------------|
| Setup y estructura | 1 | 1 dev |
| Modelos y tipos TS | 0.5 | 1 dev |
| Servicios API | 1 | 1 dev |
| Lista de reportes | 2 | 1 dev |
| Crear/Editar reporte | 3 | 1 dev |
| Vista detallada + tabs | 3 | 1 dev |
| Formularios de actividades | 2 | 1 dev |
| Formularios de consumos | 1.5 | 1 dev |
| Formulario de herramientas | 2.5 | 1 dev |
| Completar + firmar | 2.5 | 1 dev |
| Aprobar/Rechazar | 2 | 1 dev |
| Validaciones | 2 | 1 dev |
| Permisos y roles | 1.5 | 1 dev |
| Notificaciones | 1.5 | 1 dev |
| Testing | 3 | 1 dev |
| Ajustes y pulido | 2 | 1 dev |
| **TOTAL** | **31 días** | **1 dev full-time** |

**Estimación Alternativa**: 2 desarrolladores = ~16 días  
**Estimación con QA**: +5 días de testing

### 13.5 Checklist de Implementación

#### Fase 1: Setup (Días 1-2)
- [ ] Configurar proyecto con TypeScript
- [ ] Instalar dependencias necesarias
- [ ] Configurar Axios y API client
- [ ] Crear estructura de carpetas
- [ ] Definir tipos TypeScript
- [ ] Configurar Tailwind CSS

#### Fase 2: Servicios y Hooks (Días 3-4)
- [ ] Implementar servicio de API para reportes
- [ ] Crear hooks personalizados (useReports, usePermissions)
- [ ] Configurar React Query
- [ ] Implementar manejo de errores global

#### Fase 3: Componentes Base (Días 5-7)
- [ ] ReportCard component
- [ ] StatusBadge component
- [ ] ReportFilters component
- [ ] FormInput components
- [ ] Modal component
- [ ] Button components

#### Fase 4: Lista de Reportes (Días 8-9)
- [ ] ReportListPage
- [ ] Filtros y búsqueda
- [ ] Paginación
- [ ] Acciones por reporte según estado

#### Fase 5: Crear/Editar Reporte (Días 10-12)
- [ ] ReportCreatePage
- [ ] Formulario principal con validaciones
- [ ] Dropdowns de proyecto, pozo, personal
- [ ] Guardar como borrador

#### Fase 6: Vista Detallada (Días 13-15)
- [ ] ReportDetailPage
- [ ] Tabs de navegación
- [ ] Vista de información general
- [ ] Vista de actividades
- [ ] Vista de consumos
- [ ] Vista de herramientas

#### Fase 7: Formularios de Acción (Días 16-20)
- [ ] Modal agregar actividad
- [ ] Modal agregar consumo
- [ ] Modal asignar herramienta
- [ ] Validaciones en tiempo real
- [ ] Cálculos automáticos

#### Fase 8: Completar y Firmar (Días 21-23)
- [ ] Wizard de completar reporte
- [ ] Canvas de firma digital
- [ ] Guardar firma como base64
- [ ] Validaciones pre-completar

#### Fase 9: Aprobar/Rechazar (Días 24-26)
- [ ] Botones de acción según permisos
- [ ] Modal de rechazo con motivo
- [ ] Modal de confirmación de aprobación
- [ ] Actualización de estados

#### Fase 10: Testing y Pulido (Días 27-31)
- [ ] Testing unitario de componentes
- [ ] Testing de integración
- [ ] Testing de permisos
- [ ] Pruebas de responsividad
- [ ] Ajustes de UX
- [ ] Optimización de performance

### 13.6 Contacto y Soporte

Para cualquier duda o aclaración sobre esta especificación:

📧 **Email**: tu-email@empresa.com  
📱 **Slack**: #drilling-reports-dev  
📅 **Reuniones**: Martes y Jueves 10:00 AM

---

## 🎯 CONCLUSIÓN

Este documento proporciona **TODA** la información necesaria para que el equipo de frontend implemente el módulo de Reportes de Perforación sin ambigüedades. 

**Puntos Clave**:
- ✅ API completamente documentada con ejemplos
- ✅ Flujos de trabajo detallados paso a paso
- ✅ Validaciones específicas para cada campo
- ✅ UI/UX con especificaciones visuales
- ✅ Casos de uso con flujos principales y alternativos
- ✅ Criterios de aceptación claros
- ✅ Estimación de esfuerzo realista

**El módulo está listo para ser implementado.** 🚀

---

*Documento Generado: 2025-10-15*  
*Versión: 1.0*  
*Aprobado por: Backend Team*


