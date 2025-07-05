# 🏗️ DDD Module Generator para Vue 3 + TypeScript

## ¿Qué es esto?
Este proyecto incluye un generador de módulos siguiendo Domain-Driven Design (DDD) y Clean Architecture para Vue 3 + TypeScript. Permite crear módulos completos (dominio, aplicación, infraestructura, presentación) de forma automática y consistente.

---

## 🚀 ¿Cómo generar un nuevo módulo DDD?

1. **Abre la terminal en la raíz del proyecto**  
   (debe estar en la carpeta `frontend`).

2. **Ejecuta el generador interactivo:**
   ```bash
   npm run generate:module
   ```
   o
   ```bash
   node scripts/generateModule.mjs
   ```

3. **Sigue las instrucciones:**
   - Elige la opción `🚀 Generar nuevo módulo DDD`
   - Escribe el nombre del módulo (ejemplo: `User`, `Product`, `Order`)
   - El generador creará toda la estructura y archivos necesarios en `src/modules/<nombre>`

4. **¡Listo!**
   - El módulo estará listo para usar y extender.
   - Puedes personalizar los stubs en la carpeta `stubs/ddd/` para cambiar la plantilla base de los archivos generados.

---

## 🛠️ Opciones avanzadas

- **Regenerar módulo existente:**  
  Elimina y vuelve a crear el módulo (útil si actualizaste los stubs).
- **Eliminar módulo:**  
  Borra completamente el módulo seleccionado.

### 📋 Comandos npm disponibles

```bash
# Generar nuevo módulo (interactivo)
npm run generate:module

# Probar el generador (crea y elimina un módulo de prueba)
npm run generate:module:test

# Listar módulos existentes
npm run generate:module:list
```

---

## 📦 Estructura generada

```
src/modules/<modulo>/
├── domain/
├── application/
├── infrastructure/
├── presentation/
├── shared/
├── tests/
├── container.ts
├── types.ts
├── index.ts
├── module.config.ts
├── menu.ts
└── README.md
```

---

## 📝 Personalización

- Modifica los archivos en `stubs/ddd/` para cambiar la plantilla de los archivos generados.
- Puedes agregar nuevos stubs para nuevas capas o tipos de archivo.

---

## ❓ ¿Dudas?

Si tienes preguntas, revisa los comentarios en los scripts o contacta al responsable del proyecto.

# vue

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=johnsoncodehk.volar) (and disable Vetur).

## Type Support for `.vue` Imports in TS

Since TypeScript cannot handle type information for `.vue` imports, they are shimmed to be a generic Vue component type by default. In most cases this is fine if you don't really care about component prop types outside of templates.

However, if you wish to get actual prop types in `.vue` imports (for example to get props validation when using manual `h(...)` calls), you can run `Volar: Switch TS Plugin on/off` from VS Code command palette.

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```
