# 🎯 Guía de Menús Dinámicos para Reportes

## 📋 Descripción General

El sistema de **Menús Dinámicos** permite que los reportes se integren automáticamente en el menú principal de la aplicación, con control granular de permisos usando CASL.

## 🏗️ Arquitectura

### Componentes Principales

1. **Entidad Report** - Extendida con configuración de menú
2. **DynamicMenuService** - Servicio para generar menús dinámicos
3. **ReportMenuConfig** - Componente de configuración UI
4. **DynamicMenuPlugin** - Plugin de integración automática

## 🚀 Configuración Inicial

### 1. Inicializar el Plugin

```typescript
// En tu main.ts o donde inicialices la app
import { dynamicMenuPlugin } from '@/modules/DynamicReports/Report'

// Inicializar el plugin
await dynamicMenuPlugin.initialize()
```

### 2. Configurar en el Formulario de Reportes

```vue
<script setup>
import { ReportMenuConfig } from '@/modules/DynamicReports/Report'

const report = ref({
  name: 'Mi Reporte',
  menu_config: {
    show_in_menu: true,
    menu_title: 'Mi Reporte',
    menu_icon: 'tabler-chart-bar',
    menu_category: 'Ventas',
    menu_order: 1,
    menu_permissions: {
      action: 'read',
      subject: 'Report',
    },
  },
})
</script>

<template>
  <VForm @submit="saveReport">
    <!-- Otros campos del reporte -->

    <!-- Configuración de menú -->
    <ReportMenuConfig
      v-model="report.menu_config"
      :report-name="report.name"
    />

    <VBtn type="submit">
      Guardar Reporte
    </VBtn>
  </VForm>
</template>
```

## 🎨 Configuración de Menú

### Propiedades Disponibles

```typescript
interface MenuConfig {
  show_in_menu: boolean           // Mostrar en menú principal
  menu_title?: string            // Título personalizado
  menu_icon?: string             // Icono (Tabler icons)
  menu_category?: string         // Categoría para agrupar
  menu_order?: number            // Orden dentro de la categoría
  menu_permissions?: {           // Permisos CASL
    action: string
    subject: string
  }
  menu_badge?: {                 // Badge opcional
    content: string
    class: string
  }
}
```

### Ejemplos de Configuración

#### Reporte Simple
```typescript
{
  show_in_menu: true,
  menu_title: 'Ventas Mensuales',
  menu_icon: 'tabler-chart-bar',
  menu_category: 'Ventas',
  menu_permissions: {
    action: 'read',
    subject: 'Report'
  }
}
```

#### Reporte con Badge
```typescript
{
  show_in_menu: true,
  menu_title: 'Alertas',
  menu_icon: 'tabler-alert-circle',
  menu_category: 'Sistema',
  menu_badge: {
    content: '5',
    class: 'bg-error'
  },
  menu_permissions: {
    action: 'read',
    subject: 'Alert'
  }
}
```

## 🔐 Integración con CASL

### Permisos Predefinidos

```typescript
// Lectura básica
{ action: 'read', subject: 'Report' }

// Gestión completa
{ action: 'manage', subject: 'Report' }

// Analytics específico
{ action: 'read', subject: 'Analytics' }

// Dashboard
{ action: 'read', subject: 'Dashboard' }
```

### Verificación de Permisos

El sistema automáticamente verifica los permisos usando CASL:

```typescript
// En el servicio
const menuReports = reports.filter(report => 
  report.menu_config?.show_in_menu && 
  can(report.menu_config?.menu_permissions?.action, 
      report.menu_config?.menu_permissions?.subject)
)
```

## 📱 Categorías y Agrupación

### Categorías Predefinidas

- **Reportes** - Categoría por defecto
- **Ventas** - Reportes de ventas
- **Finanzas** - Reportes financieros
- **Usuarios** - Reportes de usuarios
- **Analytics** - Reportes analíticos
- **Operaciones** - Reportes operativos
- **Marketing** - Reportes de marketing
- **Recursos Humanos** - Reportes de RRHH

### Comportamiento de Agrupación

- **1 reporte en categoría**: Se muestra directamente
- **Múltiples reportes**: Se agrupan bajo la categoría

## 🎨 Iconos Disponibles

### Gráficos
- `tabler-chart-bar` - Gráfico de barras
- `tabler-chart-pie` - Gráfico circular
- `tabler-chart-line` - Gráfico de líneas
- `tabler-chart-donut` - Gráfico de dona

