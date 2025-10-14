# 🐛 Guía de Debugging - Errores Comunes y Soluciones

## Error: `'0' is not a valid attribute name`

### 🔍 Causa
Este error ocurre cuando Vue intenta usar un índice de array como nombre de atributo HTML, generalmente por hacer spread de un array en lugar de un objeto.

### ✅ Soluciones Comunes

#### 1. **Formato incorrecto de iconos en menús**

**❌ INCORRECTO:**
```typescript
const menu = [{
  title: 'Mi Menú',
  icon: 'tabler-home',  // ❌ String directo
  children: [...]
}]
```

**✅ CORRECTO:**
```typescript
const menu = [{
  title: 'Mi Menú',
  icon: { icon: 'tabler-home' },  // ✅ Objeto con propiedad icon
  action: 'read',  // Requerido para CASL
  subject: 'resource-name',  // Requerido para CASL
  children: [...]
}]
```

#### 2. **Spread de array en v-bind**

**❌ INCORRECTO:**
```vue
<template>
  <MyComponent v-bind="[prop1, prop2]" />  <!-- ❌ Array -->
</template>
```

**✅ CORRECTO:**
```vue
<template>
  <MyComponent v-bind="{ prop1, prop2 }" />  <!-- ✅ Objeto -->
  <!-- O mejor aún: -->
  <MyComponent :prop1="prop1" :prop2="prop2" />
</template>
```

#### 3. **Composables fuera de setup**

**❌ INCORRECTO:**
```typescript
export class MyInstaller {
  private router: any
  
  constructor() {
    this.router = useRouter()  // ❌ No se puede llamar aquí
  }
}
```

**✅ CORRECTO:**
```typescript
export class MyInstaller {
  private router: Router | null
  
  constructor(router?: Router) {
    this.router = router || null  // ✅ Recibir como parámetro
  }
}

// Al usar:
const router = app.config.globalProperties.$router
const installer = new MyInstaller(router)
```

---

## 🔧 Estrategia de Debugging Paso a Paso

### 1. Desactivar módulos selectivamente

```bash
# Desactivar temporalmente un módulo
mv src/plugins/employee src/plugins/employee.disabled

# Recargar navegador y ver si el error desaparece
# Si desaparece, el problema está en ese módulo

# Reactivar
mv src/plugins/employee.disabled src/plugins/employee
```

### 2. Usar el validador de menús

Todos los menús de módulos deben usar `createValidatedMenu`:

```typescript
import { createValidatedMenu } from '@/utils/menuValidator'

const myMenu: VerticalNavItems = [...]

export default createValidatedMenu(myMenu, 'MyModuleName')
```

En desarrollo, esto validará automáticamente:
- ✅ Formato correcto de iconos
- ✅ Propiedades requeridas (action, subject)
- ✅ Estructura de children
- ✅ Tipos de datos correctos

### 3. Revisar la consola con detalle

Los debug helpers mejorados mostrarán:
- 🔴 **Dónde** ocurrió el error (stack trace)
- 💡 **Por qué** ocurrió (causa común)
- ✅ **Cómo** solucionarlo (ejemplo de código)

### 4. Validar tipos con TypeScript

```typescript
// Usar tipos importados, no crear propios
import type { VerticalNavItems } from '@layouts/types'

// NO crear interfaces propias para menús
// ❌ interface MenuItem { ... }

// Usar el tipo correcto ✅
const menu: VerticalNavItems = [...]
```

---

## 📋 Checklist para Nuevos Módulos

Al crear un módulo nuevo, verificar:

- [ ] **Menu**:
  - [ ] Iconos como objeto: `icon: { icon: 'name' }`
  - [ ] Propiedades CASL: `action` y `subject`
  - [ ] Tipo: `VerticalNavItems`
  - [ ] Validado con `createValidatedMenu()`

- [ ] **Installer**:
  - [ ] NO llamar `useRouter()` o `useI18n()` en constructor
  - [ ] Recibir dependencias como parámetros
  - [ ] Tipos correctos: `Router`, `I18n`

- [ ] **Routes**:
  - [ ] Usar nombres, no paths: `to: 'route-name'` no `to: '/path'`
  - [ ] Meta completo: `requiresAuth`, etc.

- [ ] **Components**:
  - [ ] Imports de composables al inicio
  - [ ] `useRouter()` solo dentro de setup
  - [ ] Props con tipos correctos

---

## 🚀 Herramientas de Debug Disponibles

### 1. Menu Validator
```typescript
import { validateMenu, validateMenuItem } from '@/utils/menuValidator'

// Validar un menú completo
validateMenu(myMenu, 'ModuleName')

// Validar un item individual
const errors = validateMenuItem(item, 'path.to.item')
```

### 2. Vue Debug Helper
```typescript
import { validateComponentProps } from '@/utils/vueDebugHelper'

// En tu componente
validateComponentProps('MyComponent', props)
```

### 3. DevTools
- **Vue DevTools**: Ver estado de componentes
- **Vite Inspector**: Click para ir al código fuente
- **Console logs**: Con contexto mejorado en desarrollo

---

## 🎯 Ejemplos de Errores Reales

### Caso 1: Error en EmployeeModule

**Error original:**
```
InvalidCharacterError: Failed to execute 'setAttribute' on 'Element': '0' is not a valid attribute name
```

**Causa:**
```typescript
// ❌ menu.ts
icon: 'tabler-users'  // String en lugar de objeto
```

**Solución:**
```typescript
// ✅ menu.ts
icon: { icon: 'tabler-users' }
action: 'read',
subject: 'employees'
```

### Caso 2: Composable fuera de setup

**Error:**
```
inject() can only be used inside setup() or functional components
```

**Causa:**
```typescript
class Installer {
  constructor() {
    this.router = useRouter()  // ❌
  }
}
```

**Solución:**
```typescript
class Installer {
  constructor(router?: Router) {
    this.router = router || null  // ✅
  }
}
```

---

## 📚 Referencias

- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [TypeScript with Vue](https://vuejs.org/guide/typescript/overview.html)
- [Proyecto: Layout Types](@layouts/types)
- [Proyecto: Menu Validator](./src/utils/menuValidator.ts)

---

## 💡 Tips Generales

1. **Siempre** usa TypeScript para detectar errores en tiempo de desarrollo
2. **Valida** los menús con `createValidatedMenu()` en desarrollo
3. **Revisa** la consola completa, no solo la primera línea del error
4. **Desactiva** módulos selectivamente para aislar problemas
5. **Usa** los tipos correctos importados de `@layouts/types`
6. **NO** uses composables fuera de `setup()` o funciones de composición
7. **Documenta** errores nuevos que encuentres en esta guía

