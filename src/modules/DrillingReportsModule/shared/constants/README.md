# 📋 Constantes del Módulo de Reportes de Perforación

Este directorio contiene todas las constantes centralizadas del módulo de reportes de perforación, organizadas por funcionalidad para evitar duplicación y facilitar el mantenimiento.

## 🗂️ Estructura de Archivos

### 📁 Archivos de Constantes

- **`ProjectConstants.ts`** - Constantes relacionadas con proyectos
- **`ToolConstants.ts`** - Constantes relacionadas con herramientas
- **`EquipmentConstants.ts`** - Constantes relacionadas con equipos
- **`ConsumableConstants.ts`** - Constantes relacionadas con consumibles
- **`ReportWizardConstants.ts`** - Constantes específicas del wizard de reportes
- **`index.ts`** - Archivo índice que exporta todas las constantes

## 🔄 Reutilización de Constantes

### ✅ **Constantes Reutilizadas:**

#### **1. Tipos de Actividad (`ACTIVITY_TYPES`)**
- **Definido en:** `ProjectConstants.ts`
- **Reutilizado en:** `ReportWizardConstants.ts`
- **Uso:** Tipos de actividades para reportes y proyectos

#### **2. Opciones de Turno (`SHIFT_OPTIONS`)**
- **Definido en:** `ProjectConstants.ts`
- **Reutilizado en:** `ReportWizardConstants.ts`
- **Uso:** Turnos de trabajo (día, noche, mixto)

#### **3. Categorías de Herramientas (`TOOL_WIZARD_CATEGORIES`)**
- **Definido en:** `ToolConstants.ts`
- **Reutilizado en:** `ReportWizardConstants.ts`
- **Uso:** Categorías de herramientas para el wizard

#### **4. Tipos de Consumibles (`CONSUMABLE_TYPES`)**
- **Definido en:** `ConsumableConstants.ts`
- **Reutilizado en:** `ReportWizardConstants.ts`
- **Uso:** Tipos de consumibles para reportes

#### **5. Unidades de Medida (`CONSUMABLE_UNITS`)**
- **Definido en:** `ConsumableConstants.ts`
- **Reutilizado en:** `ReportWizardConstants.ts`
- **Uso:** Unidades para consumibles

## 📊 **Beneficios de la Centralización:**

### ✅ **Ventajas:**
- **Sin duplicación** de código
- **Mantenimiento centralizado** de opciones
- **Consistencia** en toda la aplicación
- **Reutilización** fácil entre componentes
- **Traducciones centralizadas** con `translationKey`

### 🔧 **Uso en Componentes:**

```typescript
// Importar desde el índice centralizado
import {
  ACTIVITY_TYPES,
  SHIFT_OPTIONS,
  CONSUMABLE_TYPES,
  TOOL_CATEGORY_OPTIONS,
} from '../../shared/constants'

// Usar directamente en el componente
const activityOptions = ACTIVITY_TYPES
const shiftOptions = SHIFT_OPTIONS
```

## 🌐 **Soporte para Internacionalización:**

Todas las constantes incluyen `translationKey` para soporte completo de i18n:

```typescript
{
  title: 'Perforación de núcleo',
  value: 'drilling_core',
  translationKey: 'DrillingReportsModule.activities.drilling_core'
}
```

## 🔄 **Flujo de Reutilización:**

1. **Definir** constantes en el archivo específico (ej: `ProjectConstants.ts`)
2. **Exportar** desde el archivo específico
3. **Reutilizar** en otros archivos de constantes
4. **Centralizar** todas las exportaciones en `index.ts`
5. **Importar** desde `index.ts` en los componentes

## 📝 **Convenciones:**

- **Nombres en UPPER_SNAKE_CASE** para constantes
- **Estructura consistente** con `title`, `value`, `icon`, `color`
- **Traducciones** con `translationKey`
- **Categorización** con `category` para filtros
- **Descripciones** con `description` para tooltips

## 🚀 **Próximos Pasos:**

- [ ] Agregar más constantes reutilizables
- [ ] Implementar validaciones centralizadas
- [ ] Crear composables para constantes dinámicas
- [ ] Agregar constantes para permisos y roles
- [ ] Implementar cache de constantes para mejor rendimiento
