# Módulo de Contratos - Arquitectura de Menús y Permisos

Este documento describe el patrón de diseño utilizado para la gestión de menús, rutas y permisos en el módulo de Contratos, siguiendo una arquitectura DDD estricta y el principio de **Default Deny**.

## Patrón de Configuración

El módulo utiliza una estructura de configuración centralizada en `src/modules/contracts/config/`:

1.  **Permisos (`permissions.ts`)**: Define las llaves de acceso en formato `modulo:accion:recurso` (ej. `contracts:view:list`).
2.  **Menú (`menu.ts`)**: Define la estructura de navegación. Cada ítem DEBE incluir las propiedades `action` y `subject` para el gating automático de CASL.
3.  **Rutas (`routes.ts`)**: Define las rutas de Vue Router. Las rutas protegidas incluyen metadatos de CASL en el objeto `meta`.

## Evaluación de Permisos (CASL)

La aplicación utiliza **CASL** para la evaluación de permisos en tiempo de ejecución:

- **Gating de Menú**: El componente `VerticalNavLink.vue` utiliza la función `can(action, subject)` para decidir si renderiza un ítem.
- **Gating de Rutas**: El guard global `src/plugins/1.router/guards.ts` utiliza `canNavigate(to)` para bloquear el acceso directo por URL si el usuario carece de las habilidades necesarias.

## Multitenancy (Tenant Context)

La visibilidad de los módulos y sus acciones está ligada al contexto del tenant (empresa):

- Durante el login, el backend retorna únicamente las `userAbilityRules` válidas para el tenant actual y el rol del usuario.
- Si un tenant no tiene contratado el módulo de Contratos, el backend no enviará las reglas `read/Contract`, lo que ocultará automáticamente el menú y bloqueará las rutas (Default Deny).

## Uso en Componentes

Para verificar permisos dentro de los componentes:

```typescript
import { useAbility } from '@/plugins/casl/composables/useAbility'

const { can } = useAbility()

// Verificar si puede crear contratos
const canCreate = can('create', 'Contract')
```
