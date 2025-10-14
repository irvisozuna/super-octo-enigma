# ActionConfirmationDialog

Componente compartido y reutilizable para acciones críticas que requieren confirmación del usuario mediante una palabra aleatoria, además de capturar razón y notas opcionales.

## Características

- ✅ Confirmación mediante palabra aleatoria (previene acciones accidentales)
- ✅ Captura de razón (requerida por defecto)
- ✅ Captura de notas adicionales (opcional)
- ✅ Estilos pre-configurados por tipo de acción (suspend, terminate, reactivate, delete, custom)
- ✅ Completamente personalizable
- ✅ Manejo de loading states
- ✅ Validación en tiempo real

## Uso Básico

```vue
<script setup lang="ts">
import ActionConfirmationDialog from '@/components/shared/ActionConfirmationDialog.vue'
import { ref } from 'vue'

const showDialog = ref(false)
const loading = ref(false)

async function handleConfirm(data: { reason?: string, notes?: string }) {
  loading.value = true
  try {
    await someApiCall(data.reason, data.notes)
    showDialog.value = false
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <VBtn @click="showDialog = true">
    Suspender Empleado
  </VBtn>

  <ActionConfirmationDialog
    :visible="showDialog"
    title="Suspender Empleado"
    action-type="suspend"
    entity-name="Empleado"
    entity-info="Juan Pérez"
    :loading="loading"
    @close="showDialog = false"
    @confirm="handleConfirm"
  />
</template>
```

## Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `visible` | `boolean` | - | Controla la visibilidad del diálogo (requerido) |
| `title` | `string` | - | Título del diálogo (requerido) |
| `actionType` | `'suspend' \| 'terminate' \| 'reactivate' \| 'delete' \| 'custom'` | - | Tipo de acción que determina estilos y mensajes predeterminados (requerido) |
| `entityName` | `string` | - | Nombre de la entidad (ej: "Empleado", "Usuario") (requerido) |
| `entityInfo` | `string` | - | Información adicional de la entidad (ej: nombre completo) |
| `warningMessage` | `string` | Auto | Mensaje de advertencia personalizado |
| `confirmationWord` | `string` | Random | Palabra de confirmación personalizada (se genera aleatoria si no se proporciona) |
| `requireReason` | `boolean` | `true` | Si la razón es requerida |
| `requireNotes` | `boolean` | `false` | Si las notas son requeridas |
| `loading` | `boolean` | `false` | Estado de carga del botón de confirmación |
| `actionColor` | `string` | Auto | Color del botón de acción (auto según actionType) |
| `actionIcon` | `string` | Auto | Icono del botón de acción (auto según actionType) |
| `actionButtonText` | `string` | Auto | Texto del botón de acción (auto según actionType) |

## Eventos

| Evento | Payload | Descripción |
|--------|---------|-------------|
| `close` | - | Se emite cuando el usuario cierra el diálogo |
| `confirm` | `{ reason?: string, notes?: string }` | Se emite cuando el usuario confirma la acción |

## Tipos de Acción

### suspend (Suspender)
- **Color**: Warning (amarillo/naranja)
- **Icono**: `tabler-pause`
- **Mensaje**: "Esta acción cambiará el estado del empleado a SUSPENDIDO..."

### terminate (Terminar)
- **Color**: Error (rojo)
- **Icono**: `tabler-user-x`
- **Mensaje**: "Esta acción TERMINARÁ el contrato del empleado de forma permanente..."

### reactivate (Reactivar)
- **Color**: Success (verde)
- **Icono**: `tabler-player-play`
- **Mensaje**: "Esta acción cambiará el estado del empleado a ACTIVO nuevamente..."

### delete (Eliminar)
- **Color**: Error (rojo)
- **Icono**: `tabler-trash`
- **Mensaje**: "Esta acción no se puede deshacer y eliminará permanentemente..."

### custom (Personalizado)
- **Color**: Primary (azul)
- **Icono**: `tabler-check`
- **Mensaje**: "Esta acción quedará registrada en el historial..."

## Ejemplos

### Ejemplo 1: Suspender Empleado

```vue
<ActionConfirmationDialog
  :visible="showSuspendDialog"
  title="Suspender Empleado"
  action-type="suspend"
  entity-name="Empleado"
  :entity-info="employee.full_name"
  :loading="actionLoading"
  @close="showSuspendDialog = false"
  @confirm="handleSuspendConfirm"
/>
```

### Ejemplo 2: Terminar Contrato

```vue
<ActionConfirmationDialog
  :visible="showTerminateDialog"
  title="Terminar Contrato"
  action-type="terminate"
  entity-name="Empleado"
  :entity-info="employee.full_name"
  :loading="actionLoading"
  @close="showTerminateDialog = false"
  @confirm="handleTerminateConfirm"
/>
```

### Ejemplo 3: Acción Personalizada

