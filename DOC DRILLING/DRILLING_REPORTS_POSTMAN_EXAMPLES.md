# 📮 POSTMAN COLLECTION - DRILLING REPORTS API

**Versión**: 1.0  
**Fecha**: 2025-10-15  
**Base URL**: `{{base_url}}/api/drilling/reports`

---

## 📌 VARIABLES DE ENTORNO (Environment)

Crea un Environment en Postman con estas variables:

```json
{
  "base_url": "https://api.tudominio.com",
  "auth_token": "tu-bearer-token-aqui",
  "company_id": "uuid-de-tu-empresa",
  "project_id": "uuid-de-proyecto-de-prueba",
  "well_id": "uuid-de-pozo-de-prueba",
  "report_id": "se-auto-genera-despues-de-crear",
  "tool_id": "uuid-de-herramienta-de-prueba"
}
```

---

## 🔧 HEADERS GLOBALES

Configura estos headers en la Collection para que se apliquen a todas las requests:

```
Authorization: Bearer {{auth_token}}
X-Company-Id: {{company_id}}
Content-Type: application/json
Accept: application/json
```

---

## 📋 REQUEST 1: Listar Reportes

**Método**: `GET`  
**URL**: `{{base_url}}/api/drilling/reports`

### Query Parameters:
```
page: 1
per_page: 20
sort_by: report_date
sort_order: desc
project_id: {{project_id}}
status: draft
```

### Response esperado (200 OK):
```json
{
  "data": [
    {
      "id": "9d4f8c2a-...",
      "report_number": "REP-2025-0042",
      "report_date": "2025-10-15",
      "shift": "day",
      "status": "draft",
      "project": {
        "id": "uuid",
        "name": "Pozo Comunidad San Juan"
      },
      "well": {
        "id": "uuid",
        "name": "Pozo #1"
      },
      "totals": {
        "hours_worked": 8.5,
        "meters_drilled": 45.3
      }
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "total": 95
  }
}
```

### Tests (Postman):
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has data array", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data).to.be.an('array');
});

pm.test("Response has pagination", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.meta).to.have.property('current_page');
    pm.expect(jsonData.meta).to.have.property('total');
});
```

---

## 📝 REQUEST 2: Crear Reporte

**Método**: `POST`  
**URL**: `{{base_url}}/api/drilling/reports`

### Body (raw JSON):
```json
{
  "project_id": "{{project_id}}",
  "well_id": "{{well_id}}",
  "report_date": "2025-10-15",
  "shift": "day",
  "equipment_id": null,
  "operator_day_id": "uuid-operador",
  "helper1_day_id": "uuid-ayudante1",
  "helper2_day_id": null,
  "horometer_start_day": 1250.5,
  "rpm_pull_down": 45.0,
  "rpm_rotation": 120.0,
  "observations": "Condiciones climáticas favorables"
}
```

### Response esperado (201 Created):
```json
{
  "data": {
    "id": "9d4f8c2a-...",
    "report_number": "REP-2025-0042",
    "report_date": "2025-10-15",
    "shift": "day",
    "status": "draft",
    "project": { /* ... */ },
    "well": { /* ... */ }
  },
  "message": "Reporte creado exitosamente"
}
```

### Tests (Postman):
```javascript
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Report created with draft status", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.status).to.eql("draft");
});

pm.test("Report number generated", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.report_number).to.match(/^REP-\d{4}-\d{4}$/);
});

// Guardar report_id para siguientes requests
pm.environment.set("report_id", pm.response.json().data.id);
```

---

## 👁️ REQUEST 3: Ver Detalle de Reporte

**Método**: `GET`  
**URL**: `{{base_url}}/api/drilling/reports/{{report_id}}`

### Response esperado (200 OK):
```json
{
  "data": {
    "id": "{{report_id}}",
    "report_number": "REP-2025-0042",
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
      "target_depth_meters": 150.0
    },
    "activities": [],
    "consumptions": [],
    "tool_assignments": [],
    "totals": {
      "hours_worked": 0,
      "meters_drilled": 0
    }
  }
}
```

### Tests:
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Report has correct ID", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.id).to.eql(pm.environment.get("report_id"));
});
```