### Datos
- `tabler-table` - Tabla
- `tabler-database` - Base de datos
- `tabler-file-text` - Documento

### Analytics
- `tabler-analytics` - Analytics
- `tabler-trending-up` - Tendencia ascendente
- `tabler-trending-down` - Tendencia descendente

### Negocio
- `tabler-users` - Usuarios
- `tabler-building` - Empresa
- `tabler-shopping-cart` - Ventas
- `tabler-coin` - Finanzas
- `tabler-calendar` - Calendario

## 🔄 Actualización Automática

### Eventos que Disparan Actualización

1. **Creación de reporte** con `show_in_menu: true`
2. **Actualización de configuración** de menú
3. **Cambio de permisos** del usuario
4. **Eliminación de reporte** del menú

### Métodos del Plugin

```typescript
// Registrar reporte en menú
await dynamicMenuPlugin.registerReport(reportId)

// Desregistrar reporte del menú
await dynamicMenuPlugin.unregisterReport(reportId)

// Actualizar menús manualmente
await dynamicMenuPlugin.refreshMenus()

// Verificar si reporte está visible
const isVisible = dynamicMenuPlugin.isReportVisibleInMenu(reportId)
```

## 🎯 Casos de Uso

### 1. Reporte Público
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

### 2. Reporte con Permisos Específicos
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

### 3. Reporte con Badge de Notificaciones
```typescript
{
  show_in_menu: true,
  menu_title: 'Alertas del Sistema',
  menu_icon: 'tabler-alert-circle',
  menu_category: 'Sistema',
  menu_badge: {
    content: '3',
    class: 'bg-warning'
  },
  menu_permissions: {
    action: 'read',
    subject: 'System'
  }
}
```

## 🚨 Troubleshooting

### El reporte no aparece en el menú

1. **Verificar configuración**:
   ```typescript
   console.log(report.menu_config?.show_in_menu) // Debe ser true
   ```

2. **Verificar permisos**:
   ```typescript
   console.log(can('read', 'Report')) // Debe ser true
   ```

3. **Verificar inicialización**:
   ```typescript
   await dynamicMenuPlugin.initialize()
   ```

### Los menús no se actualizan

1. **Forzar actualización**:
   ```typescript
   await dynamicMenuPlugin.refreshMenus()
   ```

2. **Verificar watchers**:
   ```typescript
   // Los watchers se configuran automáticamente
   // Verificar que el store esté actualizado
   ```

## 🔧 Personalización Avanzada

### Agregar Nuevas Categorías

```typescript
// En ReportMenuConfig.vue
const availableCategories = [
  'Reportes',
  'Ventas',
  'Finanzas',
  'Usuarios',
  'Analytics',
  'Operaciones',
  'Marketing',
  'Recursos Humanos',
  'Tu Nueva Categoría' // Agregar aquí
]
```

### Agregar Nuevos Iconos

```typescript
// En ReportMenuConfig.vue
const availableIcons = [
  // ... iconos existentes
  { value: 'tu-icono-personalizado', label: 'Tu Icono' }
]
```

### Personalizar Permisos

```typescript
// En tu configuración de CASL
const availablePermissions = [
  // ... permisos existentes
  { action: 'tu-accion', subject: 'tu-sujeto', label: 'Tu Permiso' }
]
```

## 📊 Monitoreo y Logs

El sistema incluye logs detallados:

```typescript
// Logs de éxito
✅ Plugin de menús dinámicos inicializado
✅ Reporte abc123 registrado en menú
✅ Menús dinámicos actualizados

// Logs de error
❌ Error inicializando plugin de menús dinámicos: [error]
❌ Error registrando reporte abc123 en menú: [error]
```

## 🎯 Mejores Prácticas

1. **Nombres descriptivos**: Usar títulos claros y concisos
2. **Iconos apropiados**: Elegir iconos que representen el contenido
3. **Categorías lógicas**: Agrupar reportes relacionados
4. **Permisos granulares**: Usar permisos específicos, no genéricos
5. **Badges informativos**: Usar badges solo cuando aporten valor
6. **Orden coherente**: Mantener un orden lógico en las categorías

## 🔮 Roadmap

### Próximas Funcionalidades

- [ ] **Menús anidados** - Subcategorías
- [ ] **Badges dinámicos** - Contenido desde API
- [ ] **Favoritos** - Reportes favoritos del usuario
- [ ] **Búsqueda** - Búsqueda en menús dinámicos
- [ ] **Templates** - Plantillas de configuración
- [ ] **Analytics** - Métricas de uso de reportes 
