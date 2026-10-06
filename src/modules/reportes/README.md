# Módulo `reportes`

Interfaz del módulo de reportes de Atención (backend: `App\Modules\Reporting`, rutas `/api/reporting/*`).

- **Fuentes de datos y filtros** los define Xelesta como archivos en el backend (`database/reporting/`).
- **Reportes y tableros** los arma el equipo de sistemas de OOMSAPAS desde la pantalla de administración, sin SQL.
- **Usuarios finales** consultan y exportan lo que su rol permite; el menú llega ya filtrado del servidor.

## Estructura

| Carpeta | Qué hay |
|---|---|
| `routes.ts`, `menu.ts` | Rutas y entrada de menú (se registran por glob) |
| `locales/es.json` | Textos (namespace `reportes.*`); no hay texto suelto en plantillas |
| `types/` | Tipos del contrato con el API (claves `snake_case`, tal como viajan) |
| `services/reportesApi.ts` | Una función por endpoint; todas aceptan `AbortSignal` |
| `services/errores.ts` | Normaliza cualquier error a `{ codigo, mensaje, detalle?, reintentable }` |
| `utils/formato.ts` | Formato es-MX (moneda, números, fechas, tiempo relativo) con `Intl` |
| `components/comunes/` | Estados vacío y de error reutilizables |
| `views/` | Pantallas (índice, visor, cola de exportaciones, tableros, administración) |
| `mocks/` | Datos de ejemplo (MSW) para trabajar sin backend: `VITE_REPORTES_MOCK=true` |
| `tests/` | Pruebas con vitest (`pnpm test:unit src/modules/reportes`) |

## Permisos

En el servidor son por objeto (`read report:<key>`); en el navegador llegan colapsados a sujetos gruesos:
`reportes`, `tableros`, `documentos`, `reportes-admin`, `reportes-fuentes`. Los botones se muestran con `$can`
y con los `permisos` que trae cada reporte; la granularidad la aplica el servidor (menú filtrado y 403).

## Reglas del módulo

- `no-console`, `no-explicit-any` y `vue/no-bare-strings-in-template` están en error solo aquí (`.eslintrc.cjs`).
- Nada de `localStorage` para estado de negocio; la cola de exportaciones se rehidrata del servidor.
- Importar explícitamente de `vue`, `vue-i18n` y `pinia` (vitest no tiene auto-imports).