---

## ⚙️ REQUEST 4: Agregar Actividad

**Método**: `POST`  
**URL**: `{{base_url}}/api/drilling/reports/{{report_id}}/add-activity`

### Body (raw JSON):
```json
{
  "activity_type": "drilling",
  "shift": "day",
  "hours": 6.5,
  "start_time": "08:00:00",
  "end_time": "14:30:00",
  "description": "Perforación continua en formación rocosa"
}
```

### Response esperado (200 OK):
```json
{
  "message": "Actividad agregada exitosamente",
  "data": {
    "id": "uuid-actividad",
    "activity_type": "drilling",
    "shift": "day",
    "hours": 6.5,
    "start_time": "08:00:00",
    "end_time": "14:30:00",
    "description": "Perforación continua en formación rocosa"
  }
}
```

### Tests:
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Activity added successfully", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.activity_type).to.eql("drilling");
    pm.expect(jsonData.data.hours).to.eql(6.5);
});

// Guardar activity_id si necesitas eliminarlo después
pm.environment.set("activity_id", pm.response.json().data.id);
```

---

## 📦 REQUEST 5: Registrar Consumo

**Método**: `POST`  
**URL**: `{{base_url}}/api/drilling/reports/{{report_id}}/record-consumption`

### Body (raw JSON):
```json
{
  "consumable_type": "bentonite",
  "shift": "day",
  "quantity": 25.0,
  "unit": "kg"
}
```

### Response esperado (200 OK):
```json
{
  "message": "Consumo registrado exitosamente",
  "data": {
    "id": "uuid-consumo",
    "consumable_type": "bentonite",
    "shift": "day",
    "quantity": 25.0,
    "unit": "kg"
  }
}
```

### Tests:
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Consumption recorded", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.quantity).to.eql(25.0);
    pm.expect(jsonData.data.unit).to.eql("kg");
});
```

---

## 🔧 REQUEST 6: Asignar Herramienta

**Método**: `POST`  
**URL**: `{{base_url}}/api/drilling/reports/{{report_id}}/assign-tool`

### Body (raw JSON):
```json
{
  "tool_id": "{{tool_id}}",
  "shift": "day",
  "tool_category": "drill_bit",
  "start_depth_meters": 50.0,
  "end_depth_meters": 95.3,
  "wear_pattern": "uniform",
  "matrix": "good_condition"
}
```

### Response esperado (200 OK):
```json
{
  "message": "Herramienta asignada exitosamente",
  "data": {
    "id": "uuid",
    "tool_id": "{{tool_id}}",
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

### Tests:
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Meters calculated correctly", function () {
    var jsonData = pm.response.json();
    var meters = jsonData.data.meters_drilled;
    pm.expect(meters).to.be.closeTo(45.3, 0.1);
});

pm.test("Tool capacity updated", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.tool).to.have.property('remaining_capacity_meters');
});
```

---

## ✅ REQUEST 7: Completar Reporte

**Método**: `POST`  
**URL**: `{{base_url}}/api/drilling/reports/{{report_id}}/complete`

### Body (raw JSON):
```json
{
  "horometer_end_day": 1259.0,
  "horometer_end_night": null
}
```

### Response esperado (200 OK):
```json
{
  "message": "Reporte completado exitosamente",
  "data": {
    "id": "{{report_id}}",
    "status": "completed",
    "total_hours_worked": 8.5,
    "total_meters_drilled": 45.3
  }
}
```

### Tests:
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Report status changed to completed", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.status).to.eql("completed");
});

pm.test("Totals calculated", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.total_hours_worked).to.be.above(0);
    pm.expect(jsonData.data.total_meters_drilled).to.be.above(0);
});
```

---

## ✍️ REQUEST 8: Firmar Reporte

**Método**: `POST`  
**URL**: `{{base_url}}/api/drilling/reports/{{report_id}}/sign`

### Body (raw JSON):
```json
{
  "signature_type": "operator",
  "signature_method": "digital",
  "signature_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA..."
}
```

### Response esperado (200 OK):
```json
{
  "message": "Firma guardada exitosamente",
  "data": {
    "id": "uuid-firma",
    "signature_type": "operator",
    "signatory_name": "Juan Pérez",
    "signed_at": "2025-10-15T16:30:00Z"
  }
}
```

### Tests:
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Signature saved", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.signature_type).to.eql("operator");
    pm.expect(jsonData.data).to.have.property('signed_at');
});
```