```vue
<ActionConfirmationDialog
  :visible="showCustomDialog"
  title="Cambiar Departamento"
  action-type="custom"
  entity-name="Empleado"
  entity-info="María López"
  warning-message="Esta acción cambiará el departamento del empleado y notificará a los supervisores."
  confirmation-word="CAMBIAR"
  action-color="info"
  action-icon="tabler-building"
  action-button-text="Cambiar Departamento"
  :loading="loading"
  @close="showCustomDialog = false"
  @confirm="handleCustomConfirm"
>
  <template #additional-content>
    <VSelect
      v-model="newDepartment"
      :items="departments"
      label="Nuevo Departamento"
      variant="outlined"
      density="comfortable"
    />
  </template>
</ActionConfirmationDialog>
```

### Ejemplo 4: Sin Palabra de Confirmación

```vue
<ActionConfirmationDialog
  :visible="showDialog"
  title="Actualizar Información"
  action-type="custom"
  entity-name="Empleado"
  entity-info="Carlos Ruiz"
  confirmation-word=""
  :require-reason="false"
  :require-notes="true"
  @close="showDialog = false"
  @confirm="handleConfirm"
/>
```

## Slots

### entity-info
Personaliza cómo se muestra la información de la entidad:

```vue
<ActionConfirmationDialog ...>
  <template #entity-info>
    <div>
      <div class="font-weight-bold">{{ employee.full_name }}</div>
      <div class="text-caption">{{ employee.employee_code }}</div>
      <div class="text-caption">{{ employee.department }}</div>
    </div>
  </template>
</ActionConfirmationDialog>
```

### confirmation-text
Personaliza el texto de confirmación:

```vue
<ActionConfirmationDialog ...>
  <template #confirmation-text>
    a {{ entityName.toLowerCase() }} <strong>{{ employee.full_name }}</strong>
    y se notificará a todos los supervisores
  </template>
</ActionConfirmationDialog>
```

### additional-content
Agrega contenido adicional al formulario (campos extra, información, etc.):

```vue
<ActionConfirmationDialog ...>
  <template #additional-content>
    <VAlert type="info" class="mb-4">
      Esta acción enviará un email de notificación automáticamente.
    </VAlert>

    <VCheckbox
      v-model="sendNotification"
      label="Enviar notificación al empleado"
    />
  </template>
</ActionConfirmationDialog>
```

## Integración con Módulos DDD

El componente está diseñado para integrarse fácilmente con módulos que siguen Domain-Driven Design:

```typescript
// En el store (Pinia)
const suspendEmployee = async (id: string, reason?: string, notes?: string) => {
  loading.value = true
  try {
    const updated = await applicationService.suspendEmployee(id, reason, notes)
    // Actualizar estado...
    return updated
  } catch (err: any) {
    error.value = err.message
    throw err
  } finally {
    loading.value = false
  }
}

// En el Application Service
async suspendEmployee(id: string, reason?: string, notes?: string): Promise<EmployeeEntity> {
  try {
    const response = await this.employeeRepository.suspend(id, reason, notes)
    this.showSuccess('Empleado suspendido correctamente')
    return response.data
  } catch (error) {
    this.handleError('Error al suspender el empleado', error)
    throw error
  }
}

// En el Repository
async suspend(id: string, reason?: string, notes?: string): Promise<ApiResponse<EmployeeEntity>> {
  const response = await this.apiService.suspend(id, reason, notes)
  return {
    data: EmployeeMapper.apiDetailToDomain(response.data),
  }
}

// En el API Service
async suspend(id: string, reason?: string, notes?: string): Promise<{ data: EmployeeDetailDto }> {
  return await rawApi(`${this.baseUrl}/${id}/suspend`, {
    method: 'POST',
    body: { reason, notes },
  })
}
```

## Comparación con DeleteConfirmationDialog

| Característica | DeleteConfirmationDialog | ActionConfirmationDialog |
|---------------|-------------------------|-------------------------|
| Tipos de acción | Solo eliminación | Multiple (suspend, terminate, reactivate, delete, custom) |
| Captura de razón | ❌ | ✅ |
| Captura de notas | ❌ | ✅ |
| Palabra de confirmación | Fija | Aleatoria o personalizable |
| Estilos por tipo | ❌ | ✅ Auto según tipo |
| Contenido adicional | ❌ | ✅ Via slot |
| Reutilizable | Solo para delete | ✅ Para cualquier acción |

## Notas

- La palabra de confirmación se genera aleatoriamente de una lista predefinida si no se especifica
- Los campos de razón y notas tienen límites de caracteres (500 y 1000 respectivamente)
- El formulario valida en tiempo real y deshabilita el botón de confirmación si no es válido
- El componente resetea automáticamente todos los campos al cerrarse
- Compatible con temas claro y oscuro de Vuetify
