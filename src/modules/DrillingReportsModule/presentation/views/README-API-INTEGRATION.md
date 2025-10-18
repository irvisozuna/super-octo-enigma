# ProjectDetail - API Integration Guide

## ✅ Implementación Completada

Se ha completado la integración con todos los endpoints del backend para el módulo de Proyectos de Perforación.

## 📡 Endpoints Integrados

### Status Management ✅
```typescript
// Start project
DrillingReportApiService.startProject(projectId, {
  start_date: '2025-01-15',
  notes: 'Inicio de operaciones'
})

// Complete project
DrillingReportApiService.completeProject(projectId, {
  completion_date: '2025-03-20',
  final_cost: 1450000.00,
  completion_notes: 'Proyecto completado exitosamente'
})

// Suspend project
DrillingReportApiService.suspendProject(projectId, {
  suspension_date: '2025-02-10',
  reason: 'Condiciones climáticas adversas',
  expected_resume_date: '2025-02-20'
})

// Cancel project
DrillingReportApiService.cancelProject(projectId, {
  cancellation_date: '2025-02-15',
  reason: 'Recorte presupuestario'
})

// Resume project
DrillingReportApiService.resumeProject(projectId, {
  resume_date: '2025-02-22',
  notes: 'Condiciones normalizadas'
})
```

### Personnel Management ✅
```typescript
// Assign personnel
DrillingReportApiService.assignPersonnel(projectId, {
  employee_id: 'uuid',
  role: 'drilling_engineer',
  assignment_date: '2025-01-15',
  hourly_rate: 350.00,
  notes: 'Ingeniero principal'
})

// Remove personnel
DrillingReportApiService.removePersonnel(projectId, employeeId)

// Get project personnel (IMPLEMENTED IN ProjectDetail.vue)
DrillingReportApiService.getProjectPersonnel(projectId, {
  role: 'drilling_engineer', // optional
  active: true // optional
})
```

**Roles disponibles:**
- `drilling_engineer` - Ingeniero de Perforación
- `geologist` - Geólogo
- `supervisor` - Supervisor
- `technician` - Técnico
- `operator` - Operador
- `safety_officer` - Oficial de Seguridad

### Cost Management ✅
```typescript
// Add cost
DrillingReportApiService.addProjectCost(projectId, {
  cost_type: 'equipment', // equipment, labor, materials, services, transportation, other
  category: 'rental',
  description: 'Renta de equipo',
  amount: 45000.00,
  date: '2025-01-20',
  vendor: 'Equipos SA',
  reference_number: 'INV-2025-0045',
  notes: 'Renta mensual'
})

// Get project costs
DrillingReportApiService.getProjectCosts(projectId, {
  cost_type: 'equipment', // optional
  category: 'rental', // optional
  date_from: '2025-01-01', // optional
  date_to: '2025-01-31', // optional
  per_page: 15, // optional
  page: 1 // optional
})

// Update budget
DrillingReportApiService.updateProjectBudget(projectId, {
  budget_amount: 1750000.00,
  reason: 'Ampliación de presupuesto',
  effective_date: '2025-02-01'
})
```

### Wells Management ✅
```typescript
// Add well to project
DrillingReportApiService.addWellToProject(projectId, {
  well_id: 'uuid',
  assignment_date: '2025-01-16',
  planned_start_date: '2025-01-20',
  planned_depth: 3500.00,
  notes: 'Pozo prioritario'
})

// Remove well from project
DrillingReportApiService.removeWellFromProject(projectId, wellId)

// Get project wells (IMPLEMENTED IN ProjectDetail.vue)
DrillingReportApiService.getWellsByProject(projectId, {
  status: 'drilling', // optional
  include_details: true // optional
})
```

### History ✅
```typescript
// Get status history
DrillingReportApiService.getProjectStatusHistory(projectId, {
  date_from: '2025-01-01', // optional
  date_to: '2025-03-31', // optional
  per_page: 20, // optional
  page: 1 // optional
})
```

## 🏗️ Estructura del Código