---

## ✔️ REQUEST 9: Aprobar Reporte (Supervisor)

**Método**: `POST`  
**URL**: `{{base_url}}/api/drilling/reports/{{report_id}}/approve`

### Body (vacío):
```json
{}
```

### Response esperado (200 OK):
```json
{
  "message": "Reporte aprobado exitosamente",
  "data": {
    "id": "{{report_id}}",
    "status": "approved",
    "approved_by": {
      "id": "uuid",
      "name": "Carlos Supervisor"
    },
    "approved_at": "2025-10-15T18:00:00Z"
  }
}
```

### Tests:
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Report approved", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.status).to.eql("approved");
    pm.expect(jsonData.data).to.have.property('approved_at');
});
```

---

## ❌ REQUEST 10: Rechazar Reporte

**Método**: `POST`  
**URL**: `{{base_url}}/api/drilling/reports/{{report_id}}/reject`

### Body (raw JSON):
```json
{
  "reason": "Faltan detalles en las actividades de mantenimiento. Por favor agregar descripción más específica."
}
```

### Response esperado (200 OK):
```json
{
  "message": "Reporte rechazado",
  "data": {
    "id": "{{report_id}}",
    "status": "rejected",
    "rejected_by": {
      "id": "uuid",
      "name": "Carlos Supervisor"
    },
    "rejected_at": "2025-10-15T18:00:00Z",
    "rejection_reason": "Faltan detalles en las actividades de mantenimiento..."
  }
}
```

### Tests:
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Report rejected", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.status).to.eql("rejected");
    pm.expect(jsonData.data.rejection_reason).to.not.be.empty;
});
```

---

## 🗑️ REQUEST 11: Eliminar Reporte (solo draft)

**Método**: `DELETE`  
**URL**: `{{base_url}}/api/drilling/reports/{{report_id}}`

### Body: (ninguno)

### Response esperado (200 OK):
```json
{
  "message": "Reporte eliminado exitosamente"
}
```

