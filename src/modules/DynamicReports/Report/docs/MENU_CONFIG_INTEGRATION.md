# 🎯 Integración de Configuración de Menú en ReportWizard

## 📋 Descripción

El componente `ReportMenuConfig` se integra como el **Paso 7** del wizard de reportes, permitiendo configurar si el reporte aparecerá en el menú principal y cómo se mostrará.

## 🏗️ Flujo de Integración

### 1. **Ubicación en el Wizard**
```
Paso 1: Información Básica
Paso 2: Selección de Campos  
Paso 3: Configuración de Filtros
Paso 4: Ordenamiento
Paso 5: Opciones de Exportación
Paso 6: Configuración Avanzada
🆕 Paso 7: Configuración de Menú ← NUEVO
Paso 8: Resumen
```

### 2. **Inicialización Automática**
```typescript
// En ReportWizard.vue
if (!wizardStore.wizardData.menu_config) {
  wizardStore.wizardData.menu_config = {
    show_in_menu: false,
    menu_title: '',
    menu_icon: 'tabler-chart-bar',
    menu_category: 'Reportes',
    menu_order: 0,
    menu_permissions: {
      action: 'read',
      subject: 'Report'
    }
  }
}
```

### 3. **Integración en el Template**
```vue
<!-- Paso 7: Configuración de Menú -->
<VWindowItem :value="6">
  <ReportMenuConfig
    v-if="isStoreReady"
    v-model="wizardStore.wizardData.menu_config"
    :report-name="wizardStore.wizardData.basicInfo.name"
    @validate="(isValid: boolean) => handleStepValidation(6, isValid)"
  />
</VWindowItem>
```

## 🎨 Experiencia de Usuario

### **Paso 7: Configuración de Menú**

El usuario verá una interfaz intuitiva con:

1. **Switch Principal**: "Mostrar en menú principal"
2. **Configuración Básica** (solo si está habilitado):
   - Título del menú (con placeholder del nombre del reporte)
   - Selector de iconos con preview visual
   - Categoría del menú
   - Orden en la categoría

3. **Configuración de Permisos**:
   - Acción (read, manage, etc.)
   - Sujeto (Report, Analytics, etc.)

4. **Badge Opcional**:
   - Contenido del badge
   - Color del badge

### **Validación Inteligente**
- Si `show_in_menu` es `false`: Paso siempre válido
- Si `show_in_menu` es `true`: Valida campos requeridos
- Emite evento `validate` automáticamente

## 🔄 Flujo de Datos

### **1. Entrada al Paso**
```typescript
// Los datos vienen del store
wizardStore.wizardData.menu_config = {
  show_in_menu: false,
  menu_title: 'Mi Reporte',
  menu_icon: 'tabler-chart-bar',
  // ...
}
```

### **2. Configuración del Usuario**
```typescript
// El usuario configura
menu_config = {
  show_in_menu: true,
  menu_title: 'Ventas Mensuales',
  menu_icon: 'tabler-chart-pie',
  menu_category: 'Ventas',
  menu_order: 1,
  menu_permissions: {
    action: 'read',
    subject: 'Sales'
  }
}
```

### **3. Salida al Store**
```typescript
// Se guarda en el wizard store
wizardStore.wizardData.menu_config = menu_config
```

### **4. Envío al Backend**
```typescript
// Al hacer submit, se incluye en el payload
const reportData = {
  name: 'Mi Reporte',
  // ... otros campos
  menu_config: {
    show_in_menu: true,
    menu_title: 'Ventas Mensuales',
    // ...
  }
}
```

## 🎯 Casos de Uso

### **Caso 1: Reporte Interno**
```typescript
{
  show_in_menu: false
  // No aparece en el menú
}
```

### **Caso 2: Reporte Público**
```typescript
{
  show_in_menu: true,
  menu_title: 'Dashboard General',
  menu_icon: 'tabler-dashboard',
  menu_category: 'Reportes',
  menu_permissions: {
    action: 'read',
    subject: 'Dashboard'
  }
}
```

### **Caso 3: Reporte con Permisos Específicos**
```typescript
{
  show_in_menu: true,
  menu_title: 'Ventas por Vendedor',
  menu_icon: 'tabler-users',
  menu_category: 'Ventas',
  menu_permissions: {
    action: 'read',
    subject: 'Sales'
  }
}
```

### **Caso 4: Reporte con Badge**
```typescript
{
  show_in_menu: true,
  menu_title: 'Alertas del Sistema',
  menu_icon: 'tabler-alert-circle',
  menu_category: 'Sistema',
  menu_badge: {
    content: '3',
    class: 'bg-warning'
  }
}
```

## 🔧 Configuración Técnica

### **Props del Componente**
```typescript
interface Props {
  modelValue: MenuConfig
  reportName?: string
}
```

### **Events del Componente**
```typescript
interface Emits {
  (e: 'update:modelValue', value: MenuConfig): void
  (e: 'validate', value: boolean): void
}
```

### **Validación Automática**
```typescript
const validateMenuConfig = () => {
  if (!menuConfig.value.show_in_menu) {
    emit('validate', true)
    return
  }

  const isValid = !!(
    menuConfig.value.menu_title?.trim() &&
    menuConfig.value.menu_icon &&
    menuConfig.value.menu_category &&
    menuConfig.value.menu_permissions?.action &&
    menuConfig.value.menu_permissions?.subject
  )

  emit('validate', isValid)
}
```

## 🎨 UI/UX Features

### **1. Interfaz Condicional**
- Campos adicionales solo aparecen si `show_in_menu` es `true`
- Validación en tiempo real
- Feedback visual inmediato

### **2. Selector de Iconos**
- Preview visual de cada icono
- Categorización por tipo (gráficos, datos, negocio)
- Búsqueda intuitiva

### **3. Configuración de Permisos**
- Dropdowns predefinidos para acciones y sujetos
- Explicación clara de cada permiso
- Validación de permisos válidos

### **4. Badge Opcional**
- Configuración de contenido y color
- Preview del badge
- Validación de formato

## 🚀 Beneficios de la Integración

### **Para el Usuario:**
- ✅ **Configuración visual** sin necesidad de código
- ✅ **Preview inmediato** de la configuración
- ✅ **Validación en tiempo real** de campos requeridos
- ✅ **Integración fluida** con el flujo del wizard

### **Para el Desarrollador:**
- ✅ **Reutilización** del componente en otros lugares
- ✅ **Validación automática** con el sistema de permisos
- ✅ **Integración limpia** con el store del wizard
- ✅ **TypeScript** con tipos completos

### **Para el Sistema:**
- ✅ **Generación automática** de menús dinámicos
- ✅ **Control granular** de permisos por reporte
- ✅ **Actualización automática** de navegación
- ✅ **Escalabilidad** para futuras funcionalidades

## 🔮 Próximos Pasos

1. **Integrar con el plugin** de menús dinámicos
2. **Agregar preview** del menú en tiempo real
3. **Implementar templates** de configuración
4. **Agregar validación** de permisos con CASL
5. **Crear analytics** de uso de reportes 