### API Service Layer
Ubicación: `src/modules/DrillingReportsModule/infrastructure/api/services/DrillingReportApiService.ts`

**Métodos agregados:**
- ✅ `startProject(id, data)`
- ✅ `completeProject(id, data)`
- ✅ `suspendProject(id, data)`
- ✅ `cancelProject(id, data)`
- ✅ `resumeProject(id, data)`
- ✅ `assignPersonnel(projectId, data)`
- ✅ `removePersonnel(projectId, employeeId)`
- ✅ `getProjectPersonnel(projectId, params)`
- ✅ `addProjectCost(projectId, data)`
- ✅ `getProjectCosts(projectId, params)`
- ✅ `updateProjectBudget(projectId, data)`
- ✅ `addWellToProject(projectId, data)`
- ✅ `removeWellFromProject(projectId, wellId)`
- ✅ `getWellsByProject(projectId, params)`
- ✅ `getProjectStatusHistory(projectId, params)`

### Store Layer

#### wellsStore ✅
Ubicación: `src/modules/DrillingReportsModule/presentation/stores/wellsStore.ts`

**Método implementado:**
```typescript
await wellsStore.fetchWellsByProject(projectId)
```

Devuelve: `{ data: Well[], summary: {...} }`

#### documentsStore ✅
Ubicación: `src/modules/DrillingReportsModule/presentation/stores/documentsStore.ts`

**Métodos implementados:**
```typescript
await documentsStore.fetchDocumentsByEntity('project', projectId)
await documentsStore.uploadDocument(data)
await documentsStore.deleteDocument(documentId)
```

### View Layer

#### ProjectDetail.vue ✅
**Flujo de carga de datos:**

1. **onMounted**: Carga proyecto y datos relacionados
2. **loadWellData()**: Carga pozo del proyecto (1:1)
3. **loadPersonnel()**: Carga personal asignado (conectado a API real)
4. **loadDocuments()**: Carga documentos del proyecto

**Datos cargados desde API:**
```typescript
// Project data
project.value = await projectsStore.fetchProject(projectId)

// Well data (first well of project)
const response = await wellsStore.fetchWellsByProject(projectId)
currentWell.value = wells[0]

// Personnel data (REAL API DATA)
const response = await DrillingReportApiService.getProjectPersonnel(projectId, { active: true })
projectPersonnel.value = response.data.map(p => ({
  id: p.employee.id,
  name: p.employee.full_name,
  position: p.role
}))

// Find project manager
projectManager.value = personnel.find(p => p.role === 'drilling_engineer')

// Documents data
projectDocuments.value = await documentsStore.fetchDocumentsByEntity('project', projectId)
```

## 🎯 Próximos Pasos Recomendados

### 1. Agregar Botones de Acción de Estado

En el header del ProjectDetail, agregar botones para cambiar el estado:

```vue
<VBtn
  v-if="project?.status === 'planned'"
  color="success"
  prepend-icon="tabler-player-play"
  @click="handleStartProject"
>
  Iniciar Proyecto
</VBtn>

<VBtn
  v-if="project?.status === 'in_progress'"
  color="warning"
  prepend-icon="tabler-pause"
  @click="handleSuspendProject"
>
  Suspender
</VBtn>

<VBtn
  v-if="project?.status === 'suspended'"
  color="success"
  prepend-icon="tabler-player-play"
  @click="handleResumeProject"
>
  Reanudar
</VBtn>

<VBtn
  v-if="project?.status === 'in_progress'"
  color="success"
  prepend-icon="tabler-check"
  @click="handleCompleteProject"
>
  Completar
</VBtn>
```

