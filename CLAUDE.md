# Atención · frontend

Vue 3.5, Vuetify 3.7, TypeScript, Vite. Rama de este cliente: `oomsapas` (el `main` es la plantilla genérica).
La guía completa de trabajo está en la skill `atencion-oomsapas`; esto es lo mínimo.

## Reglas

- Interfaz en español. Siempre "Aquasoft Comercial", nunca el nombre del producto de fondo.
- Código nuevo sobre el Aquasoft Design System: `src/components/as/*`, `@/utils/formato`, `@/utils/estados`,
  `useNotificacion`, `useDialogo`. No usar el gestor de diálogos viejo (`useAppManager.openDialog`).
- En fichas: una fila por dato (icono, etiqueta gris, valor oscuro), identidad siempre visible, cifras clave en
  franja compacta. Tablas anchas en diálogos a todo el ancho. Comparar contra la captura `base` antes de reportar.
- Una sola instancia de habilidades CASL (`@/plugins/casl/ability`); los menús se arman con ella.
- No se hace push ni despliegue sin que Irvis lo pida. Linear antes de codificar.

## Comandos

```
node_modules/.bin/vite --port 5173 --strictPort --host localhost
npx pnpm@9 exec eslint -c .eslintrc.cjs --rulesdir eslint-internal-rules/ --fix <archivos>
npx stylelint --fix <archivos>
npx vue-tsc --noEmit -p tsconfig.json     # ignorar TS2688 (vite/client)
npx vitest run                            # fallan 5 archivos de plantilla y 1 prueba de useAppManager: previo
```

Capturas y accesibilidad con Playwright: `tests/visual/{capturas,comparar,accesibilidad}.mjs`.

## Dónde está cada cosa

- `src/modules/<módulo>/{views,components,composables,services,stores,locales,routes.ts,menu.ts}`:
  `reportes`, `monitoreo`, `support`, `user`…
- El menú de Reportes solo lleva entradas generales; cada reporte se elige en "Todos los reportes".
- Producción se construye con `VITE_API_BASE_URL=https://api-aquasoft.oomsapaslc.gob.mx/api` y
  `VITE_API_ORGANIZATION=oomsapas` (lo hace `~/Project/xelesta/oomsapas/ops/frontend`).
