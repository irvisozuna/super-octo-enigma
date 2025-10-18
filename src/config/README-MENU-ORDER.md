# Configuración del Orden de Menús

Este sistema permite controlar el orden en que aparecen los menús de los módulos en la navegación de la aplicación.

## Archivo de Configuración

El archivo [`menu-order.config.ts`](./menu-order.config.ts) define el orden de los menús.

## Características

### 1. **Orden Personalizado**
Define exactamente en qué orden quieres que aparezcan los menús:

```typescript
export const menuOrderConfig: MenuOrderConfig[] = [
  {
    module: 'ClientModule',
    order: 10,
    enabled: true,
  },
  {
    module: 'EmployeeModule',
    order: 20,
    enabled: true,
  },
]
```

### 2. **Habilitar/Deshabilitar Menús**
Puedes ocultar un menú sin eliminar el módulo:

```typescript
{
  module: 'SomeModule',
  order: 30,
  enabled: false, // Este menú no aparecerá
}
```

### 3. **Agrupación por Secciones**
Organiza los menús en secciones con separadores visuales:

```typescript
// Configuración de menús
{
  module: 'ClientModule',
  order: 10,
  section: 'main',
},
{
  module: 'TransportModule',
  order: 40,
  section: 'operations',
}

// Configuración de secciones
export const menuSections: MenuSectionConfig[] = [
  {
    id: 'main',
    order: 1,
  },
  {
    id: 'operations',
    title: 'Operaciones', // Título del separador
    order: 2,
  },
]
```

### 4. **Módulos No Configurados**
Los módulos que no están en la configuración se agregan automáticamente al final en orden alfabético.

## Cómo Usar

### Cambiar el Orden de un Menú

1. Abre [`menu-order.config.ts`](./menu-order.config.ts)
2. Cambia el valor de `order` del módulo
3. Los números no necesitan ser consecutivos (puedes usar 10, 20, 30... para dejar espacio)

```typescript
{
  module: 'ClientModule',
  order: 5, // Ahora aparecerá primero
}
```

### Agregar un Nuevo Módulo al Orden

```typescript
{
  module: 'NewModule',
  order: 25, // Se insertará entre order 20 y 30
  enabled: true,
  section: 'main',
}
```

### Ocultar un Menú Temporalmente

```typescript
{
  module: 'MaintenanceModule',
  order: 50,
  enabled: false, // Oculto temporalmente
}
```

### Crear una Nueva Sección

```typescript
// 1. Agrega la sección
export const menuSections: MenuSectionConfig[] = [
  // ... secciones existentes
  {
    id: 'reports',
    title: 'Reportes',
    order: 4,
  },
]

// 2. Asigna módulos a la sección
{
  module: 'DynamicReports',
  order: 60,
  section: 'reports', // Usar el ID de la sección
}
```

## Ventajas de Este Sistema

✅ **Centralizado**: Un solo lugar para definir el orden
✅ **Modular**: Cada módulo sigue definiendo su propio menú
✅ **Escalable**: Fácil agregar nuevos módulos
✅ **Flexible**: Puedes ocultar, ordenar y agrupar menús
✅ **Mantenible**: Cambios en un solo archivo
✅ **Auto-discovery**: Los módulos nuevos se agregan automáticamente

## Ejemplo Completo

```typescript
export const menuOrderConfig: MenuOrderConfig[] = [
  // Grupo Principal (sin título)
  { module: 'dashboard', order: 5, section: 'main' },
  { module: 'ClientModule', order: 10, section: 'main' },
  { module: 'EmployeeModule', order: 20, section: 'main' },

  // Grupo de Operaciones (con separador)
  { module: 'TransportModule', order: 30, section: 'operations' },
  { module: 'paymentmandate', order: 40, section: 'operations' },

  // Grupo de Reportes (con separador)
  { module: 'DynamicReports', order: 50, section: 'reports' },

  // Grupo de Administración (con separador)
  { module: 'template', order: 60, section: 'admin' },
  { module: 'user', order: 70, section: 'admin' },
  { module: 'support', order: 80, section: 'admin', enabled: false }, // Oculto
]

export const menuSections: MenuSectionConfig[] = [
  { id: 'main', order: 1 }, // Sin título = sin separador
  { id: 'operations', title: 'Operaciones', order: 2 },
  { id: 'reports', title: 'Reportes', order: 3 },
  { id: 'admin', title: 'Administración', order: 4 },
]
```

## Notas Importantes

- Los módulos mantienen su independencia - pueden definir múltiples items de menú
- El sistema es retrocompatible - si no configuras un módulo, seguirá funcionando
- Los números de orden pueden tener gaps (10, 20, 30) para facilitar inserciones futuras
- Las secciones sin título no muestran separador visual