**Handlers:**
```typescript
const handleStartProject = async () => {
  try {
    await DrillingReportApiService.startProject(projectId.value, {
      start_date: new Date().toISOString().split('T')[0],
      notes: 'Inicio de operaciones'
    })
    await loadProject()
  } catch (error) {
    console.error('Error starting project:', error)
  }
}

const handleCompleteProject = async () => {
  try {
    await DrillingReportApiService.completeProject(projectId.value, {
      completion_date: new Date().toISOString().split('T')[0],
      completion_notes: 'Proyecto completado exitosamente'
    })
    await loadProject()
  } catch (error) {
    console.error('Error completing project:', error)
  }
}

const handleSuspendProject = async () => {
  try {
    await DrillingReportApiService.suspendProject(projectId.value, {
      suspension_date: new Date().toISOString().split('T')[0],
      reason: 'Suspensión temporal'
    })
    await loadProject()
  } catch (error) {
    console.error('Error suspending project:', error)
  }
}

const handleResumeProject = async () => {
  try {
    await DrillingReportApiService.resumeProject(projectId.value, {
      resume_date: new Date().toISOString().split('T')[0],
      notes: 'Reanudación de operaciones'
    })
    await loadProject()
  } catch (error) {
    console.error('Error resuming project:', error)
  }
}
```

### 2. Dialog para Asignar Personal

```vue
<VDialog v-model="showAssignPersonnelDialog" max-width="600">
  <VCard>
    <VCardTitle>Asignar Personal al Proyecto</VCardTitle>
    <VCardText>
      <VForm>
        <VSelect
          v-model="personnelForm.employee_id"
          label="Empleado"
          :items="availableEmployees"
          item-title="full_name"
          item-value="id"
        />
        <VSelect
          v-model="personnelForm.role"
          label="Rol"
          :items="personnelRoles"
        />
        <VTextField
          v-model="personnelForm.hourly_rate"
          label="Tarifa por Hora"
          type="number"
          prefix="$"
        />
        <VTextarea
          v-model="personnelForm.notes"
          label="Notas"
        />
      </VForm>
    </VCardText>
    <VCardActions>
      <VSpacer />
      <VBtn @click="showAssignPersonnelDialog = false">Cancelar</VBtn>
      <VBtn color="primary" @click="confirmAssignPersonnel">Asignar</VBtn>
    </VCardActions>
  </VCard>
</VDialog>
```

### 3. Tab de Historial (Status History)

```vue
<VTabsWindowItem value="history">
  <VCardText class="pa-6">
    <VTimeline side="end">
      <VTimelineItem
        v-for="item in statusHistory"
        :key="item.id"
        :dot-color="getStatusColor(item.to_status)"
        size="small"
      >
        <template #opposite>
          <span class="text-caption">{{ formatDate(item.change_date) }}</span>
        </template>
        <div>
          <h6 class="text-h6 mb-1">
            {{ getStatusLabel(item.to_status) }}
          </h6>
          <p class="text-body-2 mb-2">{{ item.reason }}</p>
          <p class="text-caption text-medium-emphasis">
            Por: {{ item.changed_by.name }}
          </p>
        </div>
      </VTimelineItem>
    </VTimeline>
  </VCardText>
</VTabsWindowItem>
```

**Load history:**
```typescript
const loadStatusHistory = async () => {
  try {
    const response = await DrillingReportApiService.getProjectStatusHistory(projectId.value)
    statusHistory.value = response.data
  } catch (error) {
    console.error('Error loading status history:', error)
  }
}
```

### 4. Tab de Costos Detallado

```vue
<VTabsWindowItem value="budget">
  <VCardText class="pa-6">
    <!-- Summary Cards -->
    <VRow class="mb-6">
      <VCol cols="12" md="3">
        <VCard variant="outlined">
          <VCardText>
            <p class="text-caption text-medium-emphasis">Total Gastado</p>
            <h4 class="text-h4">{{ formatCurrency(totalCosts) }}</h4>
          </VCardText>
        </VCard>
      </VCol>
      <!-- More summary cards -->
    </VRow>

    <!-- Costs Table -->
    <VDataTable
      :items="projectCosts"
      :headers="costHeaders"
      :loading="loadingCosts"
    >
      <template #top>
        <VToolbar flat>
          <VToolbarTitle>Detalle de Costos</VToolbarTitle>
          <VSpacer />
          <VBtn color="primary" prepend-icon="tabler-plus" @click="handleAddCost">
            Agregar Costo
          </VBtn>
        </VToolbar>
      </template>
    </VDataTable>
  </VCardText>
</VTabsWindowItem>
```