### Tests:
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Report deleted", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.message).to.include("eliminado");
});
```

---

## 🔄 FLUJO COMPLETO (Collection Runner)

Puedes ejecutar estos requests en orden para simular el flujo completo:

### Orden de Ejecución:

1. ✅ **Crear Reporte** (POST `/reports`)
   - Guarda `report_id` en environment

2. ✅ **Ver Detalle** (GET `/reports/{id}`)
   - Verifica que se creó correctamente

3. ✅ **Agregar Actividad #1** (POST `/{id}/add-activity`)
   - Perforación 6.5h

4. ✅ **Agregar Actividad #2** (POST `/{id}/add-activity`)
   - Mantenimiento 1.0h

5. ✅ **Registrar Consumo** (POST `/{id}/record-consumption`)
   - Bentonita 25kg

6. ✅ **Asignar Herramienta** (POST `/{id}/assign-tool`)
   - Broca 50m-95.3m

7. ✅ **Ver Detalle Actualizado** (GET `/reports/{id}`)
   - Verificar que todo se guardó

8. ✅ **Completar Reporte** (POST `/{id}/complete`)
   - Con horómetro final

9. ✅ **Firmar como Operador** (POST `/{id}/sign`)
   - signature_type: operator

10. ✅ **Firmar como Supervisor** (POST `/{id}/sign`)
    - signature_type: supervisor

11. ✅ **Aprobar Reporte** (POST `/{id}/approve`)
    - Cambia status a approved

12. ✅ **Ver Detalle Final** (GET `/reports/{id}`)
    - Verificar estado final

---

## 🧪 CASOS DE ERROR COMUNES

### Error 422: Validación Falla

**Request**:
```json
POST /api/drilling/reports
{
  "project_id": "uuid",
  "well_id": "",  // ❌ Vacío
  "report_date": "2026-01-01",  // ❌ Fecha futura
  "shift": "invalid"  // ❌ Valor inválido
}
```

**Response**:
```json
{
  "message": "Los datos proporcionados no son válidos",
  "errors": {
    "well_id": ["El pozo es requerido"],
    "report_date": ["La fecha no puede ser futura"],
    "shift": ["El turno seleccionado no es válido"]
  }
}
```

### Error 404: Reporte No Encontrado

**Request**:
```
GET /api/drilling/reports/uuid-inexistente
```

**Response**:
```json
{
  "message": "Reporte no encontrado",
  "error_code": "REPORT_NOT_FOUND"
}
```

### Error 403: Sin Permisos

**Request**:
```
POST /api/drilling/reports/{{report_id}}/approve
```

**Response**:
```json
{
  "message": "No tienes permiso para aprobar reportes",
  "error_code": "PERMISSION_DENIED"
}
```

### Error 400: Acción No Permitida

**Request**:
```
POST /api/drilling/reports/{{report_id}}/complete
(pero el reporte ya está completed)
```

**Response**:
```json
{
  "message": "El reporte ya está completado",
  "error_code": "INVALID_STATUS_TRANSITION"
}
```

---

## 📦 IMPORTAR A POSTMAN

### Opción 1: Crear Collection Manualmente
1. Crea nueva Collection: "Drilling Reports API"
2. Crea Environment con las variables
3. Copia cada request de este documento

### Opción 2: Usar Pre-request Script

Agrega este script a nivel de Collection para auto-configurar headers:

```javascript
// Pre-request Script
pm.request.headers.add({
    key: 'Authorization',
    value: 'Bearer ' + pm.environment.get('auth_token')
});

pm.request.headers.add({
    key: 'X-Company-Id',
    value: pm.environment.get('company_id')
});

pm.request.headers.add({
    key: 'Content-Type',
    value: 'application/json'
});

pm.request.headers.add({
    key: 'Accept',
    value: 'application/json'
});
```

---

## 🎯 TIPS PARA TESTING

### 1. Variables Dinámicas
```javascript
// En Tests tab de una request
pm.test("Save IDs for next requests", function() {
    var response = pm.response.json();
    pm.environment.set("report_id", response.data.id);
    pm.environment.set("report_number", response.data.report_number);
});
```

### 2. Verificar Tipos de Datos
```javascript
pm.test("Validate data types", function() {
    var data = pm.response.json().data;
    pm.expect(data.report_number).to.be.a('string');
    pm.expect(data.totals.hours_worked).to.be.a('number');
    pm.expect(data.activities).to.be.an('array');
});
```

### 3. Verificar Cálculos
```javascript
pm.test("Meters calculated correctly", function() {
    var data = pm.response.json().data;
    var startDepth = 50.0;
    var endDepth = 95.3;
    var expectedMeters = endDepth - startDepth;
    pm.expect(data.meters_drilled).to.be.closeTo(expectedMeters, 0.1);
});
```

---

## ✅ CHECKLIST DE PRUEBAS

Usa este checklist para verificar que todo funciona:

- [ ] Puedo crear un reporte con datos válidos
- [ ] Las validaciones rechazan datos inválidos (fecha futura, etc.)
- [ ] Puedo ver el detalle del reporte creado
- [ ] Puedo agregar múltiples actividades
- [ ] Las horas se suman correctamente
- [ ] No puedo agregar más de 24h por turno
- [ ] Puedo registrar consumos
- [ ] Puedo asignar herramientas
- [ ] Los metros se calculan automáticamente
- [ ] Puedo completar el reporte
- [ ] Puedo firmar el reporte
- [ ] Como supervisor, puedo aprobar
- [ ] Como supervisor, puedo rechazar
- [ ] Los reportes rechazados se pueden editar
- [ ] Los reportes aprobados son read-only
- [ ] Los permisos se respetan correctamente

---

*Documento generado: 2025-10-15*  
*Versión: 1.0*  
*Para usar con Postman v10+*