### 5. Dialog para Agregar Costos

```typescript
const handleAddCost = async () => {
  try {
    await DrillingReportApiService.addProjectCost(projectId.value, {
      cost_type: costForm.type,
      category: costForm.category,
      description: costForm.description,
      amount: costForm.amount,
      date: costForm.date,
      vendor: costForm.vendor,
      reference_number: costForm.referenceNumber,
      notes: costForm.notes
    })
    await loadCosts()
    showCostDialog.value = false
  } catch (error) {
    console.error('Error adding cost:', error)
  }
}
```

## 📊 Estructura de Respuestas

### Personnel Response
```typescript
{
  data: [
    {
      id: string,
      project_id: string,
      employee: {
        id: string,
        full_name: string,
        employee_number: string,
        position: string,
        email: string,
        phone: string
      },
      role: string,
      assignment_date: string,
      hourly_rate: number,
      total_hours: number,
      total_cost: number,
      is_active: boolean
    }
  ],
  meta: {
    total: number,
    total_cost: number,
    active_count: number
  }
}
```

### Wells Response
```typescript
{
  data: [
    {
      id: string,
      project_id: string,
      well: {
        id: string,
        well_number: string,
        name: string,
        status: string,
        well_type: string,
        location: {
          latitude: number,
          longitude: number,
          field: string
        }
      },
      planned_depth: number,
      actual_depth: number
    }
  ],
  summary: {
    total_wells: number,
    by_status: object,
    total_planned_depth: number,
    total_actual_depth: number
  }
}
```

### Costs Response
```typescript
{
  data: [
    {
      id: string,
      cost_type: string,
      category: string,
      description: string,
      amount: number,
      date: string,
      vendor: string,
      reference_number: string
    }
  ],
  summary: {
    total_costs: number,
    by_type: object,
    budget_remaining: number,
    budget_used_percentage: number
  }
}
```

## ✅ Testing

Para probar la integración completa:

```bash
# 1. Asegúrate de que el backend esté corriendo
# 2. Navega a un proyecto
http://localhost:5173/drilling/projects/{uuid}

# 3. Verifica en Network tab que se hacen estos requests:
GET /api/drilling/projects/{id}
GET /api/drilling/projects/{id}/wells
GET /api/drilling/projects/{id}/personnel
GET /api/drilling/projects/{id}/documents (si tienes documentsStore configurado)

# 4. Deberías ver:
# - Información del pozo (si hay uno asignado)
# - Personal asignado con nombres reales
# - Documentos del proyecto
# - Overview tab con estadísticas
```

## 🚀 Ventajas de esta Implementación

1. ✅ **Separation of Concerns**: API Service → Store → View
2. ✅ **Type Safety**: TypeScript en toda la cadena
3. ✅ **Error Handling**: Try-catch en todos los niveles
4. ✅ **Loading States**: Indicadores de carga apropiados
5. ✅ **Reusabilidad**: Métodos API reutilizables en todo el módulo
6. ✅ **Testeable**: Fácil de mockear y testear
7. ✅ **Escalable**: Fácil agregar nuevos endpoints
8. ✅ **Mantenible**: Código organizado y documentado

## 📝 Notas Importantes

1. **Authentication**: Todos los endpoints requieren token Bearer (Sanctum)
2. **Multi-tenancy**: Header `X-Company-Id` es requerido
3. **Dates**: Formato ISO 8601 (YYYY-MM-DD)
4. **UUIDs**: Formato estándar para IDs
5. **Pagination**: Soportada en todos los listados
6. **Filters**: Query parameters opcionales en GETs

## 🔗 Referencias

- [Backend API Documentation](../../../../../backend/postman/drilling-endpoints-additional.md)
- [ProjectDetail README](./README-ProjectDetail.md)
- [DrillingReportApiService](../../../infrastructure/api/services/DrillingReportApiService.ts)
- [wellsStore](../../stores/wellsStore.ts)
- [documentsStore](../../stores/documentsStore.ts)
